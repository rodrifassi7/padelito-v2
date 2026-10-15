import type { EstadoAsistencia, Mano, ModalidadPago, Nivel, Posicion } from './tipos'

export const NIVELES: { valor: Nivel; texto: string }[] = [
  { valor: 'iniciacion', texto: 'Iniciación' },
  { valor: 'principiante', texto: 'Principiante' },
  { valor: 'intermedio', texto: 'Intermedio' },
  { valor: 'avanzado', texto: 'Avanzado' },
  { valor: 'competicion', texto: 'Competición' },
]

export const textoNivel = (n: Nivel | null) => NIVELES.find((x) => x.valor === n)?.texto ?? null

export const MANOS: { valor: Mano; texto: string }[] = [
  { valor: 'derecha', texto: 'Diestro' },
  { valor: 'zurda', texto: 'Zurdo' },
]

export const POSICIONES: { valor: Posicion; texto: string }[] = [
  { valor: 'drive', texto: 'Drive' },
  { valor: 'reves', texto: 'Revés' },
  { valor: 'ambas', texto: 'Las dos' },
]

export const MODALIDADES: { valor: ModalidadPago; texto: string }[] = [
  { valor: 'mensual', texto: 'Por mes' },
  { valor: 'por_clase', texto: 'Por clase' },
]

export const ASISTENCIA: Record<Exclude<EstadoAsistencia, 'pendiente'>, string> = {
  presente: 'Vino',
  ausente: 'Faltó',
  aviso: 'Avisó',
}

export const pesos = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

/** Link de WhatsApp a partir de un teléfono argentino escrito como venga. */
export function linkWhatsapp(telefono: string, texto?: string) {
  let d = telefono.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  if (d.startsWith('54')) {
    if (!d.startsWith('549') && d.length === 12) d = `549${d.slice(2)}`
  } else if (d.length === 10) {
    d = `549${d}`
  }
  const q = texto ? `?text=${encodeURIComponent(texto)}` : ''
  return `https://wa.me/${d}${q}`
}

export const iniciales = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
