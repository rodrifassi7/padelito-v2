import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { differenceInYears, subWeeks } from 'date-fns'
import clsx from 'clsx'
import { ChevronLeft, MessageCircle, Pencil, Repeat } from 'lucide-react'
import { useAlumno, useAsistenciaDeAlumno, useClasesDeAlumno, type RegistroAsistencia } from '../api/alumnos'
import { Avatar, Boton, Cargando, ErrorCarga, Seccion } from '../components/ui'
import { AlumnoHoja } from '../features/alumnos/AlumnoHoja'
import { ASISTENCIA, linkWhatsapp, MANOS, MODALIDADES, pesos, POSICIONES, textoNivel } from '../lib/etiquetas'
import { deIso, fechaCorta, hora, hoyIso, iso, NOMBRE_DIA } from '../lib/fechas'
import type { EstadoAsistencia } from '../lib/tipos'

const COLOR: Record<EstadoAsistencia, string> = {
  presente: 'bg-pelota text-tinta',
  ausente: 'bg-falta text-white',
  aviso: 'bg-aviso-clara text-aviso',
  pendiente: 'bg-linea text-tinta-suave',
}

function estadoDe(r: RegistroAsistencia): EstadoAsistencia | 'cancelada' {
  if (r.estado === 'cancelada') return 'cancelada'
  return r.asistencias[0]?.estado ?? 'pendiente'
}

function Asistencia({ alumnoId }: { alumnoId: string }) {
  const hoy = hoyIso()
  const { data, isPending } = useAsistenciaDeAlumno(alumnoId, hoy)
  if (isPending) return <Cargando />
  const registros = (data ?? []).filter((r) => r.estado !== 'cancelada')
  if (!registros.length) return <p className="text-tinta-suave">Todavía no tuvo clases.</p>

  const desde = iso(subWeeks(new Date(), 8))
  const recientes = registros.filter((r) => r.fecha >= desde)
  const cuenta = (e: EstadoAsistencia) => recientes.filter((r) => estadoDe(r) === e).length
  const marcadas = recientes.filter((r) => estadoDe(r) !== 'pendiente').length
  const vino = cuenta('presente')

  return (
    <>
      {marcadas > 0 && (
        <p className="mb-3">
          Vino a <strong className="font-display text-2xl tabular">{vino}</strong> de {marcadas} clases en las últimas 8 semanas
          {cuenta('aviso') > 0 && <span className="text-tinta-suave"> (avisó {cuenta('aviso')} veces)</span>}.
        </p>
      )}
      <ul className="overflow-hidden rounded-2xl border border-linea bg-white">
        {(data ?? []).slice(0, 10).map((r) => {
          const e = estadoDe(r)
          return (
            <li key={r.id} className="flex items-center justify-between border-b border-linea px-4 py-2.5 last:border-b-0">
              <span className="tabular">
                {fechaCorta(deIso(r.fecha))} <span className="text-tinta-suave">{hora(r.hora)}</span>
              </span>
              <span className={clsx('rounded-md px-2 py-0.5 text-sm font-semibold', e === 'cancelada' ? 'text-tinta-suave line-through' : COLOR[e])}>
                {e === 'cancelada' ? 'Cancelada' : e === 'pendiente' ? 'Sin marcar' : ASISTENCIA[e]}
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function ClasesFijas({ alumnoId }: { alumnoId: string }) {
  const { data, isPending } = useClasesDeAlumno(alumnoId, hoyIso())
  if (isPending) return <Cargando />
  if (!data?.length) return <p className="text-tinta-suave">No tiene clases fijas. Se suma desde la agenda.</p>
  return (
    <ul className="flex flex-col gap-2">
      {data.map((c) => {
        const otros = c.clase_alumnos.map((x) => x.alumno).filter((a) => a.id !== alumnoId)
        return (
          <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-linea bg-white px-4 py-3">
            <Repeat className="size-5 shrink-0 text-cancha" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {NOMBRE_DIA[c.dia_semana]} {hora(c.hora)}
              </span>
              <span className="block truncate text-sm text-tinta-suave">
                {otros.length ? `Con ${otros.map((o) => o.nombre.split(' ')[0]).join(', ')}` : 'Individual'}
                {c.lugar && `, en ${c.lugar}`}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function AlumnoPage() {
  const { id = '' } = useParams()
  const { data: a, isPending, isError, refetch } = useAlumno(id)
  const [editar, setEditar] = useState(false)

  if (isPending) return <Cargando pantalla />
  if (isError || !a) return <ErrorCarga onReintentar={() => refetch()} />

  const datos = [
    ['Mano', MANOS.find((m) => m.valor === a.mano)?.texto],
    ['Juega de', POSICIONES.find((p) => p.valor === a.posicion)?.texto],
    ['Edad', a.fecha_nacimiento ? `${differenceInYears(new Date(), deIso(a.fecha_nacimiento))} años` : null],
    [
      'Paga',
      `${MODALIDADES.find((m) => m.valor === a.modalidad_pago)?.texto}${a.tarifa ? `, ${pesos(a.tarifa)}` : ''}`,
    ],
  ].filter((d): d is [string, string] => Boolean(d[1]))

  return (
    <div className="px-4">
      <div className="flex items-center justify-between pt-3">
        <Link to="/alumnos" className="-ml-2 flex h-10 items-center gap-1 rounded-lg px-2 font-medium text-cancha">
          <ChevronLeft className="size-5" aria-hidden /> Alumnos
        </Link>
        <button onClick={() => setEditar(true)} className="flex h-10 items-center gap-1.5 rounded-lg px-2 font-medium text-cancha">
          <Pencil className="size-4" aria-hidden /> Editar
        </button>
      </div>

      <header className="flex items-center gap-4 pt-3">
        <Avatar nombre={a.nombre} tam="lg" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight font-semibold">{a.nombre}</h1>
          <p className="text-tinta-suave">
            {[textoNivel(a.nivel), a.categoria].filter(Boolean).join(', ') || 'Sin nivel cargado'}
            {!a.activo && <span className="ml-2 font-semibold text-falta">Inactivo</span>}
          </p>
        </div>
      </header>

      {a.telefono && (
        <Boton
          variante="secundario"
          ancho
          className="mt-5"
          onClick={() => window.open(linkWhatsapp(a.telefono!), '_blank', 'noopener')}
        >
          <MessageCircle className="size-5" aria-hidden /> Escribirle por WhatsApp
        </Boton>
      )}

      {a.objetivo && (
        <div className="mt-5 rounded-2xl bg-cancha px-4 py-3.5 text-white">
          <p className="text-sm text-white/75">Quiere lograr</p>
          <p className="text-lg leading-snug">{a.objetivo}</p>
        </div>
      )}

      <Seccion titulo="Clases fijas">
        <ClasesFijas alumnoId={a.id} />
      </Seccion>

      <Seccion titulo="Asistencia">
        <Asistencia alumnoId={a.id} />
      </Seccion>

      <Seccion titulo="Ficha">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-linea bg-linea">
          {datos.map(([k, v]) => (
            <div key={k} className="bg-white px-4 py-3">
              <dt className="text-sm text-tinta-suave">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
          {datos.length % 2 === 1 && <div className="bg-white" />}
        </dl>
        {a.notas && <p className="mt-3 rounded-2xl border border-linea bg-white px-4 py-3 whitespace-pre-line">{a.notas}</p>}
      </Seccion>

      <AlumnoHoja abierta={editar} onCerrar={() => setEditar(false)} alumno={a} />
    </div>
  )
}
