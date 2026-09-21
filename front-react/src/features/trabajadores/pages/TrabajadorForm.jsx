import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { trabajadoresService } from '../services/trabajadores.service'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { rolesService } from '@/features/roles/services/roles.service'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import CampoPassword from '@/shared/components/CampoPassword'
import FuerzaPassword from '@/shared/components/FuerzaPassword'
import {
  correoValido,
  errorDe,
  marcarErrorApi,
  maximo,
  minimo,
  numeroONulo,
  patronUsername,
  requerido,
} from '@/shared/utils/formularios'
import { MIN_PASSWORD } from '@/shared/utils/password'
import { estiloRol } from '@/shared/utils/roles'
import { cx } from '@/shared/utils/clases'

const hoy = () => new Date().toISOString().slice(0, 10)

const patronSueldo = { value: /^\d{1,8}([.,]\d{1,2})?$/, message: 'Ingresa un monto válido, hasta dos decimales' }

function valoresDe(t, roles) {
  const encargado = roles.find((r) => r.nombre === 'encargado')
  return {
    nombre: t?.nombre ?? '',
    apellido: t?.apellido ?? '',
    correo: t?.correo ?? '',
    username: t?.username ?? '',
    genero: t?.genero ?? '',
    rol_id: t?.rol_id ?? encargado?.id ?? null,
    password: '',
    codigo: t?.codigo ?? '',
    fecha_contrato: t?.fecha_contrato ?? hoy(),
    sueldo: t ? Number(t.sueldo).toFixed(2) : '',
    sucursal_id: t?.sucursal_id ?? null,
  }
}

export default function TrabajadorForm() {
  const { id } = useParams()
  return <Formulario key={id ?? 'nuevo'} id={id} />
}

