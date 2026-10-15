import { NavLink, Outlet } from 'react-router'
import clsx from 'clsx'
import { CalendarDays, Sun, Trophy, Users, Wallet } from 'lucide-react'

const PESTANAS = [
  { a: '/', texto: 'Hoy', Icono: Sun },
  { a: '/agenda', texto: 'Agenda', Icono: CalendarDays },
  { a: '/partidos', texto: 'Partidos', Icono: Trophy },
  { a: '/alumnos', texto: 'Alumnos', Icono: Users },
  { a: '/pagos', texto: 'Pagos', Icono: Wallet },
]

export function AppLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <main className="pb-28">
        <Outlet />
      </main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-white/95 backdrop-blur">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {PESTANAS.map(({ a, texto, Icono }) => (
            <li key={a}>
              <NavLink
                to={a}
                end={a === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex h-16 flex-col items-center justify-center gap-0.5 text-[12.5px] font-medium',
                    isActive ? 'text-cancha' : 'text-tinta-suave',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icono className="size-6" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
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
