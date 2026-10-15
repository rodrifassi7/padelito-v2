import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { useAlumnos } from '../api/alumnos'
import { Avatar, Boton, Cargando, ErrorCarga, Titulo, Vacio } from '../components/ui'
import { AlumnoHoja } from '../features/alumnos/AlumnoHoja'
import { textoNivel } from '../lib/etiquetas'

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function AlumnosPage() {
  const { data: alumnos, isPending, isError, refetch } = useAlumnos()
  const [busqueda, setBusqueda] = useState('')
  const [verInactivos, setVerInactivos] = useState(false)
  const [params] = useSearchParams()
  const desdeBienvenida = params.get('desde') === 'bienvenida'
  const [nuevo, setNuevo] = useState(desdeBienvenida)
  const navegar = useNavigate()

  const inactivos = (alumnos ?? []).filter((a) => !a.activo).length
  const lista = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return (alumnos ?? []).filter((a) => a.activo !== verInactivos && (!q || normalizar(a.nombre).includes(q)))
  }, [alumnos, busqueda, verInactivos])

  return (
    <div className="px-4">
      <Titulo
        accion={
          alumnos && alumnos.length > 0 ? (
            <Boton className="h-10 px-4" onClick={() => setNuevo(true)}>
              <Plus className="size-5" aria-hidden /> Alumno
            </Boton>
          ) : undefined
        }
      >
        Alumnos
      </Titulo>

      {alumnos && alumnos.length > 0 && (
        <label className="relative mb-4 block">
          <span className="sr-only">Buscar alumno</span>
          <Search className="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden />
          <input
            className="w-full rounded-xl vidrio border border-linea bg-superficie py-3 pr-3.5 pl-11 focus:border-primario focus:ring-2 focus:ring-primario/30 focus:outline-none"
            placeholder="Buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
      )}

      {isPending && <Cargando />}
      {isError && <ErrorCarga onReintentar={() => refetch()} />}
      {alumnos && alumnos.length === 0 && (
        <Vacio
          titulo="Cargá tu primer alumno"
          texto="Con nombre alcanza para empezar. El resto de la ficha la completás cuando quieras."
          accion={<Boton onClick={() => setNuevo(true)}>Agregar alumno</Boton>}
        />
      )}
      {alumnos && alumnos.length > 0 && lista.length === 0 && (
        <p className="py-8 text-center text-tinta-suave">Nadie con ese nombre.</p>
      )}

      {lista.length > 0 && (
        <ul className="overflow-hidden rounded-2xl vidrio border border-linea bg-superficie">
          {lista.map((a) => (
            <li key={a.id} className="border-b border-linea last:border-b-0">
              <Link to={`/alumnos/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                <Avatar nombre={a.nombre} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{a.nombre}</span>
                  <span className="block truncate text-sm text-tinta-suave">
                    {[textoNivel(a.nivel), a.categoria].filter(Boolean).join(', ') || 'Sin nivel cargado'}
                  </span>
                </span>
                <ChevronRight className="size-5 text-tinta-suave" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {inactivos > 0 && (
        <button onClick={() => setVerInactivos(!verInactivos)} className="mx-auto mt-5 block h-10 px-3 font-medium text-acento">
          {verInactivos ? 'Ver alumnos activos' : `Ver inactivos (${inactivos})`}
        </button>
      )}


      <AlumnoHoja abierta={nuevo} onCerrar={() => setNuevo(false)} onGuardado={(a) => navegar(desdeBienvenida ? '/' : `/alumnos/${a.id}`, { replace: desdeBienvenida })} />
    </div>
  )
}
