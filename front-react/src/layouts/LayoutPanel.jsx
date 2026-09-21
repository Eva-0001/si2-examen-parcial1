import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth, useAuthStore } from '@/core/stores/auth.store'
import { cx } from '@/shared/utils/clases'

const MENUS = {
  administrador: [
    { titulo: 'General', items: [{ icono: 'dashboard', etiqueta: 'Tablero', ruta: '/panel' }] },
    {
      titulo: 'Catálogo',
      items: [
        { icono: 'list_alt', etiqueta: 'Catálogos maestros', ruta: '/panel/catalogos' },
        { icono: 'inventory_2', etiqueta: 'Productos', ruta: '/panel/productos' },
        { icono: 'sell', etiqueta: 'Promociones', ruta: '/panel/promociones' },
        { icono: 'local_shipping', etiqueta: 'Proveedores', ruta: '/panel/proveedores' },
      ],
    },
    {
      titulo: 'Operaciones',
      items: [
        { icono: 'analytics', etiqueta: 'Inventario global', ruta: '/panel/inventario' },
        { icono: 'receipt_long', etiqueta: 'Ventas', ruta: '/panel/ventas' },
        { icono: 'confirmation_number', etiqueta: 'Comprobantes', ruta: '/panel/comprobantes' },
        { icono: 'history', etiqueta: 'Bitácora', ruta: '/panel/bitacora' },
        { icono: 'psychology', etiqueta: 'Reportes con IA', ruta: '/panel/reportes' },
      ],
    },
    {
      titulo: 'Sistema',
      items: [
        { icono: 'group', etiqueta: 'Usuarios', ruta: '/panel/usuarios' },
        { icono: 'security', etiqueta: 'Roles', ruta: '/panel/roles' },
        { icono: 'badge', etiqueta: 'Trabajadores', ruta: '/panel/trabajadores' },
        { icono: 'store', etiqueta: 'Sucursales', ruta: '/panel/sucursales' },
        { icono: 'location_city', etiqueta: 'Ciudades', ruta: '/panel/ciudades' },
      ],
    },
  ],
  encargado: [
    {
      titulo: null,
      items: [
        { icono: 'event', etiqueta: 'Reservas de mi sucursal', ruta: '/panel/reservas-sucursal' },
        { icono: 'inventory_2', etiqueta: 'Stock de mi sucursal', ruta: '/panel/stock' },
        { icono: 'receipt_long', etiqueta: 'Ventas de mi sucursal', ruta: '/panel/ventas-sucursal' },
        { icono: 'psychology', etiqueta: 'Reportes con IA', ruta: '/panel/reportes' },
      ],
    },
  ],
  cajero: [
    {
      titulo: null,
      items: [
        { icono: 'point_of_sale', etiqueta: 'Punto de venta', ruta: '/panel/pos' },
        { icono: 'psychology', etiqueta: 'Reportes con IA', ruta: '/panel/reportes' },
      ],
    },
  ],
  proveedor: [
    {
      titulo: null,
      items: [{ icono: 'inventory_2', etiqueta: 'Mis productos', ruta: '/panel/mis-productos' }],
    },
  ],
}

const ETIQUETAS_ROL = {
  administrador: 'Administrador',
  encargado: 'Encargado',
  cajero: 'Cajero',
  proveedor: 'Proveedor',
}

export default function LayoutPanel() {
  const auth = useAuth()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const [colapsada, setColapsada] = useState(auth.esCajero)

  const secciones = MENUS[auth.rol ?? ''] ?? []
  const etiquetaRol = auth.rol ? (ETIQUETAS_ROL[auth.rol] ?? auth.rol) : ''
  const u = auth.usuario
  const iniciales = u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase() : ''

  const cerrarSesion = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <nav
        className={cx(
          'no-imprimir fixed left-0 top-0 z-20 flex h-screen flex-col border-r border-outline-variant bg-surface-container-lowest py-4 transition-all',
          colapsada ? 'w-[72px] px-2' : 'w-[260px] px-4',
        )}
      >
        <Link to="/panel" className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-card">
            <span className="material-symbols-outlined text-white">storefront</span>
          </div>
          {!colapsada && (
            <div>
              <h1 className="text-base font-bold leading-tight text-primary">FashionStore</h1>
              <p className="text-xs text-on-surface-variant">{etiquetaRol}</p>
            </div>
          )}
        </Link>

        <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden">
          {secciones.map((seccion) => (
            <div key={seccion.titulo ?? 'sin-titulo'}>
              {seccion.titulo && !colapsada && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {seccion.titulo}
                </p>
              )}
              <div className="space-y-1">
                {seccion.items.map((item) => (
                  <NavLink
                    key={item.ruta}
                    to={item.ruta}
                    end={item.ruta === '/panel'}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary',
                        colapsada && 'justify-center',
                        isActive && 'bg-surface-container text-primary',
                      )
                    }
                    title={item.etiqueta}
                  >
                    <span className="material-symbols-outlined shrink-0">{item.icono}</span>
                    {!colapsada && <span className="truncate">{item.etiqueta}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-outline-variant pt-3">
          <div className={cx('flex items-center gap-3 px-2 py-2', colapsada && 'justify-center')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary">
              {iniciales}
            </div>
            {!colapsada && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-on-surface">{[u?.nombre, u?.apellido].join(' ')}</p>
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {etiquetaRol}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className={cx(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-error/5 hover:text-error',
              colapsada && 'justify-center',
            )}
            onClick={cerrarSesion}
            title="Cerrar sesión"
          >
            <span className="material-symbols-outlined shrink-0">logout</span>
            {!colapsada && <span>Cerrar sesión</span>}
          </button>
        </div>
      </nav>

      <div
        className={cx(
          'flex min-h-screen flex-1 flex-col transition-all print:ml-0!',
          colapsada ? 'ml-[72px]' : 'ml-[260px]',
        )}
      >
        <header className="no-imprimir sticky top-0 z-10 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6 shadow-card">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              onClick={() => setColapsada(!colapsada)}
              aria-label="Colapsar menú"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link to="/" className="hidden items-center gap-1 text-xs text-on-surface-variant hover:text-primary sm:flex">
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              Ver tienda
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-64 rounded-lg border border-outline-variant bg-surface py-1.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              className="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              aria-label="Notificaciones"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <Link
              to="/perfil"
              title="Mi perfil"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
            >
              {iniciales}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-6">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
