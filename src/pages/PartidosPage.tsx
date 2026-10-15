import { Link, useNavigate } from 'react-router'
import clsx from 'clsx'
import { ChevronRight, Plus } from 'lucide-react'
import { usePartidos, type PartidoGuardado } from '../api/partidos'
import { useProfeId } from '../auth/AuthProvider'
import { Boton, Cargando, ErrorCarga, Titulo, Vacio } from '../components/ui'
import { marcadorDe, usePartidoEnCurso } from '../features/partido/almacen'
import { textoPuntos } from '../features/partido/marcador'
import { deIso, fechaCorta } from '../lib/fechas'

const pareja = (p: PartidoGuardado, n: 1 | 2) =>
  p.jugadores
    .filter((j) => (n === 1 ? j.posicion <= 2 : j.posicion >= 3))
    .map((j) => j.nombre.split(' ')[0])
    .join(' / ')

export function PartidosPage() {
  const profeId = useProfeId()
  const { partido: enCurso } = usePartidoEnCurso(profeId)
  const { data: partidos, isPending, isError, refetch } = usePartidos()
  const navegar = useNavigate()

  const m = enCurso ? marcadorDe(enCurso) : null

  return (
    <div className="px-4">
      <Titulo
        accion={
          !enCurso && (
            <Boton className="h-10 px-4" onClick={() => navegar('/partidos/nuevo')}>
              <Plus className="size-5" aria-hidden /> Partido
            </Boton>
          )
        }
      >
        Partidos
      </Titulo>

      {enCurso && m && (
        <Link to="/partidos/en-juego" className="mb-5 block rounded-2xl bg-noche p-4 text-white">
          <p className="text-sm text-pelota">En juego</p>
          <p className="mt-1 font-display text-[17px] font-bold tracking-tight">
            {enCurso.jugadores.slice(0, 2).map((j) => j.nombre.split(' ')[0]).join(' / ')} vs{' '}
            {enCurso.jugadores.slice(2).map((j) => j.nombre.split(' ')[0]).join(' / ')}
          </p>
          <p className="mt-1 text-white/75 tabular">
            {[...m.sets.map(([a, b]) => `${a}-${b}`), `${m.games[0]}-${m.games[1]}`].join('  ')} ({textoPuntos(m).join('-')})
          </p>
          <p className="mt-3 font-semibold">Seguir marcando</p>
        </Link>
      )}

      {isPending && <Cargando />}
      {isError && <ErrorCarga onReintentar={() => refetch()} />}
      {partidos && partidos.length === 0 && !enCurso && (
        <Vacio
          titulo="Marcá tu primer partido"
          texto="Ubicás a los cuatro en la cancha y vas marcando winners y errores. Al final ves qué tiene que trabajar cada uno."
          accion={<Boton onClick={() => navegar('/partidos/nuevo')}>Nuevo partido</Boton>}
        />
      )}

      {partidos && partidos.length > 0 && (
        <ul className="overflow-hidden rounded-2xl vidrio border border-linea bg-superficie">
          {partidos.map((p) => (
            <li key={p.id} className="border-b border-linea last:border-b-0">
              <Link to={`/partidos/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                <span className="w-14 shrink-0 text-sm text-tinta-suave tabular">{fechaCorta(deIso(p.fecha))}</span>
                <span className="min-w-0 flex-1">
                  <span className={clsx('block truncate', p.ganador === 1 && 'font-semibold')}>{pareja(p, 1)}</span>
                  <span className={clsx('block truncate', p.ganador === 2 && 'font-semibold')}>{pareja(p, 2)}</span>
                </span>
                <span className="text-right font-display text-lg leading-tight tabular tracking-tight">
                  <span className="block">{p.sets.map((s) => s[0]).join(' ')}</span>
                  <span className="block">{p.sets.map((s) => s[1]).join(' ')}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-tinta-suave" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
