import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Check, MapPin, NotebookPen, Repeat, Target, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  useBorrarSesion,
  useEstadoSesion,
  useQuitarAlumno,
  useSumarAlumno,
  useTerminarClase,
} from '../../api/agenda'
import { usePreparacion } from '../../api/seguimiento'
import { Avatar, Boton, Hoja } from '../../components/ui'
import { deIso, fechaCorta, fechaLarga, hora, horaFin, NOMBRE_DIA, diaSemana } from '../../lib/fechas'
import { mensajeError } from '../../lib/supabase'
import type { Sesion } from '../../lib/tipos'
import { ElegirAlumnos } from '../alumnos/ElegirAlumnos'
import { NotaHoja } from '../seguimiento/NotaHoja'
import { ESTADOS_FOCO, textoTipoNota } from '../seguimiento/catalogo'
import type { Preparacion } from '../seguimiento/preparacion'

/** Lo que conviene tener presente de un alumno antes de esta clase. */
function Pendientes({ prep }: { prep: Preparacion | undefined }) {
  if (!prep || (prep.ultimaClase.length === 0 && prep.focos.length === 0)) return null
  return (
    <div className="mt-1.5 ml-11 flex flex-col gap-2 pb-1 text-[14px] leading-snug">
      {prep.ultimaClase.length > 0 && prep.ultimaFecha && (
        <div>
          <p className="text-[12px] font-semibold text-tinta-suave">Última clase, {fechaCorta(deIso(prep.ultimaFecha))}</p>
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {prep.ultimaClase.slice(0, 3).map((n) => (
              <li key={n.id} className="flex gap-1.5">
                {n.tipo === 'avance' ? (
                  <Check className="mt-0.5 size-3.5 shrink-0 text-acento" aria-hidden />
                ) : (
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-acento" aria-hidden />
                )}
                <span>
                  <span className="sr-only">{textoTipoNota(n.tipo!)}: </span>
                  {n.texto}
                  {n.tipo === 'error' && <span className="text-tinta-suave"> · se repite</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {prep.focos.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-tinta-suave">Focos</p>
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {prep.focos.slice(0, 3).map((f) => (
              <li key={f.id} className="flex gap-1.5">
                <Target className="mt-0.5 size-3.5 shrink-0 text-acento" aria-hidden />
                <span>
                  {f.texto}
                  <span className="text-tinta-suave"> · {ESTADOS_FOCO.find((e) => e.valor === f.estado)?.texto.toLowerCase()}</span>
                </span>
              </li>
            ))}
            {prep.focos.length > 3 && <li className="text-tinta-suave">y {prep.focos.length - 3} más en su ficha</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Botón que pide un segundo toque antes de hacer algo que no se puede deshacer. */
function BotonConfirmar({ children, confirmar, onConfirmar, cargando }: {
  children: string
  confirmar: string
  onConfirmar: () => void
  cargando?: boolean
}) {
  const [armado, setArmado] = useState(false)
  useEffect(() => {
    if (!armado) return
    const t = setTimeout(() => setArmado(false), 4000)
    return () => clearTimeout(t)
  }, [armado])
  return (
    <Boton variante="peligro" ancho cargando={cargando} onClick={() => (armado ? onConfirmar() : setArmado(true))}>
      {armado ? confirmar : children}
    </Boton>
  )
}

type Modo =
  | { tipo: 'ver' }
  | { tipo: 'sumar' }
  | { tipo: 'quitar'; alumnoId: string; nombre: string }
  | { tipo: 'nota'; alumnoId: string }

interface Props {
  sesion: Sesion | null
  onCerrar: () => void
}

export function SesionHoja({ sesion, onCerrar }: Props) {
  const [modo, setModo] = useState<Modo>({ tipo: 'ver' })
  const [elegido, setElegido] = useState<string[]>([])
  const [todasLasSemanas, setTodasLasSemanas] = useState(true)

  const estado = useEstadoSesion()
  const sumar = useSumarAlumno()
  const quitar = useQuitarAlumno()
  const terminar = useTerminarClase()
  const borrar = useBorrarSesion()
  const { data: preparacion } = usePreparacion(
    sesion?.asistencias.map((a) => a.alumno_id) ?? [],
    sesion?.fecha ?? '',
    Boolean(sesion) && sesion?.estado !== 'cancelada',
  )

  useEffect(() => {
    setModo({ tipo: 'ver' })
    setElegido([])
    setTodasLasSemanas(true)
  }, [sesion?.id])

  if (!sesion) return null
  const fija = Boolean(sesion.clase_id)
  const cancelada = sesion.estado === 'cancelada'
  const dia = NOMBRE_DIA[diaSemana(deIso(sesion.fecha))]?.toLowerCase()
  const alError = (e: unknown) => toast.error(mensajeError(e))

  function confirmarSumar() {
    const alumnoId = elegido[0]
    if (!sesion || !alumnoId) return
    sumar.mutate(
      { sesion, alumnoId, todasLasSemanas: fija && todasLasSemanas },
      { onSuccess: () => { setModo({ tipo: 'ver' }); setElegido([]) }, onError: alError },
    )
  }

  function confirmarQuitar(todas: boolean) {
    if (!sesion || modo.tipo !== 'quitar') return
    quitar.mutate(
      { sesion, alumnoId: modo.alumnoId, todasLasSemanas: todas },
      { onSuccess: () => setModo({ tipo: 'ver' }), onError: alError },
    )
  }

  // ─── Sumar alumno ───
  if (modo.tipo === 'sumar') {
    return (
      <Hoja
        abierta
        onCerrar={() => setModo({ tipo: 'ver' })}
        titulo="Sumar alumno"
        pie={
          <div className="flex flex-col gap-3">
            {fija && (
              <label className="flex items-center gap-3">
                <input type="checkbox" className="size-5 accent-primario" checked={todasLasSemanas} onChange={(e) => setTodasLasSemanas(e.target.checked)} />
                <span>Todos los {dia}, no solo esta clase</span>
              </label>
            )}
            <Boton ancho disabled={!elegido.length} cargando={sumar.isPending} onClick={confirmarSumar}>
              Sumar a la clase
            </Boton>
          </div>
        }
      >
        <ElegirAlumnos uno elegidos={elegido} onChange={setElegido} excluir={sesion.asistencias.map((a) => a.alumno_id)} />
      </Hoja>
    )
  }

  // ─── Nota para un alumno ───
  if (modo.tipo === 'nota') {
    return (
      <NotaHoja
        abierta
        onCerrar={() => setModo({ tipo: 'ver' })}
        alumnos={sesion.asistencias.filter((a) => a.alumno_id === modo.alumnoId).map((a) => a.alumno)}
        sesionId={sesion.id}
        fecha={sesion.fecha}
      />
    )
  }

  // ─── Quitar alumno ───
  if (modo.tipo === 'quitar') {
    return (
      <Hoja abierta onCerrar={() => setModo({ tipo: 'ver' })} titulo={`Sacar a ${modo.nombre}`}>
        <div className="flex flex-col gap-3">
          <p className="text-tinta-suave">
            {fija ? `¿Lo sacás solo de esta clase o de todos los ${dia}?` : 'Deja de figurar en esta clase.'}
          </p>
          <Boton variante="secundario" ancho cargando={quitar.isPending} onClick={() => confirmarQuitar(false)}>
            {fija ? 'Solo de esta clase' : 'Sacar de la clase'}
          </Boton>
          {fija && (
            <Boton variante="peligro" ancho cargando={quitar.isPending} onClick={() => confirmarQuitar(true)}>
              De todos los {dia}
            </Boton>
          )}
        </div>
      </Hoja>
    )
  }

  // ─── Detalle ───
  return (
    <Hoja abierta onCerrar={onCerrar} titulo={`${hora(sesion.hora)} a ${horaFin(sesion.hora, sesion.duracion_min)}`}>
      <div className="-mt-1 mb-5 flex flex-col gap-1 text-tinta-suave">
        <p className="first-letter:uppercase">{fechaLarga(deIso(sesion.fecha))}</p>
        <p className="flex items-center gap-1.5">
          {fija ? <><Repeat className="size-4" aria-hidden /> Clase fija, todos los {dia}</> : 'Clase suelta'}
        </p>
        {sesion.lugar && (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden /> {sesion.lugar}
          </p>
        )}
        {cancelada && <p className="font-semibold text-falta">Esta clase está cancelada.</p>}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-[17px] font-bold tracking-tight">Alumnos</h3>
        {!cancelada && (
          <button onClick={() => setModo({ tipo: 'sumar' })} className="flex h-10 items-center gap-1.5 rounded-lg px-2 font-semibold text-acento hover:bg-acento-suave">
            <UserPlus className="size-5" aria-hidden /> Sumar
          </button>
        )}
      </div>
      <ul className="mb-7 overflow-hidden rounded-xl vidrio border border-linea bg-superficie">
        {sesion.asistencias.length === 0 && <li className="px-4 py-4 text-tinta-suave">Nadie anotado todavía.</li>}
        {sesion.asistencias.map((a) => (
          <li key={a.alumno_id} className="border-b border-linea px-3.5 py-2 last:border-b-0">
            <div className="flex items-center gap-3">
              <Avatar nombre={a.alumno.nombre} tam="sm" />
              <Link to={`/alumnos/${a.alumno_id}`} onClick={onCerrar} className="min-w-0 flex-1 truncate font-medium hover:text-acento">
                {a.alumno.nombre}
              </Link>
              {!cancelada && (
                <button
                  onClick={() => setModo({ tipo: 'nota', alumnoId: a.alumno_id })}
                  className="grid size-9 place-items-center rounded-full text-acento hover:bg-acento-suave"
                  aria-label={`Nota para ${a.alumno.nombre}`}
                >
                  <NotebookPen className="size-4" />
                </button>
              )}
              {!cancelada && (
                <button
                  onClick={() => setModo({ tipo: 'quitar', alumnoId: a.alumno_id, nombre: a.alumno.nombre })}
                  className="grid size-9 place-items-center rounded-full text-tinta-suave hover:bg-linea/60"
                  aria-label={`Sacar a ${a.alumno.nombre}`}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {!cancelada && <Pendientes prep={preparacion?.get(a.alumno_id)} />}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        {cancelada ? (
          <Boton variante="secundario" ancho cargando={estado.isPending}
            onClick={() => estado.mutate({ sesionId: sesion.id, estado: 'programada' }, { onError: alError })}>
            Volver a programar
          </Boton>
        ) : (
          <Boton variante="secundario" ancho cargando={estado.isPending}
            onClick={() => estado.mutate({ sesionId: sesion.id, estado: 'cancelada' }, {
              onSuccess: () => toast('Clase cancelada'), onError: alError,
            })}>
            Cancelar solo esta clase
          </Boton>
        )}
        {fija ? (
          <BotonConfirmar
            confirmar="Tocá de nuevo para confirmar"
            cargando={terminar.isPending}
            onConfirmar={() => terminar.mutate({ claseId: sesion.clase_id!, desde: sesion.fecha }, {
              onSuccess: () => { toast.success('La clase ya no se repite'); onCerrar() }, onError: alError,
            })}
          >
            {`No repetir más desde esta fecha`}
          </BotonConfirmar>
        ) : (
          <BotonConfirmar
            confirmar="Tocá de nuevo para borrar"
            cargando={borrar.isPending}
            onConfirmar={() => borrar.mutate(sesion.id, {
              onSuccess: () => { toast.success('Clase borrada'); onCerrar() }, onError: alError,
            })}
          >
            Borrar clase
          </BotonConfirmar>
        )}
      </div>
    </Hoja>
  )
}
