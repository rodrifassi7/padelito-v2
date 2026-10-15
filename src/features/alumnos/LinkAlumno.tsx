import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, Link2, MessageCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Boton, Hoja } from '../../components/ui'
import { linkWhatsapp } from '../../lib/etiquetas'
import { datos, mensajeError, supabase } from '../../lib/supabase'
import type { Alumno } from '../../lib/tipos'

export const urlPublica = (token: string) => `${window.location.origin}/a/${token}`

/** El link que el profe le pasa al alumno para que vea su progreso. */
export function LinkAlumno({ alumno }: { alumno: Alumno }) {
  const qc = useQueryClient()
  const [abierta, setAbierta] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const url = urlPublica(alumno.token_publico)
  const nombre = alumno.nombre.split(' ')[0]

  const regenerar = useMutation({
    mutationFn: async () => {
      datos(await supabase.from('alumnos').update({ token_publico: crypto.randomUUID() }).eq('id', alumno.id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alumno', alumno.id] })
      setConfirmar(false)
      toast.success('Link nuevo generado. El anterior ya no funciona.')
    },
    onError: (e) => toast.error(mensajeError(e)),
  })

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado')
    } catch {
      toast.error('No se pudo copiar. Mantené apretado el link para copiarlo.')
    }
  }

  const mensaje = `¡Hola ${nombre}! Acá podés ver en qué estamos trabajando y cómo venís mejorando: ${url}`

  return (
    <>
      <button onClick={() => setAbierta(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-linea bg-white font-semibold">
        <Link2 className="size-5" aria-hidden /> Su progreso
      </button>
      <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} titulo={`Link de ${nombre}`}>
        <p className="mb-4 text-tinta-suave">
          Una página donde {nombre} ve su objetivo, en qué está trabajando, lo que ya logró, su última evaluación y cómo le va en los partidos.
          No muestra tus notas de clase ni los pagos.
        </p>
        <p className="mb-4 rounded-xl border border-linea bg-white px-3.5 py-3 text-sm break-all select-all">{url}</p>
        <div className="flex flex-col gap-3">
          {alumno.telefono && (
            <a href={linkWhatsapp(alumno.telefono, mensaje)} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-cancha font-semibold text-white hover:bg-cancha-oscura">
              <MessageCircle className="size-5" aria-hidden /> Mandárselo por WhatsApp
            </a>
          )}
          <Boton variante="secundario" ancho onClick={copiar}>
            <Copy className="size-5" aria-hidden /> Copiar link
          </Boton>
          <a href={url} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-cancha hover:bg-cancha-clara">
            <ExternalLink className="size-5" aria-hidden /> Ver cómo lo ve {nombre}
          </a>
          <button
            onClick={() => (confirmar ? regenerar.mutate() : setConfirmar(true))}
            disabled={regenerar.isPending}
            className="mt-2 flex h-10 items-center justify-center gap-2 text-sm font-medium text-tinta-suave"
          >
            <RefreshCw className="size-4" aria-hidden />
            {confirmar ? 'Tocá de nuevo: el link actual va a dejar de andar' : 'Generar un link nuevo'}
          </button>
        </div>
      </Hoja>
    </>
  )
}
