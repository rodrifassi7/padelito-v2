import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { ArrowDown, ArrowUp, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useEvaluaciones, useGuardarEvaluacion } from '../../api/seguimiento'
import { Boton, Campo, Cargando, Hoja } from '../../components/ui'
import { deIso, fechaCorta, hoyIso } from '../../lib/fechas'
import { mensajeError } from '../../lib/supabase'
import type { Evaluacion } from '../../lib/tipos'
import { AREAS, HABILIDADES, NIVELES_PUNTAJE } from './catalogo'

/** Barra de 5 segmentos para un puntaje de 1 a 5. */
export function Barra({ puntaje }: { puntaje: number }) {
  return (
    <span className="flex gap-1" aria-label={`${puntaje} de 5, ${NIVELES_PUNTAJE[puntaje]}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={clsx('h-2.5 w-5 rounded-full', n <= puntaje ? 'bg-cancha' : 'bg-linea')} />
      ))}
    </span>
  )
}

export function Cambio({ delta }: { delta: number }) {
  if (!delta) return <span className="w-8" />
  const sube = delta > 0
  return (
    <span className={clsx('flex w-8 items-center justify-end text-sm font-semibold tabular', sube ? 'text-cancha' : 'text-falta')}>
      {sube ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />}
      {Math.abs(delta)}
    </span>
  )
}

/** Puntajes de la última evaluación agrupados por área, con el cambio contra la anterior. */
export function VistaEvaluacion({ ultima, anterior }: { ultima: Evaluacion; anterior?: Evaluacion }) {
  const previo = new Map(anterior?.items.map((i) => [i.habilidad, i.puntaje]))
  const puntaje = new Map(ultima.items.map((i) => [i.habilidad, i.puntaje]))
  return (
    <div className="flex flex-col gap-4">
      {AREAS.map((a) => {
        const items = HABILIDADES.filter((h) => h.area === a.valor && puntaje.has(h.clave))
        if (!items.length) return null
        return (
          <div key={a.valor}>
            <p className="mb-1.5 text-sm font-medium text-tinta-suave">{a.texto}</p>
            <ul className="flex flex-col gap-2">
              {items.map((h) => {
                const p = puntaje.get(h.clave)!
                const antes = previo.get(h.clave)
                return (
                  <li key={h.clave} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate">{h.texto}</span>
                    <Barra puntaje={p} />
                    <Cambio delta={antes ? p - antes : 0} />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      {ultima.comentario && <p className="rounded-xl bg-fondo px-3 py-2.5 whitespace-pre-line">{ultima.comentario}</p>}
    </div>
  )
}

function EvaluacionHoja({ alumnoId, base, abierta, onCerrar }: { alumnoId: string; base?: Evaluacion; abierta: boolean; onCerrar: () => void }) {
  const guardar = useGuardarEvaluacion(alumnoId)
  const [puntajes, setPuntajes] = useState<Record<string, number>>({})
  const [comentario, setComentario] = useState('')

  useEffect(() => {
    if (!abierta) return
    // Arranca con la última evaluación: el profe solo ajusta lo que cambió.
    setPuntajes(Object.fromEntries(base?.items.map((i) => [i.habilidad, i.puntaje]) ?? []))
    setComentario('')
  }, [abierta, base])

  const cantidad = Object.keys(puntajes).length

  function enviar() {
    guardar.mutate(
      { fecha: hoyIso(), comentario: comentario.trim() || null, items: Object.entries(puntajes).map(([habilidad, puntaje]) => ({ habilidad, puntaje })) },
      { onSuccess: () => { toast.success('Evaluación guardada'); onCerrar() }, onError: (e) => toast.error(mensajeError(e)) },
    )
  }

  return (
    <Hoja
      abierta={abierta}
      onCerrar={onCerrar}
      titulo="Nueva evaluación"
      pie={
        <Boton ancho disabled={!cantidad} cargando={guardar.isPending} onClick={enviar}>
          {cantidad ? `Guardar ${cantidad} ${cantidad === 1 ? 'habilidad' : 'habilidades'}` : 'Puntuá al menos una habilidad'}
        </Boton>
      }
    >
      <p className="mb-4 text-tinta-suave">
        De 1 (inicial) a 5 (muy bueno). Evaluá solo lo que corresponde a su nivel.{base && ' Arranca con los puntajes de la última vez.'}
      </p>
      <div className="flex flex-col gap-6">
        {AREAS.map((a) => (
          <fieldset key={a.valor}>
            <legend className="mb-2 font-display text-xl font-semibold">{a.texto}</legend>
            <ul className="flex flex-col gap-2.5">
              {HABILIDADES.filter((h) => h.area === a.valor).map((h) => (
                <li key={h.clave} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 leading-tight">{h.texto}</span>
                  <span className="flex gap-1.5" role="radiogroup" aria-label={h.texto}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const activo = puntajes[h.clave] === n
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={activo}
                          aria-label={`${n}, ${NIVELES_PUNTAJE[n]}`}
                          onClick={() =>
                            setPuntajes((p) => {
                              const r = { ...p }
                              if (activo) delete r[h.clave]
                              else r[h.clave] = n
                              return r
                            })
                          }
                          className={clsx(
                            'grid size-9 place-items-center rounded-full border font-display text-lg font-semibold tabular',
                            activo ? 'border-cancha bg-cancha text-white' : 'border-linea bg-white text-tinta-suave',
                          )}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
        <Campo etiqueta="Comentario (opcional)">
          {(id, c) => <textarea id={id} className={c} rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />}
        </Campo>
      </div>
    </Hoja>
  )
}

export function Evaluaciones({ alumnoId }: { alumnoId: string }) {
  const { data, isPending } = useEvaluaciones(alumnoId)
  const [abierta, setAbierta] = useState(false)
  const [indice, setIndice] = useState(0)
  const evaluaciones = useMemo(() => data ?? [], [data])

  useEffect(() => setIndice(0), [evaluaciones.length])

  if (isPending) return <Cargando />

  const ultima = evaluaciones[indice]
  const anterior = evaluaciones[indice + 1]

  return (
    <>
      {!ultima ? (
        <div className="rounded-2xl border border-dashed border-linea px-5 py-6 text-center">
          <p className="text-tinta-suave">Puntuá sus golpes y su juego de 1 a 5. Cada nueva evaluación muestra cuánto mejoró.</p>
          <Boton variante="secundario" className="mt-3" onClick={() => setAbierta(true)}>
            <ClipboardCheck className="size-5" aria-hidden /> Primera evaluación
          </Boton>
        </div>
      ) : (
        <div className="rounded-2xl border border-linea bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-tinta-suave">
              {indice === 0 ? 'Última' : 'Evaluación'} del <strong className="text-tinta">{fechaCorta(deIso(ultima.fecha))}</strong>
              {anterior && <>, contra el {fechaCorta(deIso(anterior.fecha))}</>}
            </p>
            {evaluaciones.length > 1 && (
              <select
                aria-label="Ver otra evaluación"
                className="h-9 rounded-lg border border-linea bg-white px-2 text-sm"
                value={indice}
                onChange={(e) => setIndice(Number(e.target.value))}
              >
                {evaluaciones.map((ev, i) => (
                  <option key={ev.id} value={i}>
                    {fechaCorta(deIso(ev.fecha))}
                  </option>
                ))}
              </select>
            )}
          </div>
          <VistaEvaluacion ultima={ultima} anterior={anterior} />
          <Boton variante="secundario" ancho className="mt-5" onClick={() => setAbierta(true)}>
            <ClipboardCheck className="size-5" aria-hidden /> Nueva evaluación
          </Boton>
        </div>
      )}
      <EvaluacionHoja alumnoId={alumnoId} base={evaluaciones[0]} abierta={abierta} onCerrar={() => setAbierta(false)} />
    </>
  )
}

