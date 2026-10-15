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

function SoloConSesion() {
  const { session, cargando } = useAuth()
  if (configFaltante) return <FaltaConfigPage />
  if (cargando) return <Cargando pantalla />
  if (!session) return <Navigate to="/entrar" replace />
  return <AppLayout />
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
      { path: '/', element: <HoyPage /> },
      { path: '/agenda', element: <AgendaPage /> },
      { path: '/alumnos', element: <AlumnosPage /> },
      { path: '/alumnos/:id', element: <AlumnoPage /> },
      { path: '/perfil', element: <PerfilPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
