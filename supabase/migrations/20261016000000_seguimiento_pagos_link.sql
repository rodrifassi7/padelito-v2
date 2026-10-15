-- ════════════════════════════════════════════════════════════════════════════
-- Padelito v2 — seguimiento, pagos y link del alumno
-- (las tablas notas, focos, evaluaciones y pagos ya existen desde el esquema inicial)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Evaluaciones ───────────────────────────────────────────────────────────

-- Guarda una evaluación con todos sus puntajes en una transacción.
-- { alumno_id, fecha, comentario, items: [{ habilidad, puntaje }] }
create or replace function public.guardar_evaluacion(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if jsonb_array_length(coalesce(p->'items', '[]')) = 0 then
    raise exception 'La evaluación no tiene puntajes';
  end if;

  insert into evaluaciones (alumno_id, fecha, comentario)
  values ((p->>'alumno_id')::uuid, (p->>'fecha')::date, nullif(trim(p->>'comentario'), ''))
  returning id into v_id;

  insert into evaluacion_items (evaluacion_id, habilidad, puntaje)
  select v_id, i->>'habilidad', (i->>'puntaje')::smallint
  from jsonb_array_elements(p->'items') i;

  return v_id;
end;
$$;

grant execute on function public.guardar_evaluacion(jsonb) to authenticated;
revoke execute on function public.guardar_evaluacion(jsonb) from anon, public;

-- ─── Pagos ──────────────────────────────────────────────────────────────────

-- Alias o CBU que el profe quiere mandar en los recordatorios de pago.
alter table public.profes add column alias_pago text;

-- Para los alumnos que pagan por clase: clases a las que vino vs. clases pagadas.
create view public.saldo_clases
with (security_invoker = true) as
select
  a.id as alumno_id,
  coalesce(v.presentes, 0)::int as presentes,
  coalesce(p.pagadas, 0)::int as pagadas
from public.alumnos a
left join (
  select asi.alumno_id, count(*) as presentes
  from public.asistencias asi
  join public.sesiones s on s.id = asi.sesion_id and s.estado <> 'cancelada'
  where asi.estado = 'presente'
  group by asi.alumno_id
) v on v.alumno_id = a.id
left join (
  select alumno_id, sum(clases) as pagadas
  from public.pagos
  where clases is not null
  group by alumno_id
) p on p.alumno_id = a.id;

create index pagos_periodo_idx on public.pagos (profe_id, periodo);

-- ─── Link del alumno ────────────────────────────────────────────────────────

-- Página pública de solo lectura. Se entra con el token del link (un uuid
-- imposible de adivinar). No expone notas privadas del profe, ni pagos, ni
-- teléfonos: solo objetivo, focos, evaluaciones y resumen de partidos.
create or replace function public.perfil_publico(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_alumno alumnos%rowtype;
  v_profe profes%rowtype;
begin
  select * into v_alumno from alumnos where token_publico = p_token and activo;
  if not found then
    return null;
  end if;
  select * into v_profe from profes where id = v_alumno.profe_id;

  return jsonb_build_object(
    'alumno', jsonb_build_object(
      'nombre', v_alumno.nombre,
      'nivel', v_alumno.nivel,
      'categoria', v_alumno.categoria,
      'objetivo', v_alumno.objetivo
    ),
    'profe', jsonb_build_object('nombre', v_profe.nombre, 'club', v_profe.club),
    'focos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'titulo', f.titulo, 'detalle', f.detalle, 'area', f.area, 'golpe', f.golpe,
        'estado', f.estado, 'logrado_en', f.logrado_en
      ) order by f.estado <> 'trabajando', f.estado <> 'pendiente', f.logrado_en desc nulls last, f.created_at desc)
      from (
        select * from focos
        where alumno_id = v_alumno.id
          and (estado <> 'logrado' or logrado_en >= current_date - 120)
        order by created_at desc
        limit 30
      ) f
    ), '[]'),
    'evaluaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fecha', e.fecha,
        'items', (select jsonb_agg(jsonb_build_object('habilidad', i.habilidad, 'puntaje', i.puntaje))
                  from evaluacion_items i where i.evaluacion_id = e.id)
      ) order by e.fecha desc, e.created_at desc)
      from (
        select * from evaluaciones where alumno_id = v_alumno.id
        order by fecha desc, created_at desc limit 2
      ) e
    ), '[]'),
    'partidos', jsonb_build_object(
      'cantidad', (select count(distinct partido_id) from partido_jugadores where alumno_id = v_alumno.id),
      'puntos', coalesce((
        select jsonb_agg(jsonb_build_object('tipo', x.tipo, 'golpe', x.golpe, 'cantidad', x.cantidad))
        from (
          select pp.tipo, pp.golpe, count(*) as cantidad
          from partido_puntos pp
          join partido_jugadores pj on pj.partido_id = pp.partido_id and pj.posicion = pp.jugador
          where pj.alumno_id = v_alumno.id and pp.tipo is not null
          group by pp.tipo, pp.golpe
        ) x
      ), '[]')
    )
  );
end;
$$;

revoke execute on function public.perfil_publico(uuid) from public;
grant execute on function public.perfil_publico(uuid) to anon, authenticated;
