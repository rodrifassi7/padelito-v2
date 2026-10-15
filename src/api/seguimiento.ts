import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { datos, supabase } from '../lib/supabase'
import { hoyIso } from '../lib/fechas'
import type { Area, EstadoFoco, Evaluacion, Foco, Nota, TipoNota } from '../lib/tipos'

const k = {
  notas: (a: string) => ['alumno', a, 'notas'] as const,
  focos: (a: string) => ['alumno', a, 'focos'] as const,
  evaluaciones: (a: string) => ['alumno', a, 'evaluaciones'] as const,
}

// ─── Notas ──────────────────────────────────────────────────────────────────

export function useNotas(alumnoId: string) {
  return useQuery({
    queryKey: k.notas(alumnoId),
    queryFn: async () =>
      datos(
        await supabase
          .from('notas')
          .select('*')
          .eq('alumno_id', alumnoId)
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(40),
      ) as Nota[],
  })
}

/** Notas ya cargadas para una sesión (para saber a quién falta anotar). */
export function useNotasDeSesion(sesionId: string | null) {
  return useQuery({
    queryKey: ['sesion', sesionId, 'notas'],
    enabled: Boolean(sesionId),
    queryFn: async () =>
      datos(await supabase.from('notas').select('alumno_id').eq('sesion_id', sesionId!)) as { alumno_id: string }[],
  })
}

export interface NuevaNota {
  alumno_id: string
  sesion_id: string | null
  fecha: string
  area: Area
  golpe: string | null
  tipo: TipoNota
  texto: string
  crearFoco: boolean
}

export function useCrearNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ crearFoco, ...n }: NuevaNota) => {
      datos(await supabase.from('notas').insert(n))
      if (crearFoco) {
        datos(await supabase.from('focos').insert({ alumno_id: n.alumno_id, area: n.area, golpe: n.golpe, titulo: n.texto }))
      }
    },
    onSuccess: (_d, n) => {
      qc.invalidateQueries({ queryKey: k.notas(n.alumno_id) })
      qc.invalidateQueries({ queryKey: k.focos(n.alumno_id) })
      if (n.sesion_id) qc.invalidateQueries({ queryKey: ['sesion', n.sesion_id, 'notas'] })
    },
  })
}

export function useBorrarNota(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      datos(await supabase.from('notas').delete().eq('id', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: k.notas(alumnoId) }),
  })
}

// ─── Focos ──────────────────────────────────────────────────────────────────

const ORDEN_ESTADO: Record<EstadoFoco, number> = { trabajando: 0, pendiente: 1, logrado: 2 }

export function useFocos(alumnoId: string) {
  return useQuery({
    queryKey: k.focos(alumnoId),
    queryFn: async () => {
      const lista = datos(
        await supabase.from('focos').select('*').eq('alumno_id', alumnoId).order('created_at', { ascending: false }),
      ) as Foco[]
      return lista.sort(
        (a, b) =>
          ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || (b.logrado_en ?? '').localeCompare(a.logrado_en ?? ''),
      )
    },
  })
}

export function useGuardarFoco(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...f }: Partial<Foco> & { titulo: string; area: Area }) => {
      if (id) datos(await supabase.from('focos').update(f).eq('id', id))
      else datos(await supabase.from('focos').insert({ ...f, alumno_id: alumnoId }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: k.focos(alumnoId) }),
  })
}

export function useEstadoFoco(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { id: string; estado: EstadoFoco }) => {
      datos(
        await supabase
          .from('focos')
          .update({ estado: v.estado, logrado_en: v.estado === 'logrado' ? hoyIso() : null })
          .eq('id', v.id),
      )
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: k.focos(alumnoId) })
      const antes = qc.getQueryData<Foco[]>(k.focos(alumnoId))
      qc.setQueryData<Foco[]>(k.focos(alumnoId), (l) =>
        l?.map((f) => (f.id === v.id ? { ...f, estado: v.estado, logrado_en: v.estado === 'logrado' ? hoyIso() : null } : f)),
      )
      return { antes }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(k.focos(alumnoId), ctx?.antes),
    onSettled: () => qc.invalidateQueries({ queryKey: k.focos(alumnoId) }),
  })
}

export function useBorrarFoco(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      datos(await supabase.from('focos').delete().eq('id', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: k.focos(alumnoId) }),
  })
}

// ─── Evaluaciones ───────────────────────────────────────────────────────────

export function useEvaluaciones(alumnoId: string) {
  return useQuery({
    queryKey: k.evaluaciones(alumnoId),
    queryFn: async () =>
      datos(
        await supabase
          .from('evaluaciones')
          .select('id, alumno_id, fecha, comentario, items:evaluacion_items(habilidad, puntaje)')
          .eq('alumno_id', alumnoId)
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(12),
      ) as Evaluacion[],
  })
}

export function useGuardarEvaluacion(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { fecha: string; comentario: string | null; items: { habilidad: string; puntaje: number }[] }) =>
      datos(await supabase.rpc('guardar_evaluacion', { p: { ...v, alumno_id: alumnoId } })) as string,
    onSuccess: () => qc.invalidateQueries({ queryKey: k.evaluaciones(alumnoId) }),
  })
}

export function useBorrarEvaluacion(alumnoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      datos(await supabase.from('evaluaciones').delete().eq('id', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: k.evaluaciones(alumnoId) }),
  })
}