function Formulario({ id }) {
  const navigate = useNavigate()
  const esEdicion = id !== undefined

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const [sucursales, setSucursales] = useState([])
  const [roles, setRoles] = useState([])
  const [trabajador, setTrabajador] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: valoresDe(null, []) })

  const password = useWatch({ control, name: 'password' }) ?? ''

  useEffect(() => {
    Promise.all([
      sucursalesService.listar(),
      rolesService.listar(),
      id === undefined ? Promise.resolve(null) : trabajadoresService.obtener(Number(id)),
    ])
      .then(([listaSucursales, listaRoles, t]) => {
        setSucursales(listaSucursales)
        setRoles(listaRoles.filter((r) => r.nombre !== 'cliente'))
        setTrabajador(t)
        reset(valoresDe(t, listaRoles))
        setCargando(false)
      })
      .catch((e) => {
        setErrorCarga(e.status === 404 ? 'El trabajador no existe o fue eliminado.' : e.message)
        setCargando(false)
      })
  }, [id, reset])

  const mostrarError = (e) => {
    const texto = e.message.toLowerCase()
    if (e.status === 409 && texto.includes('username')) {
      marcarErrorApi(setError, 'username', 'Ese nombre de usuario ya está en uso')
    } else if (e.status === 409 && texto.includes('correo')) {
      marcarErrorApi(setError, 'correo', 'Ese correo ya está registrado')
    } else if (e.status === 409 && texto.includes('codigo')) {
      marcarErrorApi(setError, 'codigo', 'Ya existe un trabajador con ese código')
    } else {
      setErrorGeneral(e.message)
    }
  }

  const guardar = (v) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      correo: v.correo.trim().toLowerCase(),
      username: v.username.trim(),
      genero: v.genero || null,
      rol_id: v.rol_id,
      password: v.password,
      codigo: v.codigo.trim().toUpperCase(),
      fecha_contrato: v.fecha_contrato,
      sueldo: Number(v.sueldo.replace(',', '.')).toFixed(2),
      sucursal_id: v.sucursal_id,
    }

    // eslint-disable-next-line no-unused-vars
    const { password: _sinPassword, ...cambios } = datos
    const peticion = trabajador
      ? trabajadoresService.actualizar(trabajador.id, cambios)
      : trabajadoresService.crear(datos)

    peticion
      .then(() => {
        toast.exito(trabajador ? 'Trabajador actualizado' : 'Trabajador creado')
        navigate('/panel/trabajadores')
      })
      .catch((e) => {
        setGuardando(false)
        mostrarError(e)
      })
  }

  let contenido
  if (cargando) {
    contenido = (
      <div className="space-y-6">
        <Skeleton tipo="bloque" />
        <Skeleton tipo="bloque" />
      </div>
    )
  } else if (errorCarga) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos abrir el formulario</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{errorCarga}</p>
        <Link to="/panel/trabajadores" className="btn-secundario mt-6">
          Volver a la lista
        </Link>
      </div>
    )
  } else {
    contenido = (
      <form onSubmit={handleSubmit(guardar)} className="space-y-6" noValidate>
        {errorGeneral && (
          <div className="rounded-lg border-l-4 border-error bg-error/5 p-4 text-sm text-on-surface" role="alert">
            <span className="font-semibold text-error">No se pudo guardar.</span> {errorGeneral}
          </div>
        )}

        <section className="tarjeta">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">person</span>
            Datos de usuario
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="etiqueta" htmlFor="tr-nombre">
                Nombre
              </label>
              <input
                id="tr-nombre"
                type="text"
                className={cx('campo', errors.nombre && 'campo-invalido')}
                {...register('nombre', { required: requerido, maxLength: maximo(100) })}
              />
              {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-apellido">
                Apellido
              </label>
              <input
                id="tr-apellido"
                type="text"
                className={cx('campo', errors.apellido && 'campo-invalido')}
                {...register('apellido', { required: requerido, maxLength: maximo(100) })}
              />
              {errors.apellido && <p className="mensaje-campo">{errorDe(errors.apellido)}</p>}
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-correo">
                Correo
              </label>
              <input
                id="tr-correo"
                type="email"
                placeholder="nombre@tienda.com"
                className={cx('campo', errors.correo && 'campo-invalido')}
                {...register('correo', { required: requerido, validate: correoValido, maxLength: maximo(150) })}
              />
              {errors.correo && <p className="mensaje-campo">{errorDe(errors.correo)}</p>}
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-username">
                Usuario
              </label>
              <input
                id="tr-username"
                type="text"
                autoComplete="off"
                className={cx('campo', errors.username && 'campo-invalido')}
                {...register('username', {
                  required: requerido,
                  minLength: minimo(3),
                  maxLength: maximo(50),
                  pattern: patronUsername,
                })}
              />
              {errors.username && <p className="mensaje-campo">{errorDe(errors.username)}</p>}
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-genero">
                Género
              </label>
              <div className="relative">
                <select id="tr-genero" className="campo appearance-none pr-10" {...register('genero')}>
                  <option value="">Prefiero no decirlo</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-rol">
                Rol
              </label>
              <div className="relative">
                <select
                  id="tr-rol"
                  className={cx('campo appearance-none pr-10', errors.rol_id && 'campo-invalido')}
                  {...register('rol_id', { required: requerido, setValueAs: numeroONulo })}
                >
                  <option value="" disabled>
                    Selecciona un rol
                  </option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {estiloRol(rol.nombre).etiqueta}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  expand_more
                </span>
              </div>
              {errors.rol_id && <p className="mensaje-campo">{errorDe(errors.rol_id)}</p>}
            </div>

            {!esEdicion ? (
              <div className="md:col-span-2">
                <label className="etiqueta" htmlFor="tr-password">
                  Contraseña inicial
                </label>
                <CampoPassword
                  id="tr-password"
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  invalido={!!errors.password}
                  {...register('password', { required: requerido, minLength: minimo(MIN_PASSWORD) })}
                />
                {errors.password && <p className="mensaje-campo">{errorDe(errors.password)}</p>}
                <FuerzaPassword password={password} />
              </div>
            ) : (
              <p className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant md:col-span-2">
                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                La contraseña la cambia el propio trabajador desde "Mi perfil".
              </p>
            )}
          </div>
        </section>

        <section className="tarjeta">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">badge</span>
            Datos laborales
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="etiqueta" htmlFor="tr-codigo">
                Código
              </label>
              <input
                id="tr-codigo"
                type="text"
                placeholder="Ej. T-001"
                className={cx('campo uppercase', errors.codigo && 'campo-invalido')}
                {...register('codigo', { required: requerido, maxLength: maximo(50) })}
              />
              {errors.codigo && <p className="mensaje-campo">{errorDe(errors.codigo)}</p>}
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-fecha">
                Fecha de contrato
              </label>
              <input
                id="tr-fecha"
                type="date"
                className={cx('campo', errors.fecha_contrato && 'campo-invalido')}
                {...register('fecha_contrato', { required: requerido })}
              />
              {errors.fecha_contrato && <p className="mensaje-campo">{errorDe(errors.fecha_contrato)}</p>}
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-sueldo">
                Sueldo mensual (Bs)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant">
                  Bs
                </span>
                <input
                  id="tr-sueldo"
                  type="text"
                  inputMode="decimal"
                  placeholder="3500.00"
                  className={cx('campo pl-10 tabular-nums', errors.sueldo && 'campo-invalido')}
                  {...register('sueldo', { required: requerido, pattern: patronSueldo })}
                />
              </div>
              {errors.sueldo && <p className="mensaje-campo">{errorDe(errors.sueldo)}</p>}
            </div>
            <div>
              <label className="etiqueta" htmlFor="tr-sucursal">
                Sucursal
              </label>
              <div className="relative">
                <select
                  id="tr-sucursal"
                  className="campo appearance-none pr-10"
                  {...register('sucursal_id', { setValueAs: numeroONulo })}
                >
                  <option value="">Sin sucursal asignada</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  expand_more
                </span>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">
                Encargados y cajeros trabajan sobre el stock y las ventas de su sucursal.
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-5">
          <Link to="/panel/trabajadores" className="btn-secundario">
            Cancelar
          </Link>
          <button type="submit" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear trabajador'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6">
        <Link
          to="/panel/trabajadores"
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a trabajadores
        </Link>
        <h1 className="text-2xl font-semibold text-on-surface">{esEdicion ? 'Editar trabajador' : 'Nuevo trabajador'}</h1>
      </div>

      {contenido}
    </div>
  )
}
