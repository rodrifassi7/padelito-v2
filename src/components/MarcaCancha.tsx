import type { ReactNode } from 'react'

/**
 * El fondo de toda la app: la cancha vista desde arriba (líneas blancas
 * sobre el azul) y la pelota, que queda detrás del vidrio de las tarjetas.
 * Va fijo, detrás del contenido.
 */
export function FondoCancha({ pelota = 'medio' }: { pelota?: 'medio' | 'abajo' | 'ninguna' }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="relative mx-auto h-full max-w-lg">
        <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          <g fill="none" stroke="white" strokeOpacity=".2" strokeWidth="3">
            <rect x="28" y="40" width="334" height="764" />
            <line x1="28" y1="156" x2="362" y2="156" />
            <line x1="28" y1="688" x2="362" y2="688" />
            <line x1="195" y1="156" x2="195" y2="688" />
          </g>
          <line x1="28" y1="422" x2="362" y2="422" stroke="white" strokeOpacity=".4" strokeWidth="5" />
        </svg>
        {pelota !== 'ninguna' && (
          <div
            className={
              pelota === 'medio'
                ? 'absolute top-24 -right-16 size-36 rounded-full bg-pelota'
                : 'absolute -bottom-12 -left-12 size-40 rounded-full bg-pelota'
            }
          />
        )}
      </div>
    </div>
  )
}

/** Encabezado de una pantalla principal, sobre la cancha. */
export function MarcaCancha({ children }: { children: ReactNode }) {
  return <div className="relative px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4">{children}</div>
}
