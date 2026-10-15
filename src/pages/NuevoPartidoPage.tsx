import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeftRight, ChevronLeft, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useProfeId } from '../auth/AuthProvider'
import { Boton, Opciones } from '../components/ui'
import { usePartidoEnCurso } from '../features/partido/almacen'
import { Cancha, LADO } from '../features/partido/Cancha'
import { ElegirJugadorHoja } from '../features/partido/ElegirJugadorHoja'
import type { Formato, Jugador, Posicion } from '../features/partido/tipos'
import { hoyIso } from '../lib/fechas'

const FORMATOS: { valor: Formato; texto: string }[] = [
  { valor: 'un_set', texto: '1 set' },
  { valor: 'mejor_de_3', texto: '2 de 3' },
  { valor: 'mejor_de_3_super', texto: '2 de 3, súper tie-break' },
]

type Slots = Partial<Record<Posicion, Omit<Jugador, 'posicion'>>>

export function NuevoPartidoPage() {
  const profeId = useProfeId()
  const { partido, iniciar, descartar } = usePartidoEnCurso(profeId)
  const navegar = useNavigate()
  const [slots, setSlots] = useState<Slots>({})
  const [eligiendo, setEligiendo] = useState<Posicion | null>(null)
  const [formato, setFormato] = useState<Formato>('un_set')
  const [puntoDeOro, setPuntoDeOro] = useState(true)

  const completos = ([1, 2, 3, 4] as Posicion[]).every((p) => slots[p])
  const ocupados = Object.values(slots).flatMap((j) => (j?.alumno_id ? [j.alumno_id] : []))

  function invertir(pareja: 1 | 2) {
    const [a, b] = pareja === 1 ? ([1, 2] as const) : ([3, 4] as const)
    setSlots((s) => ({ ...s, [a]: s[b], [b]: s[a] }))
  }

  function empezar() {
    if (!completos) return
    iniciar({
      id: crypto.randomUUID(),
      fecha: hoyIso(),
      inicio: Date.now(),
      formato,
      punto_de_oro: puntoDeOro,
      jugadores: ([1, 2, 3, 4] as Posicion[]).map((posicion) => ({ posicion, ...slots[posicion]! })),
      puntos: [],
    })
    navegar('/partidos/en-juego', { replace: true })
  }

  if (partido) {
    return (
      <div className="flex min-h-dvh flex-col justify-center gap-4 px-5">
        <h1 className="font-display text-3xl font-semibold">Hay un partido en juego</h1>
        <p className="text-tinta-suave">
          {partido.jugadores.map((j) => j.nombre.split(' ')[0]).join(', ')}. Seguilo o descartalo para empezar otro.
        </p>
        <Boton onClick={() => navegar('/partidos/en-juego')}>Seguir el partido</Boton>
        <Boton variante="peligro" onClick={descartar}>
          Descartar y empezar otro
        </Boton>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8">
      <div className="pt-3">
        <Link to="/partidos" className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 font-medium text-cancha">
          <ChevronLeft className="size-5" aria-hidden /> Partidos
        </Link>
      </div>
      <h1 className="pt-2 pb-1 font-display text-4xl font-semibold">Nuevo partido</h1>
      <p className="mb-4 text-tinta-suave">Tocá cada lugar de la cancha para ubicar a los jugadores.</p>

      <div className="relative">
        <Cancha className="h-[min(58dvh,30rem)]">
          {(pos) => {
            const j = slots[pos]
            return (
              <button
                type="button"
                onClick={() => setEligiendo(pos)}
                className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-white hover:bg-white/10"
              >
                {j ? (
                  <>
                    <span className="line-clamp-2 text-center font-display text-xl leading-tight font-semibold">{j.nombre}</span>
                    <span className="text-sm text-white/70">{LADO[pos]}{!j.alumno_id && ', invitado'}</span>
                  </>
                ) : (
                  <>
                    <span className="grid size-11 place-items-center rounded-full border-2 border-dashed border-white/60">
                      <Plus className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm text-white/80">{LADO[pos]}</span>
                  </>
                )}
              </button>
            )
          }}
        </Cancha>
        {/* Cambiar de lado a una pareja */}
        {([1, 2] as const).map((pareja) => (
          <button
            key={pareja}
            type="button"
            onClick={() => invertir(pareja)}
            aria-label={`Cambiar de lado a la pareja ${pareja === 1 ? 'de arriba' : 'de abajo'}`}
            className={clsx(
              'absolute left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full bg-white text-cancha shadow-md',
              pareja === 1 ? 'top-[calc(50%-3.5rem)]' : 'bottom-[calc(50%-3.5rem)]',
            )}
          >
            <ArrowLeftRight className="size-4" />
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <Opciones etiqueta="Formato" opciones={FORMATOS} valor={formato} onChange={(v) => v && setFormato(v)} />
        <label className="flex items-center justify-between gap-4 rounded-xl border border-linea bg-white px-4 py-3">
          <span>
            <span className="block font-medium">Punto de oro</span>
            <span className="block text-sm text-tinta-suave">{puntoDeOro ? 'En 40 iguales, el próximo punto gana el game' : 'Se juega con ventaja'}</span>
          </span>
          <input type="checkbox" className="size-6 accent-cancha" checked={puntoDeOro} onChange={(e) => setPuntoDeOro(e.target.checked)} />
        </label>
        <Boton ancho disabled={!completos} onClick={empezar}>
          {completos ? 'Empezar partido' : 'Faltan jugadores'}
        </Boton>
      </div>

      <ElegirJugadorHoja
        abierta={eligiendo !== null}
        titulo={eligiendo ? `${LADO[eligiendo]}, pareja ${eligiendo <= 2 ? 'de arriba' : 'de abajo'}` : ''}
        ocupados={ocupados.filter((id) => id !== (eligiendo ? slots[eligiendo]?.alumno_id : null))}
        onCerrar={() => setEligiendo(null)}
        onElegir={(j) => {
          if (eligiendo) setSlots((s) => ({ ...s, [eligiendo]: j }))
          setEligiendo(null)
        }}
      />
    </div>
  )
}
