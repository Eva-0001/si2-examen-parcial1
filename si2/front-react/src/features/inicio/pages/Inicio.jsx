import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { catalogoService, useCatalogo } from '@/features/catalogo/services/catalogo.service'
import { promocionesService } from '@/features/promociones/services/promociones.service'
import { etiquetaPromo } from '@/features/promociones/promociones.utils'
import { useReferencias } from '@/core/stores/referencias.store'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import Skeleton from '@/shared/components/Skeleton'
import TarjetaProducto from '@/shared/components/TarjetaProducto'
import VigenciaPromocion from '@/shared/components/VigenciaPromocion'
import { conQuery } from '@/shared/utils/query'

const ICONO_CATEGORIA = {
  poleras: 'apparel',
  camisas: 'dry_cleaning',
  pantalones: 'styler',
  jeans: 'styler',
  vestidos: 'girl',
  abrigos: 'ac_unit',
  chaquetas: 'ac_unit',
  faldas: 'woman',
  buzos: 'checkroom',
  calzado: 'steps',
}

const FOTO_HERO = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80'

export default function Inicio() {
  const catalogo = useCatalogo()
  const referencias = useReferencias()
  const sucursalActiva = useSucursalActivaStore()

  const [heroFallo, setHeroFallo] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [promociones, setPromociones] = useState([])

  useEffect(() => {
    let vigente = true
    Promise.all([catalogoService.cargar(), promocionesService.listar({ solo_vigentes: true })])
      .then(([, lista]) => {
        if (!vigente) return
        setPromociones(lista.slice(0, 3))
        setCargando(false)
      })
      .catch((e) => {
        if (!vigente) return
        setError(e.message)
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  const categorias = referencias
    .lista('categorias')
    .slice(0, 6)
    .map((c) => ({ ...c, icono: ICONO_CATEGORIA[c.nombre.toLowerCase()] ?? 'checkroom' }))

  const nuevos = [...catalogo.grupos].sort((a, b) => b.maxId - a.maxId).slice(0, 8)
  const sucursales = sucursalActiva.sucursales.slice(0, 3)
  const ciudades = new Map(sucursalActiva.ciudades.map((c) => [c.id, c.nombre]))

  const ciudadDe = (ciudadId) => ciudades.get(ciudadId) ?? ''
  const sucursalDe = (promo) =>
    sucursalActiva.sucursales.find((s) => s.id === promo.sucursal_id)?.nombre ?? 'Todas las sucursales'

  let contenido
  if (cargando) {
    contenido = (
      <div className="mt-12 space-y-10">
        <Skeleton tipo="tarjetas" cantidad={4} />
        <Skeleton tipo="tarjetas" cantidad={8} />
      </div>
    )
  } else if (error) {
    contenido = (
      <div className="tarjeta mt-12 flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos conectarnos con la tienda</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
      </div>
    )
  } else {
    contenido = (
      <>
        {categorias.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {categorias.map((c) => (
                <Link
                  key={c.id}
                  to={conQuery('/catalogo', { categoria: c.id })}
                  className="group flex w-24 flex-col items-center gap-2 text-center"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-primary transition-all group-hover:scale-105 group-hover:bg-primary group-hover:text-on-primary">
                    <span className="material-symbols-outlined text-[34px]">{c.icono}</span>
                  </span>
                  <span className="text-sm font-semibold text-on-surface group-hover:text-primary">{c.nombre}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {promociones.length > 0 && (
          <section className="mt-14">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-on-surface">Promociones vigentes</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Aprovéchalas antes de que terminen.</p>
              </div>
              <Link to="/promociones" className="text-sm font-semibold text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {promociones.map((p) => {
                const foto = promocionesService.urlFoto(p)
                return (
                  <article
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card"
                  >
                    <div className="relative h-40 bg-surface-container">
                      {foto ? (
                        <img src={foto} alt={p.nombre} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-promo-accent/40">
                          <span className="material-symbols-outlined text-[56px]">sell</span>
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-promo-accent px-2.5 py-0.5 text-xs font-bold text-white shadow-card">
                        {etiquetaPromo(p.nombre, p.descripcion)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="text-base font-semibold text-on-surface">{p.nombre}</h3>
                      {p.descripcion && <p className="line-clamp-2 text-sm text-on-surface-variant">{p.descripcion}</p>}
                      <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">store</span>
                        {sucursalDe(p)}
                      </p>
                      <div className="mt-auto pt-2">
                        <VigenciaPromocion fechaInicio={p.fecha_inicio} fechaFinal={p.fecha_final} />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-on-surface">Nuevos ingresos</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Lo último que llegó, con precios de {sucursalActiva.sucursal?.nombre ?? 'tu sucursal'}.
              </p>
            </div>
            <Link to={conQuery('/catalogo', { orden: 'nuevos' })} className="text-sm font-semibold text-primary hover:underline">
              Ver catálogo
            </Link>
          </div>
          {nuevos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {nuevos.map((g) => (
                <TarjetaProducto key={g.clave} grupo={g} />
              ))}
            </div>
          ) : (
            <div className="tarjeta py-12 text-center text-sm text-on-surface-variant">
              Todavía no hay prendas cargadas. Vuelve pronto.
            </div>
          )}
        </section>

        {sucursales.length > 0 && (
          <section className="mt-14 rounded-2xl bg-surface-container p-6 md:p-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Visítanos</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Reserva en línea y pruébate las prendas en el vestidor.</p>
              </div>
              <Link to="/sucursales" className="text-sm font-semibold text-primary hover:underline">
                Todas las sucursales
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {sucursales.map((s) => (
                <div key={s.id} className="flex items-start gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-card">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                    <span className="material-symbols-outlined">storefront</span>
                  </span>
                  <div>
                    <p className="font-semibold text-on-surface">{s.nombre}</p>
                    <p className="text-sm text-on-surface-variant">{s.ubicacion}</p>
                    <p className="text-xs text-on-surface-variant">{ciudadDe(s.ciudad_id)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </>
    )
  }

  return (
    <>
      <section className="relative -mt-2 overflow-hidden rounded-2xl bg-on-surface text-white">
        {!heroFallo && (
          <img
            src={FOTO_HERO}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            onError={() => setHeroFallo(true)}
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-r from-on-surface/90 via-on-surface/50 to-transparent"
          aria-hidden="true"
        ></div>
        <div className="relative flex min-h-[420px] flex-col justify-center gap-5 p-8 md:p-14">
          <span className="w-fit rounded-full bg-promo-accent px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Nueva colección 2026
          </span>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
            Pruébatelo en la tienda, cómpralo donde quieras.
          </h1>
          <p className="max-w-lg text-sm text-white/80 md:text-base">
            Reserva prendas para probarlas en tu sucursal más cercana, mira el stock real por ciudad y paga en línea o en
            caja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn-primario px-6 py-3">
              Ver catálogo
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <Link
              to="/sucursales"
              className="btn-secundario border-white/30 bg-white/10 px-6 py-3 text-white hover:bg-white/20"
            >
              Nuestras sucursales
            </Link>
          </div>
        </div>
      </section>

      {contenido}
    </>
  )
}
