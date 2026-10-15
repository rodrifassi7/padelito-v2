import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { Boton, Campo, Cargando } from '../components/ui'
import { mensajeError, supabase } from '../lib/supabase'
import { PantallaAcceso } from './EntrarPage'

/** Pide el mail y manda el link para elegir una contraseña nueva. */
export function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nueva-clave`,
    })
    setEnviando(false)
    if (error) return toast.error(mensajeError(error))
    setEnviado(true)
  }

  return (
    <PantallaAcceso titulo={enviado ? 'Revisá tu email' : 'Recuperar contraseña'}>
      {enviado ? (
        <p className="text-lg">
          Si hay una cuenta con <strong>{email}</strong>, te llegó un link para elegir una contraseña nueva.
        </p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo etiqueta="Email de tu cuenta">
            {(id, c) => <input id={id} className={c} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Campo>
          <Boton type="submit" ancho cargando={enviando}>
            Mandarme el link
          </Boton>
        </form>
      )}
      <Link to="/entrar" className="mt-6 inline-block font-semibold text-acento">
        Volver a entrar
      </Link>
    </PantallaAcceso>
  )
}

/** Adonde lleva el link del mail: el usuario ya tiene sesión y elige la clave nueva. */
export function NuevaClavePage() {
  const { session, cargando } = useAuth()
  const navegar = useNavigate()
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: clave })
    setEnviando(false)
    if (error) return toast.error(mensajeError(error))
    toast.success('Contraseña actualizada')
    navegar('/', { replace: true })
  }

  if (cargando) return <Cargando pantalla />
  if (!session) {
    return (
      <PantallaAcceso titulo="El link venció">
        <p className="text-lg">Pedí uno nuevo y abrilo desde este mismo celular o compu.</p>
        <Link to="/recuperar" className="mt-6 inline-block font-semibold text-acento">
          Pedir otro link
        </Link>
      </PantallaAcceso>
    )
  }

  return (
    <PantallaAcceso titulo="Elegí tu contraseña nueva">
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <Campo etiqueta="Contraseña nueva" ayuda="Mínimo 6 caracteres.">
          {(id, c) => <input id={id} className={c} type="password" autoComplete="new-password" minLength={6} required value={clave} onChange={(e) => setClave(e.target.value)} />}
        </Campo>
        <Boton type="submit" ancho cargando={enviando}>
          Guardar y entrar
        </Boton>
      </form>
    </PantallaAcceso>
  )
}
