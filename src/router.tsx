import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { useAuth } from './auth/AuthProvider'
import { AppLayout } from './components/AppLayout'
import { Cargando } from './components/ui'
import { configFaltante } from './lib/supabase'
import { EntrarPage } from './pages/EntrarPage'
import { RegistroPage } from './pages/RegistroPage'
import { HoyPage } from './pages/HoyPage'
import { AgendaPage } from './pages/AgendaPage'
import { AlumnosPage } from './pages/AlumnosPage'
import { AlumnoPage } from './pages/AlumnoPage'
import { PerfilPage } from './pages/PerfilPage'
import { FaltaConfigPage } from './pages/FaltaConfigPage'
import { PartidosPage } from './pages/PartidosPage'
import { NuevoPartidoPage } from './pages/NuevoPartidoPage'
import { EnJuegoPage } from './pages/EnJuegoPage'
import { PartidoPage } from './pages/PartidoPage'
import { PagosPage } from './pages/PagosPage'
import { PerfilPublicoPage } from './pages/PerfilPublicoPage'

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
          { path: '/partidos', element: <PartidosPage /> },
          { path: '/partidos/nuevo', element: <NuevoPartidoPage /> },
          { path: '/partidos/:id', element: <PartidoPage /> },
          { path: '/alumnos', element: <AlumnosPage /> },
          { path: '/alumnos/:id', element: <AlumnoPage /> },
          { path: '/pagos', element: <PagosPage /> },
          { path: '/perfil', element: <PerfilPage /> },
        ],
      },
      // Pantalla completa, sin la barra de abajo.
      { path: '/partidos/en-juego', element: <EnJuegoPage /> },
    ],
  },
  // Link público del alumno: sin cuenta.
  { path: '/a/:token', element: configFaltante ? <FaltaConfigPage /> : <PerfilPublicoPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
