import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularMarcador, setActual, textoPuntos } from './marcador.ts'
import { estadisticas, paraTrabajar } from './estadisticas.ts'
import type { Pareja } from './tipos.ts'

const rep = (p: Pareja, n: number): Pareja[] => Array(n).fill(p)
const game = (p: Pareja) => rep(p, 4)
const games = (p: Pareja, n: number) => Array.from({ length: n }, () => game(p)).flat()

test('puntos de un game: 0, 15, 30, 40', () => {
  assert.deepEqual(textoPuntos(calcularMarcador([1], 'un_set', true)), ['15', '0'])
  assert.deepEqual(textoPuntos(calcularMarcador([1, 1, 2], 'un_set', true)), ['30', '15'])
  assert.deepEqual(textoPuntos(calcularMarcador([1, 1, 1], 'un_set', true)), ['40', '0'])
  const m = calcularMarcador(game(1), 'un_set', true)
  assert.deepEqual(m.games, [1, 0])
  assert.deepEqual(m.puntos, [0, 0])
})

test('punto de oro: en 40-40 el siguiente gana el game', () => {
  const iguales: Pareja[] = [1, 1, 1, 2, 2, 2]
  assert.deepEqual(textoPuntos(calcularMarcador(iguales, 'un_set', true)), ['40', '40'])
  assert.deepEqual(calcularMarcador([...iguales, 2], 'un_set', true).games, [0, 1])
})

test('sin punto de oro: ventaja, vuelta a iguales y game', () => {
  const iguales: Pareja[] = [1, 1, 1, 2, 2, 2]
  assert.deepEqual(textoPuntos(calcularMarcador([...iguales, 1], 'un_set', false)), ['AD', '40'])
  assert.deepEqual(textoPuntos(calcularMarcador([...iguales, 1, 2], 'un_set', false)), ['40', '40'])
  assert.deepEqual(calcularMarcador([...iguales, 2, 2], 'un_set', false).games, [0, 1])
})

test('set 6-4 gana el partido a un set', () => {
  const m = calcularMarcador([...games(1, 4), ...games(2, 4), ...games(1, 2)], 'un_set', true)
  assert.deepEqual(m.sets, [[6, 4]])
  assert.equal(m.ganador, 1)
})

test('5-5 no cierra el set; 7-5 sí', () => {
  const base = [...games(1, 5), ...games(2, 5)]
  assert.equal(calcularMarcador([...base, ...game(1)], 'un_set', true).ganador, null)
  assert.deepEqual(calcularMarcador([...base, ...games(1, 2)], 'un_set', true).sets, [[7, 5]])
})

test('tie-break en 6-6, a 7 con dos de diferencia', () => {
  const base = [...games(1, 5), ...games(2, 5), ...game(1), ...game(2)]
  const tb = calcularMarcador(base, 'un_set', true)
  assert.equal(tb.tiebreak, true)
  assert.deepEqual(textoPuntos(calcularMarcador([...base, 1, 2, 2], 'un_set', true)), ['1', '2'])
  // 6-6 en el tie-break no alcanza
  const seis = [...base, ...rep(1, 6), ...rep(2, 6)]
  assert.equal(calcularMarcador([...seis, 1], 'un_set', true).ganador, null)
  const fin = calcularMarcador([...seis, 1, 1], 'un_set', true)
  assert.deepEqual(fin.sets, [[7, 6]])
  assert.equal(fin.ganador, 1)
})

test('mejor de 3: 1-1 se juega tercer set normal', () => {
  const m = calcularMarcador([...games(1, 6), ...games(2, 6)], 'mejor_de_3', true)
  assert.deepEqual(m.sets, [[6, 0], [0, 6]])
  assert.equal(m.superTiebreak, false)
  assert.equal(setActual(m), 3)
  assert.equal(m.ganador, null)
})

test('mejor de 3 con super tie-break a 10', () => {
  const unoYUno = [...games(1, 6), ...games(2, 6)]
  const m = calcularMarcador(unoYUno, 'mejor_de_3_super', true)
  assert.equal(m.superTiebreak, true)
  const casi = calcularMarcador([...unoYUno, ...rep(2, 9), ...rep(1, 9)], 'mejor_de_3_super', true)
  assert.equal(casi.ganador, null)
  const fin = calcularMarcador([...unoYUno, ...rep(2, 9), ...rep(1, 9), 2, 2], 'mejor_de_3_super', true)
  assert.deepEqual(fin.sets, [[6, 0], [0, 6], [9, 11]])
  assert.equal(fin.ganador, 2)
})

test('mejor de 3 se gana 2-0', () => {
  const m = calcularMarcador([...games(2, 6), ...games(2, 6)], 'mejor_de_3', true)
  assert.equal(m.ganador, 2)
  assert.deepEqual(m.sets, [[0, 6], [0, 6]])
})

test('después de terminado, los puntos no cambian nada', () => {
  const m = calcularMarcador([...games(1, 6), 2, 2, 2], 'un_set', true)
  assert.deepEqual(m.puntos, [0, 0])
  assert.equal(m.ganador, 1)
})

test('estadísticas y golpe para trabajar', () => {
  const e = estadisticas([
    { tipo: 'winner', golpe: 'bandeja' },
    { tipo: 'error_no_forzado', golpe: 'reves' },
    { tipo: 'error_no_forzado', golpe: 'reves' },
    { tipo: 'error_no_forzado', golpe: 'volea_reves' },
    { tipo: 'error_forzado', golpe: 'globo' },
    { tipo: null, golpe: null },
  ])
  assert.equal(e.winners, 1)
  assert.equal(e.noForzados, 3)
  assert.equal(e.efectividad, 20)
  assert.deepEqual(paraTrabajar(e), { golpe: 'reves', cantidad: 2 })
  assert.equal(paraTrabajar(estadisticas([{ tipo: 'error_no_forzado', golpe: 'reves' }])), null)
})
