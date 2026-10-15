import { useState } from 'react'
import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useBorrarNota, useNotas } from '../../api/seguimiento'
import { Cargando } from '../../components/ui'
import { deIso, fechaCorta, hoyIso } from '../../lib/fechas'
import { mensajeError } from '../../lib/supabase'
import type { TipoNota } from '../../lib/tipos'
import { textoGolpe } from '../partido/golpes'
import { textoArea, textoTipoNota } from './catalogo'
import { NotaHoja } from './NotaHoja'

const ESTILO: Record<TipoNota, string> = {
  a_mejorar: 'bg-acento-suave text-tinta',
  avance: 'bg-pelota text-noche',
  error: 'bg-falta-clara text-falta',
}

export function Notas({ alumno }: { alumno: { id: string; nombre: string } }) {
  const { data: notas, isPending } = useNotas(alumno.id)
  const borrar = useBorrarNota(alumno.id)
  const [nueva, setNueva] = useState(false)
  const [verTodas, setVerTodas] = useState(false)

  if (isPending) return <Cargando />
  const lista = verTodas ? (notas ?? []) : (notas ?? []).slice(0, 5)

  return (
    <>
      {!notas?.length ? (
        <p className="text-tinta-suave">Sin notas todavía. Se cargan desde la agenda al terminar la clase, o acá.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {lista.map((n) => (
            <li key={n.id} className="rounded-2xl vidrio border border-linea bg-superficie px-4 py-3">
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="text-tinta-suave tabular">{fechaCorta(deIso(n.fecha))}</span>
                <span className={clsx('rounded-md px-1.5 py-0.5 font-semibold', ESTILO[n.tipo])}>{textoTipoNota(n.tipo)}</span>
                <span className="min-w-0 flex-1 truncate text-tinta-suave">
                  {[textoArea(n.area), n.golpe && textoGolpe(n.golpe).toLowerCase()].filter(Boolean).join(', ')}
                </span>
                <button
                  type="button"
                  onClick={() => borrar.mutate(n.id, { onError: (e) => toast.error(mensajeError(e)) })}
                  className="-mr-2 grid size-8 place-items-center rounded-full text-tinta-suave hover:bg-linea/60"
                  aria-label="Borrar nota"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="leading-snug whitespace-pre-line">{n.texto}</p>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-2 flex items-center justify-between">
        {(notas?.length ?? 0) > 5 ? (
          <button type="button" onClick={() => setVerTodas(!verTodas)} className="h-10 font-medium text-acento">
            {verTodas ? 'Ver menos' : `Ver todas (${notas!.length})`}
          </button>
        ) : <span />}
        <button type="button" onClick={() => setNueva(true)} className="flex h-10 items-center gap-1 font-medium text-acento">
          <Plus className="size-4" aria-hidden /> Nota
        </button>
      </div>
      <NotaHoja abierta={nueva} onCerrar={() => setNueva(false)} alumnos={[alumno]} sesionId={null} fecha={hoyIso()} />
    </>
  )
}
