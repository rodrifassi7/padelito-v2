import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Boton, Campo } from '../components/ui'
import { mensajeError, supabase } from '../lib/supabase'
import { PantallaAcceso } from './EntrarPage'

export function RegistroPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [revisarMail, setRevisarMail] = useState(false)

  async function registrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: clave,
      options: { data: { nombre: nombre.trim() }, emailRedirectTo: window.location.origin },
    })
    setEnviando(false)
    if (error) return toast.error(mensajeError(error))
    // Si Supabase pide confirmar el email no hay sesión todavía.
    if (!data.session) setRevisarMail(true)
  }

  if (revisarMail) {
    return (
      <PantallaAcceso titulo="Revisá tu email">
        <p className="text-lg">
          Te mandamos un link a <strong>{email}</strong>. Abrilo para activar la cuenta y después entrá.
        </p>
        <Link to="/entrar" className="mt-6 inline-block font-semibold text-cancha">
          Ir a entrar
        </Link>
      </PantallaAcceso>
    )
  }

  return (
    <PantallaAcceso titulo="Creá tu cuenta de profe">
      <form onSubmit={registrar} className="flex flex-col gap-4">
        <Campo etiqueta="Tu nombre">
          {(id, c) => (
            <input id={id} className={c} autoComplete="name" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          )}
        </Campo>
        <Campo etiqueta="Email">
          {(id, c) => (
            <input id={id} className={c} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>
        <Campo etiqueta="Contraseña" ayuda="Mínimo 6 caracteres.">
          {(id, c) => (
            <input id={id} className={c} type="password" autoComplete="new-password" minLength={6} required value={clave} onChange={(e) => setClave(e.target.value)} />
          )}
        </Campo>
        <Boton type="submit" ancho cargando={enviando} className="mt-2">
          Crear cuenta
        </Boton>
      </form>
      <p className="mt-6 text-center text-tinta-suave">
        ¿Ya tenés cuenta?{' '}
        <Link to="/entrar" className="font-semibold text-cancha">
          Entrá
        </Link>
      </p>
    </PantallaAcceso>
  )
}
