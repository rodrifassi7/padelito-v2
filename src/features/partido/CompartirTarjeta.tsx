import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProfe } from '../../api/profe'
import type { PartidoGuardado, PuntoGuardado } from '../../api/partidos'
import { Boton, Cargando, Hoja } from '../../components/ui'
import { deIso, fechaLarga } from '../../lib/fechas'
import { estadisticasPorJugador } from './estadisticas'
import { compartirImagen, dibujarTarjeta } from './tarjeta'

/** Botón + vista previa de la tarjeta del partido para compartir. */
export function CompartirTarjeta({ partido, puntos }: { partido: PartidoGuardado; puntos: PuntoGuardado[] }) {
  const { data: profe } = useProfe()
  const [abierta, setAbierta] = useState(false)
  const [imagen, setImagen] = useState<{ blob: Blob; url: string } | null>(null)

  useEffect(() => {
    if (!abierta) return
    let url: string | null = null
    let vigente = true
    dibujarTarjeta({
      fecha: fechaLarga(deIso(partido.fecha)),
      sets: partido.sets,
      ganador: partido.ganador,
      jugadores: partido.jugadores,
      stats: estadisticasPorJugador(puntos),
      profe: profe?.nombre ?? null,
      club: profe?.club ?? null,
    })
      .then((blob) => {
        if (!vigente) return
        url = URL.createObjectURL(blob)
        setImagen({ blob, url })
      })
      .catch(() => toast.error('No se pudo armar la imagen.'))
    return () => {
      vigente = false
      if (url) URL.revokeObjectURL(url)
      setImagen(null)
    }
  }, [abierta, partido, puntos, profe])

  async function compartir() {
    if (!imagen) return
    const r = await compartirImagen(imagen.blob, `partido-${partido.fecha}.png`)
    if (r === 'descargada') toast.success('Imagen descargada')
  }

  return (
    <>
      <Boton ancho className="mt-3" onClick={() => setAbierta(true)}>
        <Share2 className="size-5" aria-hidden /> Compartir resultado
      </Boton>
      <Hoja
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        titulo="Compartir resultado"
        pie={
          <Boton ancho disabled={!imagen} onClick={compartir}>
            <Share2 className="size-5" aria-hidden /> Compartir imagen
          </Boton>
        }
      >
        {imagen ? (
          <img src={imagen.url} alt="Tarjeta con el resultado del partido" className="mx-auto w-full max-w-[18rem] rounded-2xl shadow-lg" />
        ) : (
          <Cargando />
        )}
        <p className="mt-3 text-center text-sm text-tinta-suave">Lista para subir como historia de Instagram o mandar por WhatsApp.</p>
      </Hoja>
    </>
  )
}
