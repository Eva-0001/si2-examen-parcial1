import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { comprobantesService } from '../services/comprobantes.service'
import { numeroVenta } from '../ventas.utils'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import { errorDe, maximo, numeroONulo, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

const patronCantidad = { value: /^[1-9]\d{0,5}$/, message: 'Entero mayor a cero' }
const patronMonto = { value: /^\d{1,8}([.,]\d{1,2})?$/, message: 'Monto válido, hasta dos decimales' }

export default function ModalComprobante({
  ventas = [],
  ventaFija = null,
  existente = null,
  cantidadEmitidos = 0,
  onCerrar,
  onGuardado,
}) {
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)
  const esEdicion = existente !== null
  const ventaBloqueada = existente !== null || ventaFija !== null

  const opcionesVenta = [...ventas].sort((a, b) => b.id - a.id)
  const siguiente = String(cantidadEmitidos + 1).padStart(4, '0')

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: existente?.nombre ?? `Factura 001-${siguiente}`,
      cantidad: existente ? String(existente.cantidad) : '1',
      monto: existente ? Number(existente.monto).toFixed(2) : ventaFija ? Number(ventaFija.total).toFixed(2) : '',
      venta_id: existente?.venta_id ?? ventaFija?.id ?? null,
    },
  })

  const alCambiarVenta = () => {
    const v = ventas.find((x) => x.id === getValues('venta_id'))
    if (v && !getValues('monto').trim()) setValue('monto', Number(v.total).toFixed(2))
  }

  const guardar = (v) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: v.nombre.trim(),
      cantidad: Number(v.cantidad),
      monto: Number(v.monto.replace(',', '.')).toFixed(2),
    }
    const peticion = existente
      ? comprobantesService.actualizar(existente.id, datos)
      : comprobantesService.emitir({ ...datos, venta_id: v.venta_id })

    peticion
      .then((c) => {
        toast.exito(existente ? 'Comprobante actualizado' : 'Comprobante emitido')
        onGuardado(c)
      })
      .catch((err) => {
        setGuardando(false)
        setErrorGeneral(err.message)
      })
  }

  return (
    <Modal
      titulo={esEdicion ? 'Editar comprobante' : 'Emitir comprobante'}
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-comprobante" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Emitir'}
          </button>
        </>
      }
    >
      {errorGeneral && (
        <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          {errorGeneral}
        </div>
      )}

      <form id="form-comprobante" onSubmit={handleSubmit(guardar)} className="space-y-5" noValidate>
        <div>
          <label className="etiqueta" htmlFor="cp-venta">
            Venta
          </label>
          <div className="relative">
            <select
              id="cp-venta"
              disabled={ventaBloqueada}
              className={cx('campo appearance-none pr-9', errors.venta_id && 'campo-invalido')}
              {...register('venta_id', {
                required: ventaBloqueada ? false : requerido,
                setValueAs: numeroONulo,
                onChange: alCambiarVenta,
              })}
            >
              <option value="" disabled>
                Selecciona una venta
              </option>
              {ventaFija && (
                <option value={ventaFija.id}>
                  {numeroVenta(ventaFija.id)} · Bs {ventaFija.total}
                </option>
              )}
              {existente && <option value={existente.venta_id}>{numeroVenta(existente.venta_id)}</option>}
              {opcionesVenta.map((v) => (
                <option key={v.id} value={v.id}>
                  {numeroVenta(v.id)} · {v.tipo_venta} · Bs {v.total}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </div>
          {errors.venta_id && <p className="mensaje-campo">{errorDe(errors.venta_id)}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="cp-nombre">
            Nombre del comprobante
          </label>
          <input
            id="cp-nombre"
            type="text"
            placeholder="Ej. Factura 001-0001"
            className={cx('campo', errors.nombre && 'campo-invalido')}
            {...register('nombre', { required: requerido, maxLength: maximo(150) })}
          />
          {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="etiqueta" htmlFor="cp-cantidad">
              Cantidad
            </label>
            <input
              id="cp-cantidad"
              type="number"
              min="1"
              step="1"
              className={cx('campo tabular-nums', errors.cantidad && 'campo-invalido')}
              {...register('cantidad', { required: requerido, pattern: patronCantidad })}
            />
            {errors.cantidad && <p className="mensaje-campo">{errorDe(errors.cantidad)}</p>}
          </div>
          <div>
            <label className="etiqueta" htmlFor="cp-monto">
              Monto
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant">
                Bs
              </span>
              <input
                id="cp-monto"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={cx('campo pl-10 tabular-nums', errors.monto && 'campo-invalido')}
                {...register('monto', { required: requerido, pattern: patronMonto })}
              />
            </div>
            {errors.monto && <p className="mensaje-campo">{errorDe(errors.monto)}</p>}
          </div>
        </div>
      </form>
    </Modal>
  )
}
