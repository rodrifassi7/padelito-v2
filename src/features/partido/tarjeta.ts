import type { Estadisticas } from './estadisticas'
import type { Jugador, Pareja, Posicion } from './tipos'

/**
 * Tarjeta del partido para compartir como historia (1080 x 1920).
 * Se dibuja en un canvas: anda igual en iPhone y Android y no depende de
 * capturar el HTML.
 */

const C = {
  cancha: '#1E5AA0',
  canchaOscura: '#164679',
  pelota: '#DCF25A',
  blanco: '#FFFFFF',
  tenue: 'rgba(255,255,255,0.68)',
  linea: 'rgba(255,255,255,0.16)',
  lineaCancha: 'rgba(255,255,255,0.07)',
  tinta: '#13202E',
  falta: '#F08C84',
}
const DISPLAY = '"Barlow Condensed", "Barlow", sans-serif'
const TEXTO = '"Barlow", sans-serif'

export interface DatosTarjeta {
  fecha: string // "jueves 15 de octubre"
  sets: [number, number][]
  ganador: Pareja | null
  jugadores: Jugador[]
  stats: Record<Posicion, Estadisticas>
  profe: string | null
  club: string | null
}

function fuente(ctx: CanvasRenderingContext2D, peso: number, tam: number, familia = DISPLAY) {
  ctx.font = `${peso} ${tam}px ${familia}`
}

/** Escribe achicando la letra hasta que entre en el ancho. */
function texto(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, ancho: number, peso: number, tam: number, familia = DISPLAY) {
  let s = tam
  fuente(ctx, peso, s, familia)
  while (ctx.measureText(t).width > ancho && s > 20) {
    s -= 2
    fuente(ctx, peso, s, familia)
  }
  ctx.fillText(t, x, y)
}

const nombreCorto = (n: string) => {
  const p = n.trim().split(/\s+/)
  return p.length > 1 ? `${p[0]} ${p[1]![0]}.` : (p[0] ?? n)
}

/** La figura: más winners y menos errores no forzados. Null si no hay datos. */
export function figura(jugadores: Jugador[], stats: Record<Posicion, Estadisticas>) {
  let mejor: { j: Jugador; puntaje: number; e: Estadisticas } | null = null
  for (const j of jugadores) {
    const e = stats[j.posicion]
    if (!e.winners) continue
    const puntaje = e.winners * 2 - e.noForzados
    if (!mejor || puntaje > mejor.puntaje || (puntaje === mejor.puntaje && e.winners > mejor.e.winners)) mejor = { j, puntaje, e }
  }
  return mejor
}

function lineasCancha(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = C.lineaCancha
  ctx.lineWidth = 5
  const x = 140, y = 120, w = 800, h = 1680
  ctx.strokeRect(x, y, w, h)
  const saque = h * 0.1525
  ctx.beginPath()
  ctx.moveTo(x, y + saque); ctx.lineTo(x + w, y + saque)
  ctx.moveTo(x, y + h - saque); ctx.lineTo(x + w, y + h - saque)
  ctx.moveTo(x + w / 2, y + saque); ctx.lineTo(x + w / 2, y + h - saque)
  ctx.stroke()
  ctx.restore()
}

