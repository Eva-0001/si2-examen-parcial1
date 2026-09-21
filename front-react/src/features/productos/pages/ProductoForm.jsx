import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { productosService } from '../services/productos.service'
import { proveedoresService } from '@/features/proveedores/services/proveedores.service'
import { compararTallas } from '@/features/catalogos/catalogos.config'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import { authActual, useAuth } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import CampoImagen from '@/shared/components/CampoImagen'
import { errorDe, maximo, numeroONulo, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

const DESPLEGABLES = [
  { campo: 'categoria_id', recurso: 'categorias', etiqueta: 'Categoría', obligatorio: true },
  { campo: 'color_id', recurso: 'colores', etiqueta: 'Color', obligatorio: true },
  { campo: 'talla_id', recurso: 'tallas', etiqueta: 'Talla', obligatorio: true },
  { campo: 'coleccion_id', recurso: 'colecciones', etiqueta: 'Colección', obligatorio: false },
  { campo: 'temporada_id', recurso: 'temporadas', etiqueta: 'Temporada', obligatorio: false },
]

const patronPrecio = { value: /^\d{1,8}([.,]\d{1,2})?$/, message: 'Monto válido, hasta dos decimales' }

const valoresDe = (p) => ({
  nombre: p?.nombre ?? '',
  precio: p ? Number(p.precio).toFixed(2) : '',
  categoria_id: p?.categoria_id ?? null,
  color_id: p?.color_id ?? null,
  talla_id: p?.talla_id ?? null,
  coleccion_id: p?.coleccion_id ?? null,
  temporada_id: p?.temporada_id ?? null,
  proveedor_id: p?.proveedor_id ?? null,
})

export default function ProductoForm() {
  const { id } = useParams()
  return <Formulario key={id ?? 'nuevo'} id={id} />
}

function Formulario({ id }) {
  const navigate = useNavigate()
  const auth = useAuth()
  const referencias = useReferencias()
  const esEdicion = id !== undefined
  const rutaLista = auth.esProveedor ? '/panel/mis-productos' : '/panel/productos'

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const [proveedores, setProveedores] = useState([])
  const [producto, setProducto] = useState(null)

  const [archivoNuevo, setArchivoNuevo] = useState(null)
  const [quitarFoto, setQuitarFoto] = useState(false)
  const fotoActual = producto ? productosService.urlFoto(producto) : null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: valoresDe(null) })

  useEffect(() => {
    Promise.all([
      cargarReferencias(),
      authActual().esAdmin ? proveedoresService.listar() : Promise.resolve([]),
      id === undefined ? Promise.resolve(null) : productosService.obtener(Number(id)),
    ])
      .then(([, listaProveedores, p]) => {
        setProveedores(listaProveedores)
        setProducto(p)
        reset(valoresDe(p))
        setCargando(false)
      })
      .catch((e) => {
        setErrorCarga(e.status === 404 ? 'El producto no existe o fue eliminado.' : e.message)
        setCargando(false)
      })
  }, [id, reset])

  const opciones = (recurso) => {
    const lista = referencias.lista(recurso)
    return recurso === 'tallas' ? [...lista].sort((a, b) => compararTallas(a.nombre, b.nombre)) : lista
  }

  const alElegirArchivo = (archivo) => {
    setArchivoNuevo(archivo)
    if (archivo) setQuitarFoto(false)
  }

  const alQuitarFotoActual = () => {
    setArchivoNuevo(null)
    setQuitarFoto(true)
  }

  const sincronizarFoto = (guardado) => {
    let cambio = null
    if (archivoNuevo) {
      cambio = productosService.subirFoto(guardado.id, archivoNuevo)
    } else if (quitarFoto && guardado.foto) {
      cambio = productosService.quitarFoto(guardado.id)
    }
    if (!cambio) return Promise.resolve(guardado)

    return cambio.catch((e) => {
      const motivo = e.status === 413 ? 'supera los 5 MB' : e.message
      toast.advertencia(`Los datos se guardaron, pero la foto no: ${motivo}`)
      return guardado
    })
  }

  const guardar = (v) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: v.nombre.trim(),
      precio: Number(v.precio.replace(',', '.')).toFixed(2),
      categoria_id: v.categoria_id,
      color_id: v.color_id,
      talla_id: v.talla_id,
      coleccion_id: v.coleccion_id,
      temporada_id: v.temporada_id,
      proveedor_id: v.proveedor_id,
    }

    const peticion = producto ? productosService.actualizar(producto.id, datos) : productosService.crear(datos)

    peticion
      .then(sincronizarFoto)
      .then(() => {
        toast.exito(producto ? 'Producto actualizado' : 'Producto creado')
        navigate(rutaLista)
      })
      .catch((e) => {
        setGuardando(false)
        setErrorGeneral(e.message)
      })
  }

  const faltanCatalogos =
    referencias.lista('categorias').length === 0 ||
    referencias.lista('colores').length === 0 ||
    referencias.lista('tallas').length === 0

  let contenido
  if (cargando) {
    contenido = (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton tipo="bloque" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton tipo="bloque" />
        </div>
      </div>
    )
  } else if (errorCarga) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos abrir el producto</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{errorCarga}</p>
        <Link to={rutaLista} className="btn-secundario mt-6">
          Volver a la lista
        </Link>
      </div>
    )
  } else {
    contenido = (
      <form onSubmit={handleSubmit(guardar)} noValidate>
        {errorGeneral && (
          <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-4 text-sm text-on-surface" role="alert">
            <span className="font-semibold text-error">No se pudo guardar.</span> {errorGeneral}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="tarjeta space-y-5 lg:col-span-7">
            <h2 className="flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary">checkroom</span>
              Datos del producto
            </h2>

            <div className="flex items-start gap-2 rounded-lg bg-surface-container p-3 text-xs text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              <span>
                <strong>Cada combinación de talla y color es un producto distinto.</strong> Para vender la misma prenda en
                tres tallas, crea tres productos con el mismo nombre; el catálogo los agrupa.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="etiqueta" htmlFor="pr-nombre">
                  Nombre
                </label>
                <input
                  id="pr-nombre"
                  type="text"
                  placeholder="Ej. Polera básica algodón"
                  className={cx('campo', errors.nombre && 'campo-invalido')}
                  {...register('nombre', { required: requerido, maxLength: maximo(150) })}
                />
                {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
              </div>
              <div>
                <label className="etiqueta" htmlFor="pr-precio">
                  Precio referencial
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant">
                    Bs
                  </span>
                  <input
                    id="pr-precio"
                    type="text"
                    inputMode="decimal"
                    placeholder="120.50"
                    className={cx('campo pl-10 tabular-nums', errors.precio && 'campo-invalido')}
                    {...register('precio', { required: requerido, pattern: patronPrecio })}
                  />
                </div>
                {errors.precio && <p className="mensaje-campo">{errorDe(errors.precio)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {DESPLEGABLES.map((d) => (
                <div key={d.campo}>
                  <label className="etiqueta" htmlFor={'pr-' + d.campo}>
                    {d.etiqueta}
                    {!d.obligatorio && (
                      <>
                        {' '}
                        <span className="font-normal normal-case">(opcional)</span>
                      </>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      id={'pr-' + d.campo}
                      className={cx('campo appearance-none pr-9', errors[d.campo] && 'campo-invalido')}
                      {...register(d.campo, {
                        required: d.obligatorio ? requerido : false,
                        setValueAs: numeroONulo,
                      })}
                    >
                      <option value="" disabled={d.obligatorio}>
                        {d.obligatorio ? 'Selecciona' : 'Ninguna'}
                      </option>
                      {opciones(d.recurso).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                      expand_more
                    </span>
                  </div>
                  {errors[d.campo] && <p className="mensaje-campo">{errorDe(errors[d.campo])}</p>}
                </div>
              ))}

              {auth.esAdmin && (
                <div>
                  <label className="etiqueta" htmlFor="pr-proveedor">
                    Proveedor <span className="font-normal normal-case">(opcional)</span>
                  </label>
                  <div className="relative">
                    <select
                      id="pr-proveedor"
                      className="campo appearance-none pr-9"
                      {...register('proveedor_id', { setValueAs: numeroONulo })}
                    >
                      <option value="">Ninguno</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                      expand_more
                    </span>
                  </div>
                </div>
              )}
            </div>

            {faltanCatalogos && (
              <p className="text-xs text-warning">
                Faltan catálogos maestros (categorías, colores o tallas).{' '}
                {auth.esAdmin ? (
                  <>
                    <Link to="/panel/catalogos" className="font-semibold underline">
                      Cárgalos primero
                    </Link>
                    .
                  </>
                ) : (
                  'Pídele al administrador que los cargue.'
                )}
              </p>
            )}
          </section>

          <section className="tarjeta lg:col-span-5">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary">photo_camera</span>
              Foto del producto
            </h2>
            <CampoImagen
              urlActual={fotoActual}
              deshabilitado={guardando}
              onArchivo={alElegirArchivo}
              onQuitarActual={alQuitarFotoActual}
            />
            <p className="mt-3 text-xs text-on-surface-variant">
              Es la imagen del catálogo y de la ficha. Idealmente cuadrada, fondo claro.
            </p>
            {auth.esProveedor && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                Como proveedor puedes crear y editar productos, pero no eliminarlos.
              </p>
            )}
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-outline-variant pt-5">
          <Link to={rutaLista} className="btn-secundario">
            Cancelar
          </Link>
          <button type="submit" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <Link
          to={rutaLista}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a {auth.esProveedor ? 'mis productos' : 'productos'}
        </Link>
        <h1 className="text-2xl font-semibold text-on-surface">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h1>
      </div>

      {contenido}
    </div>
  )
}
