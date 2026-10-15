import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Boton, Campo } from '../components/ui'
import { FondoCancha, MarcaCancha } from '../components/MarcaCancha'
import { mensajeError, supabase } from '../lib/supabase'

export function PantallaAcceso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="relative isolate mx-auto min-h-dvh max-w-lg">
      <FondoCancha pelota="abajo" />
      <MarcaCancha>
        <p className="font-display text-xl font-bold tracking-tight">padelito</p>
        <h1 className="mt-10 font-display text-[30px] leading-[1.1] font-bold tracking-tight">{titulo}</h1>
      </MarcaCancha>
      <div className="claro vidrio mx-4 mt-4 rounded-3xl bg-fondo p-5 shadow-2xl">{children}</div>
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
        <Link to="/registro" className="font-semibold text-acento">
          Creá tu cuenta
        </Link>
      </p>
    </PantallaAcceso>
  )
}
