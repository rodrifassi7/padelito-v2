import { useEffect, useMemo, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCrearNota, useNotasDeSesion } from '../../api/seguimiento'
import { Boton, Campo, Hoja, Opciones } from '../../components/ui'
import { mensajeError } from '../../lib/supabase'
import type { AlumnoBreve, Area, TipoNota } from '../../lib/tipos'
import { GOLPES } from '../partido/golpes'
import { AREAS, TIPOS_NOTA } from './catalogo'

const GOLPES_NOTA = GOLPES.filter((g) => g.clave !== 'smash_x3' && g.clave !== 'smash_x4').map((g) => ({ valor: g.clave as string, texto: g.texto }))

const AYUDA: Record<TipoNota, string> = {
  a_mejorar: 'Ej: llega tarde a la volea, tiene que hacer el split antes',
  avance: 'Ej: ya sale bien de la pared de revés',
  error: 'Ej: sigue abriendo la pala en la bandeja',
}

interface Props {
  abierta: boolean
  onCerrar: () => void
  alumnos: AlumnoBreve[]
  inicial?: string
  sesionId: string | null
  fecha: string
}

/** Nota rápida después de la clase. Con varios alumnos, va pasando de uno a otro. */
export function NotaHoja({ abierta, onCerrar, alumnos, inicial, sesionId, fecha }: Props) {
  const crear = useCrearNota()
  const { data: yaAnotados } = useNotasDeSesion(abierta ? sesionId : null)
  const [alumnoId, setAlumnoId] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoNota>('a_mejorar')
  const [area, setArea] = useState<Area>('tecnica')
  const [golpe, setGolpe] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [foco, setFoco] = useState(true)
  const [anotadosAhora, setAnotadosAhora] = useState<string[]>([])

  const anotados = useMemo(
    () => new Set([...(yaAnotados ?? []).map((n) => n.alumno_id), ...anotadosAhora]),
    [yaAnotados, anotadosAhora],
  )

  // Se depende de los ids (no del array) para no borrar lo escrito si la agenda se refresca de fondo.
  const ids = alumnos.map((a) => a.id).join(',')
  useEffect(() => {
    if (!abierta) return
    setAlumnoId(inicial ?? ids.split(',')[0] ?? null)
    setAnotadosAhora([])
    limpiar()
  }, [abierta, inicial, ids])

  function limpiar() {
    setTipo('a_mejorar')
    setArea('tecnica')
    setGolpe(null)
    setTexto('')
    setFoco(true)
  }

  const siguiente = alumnos.find((a) => a.id !== alumnoId && !anotados.has(a.id))
  const actual = alumnos.find((a) => a.id === alumnoId)

  function guardar(e: FormEvent) {
    e.preventDefault()
    if (!alumnoId || !texto.trim()) return
    crear.mutate(
      { alumno_id: alumnoId, sesion_id: sesionId, fecha, area, golpe, tipo, texto: texto.trim(), crearFoco: foco && tipo !== 'avance' },
      {
        onSuccess: () => {
          toast.success(`Nota para ${actual?.nombre.split(' ')[0] ?? 'el alumno'} guardada`)
          setAnotadosAhora((x) => [...x, alumnoId])
          if (siguiente) {
            setAlumnoId(siguiente.id)
            limpiar()
          } else onCerrar()
        },
        onError: (err) => toast.error(mensajeError(err)),
      },
    )
  }

  return (
    <Hoja
      abierta={abierta}
      onCerrar={onCerrar}
      titulo={alumnos.length > 1 ? 'Notas de la clase' : `Nota para ${actual?.nombre.split(' ')[0] ?? ''}`}
      pie={
        <Boton type="submit" form="nota" ancho disabled={!texto.trim()} cargando={crear.isPending}>
          {siguiente ? `Guardar y seguir con ${siguiente.nombre.split(' ')[0]}` : 'Guardar nota'}
        </Boton>
      }
    >
      <form id="nota" onSubmit={guardar} className="flex flex-col gap-5">
        {alumnos.length > 1 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label="Alumno">
            {alumnos.map((a) => {
              const activo = a.id === alumnoId
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => setAlumnoId(a.id)}
                  className={clsx(
                    'flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 font-medium',
                    activo ? 'border-cancha bg-cancha text-white' : 'border-linea bg-white',
                  )}
                >
                  {anotados.has(a.id) && <Check className="size-4" aria-hidden />}
                  {a.nombre.split(' ')[0]}
                  {anotados.has(a.id) && <span className="sr-only">, ya tiene nota</span>}
                </button>
              )
            })}
          </div>
        )}

        <Opciones etiqueta="Qué es" opciones={TIPOS_NOTA} valor={tipo} onChange={(v) => v && setTipo(v)} />

        <Campo etiqueta="Nota">
          {(id, c) => (
            <textarea id={id} className={c} rows={3} required placeholder={AYUDA[tipo]} value={texto} onChange={(e) => setTexto(e.target.value)} />
          )}
        </Campo>

        <Opciones etiqueta="Área" opciones={AREAS} valor={area} onChange={(v) => v && setArea(v)} />

        {(area === 'tecnica' || area === 'tactica') && (
          <Opciones etiqueta="Golpe (opcional)" opciones={GOLPES_NOTA} valor={golpe} onChange={setGolpe} permitirVacio />
        )}

        {tipo !== 'avance' && (
          <label className="flex items-center justify-between gap-4 rounded-xl border border-linea bg-white px-4 py-3">
            <span>
              <span className="block font-medium">Sumar a sus focos de trabajo</span>
              <span className="block text-sm text-tinta-suave">Queda en su lista hasta que lo marques como logrado. El alumno lo ve en su link; la nota queda solo para vos.</span>
            </span>
            <input type="checkbox" className="size-6 accent-cancha" checked={foco} onChange={(e) => setFoco(e.target.checked)} />
          </label>
        )}
      </form>
    </Hoja>
  )
}
