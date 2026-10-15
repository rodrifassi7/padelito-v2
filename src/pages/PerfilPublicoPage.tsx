import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Check, Target } from 'lucide-react'
import { FondoCancha, MarcaCancha } from '../components/MarcaCancha'
import { Cargando } from '../components/ui'
import { textoNivel } from '../lib/etiquetas'
import { deIso, fechaCorta } from '../lib/fechas'
import { datos, supabase } from '../lib/supabase'
import type { Area, EstadoFoco, Evaluacion, Nivel } from '../lib/tipos'
import { estadisticas } from '../features/partido/estadisticas'
import { ResumenEstadisticas } from '../features/partido/ResumenEstadisticas'
import { textoGolpe } from '../features/partido/golpes'
import type { TipoPunto } from '../features/partido/tipos'
import { textoArea } from '../features/seguimiento/catalogo'
import { VistaEvaluacion } from '../features/seguimiento/Evaluacion'

interface PerfilPublico {
  alumno: { nombre: string; nivel: Nivel | null; categoria: string | null; objetivo: string | null }
  profe: { nombre: string; club: string | null }
  focos: { titulo: string; detalle: string | null; area: Area; golpe: string | null; estado: EstadoFoco; logrado_en: string | null }[]
  evaluaciones: { fecha: string; items: { habilidad: string; puntaje: number }[] }[]
  partidos: { cantidad: number; puntos: { tipo: TipoPunto; golpe: string | null; cantidad: number }[] }
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-bold tracking-tight">{titulo}</h2>
      {children}
    </section>
  )
}

/** Página que ve el alumno con su link. No necesita cuenta. */
export function PerfilPublicoPage() {
  const { token = '' } = useParams()
  const { data, isPending, isError } = useQuery({
    queryKey: ['publico', token],
    queryFn: async () => datos(await supabase.rpc('perfil_publico', { p_token: token })) as PerfilPublico | null,
    retry: false,
  })

  if (isPending) return <Cargando pantalla />
  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 px-6">
        <h1 className="font-display text-[23px] font-bold tracking-tight">Este link no funciona</h1>
        <p className="text-tinta-suave">Puede que tu profe haya generado uno nuevo. Pedile que te lo vuelva a mandar.</p>
      </div>
    )
  }

  const { alumno, profe, focos, evaluaciones, partidos } = data
  const trabajando = focos.filter((f) => f.estado !== 'logrado')
  const logrados = focos.filter((f) => f.estado === 'logrado')
  const [ultima, anterior] = evaluaciones as unknown as Evaluacion[]
  // Los puntos llegan agrupados: se expanden para reusar las mismas estadísticas.
  const puntos = partidos.puntos.flatMap((p) => Array.from({ length: p.cantidad }, () => ({ tipo: p.tipo, golpe: p.golpe })))

  return (
    <div className="relative isolate mx-auto min-h-dvh max-w-lg pb-16">
      <FondoCancha />
      <MarcaCancha>
        <p className="text-white/80">
          Con {profe.nombre}
          {profe.club && `, ${profe.club}`}
        </p>
        <h1 className="mt-10 font-display text-[36px] leading-[1.05] font-bold tracking-tight">{alumno.nombre}</h1>
        {(alumno.nivel || alumno.categoria) && (
          <p className="mt-3 text-lg">{[textoNivel(alumno.nivel), alumno.categoria].filter(Boolean).join(', ')}</p>
        )}
      </MarcaCancha>

      <div className="px-4">
        {alumno.objetivo && (
          <div className="vidrio mt-6 rounded-2xl border border-linea bg-superficie-fuerte p-4">
            <p className="text-sm text-tinta-suave">Tu objetivo</p>
            <p className="text-xl leading-snug">{alumno.objetivo}</p>
          </div>
        )}

        <Bloque titulo="En qué estamos trabajando">
          {trabajando.length === 0 ? (
            <p className="text-tinta-suave">Nada pendiente por ahora.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {trabajando.map((f, i) => (
                <li key={i} className="flex gap-3 rounded-2xl vidrio border border-linea bg-superficie p-4">
                  <Target className="mt-0.5 size-5 shrink-0 text-acento" aria-hidden />
                  <div>
                    <p className="font-semibold leading-snug">{f.titulo}</p>
                    {f.detalle && <p className="mt-1 leading-snug text-tinta-suave">{f.detalle}</p>}
                    <p className="mt-1 text-sm text-tinta-suave">
                      {[textoArea(f.area), f.golpe && textoGolpe(f.golpe).toLowerCase()].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        {logrados.length > 0 && (
          <Bloque titulo="Lo que ya lograste">
            <ul className="overflow-hidden rounded-2xl vidrio border border-linea bg-superficie">
              {logrados.map((f, i) => (
                <li key={i} className="flex items-center gap-3 border-b border-linea px-4 py-3 last:border-b-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pelota text-noche">
                    <Check className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">{f.titulo}</span>
                  {f.logrado_en && <span className="text-sm text-tinta-suave tabular">{fechaCorta(deIso(f.logrado_en))}</span>}
                </li>
              ))}
            </ul>
          </Bloque>
        )}

        {ultima && (
          <Bloque titulo="Tu evaluación">
            <div className="rounded-2xl vidrio border border-linea bg-superficie p-4">
              <p className="mb-4 text-tinta-suave">
                Del {fechaCorta(deIso(ultima.fecha))}
                {anterior && <>, con lo que cambió desde el {fechaCorta(deIso(anterior.fecha))}</>}. De 1 (inicial) a 5 (muy bueno).
              </p>
              <VistaEvaluacion ultima={ultima} anterior={anterior} />
            </div>
          </Bloque>
        )}

        {partidos.cantidad > 0 && puntos.length > 0 && (
          <Bloque titulo="En partidos">
            <ResumenEstadisticas
              e={estadisticas(puntos)}
              encabezado={<p className="mb-3 text-tinta-suave">{partidos.cantidad === 1 ? 'En 1 partido' : `En ${partidos.cantidad} partidos`}</p>}
            />
          </Bloque>
        )}

        <p className="mt-12 text-center text-sm text-tinta-suave">
          Hecho con <span className="font-display text-base font-bold text-tinta tracking-tight">padelito</span>
        </p>
      </div>
    </div>
  )
}
