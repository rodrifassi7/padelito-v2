import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfeId } from '../auth/AuthProvider'
import { datos, supabase } from '../lib/supabase'
import type { Profe } from '../lib/tipos'

export function useProfe() {
  const id = useProfeId()
  return useQuery({
    queryKey: ['profe', id],
    queryFn: async () =>
      datos(await supabase.from('profes').select('id, email, nombre, telefono, club, alias_pago').eq('id', id).single()) as Profe,
    staleTime: 5 * 60_000,
  })
}

export function useGuardarProfe() {
  const id = useProfeId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: Pick<Profe, 'nombre' | 'telefono' | 'club' | 'alias_pago'>) =>
      datos(await supabase.from('profes').update(v).eq('id', id).select('id, email, nombre, telefono, club, alias_pago').single()) as Profe,
    onSuccess: (profe) => qc.setQueryData(['profe', id], profe),
  })
}
