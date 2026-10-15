import type { Formato, Pareja } from './tipos'

/**
 * Marcador de pádel. Es una función pura: el marcador se calcula siempre
 * reproduciendo la lista de puntos, así "deshacer" es sacar el último punto.
 */

export interface Marcador {
  sets: [number, number][] // sets terminados (games o puntos del super tie-break)
  games: [number, number]
  puntos: [number, number]
  tiebreak: boolean
  superTiebreak: boolean
  ganador: Pareja | null
}

export const marcadorInicial = (): Marcador => ({
  sets: [],
  games: [0, 0],
  puntos: [0, 0],
  tiebreak: false,
  superTiebreak: false,
  ganador: null,
})

/** Índices [propio, rival] en las tuplas del marcador. */
const indices = (p: Pareja): [0 | 1, 0 | 1] => (p === 1 ? [0, 1] : [1, 0])

const setsParaGanar = (f: Formato) => (f === 'un_set' ? 1 : 2)

export const setsGanados = (m: Marcador): [number, number] => {
  const r: [number, number] = [0, 0]
  for (const [a, b] of m.sets) r[a > b ? 0 : 1]++
  return r
}

/** Número del set que se está jugando (1, 2 o 3). */
export const setActual = (m: Marcador) => Math.min(m.sets.length + 1, 3)

export function sumarPunto(m: Marcador, gana: Pareja, formato: Formato, puntoDeOro: boolean): Marcador {
  if (m.ganador) return m
  const [g, o] = indices(gana)
  const s: Marcador = {
    ...m,
    sets: m.sets.map(([a, b]) => [a, b]),
    games: [m.games[0], m.games[1]],
    puntos: [m.puntos[0], m.puntos[1]],
  }

  // Tie-break (a 7) o super tie-break (a 10), con 2 de diferencia.
  if (s.tiebreak || s.superTiebreak) {
    s.puntos[g]++
    const meta = s.superTiebreak ? 10 : 7
    if (s.puntos[g] >= meta && s.puntos[g] - s.puntos[o] >= 2) {
      if (s.superTiebreak) {
        s.sets.push([s.puntos[0], s.puntos[1]])
        s.puntos = [0, 0]
        s.superTiebreak = false
        s.ganador = gana
        return s
      }
      s.games[g]++
      s.puntos = [0, 0]
      s.tiebreak = false
      return cerrarSet(s, gana, formato)
    }
    return s
  }

  const [pg, po] = [s.puntos[g], s.puntos[o]]
  if (pg >= 3 && po >= 3) {
    // Iguales o ventaja
    if (puntoDeOro || pg > po) return ganarGame(s, gana, formato)
    if (pg === po) s.puntos[g]++
    else s.puntos = [3, 3]
    return s
  }
  s.puntos[g]++
  if (s.puntos[g] === 4) return ganarGame(s, gana, formato)
  return s
}

function ganarGame(s: Marcador, gana: Pareja, formato: Formato): Marcador {
  const [g, o] = indices(gana)
  s.games[g]++
  s.puntos = [0, 0]
  if (s.games[0] === 6 && s.games[1] === 6) {
    s.tiebreak = true
    return s
  }
  if (s.games[g] >= 6 && s.games[g] - s.games[o] >= 2) return cerrarSet(s, gana, formato)
  return s
}

function cerrarSet(s: Marcador, gana: Pareja, formato: Formato): Marcador {
  s.sets.push([s.games[0], s.games[1]])
  s.games = [0, 0]
  const ganados = setsGanados(s)
  if (ganados[indices(gana)[0]] >= setsParaGanar(formato)) {
    s.ganador = gana
  } else if (formato === 'mejor_de_3_super' && ganados[0] === 1 && ganados[1] === 1) {
    s.superTiebreak = true
  }
  return s
}

export function calcularMarcador(ganadores: Pareja[], formato: Formato, puntoDeOro: boolean): Marcador {
  return ganadores.reduce((m, p) => sumarPunto(m, p, formato, puntoDeOro), marcadorInicial())
}

const NORMAL = ['0', '15', '30', '40']

/** Texto de los puntos del game para cada pareja. */
export function textoPuntos(m: Marcador): [string, string] {
  const [a, b] = m.puntos
  if (m.tiebreak || m.superTiebreak) return [String(a), String(b)]
  if (a >= 3 && b >= 3) {
    if (a === b) return ['40', '40']
    return a > b ? ['AD', '40'] : ['40', 'AD']
  }
  return [NORMAL[a] ?? '?', NORMAL[b] ?? '?']
}

/** "6-4 3-6 10-8" */
export const textoSets = (sets: [number, number][]) => sets.map(([a, b]) => `${a}-${b}`).join('  ')
