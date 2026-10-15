import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import clsx from 'clsx'
import { ArrowDown, ArrowUp, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useGuardarPartido } from '../api/partidos'
import { useProfeId } from '../auth/AuthProvider'
import { Boton, Hoja } from '../components/ui'
import { marcadorDe, paraGuardar, usePartidoEnCurso } from '../features/partido/almacen'
import { Cancha, LADO } from '../features/partido/Cancha'
import { estadisticasPorJugador } from '../features/partido/estadisticas'
import { textoGolpe, TIPOS } from '../features/partido/golpes'
import { MarcarPuntoHoja } from '../features/partido/MarcarPuntoHoja'
import { setActual, textoPuntos, type Marcador } from '../features/partido/marcador'
import { parejaQueGana, type Jugador, type Pareja, type PartidoEnCurso, type Posicion } from '../features/partido/tipos'
import { mensajeError } from '../lib/supabase'

const vibrar = () => navigator.vibrate?.(12)
const corto = (n: string) => n.trim().split(/\s+/)[0] ?? n

function nombresPareja(p: PartidoEnCurso, pareja: Pareja) {
  return p.jugadores
    .filter((j) => (pareja === 1 ? j.posicion <= 2 : j.posicion >= 3))
    .map((j) => corto(j.nombre))
    .join(' / ')
}

function Tablero({ partido, m }: { partido: PartidoEnCurso; m: Marcador }) {
  const pts = textoPuntos(m)
  const fila = (pareja: Pareja) => {
    const i = pareja - 1
    return (
      <div className="flex items-center gap-3">
        <span className={clsx('min-w-0 flex-1 truncate text-[17px]', m.ganador === pareja && 'font-semibold text-pelota')}>
          {nombresPareja(partido, pareja)}
        </span>
        {m.sets.map((s, k) => (
          <span key={k} className="w-5 text-center font-display text-xl text-white/60 tabular">{s[i]}</span>
        ))}
        {!m.ganador && (
          <>
            <span className="w-6 text-center font-display text-2xl font-semibold tabular">{m.games[i]}</span>
            <span className="grid h-9 w-12 place-items-center rounded-lg bg-pelota font-display text-2xl font-semibold text-tinta tabular">
              {pts[i]}
            </span>
          </>
        )}
      </div>
    )
  }

  let estado = `Set ${setActual(m)}`
  if (m.superTiebreak) estado = 'Súper tie-break'
  else if (m.tiebreak) estado = 'Tie-break'
  else if (partido.punto_de_oro && m.puntos[0] === 3 && m.puntos[1] === 3) estado = 'Punto de oro'

  return (
    <div className="flex flex-col gap-1.5">
      {fila(1)}
      {fila(2)}
      {!m.ganador && <p className="text-sm text-white/70">{estado}</p>}
    </div>
  )
}

