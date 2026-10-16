import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarPreparacion, principal } from './preparacion.ts'
import type { Foco, Nota } from '../../lib/tipos.ts'

const nota = (id: string, alumno_id: string, fecha: string, tipo: Nota['tipo'], texto: string): Nota => ({
  id, alumno_id, fecha, tipo, texto, sesion_id: null, area: 'tecnica', golpe: null, created_at: fecha,
})
const foco = (id: string, alumno_id: string, titulo: string, estado: Foco['estado']): Foco => ({
  id, alumno_id, titulo, estado, area: 'tecnica', golpe: null, detalle: null, logrado_en: null, created_at: '2026-10-01',
})

test('toma solo las notas de la última clase y pone primero lo que hay que trabajar', () => {
  const p = armarPreparacion(
    [
      nota('1', 'ana', '2026-10-01', 'a_mejorar', 'Vieja'),
      nota('2', 'ana', '2026-10-08', 'avance', 'Ya sale de la pared'),
      nota('3', 'ana', '2026-10-08', 'a_mejorar', 'Split antes de la volea'),
    ],
    [],
  ).get('ana')!
  assert.equal(p.ultimaFecha, '2026-10-08')
  assert.deepEqual(p.ultimaClase.map((n) => n.texto), ['Split antes de la volea', 'Ya sale de la pared'])
})

test('no repite un foco que es la misma nota, y deja afuera los logrados', () => {
  const p = armarPreparacion(
    [nota('1', 'ana', '2026-10-08', 'a_mejorar', 'Split antes de la volea')],
    [
      foco('f1', 'ana', ' split antes de la  volea', 'pendiente'),
      foco('f2', 'ana', 'Bandeja cerrada', 'logrado'),
      foco('f3', 'ana', 'Globo profundo', 'trabajando'),
    ],
  ).get('ana')!
  assert.deepEqual(p.focos.map((f) => f.texto), ['Globo profundo'])
})

test('principal: lo pendiente de la última clase antes que los focos; un avance solo no cuenta', () => {
  const m = armarPreparacion(
    [nota('1', 'ana', '2026-10-08', 'avance', 'Bien'), nota('2', 'leo', '2026-10-08', 'error', 'Abre la pala')],
    [foco('f1', 'ana', 'Globo', 'pendiente'), foco('f2', 'leo', 'Saque', 'pendiente')],
  )
  assert.equal(principal(m.get('ana'))?.item.texto, 'Globo')
  assert.deepEqual([principal(m.get('leo'))?.item.texto, principal(m.get('leo'))?.resto], ['Abre la pala', 1])
  assert.equal(principal(m.get('nadie')), null)
})
