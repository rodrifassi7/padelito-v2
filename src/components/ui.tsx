import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { LoaderCircle, X } from 'lucide-react'
import { iniciales } from '../lib/etiquetas'

// ─── Botones ────────────────────────────────────────────────────────────────

type Variante = 'principal' | 'secundario' | 'fantasma' | 'peligro'

const VARIANTES: Record<Variante, string> = {
  principal: 'bg-primario text-sobre-primario hover:brightness-95',
  secundario: 'bg-superficie text-tinta border border-linea hover:border-tinta-suave',
  fantasma: 'text-acento hover:bg-acento-suave',
  peligro: 'bg-superficie text-falta border border-falta/40 hover:bg-falta-clara',
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  cargando?: boolean
  ancho?: boolean
}

export function Boton({ variante = 'principal', cargando, ancho, className, children, disabled, ...props }: BotonProps) {
  return (
    <button
      className={clsx(
        'inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-colors disabled:opacity-50',
        VARIANTES[variante],
        ancho && 'w-full',
        className,
      )}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

// ─── Formularios ────────────────────────────────────────────────────────────

const CONTROL =
  'w-full rounded-xl vidrio border border-linea bg-superficie px-3.5 py-3 text-tinta placeholder:text-tinta-suave/70 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/30'

interface CampoProps {
  etiqueta: string
  ayuda?: string
  children: (id: string, clase: string) => ReactNode
}

export function Campo({ etiqueta, ayuda, children }: CampoProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-tinta-suave">
        {etiqueta}
      </label>
      {children(id, CONTROL)}
      {ayuda && <p className="text-sm text-tinta-suave">{ayuda}</p>}
    </div>
  )
}

interface OpcionesProps<T extends string> {
  etiqueta: string
  opciones: { valor: T; texto: string }[]
  valor: T | null
  onChange: (v: T | null) => void
  permitirVacio?: boolean
}

/** Elegir una opción con botones grandes (más rápido que un select en el celu). */
export function Opciones<T extends string>({ etiqueta, opciones, valor, onChange, permitirVacio }: OpcionesProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-tinta-suave">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => {
          const activo = o.valor === valor
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => onChange(activo && permitirVacio ? null : o.valor)}
              className={clsx(
                'h-10 rounded-full border px-4 text-[15px] font-medium transition-colors',
                activo ? 'border-primario bg-primario text-sobre-primario' : 'border-linea bg-superficie text-tinta hover:border-tinta-suave',
              )}
            >
              {o.texto}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

// ─── Hoja (modal que sube desde abajo) ──────────────────────────────────────

interface HojaProps {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  pie?: ReactNode
  /** Sin botón de cerrar: solo se sale con las acciones de adentro. */
  fija?: boolean
}

export function Hoja({ abierta, onCerrar, titulo, children, pie, fija }: HojaProps) {
  const id = useId()

  useEffect(() => {
    if (!abierta) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && !fija && onCerrar()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', alTeclear)
    }
  }, [abierta, onCerrar, fija])

  if (!abierta) return null

  // Se monta en <body>: si quedara adentro de una tarjeta de vidrio (backdrop-filter),
  // el `fixed` quedaría atrapado en la tarjeta y la barra de abajo la taparía.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-noche/55" onClick={fija ? undefined : onCerrar} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="claro animate-subir relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-fondo text-tinta shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 id={id} className="font-display text-xl font-bold tracking-tight">
            {titulo}
          </h2>
          {!fija && (
            <button
              onClick={onCerrar}
              className="grid size-10 place-items-center rounded-full text-tinta-suave hover:bg-linea/60"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          )}
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {pie && <footer className="safe-bottom border-t border-linea bg-superficie px-5 pt-3 pb-3 sm:rounded-b-3xl">{pie}</footer>}
      </div>
    </div>
  , document.body)
}

// ─── Varios ─────────────────────────────────────────────────────────────────

export function Cargando({ pantalla }: { pantalla?: boolean }) {
  return (
    <div className={clsx('grid place-items-center text-tinta-suave', pantalla ? 'min-h-dvh' : 'py-16')}>
      <LoaderCircle className="size-7 animate-spin" aria-label="Cargando" />
    </div>
  )
}

export function ErrorCarga({ onReintentar }: { onReintentar: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-tinta-suave">No se pudo cargar. Revisá la conexión.</p>
      <Boton variante="secundario" onClick={onReintentar}>
        Reintentar
      </Boton>
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-linea px-6 py-10 text-center">
      <p className="font-display text-lg font-bold tracking-tight">{titulo}</p>
      {texto && <p className="max-w-xs text-tinta-suave">{texto}</p>}
      {accion && <div className="mt-3">{accion}</div>}
    </div>
  )
}

export function Avatar({ nombre, tam = 'md' }: { nombre: string; tam?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={clsx(
        'grid shrink-0 place-items-center rounded-full bg-acento-suave font-display font-bold text-acento tracking-tight',
        tam === 'sm' && 'size-8 text-sm',
        tam === 'md' && 'size-11 text-lg',
        tam === 'lg' && 'size-16 text-2xl',
      )}
      aria-hidden
    >
      {iniciales(nombre)}
    </span>
  )
}

export function Titulo({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 pt-6 pb-4">
      <h1 className="font-display text-[30px] leading-none font-bold tracking-tight">{children}</h1>
      {accion}
    </div>
  )
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="font-display text-[17px] font-bold tracking-tight">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  )
}
