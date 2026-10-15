import type { TipoPunto } from './tipos'

/** Golpes, en el orden en que aparecen al marcar un punto (los más usados primero). */
export const GOLPES = [
  { clave: 'derecha', texto: 'Derecha' },
  { clave: 'reves', texto: 'Revés' },
  { clave: 'volea_derecha', texto: 'Volea derecha' },
  { clave: 'volea_reves', texto: 'Volea revés' },
  { clave: 'bandeja', texto: 'Bandeja' },
  { clave: 'vibora', texto: 'Víbora' },
  { clave: 'smash', texto: 'Smash' },
  { clave: 'smash_x3', texto: 'Smash x3' },
  { clave: 'smash_x4', texto: 'Smash x4' },
  { clave: 'globo', texto: 'Globo' },
  { clave: 'bajada_pared', texto: 'Bajada de pared' },
  { clave: 'salida_pared', texto: 'Salida de pared' },
  { clave: 'chiquita', texto: 'Chiquita' },
  { clave: 'dejada', texto: 'Dejada' },
  { clave: 'saque', texto: 'Saque' },
  { clave: 'resto', texto: 'Resto' },
] as const

const TEXTO = new Map<string, string>(GOLPES.map((g) => [g.clave, g.texto]))
export const textoGolpe = (clave: string | null) => (clave ? (TEXTO.get(clave) ?? clave) : 'Sin golpe')

/** Golpes que no tienen sentido como error (un x3 o x4 siempre es winner). */
export const golpesPara = (tipo: TipoPunto) =>
  tipo === 'winner' ? GOLPES : GOLPES.filter((g) => g.clave !== 'smash_x3' && g.clave !== 'smash_x4')

export const TIPOS: { valor: TipoPunto; texto: string; corto: string }[] = [
  { valor: 'winner', texto: 'Winner', corto: 'W' },
  { valor: 'error_no_forzado', texto: 'Error no forzado', corto: 'ENF' },
  { valor: 'error_forzado', texto: 'Error forzado', corto: 'EF' },
]

export const textoTipo = (t: TipoPunto) => TIPOS.find((x) => x.valor === t)?.texto ?? t