export async function dibujarTarjeta(d: DatosTarjeta): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`600 80px ${DISPLAY}`),
    document.fonts.load(`500 40px ${DISPLAY}`),
    document.fonts.load(`500 40px ${TEXTO}`),
  ]).catch(() => undefined)

  const W = 1080, H = 1920, M = 90
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'

  // Fondo
  ctx.fillStyle = C.cancha
  ctx.fillRect(0, 0, W, H)
  lineasCancha(ctx)

  // Encabezado
  ctx.fillStyle = C.pelota
  ctx.textAlign = 'left'
  fuente(ctx, 600, 60)
  ctx.fillText('Padelito', M, 170)
  ctx.fillStyle = C.tenue
  ctx.textAlign = 'right'
  fuente(ctx, 500, 40, TEXTO)
  ctx.fillText(d.fecha.charAt(0).toUpperCase() + d.fecha.slice(1), W - M, 168)

  // Resultado: un bloque oscuro con las dos parejas y la red en el medio
  const bloqueY = 300, bloqueH = 560
  ctx.fillStyle = C.canchaOscura
  ctx.beginPath()
  ctx.roundRect(M - 20, bloqueY, W - 2 * M + 40, bloqueH, 40)
  ctx.fill()

  const pareja = (n: Pareja) => d.jugadores.filter((j) => (n === 1 ? j.posicion <= 2 : j.posicion >= 3))
  const anchoSets = d.sets.length * 110
  const filas: [Pareja, number][] = [[1, bloqueY + 190], [2, bloqueY + 450]]
  for (const [n, y] of filas) {
    const gano = d.ganador === n
    const nombres = pareja(n).map((j) => nombreCorto(j.nombre))
    ctx.textAlign = 'left'
    ctx.fillStyle = gano ? C.blanco : C.tenue
    texto(ctx, nombres[0] ?? '', M + 20, y - 50, W - 2 * M - anchoSets - 60, 600, 76)
    texto(ctx, nombres[1] ?? '', M + 20, y + 30, W - 2 * M - anchoSets - 60, 600, 76)
    if (gano) {
      ctx.fillStyle = C.pelota
      ctx.beginPath()
      ctx.arc(M - 2, y - 14, 12, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.textAlign = 'center'
    d.sets.forEach(([a, b], k) => {
      const [mio, otro] = n === 1 ? [a, b] : [b, a]
      ctx.fillStyle = mio > otro ? C.pelota : C.tenue
      fuente(ctx, 600, mio >= 10 ? 104 : 130)
      ctx.fillText(String(mio), W - M - anchoSets + 55 + k * 110, y + 24)
    })
  }
  // Red
  ctx.fillStyle = C.blanco
  ctx.fillRect(M + 20, bloqueY + bloqueH / 2 - 4, W - 2 * M - 40, 8)
  if (!d.ganador) {
    ctx.fillStyle = C.tenue
    ctx.textAlign = 'left'
    fuente(ctx, 500, 34, TEXTO)
    ctx.fillText('Partido sin terminar', M, bloqueY + bloqueH + 60)
  }

  // Figura del partido
  let y = 1040
  const fig = figura(d.jugadores, d.stats)
  if (fig) {
    ctx.textAlign = 'left'
    ctx.fillStyle = C.tenue
    fuente(ctx, 500, 40, TEXTO)
    ctx.fillText('Figura del partido', M, y)
    ctx.fillStyle = C.pelota
    texto(ctx, fig.j.nombre, M, y + 110, W - 2 * M, 600, 110)
    ctx.fillStyle = C.blanco
    fuente(ctx, 500, 42, TEXTO)
    const en = fig.e.noForzados
    ctx.fillText(`${fig.e.winners} winners y ${en} ${en === 1 ? 'error no forzado' : 'errores no forzados'}`, M, y + 180)
    y += 300
  }

  // Números de cada jugador
  const conDatos = d.jugadores.some((j) => {
    const e = d.stats[j.posicion]
    return e.winners + e.noForzados + e.forzados > 0
  })
  if (conDatos) {
    ctx.fillStyle = C.tenue
    fuente(ctx, 500, 34, TEXTO)
    ctx.textAlign = 'right'
    ctx.fillText('Winners', W - M - 170, y)
    ctx.fillText('Errores', W - M, y)
    y += 30
    for (const j of d.jugadores) {
      const e = d.stats[j.posicion]
      y += 78
      ctx.strokeStyle = C.linea
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(M, y - 58); ctx.lineTo(W - M, y - 58); ctx.stroke()
      ctx.textAlign = 'left'
      ctx.fillStyle = C.blanco
      texto(ctx, j.nombre, M, y, W - 2 * M - 360, 500, 50)
      ctx.textAlign = 'right'
      fuente(ctx, 600, 58)
      ctx.fillStyle = C.pelota
      ctx.fillText(String(e.winners), W - M - 170, y + 2)
      ctx.fillStyle = C.blanco
      ctx.fillText(String(e.noForzados + e.forzados), W - M, y + 2)
    }
  }

  // Pie
  ctx.textAlign = 'left'
  ctx.fillStyle = C.tenue
  fuente(ctx, 500, 36, TEXTO)
  const pie = [d.profe && `Profe: ${d.profe}`, d.club].filter(Boolean).join(', ')
  if (pie) texto(ctx, pie, M, H - 110, W - 2 * M, 500, 36, TEXTO)

  return new Promise((ok, mal) => canvas.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo crear la imagen'))), 'image/png'))
}

/** Comparte la imagen (celular) o la descarga (compu). */
export async function compartirImagen(blob: Blob, nombre: string) {
  const archivo = new File([blob], nombre, { type: 'image/png' })
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo] })
      return 'compartida'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelada'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'descargada'
}
