import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { agregarTablero, tableroService } from '../services/tablero.service'
import { useReferencias } from '@/core/stores/referencias.store'
import Skeleton from '@/shared/components/Skeleton'
import GraficoLineas from '@/shared/components/GraficoLineas'
import GraficoBarras from '@/shared/components/GraficoBarras'
import { desdeISO } from '@/shared/utils/fechas'
import { formatoFecha, formatoNumero } from '@/shared/utils/formato'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { cx } from '@/shared/utils/clases'

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const formatoBs = (v) => (v >= 1000 ? `Bs ${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `Bs ${Math.round(v)}`)

const esSalida = (accion) => /salida/i.test(accion)

export default function Tablero() {
  const referencias = useReferencias()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [datos, setDatos] = useState(null)

  const pedir = useCallback((forzar) => {
    ;(forzar ? tableroService.refrescar() : tableroService.cargar())
      .then((d) => {
        setDatos(d)
        setCargando(false)
      })
      .catch((e) => {
        setError(e.message)
        setCargando(false)
      })
  }, [])

  useEffect(() => {
    pedir(false)
  }, [pedir])

  const cargar = (forzar = false) => {
    setCargando(true)
    setError(null)
    pedir(forzar)
  }

  let contenido
  if (cargando) {
    contenido = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Skeleton tipo="bloque" />
          <Skeleton tipo="bloque" />
          <Skeleton tipo="bloque" />
          <Skeleton tipo="bloque" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton tipo="bloque" />
          <Skeleton tipo="bloque" />
        </div>
      </div>
    )
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <span className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
        <h3 className="mt-2 text-lg font-semibold text-on-surface">No pudimos armar el tablero</h3>
        <p className="text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={() => cargar(true)}>
          Reintentar
        </button>
      </div>
    )
  } else if (datos) {
    const t = agregarTablero(datos)
    const variacion = t.ventasDelMes.variacion

    const serieDias = t.ventasPorDia.map((d) => {
      const f = desdeISO(d.fecha)
      return {
        etiqueta: `${f.getDate()} ${MESES_CORTOS[f.getMonth()]}`,
        detalle: `${f.getDate()} de ${MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}`,
        valor: d.total,
      }
    })
    const serieSucursales = t.facturacionPorSucursal.map((s) => ({
      etiqueta: s.sucursal.nombre,
      detalle: s.sucursal.ubicacion,
      valor: s.total,
    }))
    const totalUltimoMes = t.ventasPorDia.reduce((a, d) => a + d.total, 0)

    contenido = (
      <>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link to="/panel/ventas" className="tarjeta transition-colors hover:border-primary">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Ventas del mes</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-primary">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-on-surface">{monedaBs(t.ventasDelMes.valor)}</p>
            {variacion ? (
              <p className={cx('mt-1 flex items-center gap-1 text-xs font-semibold', variacion >= 0 ? 'text-success' : 'text-error')}>
                <span className="material-symbols-outlined text-[16px]">{variacion >= 0 ? 'trending_up' : 'trending_down'}</span>
                {variacion >= 0 ? '+' : ''}
                {formatoNumero(variacion, '1.0-0')}% vs. mes anterior
              </p>
            ) : (
              <p className="mt-1 text-xs text-on-surface-variant">Sin mes anterior para comparar</p>
            )}
          </Link>
          <Link to="/panel/reservas-sucursal" className="tarjeta transition-colors hover:border-primary">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Reservas pendientes</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <span className="material-symbols-outlined text-[20px]">event</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-on-surface">{t.reservasPendientes.valor}</p>
            <p className="mt-1 text-xs text-on-surface-variant">De hoy en adelante, sin asistencia confirmada</p>
          </Link>
          <Link to="/panel/inventario" className="tarjeta transition-colors hover:border-primary">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Productos sin stock</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10 text-error">
                <span className="material-symbols-outlined text-[20px]">production_quantity_limits</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-on-surface">{t.productosSinStock.valor}</p>
            <p className="mt-1 text-xs text-on-surface-variant">Agotados en todas sus sucursales</p>
          </Link>
          <Link to="/panel/usuarios" className="tarjeta transition-colors hover:border-primary">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Clientes registrados</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-on-surface">{t.clientes.valor}</p>
            <p className="mt-1 text-xs text-on-surface-variant">Cuentas con rol cliente</p>
          </Link>
        </div>

        {t.ventasSinFecha > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            {t.ventasSinFecha} {t.ventasSinFecha === 1 ? 'venta no tiene' : 'ventas no tienen'} fecha registrada (la API no la
            guarda y no aparece en la bitácora), así que no entra en el KPI del mes ni en el gráfico por día.
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="tarjeta">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-on-surface">Ventas por día</h2>
                <p className="text-xs text-on-surface-variant">Últimos 30 días · {monedaBs(totalUltimoMes)} en total</p>
              </div>
            </div>
            <GraficoLineas datos={serieDias} formato={formatoBs} />
          </section>
          <section className="tarjeta">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-on-surface">Facturación por sucursal</h2>
              <p className="text-xs text-on-surface-variant">Histórico, ordenado de mayor a menor</p>
            </div>
            <GraficoBarras datos={serieSucursales} formato={formatoBs} />
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3">
              <h2 className="text-base font-semibold text-on-surface">Productos más vendidos</h2>
              <Link to="/panel/productos" className="text-xs font-semibold text-primary hover:underline">
                Ver productos
              </Link>
            </div>
            <div className="tabla">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Unidades</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {t.productosMasVendidos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-on-surface-variant">
                        Todavía no hay ventas.
                      </td>
                    </tr>
                  ) : (
                    t.productosMasVendidos.map((p, i) => (
                      <tr key={p.producto_id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-semibold leading-tight">{p.nombre}</p>
                              <p className="text-xs text-on-surface-variant">
                                {referencias.nombre('tallas', p.talla_id)} · {referencias.nombre('colores', p.color_id)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center font-semibold tabular-nums">{p.unidades}</td>
                        <td className="text-right tabular-nums">{monedaBs(p.monto)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3">
              <h2 className="text-base font-semibold text-on-surface">Últimos movimientos de bitácora</h2>
              <Link to="/panel/bitacora" className="text-xs font-semibold text-primary hover:underline">
                Ver bitácora
              </Link>
            </div>
            <ul className="divide-y divide-outline-variant">
              {t.ultimosMovimientos.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-on-surface-variant">Sin movimientos registrados.</li>
              ) : (
                t.ultimosMovimientos.map((m) => (
                  <li key={m.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                    <span
                      className={cx(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        esSalida(m.accion) ? 'bg-error/10 text-error' : 'bg-success/10 text-success',
                      )}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {esSalida(m.accion) ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-on-surface">{m.accion}</p>
                      <p className="text-xs text-on-surface-variant">
                        {m.producto ?? ''} · {m.encargado}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-on-surface-variant">{formatoFecha(m.fecha, 'dd/MM HH:mm')}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </>
    )
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Tablero</h1>
        </div>
        <button type="button" className="btn-secundario" onClick={() => cargar(true)} disabled={cargando}>
          <span className="material-symbols-outlined text-[18px]">refresh</span> Actualizar
        </button>
      </div>

      {contenido}
    </div>
  )
}
