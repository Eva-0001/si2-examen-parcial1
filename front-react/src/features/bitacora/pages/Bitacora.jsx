import { useCallback, useEffect, useState } from 'react'
import { bitacoraService } from '../services/bitacora.service'
import Tabla from '@/shared/components/Tabla'
import { formatoFecha } from '@/shared/utils/formato'
import { cx } from '@/shared/utils/clases'

const OPCIONES_TIPO = [
  ['todos', 'Todos'],
  ['salida', 'Salidas'],
  ['reingreso', 'Reingresos'],
]

const esSalida = (r) => /salida/i.test(r.accion)

export default function Bitacora() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [registros, setRegistros] = useState([])

  const [encargado, setEncargado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [tipo, setTipo] = useState('todos')

  const encargados = [...new Set(registros.map((r) => r.encargado))].sort()

  const filtrados = registros
    .filter((r) => {
      if (encargado && r.encargado !== encargado) return false
      const dia = r.fecha.slice(0, 10)
      if (desde && dia < desde) return false
      if (hasta && dia > hasta) return false
      if (tipo === 'salida' && !esSalida(r)) return false
      if (tipo === 'reingreso' && esSalida(r)) return false
      return true
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const hayFiltros = !!encargado || !!desde || !!hasta || tipo !== 'todos'

  const resumen = {
    salidas: filtrados.filter((r) => esSalida(r)).length,
    reingresos: filtrados.filter((r) => !esSalida(r)).length,
  }

  const pedir = useCallback(() => {
    bitacoraService
      .listar()
      .then((lista) => {
        setRegistros(lista)
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

  const limpiar = () => {
    setEncargado('')
    setDesde('')
    setHasta('')
    setTipo('todos')
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-on-surface">Bitácora</h1>
      </div>

      {!cargando && !error && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              className="campo w-48 appearance-none pr-9"
              value={encargado}
              onChange={(e) => setEncargado(e.target.value)}
              aria-label="Encargado"
            >
              <option value="">Todos los usuarios</option>
              {encargados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            Desde <input type="date" className="campo w-40 py-2" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            Hasta <input type="date" className="campo w-40 py-2" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <div className="flex gap-2">
            {OPCIONES_TIPO.map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                className={cx(
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  tipo === valor
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low',
                )}
                onClick={() => setTipo(valor)}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          {hayFiltros && (
            <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={limpiar}>
              Limpiar
            </button>
          )}
          <p className="ml-auto text-xs text-on-surface-variant">
            <span className="font-semibold text-error">{resumen.salidas}</span> salidas ·{' '}
            <span className="font-semibold text-success">{resumen.reingresos}</span> reingresos
          </p>
        </div>
      )}

      <Tabla
        cargando={cargando}
        error={error}
        vacio={filtrados.length === 0}
        filasSkeleton={8}
        iconoVacio="history"
        tituloVacio={hayFiltros ? 'Sin movimientos con esos filtros' : 'La bitácora está vacía'}
        descripcionVacio={hayFiltros ? 'Prueba con otro rango o usuario.' : 'Se llena sola con cada venta y anulación.'}
        textoAccionVacio={hayFiltros ? 'Limpiar filtros' : null}
        onAccionVacia={limpiar}
        onReintentar={cargar}
        pie={
          <p>
            {filtrados.length} {filtrados.length === 1 ? 'movimiento' : 'movimientos'}
            {hayFiltros ? ` de ${registros.length}` : null}
          </p>
        }
      >
        <table>
          <thead>
            <tr>
              <th className="w-12"></th>
              <th>Fecha y hora</th>
              <th>Acción</th>
              <th>Usuario</th>
              <th>Producto</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => {
              const salida = esSalida(r)
              return (
                <tr key={r.id}>
                  <td>
                    <span
                      className={cx(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        salida ? 'bg-error/10 text-error' : 'bg-success/10 text-success',
                      )}
                      title={salida ? 'Salida de stock' : 'Reingreso de stock'}
                    >
                      <span className="material-symbols-outlined text-[18px]">{salida ? 'arrow_downward' : 'arrow_upward'}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-on-surface-variant">{formatoFecha(r.fecha, 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td className="font-medium">{r.accion}</td>
                  <td>{`@${r.encargado}`}</td>
                  <td className="text-on-surface-variant">{r.producto ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Tabla>
    </div>
  )
}
