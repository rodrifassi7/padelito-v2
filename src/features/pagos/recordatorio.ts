import { nombreMes, type EstadoCuenta } from '../../api/pagos'
import { linkWhatsapp, pesos } from '../../lib/etiquetas'

/** Link de WhatsApp con el recordatorio de pago ya escrito. */
export function linkRecordatorio(e: EstadoCuenta, periodo: string, alias: string | null) {
  if (!e.alumno.telefono) return null
  const nombre = e.alumno.nombre.split(' ')[0]
  const monto = e.monto ? ` (${pesos(e.monto)})` : ''
  const que =
    e.alumno.modalidad_pago === 'mensual'
      ? `la cuota de ${nombreMes(periodo)}${monto}`
      : `${e.clasesAdeudadas === 1 ? 'la clase' : `las ${e.clasesAdeudadas} clases`} pendientes${monto}`
  const transferencia = alias ? ` Si es por transferencia, el alias es ${alias}.` : ''
  return linkWhatsapp(e.alumno.telefono, `¡Hola ${nombre}! Te paso el recordatorio de ${que}.${transferencia} ¡Gracias!`)
}
