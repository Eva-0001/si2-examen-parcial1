import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { proveedoresService } from '../services/proveedores.service'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import { errorDe, maximo, nombreUnico, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

const patronTelefono = { value: /^\d{6,15}$/, message: 'Solo números, sin espacios ni guiones' }

export default function ModalProveedor({ proveedor = null, nombresOcupados = [], onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: proveedor?.nombre ?? '',
      descripcion: proveedor?.descripcion ?? '',
      encargado: proveedor?.encargado ?? '',
      telefono: proveedor?.telefono != null ? String(proveedor.telefono) : '',
    },
  })

  const guardar = (v) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      encargado: v.encargado.trim() || null,
      telefono: v.telefono.trim() ? Number(v.telefono.trim()) : null,
    }

    const peticion = proveedor
      ? proveedoresService.actualizar(proveedor.id, datos)
      : proveedoresService.crear(datos)

    peticion
      .then((guardado) => {
        toast.exito(proveedor ? 'Proveedor actualizado' : 'Proveedor creado')
        onGuardado(guardado)
      })
      .catch((e) => {
        setGuardando(false)
        setErrorGeneral(e.message)
      })
  }

  return (
    <Modal
      titulo={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-proveedor" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      {errorGeneral && (
        <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          {errorGeneral}
        </div>
      )}

      <form id="form-proveedor" onSubmit={handleSubmit(guardar)} className="space-y-5" noValidate>
        <div>
          <label className="etiqueta" htmlFor="prov-nombre">
            Nombre o razón social
          </label>
          <input
            id="prov-nombre"
            type="text"
            placeholder="Ej. Textiles del Sur"
            className={cx('campo', errors.nombre && 'campo-invalido')}
            autoFocus
            {...register('nombre', {
              required: requerido,
              maxLength: maximo(150),
              validate: nombreUnico(
                () => nombresOcupados,
                () => proveedor?.nombre ?? null,
              ),
            })}
          />
          {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="prov-descripcion">
            Descripción <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            id="prov-descripcion"
            rows={2}
            placeholder="Qué provee: algodón, denim, calzado..."
            className={cx('campo resize-none', errors.descripcion && 'campo-invalido')}
            {...register('descripcion', { maxLength: maximo(300) })}
          ></textarea>
          {errors.descripcion && <p className="mensaje-campo">{errorDe(errors.descripcion)}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="prov-encargado">
              Encargado
            </label>
            <input
              id="prov-encargado"
              type="text"
              placeholder="Ej. María Vargas"
              className={cx('campo', errors.encargado && 'campo-invalido')}
              {...register('encargado', { maxLength: maximo(150) })}
            />
            {errors.encargado && <p className="mensaje-campo">{errorDe(errors.encargado)}</p>}
          </div>
          <div>
            <label className="etiqueta" htmlFor="prov-telefono">
              Teléfono
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                call
              </span>
              <input
                id="prov-telefono"
                type="tel"
                inputMode="numeric"
                placeholder="77712345"
                className={cx('campo pl-10', errors.telefono && 'campo-invalido')}
                {...register('telefono', { pattern: patronTelefono })}
              />
            </div>
            {errors.telefono && <p className="mensaje-campo">{errorDe(errors.telefono)}</p>}
          </div>
        </div>
      </form>
    </Modal>
  )
}
