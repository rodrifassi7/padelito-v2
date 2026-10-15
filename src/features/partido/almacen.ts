import { useCallback, useSyncExternalStore } from 'react'
import { calcularMarcador, marcadorInicial, setActual, sumarPunto, type Marcador } from './marcador'
import type { PartidoEnCurso, Punto } from './tipos'

/**
 * El partido en juego vive en el celular (localStorage) hasta que se guarda.
 * Si se bloquea la pantalla o se cierra la app, se retoma donde quedó.
 */

const clave = (profeId: string) => `padelito:partido-en-curso:${profeId}`
const oyentes = new Set<() => void>()
const cache = new Map<string, { crudo: string | null; valor: PartidoEnCurso | null }>()

function leer(profeId: string): PartidoEnCurso | null {
  let crudo: string | null = null
  try {
    crudo = localStorage.getItem(clave(profeId))
  } catch {
    return null
  }
  const previo = cache.get(profeId)
  if (previo && previo.crudo === crudo) return previo.valor
  let valor: PartidoEnCurso | null = null
  try {
    valor = crudo ? (JSON.parse(crudo) as PartidoEnCurso) : null
  } catch {
    valor = null
  }
  cache.set(profeId, { crudo, valor })
  return valor
}

function escribir(profeId: string, partido: PartidoEnCurso | null) {
  try {
    if (partido) localStorage.setItem(clave(profeId), JSON.stringify(partido))
    else localStorage.removeItem(clave(profeId))
  } catch {
    // Sin almacenamiento (modo privado): el partido sigue en memoria mientras la app esté abierta.
    cache.set(profeId, { crudo: null, valor: partido })
  }
  oyentes.forEach((f) => f())
}

function suscribir(f: () => void) {
  oyentes.add(f)
  const alCambiarEnOtraPestana = (e: StorageEvent) => e.key?.startsWith('padelito:partido') && f()
  window.addEventListener('storage', alCambiarEnOtraPestana)
  return () => {
    oyentes.delete(f)
    window.removeEventListener('storage', alCambiarEnOtraPestana)
  }
}

export function usePartidoEnCurso(profeId: string) {
  const partido = useSyncExternalStore(suscribir, () => leer(profeId))

  const guardar = useCallback((p: PartidoEnCurso | null) => escribir(profeId, p), [profeId])
  const marcar = useCallback(
    (punto: Punto) => {
      const actual = leer(profeId)
      if (actual) escribir(profeId, { ...actual, puntos: [...actual.puntos, punto] })
    },
    [profeId],
  )
  const deshacer = useCallback(() => {
    const actual = leer(profeId)
    if (actual?.puntos.length) escribir(profeId, { ...actual, puntos: actual.puntos.slice(0, -1) })
  }, [profeId])

  return { partido, iniciar: guardar, marcar, deshacer, descartar: () => guardar(null) }
}

export const marcadorDe = (p: PartidoEnCurso): Marcador =>
  calcularMarcador(
    p.puntos.map((x) => x.pareja_gana),
    p.formato,
    p.punto_de_oro,
  )

/** Arma lo que recibe guardar_partido() en la base. */
export function paraGuardar(p: PartidoEnCurso, notas?: string) {
  const m = marcadorDe(p)
  // Número de set de cada punto: se reproduce el partido punto a punto.
  let parcial = marcadorInicial()
  const puntos = p.puntos.map((x, i) => {
    const set_numero = setActual(parcial)
    parcial = sumarPunto(parcial, x.pareja_gana, p.formato, p.punto_de_oro)
    return { orden: i + 1, pareja_gana: x.pareja_gana, jugador: x.jugador, tipo: x.tipo, golpe: x.golpe, set_numero }
  })
  // Si quedó sin terminar, se guarda también el set que se estaba jugando.
  const sets = [...m.sets]
  if (!m.ganador && (m.games[0] || m.games[1])) sets.push(m.games)
  return {
    id: p.id,
    fecha: p.fecha,
    formato: p.formato,
    punto_de_oro: p.punto_de_oro,
    sets,
    ganador: m.ganador,
    duracion_min: Math.max(0, Math.round((Date.now() - p.inicio) / 60_000)),
    notas: notas ?? null,
    jugadores: p.jugadores,
    puntos,
  }
}
