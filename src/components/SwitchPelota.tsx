import { useState, type MouseEvent } from 'react'
import clsx from 'clsx'

interface Props {
  noche: boolean
  /** `origen`: centro de la pelota donde cae, para que la noche se expanda desde ahí. */
  onCambiar: (noche: boolean, origen: { x: number; y: number }) => void
  etiqueta?: string
}

/**
 * Switch de modo noche con forma de cancha en miniatura: la pelota cruza la
 * red de un globo (salta y gira) y cae del otro lado. De noche se prenden
 * las luces de la cancha y la pelota brilla.
 */
export function SwitchPelota({ noche, onCambiar, etiqueta = 'Modo noche' }: Props) {
  // Cuenta los toques: cambia la key de la pelota para reiniciar el globo.
  const [tiros, setTiros] = useState(0)

  function tocar(e: MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    // Donde cae la pelota: lado derecho para la noche, izquierdo para el día.
    const x = noche ? r.left + 23 : r.right - 23
    setTiros((n) => n + 1)
    navigator.vibrate?.(10)
    onCambiar(!noche, { x, y: r.top + r.height / 2 })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={noche}
      aria-label={etiqueta}
      onClick={tocar}
      className={clsx(
        'relative h-12 w-[92px] shrink-0 rounded-full border transition-colors duration-500',
        noche ? 'border-white/25 bg-[#071236]' : 'border-white/45 bg-white/20',
      )}
    >
      {/* La red, al medio */}
      <span className="absolute inset-y-1.5 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-white/70" aria-hidden />
      {/* Líneas de saque */}
      <span className="absolute inset-y-3 left-[22%] w-px bg-white/25" aria-hidden />
      <span className="absolute inset-y-3 right-[22%] w-px bg-white/25" aria-hidden />
      {/* Luces de la cancha: se prenden de noche */}
      {[{ lado: 'left-3', demora: '' }, { lado: 'right-3', demora: 'delay-150' }].map(({ lado, demora }) => (
        <span
          key={lado}
          className={clsx(
            'absolute top-1 size-1.5 rounded-full bg-[#FFF6C8] transition-all duration-500',
            lado,
            demora,
            noche ? 'opacity-100 shadow-[0_0_8px_3px_rgba(255,246,200,0.7)]' : 'opacity-0',
          )}
          aria-hidden
        />
      ))}
      {/* La pelota */}
      <span
        key={tiros}
        className={clsx(
          'absolute top-[5px] left-[5px] size-9 rounded-full',
          noche ? 'translate-x-[44px] rotate-[220deg]' : 'translate-x-0 rotate-0',
          tiros > 0 && (noche ? 'animate-globo-noche' : 'animate-globo-dia'),
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 36 36"
          className={clsx(
            'size-full transition-[filter] duration-500',
            noche ? 'drop-shadow-[0_0_7px_rgba(217,242,74,0.6)]' : 'drop-shadow-[0_3px_3px_rgba(0,0,0,0.3)]',
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
