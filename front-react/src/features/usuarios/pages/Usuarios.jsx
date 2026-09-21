import { useCallback, useEffect, useState } from 'react'
import ModalUsuario from '../components/ModalUsuario'
import { usuariosService } from '@/core/services/usuarios.service'
import { rolesService } from '@/features/roles/services/roles.service'
import { useAuth, useAuthStore } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { estiloRol } from '@/shared/utils/roles'
import { cx } from '@/shared/utils/clases'

const ordenar = (lista) =>
  [...lista].sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'))

const iniciales = (u) => `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase()

export default function Usuarios() {
  const auth = useAuth()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])

  const nombreRol = new Map(roles.map((r) => [r.id, r.nombre]))

  const [busqueda, setBusqueda] = useState('')
  const [rolFiltro, setRolFiltro] = useState(null)

  const texto = busqueda.trim().toLowerCase()
  const filtrados = usuarios.filter(
    (u) =>
      (rolFiltro === null || u.rol_id === rolFiltro) &&
      (!texto ||
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(texto) ||
        u.username.toLowerCase().includes(texto) ||
        u.correo.toLowerCase().includes(texto)),
  )

  const hayFiltros = busqueda.trim() !== '' || rolFiltro !== null

  const [enEdicion, setEnEdicion] = useState(undefined)
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([usuariosService.listar(), rolesService.listar()])
      .then(([listaUsuarios, listaRoles]) => {
        setUsuarios(ordenar(listaUsuarios))
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

  const rolDe = (u) => nombreRol.get(u.rol_id) ?? null
  const esYo = (u) => auth.usuario?.id === u.id

  const limpiarFiltros = () => {
    setBusqueda('')
    setRolFiltro(null)
  }

  const abrirNuevo = () => setEnEdicion(null)
  const abrirEditar = (u) => setEnEdicion(u)
  const cerrarModal = () => setEnEdicion(undefined)

  const alGuardar = (usuario) => {
    setUsuarios((lista) =>
      ordenar(
        lista.some((u) => u.id === usuario.id)
          ? lista.map((u) => (u.id === usuario.id ? usuario : u))
          : [...lista, usuario],
      ),
    )
    if (esYo(usuario)) useAuthStore.getState().actualizarUsuario(usuario)
    cerrarModal()
  }

  const pedirEliminar = (u) => {
    setErrorEliminar(null)
    setAEliminar(u)
  }

  const eliminar = () => {
    const usuario = aEliminar
    if (!usuario) return

    setEliminando(true)
    usuariosService
      .eliminar(usuario.id)
      .then(() => {
        setUsuarios((lista) => lista.filter((u) => u.id !== usuario.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Usuario eliminado')
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
            <h1 className="text-2xl font-semibold text-on-surface">Usuarios</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Nombre, usuario o correo..."
                className="campo w-64 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="campo w-48 appearance-none pr-10"
                value={rolFiltro ?? ''}
                onChange={(e) => setRolFiltro(e.target.value ? +e.target.value : null)}
                aria-label="Filtrar por rol"
              >
                <option value="">Todos los roles</option>
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
            <button type="button" className="btn-primario" onClick={abrirNuevo}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo usuario
            </button>
          </div>
        </div>

        <Tabla
          cargando={cargando}
          error={error}
          vacio={filtrados.length === 0}
          iconoVacio="group"
          tituloVacio={hayFiltros ? 'Sin resultados' : 'No hay usuarios'}
          descripcionVacio={hayFiltros ? 'Ningún usuario coincide con los filtros.' : 'Crea la primera cuenta del sistema.'}
          textoAccionVacio={hayFiltros ? 'Limpiar filtros' : 'Nuevo usuario'}
          onAccionVacia={() => (hayFiltros ? limpiarFiltros() : abrirNuevo())}
          onReintentar={cargar}
          pie={
            <p>
              {filtrados.length} {filtrados.length === 1 ? 'usuario' : 'usuarios'}
              {hayFiltros ? ` de ${usuarios.length}` : null}
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre de usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((usuario) => {
                const estilo = estiloRol(rolDe(usuario))
                const yo = esYo(usuario)
                return (
                  <tr key={usuario.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary">
                          {iniciales(usuario)}
                        </span>
                        <div>
                          <p className="font-semibold leading-tight">
                            {usuario.nombre} {usuario.apellido}
                            {yo && (
                              <>
                                {' '}
                                <span className="ml-1 text-[11px] font-medium text-on-surface-variant">(vos)</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-on-surface-variant">{`@${usuario.username}`}</td>
                    <td className="text-on-surface-variant">{usuario.correo}</td>
                    <td>
                      <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', estilo.chip)}>
                        {estilo.etiqueta}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="btn-icono" title="Editar" onClick={() => abrirEditar(usuario)}>
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-icono-peligro"
                          title={yo ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
                          disabled={yo}
                          onClick={() => pedirEliminar(usuario)}
                        >
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
      </div>

      {enEdicion !== undefined && (
        <ModalUsuario usuario={enEdicion ?? null} roles={roles} onCerrar={cerrarModal} onGuardado={alGuardar} />
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar a ' + aEliminar.nombre + ' ' + aEliminar.apellido + '?'}
          mensaje="Esta acción no se puede deshacer. Si tiene ventas o reservas registradas, no se podrá eliminar."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
