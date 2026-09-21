import { create } from 'zustand'

export const TOKEN_KEY = 'token'
export const USER_KEY = 'usuario'

export const useAuthStore = create((set, get) => ({
  usuario: leerUsuarioGuardado(),

  sesionExpirada: false,

  guardarSesion(res) {
    localStorage.setItem(TOKEN_KEY, res.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.usuario))
    set({ usuario: res.usuario, sesionExpirada: false })
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ usuario: null })
  },

  expirarSesion() {
    if (get().usuario === null) return
    get().logout()
    set({ sesionExpirada: true })
  },

  cerrarAvisoSesion() {
    set({ sesionExpirada: false })
  },

  actualizarUsuario(cambios) {
    const actual = get().usuario
    if (!actual) return

    const fusion = { ...actual, ...cambios, rol: cambios.rol ?? actual.rol }
    localStorage.setItem(USER_KEY, JSON.stringify(fusion))
    set({ usuario: fusion })
  },
}))

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function rutaInicioDe(rol) {
  switch (rol) {
    case 'administrador':
      return '/panel'
    case 'encargado':
      return '/panel/reservas-sucursal'
    case 'cajero':
      return '/panel/pos'
    case 'proveedor':
      return '/panel/mis-productos'
    default:
      return '/'
  }
}

export function construirAuth(usuario) {
  const rol = usuario?.rol?.nombre ?? null
  return {
    usuario,
    estaLogueado: usuario !== null,
    rol,
    esAdmin: rol === 'administrador',
    esEncargado: rol === 'encargado',
    esCajero: rol === 'cajero',
    esProveedor: rol === 'proveedor',
    esCliente: rol === 'cliente',
    tieneRol: (...roles) => rol !== null && roles.includes(rol),
    rutaInicio: () => rutaInicioDe(rol),
  }
}

export function useAuth() {
  const usuario = useAuthStore((s) => s.usuario)
  return construirAuth(usuario)
}

export function authActual() {
  return construirAuth(useAuthStore.getState().usuario)
}

function leerUsuarioGuardado() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
