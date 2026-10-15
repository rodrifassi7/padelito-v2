-- ════════════════════════════════════════════════════════════════════════════
-- Padelito v2 — esquema inicial
--
-- Multi-tenant por profe: cada tabla tiene profe_id (default auth.uid()) y las
-- referencias entre tablas usan claves compuestas (id, profe_id), así la base
-- misma impide mezclar datos de dos profes. RLS: cada profe ve solo lo suyo.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Tipos ──────────────────────────────────────────────────────────────────

create type nivel as enum ('iniciacion', 'principiante', 'intermedio', 'avanzado', 'competicion');
create type mano as enum ('derecha', 'zurda');
create type posicion as enum ('drive', 'reves', 'ambas');
create type modalidad_pago as enum ('mensual', 'por_clase');
create type estado_sesion as enum ('programada', 'realizada', 'cancelada');
create type estado_asistencia as enum ('pendiente', 'presente', 'ausente', 'aviso');
create type medio_pago as enum ('efectivo', 'transferencia', 'otro');
create type area as enum ('tecnica', 'tactica', 'fisica', 'mental');
create type tipo_nota as enum ('a_mejorar', 'avance', 'error');
create type estado_foco as enum ('pendiente', 'trabajando', 'logrado');

-- ─── Profes ─────────────────────────────────────────────────────────────────

create table public.profes (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  nombre text not null,
  telefono text,
  club text,
  created_at timestamptz not null default now()
);

-- Al registrarse un usuario se crea su perfil de profe.
create or replace function public.crear_profe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profes (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_profe();

-- ─── Alumnos ────────────────────────────────────────────────────────────────

create table public.alumnos (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid() references public.profes on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  telefono text,
  nivel nivel,
  categoria text,                 -- ej. "6ta", libre
  mano mano,
  posicion posicion,
  fecha_nacimiento date,
  objetivo text,                  -- lo que el alumno quiere lograr
  notas text,
  modalidad_pago modalidad_pago not null default 'mensual',
  tarifa numeric(12, 2) check (tarifa is null or tarifa >= 0),
  activo boolean not null default true,
  token_publico uuid not null default gen_random_uuid() unique,  -- link de solo lectura (fase 4)
  created_at timestamptz not null default now(),
  unique (id, profe_id)
);

create index alumnos_profe_idx on public.alumnos (profe_id, activo, nombre);

-- ─── Agenda ─────────────────────────────────────────────────────────────────

-- Clase fija: se repite todas las semanas (individual o grupal).
create table public.clases (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid() references public.profes on delete cascade,
  dia_semana smallint not null check (dia_semana between 1 and 7),   -- 1 = lunes … 7 = domingo
  hora time not null,
  duracion_min smallint not null default 60 check (duracion_min between 15 and 300),
  lugar text,
  desde date not null,
  hasta date,
  created_at timestamptz not null default now(),
  unique (id, profe_id),
  check (hasta is null or hasta >= desde)
);

create index clases_profe_idx on public.clases (profe_id, dia_semana);

create table public.clase_alumnos (
  clase_id uuid not null,
  alumno_id uuid not null,
  profe_id uuid not null default auth.uid(),
  desde date not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (clase_id, alumno_id),
  foreign key (clase_id, profe_id) references public.clases (id, profe_id) on delete cascade,
  foreign key (alumno_id, profe_id) references public.alumnos (id, profe_id) on delete cascade
);

create index clase_alumnos_alumno_idx on public.clase_alumnos (alumno_id);

-- Sesión: una clase concreta en una fecha. Sale de una clase fija o es suelta.
create table public.sesiones (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid(),
  clase_id uuid,
  fecha date not null,
  hora time not null,
  duracion_min smallint not null default 60 check (duracion_min between 15 and 300),
  lugar text,
  estado estado_sesion not null default 'programada',
  nota text,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, profe_id),
  unique (clase_id, fecha),
  foreign key (profe_id) references public.profes on delete cascade,
  foreign key (clase_id, profe_id) references public.clases (id, profe_id) on delete set null (clase_id)
);

create index sesiones_profe_fecha_idx on public.sesiones (profe_id, fecha, hora);

