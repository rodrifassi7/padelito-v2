import { useEffect, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useBorrarFoco, useEstadoFoco, useFocos, useGuardarFoco } from '../../api/seguimiento'
import { Boton, Campo, Cargando, Hoja, Opciones } from '../../components/ui'
import { deIso, fechaCorta } from '../../lib/fechas'
import { mensajeError } from '../../lib/supabase'
import type { Area, EstadoFoco, Foco } from '../../lib/tipos'
import { GOLPES, textoGolpe } from '../partido/golpes'
import { AREAS, ESTADOS_FOCO, siguienteEstado, textoArea } from './catalogo'

const GOLPES_FOCO = GOLPES.filter((g) => g.clave !== 'smash_x3' && g.clave !== 'smash_x4').map((g) => ({ valor: g.clave as string, texto: g.texto }))

const ESTILO_ESTADO: Record<EstadoFoco, string> = {
  pendiente: 'bg-linea text-tinta-suave',
  trabajando: 'bg-cancha text-white',
  logrado: 'bg-pelota text-tinta',
}

export function EstadoFocoChip({ estado, onClick }: { estado: EstadoFoco; onClick?: () => void }) {
  const texto = ESTADOS_FOCO.find((e) => e.valor === estado)?.texto
  const clase = clsx('inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold', ESTILO_ESTADO[estado])
  if (!onClick) return <span className={clase}>{estado === 'logrado' && <Check className="size-3.5" aria-hidden />}{texto}</span>
  return (
    <button type="button" onClick={onClick} className={clase} aria-label={`${texto}. Tocá para cambiar`}>
      {estado === 'logrado' && <Check className="size-3.5" aria-hidden />}
      {texto}
    </button>
  )
}

const meta = (f: Pick<Foco, 'area' | 'golpe'>) => [textoArea(f.area), f.golpe && textoGolpe(f.golpe).toLowerCase()].filter(Boolean).join(', ')

