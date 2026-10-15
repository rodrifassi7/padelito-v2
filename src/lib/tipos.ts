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
  alias_pago: string | null
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
  token_publico: string
  created_at: string
}

export type AlumnoForm = Omit<Alumno, 'id' | 'created_at' | 'token_publico'>

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

// ─── Seguimiento ────────────────────────────────────────────────────────────

export type Area = 'tecnica' | 'tactica' | 'fisica' | 'mental'
export type TipoNota = 'a_mejorar' | 'avance' | 'error'
export type EstadoFoco = 'pendiente' | 'trabajando' | 'logrado'

export interface Nota {
  id: string
  alumno_id: string
  sesion_id: string | null
  fecha: string
  area: Area
  golpe: string | null
  tipo: TipoNota
  texto: string
  created_at: string
}

export interface Foco {
  id: string
  alumno_id: string
  area: Area
  golpe: string | null
  titulo: string
  detalle: string | null
  estado: EstadoFoco
  logrado_en: string | null
  created_at: string
}

export interface Evaluacion {
  id: string
  alumno_id: string
  fecha: string
  comentario: string | null
  items: { habilidad: string; puntaje: number }[]
}

// ─── Pagos ──────────────────────────────────────────────────────────────────

export type MedioPago = 'efectivo' | 'transferencia' | 'otro'

export interface Pago {
  id: string
  alumno_id: string
  fecha: string
  monto: number
  medio: MedioPago
  periodo: string | null
  clases: number | null
  nota: string | null
}