create table public.asistencias (
  sesion_id uuid not null,
  alumno_id uuid not null,
  profe_id uuid not null default auth.uid(),
  estado estado_asistencia not null default 'pendiente',
  primary key (sesion_id, alumno_id),
  foreign key (sesion_id, profe_id) references public.sesiones (id, profe_id) on delete cascade,
  foreign key (alumno_id, profe_id) references public.alumnos (id, profe_id) on delete cascade
);

create index asistencias_alumno_idx on public.asistencias (alumno_id);

-- ─── Pagos (fase 3) ─────────────────────────────────────────────────────────

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid(),
  alumno_id uuid not null,
  fecha date not null,
  monto numeric(12, 2) not null check (monto > 0),
  medio medio_pago not null default 'efectivo',
  periodo date check (periodo is null or extract(day from periodo) = 1),  -- mes que cubre (abono mensual)
  clases int check (clases is null or clases > 0),                        -- clases que cubre (pago por clase)
  nota text,
  created_at timestamptz not null default now(),
  foreign key (profe_id) references public.profes on delete cascade,
  foreign key (alumno_id, profe_id) references public.alumnos (id, profe_id) on delete cascade
);

create index pagos_alumno_idx on public.pagos (alumno_id, fecha desc);

-- ─── Seguimiento (fase 2) ───────────────────────────────────────────────────

-- Nota rápida después de una clase: qué mejoró, qué hay que corregir, errores.
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid(),
  alumno_id uuid not null,
  sesion_id uuid,
  fecha date not null,
  area area not null default 'tecnica',
  golpe text,
  tipo tipo_nota not null default 'a_mejorar',
  texto text not null check (length(trim(texto)) > 0),
  created_at timestamptz not null default now(),
  foreign key (profe_id) references public.profes on delete cascade,
  foreign key (alumno_id, profe_id) references public.alumnos (id, profe_id) on delete cascade,
  foreign key (sesion_id, profe_id) references public.sesiones (id, profe_id) on delete set null (sesion_id)
);

create index notas_alumno_idx on public.notas (alumno_id, fecha desc);

-- Foco de trabajo: lo que el alumno tiene que mejorar, hasta lograrlo.
create table public.focos (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid(),
  alumno_id uuid not null,
  area area not null default 'tecnica',
  golpe text,
  titulo text not null check (length(trim(titulo)) > 0),
  detalle text,
  estado estado_foco not null default 'pendiente',
  logrado_en date,
  created_at timestamptz not null default now(),
  foreign key (profe_id) references public.profes on delete cascade,
  foreign key (alumno_id, profe_id) references public.alumnos (id, profe_id) on delete cascade
);

create index focos_alumno_idx on public.focos (alumno_id, estado);

-- Evaluación periódica: puntaje 1 a 5 por habilidad, según el nivel del alumno.
create table public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  profe_id uuid not null default auth.uid(),
  alumno_id uuid not null,
  fecha date not null,
  comentario text,
  created_at timestamptz not null default now(),
  unique (id, profe_id),
  foreign key (profe_id) references public.profes on delete cascade,
  foreign key (alumno_id, profe_id) references public.alumnos (id, profe_id) on delete cascade
);

create index evaluaciones_alumno_idx on public.evaluaciones (alumno_id, fecha desc);

create table public.evaluacion_items (
  evaluacion_id uuid not null,
  habilidad text not null,        -- clave del catálogo de habilidades de la app
  profe_id uuid not null default auth.uid(),
  puntaje smallint not null check (puntaje between 1 and 5),
  primary key (evaluacion_id, habilidad),
  foreign key (evaluacion_id, profe_id) references public.evaluaciones (id, profe_id) on delete cascade
);

-- ─── Seguridad (RLS) ────────────────────────────────────────────────────────

alter table public.profes enable row level security;
alter table public.alumnos enable row level security;
alter table public.clases enable row level security;
alter table public.clase_alumnos enable row level security;
alter table public.sesiones enable row level security;
alter table public.asistencias enable row level security;
alter table public.pagos enable row level security;
alter table public.notas enable row level security;
alter table public.focos enable row level security;
alter table public.evaluaciones enable row level security;
alter table public.evaluacion_items enable row level security;

