import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useBorrarPartido, usePartido } from '../api/partidos'
import { Boton, Cargando, ErrorCarga, Seccion } from '../components/ui'
import { LADO } from '../features/partido/Cancha'
import { estadisticasPorJugador } from '../features/partido/estadisticas'
import { ResumenEstadisticas } from '../features/partido/ResumenEstadisticas'
import { deIso, fechaLarga } from '../lib/fechas'
import { mensajeError } from '../lib/supabase'

const FORMATO = { un_set: '1 set', mejor_de_3: '2 de 3 sets', mejor_de_3_super: '2 de 3, súper tie-break' }

export function PartidoPage() {
  const { id = '' } = useParams()
  const { data, isPending, isError, refetch } = usePartido(id)
  const borrar = useBorrarPartido()
  const navegar = useNavigate()
  const [confirmar, setConfirmar] = useState(false)

  if (isPending) return <Cargando pantalla />
  if (isError || !data) return <ErrorCarga onReintentar={() => refetch()} />

  const { partido: p, puntos } = data
  const stats = estadisticasPorJugador(puntos)
  const pareja = (n: 1 | 2) => p.jugadores.filter((j) => (n === 1 ? j.posicion <= 2 : j.posicion >= 3))
  const sinDato = puntos.filter((x) => x.jugador === null).length

  return (
    <div className="px-4 pb-6">
      <div className="pt-3">
        <Link to="/partidos" className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 font-medium text-cancha">
          <ChevronLeft className="size-5" aria-hidden /> Partidos
        </Link>
      </div>

      <header className="mt-2 rounded-2xl bg-cancha p-4 text-white">
        <p className="text-sm text-white/75 first-letter:uppercase">
          {fechaLarga(deIso(p.fecha))}, {FORMATO[p.formato]}
          {p.duracion_min ? `, ${p.duracion_min} min` : ''}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {([1, 2] as const).map((n) => (
            <div key={n} className="flex items-center gap-3">
              <span className={`min-w-0 flex-1 truncate text-lg ${p.ganador === n ? 'font-semibold' : 'text-white/85'}`}>
                {pareja(n).map((j) => j.nombre).join(' / ')}
              </span>
              {p.sets.map(([a, b], k) => {
                const [mio, otro] = n === 1 ? [a, b] : [b, a]
                return (
                  <span key={k} className={`w-7 text-center font-display text-3xl font-semibold tabular ${mio > otro ? 'text-pelota' : 'text-white/70'}`}>
                    {mio}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
        {!p.ganador && <p className="mt-3 text-sm text-white/75">Quedó sin terminar.</p>}
      </header>

      {([1, 2] as const).map((n) => (
        <Seccion key={n} titulo={`Pareja ${n === 1 ? 'de arriba' : 'de abajo'}`}>
          <div className="flex flex-col gap-3">
            {pareja(n).map((j) => (
              <ResumenEstadisticas
                key={j.posicion}
                e={stats[j.posicion]}
                encabezado={
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    {j.alumno_id ? (
                      <Link to={`/alumnos/${j.alumno_id}`} className="truncate font-display text-xl font-semibold text-cancha">
                        {j.nombre}
                      </Link>
                    ) : (
                      <span className="truncate font-display text-xl font-semibold">{j.nombre}</span>
                    )}
                    <span className="shrink-0 text-sm text-tinta-suave">{LADO[j.posicion]}</span>
                  </div>
                }
              />
            ))}
          </div>
        </Seccion>
      ))}

      {sinDato > 0 && (
        <p className="mt-4 text-sm text-tinta-suave">
          {sinDato} {sinDato === 1 ? 'punto quedó' : 'puntos quedaron'} sin dato de quién lo definió.
        </p>
      )}

      <Boton
        variante="peligro"
        ancho
        className="mt-8"
        cargando={borrar.isPending}
        onClick={() => {
          if (!confirmar) return setConfirmar(true)
          borrar.mutate(p.id, {
            onSuccess: () => {
              toast.success('Partido borrado')
              navegar('/partidos', { replace: true })
            },
            onError: (e) => toast.error(mensajeError(e)),
          })
        }}
      >
        {confirmar ? 'Tocá de nuevo para borrar' : 'Borrar partido'}
      </Boton>
    </div>
  )
}
