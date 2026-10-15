import { useState } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { useAgenda } from '../api/agenda'
import { useProfe } from '../api/profe'
import { MarcaCancha } from '../components/MarcaCancha'
import { SwitchPelota } from '../components/SwitchPelota'
import { Boton, Cargando, ErrorCarga, Vacio } from '../components/ui'
import { NuevaClaseHoja } from '../features/agenda/NuevaClaseHoja'
import { SesionCard } from '../features/agenda/SesionCard'
import { SesionHoja } from '../features/agenda/SesionHoja'
import { Bienvenida } from '../features/bienvenida/Bienvenida'
import { iniciales } from '../lib/etiquetas'
import { fechaLarga, hora, hoyIso, minutos } from '../lib/fechas'
import { useTema } from '../lib/tema'

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
  const tema = useTema()

  const activas = (sesiones ?? []).filter((s) => s.estado !== 'cancelada')
  const alumnos = new Set(activas.flatMap((s) => s.asistencias.map((a) => a.alumno_id))).size
  const ahora = new Date().getHours() * 60 + new Date().getMinutes()
  const proxima = activas.find((s) => minutos(s.hora) + s.duracion_min > ahora)
  const sesionAbierta = sesiones?.find((s) => s.id === abierta) ?? null
  const primerNombre = profe?.nombre.split(' ')[0]

  return (
    <>
      <MarcaCancha>
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-xl font-bold tracking-tight">padelito</span>
          <div className="flex shrink-0 items-center gap-2">
            <SwitchPelota noche={tema.tema === 'noche'} onCambiar={(noche, origen) => tema.cambiar(noche ? 'noche' : 'azul', origen)} />
            <button
              onClick={() => setNueva(true)}
              className="vidrio flex h-11 items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3.5 font-semibold hover:bg-white/25 max-[374px]:px-2.5"
            >
              <Plus className="size-5" aria-hidden />
              <span className="max-[374px]:sr-only">Clase</span>
            </button>
            <Link
              to="/perfil"
              className="vidrio grid size-11 place-items-center rounded-full border border-white/45 bg-white/20 font-semibold"
              aria-label="Tu perfil"
            >
              {profe ? iniciales(profe.nombre) : ''}
            </Link>
          </div>
        </div>
        <p className="mt-7 text-white/85 first-letter:uppercase">{fechaLarga(new Date())}</p>
        <h1 className="mt-1.5 font-display text-[36px] leading-[1.05] font-bold tracking-tight">
          {primerNombre ? (
            <>
              Hola,
              <br />
              {primerNombre}
            </>
          ) : (
            'Hoy'
          )}
        </h1>
        {sesiones && (
          <p className="vidrio mt-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3.5 py-2 text-[15px] font-medium">
            <span className="size-2 rounded-full bg-pelota" aria-hidden />
            {resumen(activas.length, alumnos)}
            {proxima && `. ${minutos(proxima.hora) <= ahora ? 'Ahora' : 'Próxima'} ${hora(proxima.hora)}`}
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