export function EnJuegoPage() {
  const profeId = useProfeId()
  const { partido, marcar, deshacer, descartar } = usePartidoEnCurso(profeId)
  const guardar = useGuardarPartido()
  const navegar = useNavigate()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [menu, setMenu] = useState(false)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const [guardadoId, setGuardadoId] = useState<string | null>(null)

  const m = useMemo(() => (partido ? marcadorDe(partido) : null), [partido])
  const stats = useMemo(() => (partido ? estadisticasPorJugador(partido.puntos) : null), [partido])

  // Al guardar se borra el partido del celular: ir al resumen, no a la lista.
  if (guardadoId) return <Navigate to={`/partidos/${guardadoId}`} replace />
  if (!partido || !m || !stats) return <Navigate to="/partidos" replace />

  const ultimo = partido.puntos.at(-1)
  const ultimoTexto = ultimo
    ? ultimo.jugador
      ? `${TIPOS.find((t) => t.valor === ultimo.tipo)?.corto} ${corto(partido.jugadores.find((j) => j.posicion === ultimo.jugador)?.nombre ?? '')}${ultimo.golpe ? `, ${textoGolpe(ultimo.golpe).toLowerCase()}` : ''}`
      : `Punto ${ultimo.pareja_gana === 1 ? 'arriba' : 'abajo'}`
    : null

  function guardarPartido() {
    if (!partido) return
    guardar.mutate(paraGuardar(partido), {
      onSuccess: (id) => {
        setGuardadoId(id)
        descartar()
        toast.success('Partido guardado')
      },
      onError: (e) => toast.error(`${mensajeError(e)} El partido sigue guardado en el celular.`),
    })
  }

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-tinta text-white">
      <header className="flex items-start gap-3 px-4 pt-[max(env(safe-area-inset-top),.75rem)] pb-3">
        <button onClick={() => setMenu(true)} className="-ml-1 grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10" aria-label="Opciones del partido">
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1 pt-1">
          <Tablero partido={partido} m={m} />
        </div>
      </header>

      <Cancha className="mx-3 min-h-0 flex-1">
        {(pos: Posicion) => {
          const j = partido.jugadores.find((x) => x.posicion === pos)!
          const e = stats[pos]
          return (
            <button
              type="button"
              disabled={Boolean(m.ganador)}
              onClick={() => {
                vibrar()
                setJugador(j)
              }}
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 transition-colors active:bg-white/15"
            >
              <span className="line-clamp-2 text-center font-display text-[1.7rem] leading-none font-semibold">{corto(j.nombre)}</span>
              <span className="text-sm text-white/65">{LADO[pos]}</span>
              {(e.winners > 0 || e.noForzados > 0 || e.forzados > 0) && (
                <span className="mt-1 flex gap-1 text-xs font-semibold tabular" aria-label={`${e.winners} winners, ${e.noForzados} errores no forzados, ${e.forzados} errores forzados`}>
                  <span className="rounded bg-pelota px-1.5 py-0.5 text-tinta">W {e.winners}</span>
                  <span className="rounded bg-falta px-1.5 py-0.5">ENF {e.noForzados}</span>
                  <span className="rounded bg-aviso-clara px-1.5 py-0.5 text-aviso">EF {e.forzados}</span>
                </span>
              )}
            </button>
          )
        }}
      </Cancha>

      <footer className="safe-bottom grid grid-cols-[1fr_auto_auto] gap-2 px-3 pt-3 pb-3">
        <button
          onClick={() => {
            vibrar()
            deshacer()
          }}
          disabled={!ultimo}
          className="flex h-14 min-w-0 items-center gap-2 rounded-2xl bg-white/10 px-4 text-left disabled:opacity-40"
        >
          <Undo2 className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Deshacer</span>
            <span className="block truncate text-xs text-white/65">{ultimoTexto ?? 'Sin puntos todavía'}</span>
          </span>
        </button>
        {([1, 2] as Pareja[]).map((p) => (
          <button
            key={p}
            disabled={Boolean(m.ganador)}
            onClick={() => {
              vibrar()
              marcar({ pareja_gana: p, jugador: null, tipo: null, golpe: null })
            }}
            className="flex h-14 flex-col items-center justify-center rounded-2xl bg-white/10 px-3 text-xs font-semibold disabled:opacity-40"
            aria-label={`Punto sin dato para la pareja ${p === 1 ? 'de arriba' : 'de abajo'}`}
          >
            {p === 1 ? <ArrowUp className="size-5" aria-hidden /> : <ArrowDown className="size-5" aria-hidden />}
            Punto
          </button>
        ))}
      </footer>

      <MarcarPuntoHoja
        jugador={jugador}
        onCerrar={() => setJugador(null)}
        onMarcar={(tipo, golpe) => {
          if (!jugador) return
          vibrar()
          marcar({ pareja_gana: parejaQueGana(jugador.posicion, tipo), jugador: jugador.posicion, tipo, golpe })
          setJugador(null)
        }}
      />

      {/* Fin del partido */}
      {m.ganador && !menu && (
        <Hoja abierta fija onCerrar={deshacer} titulo="Partido terminado">
          <p className="mb-1 text-lg">
            Ganaron <strong>{nombresPareja(partido, m.ganador)}</strong>
          </p>
          <p className="mb-6 font-display text-3xl font-semibold tabular">
            {m.sets.map(([a, b]) => (m.ganador === 1 ? `${a}-${b}` : `${b}-${a}`)).join('  ')}
          </p>
          <div className="flex flex-col gap-3">
            <Boton ancho cargando={guardar.isPending} onClick={guardarPartido}>
              Guardar partido
            </Boton>
            <Boton variante="secundario" ancho onClick={deshacer}>
              Deshacer el último punto
            </Boton>
          </div>
        </Hoja>
      )}

      {/* Menú */}
      <Hoja abierta={menu} onCerrar={() => { setMenu(false); setConfirmarDescarte(false) }} titulo="Partido en juego">
        <div className="flex flex-col gap-3">
          <Boton ancho cargando={guardar.isPending} onClick={guardarPartido}>
            Terminar y guardar como está
          </Boton>
          <Boton variante="secundario" ancho onClick={() => navegar('/partidos')}>
            Salir y seguir después
          </Boton>
          <Boton
            variante="peligro"
            ancho
            onClick={() => {
              if (!confirmarDescarte) return setConfirmarDescarte(true)
              descartar()
              navegar('/partidos', { replace: true })
            }}
          >
            {confirmarDescarte ? 'Tocá de nuevo para descartar' : 'Descartar partido'}
          </Boton>
          <p className="text-sm text-tinta-suave">El partido queda guardado en este celular hasta que lo termines o lo descartes.</p>
        </div>
      </Hoja>
    </div>
  )
}
