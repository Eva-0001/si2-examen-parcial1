import { useCallback, useEffect, useState } from 'react'
import { rolesService } from '../services/roles.service'
import ModalRol from '../components/ModalRol'
import { usuariosService } from '@/core/services/usuarios.service'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { esRolDelSistema, estiloRol } from '@/shared/utils/roles'
import { cx } from '@/shared/utils/clases'

export default function Roles() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [roles, setRoles] = useState([])
  const [usuariosPorRol, setUsuariosPorRol] = useState(() => new Map())

  const nombres = roles.map((r) => r.nombre)

  const [enEdicion, setEnEdicion] = useState(undefined)
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([rolesService.listar(), usuariosService.listar()])
      .then(([listaRoles, usuarios]) => {
        const conteo = new Map()
        for (const u of usuarios) conteo.set(u.rol_id, (conteo.get(u.rol_id) ?? 0) + 1)
        setRoles([...listaRoles].sort((a, b) => a.id - b.id))
        setUsuariosPorRol(conteo)
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

  const usuariosDe = (rol) => usuariosPorRol.get(rol.id) ?? 0

  const abrirNuevo = () => setEnEdicion(null)
  const abrirEditar = (rol) => setEnEdicion(rol)
  const cerrarModal = () => setEnEdicion(undefined)

  const alGuardar = (rol) => {
    setRoles((lista) =>
      lista.some((r) => r.id === rol.id) ? lista.map((r) => (r.id === rol.id ? rol : r)) : [...lista, rol],
    )
    cerrarModal()
  }

  const pedirEliminar = (rol) => {
    setErrorEliminar(null)
    setAEliminar(rol)
  }

  const eliminar = () => {
    const rol = aEliminar
    if (!rol) return

    setEliminando(true)
    rolesService
      .eliminar(rol.id)
      .then(() => {
        setRoles((lista) => lista.filter((r) => r.id !== rol.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Rol eliminado')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  return (
    <>
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Roles</h1>
          </div>
          <button type="button" className="btn-primario" onClick={abrirNuevo}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo rol
          </button>
        </div>

        <Tabla
          cargando={cargando}
          error={error}
          vacio={roles.length === 0}
          iconoVacio="security"
          tituloVacio="No hay roles"
          descripcionVacio="El seed del backend crea los cinco roles base. Puedes crear uno nuevo desde aquí."
          textoAccionVacio="Nuevo rol"
          onAccionVacia={abrirNuevo}
          onReintentar={cargar}
          pie={<p>{roles.length} roles</p>}
        >
          <table>
            <thead>
              <tr>
                <th>Rol</th>
                <th>Descripción</th>
                <th>Usuarios</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((rol) => {
                const estilo = estiloRol(rol.nombre)
                const n = usuariosDe(rol)
                return (
                  <tr key={rol.id}>
                    <td>
                      <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', estilo.chip)}>
                        {estilo.etiqueta}
                      </span>
                    </td>
                    <td className="text-on-surface-variant">{estilo.descripcion}</td>
                    <td>
                      {n ? (
                        <span className="chip">
                          <span className="material-symbols-outlined text-[14px]">group</span>
                          {n} {n === 1 ? 'usuario' : 'usuarios'}
                        </span>
                      ) : (
                        <span className="chip-suave">Sin usuarios</span>
                      )}
                    </td>
                    <td>
                      <div className="acciones-fila">
                        {esRolDelSistema(rol.nombre) ? (
                          <span
                            className="mr-1 text-[11px] font-medium text-on-surface-variant"
                            title="Los guards y menús dependen de este nombre"
                          >
                            del sistema
                          </span>
                        ) : (
                          <>
                            <button type="button" className="btn-icono" title="Editar" onClick={() => abrirEditar(rol)}>
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn-icono-peligro"
                              title="Eliminar"
                              onClick={() => pedirEliminar(rol)}
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </>
                        )}
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
        <ModalRol rol={enEdicion ?? null} nombresOcupados={nombres} onCerrar={cerrarModal} onGuardado={alGuardar} />
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar el rol ' + aEliminar.nombre + '?'}
          mensaje="Esta acción no se puede deshacer. Si hay usuarios con este rol, no se podrá eliminar."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
