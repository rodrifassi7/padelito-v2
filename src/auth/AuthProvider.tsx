import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  cargando: boolean
}

const AuthContext = createContext<AuthState>({ session: null, cargando: true })

/**
 * Una sola fuente de verdad para la sesión: onAuthStateChange.
 * Supabase emite INITIAL_SESSION apenas se suscribe, así que no hace falta
 * un getSession() aparte (eso era lo que generaba carreras en la v1).
 * Nunca se llama a Supabase dentro del callback para no bloquear el cliente.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<AuthState>({ session: null, cargando: true })
  const qc = useQueryClient()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento, session) => {
      setEstado({ session, cargando: false })
      if (evento === 'SIGNED_OUT') qc.clear()
    })
    return () => data.subscription.unsubscribe()
  }, [qc])

  return <AuthContext value={estado}>{children}</AuthContext>
}

export const useAuth = () => use(AuthContext)

/** Para pantallas dentro del layout protegido: siempre hay sesión. */
export function useProfeId() {
  const { session } = useAuth()
  if (!session) throw new Error('Sin sesión')
  return session.user.id
}
