import { useState } from 'react'
import { Link } from 'react-router'
import { cx } from '@/shared/utils/clases'

const FOTO = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80'

export default function PanelAuth({ ancho = 'chico', children }) {
  const [fotoFallo, setFotoFallo] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="relative hidden w-1/2 overflow-hidden bg-on-surface text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        {!fotoFallo && (
          <img
            src={FOTO}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            onError={() => setFotoFallo(true)}
          />
        )}
        <div className="absolute inset-0 bg-on-surface/40" aria-hidden="true"></div>
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
          aria-hidden="true"
        ></div>

        <Link to="/" className="relative text-2xl font-bold tracking-tight">
          FashionStore
        </Link>

        <div className="relative max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">Pruébatelo en la tienda, cómpralo donde quieras.</h2>
          <p className="text-sm text-white/80">
            Reserva prendas para probarlas en la sucursal más cercana, mira el stock real por ciudad y compra en
            línea o en caja.
          </p>
          <p className="text-xs text-white/60">Santa Cruz de la Sierra • La Paz • Cochabamba</p>
        </div>
      </aside>

      <main className="flex w-full flex-1 items-center justify-center overflow-y-auto px-6 py-10 lg:w-1/2">
        <div className={cx('w-full', ancho === 'ancho' ? 'max-w-lg' : 'max-w-md')}>
          <Link to="/" className="mb-8 block text-center text-2xl font-bold tracking-tight text-primary lg:hidden">
            FashionStore
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
