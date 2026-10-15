import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import clsx from 'clsx'

interface Props {
  noche: boolean
  /** `origen`: donde cae la pelota, para que la noche se expanda desde ahí. */
  onCambiar: (noche: boolean, origen: { x: number; y: number }) => void
  etiqueta?: string
  className?: string
}

// Medidas: botón de 82 × 44 px, pelota de 34 px. Recorrido = 80 (adentro del borde) - 34 - 2 × 4.
const PELOTA = 34
const MARGEN = 4
const RECORRIDO = 80 - PELOTA - MARGEN * 2
/** La pelota toca el piso al 80 % del globo (560 ms): recién ahí cambia el tema. */
const ATERRIZA_MS = 450

/**
 * Switch de modo noche con forma de cancha en miniatura: la pelota cruza la
 * red de un globo y, cuando cae, la noche (o el día) se expande desde ahí.
 * Mientras vuela, el switch muestra el destino; el tema cambia al aterrizar
 * para que la animación se vea entera.
 */
export function SwitchPelota({ noche, onCambiar, etiqueta = 'Modo noche', className }: Props) {
  const [tiros, setTiros] = useState(0)
  // Destino mientras la pelota está en el aire; null cuando ya cambió el tema.
  const [vuelo, setVuelo] = useState<boolean | null>(null)
  const temporizador = useRef<number>(undefined)
  if (vuelo !== null && vuelo === noche) setVuelo(null)
  const mostrado = vuelo ?? noche

  function tocar(e: MouseEvent<HTMLButtonElement>) {
    if (vuelo !== null) return
    const destino = !mostrado
    const r = e.currentTarget.getBoundingClientRect()
    const origen = { x: destino ? r.right - MARGEN - PELOTA / 2 : r.left + MARGEN + PELOTA / 2, y: r.top + r.height / 2 }
    const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setVuelo(destino)
    setTiros((n) => n + 1)
    navigator.vibrate?.(10)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => onCambiar(destino, origen), quieto ? 0 : ATERRIZA_MS)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={mostrado}
      aria-label={etiqueta}
      onClick={tocar}
      style={{ '--recorrido': `${RECORRIDO}px` } as CSSProperties}
      className={clsx(
        'relative h-11 w-[82px] shrink-0 rounded-full border transition-colors duration-500',
        mostrado ? 'border-white/25 bg-[#071236]' : 'border-white/45 bg-white/20',
        className,
      )}
    >
      {/* La red, al medio */}
      <span className="absolute inset-y-1.5 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-white/70" aria-hidden />
      {/* Líneas de saque */}
      <span className="absolute inset-y-3 left-[22%] w-px bg-white/25" aria-hidden />
      <span className="absolute inset-y-3 right-[22%] w-px bg-white/25" aria-hidden />
      {/* Luces de la cancha: se prenden de noche */}
      {[{ lado: 'left-3', demora: 'delay-300' }, { lado: 'right-3', demora: 'delay-500' }].map(({ lado, demora }) => (
        <span
          key={lado}
          className={clsx(
            'absolute top-1 size-1.5 rounded-full bg-[#FFF6C8] transition-all duration-300',
            lado,
            mostrado ? clsx('opacity-100 shadow-[0_0_8px_3px_rgba(255,246,200,0.7)]', demora) : 'opacity-0',
          )}
          aria-hidden
        />
      ))}
      {/* La pelota */}
      <span
        key={tiros}
        className={clsx(
          'absolute top-[4px] left-[4px] size-[34px] rounded-full will-change-transform',
          mostrado ? 'translate-x-(--recorrido) rotate-[220deg]' : 'translate-x-0 rotate-0',
          tiros > 0 && (mostrado ? 'animate-globo-noche' : 'animate-globo-dia'),
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 36 36"
          className={clsx(
            'size-full transition-[filter] duration-500',
            mostrado ? 'drop-shadow-[0_0_7px_rgba(217,242,74,0.6)]' : 'drop-shadow-[0_3px_3px_rgba(0,0,0,0.3)]',
          )}
        >
          <circle cx="18" cy="18" r="17" fill="#D9F24A" />
          <path d="M4 9 C13 12 15 24 9 33" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M32 27 C23 24 21 12 27 3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
    </button>
  )
}
