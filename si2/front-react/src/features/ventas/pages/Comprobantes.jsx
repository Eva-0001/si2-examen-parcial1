import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { comprobantesService } from '../services/comprobantes.service'
import { ventasService } from '../services/ventas.service'
import { numeroVenta } from '../ventas.utils'
import ModalComprobante from '../components/ModalComprobante'
import { useAuth } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { formatoFecha } from '@/shared/utils/formato'
import { monedaBs } from '@/shared/utils/moneda-bs'

export default function Comprobantes() {
  const auth = useAuth()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [comprobantes, setComprobantes] = useState([])
  const [ventas, setVentas] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [ventaFiltro, setVentaFiltro] = useState(null)

  const texto = busqueda.trim().toLowerCase()
  const filtrados = comprobantes
    .filter(
      (c) =>
        (ventaFiltro === null || c.venta_id === ventaFiltro) &&
        (!texto || c.nombre.toLowerCase().includes(texto) || numeroVenta(c.venta_id).includes(texto)),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const hayFiltros = busqueda.trim() !== '' || ventaFiltro !== null
  const puedeEmitir = auth.esAdmin || auth.esCajero
  const ventasOrdenadas = [...ventas].sort((a, b) => b.id - a.id)

  const [modal, setModal] = useState(undefined)
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([comprobantesService.listar(), ventasService.listar()])
      .then(([listaComprobantes, listaVentas]) => {
        setComprobantes(listaComprobantes)
        setVentas(listaVentas)
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

  const cambiarVenta = (valor) => setVentaFiltro(valor === '' ? null : Number(valor))

  const limpiarFiltros = () => {
    setBusqueda('')
    setVentaFiltro(null)
  }

  const alGuardar = (c) => {
    setComprobantes((lista) => (lista.some((x) => x.id === c.id) ? lista.map((x) => (x.id === c.id ? c : x)) : [...lista, c]))
    setModal(undefined)
  }

  const pedirEliminar = (c) => {
    setErrorEliminar(null)
    setAEliminar(c)
  }

  const eliminar = () => {
    const c = aEliminar
    if (!c) return
    setEliminando(true)
    comprobantesService
      .eliminar(c.id)
      .then(() => {
        setComprobantes((lista) => lista.filter((x) => x.id !== c.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Comprobante eliminado')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  return (
    <>
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Comprobantes</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Nombre o número de venta..."
                className="campo w-60 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="campo w-52 appearance-none pr-9"
                value={ventaFiltro ?? ''}
                onChange={(e) => cambiarVenta(e.target.value)}
                aria-label="Filtrar por venta"
              >
                <option value="">Todas las ventas</option>
                {ventasOrdenadas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {numeroVenta(v.id)} · Bs {v.total}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                expand_more
              </span>
            </div>
            {puedeEmitir && (
              <button type="button" className="btn-primario" onClick={() => setModal(null)}>
                <span className="material-symbols-outlined text-[18px]">add</span> Emitir comprobante
              </button>
            )}
          </div>
        </div>

        <Tabla
          cargando={cargando}
          error={error}
          vacio={filtrados.length === 0}
          iconoVacio="receipt"
          tituloVacio={hayFiltros ? 'Sin resultados' : 'No hay comprobantes emitidos'}
          descripcionVacio={
            hayFiltros
              ? 'Ningún comprobante coincide con los filtros.'
              : 'Se emiten desde el punto de venta o desde el detalle de cada venta.'
          }
          textoAccionVacio={hayFiltros ? 'Limpiar filtros' : puedeEmitir ? 'Emitir comprobante' : null}
          onAccionVacia={() => (hayFiltros ? limpiarFiltros() : setModal(null))}
          onReintentar={cargar}
          pie={
            <p>
              {filtrados.length} {filtrados.length === 1 ? 'comprobante' : 'comprobantes'}
              {hayFiltros ? ` de ${comprobantes.length}` : null}
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Fecha</th>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Monto</th>
                <th>Venta</th>
                {puedeEmitir && <th className="text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">{c.nombre}</td>
                  <td className="text-on-surface-variant">{formatoFecha(c.fecha, 'dd/MM/yyyy HH:mm')}</td>
                  <td className="text-center tabular-nums">{c.cantidad}</td>
                  <td className="text-right font-semibold tabular-nums">{monedaBs(c.monto)}</td>
                  <td>
                    <Link to={`/panel/ventas/${c.venta_id}`} className="font-semibold text-primary hover:underline">
                      {numeroVenta(c.venta_id)}
                    </Link>
                  </td>
                  {puedeEmitir && (
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="btn-icono" title="Editar" onClick={() => setModal(c)}>
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button type="button" className="btn-icono-peligro" title="Eliminar" onClick={() => pedirEliminar(c)}>
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Tabla>
      </div>

      {modal !== undefined && (
        <ModalComprobante
          ventas={ventas}
          existente={modal ?? null}
          cantidadEmitidos={comprobantes.length}
          onCerrar={() => setModal(undefined)}
          onGuardado={alGuardar}
        />
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + aEliminar.nombre + '?'}
          mensaje="Esta acción no se puede deshacer."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
