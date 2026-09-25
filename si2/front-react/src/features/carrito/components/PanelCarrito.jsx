import { useNavigate } from 'react-router'
import { useCarrito, useCarritoStore } from '@/core/stores/carrito.store'
import { authActual } from '@/core/stores/auth.store'
import { useEscape } from '@/shared/hooks/useEscape'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { conQuery } from '@/shared/utils/query'
import { cx } from '@/shared/utils/clases'

export default function PanelCarrito() {
  const carrito = useCarrito()
  const navigate = useNavigate()

  useEscape(() => useCarritoStore.getState().cerrar())

  const cambiar = (item, delta) => carrito.cambiarCantidad(item.producto_sucursal_id, item.cantidad + delta)

  const continuar = () => {
    carrito.cerrar()
    if (!authActual().estaLogueado) {
      navigate(conQuery('/login', { redirect: '/checkout' }))
      return
    }
    navigate('/checkout')
  }

  const irAlCatalogo = () => {
    carrito.cerrar()
    navigate('/catalogo')
  }

  return (
    <>
      {carrito.abierto && (
        <div className="fixed inset-0 z-50 bg-on-surface/50 backdrop-blur-sm" onClick={carrito.cerrar} aria-hidden="true"></div>
      )}

      <aside
        className={cx(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-surface-container-lowest shadow-2xl transition-transform duration-300',
          carrito.abierto ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-label="Carrito de compras"
        aria-hidden={!carrito.abierto}
      >
        <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">shopping_cart</span>
            Tu carrito
            {carrito.cantidadTotal > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-primary">
                {carrito.cantidadTotal}
              </span>
            )}
          </h2>
          <button type="button" className="btn-icono" onClick={carrito.cerrar} aria-label="Cerrar carrito">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {carrito.mezclado && (
          <div className="mx-5 mt-4 rounded-lg border-l-4 border-warning bg-warning/10 p-3 text-sm text-on-surface" role="alert">
            <p className="flex items-start gap-2 font-semibold">
              <span className="material-symbols-outlined text-[20px] text-warning">warning</span>
              Todos los productos deben ser de la misma sucursal
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">Elige con cuál seguir y quitamos el resto:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {carrito.sucursales.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="rounded-full border border-warning bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface hover:bg-warning hover:text-white"
                  onClick={() => carrito.conservarSucursal(s.id)}
                >
                  Solo {s.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {carrito.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
                <span className="material-symbols-outlined text-[40px] text-primary">shopping_bag</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface">Tu carrito está vacío</h3>
              <p className="mt-1 max-w-xs text-sm text-on-surface-variant">
                Agrega prendas desde el catálogo. El stock y el precio dependen de la sucursal que elijas.
              </p>
              <button type="button" className="btn-primario mt-6" onClick={irAlCatalogo}>
                Ver catálogo
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {carrito.items.map((item) => (
                <li key={item.producto_sucursal_id} className="flex gap-3 py-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                    {item.foto ? (
                      <img src={item.foto} alt={item.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-primary/40">
                        <span className="material-symbols-outlined">checkroom</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-on-surface">{item.nombre}</p>
                        <p className="text-xs text-on-surface-variant">
                          {[item.color, item.talla ? 'Talla ' + item.talla : null].join(' · ')}
                        </p>
                        <p
                          className={cx(
                            'mt-0.5 flex items-center gap-1 text-[11px]',
                            carrito.mezclado ? 'font-semibold text-warning' : 'text-on-surface-variant',
                          )}
                        >
                          <span className="material-symbols-outlined text-[14px]">store</span>
                          {item.sucursal}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-icono-peligro p-1"
                        title="Quitar"
                        onClick={() => carrito.quitar(item.producto_sucursal_id)}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-outline-variant">
                        <button
                          type="button"
                          className="px-2 py-1 text-on-surface-variant hover:text-primary"
                          onClick={() => cambiar(item, -1)}
                          aria-label="Menos"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="min-w-7 text-center text-sm font-semibold tabular-nums">{item.cantidad}</span>
                        <button
                          type="button"
                          className="px-2 py-1 text-on-surface-variant hover:text-primary disabled:opacity-40"
                          disabled={item.cantidad >= item.maximo}
                          onClick={() => cambiar(item, 1)}
                          aria-label="Más"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-on-surface">{monedaBs(item.precio * item.cantidad)}</p>
                        {item.cantidad > 1 && (
                          <p className="text-[11px] text-on-surface-variant">{monedaBs(item.precio)} c/u</p>
                        )}
                      </div>
                    </div>
                    {item.cantidad >= item.maximo && (
                      <p className="mt-1 text-[11px] text-warning">Máximo disponible en esta sucursal</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {carrito.items.length > 0 && (
          <footer className="border-t border-outline-variant px-5 py-4">
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Subtotal</span>
              <span className="tabular-nums">{monedaBs(carrito.subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-base font-bold text-on-surface">
              <span>Total</span>
              <span className="tabular-nums">{monedaBs(carrito.total)}</span>
            </div>
            {carrito.sucursal && <p className="mt-1 text-xs text-on-surface-variant">Retiro en {carrito.sucursal.nombre}</p>}
            <button type="button" className="btn-primario mt-4 w-full py-3" disabled={carrito.mezclado} onClick={continuar}>
              Continuar con la compra
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button
              type="button"
              className="mt-2 w-full text-xs font-semibold text-on-surface-variant hover:text-error"
              onClick={carrito.vaciar}
            >
              Vaciar carrito
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
