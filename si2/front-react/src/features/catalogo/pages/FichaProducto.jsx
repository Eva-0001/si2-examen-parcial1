import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { catalogoService, useCatalogo } from '../services/catalogo.service'
import { useReferencias } from '@/core/stores/referencias.store'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import { useCarritoStore } from '@/core/stores/carrito.store'
import { useReservaBorradorStore } from '@/core/stores/reserva-borrador.store'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import TarjetaProducto from '@/shared/components/TarjetaProducto'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { colorDesdeNombre, esColorClaro } from '@/shared/utils/colores'
import { compararTallas } from '@/features/catalogos/catalogos.config'
import { conQuery } from '@/shared/utils/query'
import { cx } from '@/shared/utils/clases'

export default function FichaProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const catalogo = useCatalogo()
  const referencias = useReferencias()
  const sucursal = useSucursalActivaStore((s) => s.sucursal)
  const ciudadesLista = useSucursalActivaStore((s) => s.ciudades)
  const seleccionarSucursal = useSucursalActivaStore((s) => s.seleccionar)

  const [cargando, setCargando] = useState(() => !catalogoService.estaCargado())
  const [error, setError] = useState(null)

  const [colorSel, setColorSel] = useState(null)
  const [tallaSel, setTallaSel] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [fotoSel, setFotoSel] = useState(null)
  const [panelRA, setPanelRA] = useState(false)

  useEffect(() => {
    let vigente = true
    catalogoService
      .cargar()
      .then(() => vigente && setCargando(false))
      .catch((e) => {
        if (!vigente) return
        setError(e.message)
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  const sucursalId = sucursal?.id ?? null
  const grupo = cargando ? undefined : catalogo.grupoPorId(Number(id))

  const [previo, setPrevio] = useState({ grupo: undefined, sucursalId: undefined })
  if (previo.grupo !== grupo || previo.sucursalId !== sucursalId) {
    setPrevio({ grupo, sucursalId })
    if (grupo) {
      const conStock = grupo.variantes.find((v) => (catalogo.stockDe(v.id, sucursalId)?.cantidad ?? 0) > 0)
      const base = conStock ?? grupo.variantes.find((v) => v.id === Number(id)) ?? grupo.variantes[0]
      setColorSel(base.color_id ?? grupo.colores[0] ?? null)
      setTallaSel(base.talla_id ?? grupo.tallas[0] ?? null)
      setCantidad(1)
      setFotoSel(null)
    }
  }

  const colores = (grupo?.colores ?? []).map((cid) => {
    const nombre = referencias.nombre('colores', cid) ?? ''
    return { id: cid, nombre, color: colorDesdeNombre(nombre) }
  })

  const tallasPara = (color) => {
    if (!grupo) return []
    return grupo.tallas
      .map((tid) => {
        const variante = grupo.variantes.find((v) => v.talla_id === tid && v.color_id === color) ?? null
        const stock = variante ? (catalogo.stockDe(variante.id, sucursalId)?.cantidad ?? 0) : 0
        return { id: tid, nombre: referencias.nombre('tallas', tid) ?? '', variante, stock }
      })
      .sort((a, b) => compararTallas(a.nombre, b.nombre))
  }
  const tallas = tallasPara(colorSel)

  const variante = tallas.find((t) => t.id === tallaSel)?.variante ?? null
  const stockActivo = variante ? catalogo.stockDe(variante.id, sucursalId) : undefined

  const precio = stockActivo ? Number(stockActivo.precio) : (grupo?.precioDesde ?? null)
  const maxCantidad = Math.max(0, stockActivo?.cantidad ?? 0)

  const fotos = grupo
    ? [...new Set(grupo.variantes.map((v) => catalogo.urlFoto(v)).filter((u) => !!u))].slice(0, 4)
    : []
  const fotoPrincipal = fotoSel ?? (variante ? catalogo.urlFoto(variante) : null) ?? fotos[0] ?? null

  let disponibilidad = []
  if (variante) {
    const ciudades = new Map(ciudadesLista.map((c) => [c.id, c.nombre]))
    disponibilidad = (catalogo.stockPorProducto.get(variante.id) ?? [])
      .filter((s) => s.sucursal)
      .map((s) => ({
        sucursal: s.sucursal,
        ciudad: ciudades.get(s.sucursal.ciudad_id) ?? '',
        cantidad: s.cantidad,
        precio: s.precio,
        activa: s.sucursal_id === sucursal?.id,
      }))
      .sort((a, b) => Number(b.activa) - Number(a.activa) || b.cantidad - a.cantidad)
  }

  const relacionados = grupo
    ? catalogo.grupos.filter((x) => x.clave !== grupo.clave && x.categoria_id === grupo.categoria_id).slice(0, 4)
    : []

  const urlQR = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    `${window.location.origin}/producto/${grupo?.id ?? id}`,
  )}`

  const elegirColor = (cid) => {
    setColorSel(cid)
    setFotoSel(null)
    setCantidad(1)
    const nuevas = tallasPara(cid)
    const actual = nuevas.find((t) => t.id === tallaSel)
    if (!actual?.variante) setTallaSel((nuevas.find((t) => t.stock > 0) ?? nuevas.find((t) => t.variante))?.id ?? null)
  }

  const elegirTalla = (op) => {
    if (!op.variante) return
    setTallaSel(op.id)
    setCantidad(1)
  }

  const cambiarCantidad = (delta) => {
    setCantidad((c) => Math.min(Math.max(1, c + delta), Math.max(1, maxCantidad)))
  }

  const elegirSucursal = (s) => {
    seleccionarSucursal(s)
    toast.info(`Ahora ves precios y stock de ${s.nombre}`)
  }

  const itemSeleccionado = () => ({
    producto_sucursal_id: stockActivo.id,
    producto_id: variante.id,
    nombre: variante.nombre,
    foto: catalogo.urlFoto(variante),
    color: referencias.nombre('colores', variante.color_id),
    talla: referencias.nombre('tallas', variante.talla_id),
    sucursal_id: sucursal.id,
    sucursal: sucursal.nombre,
    precio: Number(stockActivo.precio),
    maximo: stockActivo.cantidad,
  })

  const reservar = () => {
    if (!variante || !stockActivo || !sucursal || maxCantidad === 0) return
    useReservaBorradorStore.getState().agregar(itemSeleccionado(), cantidad)
    navigate('/reservas/nueva')
  }

  const agregarAlCarrito = () => {
    if (!variante || !stockActivo || !sucursal || maxCantidad === 0) return
    const carrito = useCarritoStore.getState()
    const final = carrito.agregar(itemSeleccionado(), cantidad)
    toast.exito(`${variante.nombre} agregado al carrito (${final} en total)`)
    carrito.abrir()
  }

  if (cargando) {
    return (
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Skeleton tipo="bloque" />
        <Skeleton tipo="bloque" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar el producto</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
        <Link to="/catalogo" className="btn-secundario mt-6">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
          <span className="material-symbols-outlined text-[32px] text-primary">checkroom</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No encontramos este producto</h3>
        <p className="mt-1 text-sm text-on-surface-variant">Puede que ya no esté en el catálogo.</p>
        <Link to="/catalogo" className="btn-primario mt-6">
          Ver catálogo
        </Link>
      </div>
    )
  }

  const g = grupo
  const categoria = referencias.nombre('categorias', g.categoria_id)
  const coleccion = referencias.nombre('colecciones', g.coleccion_id)
  const temporada = referencias.nombre('temporadas', g.temporada_id)
  const nombreColor = referencias.nombre('colores', colorSel)
  const nombreTalla = referencias.nombre('tallas', tallaSel)

  return (
    <>
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Link to="/" className="hover:text-primary">
          Inicio
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link to="/catalogo" className="hover:text-primary">
          Catálogo
        </Link>
        {categoria && (
          <>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link to={conQuery('/catalogo', { categoria: g.categoria_id })} className="hover:text-primary">
              {categoria}
            </Link>
          </>
        )}
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="truncate text-on-surface">{g.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex gap-3">
          {fotos.length > 1 && (
            <div className="flex w-20 shrink-0 flex-col gap-2">
              {fotos.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={cx(
                    'aspect-[3/4] overflow-hidden rounded-lg border-2 bg-surface-container transition-colors',
                    fotoPrincipal === f ? 'border-primary' : 'border-transparent hover:border-outline',
                  )}
                  onClick={() => setFotoSel(f)}
                >
                  <img src={f} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-hidden rounded-xl bg-surface-container">
            {fotoPrincipal ? (
              <img src={fotoPrincipal} alt={g.nombre} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 text-primary/40">
                <span className="material-symbols-outlined text-[96px]">checkroom</span>
                <span className="text-sm font-medium">Sin foto todavía</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold leading-tight text-on-surface">{g.nombre}</h1>

          <div className="mt-3 flex items-end gap-3">
            {precio ? (
              <p className="text-3xl font-bold text-on-surface">{monedaBs(precio)}</p>
            ) : (
              <p className="text-lg font-semibold text-on-surface-variant">Precio a consultar</p>
            )}
            {stockActivo ? (
              stockActivo.cantidad > 0 ? (
                <span className="mb-1.5 text-xs font-semibold text-success">
                  {stockActivo.cantidad} en {sucursal?.nombre}
                </span>
              ) : (
                <span className="mb-1.5 text-xs font-semibold text-on-surface-variant">Agotado en {sucursal?.nombre}</span>
              )
            ) : (
              variante && (
                <span className="mb-1.5 text-xs font-semibold text-on-surface-variant">
                  Sin stock en {sucursal?.nombre ?? 'esta sucursal'}
                </span>
              )
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {categoria && <span className="chip">{categoria}</span>}
            {coleccion && <span className="chip-suave">{coleccion}</span>}
            {temporada && <span className="chip-suave">{temporada}</span>}
          </div>

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Color: <span className="normal-case tracking-normal text-on-surface">{nombreColor}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {colores.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={cx(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                    colorSel === c.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110',
                  )}
                  title={c.nombre}
                  onClick={() => elegirColor(c.id)}
                >
                  <span
                    className={cx(
                      'block h-9 w-9 rounded-full',
                      esColorClaro(c.color) ? 'border border-outline' : 'border border-outline-variant',
                    )}
                    style={{ backgroundColor: c.color }}
                  ></span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Talla: <span className="normal-case tracking-normal text-on-surface">{nombreTalla}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tallas.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={cx(
                    'relative min-w-12 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                    tallaSel === t.id
                      ? 'border-primary bg-primary text-on-primary'
                      : t.stock > 0
                        ? 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary'
                        : 'border-outline-variant bg-surface-container-low text-on-surface-variant line-through',
                  )}
                  disabled={!t.variante}
                  title={!t.variante ? 'No existe en este color' : t.stock === 0 ? 'Sin stock en esta sucursal' : ''}
                  onClick={() => elegirTalla(t)}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-on-surface-variant">
              Las tallas tachadas no tienen stock en tu sucursal; mira la disponibilidad más abajo.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-outline-variant">
              <button
                type="button"
                className="px-3 py-2.5 text-on-surface-variant hover:text-primary disabled:opacity-40"
                disabled={cantidad <= 1}
                onClick={() => cambiarCantidad(-1)}
                aria-label="Menos"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
              <button
                type="button"
                className="px-3 py-2.5 text-on-surface-variant hover:text-primary disabled:opacity-40"
                disabled={cantidad >= maxCantidad}
                onClick={() => cambiarCantidad(1)}
                aria-label="Más"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <button
              type="button"
              className="btn-primario flex-1 py-3"
              disabled={maxCantidad === 0}
              onClick={agregarAlCarrito}
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              {maxCantidad === 0 ? 'Sin stock aquí' : 'Agregar al carrito'}
            </button>
            <button type="button" className="btn-secundario flex-1 py-3" disabled={maxCantidad === 0} onClick={reservar}>
              <span className="material-symbols-outlined text-[20px]">event</span>
              Reservar para probar
            </button>
          </div>

          <button type="button" className="btn-secundario mt-3 w-full border-dashed" onClick={() => setPanelRA(!panelRA)}>
            <span className="material-symbols-outlined text-[20px] text-primary">view_in_ar</span>
            Probar con realidad aumentada
            <span className={cx('material-symbols-outlined text-[18px] transition-transform', panelRA && 'rotate-180')}>
              expand_more
            </span>
          </button>
          {panelRA && (
            <div className="mt-3 flex items-center gap-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex h-[140px] w-[140px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                <img src={urlQR} alt="Código QR del producto" className="h-full w-full" />
              </div>
              <div>
                <p className="font-semibold text-on-surface">Escanea con la app móvil para probártelo</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  El vestidor virtual usa la cámara de tu celular para mostrarte cómo te queda esta prenda.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-on-surface">Disponibilidad por sucursal</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Para {g.nombre} en {nombreColor}, talla {nombreTalla}. El precio puede variar según la tienda.
        </p>
        <div className="tabla mt-4 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
          <table>
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ciudad</th>
                <th className="text-center">Stock</th>
                <th className="text-right">Precio</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {disponibilidad.length > 0 ? (
                disponibilidad.map((fila) => (
                  <tr key={fila.sucursal.id} className={fila.activa ? 'bg-surface-container' : undefined}>
                    <td className="font-semibold">
                      {fila.sucursal.nombre}{' '}
                      {fila.activa && <span className="ml-1 text-[11px] font-medium text-primary">(tu sucursal)</span>}
                      <p className="text-xs font-normal text-on-surface-variant">{fila.sucursal.ubicacion}</p>
                    </td>
                    <td className="text-on-surface-variant">{fila.ciudad}</td>
                    <td className="text-center">
                      {fila.cantidad > 10 ? (
                        <span className="chip bg-success/10 text-success">Disponible</span>
                      ) : fila.cantidad > 0 ? (
                        <span className="chip bg-warning/10 text-warning">Últimas {fila.cantidad}</span>
                      ) : (
                        <span className="chip-suave">Agotado</span>
                      )}
                    </td>
                    <td className="text-right font-semibold tabular-nums">{monedaBs(fila.precio)}</td>
                    <td className="text-right">
                      {!fila.activa && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary hover:underline"
                          onClick={() => elegirSucursal(fila.sucursal)}
                        >
                          Elegir
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">
                    Esta combinación todavía no tiene stock cargado en ninguna sucursal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-on-surface">También te puede gustar</h2>
            <Link
              to={conQuery('/catalogo', { categoria: g.categoria_id })}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ver más
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {relacionados.map((r) => (
              <TarjetaProducto key={r.clave} grupo={r} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
