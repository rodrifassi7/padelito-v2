// Tipos que reflejan las tablas de supabase/migrations.

export type Nivel = 'iniciacion' | 'principiante' | 'intermedio' | 'avanzado' | 'competicion'
export type Mano = 'derecha' | 'zurda'
export type Posicion = 'drive' | 'reves' | 'ambas'
export type ModalidadPago = 'mensual' | 'por_clase'
export type EstadoSesion = 'programada' | 'realizada' | 'cancelada'
export type EstadoAsistencia = 'pendiente' | 'presente' | 'ausente' | 'aviso'

export interface Profe {
  id: string
  email: string
  nombre: string
  telefono: string | null
  club: string | null
}

export interface Alumno {
  id: string
  nombre: string
  telefono: string | null
  nivel: Nivel | null
  categoria: string | null
  mano: Mano | null
  posicion: Posicion | null
  fecha_nacimiento: string | null
  objetivo: string | null
  notas: string | null
  modalidad_pago: ModalidadPago
  tarifa: number | null
  activo: boolean
  created_at: string
}

export type AlumnoForm = Omit<Alumno, 'id' | 'created_at'>

export interface Clase {
  id: string
  dia_semana: number // 1 = lunes … 7 = domingo
  hora: string // "19:00:00"
  duracion_min: number
  lugar: string | null
  desde: string
  hasta: string | null
}

export interface AlumnoBreve {
  id: string
  nombre: string
}

export interface Asistencia {
  alumno_id: string
  estado: EstadoAsistencia
  alumno: AlumnoBreve
}

export interface Sesion {
  id: string
  clase_id: string | null
  fecha: string // "2026-10-15"
  hora: string
  duracion_min: number
  lugar: string | null
  estado: EstadoSesion
  nota: string | null
  asistencias: Asistencia[]
}
