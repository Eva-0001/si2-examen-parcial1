import { lazy } from 'react'

export const Login = lazy(() => import('@/features/auth/pages/Login'))
export const Registro = lazy(() => import('@/features/auth/pages/Registro'))

export const Inicio = lazy(() => import('@/features/inicio/pages/Inicio'))
export const Catalogo = lazy(() => import('@/features/catalogo/pages/Catalogo'))
export const FichaProducto = lazy(() => import('@/features/catalogo/pages/FichaProducto'))
export const PromocionesPublica = lazy(() => import('@/features/promociones/pages/PromocionesPublica'))
export const SucursalesPublica = lazy(() => import('@/features/sucursales/pages/SucursalesPublica'))

export const Checkout = lazy(() => import('@/features/checkout/pages/Checkout'))
export const CompraExitosa = lazy(() => import('@/features/checkout/pages/CompraExitosa'))
export const MisPedidos = lazy(() => import('@/features/pedidos/pages/MisPedidos'))
export const DetallePedido = lazy(() => import('@/features/pedidos/pages/DetallePedido'))
export const MisReservas = lazy(() => import('@/features/reservas/pages/MisReservas'))
export const NuevaReserva = lazy(() => import('@/features/reservas/pages/NuevaReserva'))
export const MiPerfil = lazy(() => import('@/features/perfil/pages/MiPerfil'))

export const Catalogos = lazy(() => import('@/features/catalogos/pages/Catalogos'))
export const Roles = lazy(() => import('@/features/roles/pages/Roles'))
export const Usuarios = lazy(() => import('@/features/usuarios/pages/Usuarios'))
export const Trabajadores = lazy(() => import('@/features/trabajadores/pages/Trabajadores'))
export const TrabajadorForm = lazy(() => import('@/features/trabajadores/pages/TrabajadorForm'))
export const Proveedores = lazy(() => import('@/features/proveedores/pages/Proveedores'))
export const Ciudades = lazy(() => import('@/features/ciudades/pages/Ciudades'))
export const SucursalesAdmin = lazy(() => import('@/features/sucursales/pages/SucursalesAdmin'))
export const SucursalForm = lazy(() => import('@/features/sucursales/pages/SucursalForm'))

export const ProductosAdmin = lazy(() => import('@/features/productos/pages/ProductosAdmin'))
export const MisProductos = lazy(() => import('@/features/productos/pages/MisProductos'))
export const ProductoForm = lazy(() => import('@/features/productos/pages/ProductoForm'))
export const InventarioGlobal = lazy(() => import('@/features/inventario/pages/InventarioGlobal'))
export const StockSucursal = lazy(() => import('@/features/inventario/pages/StockSucursal'))

export const PromocionesAdmin = lazy(() => import('@/features/promociones/pages/PromocionesAdmin'))
export const PromocionForm = lazy(() => import('@/features/promociones/pages/PromocionForm'))

export const VentasAdmin = lazy(() => import('@/features/ventas/pages/VentasAdmin'))
export const VentaDetalleAdmin = lazy(() => import('@/features/ventas/pages/VentaDetalleAdmin'))
export const VentasSucursal = lazy(() => import('@/features/ventas/pages/VentasSucursal'))
export const Comprobantes = lazy(() => import('@/features/ventas/pages/Comprobantes'))

export const PuntoVenta = lazy(() => import('@/features/pos/pages/PuntoVenta'))
export const ComprobanteTicket = lazy(() => import('@/features/pos/pages/ComprobanteTicket'))

export const Tablero = lazy(() => import('@/features/tablero/pages/Tablero'))
export const Bitacora = lazy(() => import('@/features/bitacora/pages/Bitacora'))
export const ReportesVoz = lazy(() => import('@/features/reportes/pages/ReportesVoz'))
export const ReservasSucursal = lazy(() => import('@/features/reservas/pages/ReservasSucursal'))
