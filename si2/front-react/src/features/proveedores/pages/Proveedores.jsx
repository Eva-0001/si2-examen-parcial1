import { useCallback, useEffect, useState } from 'react'
import { proveedoresService } from '../services/proveedores.service'
import ModalProveedor from '../components/ModalProveedor'
import { productosService } from '@/features/productos/services/productos.service'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'

const ordenar = (lista) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

export default function Proveedores() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [proveedores, setProveedores] = useState([])
  const [productosPorProveedor, setProductosPorProveedor] = useState(() => new Map())

  const nombres = proveedores.map((p) => p.nombre)

  const [busqueda, setBusqueda] = useState('')
  const texto = busqueda.trim().toLowerCase()
  const filtrados = !texto
    ? proveedores
    : proveedores.filter((p) =>
        [p.nombre, p.descripcion, p.encargado, p.telefono?.toString()]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(texto)),
      )

  const [enEdicion, setEnEdicion] = useState(undefined)
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([proveedoresService.listar(), productosService.listar()])
      .then(([listaProveedores, productos]) => {
        const conteo = new Map()
        for (const p of productos) {
          if (p.proveedor_id != null) conteo.set(p.proveedor_id, (conteo.get(p.proveedor_id) ?? 0) + 1)
        }
        setProveedores(ordenar(listaProveedores))
        setProductosPorProveedor(conteo)
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

  const productosDe = (proveedor) => productosPorProveedor.get(proveedor.id) ?? 0
  const inicial = (proveedor) => proveedor.nombre.charAt(0).toUpperCase()

  const abrirNuevo = () => setEnEdicion(null)
  const abrirEditar = (proveedor) => setEnEdicion(proveedor)
  const cerrarModal = () => setEnEdicion(undefined)

  const alGuardar = (proveedor) => {
    setProveedores((lista) => {
      const existe = lista.some((p) => p.id === proveedor.id)
      return ordenar(existe ? lista.map((p) => (p.id === proveedor.id ? proveedor : p)) : [...lista, proveedor])
    })
    cerrarModal()
  }

  const pedirEliminar = (proveedor) => {
    setErrorEliminar(null)
    setAEliminar(proveedor)
  }

  const eliminar = () => {
    const proveedor = aEliminar
    if (!proveedor) return

    setEliminando(true)
    proveedoresService
      .eliminar(proveedor.id)
      .then(() => {
        setProveedores((lista) => lista.filter((p) => p.id !== proveedor.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Proveedor eliminado')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Proveedores</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Buscar proveedor, encargado, teléfono..."
                className="campo w-72 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button type="button" className="btn-primario" onClick={abrirNuevo}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo proveedor
            </button>
          </div>
        </div>

        <Tabla
          cargando={cargando}
          error={error}
          vacio={filtrados.length === 0}
          iconoVacio="local_shipping"
          tituloVacio={busqueda ? 'Sin resultados' : 'No hay proveedores todavía'}
          descripcionVacio={
            busqueda
              ? 'Ningún proveedor coincide con la búsqueda.'
              : 'Registra a quienes abastecen la tienda para asociarlos a sus productos.'
          }
          textoAccionVacio={busqueda ? null : 'Nuevo proveedor'}
          onAccionVacia={abrirNuevo}
          onReintentar={cargar}
          pie={
            <p>
              {filtrados.length} {filtrados.length === 1 ? 'proveedor' : 'proveedores'}
              {busqueda ? ` de ${proveedores.length}` : null}
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Descripción</th>
                <th>Encargado</th>
                <th>Teléfono</th>
                <th>Productos</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((proveedor) => {
                const n = productosDe(proveedor)
                return (
                  <tr key={proveedor.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-sm font-bold text-primary">
                          {inicial(proveedor)}
                        </span>
                        <span className="font-semibold">{proveedor.nombre}</span>
                      </div>
                    </td>
                    <td className="max-w-[260px] truncate text-on-surface-variant" title={proveedor.descripcion ?? ''}>
                      {proveedor.descripcion || '—'}
                    </td>
                    <td>{proveedor.encargado || '—'}</td>
                    <td className="tabular-nums text-on-surface-variant">
                      {proveedor.telefono != null ? (
                        <a href={'tel:' + proveedor.telefono} className="hover:text-primary">
                          {proveedor.telefono}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {n ? (
                        <span className="chip">
                          {n} {n === 1 ? 'producto' : 'productos'}
                        </span>
                      ) : (
                        <span className="chip-suave">Sin productos</span>
                      )}
                    </td>
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="btn-icono" title="Editar" onClick={() => abrirEditar(proveedor)}>
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-icono-peligro"
                          title="Eliminar"
                          onClick={() => pedirEliminar(proveedor)}
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
        <ModalProveedor
          proveedor={enEdicion ?? null}
          nombresOcupados={nombres}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + aEliminar.nombre + '?'}
          mensaje="Esta acción no se puede deshacer. Si ya tiene productos asociados, no se podrá eliminar."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
