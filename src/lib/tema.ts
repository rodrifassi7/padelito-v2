import { useCallback, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

/**
 * Tema de la app: "azul" (la cancha de día) o "noche". La preferencia puede
 * ser "auto" (sigue al celular). Se guarda en este dispositivo y se aplica
 * como data-tema en <html>; index.html lo aplica antes de pintar para que no
 * haya parpadeo.
 */
export type Preferencia = 'azul' | 'noche' | 'auto'
export type Tema = 'azul' | 'noche'

const CLAVE = 'padelito:tema'
const COLOR_BARRA: Record<Tema, string> = { azul: '#1D46C8', noche: '#0B1A4A' }
const oyentes = new Set<() => void>()
const oscuroDelCelular = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

export function preferencia(): Preferencia {
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'noche' || v === 'auto' ? v : 'azul'
  } catch {
    return 'azul'
  }
}

const temaDe = (p: Preferencia): Tema => (p === 'auto' ? (oscuroDelCelular() ? 'noche' : 'azul') : p)

function aplicar() {
  const tema = temaDe(preferencia())
  document.documentElement.dataset.tema = tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema])
  oyentes.forEach((f) => f())
}

export function elegirTema(p: Preferencia) {
  try {
    localStorage.setItem(CLAVE, p)
  } catch {
    /* sin almacenamiento: vale para esta sesión */
  }
  aplicar()
}

/**
 * Cambia el tema con efecto: la noche (o el día) se expande en círculo desde
 * `origen` (la pelota del switch). Sin View Transitions, o con movimiento
 * reducido, hace un fundido corto de colores.
 */
export function elegirTemaConEfecto(p: Preferencia, origen?: { x: number; y: number }) {
  const html = document.documentElement
  const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (quieto) return elegirTema(p)

  if (!document.startViewTransition || !origen) {
    html.classList.add('cambiando-tema')
    elegirTema(p)
    window.setTimeout(() => html.classList.remove('cambiando-tema'), 600)
    return
  }

  const transicion = document.startViewTransition(() => flushSync(() => elegirTema(p)))
  transicion.ready
    .then(() => {
      const radio = Math.hypot(Math.max(origen.x, innerWidth - origen.x), Math.max(origen.y, innerHeight - origen.y))
      html.animate(
        { clipPath: [`circle(0px at ${origen.x}px ${origen.y}px)`, `circle(${radio}px at ${origen.x}px ${origen.y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.55, 0, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
}

if (typeof window !== 'undefined') {
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (preferencia() === 'auto') aplicar()
  })
}

function suscribir(f: () => void) {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

export function useTema() {
  const pref = useSyncExternalStore(suscribir, preferencia)
  const tema = temaDe(pref)
  const cambiar = useCallback((p: Preferencia, origen?: { x: number; y: number }) => elegirTemaConEfecto(p, origen), [])
  return { preferencia: pref, tema, cambiar }
}
