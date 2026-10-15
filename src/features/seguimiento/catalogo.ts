import type { Area, EstadoFoco, TipoNota } from '../../lib/tipos'

export const AREAS: { valor: Area; texto: string }[] = [
  { valor: 'tecnica', texto: 'Técnica' },
  { valor: 'tactica', texto: 'Táctica' },
  { valor: 'fisica', texto: 'Física' },
  { valor: 'mental', texto: 'Mental' },
]
export const textoArea = (a: Area) => AREAS.find((x) => x.valor === a)?.texto ?? a

export const TIPOS_NOTA: { valor: TipoNota; texto: string }[] = [
  { valor: 'a_mejorar', texto: 'A mejorar' },
  { valor: 'avance', texto: 'Avance' },
  { valor: 'error', texto: 'Error que se repite' },
]
export const textoTipoNota = (t: TipoNota) => TIPOS_NOTA.find((x) => x.valor === t)?.texto ?? t

export const ESTADOS_FOCO: { valor: EstadoFoco; texto: string }[] = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'trabajando', texto: 'Trabajando' },
  { valor: 'logrado', texto: 'Logrado' },
]
export const siguienteEstado = (e: EstadoFoco): EstadoFoco =>
  e === 'pendiente' ? 'trabajando' : e === 'trabajando' ? 'logrado' : 'pendiente'

/** Habilidades que se evalúan de 1 a 5. Las claves de golpes coinciden con las del modo partido. */
export const HABILIDADES: { clave: string; texto: string; area: Area }[] = [
  { clave: 'derecha', texto: 'Derecha', area: 'tecnica' },
  { clave: 'reves', texto: 'Revés', area: 'tecnica' },
  { clave: 'volea_derecha', texto: 'Volea derecha', area: 'tecnica' },
  { clave: 'volea_reves', texto: 'Volea revés', area: 'tecnica' },
  { clave: 'bandeja', texto: 'Bandeja', area: 'tecnica' },
  { clave: 'vibora', texto: 'Víbora', area: 'tecnica' },
  { clave: 'smash', texto: 'Smash', area: 'tecnica' },
  { clave: 'globo', texto: 'Globo', area: 'tecnica' },
  { clave: 'salida_pared', texto: 'Salida de pared', area: 'tecnica' },
  { clave: 'saque', texto: 'Saque', area: 'tecnica' },
  { clave: 'resto', texto: 'Resto', area: 'tecnica' },
  { clave: 'posicionamiento', texto: 'Posicionamiento', area: 'tactica' },
  { clave: 'transiciones', texto: 'Subir y bajar de la red', area: 'tactica' },
  { clave: 'eleccion_golpe', texto: 'Elección de golpe', area: 'tactica' },
  { clave: 'juego_pareja', texto: 'Juego en pareja', area: 'tactica' },
  { clave: 'desplazamientos', texto: 'Desplazamientos', area: 'fisica' },
  { clave: 'resistencia', texto: 'Resistencia', area: 'fisica' },
  { clave: 'concentracion', texto: 'Concentración', area: 'mental' },
  { clave: 'presion', texto: 'Juego bajo presión', area: 'mental' },
]
export const textoHabilidad = (c: string) => HABILIDADES.find((h) => h.clave === c)?.texto ?? c

export const NIVELES_PUNTAJE = ['', 'Inicial', 'En desarrollo', 'Correcto', 'Bueno', 'Muy bueno']
