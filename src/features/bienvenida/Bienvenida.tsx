import { useState } from 'react'
import { Link } from 'react-router'
import clsx from 'clsx'
import { Check, ChevronRight, X } from 'lucide-react'
import { useAlumnos } from '../../api/alumnos'
import { useHayClasesFijas } from '../../api/agenda'
import { usePartidos } from '../../api/partidos'
import { useProfe } from '../../api/profe'

const CLAVE = 'padelito:bienvenida-oculta'

function oculta() {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

/** Primeros pasos para un profe que recién empieza. Desaparece al completarlos. */
export function Bienvenida() {
  const { data: profe } = useProfe()
  const { data: alumnos } = useAlumnos()
  const { data: hayClases } = useHayClasesFijas()
  const { data: partidos } = usePartidos()
  const [cerrada, setCerrada] = useState(oculta)

  if (cerrada || !profe || !alumnos || hayClases === undefined || !partidos) return null

  const pasos = [
    { hecho: Boolean(profe.club || profe.alias_pago), texto: 'Completá tu perfil', detalle: 'Club y alias para cobrar', a: '/perfil' },
    { hecho: alumnos.length > 0, texto: 'Cargá tus alumnos', detalle: 'Con el nombre alcanza para arrancar', a: '/alumnos' },
    { hecho: hayClases, texto: 'Armá tus clases fijas', detalle: 'Se repiten solas cada semana', a: '/agenda' },
    { hecho: partidos.length > 0, texto: 'Marcá un partido', detalle: 'Winners y errores sobre la cancha', a: '/partidos/nuevo' },
  ]
  const hechos = pasos.filter((p) => p.hecho).length
  if (hechos === pasos.length) return null

  return (
    <section className="mb-4 rounded-2xl border border-linea bg-white p-4" aria-labelledby="primeros-pasos">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 id="primeros-pasos" className="font-display text-2xl font-semibold">Primeros pasos</h2>
          <p className="text-sm text-tinta-suave">
            {hechos} de {pasos.length} listos
          </p>
        </div>
        <button
          onClick={() => {
            try { localStorage.setItem(CLAVE, '1') } catch { /* sin almacenamiento */ }
            setCerrada(true)
          }}
          className="-mt-1 -mr-1 grid size-9 place-items-center rounded-full text-tinta-suave hover:bg-linea/60"
          aria-label="Ocultar primeros pasos"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-linea" aria-hidden>
        <div className="h-full rounded-full bg-cancha transition-all" style={{ width: `${(hechos / pasos.length) * 100}%` }} />
      </div>
      <ol>
        {pasos.map((p) => (
          <li key={p.a}>
            <Link to={`${p.a}?desde=bienvenida`} className="flex items-center gap-3 py-2.5">
              <span
                className={clsx(
                  'grid size-7 shrink-0 place-items-center rounded-full border-2',
                  p.hecho ? 'border-pelota bg-pelota text-tinta' : 'border-linea',
                )}
              >
                {p.hecho && <Check className="size-4" strokeWidth={3} aria-label="Listo" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={clsx('block font-medium', p.hecho && 'text-tinta-suave line-through')}>{p.texto}</span>
                {!p.hecho && <span className="block text-sm text-tinta-suave">{p.detalle}</span>}
              </span>
              {!p.hecho && <ChevronRight className="size-5 text-tinta-suave" aria-hidden />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
