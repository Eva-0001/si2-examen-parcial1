import { useCallback, useEffect, useState } from 'react'
import { ciudadesService } from '../services/ciudades.service'
import ModalCiudad from '../components/ModalCiudad'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'

export default function Ciudades() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [ciudades, setCiudades] = useState([])
  const [sucursalesPorCiudad, setSucursalesPorCiudad] = useState(() => new Map())

  const nombres = ciudades.map((c) => c.nombre)

  const [busqueda, setBusqueda] = useState('')
  const texto = busqueda.trim().toLowerCase()
  const filtradas = texto ? ciudades.filter((c) => c.nombre.toLowerCase().includes(texto)) : ciudades

  const [enEdicion, setEnEdicion] = useState(undefined)

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([ciudadesService.listar(), sucursalesService.listar()])
      .then(([listaCiudades, sucursales]) => {
        const conteo = new Map()
        for (const s of sucursales) conteo.set(s.ciudad_id, (conteo.get(s.ciudad_id) ?? 0) + 1)

        setCiudades(listaCiudades)
        setSucursalesPorCiudad(conteo)
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

  const sucursalesDe = (ciudad) => sucursalesPorCiudad.get(ciudad.id) ?? 0

  const abrirNueva = () => setEnEdicion(null)
  const abrirEditar = (ciudad) => setEnEdicion(ciudad)
  const cerrarModal = () => setEnEdicion(undefined)

  const alGuardar = (ciudad) => {
    setCiudades((lista) => {
      const existe = lista.some((c) => c.id === ciudad.id)
      const nueva = existe ? lista.map((c) => (c.id === ciudad.id ? ciudad : c)) : [...lista, ciudad]
      return nueva.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    })
    cerrarModal()
  }

  const pedirEliminar = (ciudad) => {
    setErrorEliminar(null)
    setAEliminar(ciudad)
  }

  const mensajeEliminar = () => {
    const n = aEliminar ? sucursalesDe(aEliminar) : 0
    if (n === 0) return 'Esta acción no se puede deshacer.'
    return `Se eliminarán también sus ${n} ${n === 1 ? 'sucursal' : 'sucursales'}. Esta acción no se puede deshacer.`
  }

  const eliminar = () => {
    const ciudad = aEliminar
    if (!ciudad) return

    setEliminando(true)
    ciudadesService
      .eliminar(ciudad.id)
      .then(() => {
        setCiudades((lista) => lista.filter((c) => c.id !== ciudad.id))
        setSucursalesPorCiudad((m) => {
          const copia = new Map(m)
          copia.delete(ciudad.id)
          return copia
        })
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Ciudad eliminada')
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
            <h1 className="text-2xl font-semibold text-on-surface">Ciudades</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Buscar ciudad..."
                className="campo w-56 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button type="button" className="btn-primario" onClick={abrirNueva}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva ciudad
            </button>
          </div>
        </div>

        <Tabla
          cargando={cargando}
          error={error}
          vacio={filtradas.length === 0}
          iconoVacio="location_city"
          tituloVacio={busqueda ? 'Sin resultados' : 'No hay ciudades todavía'}
          descripcionVacio={
            busqueda ? 'Ninguna ciudad coincide con la búsqueda.' : 'Crea la primera ciudad para poder registrar sucursales.'
          }
          textoAccionVacio={busqueda ? null : 'Nueva ciudad'}
          onAccionVacia={abrirNueva}
          onReintentar={cargar}
          pie={
            <p>
              {filtradas.length} {filtradas.length === 1 ? 'ciudad' : 'ciudades'}
              {busqueda ? ` de ${ciudades.length}` : null}
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th>Ciudad</th>
                <th>Sucursales</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((ciudad) => {
                const n = sucursalesDe(ciudad)
                return (
                  <tr key={ciudad.id}>
                    <td className="font-medium">{ciudad.nombre}</td>
                    <td>
                      {n ? (
                        <span className="chip">
                          <span className="material-symbols-outlined text-[14px]">store</span>
                          {n} {n === 1 ? 'sucursal' : 'sucursales'}
                        </span>
                      ) : (
                        <span className="chip-suave">Sin sucursales</span>
                      )}
                    </td>
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="btn-icono" title="Editar" onClick={() => abrirEditar(ciudad)}>
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-icono-peligro"
                          title="Eliminar"
                          onClick={() => pedirEliminar(ciudad)}
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
        <ModalCiudad
          ciudad={enEdicion ?? null}
          nombresOcupados={nombres}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + aEliminar.nombre + '?'}
          mensaje={mensajeEliminar()}
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
