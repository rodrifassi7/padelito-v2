-- ════════════════════════════════════════════════════════════════════════════
-- Padelito v2 — modo partido
--
-- Un partido se juega en el celular (queda guardado ahí mientras dura) y se
-- sube entero al terminar con guardar_partido(), en una sola transacción.
-- Mismo patrón multi-profe que el resto: profe_id + FKs compuestas + RLS.
-- ════════════════════════════════════════════════════════════════════════════

create type formato_partido as enum ('un_set', 'mejor_de_3', 'mejor_de_3_super');
create type tipo_punto as enum ('winner', 'error_no_forzado', 'error_forzado');

create table public.partidos (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid() references public.profes on delete cascade,
  fecha date not null,
  formato formato_partido not null,
  punto_de_oro boolean not null default true,
  sets jsonb not null default '[]',             -- [[6,4],[3,6],[10,8]] desde la pareja 1
  ganador smallint check (ganador in (1, 2)),   -- null = quedó sin terminar
  duracion_min integer check (duracion_min is null or duracion_min >= 0),
  notas text,
  created_at timestamptz not null default now(),
  unique (id, profe_id)
);

create index partidos_profe_fecha_idx on public.partidos (profe_id, fecha desc);

-- Posición: 1 y 2 = pareja 1 (drive, revés); 3 y 4 = pareja 2 (drive, revés).
-- alumno_id es null para jugadores que no son alumnos (se guarda solo el nombre).
create table public.partido_jugadores (
  partido_id uuid not null,
  posicion smallint not null check (posicion between 1 and 4),
  profe_id uuid not null default auth.uid(),
  alumno_id uuid,
  nombre text not null check (length(trim(nombre)) > 0),
  primary key (partido_id, posicion),
  foreign key (partido_id, profe_id) references public.partidos (id, profe_id) on delete cascade,
  foreign key (alumno_id, profe_id) references public.alumnos (id, profe_id) on delete set null (alumno_id)
);

create index partido_jugadores_alumno_idx on public.partido_jugadores (alumno_id);

-- Cada punto, en orden. jugador null = punto sin dato (solo suma al marcador).
create table public.partido_puntos (
  partido_id uuid not null,
  orden integer not null check (orden >= 1),
  profe_id uuid not null default auth.uid(),
  pareja_gana smallint not null check (pareja_gana in (1, 2)),
  jugador smallint check (jugador between 1 and 4),
  tipo tipo_punto,
  golpe text,
  set_numero smallint not null check (set_numero between 1 and 3),
  primary key (partido_id, orden),
  foreign key (partido_id, profe_id) references public.partidos (id, profe_id) on delete cascade,
  check ((jugador is null) = (tipo is null)),
  -- Un winner da el punto a la pareja del jugador; un error, a la otra.
  check (
    jugador is null
    or (tipo = 'winner' and pareja_gana = case when jugador <= 2 then 1 else 2 end)
    or (tipo <> 'winner' and pareja_gana = case when jugador <= 2 then 2 else 1 end)
  )
);

alter table public.partidos enable row level security;
alter table public.partido_jugadores enable row level security;
alter table public.partido_puntos enable row level security;

create policy "profe: sus datos" on public.partidos for all to authenticated
  using (profe_id = (select auth.uid())) with check (profe_id = (select auth.uid()));
create policy "profe: sus datos" on public.partido_jugadores for all to authenticated
  using (profe_id = (select auth.uid())) with check (profe_id = (select auth.uid()));
create policy "profe: sus datos" on public.partido_puntos for all to authenticated
  using (profe_id = (select auth.uid())) with check (profe_id = (select auth.uid()));

-- Puntos de cada alumno en todos sus partidos (para la ficha). Respeta RLS.
create view public.puntos_de_alumnos
with (security_invoker = true) as
select
  pj.alumno_id,
  p.id as partido_id,
  p.fecha,
  pp.tipo,
  pp.golpe
from public.partido_puntos pp
join public.partido_jugadores pj on pj.partido_id = pp.partido_id and pj.posicion = pp.jugador
join public.partidos p on p.id = pp.partido_id
where pj.alumno_id is not null;

-- Guarda un partido completo en una transacción. Recibe:
-- { id, fecha, formato, punto_de_oro, sets, ganador, duracion_min, notas,
--   jugadores: [{ posicion, alumno_id, nombre }],
--   puntos: [{ orden, pareja_gana, jugador, tipo, golpe, set_numero }] }
-- Si el partido ya existe (reintento), lo reemplaza.
create or replace function public.guardar_partido(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid := (p->>'id')::uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  delete from partidos where id = v_id;

  insert into partidos (id, fecha, formato, punto_de_oro, sets, ganador, duracion_min, notas)
  values (
    v_id,
    (p->>'fecha')::date,
    (p->>'formato')::formato_partido,
    coalesce((p->>'punto_de_oro')::boolean, true),
    coalesce(p->'sets', '[]'),
    (p->>'ganador')::smallint,
    (p->>'duracion_min')::integer,
    nullif(trim(p->>'notas'), '')
  );

  insert into partido_jugadores (partido_id, posicion, alumno_id, nombre)
  select v_id, (j->>'posicion')::smallint, (j->>'alumno_id')::uuid, j->>'nombre'
  from jsonb_array_elements(p->'jugadores') j;

  insert into partido_puntos (partido_id, orden, pareja_gana, jugador, tipo, golpe, set_numero)
  select v_id, (x->>'orden')::integer, (x->>'pareja_gana')::smallint, (x->>'jugador')::smallint,
         (x->>'tipo')::tipo_punto, x->>'golpe', (x->>'set_numero')::smallint
  from jsonb_array_elements(coalesce(p->'puntos', '[]')) x;

  return v_id;
end;
$$;

grant execute on function public.guardar_partido(jsonb) to authenticated;
revoke execute on function public.guardar_partido(jsonb) from anon, public;
