import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Boton, Campo } from '../components/ui'
import { MarcaCancha } from '../components/MarcaCancha'
import { mensajeError, supabase } from '../lib/supabase'

export function PantallaAcceso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <MarcaCancha>
        <p className="font-display text-xl font-semibold text-pelota">Padelito</p>
        <h1 className="mt-6 font-display text-4xl leading-tight font-semibold">{titulo}</h1>
      </MarcaCancha>
      <div className="px-5 py-7">{children}</div>
    </div>
  )
}

export function EntrarPage() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
    setEnviando(false)
    if (error) toast.error(mensajeError(error))
  }

  return (
    <PantallaAcceso titulo="Tus clases, tus alumnos y cómo van mejorando.">
      <form onSubmit={entrar} className="flex flex-col gap-4">
        <Campo etiqueta="Email">
          {(id, c) => (
            <input id={id} className={c} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>
        <Campo etiqueta="Contraseña">
          {(id, c) => (
            <input id={id} className={c} type="password" autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} />
          )}
        </Campo>
        <Boton type="submit" ancho cargando={enviando} className="mt-2">
          Entrar
        </Boton>
      </form>
      <Link to="/recuperar" className="mt-4 block text-center font-medium text-tinta-suave">
        Me olvidé la contraseña
      </Link>
      <p className="mt-6 text-center text-tinta-suave">
        ¿Primera vez?{' '}
        <Link to="/registro" className="font-semibold text-cancha">
          Creá tu cuenta
        </Link>
      </p>
    </PantallaAcceso>
  )
}
