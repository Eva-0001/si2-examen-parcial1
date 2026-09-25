import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { sucursalesService } from '../services/sucursales.service'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import { conQuery } from '@/shared/utils/query'
import { cx } from '@/shared/utils/clases'

export default function SucursalesPublica() {
  const navigate = useNavigate()
  const { sucursales, ciudades: todasCiudades, sucursal, seleccionar } = useSucursalActivaStore()

  const [ciudadFiltro, setCiudadFiltro] = useState(null)

  const cargando = sucursales.length === 0 && todasCiudades.length === 0

  useEffect(() => {
    const { sucursales: s, ciudades: c, cargar: recargar } = useSucursalActivaStore.getState()
    if (s.length === 0 && c.length === 0) recargar()
  }, [])

  const nombreCiudad = new Map(todasCiudades.map((c) => [c.id, c.nombre]))

  const conSucursal = new Set(sucursales.map((s) => s.ciudad_id))
  const ciudades = todasCiudades.filter((c) => conSucursal.has(c.id))

  const filtradas = sucursales.filter((s) => ciudadFiltro === null || s.ciudad_id === ciudadFiltro)

  const ciudadDe = (s) => nombreCiudad.get(s.ciudad_id) ?? ''
  const esActiva = (s) => sucursal?.id === s.id

  const verProductos = (s) => {
    seleccionar(s)
    toast.info(`Mostrando precios y stock de ${s.nombre}`)
    navigate(conQuery('/catalogo', { disponibles: 1 }))
  }

  const clasePestana = (activa) =>
    cx(
      '-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition-colors',
      activa ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface',
    )

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tarjetas" cantidad={6} />
  } else if (sucursales.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        <EstadoVacio
          icono="storefront"
          titulo="Todavía no hay sucursales publicadas"
          descripcion="Pronto vas a poder ver nuestras tiendas aquí."
        />
      </div>
    )
  } else {
    contenido = (
      <>
        <nav className="mb-6 flex gap-6 overflow-x-auto border-b border-outline-variant" role="tablist">
          <button type="button" role="tab" className={clasePestana(ciudadFiltro === null)} onClick={() => setCiudadFiltro(null)}>
            Todas ({sucursales.length})
          </button>
          {ciudades.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              className={clasePestana(ciudadFiltro === c.id)}
              onClick={() => setCiudadFiltro(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </nav>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((s) => {
            const foto = sucursalesService.urlFoto(s)
            return (
              <article
                key={s.id}
                className={cx(
                  'flex flex-col overflow-hidden rounded-xl border bg-surface-container-lowest shadow-card transition-colors',
                  esActiva(s) ? 'border-primary' : 'border-outline-variant',
                )}
              >
                <div className="relative h-44 bg-surface-container">
                  {foto ? (
                    <img src={foto} alt={s.nombre} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary/40">
                      <span className="material-symbols-outlined text-[56px]">storefront</span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-0.5 text-[11px] font-semibold text-on-surface shadow-card backdrop-blur-sm">
                    {ciudadDe(s)}
                  </span>
                  {esActiva(s) && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-on-primary shadow-card">
                      <span className="material-symbols-outlined text-[14px]">check</span> Tu sucursal
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="text-lg font-semibold text-on-surface">{s.nombre}</h2>
                  <p className="flex items-start gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined mt-0.5 text-[16px] text-outline">location_on</span>
                    {s.ubicacion}, {ciudadDe(s)}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-outline">checkroom</span>
                    Vestidores para probar tus reservas
                  </p>
                  <button type="button" className="btn-primario mt-auto w-full" onClick={() => verProductos(s)}>
                    Ver productos de esta sucursal
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-on-surface">Sucursales</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Elige la tienda donde quieres probarte y retirar tus prendas. El catálogo muestra el stock de la sucursal que
          elijas.
        </p>
      </div>

      {contenido}
    </>
  )
}
