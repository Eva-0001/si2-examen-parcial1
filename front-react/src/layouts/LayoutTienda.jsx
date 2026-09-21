import { Fragment, Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth, useAuthStore } from '@/core/stores/auth.store'
import { useSucursalActiva } from '@/core/stores/sucursal-activa.store'
import { useCarrito } from '@/core/stores/carrito.store'
import PanelCarrito from '@/features/carrito/components/PanelCarrito'
import AsistenteIa from '@/features/asistente/components/AsistenteIa'
import { conQuery } from '@/shared/utils/query'
import { cx } from '@/shared/utils/clases'

const claseEnlace = ({ isActive }) =>
  cx('text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary', isActive && 'text-primary')

export default function LayoutTienda() {
  const auth = useAuth()
  const logout = useAuthStore((s) => s.logout)
  const sucursalActiva = useSucursalActiva()
  const carrito = useCarrito()
  const navigate = useNavigate()

  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)

  const u = auth.usuario
  const iniciales = u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase() : ''

  const esStaff = auth.estaLogueado && !auth.esCliente

  const cargarSucursales = sucursalActiva.cargar
  useEffect(() => {
    cargarSucursales()
  }, [cargarSucursales])

  const sucursalesDe = (ciudadId) => sucursalActiva.sucursales.filter((s) => s.ciudad_id === ciudadId)

  const elegirSucursal = (sucursal) => {
    sucursalActiva.seleccionar(sucursal)
    setSelectorAbierto(false)
  }

  const cerrarMenus = () => {
    setSelectorAbierto(false)
    setMenuUsuarioAbierto(false)
  }

  const buscar = (texto) => {
    const q = texto.trim()
    navigate(conQuery('/catalogo', { q: q || null }))
  }

  const cerrarSesion = () => {
    cerrarMenus()
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-imprimir fixed inset-x-0 top-0 z-40 border-b border-outline-variant bg-surface-container-lowest shadow-card">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 md:px-6">
          <Link to="/" className="shrink-0 text-xl font-bold tracking-tight text-primary">
            FashionStore
          </Link>

          <div className="relative hidden lg:block">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container"
              onClick={() => {
                setSelectorAbierto(!selectorAbierto)
                setMenuUsuarioAbierto(false)
              }}
            >
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {sucursalActiva.sucursal ? (
                <>
                  <span className="font-semibold">{sucursalActiva.ciudad?.nombre ?? 'Sucursal'}</span>
                  <span>•</span>
                  <span className="max-w-44 truncate">{sucursalActiva.sucursal.nombre}</span>
                </>
              ) : (
                <span className="font-semibold">Elige tu sucursal</span>
              )}
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {selectorAbierto && (
              <div className="absolute left-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-xl">
                {sucursalActiva.ciudades.length > 0 ? (
                  sucursalActiva.ciudades.map((ciudad) => (
                    <Fragment key={ciudad.id}>
                      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        {ciudad.nombre}
                      </p>
                      {sucursalesDe(ciudad.id).map((sucursal) => (
                        <button
                          key={sucursal.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-container-low"
                          onClick={() => elegirSucursal(sucursal)}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-on-surface">{sucursal.nombre}</p>
                            <p className="text-xs text-on-surface-variant">{sucursal.ubicacion}</p>
                          </div>
                          {sucursalActiva.sucursal?.id === sucursal.id && (
                            <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                          )}
                        </button>
                      ))}
                    </Fragment>
                  ))
                ) : (
                  <p className="px-3 py-4 text-sm text-on-surface-variant">No hay sucursales cargadas.</p>
                )}
              </div>
            )}
          </div>

          <div className="relative hidden max-w-md flex-1 md:flex">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              placeholder="Buscar productos..."
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') buscar(e.currentTarget.value)
              }}
            />
          </div>

          <nav className="ml-auto hidden items-center gap-6 lg:flex">
            <NavLink to="/catalogo" className={claseEnlace}>
              Catálogo
            </NavLink>
            <NavLink to="/promociones" className={claseEnlace}>
              Promociones
            </NavLink>
            <NavLink to="/sucursales" className={claseEnlace}>
              Sucursales
            </NavLink>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              aria-label="Carrito"
              onClick={() => {
                carrito.abrir()
                cerrarMenus()
              }}
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              {carrito.cantidadTotal > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-promo-accent px-1 text-[10px] font-bold text-white">
                  {carrito.cantidadTotal}
                </span>
              )}
            </button>

            {auth.estaLogueado ? (
              <div className="relative">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary"
                  onClick={() => {
                    setMenuUsuarioAbierto(!menuUsuarioAbierto)
                    setSelectorAbierto(false)
                  }}
                >
                  {iniciales}
                </button>

                {menuUsuarioAbierto && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-outline-variant bg-surface-container-lowest py-2 shadow-xl">
                    <div className="border-b border-outline-variant px-4 pb-2">
                      <p className="text-sm font-semibold text-on-surface">
                        {u?.nombre} {u?.apellido}
                      </p>
                      <p className="text-xs text-on-surface-variant">{u?.correo}</p>
                    </div>
                    {esStaff && (
                      <Link
                        to="/panel"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                        onClick={cerrarMenus}
                      >
                        <span className="material-symbols-outlined text-[20px]">space_dashboard</span> Ir al panel
                      </Link>
                    )}
                    <Link
                      to="/pedidos"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                      onClick={cerrarMenus}
                    >
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span> Mis pedidos
                    </Link>
                    <Link
                      to="/reservas"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                      onClick={cerrarMenus}
                    >
                      <span className="material-symbols-outlined text-[20px]">event</span> Mis reservas
                    </Link>
                    <Link
                      to="/perfil"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                      onClick={cerrarMenus}
                    >
                      <span className="material-symbols-outlined text-[20px]">person</span> Mi perfil
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-error hover:bg-error/5"
                      onClick={cerrarSesion}
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {(selectorAbierto || menuUsuarioAbierto) && (
        <div className="fixed inset-0 z-30" onClick={cerrarMenus} aria-hidden="true"></div>
      )}

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-12 pt-24 md:px-6 print:pt-0">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>

      <div className="no-imprimir">
        <PanelCarrito />
      </div>
      <div className="no-imprimir">
        <AsistenteIa />
      </div>

      <footer className="no-imprimir bg-on-surface text-white/80">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-6 px-4 py-10 text-xs md:flex-row md:items-start md:px-6">
          <div className="flex flex-col items-center gap-1.5 md:items-start">
            <span className="text-base font-bold tracking-tight text-white">FashionStore</span>
            <p>Santa Cruz de la Sierra • La Paz • Cochabamba</p>            
            <p className="mt-2 text-white/60">2026 FashionStore Bolivia. Todos los derechos reservados.</p>
          </div>         
        </div>
      </footer>
    </div>
  )
}
