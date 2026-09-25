import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { trabajadoresService } from '../services/trabajadores.service'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { rolesService } from '@/features/roles/services/roles.service'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { formatoFecha } from '@/shared/utils/formato'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { estiloRol } from '@/shared/utils/roles'
import { cx } from '@/shared/utils/clases'

const iniciales = (t) => `${t.nombre.charAt(0)}${t.apellido.charAt(0)}`.toUpperCase()

export default function Trabajadores() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [trabajadores, setTrabajadores] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [roles, setRoles] = useState([])

  const nombreSucursal = new Map(sucursales.map((s) => [s.id, s.nombre]))
  const nombreRol = new Map(roles.map((r) => [r.id, r.nombre]))

  const [busqueda, setBusqueda] = useState('')
  const [sucursalFiltro, setSucursalFiltro] = useState(null)

  const texto = busqueda.trim().toLowerCase()
  const filtrados = trabajadores.filter(
    (t) =>
      (sucursalFiltro === null ||
        (sucursalFiltro === -1 ? t.sucursal_id === null : t.sucursal_id === sucursalFiltro)) &&
      (!texto ||
        `${t.nombre} ${t.apellido}`.toLowerCase().includes(texto) ||
        t.codigo.toLowerCase().includes(texto) ||
        t.username.toLowerCase().includes(texto)),
  )

  const hayFiltros = busqueda.trim() !== '' || sucursalFiltro !== null

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([trabajadoresService.listar(), sucursalesService.listar(), rolesService.listar()])
      .then(([listaTrabajadores, listaSucursales, listaRoles]) => {
        setTrabajadores(
          [...listaTrabajadores].sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true })),
        )
        setSucursales(listaSucursales)
        setRoles(listaRoles)
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

  const sucursalDe = (t) => (t.sucursal_id === null ? null : (nombreSucursal.get(t.sucursal_id) ?? null))
  const rolDe = (t) => nombreRol.get(t.rol_id) ?? null

  const cambiarSucursal = (valor) => setSucursalFiltro(valor === '' ? null : Number(valor))

  const limpiarFiltros = () => {
    setBusqueda('')
    setSucursalFiltro(null)
  }

  const pedirEliminar = (t) => {
    setErrorEliminar(null)
    setAEliminar(t)
  }

  const eliminar = () => {
    const t = aEliminar
    if (!t) return

    setEliminando(true)
    trabajadoresService
      .eliminar(t.id)
      .then(() => {
        setTrabajadores((lista) => lista.filter((x) => x.id !== t.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Trabajador eliminado')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Trabajadores</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Nombre, código o usuario..."
                className="campo w-60 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="campo w-56 appearance-none pr-10"
                value={sucursalFiltro ?? ''}
                onChange={(e) => cambiarSucursal(e.target.value)}
                aria-label="Filtrar por sucursal"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
                <option value="-1">Sin sucursal asignada</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                expand_more
              </span>
            </div>
            <Link to="/panel/trabajadores/nuevo" className="btn-primario">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo trabajador
            </Link>
          </div>
        </div>

        <Tabla
          cargando={cargando}
          error={error}
          vacio={filtrados.length === 0}
          iconoVacio="badge"
          tituloVacio={hayFiltros ? 'Sin resultados' : 'No hay trabajadores todavía'}
          descripcionVacio={
            hayFiltros
              ? 'Ningún trabajador coincide con los filtros.'
              : 'Registra al personal con sus datos de acceso y su sucursal.'
          }
          textoAccionVacio={hayFiltros ? 'Limpiar filtros' : null}
          onAccionVacia={limpiarFiltros}
          onReintentar={cargar}
          pie={
            <p>
              {filtrados.length} {filtrados.length === 1 ? 'trabajador' : 'trabajadores'}
              {hayFiltros ? ` de ${trabajadores.length}` : null}
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Trabajador</th>
                <th>Rol</th>
                <th>Sucursal</th>
                <th>Contrato</th>
                <th className="text-right">Sueldo</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((t) => {
                const estilo = estiloRol(rolDe(t))
                const sucursal = sucursalDe(t)
                return (
                  <tr key={t.id}>
                    <td className="font-mono text-xs font-semibold text-on-surface-variant">{t.codigo}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary">
                          {iniciales(t)}
                        </span>
                        <div>
                          <p className="font-semibold leading-tight">
                            {t.nombre} {t.apellido}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {`@${t.username} · ${t.correo}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', estilo.chip)}>
                        {estilo.etiqueta}
                      </span>
                    </td>
                    <td>
                      {sucursal ? (
                        <span className="inline-flex items-center gap-1 text-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-outline">store</span>
                          {sucursal}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">Sin asignar</span>
                      )}
                    </td>
                    <td className="text-on-surface-variant">{formatoFecha(t.fecha_contrato, 'dd/MM/yyyy')}</td>
                    <td className="text-right font-medium tabular-nums">{monedaBs(t.sueldo)}</td>
                    <td>
                      <div className="acciones-fila">
                        <Link to={`/panel/trabajadores/${t.id}/editar`} className="btn-icono" title="Editar">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Link>
                        <button type="button" className="btn-icono-peligro" title="Eliminar" onClick={() => pedirEliminar(t)}>
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Tabla>

        {!cargando && !error && trabajadores.length === 0 && !hayFiltros && (
          <div className="mt-4 text-center">
            <Link to="/panel/trabajadores/nuevo" className="btn-primario">
              Nuevo trabajador
            </Link>
          </div>
        )}
      </div>

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar a ' + aEliminar.nombre + ' ' + aEliminar.apellido + '?'}
          mensaje="Se borra también su cuenta de usuario. Esta acción no se puede deshacer."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
