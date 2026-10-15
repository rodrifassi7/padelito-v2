import type { ReactNode } from 'react'
import { Target } from 'lucide-react'
import { paraTrabajar, type ConteoGolpe, type Estadisticas } from './estadisticas'
import { textoGolpe } from './golpes'

function Numero({ valor, texto, clase }: { valor: number; texto: string; clase: string }) {
  return (
    <div className={`flex flex-col items-center rounded-xl px-2 py-2.5 ${clase}`}>
      <span className="font-display text-[23px] leading-none font-bold tabular tracking-tight">{valor}</span>
      <span className="mt-1 text-center text-xs leading-tight font-medium">{texto}</span>
    </div>
  )
}

function ListaGolpes({ titulo, golpes, max = 3 }: { titulo: string; golpes: ConteoGolpe[]; max?: number }) {
  if (!golpes.length) return null
  return (
    <div>
      <p className="mb-1 text-sm text-tinta-suave">{titulo}</p>
      <p className="leading-snug">
        {golpes.slice(0, max).map((g, i) => (
          <span key={g.golpe}>
            {i > 0 && ', '}
            {textoGolpe(g.golpe)} <span className="font-semibold tabular">{g.cantidad}</span>
          </span>
        ))}
      </p>
    </div>
  )
}

/** Winners, errores, efectividad y golpes de un jugador (un partido o varios). */
export function ResumenEstadisticas({ e, encabezado }: { e: Estadisticas; encabezado?: ReactNode }) {
  const trabajar = paraTrabajar(e)
  const total = e.winners + e.noForzados + e.forzados
  return (
    <div className="rounded-2xl vidrio border border-linea bg-superficie p-4">
      {encabezado}
      {total === 0 ? (
        <p className="text-tinta-suave">Sin puntos marcados.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Numero valor={e.winners} texto="Winners" clase="bg-pelota text-noche" />
            <Numero valor={e.noForzados} texto="Errores no forzados" clase="bg-falta-clara text-falta" />
            <Numero valor={e.forzados} texto="Errores forzados" clase="bg-aviso-clara text-aviso" />
          </div>
          {e.efectividad !== null && (
            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <span className="text-tinta-suave">Efectividad</span>
                <span className="font-semibold tabular">{e.efectividad}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-linea" aria-hidden>
                <div className="h-full rounded-full bg-primario" style={{ width: `${e.efectividad}%` }} />
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3">
            <ListaGolpes titulo="Gana con" golpes={e.winnersPorGolpe} />
            <ListaGolpes titulo="Falla con" golpes={e.noForzadosPorGolpe} />
          </div>
          {trabajar && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-acento-suave px-3 py-2.5 text-tinta">
              <Target className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Para trabajar: <strong>{textoGolpe(trabajar.golpe).toLowerCase()}</strong> ({trabajar.cantidad} errores no forzados)
              </span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
