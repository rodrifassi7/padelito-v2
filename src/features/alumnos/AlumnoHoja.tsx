import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useGuardarAlumno } from '../../api/alumnos'
import { Boton, Campo, Hoja, Opciones } from '../../components/ui'
import { MANOS, MODALIDADES, NIVELES, POSICIONES } from '../../lib/etiquetas'
import { mensajeError } from '../../lib/supabase'
import type { Alumno, AlumnoForm } from '../../lib/tipos'

const VACIO: AlumnoForm = {
  nombre: '', telefono: null, nivel: null, categoria: null, mano: null, posicion: null, fecha_nacimiento: null,
  objetivo: null, notas: null, modalidad_pago: 'mensual', tarifa: null, activo: true,
}

interface Props {
  abierta: boolean
  onCerrar: () => void
  alumno?: Alumno
  onGuardado?: (a: Alumno) => void
}

/** Alta y edición de la ficha del alumno. */
export function AlumnoHoja({ abierta, onCerrar, alumno, onGuardado }: Props) {
  const guardar = useGuardarAlumno()
  const [f, setF] = useState<AlumnoForm>(VACIO)
  const [tarifa, setTarifa] = useState('')

  useEffect(() => {
    if (!abierta) return
    if (alumno) {
      const { id: _id, created_at: _c, token_publico: _t, ...resto } = alumno
      setF(resto)
      setTarifa(alumno.tarifa != null ? String(alumno.tarifa) : '')
    } else {
      setF(VACIO)
      setTarifa('')
    }
  }, [abierta, alumno])

  const set = <K extends keyof AlumnoForm>(k: K, v: AlumnoForm[K]) => setF((x) => ({ ...x, [k]: v }))
  const texto = (v: string) => (v.trim() ? v.trim() : null)

  function enviar(e: FormEvent) {
    e.preventDefault()
    const monto = tarifa.replace(/\D/g, '')
    guardar.mutate(
      {
        ...f,
        id: alumno?.id,
        nombre: f.nombre.trim(),
        telefono: texto(f.telefono ?? ''),
        categoria: texto(f.categoria ?? ''),
        objetivo: texto(f.objetivo ?? ''),
        notas: texto(f.notas ?? ''),
        tarifa: monto ? Number(monto) : null,
      },
      {
        onSuccess: (a) => {
          toast.success(alumno ? 'Cambios guardados' : `${a.nombre} agregado`)
          onGuardado?.(a)
          onCerrar()
        },
        onError: (err) => toast.error(mensajeError(err)),
      },
    )
  }

  return (
    <Hoja
      abierta={abierta}
      onCerrar={onCerrar}
      titulo={alumno ? 'Editar ficha' : 'Nuevo alumno'}
      pie={
        <Boton type="submit" form="ficha-alumno" ancho cargando={guardar.isPending}>
          {alumno ? 'Guardar cambios' : 'Agregar alumno'}
        </Boton>
      }
    >
      <form id="ficha-alumno" onSubmit={enviar} className="flex flex-col gap-5">
        <Campo etiqueta="Nombre y apellido">
          {(id, c) => <input id={id} className={c} required autoComplete="off" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />}
        </Campo>
        <Campo etiqueta="WhatsApp" ayuda="Con código de área, sin 0 ni 15. Ej: 351 555 1234">
          {(id, c) => (
            <input id={id} className={c} type="tel" inputMode="tel" value={f.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} />
          )}
        </Campo>

        <Opciones etiqueta="Nivel" opciones={NIVELES} valor={f.nivel} onChange={(v) => set('nivel', v)} permitirVacio />
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Categoría">
            {(id, c) => <input id={id} className={c} placeholder="Ej: 6ta" value={f.categoria ?? ''} onChange={(e) => set('categoria', e.target.value)} />}
          </Campo>
          <Campo etiqueta="Nacimiento">
            {(id, c) => <input id={id} className={c} type="date" value={f.fecha_nacimiento ?? ''} onChange={(e) => set('fecha_nacimiento', e.target.value || null)} />}
          </Campo>
        </div>
        <Opciones etiqueta="Mano hábil" opciones={MANOS} valor={f.mano} onChange={(v) => set('mano', v)} permitirVacio />
        <Opciones etiqueta="Juega de" opciones={POSICIONES} valor={f.posicion} onChange={(v) => set('posicion', v)} permitirVacio />

        <Campo etiqueta="Qué quiere lograr" ayuda="Lo que el alumno te dijo que busca: competir, soltarse con la volea, ganarle al cuñado…">
          {(id, c) => <textarea id={id} className={c} rows={2} value={f.objetivo ?? ''} onChange={(e) => set('objetivo', e.target.value)} />}
        </Campo>

        <div className="rounded-2xl border border-linea bg-white p-4">
          <Opciones etiqueta="Cómo paga" opciones={MODALIDADES} valor={f.modalidad_pago} onChange={(v) => v && set('modalidad_pago', v)} />
          <div className="mt-4">
            <Campo etiqueta={f.modalidad_pago === 'mensual' ? 'Cuota mensual' : 'Precio por clase'}>
              {(id, c) => (
                <div className="relative">
                  <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-tinta-suave">$</span>
                  <input id={id} className={`${c} pl-8 tabular`} inputMode="numeric" placeholder="0" value={tarifa}
                    onChange={(e) => setTarifa(e.target.value.replace(/[^\d.]/g, ''))} />
                </div>
              )}
            </Campo>
          </div>
        </div>

        <Campo etiqueta="Notas">
          {(id, c) => <textarea id={id} className={c} rows={3} placeholder="Lesiones, horarios que puede, lo que sea útil" value={f.notas ?? ''} onChange={(e) => set('notas', e.target.value)} />}
        </Campo>

        {alumno && (
          <label className="flex items-center justify-between gap-4 rounded-xl border border-linea bg-white px-4 py-3">
            <span>
              <span className="block font-medium">Alumno activo</span>
              <span className="block text-sm text-tinta-suave">Si lo desactivás, sale de sus clases fijas desde hoy.</span>
            </span>
            <input type="checkbox" className="size-6 accent-cancha" checked={f.activo} onChange={(e) => set('activo', e.target.checked)} />
          </label>
        )}
      </form>
    </Hoja>
  )
}