function FocoHoja({ alumnoId, foco, abierta, onCerrar }: { alumnoId: string; foco: Foco | null; abierta: boolean; onCerrar: () => void }) {
  const guardar = useGuardarFoco(alumnoId)
  const borrar = useBorrarFoco(alumnoId)
  const [titulo, setTitulo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [area, setArea] = useState<Area>('tecnica')
  const [golpe, setGolpe] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)

  useEffect(() => {
    if (!abierta) return
    setTitulo(foco?.titulo ?? '')
    setDetalle(foco?.detalle ?? '')
    setArea(foco?.area ?? 'tecnica')
    setGolpe(foco?.golpe ?? null)
    setConfirmar(false)
  }, [abierta, foco])

  function enviar(e: FormEvent) {
    e.preventDefault()
    guardar.mutate(
      { id: foco?.id, titulo: titulo.trim(), detalle: detalle.trim() || null, area, golpe },
      { onSuccess: () => { toast.success(foco ? 'Foco actualizado' : 'Foco agregado'); onCerrar() }, onError: (err) => toast.error(mensajeError(err)) },
    )
  }

  return (
    <Hoja
      abierta={abierta}
      onCerrar={onCerrar}
      titulo={foco ? 'Editar foco' : 'Nuevo foco'}
      pie={
        <Boton type="submit" form="foco" ancho disabled={!titulo.trim()} cargando={guardar.isPending}>
          {foco ? 'Guardar cambios' : 'Agregar foco'}
        </Boton>
      }
    >
      <form id="foco" onSubmit={enviar} className="flex flex-col gap-5">
        <Campo etiqueta="Qué tiene que trabajar">
          {(id, c) => <input id={id} className={c} required placeholder="Ej: volea de revés más compacta" value={titulo} onChange={(e) => setTitulo(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Cómo (opcional)">
          {(id, c) => <textarea id={id} className={c} rows={2} placeholder="Ejercicio, indicación, lo que le sirve" value={detalle} onChange={(e) => setDetalle(e.target.value)} />}
        </Campo>
        <Opciones etiqueta="Área" opciones={AREAS} valor={area} onChange={(v) => v && setArea(v)} />
        {(area === 'tecnica' || area === 'tactica') && (
          <Opciones etiqueta="Golpe (opcional)" opciones={GOLPES_FOCO} valor={golpe} onChange={setGolpe} permitirVacio />
        )}
        {foco && (
          <Boton
            type="button"
            variante="peligro"
            cargando={borrar.isPending}
            onClick={() => {
              if (!confirmar) return setConfirmar(true)
              borrar.mutate(foco.id, { onSuccess: onCerrar, onError: (err) => toast.error(mensajeError(err)) })
            }}
          >
            {confirmar ? 'Tocá de nuevo para borrar' : 'Borrar foco'}
          </Boton>
        )}
      </form>
    </Hoja>
  )
}

/** Lista de focos de trabajo del alumno, con el estado que se cambia de un toque. */
export function Focos({ alumnoId }: { alumnoId: string }) {
  const { data: focos, isPending } = useFocos(alumnoId)
  const cambiar = useEstadoFoco(alumnoId)
  const [editando, setEditando] = useState<Foco | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [verLogrados, setVerLogrados] = useState(false)

  if (isPending) return <Cargando />
  const activos = (focos ?? []).filter((f) => f.estado !== 'logrado')
  const logrados = (focos ?? []).filter((f) => f.estado === 'logrado')

  const fila = (f: Foco) => (
    <li key={f.id} className="flex items-center gap-3 border-b border-linea px-4 py-3 last:border-b-0">
      <button type="button" onClick={() => setEditando(f)} className="min-w-0 flex-1 text-left">
        <span className={clsx('block font-medium leading-snug', f.estado === 'logrado' && 'text-tinta-suave')}>{f.titulo}</span>
        <span className="block text-sm text-tinta-suave">
          {meta(f)}
          {f.logrado_en && `, logrado el ${fechaCorta(deIso(f.logrado_en))}`}
        </span>
      </button>
      <EstadoFocoChip estado={f.estado} onClick={() => cambiar.mutate({ id: f.id, estado: siguienteEstado(f.estado) })} />
    </li>
  )

  return (
    <>
      {activos.length === 0 && logrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-linea px-5 py-6 text-center">
          <p className="text-tinta-suave">Sin focos todavía. Se suman solos desde las notas de clase, o agregalos acá.</p>
          <Boton variante="secundario" className="mt-3" onClick={() => setNuevo(true)}>
            <Plus className="size-5" aria-hidden /> Agregar foco
          </Boton>
        </div>
      ) : (
        <>
          {activos.length > 0 ? (
            <ul className="overflow-hidden rounded-2xl border border-linea bg-white">{activos.map(fila)}</ul>
          ) : (
            <p className="rounded-2xl border border-linea bg-white px-4 py-3 text-tinta-suave">Logró todo lo que tenía pendiente.</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            {logrados.length > 0 ? (
              <button type="button" onClick={() => setVerLogrados(!verLogrados)} className="flex h-10 items-center gap-1 font-medium text-cancha">
                Logrados ({logrados.length}) <ChevronDown className={clsx('size-4 transition-transform', verLogrados && 'rotate-180')} aria-hidden />
              </button>
            ) : <span />}
            <button type="button" onClick={() => setNuevo(true)} className="flex h-10 items-center gap-1 font-medium text-cancha">
              <Plus className="size-4" aria-hidden /> Foco
            </button>
          </div>
          {verLogrados && <ul className="mt-1 overflow-hidden rounded-2xl border border-linea bg-white">{logrados.map(fila)}</ul>}
        </>
      )}
      <FocoHoja alumnoId={alumnoId} foco={editando} abierta={nuevo || editando !== null} onCerrar={() => { setNuevo(false); setEditando(null) }} />
    </>
  )
}
