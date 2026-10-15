export type Formato = 'un_set' | 'mejor_de_3' | 'mejor_de_3_super'
export type TipoPunto = 'winner' | 'error_no_forzado' | 'error_forzado'
export type Pareja = 1 | 2
export type Posicion = 1 | 2 | 3 | 4 // 1-2 pareja 1 (drive, revés), 3-4 pareja 2 (drive, revés)

export interface Jugador {
  posicion: Posicion
  alumno_id: string | null
  nombre: string
}

export interface Punto {
  pareja_gana: Pareja
  jugador: Posicion | null // null = punto sin dato
  tipo: TipoPunto | null
  golpe: string | null
}

export interface PartidoEnCurso {
  id: string
  fecha: string
  inicio: number // ms
  formato: Formato
  punto_de_oro: boolean
  jugadores: Jugador[]
  puntos: Punto[]
}

export const parejaDe = (p: Posicion): Pareja => (p <= 2 ? 1 : 2)
export const rival = (p: Pareja): Pareja => (p === 1 ? 2 : 1)

/** A qué pareja va el punto según quién lo hizo y cómo. */
export const parejaQueGana = (jugador: Posicion, tipo: TipoPunto): Pareja =>
  tipo === 'winner' ? parejaDe(jugador) : rival(parejaDe(jugador))
