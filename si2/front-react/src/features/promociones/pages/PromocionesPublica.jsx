import { useCallback, useEffect, useState } from 'react'
import { promocionesService } from '../services/promociones.service'
import { etiquetaPromo } from '../promociones.utils'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import VigenciaPromocion from '@/shared/components/VigenciaPromocion'
import { vigenciaDe } from '@/shared/utils/fechas'
import { cx } from '@/shared/utils/clases'

const PESO = { vigente: 0, proxima: 1, vencida: 2 }

export default function PromocionesPublica() {
  const sucursales = useSucursalActivaStore((s) => s.sucursales)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [promociones, setPromociones] = useState([])
  const [pestana, setPestana] = useState('vigentes')

  const pedir = useCallback(() => {
    promocionesService
      .listar()
      .then((lista) => {
        setPromociones(lista)
        setCargando(false)
      })
      .catch((e) => {
        setError(e.message)
        setCargando(false)
      })
  }, [])

  useEffect(() => {
    pedir()
  }, [pedir])

  const cargar = () => {
    setCargando(true)
    setError(null)
    pedir()
  }

  const vigentes = promociones.filter((p) => vigenciaDe(p.fecha_inicio, p.fecha_final).estado === 'vigente')

  const visibles = [...(pestana === 'vigentes' ? vigentes : promociones)].sort((a, b) => {
    const va = vigenciaDe(a.fecha_inicio, a.fecha_final)
    const vb = vigenciaDe(b.fecha_inicio, b.fecha_final)
    return PESO[va.estado] - PESO[vb.estado] || va.diasRestantes - vb.diasRestantes
  })

  const sucursalDe = (p) => sucursales.find((s) => s.id === p.sucursal_id)?.nombre ?? 'Sucursal'

  const clasePestana = (activa) =>
    cx(
      '-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors',
      activa ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface',
    )

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tarjetas" cantidad={6} />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar las promociones</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={cargar}>
          <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
        </button>
      </div>
    )
  } else if (visibles.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        <EstadoVacio
          icono="sell"
          titulo={pestana === 'vigentes' ? 'No hay promociones vigentes hoy' : 'Todavía no hay promociones'}
          descripcion={
            pestana === 'vigentes' ? 'Mira la pestaña Todas para ver las próximas.' : 'Vuelve pronto, siempre hay algo nuevo.'
          }
          textoAccion={pestana === 'vigentes' && promociones.length > 0 ? 'Ver todas' : null}
          onAccion={() => setPestana('todas')}
        />
      </div>
    )
  } else {
    contenido = (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibles.map((p) => {
          const estado = vigenciaDe(p.fecha_inicio, p.fecha_final).estado
          const foto = promocionesService.urlFoto(p)
          return (
            <article
              key={p.id}
              className={cx(
                'flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card',
                estado === 'vencida' && 'opacity-60',
              )}
            >
              <div className="relative h-44 bg-surface-container">
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
                {estado !== 'vigente' && (
                  <span className="absolute right-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant shadow-card">
                    {estado === 'proxima' ? 'Próximamente' : 'Finalizada'}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="text-lg font-semibold text-on-surface">{p.nombre}</h2>
                {p.descripcion && <p className="text-sm text-on-surface-variant">{p.descripcion}</p>}
                <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">store</span>
                  {sucursalDe(p)}
                </p>
                <div className="mt-auto pt-3">
                  <VigenciaPromocion fechaInicio={p.fecha_inicio} fechaFinal={p.fecha_final} />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-on-surface">Promociones</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Descuentos y beneficios por sucursal. Fíjate hasta cuándo aplican.
        </p>
      </div>

      <nav className="mb-6 flex gap-6 border-b border-outline-variant" role="tablist">
        <button type="button" role="tab" className={clasePestana(pestana === 'vigentes')} onClick={() => setPestana('vigentes')}>
          Vigentes{' '}
          {!cargando && (
            <span className="ml-1 rounded-full bg-surface-container px-2 py-0.5 text-[11px]">{vigentes.length}</span>
          )}
        </button>
        <button type="button" role="tab" className={clasePestana(pestana === 'todas')} onClick={() => setPestana('todas')}>
          Todas{' '}
          {!cargando && (
            <span className="ml-1 rounded-full bg-surface-container px-2 py-0.5 text-[11px]">{promociones.length}</span>
          )}
        </button>
      </nav>

      {contenido}
    </>
  )
}
