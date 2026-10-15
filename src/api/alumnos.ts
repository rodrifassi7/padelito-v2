import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { datos, supabase } from '../lib/supabase'
import type { Alumno, AlumnoForm, Clase, EstadoAsistencia, EstadoSesion } from '../lib/tipos'

export const claves = {
  alumnos: ['alumnos'] as const,
  alumno: (id: string) => ['alumno', id] as const,
  clasesDeAlumno: (id: string) => ['alumno', id, 'clases'] as const,
  asistenciaDeAlumno: (id: string) => ['alumno', id, 'asistencia'] as const,
}

export function useAlumnos() {
  return useQuery({
    queryKey: claves.alumnos,
    queryFn: async () =>
      datos(await supabase.from('alumnos').select('*').order('nombre')) as Alumno[],
  })
}

export function useAlumno(id: string) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: claves.alumno(id),
    queryFn: async () => datos(await supabase.from('alumnos').select('*').eq('id', id).single()) as Alumno,
    placeholderData: () => qc.getQueryData<Alumno[]>(claves.alumnos)?.find((a) => a.id === id),
  })
}

export function useGuardarAlumno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...valores }: AlumnoForm & { id?: string }) => {
      const res = id
        ? await supabase.from('alumnos').update(valores).eq('id', id).select().single()
        : await supabase.from('alumnos').insert(valores).select().single()
      return datos(res) as Alumno
    },
    onSuccess: (alumno) => {
      qc.setQueryData(claves.alumno(alumno.id), alumno)
      qc.invalidateQueries({ queryKey: claves.alumnos })
      qc.invalidateQueries({ queryKey: ['agenda'] })
    },
  })
}

export function useBorrarAlumno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      datos(await supabase.from('alumnos').delete().eq('id', id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claves.alumnos })
      qc.invalidateQueries({ queryKey: ['agenda'] })
    },
  })
}

/** Clases fijas en las que está el alumno (las que siguen vigentes). */
export function useClasesDeAlumno(id: string, hoy: string) {
  return useQuery({
    queryKey: claves.clasesDeAlumno(id),
    queryFn: async () => {
      const filas = datos(
        await supabase
          .from('clase_alumnos')
          .select('clase:clases!inner(id, dia_semana, hora, duracion_min, lugar, desde, hasta, clase_alumnos(alumno:alumnos(id, nombre)))')
          .eq('alumno_id', id),
      ) as unknown as { clase: Clase & { clase_alumnos: { alumno: { id: string; nombre: string } }[] } }[]
      return filas
        .map((f) => f.clase)
        .filter((c) => !c.hasta || c.hasta >= hoy)
        .sort((a, b) => a.dia_semana - b.dia_semana || a.hora.localeCompare(b.hora))
    },
  })
}

export interface RegistroAsistencia {
  id: string
  fecha: string
  hora: string
  estado: EstadoSesion
  asistencias: { estado: EstadoAsistencia }[]
}

/** Últimas sesiones del alumno con su asistencia. */
export function useAsistenciaDeAlumno(id: string, hasta: string) {
  return useQuery({
    queryKey: claves.asistenciaDeAlumno(id),
    queryFn: async () =>
      datos(
        await supabase
          .from('sesiones')
          .select('id, fecha, hora, estado, asistencias!inner(estado)')
          .eq('asistencias.alumno_id', id)
          .lte('fecha', hasta)
          .order('fecha', { ascending: false })
          .order('hora', { ascending: false })
          .limit(40),
      ) as RegistroAsistencia[],
  })
}
