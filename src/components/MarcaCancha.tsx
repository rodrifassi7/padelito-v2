import type { ReactNode } from 'react'

/** Las líneas de la cancha vista desde arriba, de costado, como fondo. */
function LineasCancha() {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMaxYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full [mask-image:linear-gradient(to_right,transparent_15%,black_70%)]"
      aria-hidden
    >
      <g fill="none" stroke="white" strokeOpacity=".28" strokeWidth="2">
        <rect x="40" y="20" width="440" height="160" />
        <line x1="260" y1="20" x2="260" y2="180" strokeOpacity=".45" strokeWidth="3" />
        <line x1="136" y1="20" x2="136" y2="180" />
        <line x1="384" y1="20" x2="384" y2="180" />
        <line x1="136" y1="100" x2="384" y2="100" />
      </g>
    </svg>
  )
}

/** Banda azul cancha para el encabezado principal de una pantalla. */
export function MarcaCancha({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-cancha text-white">
      <LineasCancha />
      <div className="relative px-5 pt-[max(env(safe-area-inset-top),1.75rem)] pb-7">{children}</div>
    </div>
  )
}
