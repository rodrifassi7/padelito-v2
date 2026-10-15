import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Check, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAlumnos, useGuardarAlumno } from '../../api/alumnos'
import { Avatar, Cargando } from '../../components/ui'
import { mensajeError } from '../../lib/supabase'
import { textoNivel } from '../../lib/etiquetas'

interface Props {
  elegidos: string[]
  onChange: (ids: string[]) => void
  excluir?: string[]
  uno?: boolean // elegir uno solo
}

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Lista de alumnos activos para tildar, con búsqueda y alta rápida por nombre. */
export function ElegirAlumnos({ elegidos, onChange, excluir = [], uno }: Props) {
  const { data: alumnos, isPending } = useAlumnos()
  const crear = useGuardarAlumno()
  const [busqueda, setBusqueda] = useState('')

  const lista = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return (alumnos ?? []).filter((a) => a.activo && !excluir.includes(a.id) && (!q || normalizar(a.nombre).includes(q)))
  }, [alumnos, busqueda, excluir])

  function alternar(id: string) {
    if (uno) return onChange(elegidos.includes(id) ? [] : [id])
    onChange(elegidos.includes(id) ? elegidos.filter((x) => x !== id) : [...elegidos, id])
  }

  function crearRapido() {
    const nombre = busqueda.trim()
    crear.mutate(
      {
        nombre, telefono: null, nivel: null, categoria: null, mano: null, posicion: null, fecha_nacimiento: null,
        objetivo: null, notas: null, modalidad_pago: 'mensual', tarifa: null, activo: true,
      },
      {
        onSuccess: (a) => {
          setBusqueda('')
          onChange(uno ? [a.id] : [...elegidos, a.id])
          toast.success(`${a.nombre} agregado. Completá su ficha después.`)
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    )
  }

  if (isPending) return <Cargando />

  const existeExacto = (alumnos ?? []).some((a) => normalizar(a.nombre) === normalizar(busqueda.trim()))

  return (
    <div className="flex flex-col gap-2">
      <label className="relative block">
        <span className="sr-only">Buscar o agregar alumno</span>
        <Search className="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden />
        <input
          className="w-full rounded-xl vidrio border border-linea bg-superficie py-3 pr-3.5 pl-11 focus:border-primario focus:ring-2 focus:ring-primario/30 focus:outline-none"
          placeholder="Buscar o escribir un nombre nuevo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </label>

      {busqueda.trim() && !existeExacto && (
        <button
          type="button"
          onClick={crearRapido}
          disabled={crear.isPending}
          className="flex items-center gap-3 rounded-xl border border-dashed border-primario/50 px-3.5 py-3 text-left font-medium text-acento"
        >
          <Plus className="size-5" aria-hidden /> Agregar a {busqueda.trim()} como alumno nuevo
        </button>
      )}

      <ul className="flex flex-col overflow-hidden rounded-xl vidrio border border-linea bg-superficie">
        {lista.length === 0 && !busqueda && (
          <li className="px-4 py-4 text-tinta-suave">Todavía no hay alumnos. Escribí un nombre para agregarlo.</li>
        )}
        {lista.map((a) => {
          const elegido = elegidos.includes(a.id)
          return (
            <li key={a.id} className="border-b border-linea last:border-b-0">
              <button
                type="button"
                onClick={() => alternar(a.id)}
                aria-pressed={elegido}
                className={clsx('flex w-full items-center gap-3 px-3.5 py-2.5 text-left', elegido && 'bg-acento-suave/60')}
              >
                <Avatar nombre={a.nombre} tam="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.nombre}</span>
                  {a.nivel && <span className="block text-sm text-tinta-suave">{textoNivel(a.nivel)}</span>}
                </span>
                <span
                  className={clsx(
                    'grid size-6 place-items-center rounded-md border',
                    elegido ? 'border-primario bg-primario text-sobre-primario' : 'border-linea',
                  )}
                  aria-hidden
                >
                  {elegido && <Check className="size-4" strokeWidth={3} />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
