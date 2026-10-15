import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { addMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { useAlumnos } from '../api/alumnos'
import { estadoCuenta, mesDe, nombreMes, textoMedio, usePagosDelMes, useSaldoClases, type EstadoCuenta } from '../api/pagos'
import { useProfe } from '../api/profe'
import { Avatar, Cargando, ErrorCarga, Seccion, Titulo, Vacio } from '../components/ui'
import { PagoHoja } from '../features/pagos/PagoHoja'
import { linkRecordatorio } from '../features/pagos/recordatorio'
import { pesos } from '../lib/etiquetas'
import { deIso, fechaCorta, hoyIso, iso, mesCorto } from '../lib/fechas'

export function PagosPage() {
  const [periodo, setPeriodo] = useState(() => mesDe(hoyIso()))
  const { data: alumnos, isPending: cargandoAlumnos, isError, refetch } = useAlumnos()
  const { data: pagos, isPending: cargandoPagos } = usePagosDelMes(periodo)
  const { data: saldos } = useSaldoClases()
  const { data: profe } = useProfe()
  const [cobrando, setCobrando] = useState<EstadoCuenta | null>(null)

  const estados = useMemo(() => {
    if (!alumnos || !pagos) return []
    return alumnos
      .filter((a) => a.activo)
      .map((a) => estadoCuenta(a, periodo, pagos, saldos?.find((s) => s.alumno_id === a.id)))
  }, [alumnos, pagos, saldos, periodo])

  const deben = estados.filter((e) => e.debe)
  const alDia = estados.filter((e) => !e.debe)
  const finMes = iso(addMonths(deIso(periodo), 1))
  const cobrado = (pagos ?? []).filter((p) => p.fecha >= periodo && p.fecha < finMes).reduce((s, p) => s + Number(p.monto), 0)
  const falta = deben.reduce((s, e) => s + (e.monto ?? 0), 0)
  const esMesActual = periodo === mesDe(hoyIso())

  const fila = (e: EstadoCuenta) => {
    const wa = e.debe ? linkRecordatorio(e, periodo, profe?.alias_pago ?? null) : null
    let detalle: string
    if (e.alumno.modalidad_pago === 'por_clase') {
      detalle = e.debe ? `${e.clasesAdeudadas} ${e.clasesAdeudadas === 1 ? 'clase' : 'clases'} sin pagar` : 'Por clase, sin deuda'
    } else if (e.pagoDelMes) {
      detalle = `${textoMedio(e.pagoDelMes.medio)}, ${fechaCorta(deIso(e.pagoDelMes.fecha))}`
    } else detalle = `Cuota de ${nombreMes(periodo)}`
    return (
      <li key={e.alumno.id} className="border-b border-linea px-4 py-3 last:border-b-0">
        <div className="flex items-center gap-3">
          <Link to={`/alumnos/${e.alumno.id}?tab=pagos`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar nombre={e.alumno.nombre} tam="sm" />
            <span className="min-w-0">
              <span className="block truncate font-medium">{e.alumno.nombre}</span>
              <span className="block truncate text-sm text-tinta-suave">{detalle}</span>
            </span>
          </Link>
          <span className="shrink-0 text-right font-semibold tabular">
            {e.monto != null ? pesos(e.monto) : <span className="text-sm font-normal text-tinta-suave">Sin precio</span>}
          </span>
        </div>
        {e.debe && (
          <div className="mt-2.5 flex justify-end gap-2 pl-11">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener"
                className="flex h-10 items-center gap-1.5 rounded-xl border border-linea px-3.5 text-sm font-semibold text-acento hover:bg-acento-suave"
                aria-label={`Mandarle el recordatorio a ${e.alumno.nombre} por WhatsApp`}
              >
                <MessageCircle className="size-4" aria-hidden /> Recordar
              </a>
            )}
            <button onClick={() => setCobrando(e)} className="h-10 rounded-xl bg-primario px-4 text-sm font-semibold text-sobre-primario hover:brightness-95">
              Cobrar
            </button>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="px-4">
      <Titulo>Pagos</Titulo>

      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setPeriodo(mesDe(iso(addMonths(deIso(periodo), -1))))} className="grid size-10 place-items-center rounded-full hover:bg-linea/60" aria-label="Mes anterior">
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-display text-[17px] font-bold first-letter:uppercase tracking-tight">{mesCorto(deIso(periodo))}</p>
        <button
          onClick={() => setPeriodo(mesDe(iso(addMonths(deIso(periodo), 1))))}
          disabled={esMesActual}
          className="grid size-10 place-items-center rounded-full hover:bg-linea/60 disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {(cargandoAlumnos || cargandoPagos) && <Cargando />}
      {isError && <ErrorCarga onReintentar={() => refetch()} />}
      {alumnos && alumnos.length === 0 && <Vacio titulo="Sin alumnos" texto="Cuando cargues alumnos con su cuota, acá ves quién pagó y quién no." />}

      {estados.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-pelota px-4 py-3.5 text-noche">
              <p className="text-sm text-noche/75">Cobrado</p>
              <p className="font-display text-[23px] font-bold tabular tracking-tight">{pesos(cobrado)}</p>
            </div>
            <div className="rounded-2xl vidrio border border-linea bg-superficie px-4 py-3.5">
              <p className="text-sm text-tinta-suave">Falta cobrar</p>
              <p className="font-display text-[23px] font-bold tabular tracking-tight">{pesos(falta)}</p>
            </div>
          </div>

          <Seccion titulo={deben.length ? `Deben (${deben.length})` : 'Deben'}>
            {deben.length ? (
              <ul className="overflow-hidden rounded-2xl vidrio border border-linea bg-superficie">{deben.map(fila)}</ul>
            ) : (
              <p className="rounded-2xl vidrio border border-linea bg-superficie px-4 py-3 text-tinta-suave">Todos al día.</p>
            )}
          </Seccion>

          {alDia.length > 0 && (
            <Seccion titulo={`Al día (${alDia.length})`}>
              <ul className="overflow-hidden rounded-2xl vidrio border border-linea bg-superficie">{alDia.map(fila)}</ul>
            </Seccion>
          )}

          <p className="mt-5 text-sm text-tinta-suave">
            Los que pagan por mes deben si no tienen cargada la cuota de {nombreMes(periodo)}. Los que pagan por clase deben las clases a las que vinieron y todavía no pagaron.
          </p>
        </>
      )}

      {cobrando && (
        <PagoHoja alumno={cobrando.alumno} periodo={periodo} clasesSugeridas={cobrando.clasesAdeudadas} onCerrar={() => setCobrando(null)} />
      )}
    </div>
  )
}
