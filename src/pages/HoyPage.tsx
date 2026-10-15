import { useState } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { useAgenda } from '../api/agenda'
import { useProfe } from '../api/profe'
import { MarcaCancha } from '../components/MarcaCancha'
import { Boton, Cargando, ErrorCarga, Vacio } from '../components/ui'
import { NuevaClaseHoja } from '../features/agenda/NuevaClaseHoja'
import { SesionCard } from '../features/agenda/SesionCard'
import { SesionHoja } from '../features/agenda/SesionHoja'
import { Bienvenida } from '../features/bienvenida/Bienvenida'
import { iniciales } from '../lib/etiquetas'
import { fechaLarga, hora, hoyIso, minutos } from '../lib/fechas'

function resumen(clases: number, alumnos: number) {
  if (clases === 0) return 'Sin clases hoy'
  const c = clases === 1 ? '1 clase' : `${clases} clases`
  const a = alumnos === 1 ? '1 alumno' : `${alumnos} alumnos`
  return `${c} y ${a}`
}

export function HoyPage() {
  const hoy = hoyIso()
  const { data: sesiones, isPending, isError, refetch } = useAgenda(hoy, hoy)
  const { data: profe } = useProfe()
  const [abierta, setAbierta] = useState<string | null>(null)
  const [nueva, setNueva] = useState(false)

  const activas = (sesiones ?? []).filter((s) => s.estado !== 'cancelada')
  const alumnos = new Set(activas.flatMap((s) => s.asistencias.map((a) => a.alumno_id))).size
  const ahora = new Date().getHours() * 60 + new Date().getMinutes()
  const proxima = activas.find((s) => minutos(s.hora) + s.duracion_min > ahora)
  const sesionAbierta = sesiones?.find((s) => s.id === abierta) ?? null
  const primerNombre = profe?.nombre.split(' ')[0]

  return (
    <>
      <MarcaCancha>
        <div className="flex items-start justify-between gap-3">
          <p className="pt-2 text-white/80 first-letter:uppercase">{fechaLarga(new Date())}</p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setNueva(true)}
              className="flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-4 font-semibold hover:bg-white/25"
            >
              <Plus className="size-5" aria-hidden /> Clase
            </button>
            <Link
              to="/perfil"
              className="grid size-10 place-items-center rounded-full bg-white font-display text-lg font-semibold text-cancha"
              aria-label="Tu perfil"
            >
              {profe ? iniciales(profe.nombre) : ''}
            </Link>
          </div>
        </div>
        <h1 className="mt-1 font-display text-5xl leading-none font-semibold">
          {primerNombre ? `Hola, ${primerNombre}` : 'Hoy'}
        </h1>
        {sesiones && (
          <p className="mt-4 text-lg">
            {resumen(activas.length, alumnos)}
            {proxima && (
              <>
                <br />
                <span className="text-pelota">
                  {minutos(proxima.hora) <= ahora ? 'Ahora' : 'Próxima'} a las {hora(proxima.hora)}
                </span>
              </>
            )}
          </p>
        )}
      </MarcaCancha>

      <div className="px-4 pt-5">
        <Bienvenida />
        {isPending && <Cargando />}
        {isError && <ErrorCarga onReintentar={() => refetch()} />}
        {sesiones && sesiones.length === 0 && (
          <Vacio
            titulo="No tenés clases hoy"
            texto="Agendá una clase suelta o armá tus clases fijas de la semana."
            accion={<Boton onClick={() => setNueva(true)}>Agendar clase</Boton>}
          />
        )}
        <div className="flex flex-col gap-3">
          {sesiones?.map((s) => <SesionCard key={s.id} sesion={s} onAbrir={() => setAbierta(s.id)} />)}
        </div>
      </div>


      <NuevaClaseHoja abierta={nueva} onCerrar={() => setNueva(false)} fecha={hoy} />
      <SesionHoja sesion={sesionAbierta} onCerrar={() => setAbierta(null)} />
    </>
  )
}
