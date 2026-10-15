import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { endOfMonth, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { datos, supabase } from '../lib/supabase'
import { deIso, iso } from '../lib/fechas'
import type { Alumno, MedioPago, Pago } from '../lib/tipos'

/** "2026-10-01" → "octubre" */
export const nombreMes = (periodo: string) => format(deIso(periodo), 'MMMM', { locale: es })
export const mesDe = (fecha: string) => `${fecha.slice(0, 7)}-01`

export function usePagosDelMes(periodo: string) {
  const fin = iso(endOfMonth(deIso(periodo)))
  return useQuery({
    queryKey: ['pagos', 'mes', periodo],
    queryFn: async () =>
      datos(
        await supabase
          .from('pagos')
          .select('*')
          .or(`periodo.eq.${periodo},and(fecha.gte.${periodo},fecha.lte.${fin})`)
          .order('fecha', { ascending: false }),
      ) as Pago[],
  })
}

export function usePagosDeAlumno(alumnoId: string) {
  return useQuery({
    queryKey: ['pagos', 'alumno', alumnoId],
    queryFn: async () =>
      datos(
        await supabase.from('pagos').select('*').eq('alumno_id', alumnoId).order('fecha', { ascending: false }).limit(36),
      ) as Pago[],
  })
}

export interface Saldo {
  alumno_id: string
  presentes: number
  pagadas: number
}

export function useSaldoClases() {
  return useQuery({
    queryKey: ['pagos', 'saldo-clases'],
    queryFn: async () => datos(await supabase.from('saldo_clases').select('*')) as Saldo[],
  })
}

export function useRegistrarPago() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Omit<Pago, 'id'>) => {
      datos(await supabase.from('pagos').insert(p))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagos'] }),
  })
}

export function useBorrarPago() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      datos(await supabase.from('pagos').delete().eq('id', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagos'] }),
  })
}

// ─── Estado de cuenta ───────────────────────────────────────────────────────

export interface EstadoCuenta {
  alumno: Alumno
  debe: boolean
  /** Lo que debe (o paga) en pesos; null si no tiene precio cargado. */
  monto: number | null
  /** Para pago por clase: clases que vino y no pagó. */
  clasesAdeudadas: number
  pagoDelMes: Pago | null
}

/**
 * Por mes: debe si no hay pago con ese período. Por clase: debe las clases a
 * las que vino que todavía no pagó (cuenta todo el historial, no solo el mes).
 */
export function estadoCuenta(alumno: Alumno, periodo: string, pagos: Pago[], saldo?: Saldo): EstadoCuenta {
  if (alumno.modalidad_pago === 'mensual') {
    const pago = pagos.find((p) => p.alumno_id === alumno.id && p.periodo === periodo) ?? null
    return { alumno, debe: !pago, monto: pago ? pago.monto : alumno.tarifa, clasesAdeudadas: 0, pagoDelMes: pago }
  }
  const adeudadas = Math.max(0, (saldo?.presentes ?? 0) - (saldo?.pagadas ?? 0))
  return {
    alumno,
    debe: adeudadas > 0,
    monto: alumno.tarifa != null ? adeudadas * alumno.tarifa : null,
    clasesAdeudadas: adeudadas,
    pagoDelMes: null,
  }
}

export const MEDIOS: { valor: MedioPago; texto: string }[] = [
  { valor: 'efectivo', texto: 'Efectivo' },
  { valor: 'transferencia', texto: 'Transferencia' },
  { valor: 'otro', texto: 'Otro' },
]
export const textoMedio = (m: MedioPago) => MEDIOS.find((x) => x.valor === m)?.texto ?? m
