import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft } from 'lucide-react'
import { Hoja } from '../../components/ui'
import { golpesPara, textoTipo, TIPOS } from './golpes'
import type { Jugador, TipoPunto } from './tipos'

const ESTILO_TIPO: Record<TipoPunto, string> = {
  winner: 'bg-pelota text-tinta',
  error_no_forzado: 'bg-falta text-white',
  error_forzado: 'bg-aviso-clara text-aviso border border-aviso/40',
}

interface Props {
  jugador: Jugador | null
  onCerrar: () => void
  onMarcar: (tipo: TipoPunto, golpe: string | null) => void
}

/** Dos toques: qué fue (winner o error) y con qué golpe. */
export function MarcarPuntoHoja({ jugador, onCerrar, onMarcar }: Props) {
  const [tipo, setTipo] = useState<TipoPunto | null>(null)

  useEffect(() => setTipo(null), [jugador])

  if (!jugador) return null

  return (
    <Hoja abierta onCerrar={onCerrar} titulo={jugador.nombre}>
      {!tipo ? (
        <div className="flex flex-col gap-3 pb-2">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setTipo(t.valor)}
              className={clsx('h-[4.5rem] rounded-2xl font-display text-2xl font-semibold active:scale-[.98]', ESTILO_TIPO[t.valor])}
            >
              {t.texto}
            </button>
          ))}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setTipo(null)}
            className={clsx('mb-4 inline-flex h-9 items-center gap-1 rounded-full pr-3.5 pl-2 text-sm font-semibold', ESTILO_TIPO[tipo])}
          >
            <ChevronLeft className="size-4" aria-hidden /> {textoTipo(tipo)}
          </button>
          <p className="mb-2 text-tinta-suave">¿Con qué golpe?</p>
          <div className="grid grid-cols-2 gap-2 pb-2">
            {golpesPara(tipo).map((g) => (
              <button
                key={g.clave}
                type="button"
                onClick={() => onMarcar(tipo, g.clave)}
                className="h-12 rounded-xl border border-linea bg-white font-semibold hover:border-cancha active:bg-cancha-clara"
              >
                {g.texto}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onMarcar(tipo, null)}
              className="col-span-2 h-12 rounded-xl font-medium text-tinta-suave hover:bg-linea/60"
            >
              Sin especificar golpe
            </button>
          </div>
        </>
      )}
    </Hoja>
  )
}
