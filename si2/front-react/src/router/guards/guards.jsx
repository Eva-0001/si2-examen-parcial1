import { Navigate, Outlet, useLocation } from 'react-router'
import { authActual } from '@/core/stores/auth.store'
import { conQuery } from '@/shared/utils/query'

export function RequireAuth({ children }) {
  const location = useLocation()
  if (!authActual().estaLogueado) {
    return <Navigate to={conQuery('/login', { redirect: location.pathname + location.search })} replace />
  }
  return children ?? <Outlet />
}

export function RequireRol({ roles, children }) {
  useLocation()
  if (!authActual().tieneRol(...roles)) return <Navigate to="/sin-permiso" replace />
  return children ?? <Outlet />
}

export function SoloInvitado({ children }) {
  useLocation()
  const auth = authActual()
  if (auth.estaLogueado) return <Navigate to={auth.rutaInicio()} replace />
  return children ?? <Outlet />
}

export function InicioPanel({ children }) {
  useLocation()
  const auth = authActual()
  if (!auth.esAdmin) return <Navigate to={auth.rutaInicio()} replace />
  return children ?? <Outlet />
}
