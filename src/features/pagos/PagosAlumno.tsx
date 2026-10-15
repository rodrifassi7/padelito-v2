import { useState } from 'react'
import { MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { estadoCuenta, mesDe, nombreMes, textoMedio, useBorrarPago, usePagosDeAlumno, useSaldoClases } from '../../api/pagos'
import { useProfe } from '../../api/profe'
import { Boton, Cargando } from '../../components/ui'
import { pesos } from '../../lib/etiquetas'
import { deIso, fechaCorta, hoyIso } from '../../lib/fechas'
import { mensajeError } from '../../lib/supabase'
import type { Alumno } from '../../lib/tipos'
import { PagoHoja } from './PagoHoja'
import { linkRecordatorio } from './recordatorio'

export function PagosAlumno({ alumno }: { alumno: Alumno }) {
  const periodo = mesDe(hoyIso())
  const { data: pagos, isPending } = usePagosDeAlumno(alumno.id)
  const { data: saldos } = useSaldoClases()
  const { data: profe } = useProfe()
  const borrar = useBorrarPago()
  const [cobrar, setCobrar] = useState(false)

  if (isPending) return <Cargando />
  const e = estadoCuenta(alumno, periodo, pagos ?? [], saldos?.find((s) => s.alumno_id === alumno.id))
  const wa = e.debe ? linkRecordatorio(e, periodo, profe?.alias_pago ?? null) : null

  let estado: string
  if (alumno.modalidad_pago === 'mensual') estado = e.debe ? `Debe la cuota de ${nombreMes(periodo)}` : `Pagó ${nombreMes(periodo)}`
  else estado = e.debe ? `Debe ${e.clasesAdeudadas} ${e.clasesAdeudadas === 1 ? 'clase' : 'clases'}` : 'Sin clases pendientes de pago'

  return (
    <>
      <div className={`rounded-2xl p-4 ${e.debe ? 'border border-falta/30 bg-falta-clara' : 'bg-pelota'}`}>
        <p className={`font-display text-2xl font-semibold ${e.debe ? 'text-falta' : 'text-tinta'}`}>{estado}</p>
        {e.debe && e.monto != null && <p className="text-lg tabular">{pesos(e.monto)}</p>}
        {alumno.tarifa == null && <p className="mt-1 text-sm text-tinta-suave">Cargá su cuota o precio por clase en la ficha.</p>}
        <div className="mt-3 flex gap-2">
          <Boton className="flex-1" onClick={() => setCobrar(true)}>Registrar cobro</Boton>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="flex h-12 items-center gap-2 rounded-xl border border-linea bg-white px-4 font-semibold">
              <MessageCircle className="size-5" aria-hidden /> Recordar
            </a>
          )}
        </div>
      </div>

      {pagos && pagos.length > 0 && (
        <ul className="mt-4 overflow-hidden rounded-2xl border border-linea bg-white">
          {pagos.map((p) => (
            <li key={p.id} className="flex items-center gap-3 border-b border-linea px-4 py-3 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {p.periodo ? `Cuota de ${nombreMes(p.periodo)}` : `${p.clases} ${p.clases === 1 ? 'clase' : 'clases'}`}
                </span>
                <span className="block text-sm text-tinta-suave">
                  {textoMedio(p.medio)}, {fechaCorta(deIso(p.fecha))}
                </span>
              </span>
              <span className="font-semibold tabular">{pesos(Number(p.monto))}</span>
              <button
                onClick={() => borrar.mutate(p.id, { onSuccess: () => toast('Cobro borrado'), onError: (err) => toast.error(mensajeError(err)) })}
                className="-mr-2 grid size-9 place-items-center rounded-full text-tinta-suave hover:bg-linea/60"
                aria-label="Borrar cobro"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {cobrar && <PagoHoja alumno={alumno} periodo={periodo} clasesSugeridas={e.clasesAdeudadas} onCerrar={() => setCobrar(false)} />}
    </>
  )
}
