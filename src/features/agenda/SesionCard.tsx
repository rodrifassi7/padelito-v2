import clsx from 'clsx'
import { ChevronRight, MapPin, Repeat } from 'lucide-react'
import { useMarcarAsistencia } from '../../api/agenda'
import { ASISTENCIA } from '../../lib/etiquetas'
import { hora, horaFin, hoyIso } from '../../lib/fechas'
import type { Asistencia, EstadoAsistencia, Sesion } from '../../lib/tipos'

const ESTILO_ACTIVO: Record<Exclude<EstadoAsistencia, 'pendiente'>, string> = {
  presente: 'bg-pelota text-tinta border-pelota-oscura',
  ausente: 'bg-falta text-white border-falta',
  aviso: 'bg-aviso-clara text-aviso border-aviso/50',
}

function ControlAsistencia({ sesion, asistencia }: { sesion: Sesion; asistencia: Asistencia }) {
  const marcar = useMarcarAsistencia()
  const esFutura = sesion.fecha > hoyIso()
  // En clases futuras solo tiene sentido registrar que el alumno avisó que falta.
  const opciones = (esFutura ? ['aviso'] : ['presente', 'ausente', 'aviso']) as Exclude<EstadoAsistencia, 'pendiente'>[]

  return (
    <div className="flex gap-1.5" role="group" aria-label={`Asistencia de ${asistencia.alumno.nombre}`}>
      {opciones.map((op) => {
        const activo = asistencia.estado === op
        return (
          <button
            key={op}
            type="button"
            aria-pressed={activo}
            onClick={() =>
              marcar.mutate({ sesionId: sesion.id, alumnoId: asistencia.alumno_id, estado: activo ? 'pendiente' : op })
            }
            className={clsx(
              'h-9 min-w-14 rounded-lg border px-2.5 text-sm font-semibold transition-colors',
              activo ? ESTILO_ACTIVO[op] : 'border-linea bg-white text-tinta-suave hover:border-tinta-suave',
            )}
          >
            {ASISTENCIA[op]}
          </button>
        )
      })}
    </div>
  )
}

export function SesionCard({ sesion, onAbrir }: { sesion: Sesion; onAbrir: () => void }) {
  const cancelada = sesion.estado === 'cancelada'

  return (
    <article className={clsx('rounded-2xl border border-linea bg-white', cancelada && 'opacity-60')}>
      <button
        type="button"
        onClick={onAbrir}
        className="flex w-full items-center gap-4 px-4 pt-3.5 pb-3 text-left"
        aria-label={`Clase de las ${hora(sesion.hora)}, ver detalle`}
      >
        <div className="min-w-[4.25rem] shrink-0">
          <p className={clsx('font-display text-3xl leading-none font-semibold tabular', cancelada && 'line-through')}>
            {hora(sesion.hora)}
          </p>
          <p className="mt-1 text-sm text-tinta-suave tabular">a {horaFin(sesion.hora, sesion.duracion_min)}</p>
        </div>
        <div className="min-w-0 flex-1 text-sm text-tinta-suave">
          {cancelada ? (
            <p className="font-semibold text-falta">Cancelada</p>
          ) : (
            <p className="flex items-center gap-1.5">
              {sesion.clase_id ? (
                <>
                  <Repeat className="size-3.5" aria-hidden /> Fija semanal
                </>
              ) : (
                'Clase suelta'
              )}
            </p>
          )}
          {sesion.lugar && (
            <p className="mt-0.5 flex items-center gap-1.5 truncate">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {sesion.lugar}
            </p>
          )}
        </div>
        <ChevronRight className="size-5 shrink-0 text-tinta-suave" aria-hidden />
      </button>

      {!cancelada && (
        <ul className="border-t border-linea">
          {sesion.asistencias.length === 0 && (
            <li className="px-4 py-3 text-sm text-tinta-suave">Sin alumnos. Abrila para sumar.</li>
          )}
          {sesion.asistencias.map((a) => (
            <li key={a.alumno_id} className="flex items-center justify-between gap-3 border-b border-linea px-4 py-2.5 last:border-b-0">
              <span className="min-w-0 truncate font-medium">{a.alumno.nombre}</span>
              <ControlAsistencia sesion={sesion} asistencia={a} />
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
