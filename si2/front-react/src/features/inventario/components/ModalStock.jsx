import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { stockService } from '../services/stock.service'
import { useReferencias } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import { errorDe, numeroONulo, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

const patronCantidad = { value: /^\d{1,7}$/, message: 'Entero, cero o más' }
const patronPrecio = { value: /^\d{1,8}([.,]\d{1,2})?$/, message: 'Monto válido, hasta dos decimales' }

export default function ModalStock({
  productos = [],
  sucursales = [],
  existente = null,
  productoInicial = null,
  sucursalInicial = null,
  sucursalFija = false,
  onCerrar,
  onGuardado,
}) {
  const referencias = useReferencias()
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)
  const esEdicion = existente !== null

  const productoBloqueado = esEdicion
  const sucursalBloqueada = esEdicion || sucursalFija

  const precioSugerido = (productoId) => {
    const p = productos.find((x) => x.id === productoId)
    return p ? Number(p.precio).toFixed(2) : ''
  }

  const rotulo = (p) =>
    [p.nombre, referencias.nombre('tallas', p.talla_id), referencias.nombre('colores', p.color_id)]
      .filter(Boolean)
      .join(' · ')

  const opcionesProducto = productos
    .map((p) => ({ id: p.id, rotulo: rotulo(p) }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'es'))

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      producto_id: existente?.producto_id ?? productoInicial,
      sucursal_id: existente?.sucursal_id ?? sucursalInicial,
      cantidad: existente ? String(existente.cantidad) : '',
      precio: existente ? Number(existente.precio).toFixed(2) : precioSugerido(productoInicial),
    },
  })

  const alCambiarProducto = () => {
    if (esEdicion || getValues('precio').trim()) return
    setValue('precio', precioSugerido(getValues('producto_id')))
  }

  const guardar = (v) => {
    setGuardando(true)
    setErrorGeneral(null)

    const cantidad = Number(v.cantidad)
    const precio = Number(v.precio.replace(',', '.')).toFixed(2)

    const peticion = existente
      ? stockService.actualizar(existente.id, { cantidad, precio })
      : stockService.crear({ producto_id: v.producto_id, sucursal_id: v.sucursal_id, cantidad, precio })

    peticion
      .then((stock) => {
        toast.exito(existente ? 'Stock actualizado' : 'Stock cargado')
        onGuardado(stock)
      })
      .catch((err) => {
        setGuardando(false)
        setErrorGeneral(
          err.status === 409
            ? 'Ese producto ya tiene stock en esa sucursal. Edita la cantidad desde su celda.'
            : err.message,
        )
      })
  }

  return (
    <Modal
      titulo={esEdicion ? 'Editar stock' : 'Cargar stock'}
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-stock" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Cargar stock'}
          </button>
        </>
      }
    >
      {errorGeneral && (
        <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          {errorGeneral}
        </div>
      )}

      <form id="form-stock" onSubmit={handleSubmit(guardar)} className="space-y-5" noValidate>
        <div>
          <label className="etiqueta" htmlFor="st-producto">
            Producto
          </label>
          <div className="relative">
            <select
              id="st-producto"
              disabled={productoBloqueado}
              className={cx('campo appearance-none pr-9', errors.producto_id && 'campo-invalido')}
              {...register('producto_id', {
                required: productoBloqueado ? false : requerido,
                setValueAs: numeroONulo,
                onChange: alCambiarProducto,
              })}
            >
              <option value="" disabled>
                Selecciona un producto
              </option>
              {opcionesProducto.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.rotulo}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </div>
          {errors.producto_id && <p className="mensaje-campo">{errorDe(errors.producto_id)}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="st-sucursal">
            Sucursal
          </label>
          <div className="relative">
            <select
              id="st-sucursal"
              disabled={sucursalBloqueada}
              className={cx('campo appearance-none pr-9', errors.sucursal_id && 'campo-invalido')}
              {...register('sucursal_id', {
                required: sucursalBloqueada ? false : requerido,
                setValueAs: numeroONulo,
              })}
            >
              <option value="" disabled>
                Selecciona una sucursal
              </option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </div>
          {errors.sucursal_id && <p className="mensaje-campo">{errorDe(errors.sucursal_id)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="etiqueta" htmlFor="st-cantidad">
              Cantidad
            </label>
            <input
              id="st-cantidad"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="0"
              className={cx('campo tabular-nums', errors.cantidad && 'campo-invalido')}
              {...register('cantidad', { required: requerido, pattern: patronCantidad })}
            />
            {errors.cantidad && <p className="mensaje-campo">{errorDe(errors.cantidad)}</p>}
          </div>
          <div>
            <label className="etiqueta" htmlFor="st-precio">
              Precio de venta
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant">
                Bs
              </span>
              <input
                id="st-precio"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={cx('campo pl-10 tabular-nums', errors.precio && 'campo-invalido')}
                {...register('precio', { required: requerido, pattern: patronPrecio })}
              />
            </div>
            {errors.precio && <p className="mensaje-campo">{errorDe(errors.precio)}</p>}
          </div>
        </div>

        <p className="text-xs text-on-surface-variant">
          Este es el precio que ve el cliente en esa sucursal. Puede diferir del precio referencial del producto.
        </p>
      </form>
    </Modal>
  )
}
