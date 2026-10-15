import { useEffect, useMemo, useState } from 'react'
import { Search, UserRound } from 'lucide-react'
import { useAlumnos } from '../../api/alumnos'
import { Avatar, Cargando, Hoja } from '../../components/ui'
import { textoNivel } from '../../lib/etiquetas'
import type { Jugador } from './tipos'

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

interface Props {
  abierta: boolean
  titulo: string
  ocupados: string[] // alumno_id ya elegidos en otras posiciones
  onCerrar: () => void
  onElegir: (j: Omit<Jugador, 'posicion'>) => void
}

/** Elegir un alumno o escribir el nombre de alguien que no es alumno. */
export function ElegirJugadorHoja({ abierta, titulo, ocupados, onCerrar, onElegir }: Props) {
  const { data: alumnos, isPending } = useAlumnos()
  const [texto, setTexto] = useState('')

  useEffect(() => {
    if (abierta) setTexto('')
  }, [abierta])

  const lista = useMemo(() => {
    const q = normalizar(texto.trim())
    return (alumnos ?? []).filter((a) => a.activo && !ocupados.includes(a.id) && (!q || normalizar(a.nombre).includes(q)))
  }, [alumnos, texto, ocupados])

  const nombre = texto.trim()

  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} titulo={titulo}>
      <label className="relative mb-3 block">
        <span className="sr-only">Buscar alumno o escribir un nombre</span>
        <Search className="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden />
        <input
          autoFocus
          className="w-full rounded-xl border border-linea bg-white py-3 pr-3.5 pl-11 focus:border-cancha focus:ring-2 focus:ring-cancha/20 focus:outline-none"
          placeholder="Alumno, o el nombre de un rival"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </label>

      {nombre && (
        <button
          type="button"
          onClick={() => onElegir({ alumno_id: null, nombre })}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-cancha/50 px-3.5 py-3 text-left"
        >
          <span className="grid size-8 place-items-center rounded-full bg-white text-tinta-suave">
            <UserRound className="size-4" aria-hidden />
          </span>
          <span>
            <span className="block font-medium text-cancha">Usar «{nombre}»</span>
            <span className="block text-sm text-tinta-suave">Solo para este partido, no se agrega como alumno</span>
          </span>
        </button>
      )}

      {isPending ? (
        <Cargando />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-linea bg-white">
          {lista.length === 0 && (
            <li className="px-4 py-4 text-tinta-suave">
              {texto ? 'Ningún alumno con ese nombre.' : 'No hay alumnos para elegir. Escribí un nombre.'}
            </li>
          )}
          {lista.map((a) => (
            <li key={a.id} className="border-b border-linea last:border-b-0">
              <button
                type="button"
                onClick={() => onElegir({ alumno_id: a.id, nombre: a.nombre })}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-fondo"
              >
                <Avatar nombre={a.nombre} tam="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.nombre}</span>
                  {a.nivel && <span className="block text-sm text-tinta-suave">{textoNivel(a.nivel)}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Hoja>
  )
}