create policy "profe: su perfil" on public.profes
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array[
    'alumnos', 'clases', 'clase_alumnos', 'sesiones', 'asistencias',
    'pagos', 'notas', 'focos', 'evaluaciones', 'evaluacion_items'
  ] loop
    execute format(
      'create policy "profe: sus datos" on public.%I for all to authenticated
         using (profe_id = (select auth.uid())) with check (profe_id = (select auth.uid()))',
      t
    );
  end loop;
end;
$$;

-- ─── Generación de sesiones ─────────────────────────────────────────────────

-- Crea las sesiones de las clases fijas entre p_desde y p_hasta (si no existen)
-- y sincroniza sus alumnos. p_hoy es la fecha local del profe: los alumnos que
-- ya no están en la clase se sacan solo de sesiones de hoy en adelante.
create or replace function public.asegurar_sesiones(p_desde date, p_hasta date, p_hoy date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profe uuid := auth.uid();
  v_inicio timestamptz := clock_timestamp();
begin
  if v_profe is null then
    raise exception 'No autenticado';
  end if;
  if p_hasta < p_desde or p_hasta - p_desde > 62 then
    raise exception 'Rango de fechas inválido';
  end if;

  insert into sesiones (profe_id, clase_id, fecha, hora, duracion_min, lugar)
  select c.profe_id, c.id, d::date, c.hora, c.duracion_min, c.lugar
  from clases c
  cross join generate_series(p_desde, p_hasta, interval '1 day') d
  where c.profe_id = v_profe
    and extract(isodow from d) = c.dia_semana
    and d::date >= c.desde
    and (c.hasta is null or d::date <= c.hasta)
  on conflict (clase_id, fecha) do nothing;

  -- Sumar los alumnos de la clase a sus sesiones programadas (desde que entraron).
  -- Solo si el alumno entró a la clase después de que se creó la sesión, o la
  -- sesión se acaba de crear: así, si el profe sacó a alguien "solo de esta
  -- clase", no vuelve a aparecer.
  insert into asistencias (sesion_id, alumno_id, profe_id)
  select s.id, ca.alumno_id, s.profe_id
  from sesiones s
  join clase_alumnos ca on ca.clase_id = s.clase_id
  join alumnos a on a.id = ca.alumno_id and a.activo
  where s.profe_id = v_profe
    and s.fecha between p_desde and p_hasta
    and s.estado = 'programada'
    and s.fecha >= ca.desde
    and (ca.created_at > s.created_at or s.created_at >= v_inicio)
  on conflict (sesion_id, alumno_id) do nothing;

  -- Sacar de sesiones futuras a quien ya no está en la clase (si no se marcó nada).
  delete from asistencias a
  using sesiones s
  where a.sesion_id = s.id
    and s.profe_id = v_profe
    and s.clase_id is not null
    and s.fecha between greatest(p_desde, p_hoy) and p_hasta
    and s.estado = 'programada'
    and a.estado = 'pendiente'
    and not exists (
      select 1 from clase_alumnos ca
      join alumnos al on al.id = ca.alumno_id and al.activo
      where ca.clase_id = s.clase_id and ca.alumno_id = a.alumno_id
    );
end;
$$;

grant execute on function public.asegurar_sesiones(date, date, date) to authenticated;
revoke execute on function public.asegurar_sesiones(date, date, date) from anon, public;

-- Termina una clase fija: no se repite más desde p_desde y se borran sus
-- sesiones futuras que todavía no tienen nada marcado.
create or replace function public.terminar_clase(p_clase uuid, p_desde date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_desde date;
begin
  select desde into v_desde from clases where id = p_clase and profe_id = auth.uid();
  if not found then
    raise exception 'Clase no encontrada';
  end if;

  delete from sesiones s
  where s.clase_id = p_clase
    and s.profe_id = auth.uid()
    and s.fecha >= p_desde
    and s.estado = 'programada'
    and not exists (
      select 1 from asistencias a where a.sesion_id = s.id and a.estado <> 'pendiente'
    );

  if p_desde <= v_desde then
    -- Nunca llegó a empezar: se borra (las sesiones que queden pasan a sueltas).
    delete from clases where id = p_clase;
  else
    update clases set hasta = p_desde - 1 where id = p_clase;
  end if;
end;
$$;

grant execute on function public.terminar_clase(uuid, date) to authenticated;
revoke execute on function public.terminar_clase(uuid, date) from anon, public;
