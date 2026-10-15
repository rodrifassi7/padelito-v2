import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { useAuth } from './auth/AuthProvider'
import { AppLayout } from './components/AppLayout'
import { Cargando } from './components/ui'
import { configFaltante } from './lib/supabase'
import { EntrarPage } from './pages/EntrarPage'
import { RegistroPage } from './pages/RegistroPage'
import { NuevaClavePage, RecuperarPage } from './pages/RecuperarPage'
import { HoyPage } from './pages/HoyPage'
import { AgendaPage } from './pages/AgendaPage'
import { AlumnosPage } from './pages/AlumnosPage'
import { AlumnoPage } from './pages/AlumnoPage'
import { FaltaConfigPage } from './pages/FaltaConfigPage'

/** Pantallas que se bajan recién cuando se abren (la app arranca más rápido en datos móviles). */
const diferida = (cargar: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await cargar()).default }),
  HydrateFallback: () => <Cargando pantalla />,
})

function SoloConSesion() {
  const { session, cargando } = useAuth()
  if (configFaltante) return <FaltaConfigPage />
  if (cargando) return <Cargando pantalla />
  if (!session) return <Navigate to="/entrar" replace />
  return <Outlet />
}

function SoloSinSesion() {
  const { session, cargando } = useAuth()
  if (configFaltante) return <FaltaConfigPage />
  if (cargando) return <Cargando pantalla />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <SoloSinSesion />,
    children: [
      { path: '/entrar', element: <EntrarPage /> },
      { path: '/registro', element: <RegistroPage /> },
      { path: '/recuperar', element: <RecuperarPage /> },
    ],
  },
  {
    element: <SoloConSesion />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HoyPage /> },
          { path: '/agenda', element: <AgendaPage /> },
          { path: '/partidos', ...diferida(() => import('./pages/PartidosPage').then((m) => ({ default: m.PartidosPage }))) },
          { path: '/partidos/nuevo', ...diferida(() => import('./pages/NuevoPartidoPage').then((m) => ({ default: m.NuevoPartidoPage }))) },
          { path: '/partidos/:id', ...diferida(() => import('./pages/PartidoPage').then((m) => ({ default: m.PartidoPage }))) },
          { path: '/alumnos', element: <AlumnosPage /> },
          { path: '/alumnos/:id', element: <AlumnoPage /> },
          { path: '/pagos', ...diferida(() => import('./pages/PagosPage').then((m) => ({ default: m.PagosPage }))) },
          { path: '/perfil', ...diferida(() => import('./pages/PerfilPage').then((m) => ({ default: m.PerfilPage }))) },
        ],
      },
      // Pantalla completa, sin la barra de abajo.
      { path: '/partidos/en-juego', ...diferida(() => import('./pages/EnJuegoPage').then((m) => ({ default: m.EnJuegoPage }))) },
    ],
  },
  // El link del mail de recuperación entra con sesión: no pasa por los guardias.
  { path: '/nueva-clave', element: configFaltante ? <FaltaConfigPage /> : <NuevaClavePage /> },
  // Link público del alumno: sin cuenta.
  configFaltante
    ? { path: '/a/:token', element: <FaltaConfigPage /> }
    : { path: '/a/:token', ...diferida(() => import('./pages/PerfilPublicoPage').then((m) => ({ default: m.PerfilPublicoPage }))) },
  { path: '*', element: <Navigate to="/" replace /> },
])
