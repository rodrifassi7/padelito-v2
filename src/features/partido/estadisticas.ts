import type { Posicion, TipoPunto } from './tipos'

export interface ConteoGolpe {
  golpe: string
  cantidad: number
}

export interface Estadisticas {
  winners: number
  noForzados: number
  forzados: number
  /** Winners sobre todos los puntos que terminó (winners + errores), en %. */
  efectividad: number | null
  winnersPorGolpe: ConteoGolpe[]
  noForzadosPorGolpe: ConteoGolpe[]
  forzadosPorGolpe: ConteoGolpe[]
}

interface PuntoConGolpe {
  tipo: TipoPunto | null
  golpe: string | null
}

function contar(puntos: PuntoConGolpe[], tipo: TipoPunto): ConteoGolpe[] {
  const m = new Map<string, number>()
  for (const p of puntos) if (p.tipo === tipo && p.golpe) m.set(p.golpe, (m.get(p.golpe) ?? 0) + 1)
  return [...m].map(([golpe, cantidad]) => ({ golpe, cantidad })).sort((a, b) => b.cantidad - a.cantidad)
}

export function estadisticas(puntos: PuntoConGolpe[]): Estadisticas {
  const winners = puntos.filter((p) => p.tipo === 'winner').length
  const noForzados = puntos.filter((p) => p.tipo === 'error_no_forzado').length
  const forzados = puntos.filter((p) => p.tipo === 'error_forzado').length
  const total = winners + noForzados + forzados
  return {
    winners,
    noForzados,
    forzados,
    efectividad: total ? Math.round((winners / total) * 100) : null,
    winnersPorGolpe: contar(puntos, 'winner'),
    noForzadosPorGolpe: contar(puntos, 'error_no_forzado'),
    forzadosPorGolpe: contar(puntos, 'error_forzado'),
  }
}

export function estadisticasPorJugador(puntos: (PuntoConGolpe & { jugador: Posicion | null })[]) {
  const r = {} as Record<Posicion, Estadisticas>
  for (const pos of [1, 2, 3, 4] as Posicion[]) r[pos] = estadisticas(puntos.filter((p) => p.jugador === pos))
  return r
}

/**
 * El golpe para trabajar: el de más errores no forzados, si se repite.
 * Con un solo error no alcanza para sacar conclusiones.
 */
export function paraTrabajar(e: Estadisticas): ConteoGolpe | null {
  const top = e.noForzadosPorGolpe[0]
  return top && top.cantidad >= 2 ? top : null
}
