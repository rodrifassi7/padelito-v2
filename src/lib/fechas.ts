import { addDays, format, getISODay, isSameDay, parseISO, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

/** Fecha local como "yyyy-MM-dd" (lo que guarda la base). */
export const iso = (d: Date) => format(d, 'yyyy-MM-dd')

export const hoyIso = () => iso(new Date())

export const deIso = (s: string) => parseISO(s)

export const inicioSemana = (d: Date) => startOfWeek(d, { weekStartsOn: 1 })

export const diasDeSemana = (lunes: Date) => Array.from({ length: 7 }, (_, i) => addDays(lunes, i))

/** 1 = lunes … 7 = domingo, igual que en la base. */
export const diaSemana = (d: Date) => getISODay(d)

export const NOMBRE_DIA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const INICIAL_DIA = ['', 'L', 'M', 'M', 'J', 'V', 'S', 'D']

/** "19:00:00" → "19:00" */
export const hora = (h: string) => h.slice(0, 5)

export function horaFin(h: string, minutos: number) {
  const [hh = 0, mm = 0] = h.split(':').map(Number)
  const total = hh * 60 + mm + minutos
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** "jueves 15 de octubre" */
export const fechaLarga = (d: Date) => format(d, "EEEE d 'de' MMMM", { locale: es })

/** "15 oct" */
export const fechaCorta = (d: Date) => format(d, 'd MMM', { locale: es }).replace('.', '')

/** "oct 2026" */
export const mesCorto = (d: Date) => format(d, 'MMMM yyyy', { locale: es })

export const esHoy = (d: Date) => isSameDay(d, new Date())

export function rangoSemana(d: Date) {
  const lunes = inicioSemana(d)
  return { desde: iso(lunes), hasta: iso(addDays(lunes, 6)), lunes }
}

/** Minutos desde medianoche de una hora "HH:mm[:ss]". */
export function minutos(h: string) {
  const [hh = 0, mm = 0] = h.split(':').map(Number)
  return hh * 60 + mm
}
