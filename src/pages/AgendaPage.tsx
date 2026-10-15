import { useMemo, useState } from 'react'
import { addWeeks } from 'date-fns'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAgenda } from '../api/agenda'
import { Boton, Cargando, ErrorCarga, Titulo, Vacio } from '../components/ui'
import { NuevaClaseHoja } from '../features/agenda/NuevaClaseHoja'
import { SesionCard } from '../features/agenda/SesionCard'
import { SesionHoja } from '../features/agenda/SesionHoja'
import { diasDeSemana, esHoy, fechaCorta, fechaLarga, INICIAL_DIA, iso, rangoSemana, diaSemana } from '../lib/fechas'

export function AgendaPage() {
  const [ref, setRef] = useState(() => new Date())
  const { desde, hasta, lunes } = rangoSemana(ref)
  const [dia, setDia] = useState(() => iso(new Date()))
  const { data: sesiones, isPending, isError, refetch } = useAgenda(desde, hasta)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [nueva, setNueva] = useState(false)

  const dias = diasDeSemana(lunes)
  const porDia = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of sesiones ?? []) if (s.estado !== 'cancelada') m.set(s.fecha, (m.get(s.fecha) ?? 0) + 1)
    return m
  }, [sesiones])

  function moverSemana(n: number) {
    const nueva = addWeeks(ref, n)
    setRef(nueva)
    const r = rangoSemana(nueva)
    // Mantener el mismo día de la semana; si es la semana actual, ir a hoy.
    const hoy = new Date()
    setDia(r.desde <= iso(hoy) && iso(hoy) <= r.hasta ? iso(hoy) : iso(diasDeSemana(r.lunes)[diaSemana(new Date(dia + 'T12:00')) - 1]!))
  }

  const delDia = (sesiones ?? []).filter((s) => s.fecha === dia)
  const sesionAbierta = sesiones?.find((s) => s.id === abierta) ?? null

  return (
    <div className="px-4">
      <Titulo
        accion={
          <Boton className="h-10 px-4" onClick={() => setNueva(true)}>
            <Plus className="size-5" aria-hidden /> Clase
          </Boton>
        }
      >
        Agenda
      </Titulo>

      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => moverSemana(-1)} className="grid size-10 place-items-center rounded-full hover:bg-linea/60" aria-label="Semana anterior">
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-medium tabular">
          {fechaCorta(lunes)} al {fechaCorta(dias[6]!)}
        </p>
        <button onClick={() => moverSemana(1)} className="grid size-10 place-items-center rounded-full hover:bg-linea/60" aria-label="Semana siguiente">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5" role="tablist" aria-label="Días de la semana">
        {dias.map((d) => {
          const clave = iso(d)
          const elegido = clave === dia
          const n = porDia.get(clave) ?? 0
          return (
            <button
              key={clave}
              role="tab"
              aria-selected={elegido}
              aria-label={`${fechaLarga(d)}, ${n} clases`}
              onClick={() => setDia(clave)}
              className={clsx(
                'flex h-[4.5rem] flex-col items-center justify-center rounded-xl border transition-colors',
                elegido ? 'border-cancha bg-cancha text-white' : 'border-linea bg-white',
                !elegido && esHoy(d) && 'border-cancha text-cancha',
              )}
            >
              <span className={clsx('text-sm', elegido ? 'text-white/80' : 'text-tinta-suave')}>{INICIAL_DIA[diaSemana(d)]}</span>
              <span className="font-display text-2xl leading-tight font-semibold tabular">{d.getDate()}</span>
              <span className="flex h-1.5 gap-0.5" aria-hidden>
                {Array.from({ length: Math.min(n, 4) }, (_, i) => (
                  <span key={i} className={clsx('size-1.5 rounded-full', elegido ? 'bg-pelota' : 'bg-cancha')} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <h2 className="mt-6 mb-3 font-display text-xl font-semibold first-letter:uppercase">
        {fechaLarga(new Date(dia + 'T12:00'))}
      </h2>

      {isPending && <Cargando />}
      {isError && <ErrorCarga onReintentar={() => refetch()} />}
      {sesiones && delDia.length === 0 && (
        <Vacio titulo="Día libre" texto="No hay clases agendadas." accion={<Boton variante="secundario" onClick={() => setNueva(true)}>Agendar clase</Boton>} />
      )}
      <div className="flex flex-col gap-3">
        {delDia.map((s) => <SesionCard key={s.id} sesion={s} onAbrir={() => setAbierta(s.id)} />)}
      </div>


      <NuevaClaseHoja abierta={nueva} onCerrar={() => setNueva(false)} fecha={dia} />
      <SesionHoja sesion={sesionAbierta} onCerrar={() => setAbierta(null)} />
    </div>
  )
}
