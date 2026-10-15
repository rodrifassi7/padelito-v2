import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useCrearClase } from '../../api/agenda'
import { useProfe } from '../../api/profe'
import { Boton, Campo, Hoja, Opciones } from '../../components/ui'
import { deIso, diaSemana, fechaLarga, NOMBRE_DIA } from '../../lib/fechas'
import { mensajeError } from '../../lib/supabase'
import { ElegirAlumnos } from '../alumnos/ElegirAlumnos'

const DURACIONES = [
  { valor: '60', texto: '1 h' },
  { valor: '90', texto: '1 h 30' },
  { valor: '120', texto: '2 h' },
]

function proximaHora() {
  const h = Math.min(new Date().getHours() + 1, 22)
  return `${String(h).padStart(2, '0')}:00`
}

interface Props {
  abierta: boolean
  onCerrar: () => void
  fecha: string
  /** Se llama después de crear la clase (además de cerrar la hoja). */
  onCreada?: () => void
}

export function NuevaClaseHoja({ abierta, onCerrar, fecha: fechaInicial, onCreada }: Props) {
  const crear = useCrearClase()
  const { data: profe } = useProfe()
  const [fecha, setFecha] = useState(fechaInicial)
  const [hora, setHora] = useState(proximaHora)
  const [duracion, setDuracion] = useState('60')
  const [lugar, setLugar] = useState('')
  const [alumnos, setAlumnos] = useState<string[]>([])
  const [repetir, setRepetir] = useState(true)

  useEffect(() => {
    if (!abierta) return
    setFecha(fechaInicial)
    setHora(proximaHora())
    setAlumnos([])
    setRepetir(true)
    setLugar(profe?.club ?? '')
  }, [abierta, fechaInicial, profe?.club])

  function enviar(e: FormEvent) {
    e.preventDefault()
    crear.mutate(
      { fecha, hora, duracion_min: Number(duracion), lugar: lugar.trim() || null, alumnoIds: alumnos, repetir },
      {
        onSuccess: () => {
          // Decir dónde quedó, para que se encuentre en Hoy o en la Agenda.
          const cuando = repetir ? `todos los ${dia} a las ${hora}` : `${fechaLarga(deIso(fecha))}, ${hora}`
          toast.success(repetir ? `Clase fija: ${cuando}` : `Clase creada: ${cuando}`)
          onCerrar()
          onCreada?.()
        },
        onError: (err) => toast.error(mensajeError(err)),
      },
    )
  }

  const dia = fecha ? NOMBRE_DIA[diaSemana(deIso(fecha))]?.toLowerCase() : ''

  return (
    <Hoja
      abierta={abierta}
      onCerrar={onCerrar}
      titulo="Nueva clase"
      pie={
        <Boton type="submit" form="nueva-clase" ancho cargando={crear.isPending}>
          Crear clase{alumnos.length > 0 && ` con ${alumnos.length} ${alumnos.length === 1 ? 'alumno' : 'alumnos'}`}
        </Boton>
      }
    >
      <form id="nueva-clase" onSubmit={enviar} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Día">
            {(id, c) => <input id={id} className={c} type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />}
          </Campo>
          <Campo etiqueta="Hora">
            {(id, c) => <input id={id} className={c} type="time" required step={300} value={hora} onChange={(e) => setHora(e.target.value)} />}
          </Campo>
        </div>

        <Opciones etiqueta="Duración" opciones={DURACIONES} valor={duracion} onChange={(v) => v && setDuracion(v)} />

        <label className="flex items-center justify-between gap-4 rounded-xl border border-linea bg-white px-4 py-3">
          <span>
            <span className="block font-medium">Se repite todas las semanas</span>
            <span className="block text-sm text-tinta-suave">
              {repetir ? `Todos los ${dia} a las ${hora}` : 'Clase de una sola vez'}
            </span>
          </span>
          <input
            type="checkbox"
            className="size-6 accent-cancha"
            checked={repetir}
            onChange={(e) => setRepetir(e.target.checked)}
          />
        </label>

        <Campo etiqueta="Lugar">
          {(id, c) => <input id={id} className={c} placeholder="Club o cancha" value={lugar} onChange={(e) => setLugar(e.target.value)} />}
        </Campo>

        <div>
          <p className="mb-1.5 text-sm font-medium text-tinta-suave">Alumnos</p>
          <ElegirAlumnos elegidos={alumnos} onChange={setAlumnos} />
        </div>
      </form>
    </Hoja>
  )
}
