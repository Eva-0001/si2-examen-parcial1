import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { promocionesService } from '../services/promociones.service'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import VigenciaPromocion from '@/shared/components/VigenciaPromocion'
import { vigenciaDe } from '@/shared/utils/fechas'
import { cx } from '@/shared/utils/clases'

const OPCIONES_FILTRO = [
  ['todas', 'Todas'],
  ['vigente', 'Vigentes'],
  ['proxima', 'Próximas'],
  ['vencida', 'Finalizadas'],
]

const CLASE_ESTADO = {
  vigente: 'bg-success text-white',
  proxima: 'bg-surface-container-lowest text-on-surface',
  vencida: 'bg-on-surface/70 text-white',
}

const ETIQUETA_ESTADO = { vigente: 'Vigente', proxima: 'Próxima', vencida: 'Finalizada' }

const estadoDe = (p) => vigenciaDe(p.fecha_inicio, p.fecha_final).estado

export default function PromocionesAdmin() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [promociones, setPromociones] = useState([])
  const [sucursales, setSucursales] = useState([])

  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  const nombreSucursal = new Map(sucursales.map((s) => [s.id, s.nombre]))

  const conteo = { todas: 0, vigente: 0, proxima: 0, vencida: 0 }
  for (const p of promociones) {
    conteo.todas++
    conteo[estadoDe(p)]++
  }

  const texto = busqueda.trim().toLowerCase()
  const filtradas = promociones
    .filter(
      (p) =>
        (filtro === 'todas' || estadoDe(p) === filtro) &&
        (!texto || p.nombre.toLowerCase().includes(texto) || (p.descripcion ?? '').toLowerCase().includes(texto)),
    )
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([promocionesService.listar(), sucursalesService.listar()])
      .then(([listaPromociones, listaSucursales]) => {
        setPromociones(listaPromociones)
        setSucursales(listaSucursales)
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

  const sucursalDe = (p) => nombreSucursal.get(p.sucursal_id) ?? 'Sucursal'

  const verTodas = () => {
    setFiltro('todas')
    setBusqueda('')
  }

  const pedirEliminar = (p) => {
    setErrorEliminar(null)
    setAEliminar(p)
  }

  const eliminar = () => {
    const p = aEliminar
    if (!p) return
    setEliminando(true)
    promocionesService
      .eliminar(p.id)
      .then(() => {
        setPromociones((lista) => lista.filter((x) => x.id !== p.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Promoción eliminada')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

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
  } else if (filtradas.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        {promociones.length === 0 ? (
          <>
            <EstadoVacio
              icono="sell"
              titulo="No hay promociones todavía"
              descripcion="Crea la primera con su sucursal, fechas y una imagen llamativa."
            />
            <div className="pb-10 text-center">
              <Link to="/panel/promociones/nueva" className="btn-primario">
                Nueva promoción
              </Link>
            </div>
          </>
        ) : (
          <EstadoVacio
            icono="search_off"
            titulo="Sin resultados"
            descripcion="Ninguna promoción coincide con el filtro."
            textoAccion="Ver todas"
            onAccion={verTodas}
          />
        )}
      </div>
    )
  } else {
    contenido = (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtradas.map((p) => {
          const estado = estadoDe(p)
          const foto = promocionesService.urlFoto(p)
          const rutaEditar = `/panel/promociones/${p.id}/editar`
          return (
            <article
              key={p.id}
              className={cx(
                'group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card transition-colors hover:border-primary',
                estado === 'vencida' && 'opacity-70',
              )}
            >
              <Link to={rutaEditar} className="relative block h-36 bg-surface-container">
                {foto ? (
                  <img src={foto} alt={p.nombre} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-promo-accent/40">
                    <span className="material-symbols-outlined text-[48px]">sell</span>
                  </div>
                )}
                <span
                  className={cx(
                    'absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-card',
                    CLASE_ESTADO[estado],
                  )}
                >
                  {ETIQUETA_ESTADO[estado]}
                </span>
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="text-base font-semibold text-on-surface group-hover:text-primary">{p.nombre}</h3>
                <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">store</span>
                  {sucursalDe(p)}
                </p>
                <VigenciaPromocion fechaInicio={p.fecha_inicio} fechaFinal={p.fecha_final} />
                <div className="mt-auto flex items-center justify-between border-t border-outline-variant pt-3">
                  <Link
                    to={rutaEditar}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span> Editar
                  </Link>
                  <button type="button" className="btn-icono-peligro" title="Eliminar" onClick={() => pedirEliminar(p)}>
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
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
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Promociones</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Buscar promoción..."
                className="campo w-56 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Link to="/panel/promociones/nueva" className="btn-primario">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva promoción
            </Link>
          </div>
        </div>

        {!cargando && !error && (
          <div className="mb-6 flex flex-wrap gap-2">
            {OPCIONES_FILTRO.map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                className={cx(
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  filtro === valor
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low',
                )}
                onClick={() => setFiltro(valor)}
              >
                {`${etiqueta} (${conteo[valor]})`}
              </button>
            ))}
          </div>
        )}

        {contenido}
      </div>

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + aEliminar.nombre + '?'}
          mensaje="La promoción dejará de mostrarse en la tienda. Esta acción no se puede deshacer."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
