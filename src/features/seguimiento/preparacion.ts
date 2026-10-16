import type { EstadoFoco, Foco, Nota, TipoNota } from '../../lib/tipos'

/** Algo para tener en cuenta antes de la clase. */
export interface Pendiente {
  id: string
  texto: string
  origen: 'nota' | 'foco'
  /** Nota: de qué tipo y de qué clase viene. */
  tipo?: TipoNota
  fecha?: string
  /** Foco: en qué estado está. */
  estado?: EstadoFoco
}

export interface Preparacion {
  /** Fecha de la última clase con notas (antes de la que se prepara). */
  ultimaFecha: string | null
  /** Lo que quedó de esa clase: primero lo que hay que trabajar, después los avances. */
  ultimaClase: Pendiente[]
  /** Focos activos que no repiten una nota de la última clase. */
  focos: Pendiente[]
}

const normalizar = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
const ORDEN_TIPO: Record<TipoNota, number> = { error: 0, a_mejorar: 1, avance: 2 }
const ORDEN_FOCO: Record<EstadoFoco, number> = { trabajando: 0, pendiente: 1, logrado: 2 }

/**
 * Junta, por alumno, lo que quedó de su última clase con notas y sus focos
 * activos. `notas` tienen que ser anteriores a la clase que se prepara.
 */
export function armarPreparacion(notas: Nota[], focos: Foco[]): Map<string, Preparacion> {
  const res = new Map<string, Preparacion>()
  const de = (alumnoId: string) => {
    let p = res.get(alumnoId)
    if (!p) res.set(alumnoId, (p = { ultimaFecha: null, ultimaClase: [], focos: [] }))
    return p
  }

  for (const n of notas) {
    const p = de(n.alumno_id)
    if (p.ultimaFecha === null || n.fecha > p.ultimaFecha) {
      p.ultimaFecha = n.fecha
      p.ultimaClase = []
    }
    if (n.fecha === p.ultimaFecha) p.ultimaClase.push({ id: n.id, texto: n.texto, origen: 'nota', tipo: n.tipo, fecha: n.fecha })
  }
  for (const p of res.values()) p.ultimaClase.sort((a, b) => ORDEN_TIPO[a.tipo!] - ORDEN_TIPO[b.tipo!])

  const activos = focos.filter((f) => f.estado !== 'logrado').sort((a, b) => ORDEN_FOCO[a.estado] - ORDEN_FOCO[b.estado])
  for (const f of activos) {
    const p = de(f.alumno_id)
    const repetido = p.ultimaClase.some((n) => normalizar(n.texto) === normalizar(f.titulo))
    if (!repetido) p.focos.push({ id: f.id, texto: f.titulo, origen: 'foco', estado: f.estado })
  }
  return res
}

/** Lo más importante para mostrar en una línea: lo pendiente de la última clase o, si no hay, el primer foco. */
export function principal(p: Preparacion | undefined): { item: Pendiente; resto: number } | null {
  if (!p) return null
  const trabajar = [...p.ultimaClase.filter((n) => n.tipo !== 'avance'), ...p.focos]
  const [item, ...resto] = trabajar
  return item ? { item, resto: resto.length } : null
}
