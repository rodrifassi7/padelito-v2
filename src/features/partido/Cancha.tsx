import type { ReactNode } from 'react'
import clsx from 'clsx'
import type { Posicion } from './tipos'

/**
 * Cancha de pádel vista desde arriba (10 x 20 m), con la red al medio.
 * Pareja 1 arriba, pareja 2 abajo. El drive juega del lado derecho de su
 * pareja: para la de abajo es la derecha de la pantalla, para la de arriba,
 * que mira hacia abajo, es la izquierda.
 */
const DISTRIBUCION: [Posicion, Posicion][] = [
  [1, 2], // arriba: drive, revés
  [4, 3], // abajo: revés, drive
]

export const LADO: Record<Posicion, 'Drive' | 'Revés'> = { 1: 'Drive', 2: 'Revés', 3: 'Drive', 4: 'Revés' }

function Lineas() {
  // Línea de saque a 6,95 m de la red → 3,05 m del fondo = 15,25 % del largo.
  const saque = 15.25 * 2
  return (
    <svg viewBox="0 0 100 200" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <g stroke="white" strokeOpacity=".75" fill="none" vectorEffect="non-scaling-stroke">
        <line x1="0" y1={saque} x2="100" y2={saque} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1={200 - saque} x2="100" y2={200 - saque} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <line x1="50" y1={saque} x2="50" y2={200 - saque} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  )
}

interface Props {
  children: (posicion: Posicion) => ReactNode
  className?: string
}

export function Cancha({ children, className }: Props) {
  return (
    <div className={clsx('relative overflow-hidden rounded-3xl border-4 border-white/80 bg-cancha-oscura', className)}>
      <Lineas />
      <div className="absolute inset-0 grid grid-rows-[1fr_auto_1fr]">
        {DISTRIBUCION.map((fila, i) => (
          <div key={i} className={clsx('grid grid-cols-2', i === 0 ? 'row-start-1' : 'row-start-3')}>
            {fila.map((pos) => (
              <div key={pos} className="relative min-h-0 min-w-0">
                {children(pos)}
              </div>
            ))}
          </div>
        ))}
        {/* Red */}
        <div className="row-start-2 flex h-3 items-center" aria-hidden>
          <div className="h-[5px] w-full bg-white shadow-[0_2px_0_rgba(0,0,0,.25)]" />
        </div>
      </div>
    </div>
  )
}
