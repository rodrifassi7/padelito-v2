import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useGuardarProfe, useProfe } from '../api/profe'
import { SwitchPelota } from '../components/SwitchPelota'
import { Boton, Campo, Cargando, Seccion, Titulo } from '../components/ui'
import { useTema } from '../lib/tema'
import { mensajeError, supabase } from '../lib/supabase'

export function PerfilPage() {
  const { data: profe, isPending } = useProfe()
  const guardar = useGuardarProfe()
  const tema = useTema()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const desdeBienvenida = params.get('desde') === 'bienvenida'
  const [form, setForm] = useState({ nombre: '', telefono: '', club: '', alias: '' })

  useEffect(() => {
    if (profe) setForm({ nombre: profe.nombre, telefono: profe.telefono ?? '', club: profe.club ?? '', alias: profe.alias_pago ?? '' })
  }, [profe])

  function enviar(e: FormEvent) {
    e.preventDefault()
    guardar.mutate(
      { nombre: form.nombre.trim(), telefono: form.telefono.trim() || null, club: form.club.trim() || null, alias_pago: form.alias.trim() || null },
      {
        onSuccess: () => {
          toast.success('Perfil guardado')
          if (desdeBienvenida) navegar('/', { replace: true })
        },
        onError: (err) => toast.error(mensajeError(err)),
      },
    )
  }

  if (isPending) return <Cargando pantalla />

  return (
    <div className="px-5">
      <div className="pt-3">
        <Link to="/" className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 font-medium text-acento">
          <ChevronLeft className="size-5" aria-hidden /> Hoy
        </Link>
      </div>
      <Titulo>Perfil</Titulo>
      <p className="-mt-2 mb-6 text-tinta-suave">{profe?.email}</p>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Campo etiqueta="Nombre">
          {(id, c) => <input id={id} className={c} required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />}
        </Campo>
        <Campo etiqueta="Club donde das clases">
          {(id, c) => <input id={id} className={c} value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />}
        </Campo>
        <Campo etiqueta="Teléfono">
          {(id, c) => <input id={id} className={c} type="tel" inputMode="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />}
        </Campo>
        <Campo etiqueta="Alias o CBU para transferencias" ayuda="Va en los recordatorios de pago que mandás por WhatsApp.">
          {(id, c) => <input id={id} className={c} autoCapitalize="off" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />}
        </Campo>
        <Boton type="submit" cargando={guardar.isPending} className="mt-2">
          Guardar perfil
        </Boton>
      </form>
      <Seccion titulo="Apariencia">
        <div className="vidrio rounded-2xl border border-linea bg-superficie p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Modo noche</p>
              <p className="text-[15px] text-tinta-suave">
                {tema.tema === 'noche' ? 'Luces prendidas. Ideal para las clases de la noche.' : 'Cancha azul, la que mejor se lee al sol.'}
              </p>
            </div>
            <SwitchPelota noche={tema.tema === 'noche'} onCambiar={(noche, origen) => tema.cambiar(noche ? 'noche' : 'azul', origen)} />
          </div>
          <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-3 border-t border-linea pt-3 text-[15px]">
            <input
              type="checkbox"
              className="size-5 accent-[var(--c-primario)]"
              checked={tema.preferencia === 'auto'}
              onChange={(e) => tema.cambiar(e.target.checked ? 'auto' : tema.tema)}
            />
            Seguir el modo del celular
          </label>
        </div>
        <p className="mt-2 text-[13px] text-tinta-suave">Se guarda en este celular.</p>
      </Seccion>
      <Boton variante="secundario" ancho className="mt-10" onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </Boton>
    </div>
  )
}
