import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { datos, supabase } from '../lib/supabase'
import type { paraGuardar } from '../features/partido/almacen'
import type { Formato, Jugador, Pareja, Posicion, TipoPunto } from '../features/partido/tipos'

export interface PartidoGuardado {
  id: string
  fecha: string
  formato: Formato
  punto_de_oro: boolean
  sets: [number, number][]
  ganador: Pareja | null
  duracion_min: number | null
  notas: string | null
  jugadores: Jugador[]
}

export interface PuntoGuardado {
  orden: number
  pareja_gana: Pareja
  jugador: Posicion | null
  tipo: TipoPunto | null
  golpe: string | null
  set_numero: number
}

const SELECT_PARTIDO = 'id, fecha, formato, punto_de_oro, sets, ganador, duracion_min, notas, jugadores:partido_jugadores(posicion, alumno_id, nombre)'

const ordenarJugadores = <T extends { jugadores: Jugador[] }>(p: T) => {
  p.jugadores.sort((a, b) => a.posicion - b.posicion)
  return p
}

export function usePartidos() {
  return useQuery({
    queryKey: ['partidos'],
    queryFn: async () =>
      (
        datos(
          await supabase.from('partidos').select(SELECT_PARTIDO).order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(50),
        ) as unknown as PartidoGuardado[]
      ).map(ordenarJugadores),
  })
}

export function usePartido(id: string) {
  return useQuery({
    queryKey: ['partido', id],
    queryFn: async () => {
      const partido = ordenarJugadores(
        datos(await supabase.from('partidos').select(SELECT_PARTIDO).eq('id', id).single()) as unknown as PartidoGuardado,
      )
      const puntos = datos(
        await supabase
          .from('partido_puntos')
          .select('orden, pareja_gana, jugador, tipo, golpe, set_numero')
          .eq('partido_id', id)
          .order('orden'),
      ) as PuntoGuardado[]
      return { partido, puntos }
    },
  })
}

export function useGuardarPartido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ReturnType<typeof paraGuardar>) =>
      datos(await supabase.rpc('guardar_partido', { p: payload })) as string,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partidos'] })
      qc.invalidateQueries({ queryKey: ['alumno'] })
    },
  })
}

export function useBorrarPartido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      datos(await supabase.from('partidos').delete().eq('id', id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partidos'] })
      qc.invalidateQueries({ queryKey: ['alumno'] })
    },
  })
}

export interface PuntoDeAlumno {
  partido_id: string
  fecha: string
  tipo: TipoPunto
  golpe: string | null
}

/** Todos los puntos que terminó el alumno en sus partidos (winners y errores). */
export function usePuntosDeAlumno(alumnoId: string) {
  return useQuery({
    queryKey: ['alumno', alumnoId, 'partidos'],
    queryFn: async () =>
      datos(
        await supabase
          .from('puntos_de_alumnos')
          .select('partido_id, fecha, tipo, golpe')
          .eq('alumno_id', alumnoId)
          .order('fecha', { ascending: false })
          .limit(5000),
      ) as PuntoDeAlumno[],
  })
}
