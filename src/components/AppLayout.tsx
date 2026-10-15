import { NavLink, Outlet, useLocation } from 'react-router'
import clsx from 'clsx'
import { CalendarDays, Sun, Trophy, Users, Wallet } from 'lucide-react'
import { FondoCancha } from './MarcaCancha'

const PESTANAS = [
  { a: '/', texto: 'Hoy', Icono: Sun },
  { a: '/agenda', texto: 'Agenda', Icono: CalendarDays },
  { a: '/partidos', texto: 'Partidos', Icono: Trophy },
  { a: '/alumnos', texto: 'Alumnos', Icono: Users },
  { a: '/pagos', texto: 'Pagos', Icono: Wallet },
]

export function AppLayout() {
  // La pelota decora solo la pantalla Hoy: en las demás taparía números y textos.
  const { pathname } = useLocation()
  return (
    <div className="relative isolate mx-auto min-h-dvh max-w-lg">
      <FondoCancha pelota={pathname === '/' ? 'medio' : 'ninguna'} />
      <main className="pb-32">
        <Outlet />
      </main>
      {/* Barra flotante de vidrio */}
      <nav
        className="vidrio fixed inset-x-4 bottom-[max(env(safe-area-inset-bottom),1.25rem)] z-40 mx-auto max-w-[30rem] rounded-full border border-white/35 bg-noche/55 shadow-[0_14px_30px_rgba(6,18,64,0.4)]"
        aria-label="Secciones"
      >
        <ul className="grid grid-cols-5 px-1.5 py-1.5">
          {PESTANAS.map(({ a, texto, Icono }) => (
            <li key={a} className="flex justify-center">
              <NavLink
                to={a}
                end={a === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex h-[54px] w-full max-w-[66px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors',
                    isActive ? 'bg-white text-cancha' : 'text-white/85 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icono className="size-[22px]" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
                    {texto}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
