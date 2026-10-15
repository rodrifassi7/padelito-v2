import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { datos, mensajeError, supabase } from '../lib/supabase'
import { deIso, diaSemana, hoyIso } from '../lib/fechas'
import type { EstadoAsistencia, EstadoSesion, Sesion } from '../lib/tipos'

const SELECT_SESION =
  'id, clase_id, fecha, hora, duracion_min, lugar, estado, nota, asistencias(alumno_id, estado, alumno:alumnos(id, nombre))'

/** Sesiones entre dos fechas. Antes se asegura de que existan las de las clases fijas. */
export function useAgenda(desde: string, hasta: string) {
  return useQuery({
    queryKey: ['agenda', desde, hasta],
    queryFn: async () => {
      datos(await supabase.rpc('asegurar_sesiones', { p_desde: desde, p_hasta: hasta, p_hoy: hoyIso() }))
      const sesiones = datos(
        await supabase
          .from('sesiones')
          .select(SELECT_SESION)
          .gte('fecha', desde)
          .lte('fecha', hasta)
          .order('fecha')
          .order('hora'),
      ) as unknown as Sesion[]
      for (const s of sesiones) s.asistencias.sort((a, b) => a.alumno.nombre.localeCompare(b.alumno.nombre))
      return sesiones
    },
  })
}

function refrescar(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['agenda'] })
  qc.invalidateQueries({ queryKey: ['alumno'] })
}

/** Cambia una sesión en todas las vistas de agenda en caché. */
function editarEnCache(qc: QueryClient, sesionId: string, cambio: (s: Sesion) => Sesion) {
  qc.setQueriesData<Sesion[]>({ queryKey: ['agenda'] }, (lista) =>
    lista?.map((s) => (s.id === sesionId ? cambio(s) : s)),
  )
}

export function useMarcarAsistencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { sesionId: string; alumnoId: string; estado: EstadoAsistencia }) => {
      datos(
        await supabase
          .from('asistencias')
          .update({ estado: v.estado })
          .eq('sesion_id', v.sesionId)
          .eq('alumno_id', v.alumnoId),
      )
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ['agenda'] })
      const antes = qc.getQueriesData<Sesion[]>({ queryKey: ['agenda'] })
      editarEnCache(qc, v.sesionId, (s) => ({
        ...s,
        asistencias: s.asistencias.map((a) => (a.alumno_id === v.alumnoId ? { ...a, estado: v.estado } : a)),
      }))
      return { antes }
    },
    onError: (e, _v, ctx) => {
      ctx?.antes.forEach(([clave, valor]) => qc.setQueryData(clave, valor))
      toast.error(mensajeError(e))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['alumno'] }),
  })
}

export function useEstadoSesion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { sesionId: string; estado: EstadoSesion }) => {
      datos(await supabase.from('sesiones').update({ estado: v.estado }).eq('id', v.sesionId))
    },
    onSuccess: (_d, v) => {
      editarEnCache(qc, v.sesionId, (s) => ({ ...s, estado: v.estado }))
      refrescar(qc)
    },
  })
}

export interface NuevaClase {
  fecha: string
  hora: string
  duracion_min: number
  lugar: string | null
  alumnoIds: string[]
  repetir: boolean
}

export function useCrearClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: NuevaClase) => {
      if (v.repetir) {
        const clase = datos(
          await supabase
            .from('clases')
            .insert({
              dia_semana: diaSemana(deIso(v.fecha)),
              hora: v.hora,
              duracion_min: v.duracion_min,
              lugar: v.lugar,
              desde: v.fecha,
            })
            .select('id')
            .single(),
        ) as { id: string }
        if (v.alumnoIds.length) {
          datos(
            await supabase
              .from('clase_alumnos')
              .insert(v.alumnoIds.map((alumno_id) => ({ clase_id: clase.id, alumno_id, desde: v.fecha }))),
          )
        }
      } else {
        const sesion = datos(
          await supabase
            .from('sesiones')
            .insert({ fecha: v.fecha, hora: v.hora, duracion_min: v.duracion_min, lugar: v.lugar })
            .select('id')
            .single(),
        ) as { id: string }
        if (v.alumnoIds.length) {
          datos(
            await supabase
              .from('asistencias')
              .insert(v.alumnoIds.map((alumno_id) => ({ sesion_id: sesion.id, alumno_id }))),
          )
        }
      }
    },
    onSuccess: () => refrescar(qc),
  })
}

/** Suma un alumno a una sesión; si es clase fija, opcionalmente a todas las semanas. */
export function useSumarAlumno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { sesion: Sesion; alumnoId: string; todasLasSemanas: boolean }) => {
      if (v.todasLasSemanas && v.sesion.clase_id) {
        datos(
          await supabase
            .from('clase_alumnos')
            .upsert({ clase_id: v.sesion.clase_id, alumno_id: v.alumnoId, desde: v.sesion.fecha }),
        )
      }
      datos(
        await supabase
          .from('asistencias')
          .upsert({ sesion_id: v.sesion.id, alumno_id: v.alumnoId }, { ignoreDuplicates: true }),
      )
    },
    onSuccess: () => refrescar(qc),
  })
}

/** Saca un alumno de una sesión; si es clase fija, opcionalmente de todas las semanas. */
export function useQuitarAlumno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { sesion: Sesion; alumnoId: string; todasLasSemanas: boolean }) => {
      if (v.todasLasSemanas && v.sesion.clase_id) {
        datos(
          await supabase
            .from('clase_alumnos')
            .delete()
            .eq('clase_id', v.sesion.clase_id)
            .eq('alumno_id', v.alumnoId),
        )
        // Las sesiones futuras sin marcar se limpian solas al recargar la agenda.
      }
      datos(
        await supabase.from('asistencias').delete().eq('sesion_id', v.sesion.id).eq('alumno_id', v.alumnoId),
      )
    },
    onSuccess: () => refrescar(qc),
  })
}

/** La clase fija deja de repetirse desde esta fecha. */
export function useTerminarClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { claseId: string; desde: string }) => {
      datos(await supabase.rpc('terminar_clase', { p_clase: v.claseId, p_desde: v.desde }))
    },
    onSuccess: () => refrescar(qc),
  })
}

/** Borra una clase suelta. */
export function useBorrarSesion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sesionId: string) => {
      datos(await supabase.from('sesiones').delete().eq('id', sesionId))
    },
    onSuccess: () => refrescar(qc),
  })
}
