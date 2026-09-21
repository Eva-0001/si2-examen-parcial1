import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useCarrito, useCarritoStore } from '@/core/stores/carrito.store'
import { resumenItems } from '@/core/stores/lista-items'
import { useAuthStore } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import { ventasService } from '@/features/ventas/services/ventas.service'
import { catalogoService } from '@/features/catalogo/services/catalogo.service'
import { pagosService } from '../services/pagos.service'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { cx } from '@/shared/utils/clases'

const PASOS = [
  { n: 1, titulo: 'Resumen' },
  { n: 2, titulo: 'Pago' },
  { n: 3, titulo: 'Confirmación' },
]

const refrescarCatalogo = () => catalogoService.refrescar().catch(() => {})

export default function Checkout() {
  const carrito = useCarrito()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [inicio] = useState(() => {
    const items = useCarritoStore.getState().items
    return {
      vacio: items.length === 0,
      mezclado: resumenItems(items).mezclado,
      secreto: searchParams.get('payment_intent_client_secret'),
    }
  })
  const retomando = !inicio.vacio && !inicio.mezclado && !!inicio.secreto

  const [stripeHabilitado] = useState(() => pagosService.habilitado)
  const [paso, setPaso] = useState(retomando ? 3 : 1)
  const [pagando, setPagando] = useState(retomando)
  const [errorPago, setErrorPago] = useState(null)
  const [qrConfirmado, setQrConfirmado] = useState(false)

  const [intencion, setIntencion] = useState(null)
  const [preparandoPago, setPreparandoPago] = useState(false)
  const [errorIntencion, setErrorIntencion] = useState(null)
  const [metodoListo, setMetodoListo] = useState(false)
  const [marcaQR] = useState(() => Date.now())

  const contenedorPagoRef = useRef(null)
  const stripeRef = useRef(null)
  const elementsRef = useRef(null)
  const elementoPagoRef = useRef(null)
  const montadoRef = useRef(null)
  const firmaUsadaRef = useRef(null)
  const iniciadoRef = useRef(false)

  const firmaCarrito = carrito.items.map((i) => `${i.producto_sucursal_id}x${i.cantidad}`).join('|')

  const pagoListo = stripeHabilitado ? !!intencion && metodoListo : qrConfirmado

  const urlQR = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(
    `FashionStore|pago|Bs ${carrito.total.toFixed(2)}|${marcaQR}`,
  )}`

  const destruirElemento = () => {
    elementoPagoRef.current?.destroy()
    elementoPagoRef.current = null
    elementsRef.current = null
    montadoRef.current = null
    firmaUsadaRef.current = null
  }

  const desmontarPago = () => {
    destruirElemento()
    setMetodoListo(false)
    setIntencion(null)
  }

  const montarPago = async (nodo, datos) => {
    if (montadoRef.current === datos.client_secret) return

    const stripe = await pagosService.stripe()
    if (!stripe) {
      setErrorIntencion('No pudimos cargar la pasarela de pago. Revisa tu conexión.')
      return
    }

    stripeRef.current = stripe
    elementsRef.current = stripe.elements({
      clientSecret: datos.client_secret,
      appearance: {
        theme: 'stripe',
        variables: { fontFamily: 'Inter, system-ui, sans-serif', borderRadius: '8px' },
      },
    })

    elementoPagoRef.current = elementsRef.current.create('payment', {
      layout: 'tabs',
      wallets: { applePay: 'never', googlePay: 'never' },
    })
    elementoPagoRef.current.on('change', (evento) => setMetodoListo(evento.complete))
    elementoPagoRef.current.mount(nodo)
    montadoRef.current = datos.client_secret
  }

  const sincronizarIntencion = () => {
    if (!stripeHabilitado) return

    const firma = firmaCarrito
    if (intencion && firmaUsadaRef.current === firma) return

    const items = useCarritoStore.getState().items
    if (items.length === 0) return

    desmontarPago()
    setPreparandoPago(true)
    setErrorIntencion(null)

    pagosService
      .crearIntencion(items.map((i) => ({ producto_sucursal_id: i.producto_sucursal_id, cantidad: i.cantidad })))
      .then((nueva) => {
        firmaUsadaRef.current = firma
        setIntencion(nueva)
        setPreparandoPago(false)
      })
      .catch((e) => {
        setPreparandoPago(false)
        setErrorIntencion(e.message)
        if (e.status === 409) refrescarCatalogo()
      })
  }

  const mensajeDeError = (e, pagoId) => {
    if (e.status === 409 && pagoId) {
      return `${e.message} El cobro de prueba quedó hecho pero la venta no se registró: avisa al comercio con el código ${pagoId}.`
    }
    if (e.status === 409) {
      return `${e.message}. Ajusta las cantidades en el carrito e intenta de nuevo.`
    }
    return e.message
  }

  const registrarVenta = (pagoId) => {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) return

    ventasService
      .crear({
        tipo_venta: 'virtual',
        usuario_id: usuario.id,
        detalles: useCarritoStore
          .getState()
          .items.map((i) => ({ producto_sucursal_id: i.producto_sucursal_id, cantidad: i.cantidad })),
        ...(pagoId ? { pago_id: pagoId } : {}),
      })
      .then((venta) => {
        desmontarPago()
        useCarritoStore.getState().vaciar()
        refrescarCatalogo()
        navigate(`/compra-exitosa/${venta.id}`)
      })
      .catch((e) => {
        setPagando(false)
        setErrorPago(mensajeDeError(e, pagoId))
        if (e.status === 409) refrescarCatalogo()
      })
  }

  const resolverRetorno = async (clientSecret) => {
    const stripe = await pagosService.stripe()
    if (!stripe) {
      setPagando(false)
      setErrorPago('No pudimos cargar la pasarela para confirmar el pago.')
      return
    }

    const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret)

    if (error || !paymentIntent) {
      setPagando(false)
      setErrorPago(error?.message ?? 'No pudimos recuperar el estado del pago.')
      return
    }

    if (paymentIntent.status === 'succeeded') {
      registrarVenta(paymentIntent.id)
      return
    }

    setPagando(false)
    setPaso(2)
    setErrorPago(
      paymentIntent.status === 'requires_payment_method'
        ? 'El pago no se completó. Elige un método e intenta de nuevo.'
        : `El pago quedó en estado "${paymentIntent.status}". No se registró la compra.`,
    )
    sincronizarIntencion()
  }

  useEffect(() => {
    if (iniciadoRef.current) return
    iniciadoRef.current = true

    if (inicio.vacio) {
      toast.info('Tu carrito está vacío.')
      navigate('/catalogo')
    } else if (inicio.mezclado) {
      toast.advertencia('Todos los productos deben ser de la misma sucursal.')
      useCarritoStore.getState().abrir()
      navigate('/catalogo')
    } else if (inicio.secreto) {
      const secreto = inicio.secreto
      Promise.resolve().then(() => resolverRetorno(secreto))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const nodo = contenedorPagoRef.current
    if (!nodo || !intencion) return
    montarPago(nodo, intencion)
  }, [intencion])

  useEffect(() => {
    const elemento = elementoPagoRef
    return () => elemento.current?.destroy()
  }, [])

  const irA = (p) => {
    if (p < paso) setPaso(p)
  }

  const siguiente = () => {
    if (paso === 1) {
      setPaso(2)
      sincronizarIntencion()
      return
    }
    if (paso === 2) {
      if (!pagoListo) return
      setPaso(3)
    }
  }

  const pagar = async () => {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || carrito.items.length === 0 || carrito.mezclado || !pagoListo) return

    setPagando(true)
    setErrorPago(null)

    if (!stripeHabilitado) {
      registrarVenta(null)
      return
    }

    const stripe = stripeRef.current
    const elements = elementsRef.current
    if (!stripe || !elements || !intencion) {
      setPagando(false)
      setErrorPago('La pasarela no está lista. Vuelve al paso de pago e intenta de nuevo.')
      return
    }

    const resultado = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout` },
      redirect: 'if_required',
    })

    if (resultado.error) {
      setPagando(false)
      setErrorPago(resultado.error.message ?? 'El pago fue rechazado.')
      return
    }

    if (resultado.paymentIntent?.status !== 'succeeded') {
      setPagando(false)
      setErrorPago(`El pago quedó en estado "${resultado.paymentIntent?.status}". No se registró la compra.`)
      return
    }

    registrarVenta(intencion.pago_id)
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-2xl font-semibold text-on-surface">Finalizar compra</h1>

      <ol className="mt-6 flex items-center gap-2">
        {PASOS.map((p, i) => (
          <Fragment key={p.n}>
            <li className="flex items-center gap-2">
              <button
                type="button"
                className={cx(
                  'flex items-center gap-2 text-sm font-semibold',
                  paso >= p.n ? 'text-on-surface' : 'text-on-surface-variant',
                )}
                disabled={p.n >= paso}
                onClick={() => irA(p.n)}
              >
                <span
                  className={cx(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    paso > p.n
                      ? 'bg-success text-white'
                      : paso === p.n
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-on-surface-variant',
                  )}
                >
                  {paso > p.n ? <span className="material-symbols-outlined text-[18px]">check</span> : p.n}
                </span>
                <span className="hidden sm:inline">{p.titulo}</span>
              </button>
            </li>
            {i < PASOS.length - 1 && <li className="h-px w-10 flex-1 bg-outline-variant sm:w-16" aria-hidden="true"></li>}
          </Fragment>
        ))}
      </ol>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7">
          {paso === 1 && (
            <div className="tarjeta">
              <h2 className="text-lg font-semibold text-on-surface">Resumen del pedido</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Revisa las prendas y la sucursal donde las vas a retirar.</p>
              <ul className="mt-5 divide-y divide-outline-variant">
                {carrito.items.map((item) => (
                  <li key={item.producto_sucursal_id} className="flex items-center gap-3 py-3">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      {item.foto && <img src={item.foto} alt={item.nombre} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.nombre}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.color} · Talla {item.talla} · x{item.cantidad}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{monedaBs(item.precio * item.cantidad)}</p>
                  </li>
                ))}
              </ul>
              {carrito.sucursal && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-surface-container p-3 text-sm">
                  <span className="material-symbols-outlined text-primary">store</span>
                  <div>
                    <p className="font-semibold text-on-surface">Retiro en {carrito.sucursal.nombre}</p>
                    <p className="text-xs text-on-surface-variant">Te avisamos cuando el pedido esté listo para retirar.</p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={carrito.abrir}>
                  Editar carrito
                </button>
                <button type="button" className="btn-primario" onClick={siguiente}>
                  Continuar al pago <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          <div className="tarjeta" hidden={paso !== 2}>
            <h2 className="text-lg font-semibold text-on-surface">Método de pago</h2>

            {stripeHabilitado && (
              <>
                
                <div className="mt-5">
                  {preparandoPago && (
                    <div className="flex items-center gap-2 rounded-xl border border-outline-variant p-6 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      Preparando el pago seguro...
                    </div>
                  )}

                  {errorIntencion && (
                    <div className="rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
                      <p>
                        <span className="font-semibold text-error">No pudimos preparar el pago.</span> {errorIntencion}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-sm font-semibold text-primary hover:underline"
                        onClick={sincronizarIntencion}
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  <div ref={contenedorPagoRef} hidden={!intencion}></div>

                  {intencion && (
                    <p className="mt-3 flex items-start gap-1 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      <span>
                        Se cobran {monedaBs(carrito.total)} ({(intencion.monto / 100).toFixed(2)}{' '}
                        {intencion.moneda.toUpperCase()})
                      </span>
                    </p>
                  )}
                </div>
              </>
            )}

            {!stripeHabilitado && (
              <>
                <p className="mt-1 text-sm text-on-surface-variant">La pasarela no está configurada: el pago queda simulado.</p>
                <div className="mt-5 flex flex-col items-center gap-4 rounded-xl border border-outline-variant p-6 text-center sm:flex-row sm:text-left">
                  <div className="flex h-[160px] w-[160px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-card">
                    <img src={urlQR} alt="QR de pago" className="h-full w-full" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">Escanea y paga {monedaBs(carrito.total)}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      En el entorno de prueba, confirma el pago con el botón.
                    </p>
                    <button
                      type="button"
                      className={cx('mt-4', qrConfirmado ? 'btn-secundario' : 'btn-primario')}
                      onClick={() => setQrConfirmado(true)}
                    >
                      <span className="material-symbols-outlined text-[18px]">{qrConfirmado ? 'check_circle' : 'task_alt'}</span>
                      {qrConfirmado ? 'Pago confirmado' : 'Simular pago confirmado'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button type="button" className="btn-secundario" onClick={() => irA(1)}>
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver
              </button>
              <button type="button" className="btn-primario" disabled={!pagoListo} onClick={siguiente}>
                Revisar y confirmar <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {paso === 3 && (
            <div className="tarjeta">
              <h2 className="text-lg font-semibold text-on-surface">Confirmación</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Última revisión antes de cobrar y registrar la compra.</p>

              {errorPago && (
                <div className="mt-4 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
                  <span className="font-semibold text-error">No pudimos completar la compra.</span> {errorPago}
                </div>
              )}

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
                  <dt className="text-on-surface-variant">Productos</dt>
                  <dd className="font-semibold">
                    {carrito.cantidadTotal} {carrito.cantidadTotal === 1 ? 'unidad' : 'unidades'}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
                  <dt className="text-on-surface-variant">Retiro</dt>
                  <dd className="font-semibold">{carrito.sucursal?.nombre}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
                  <dt className="text-on-surface-variant">Pago</dt>
                  <dd className="font-semibold">{stripeHabilitado ? 'Stripe (modo prueba)' : 'QR bancario (simulado)'}</dd>
                </div>
              </dl>

              <div className="mt-6 flex items-center justify-between">
                <button type="button" className="btn-secundario" disabled={pagando} onClick={() => irA(2)}>
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver
                </button>
                <button type="button" className="btn-primario px-6 py-3 text-base" disabled={pagando} onClick={pagar}>
                  {pagando ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Procesando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">lock</span> Pagar {monedaBs(carrito.total)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-5">
          <div className="tarjeta lg:sticky lg:top-24">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Tu pedido</h3>
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
              {carrito.items.map((item) => (
                <li key={item.producto_sucursal_id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-on-surface">
                    {item.cantidad} × {item.nombre} <span className="text-on-surface-variant">({item.talla})</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{monedaBs(item.precio * item.cantidad)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-outline-variant pt-3 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{monedaBs(carrito.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <dt>Retiro en sucursal</dt>
                <dd>Sin costo</dd>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 text-base font-bold text-on-surface">
                <dt>Total</dt>
                <dd className="tabular-nums">{monedaBs(carrito.total)}</dd>
              </div>
            </dl>
            {carrito.sucursal && (
              <p className="mt-3 flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">store</span>
                {carrito.sucursal.nombre}
              </p>
            )}
            <Link to="/catalogo" className="mt-4 block text-center text-xs font-semibold text-primary hover:underline">
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
