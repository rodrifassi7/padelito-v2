import { useEffect, useState, type FormEvent } from 'react'
import { addMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { MEDIOS, mesDe, nombreMes, useRegistrarPago } from '../../api/pagos'
import { Boton, Campo, Hoja, Opciones } from '../../components/ui'
import { pesos } from '../../lib/etiquetas'
import { deIso, hoyIso, iso } from '../../lib/fechas'
import { mensajeError } from '../../lib/supabase'
import type { Alumno, MedioPago } from '../../lib/tipos'

interface Props {
  alumno: Alumno | null
  periodo: string // mes sugerido para cuotas mensuales
  clasesSugeridas?: number // para pago por clase
  onCerrar: () => void
}

export function PagoHoja({ alumno, periodo, clasesSugeridas, onCerrar }: Props) {
  const registrar = useRegistrarPago()
  const [monto, setMonto] = useState('')
  const [medio, setMedio] = useState<MedioPago>('efectivo')
  const [mes, setMes] = useState(periodo)
  const [clases, setClases] = useState('1')
  const [fecha, setFecha] = useState(hoyIso())

  const porClase = alumno?.modalidad_pago === 'por_clase'

  useEffect(() => {
    if (!alumno) return
    const n = Math.max(1, clasesSugeridas ?? 1)
    setClases(String(n))
    setMonto(alumno.tarifa ? String(porClase ? alumno.tarifa * n : alumno.tarifa) : '')
    setMedio('efectivo')
    setMes(periodo)
    setFecha(hoyIso())
  }, [alumno, periodo, clasesSugeridas, porClase])

  // Al cambiar la cantidad de clases, recalcular el monto con el precio por clase.
  function cambiarClases(v: string) {
    setClases(v)
    const n = Number(v)
    if (alumno?.tarifa && n > 0) setMonto(String(alumno.tarifa * n))
  }

  if (!alumno) return null

  const meses = [-2, -1, 0, 1].map((d) => mesDe(iso(addMonths(deIso(periodo), d))))

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!alumno) return
    registrar.mutate(
      {
        alumno_id: alumno.id,
        fecha,
        monto: Number(monto),
        medio,
        periodo: porClase ? null : mes,
        clases: porClase ? Number(clases) : null,
        nota: null,
      },
      {
        onSuccess: () => {
          toast.success(`Cobro de ${alumno.nombre.split(' ')[0]} registrado`)
          onCerrar()
        },
        onError: (err) => toast.error(mensajeError(err)),
      },
    )
  }

  const valido = Number(monto) > 0 && (!porClase || Number(clases) > 0)

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      titulo={`Cobrar a ${alumno.nombre.split(' ')[0]}`}
      pie={
        <Boton type="submit" form="pago" ancho disabled={!valido} cargando={registrar.isPending}>
          Registrar {Number(monto) > 0 ? pesos(Number(monto)) : 'cobro'}
        </Boton>
      }
    >
      <form id="pago" onSubmit={enviar} className="flex flex-col gap-5">
        {porClase ? (
          <Campo etiqueta="Clases que paga" ayuda={alumno.tarifa ? `${pesos(alumno.tarifa)} cada una` : undefined}>
            {(id, c) => <input id={id} className={`${c} tabular`} inputMode="numeric" value={clases} onChange={(e) => cambiarClases(e.target.value.replace(/\D/g, ''))} />}
          </Campo>
        ) : (
          <Opciones
            etiqueta="Cuota de"
            opciones={meses.map((m) => ({ valor: m, texto: format(deIso(m), 'MMMM', { locale: es }) }))}
            valor={mes}
            onChange={(v) => v && setMes(v)}
          />
        )}
        <Campo etiqueta="Monto">
          {(id, c) => (
            <div className="relative">
              <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-tinta-suave">$</span>
              <input id={id} className={`${c} pl-8 text-lg tabular`} inputMode="numeric" required value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))} />
            </div>
          )}
        </Campo>
        <Opciones etiqueta="Cómo pagó" opciones={MEDIOS} valor={medio} onChange={(v) => v && setMedio(v)} />
        <Campo etiqueta="Fecha del cobro">
          {(id, c) => <input id={id} className={c} type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />}
        </Campo>
        {!porClase && mes !== periodo && <p className="text-sm text-tinta-suave">Se registra como la cuota de {nombreMes(mes)}.</p>}
      </form>
    </Hoja>
  )
}
