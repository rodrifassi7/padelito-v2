import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configFaltante = !url || !anonKey

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'falta-configurar', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/** Convierte un error de Supabase en un mensaje para mostrar. */
export function mensajeError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message)
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
    if (msg.includes('User already registered')) return 'Ya hay una cuenta con ese email.'
    if (msg.includes('Password should be at least')) return 'La contraseña tiene que tener al menos 6 caracteres.'
    if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de entrar (revisá tu casilla).'
    if (msg.includes('Failed to fetch')) return 'Sin conexión. Revisá internet y probá de nuevo.'
    return msg
  }
  return 'Algo salió mal. Probá de nuevo.'
}

/** Tira el error de una respuesta de Supabase o devuelve los datos. */
export function datos<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error
  return res.data as T
}
