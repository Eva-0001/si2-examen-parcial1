import { createBrowserRouter } from 'react-router'
import { InicioPanel, RequireAuth, RequireRol, SoloInvitado } from './guards/guards'
import Raiz from './Raiz'
import {
  Bitacora,
  Catalogo,
  Catalogos,
  Checkout,
  Ciudades,
  CompraExitosa,
  ComprobanteTicket,
  Comprobantes,
  DetallePedido,
  FichaProducto,
  Inicio,
  InventarioGlobal,
  Login,
  MiPerfil,
  MisProductos,
  MisPedidos,
  MisReservas,
  NuevaReserva,
  ProductoForm,
  ProductosAdmin,
  PromocionesAdmin,
  PromocionesPublica,
  PromocionForm,
  PuntoVenta,
  Proveedores,
  Registro,
  ReportesVoz,
  ReservasSucursal,
  Roles,
  SucursalesAdmin,
  SucursalesPublica,
  StockSucursal,
  SucursalForm,
  Tablero,
  TrabajadorForm,
  Trabajadores,
  Usuarios,
  VentaDetalleAdmin,
  VentasAdmin,
  VentasSucursal,
} from './paginas'
import LayoutTienda from '@/layouts/LayoutTienda'
import LayoutPanel from '@/layouts/LayoutPanel'
import NoEncontrado from '@/shared/pages/NoEncontrado'
import SinPermiso from '@/shared/pages/SinPermiso'
import ErrorConexion from '@/shared/pages/ErrorConexion'


const conRol = (roles, elemento) => <RequireRol roles={roles}>{elemento}</RequireRol>

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      {
        path: '/',
        element: <LayoutTienda />,
        children: [
          { index: true, element: <Inicio /> },
          { path: 'catalogo', element: <Catalogo /> },
          { path: 'producto/:id', element: <FichaProducto /> },
          { path: 'promociones', element: <PromocionesPublica /> },
          { path: 'sucursales', element: <SucursalesPublica /> },
          {
            element: <RequireAuth />,
            children: [
              { path: 'checkout', element: <Checkout /> },
              { path: 'compra-exitosa/:id', element: <CompraExitosa /> },
              { path: 'pedidos', element: <MisPedidos /> },
              { path: 'pedidos/:id', element: <DetallePedido /> },
              { path: 'reservas', element: <MisReservas /> },
              { path: 'reservas/nueva', element: <NuevaReserva /> },
              { path: 'perfil', element: <MiPerfil /> },
            ],
          },
        ],
      },

      {
        path: 'panel',
        element: (
          <RequireAuth>
            <RequireRol roles={['administrador', 'encargado', 'cajero', 'proveedor']}>
              <LayoutPanel />
            </RequireRol>
          </RequireAuth>
        ),
        children: [
          { index: true, element: <InicioPanel><Tablero /></InicioPanel> },
          { path: 'bitacora', element: conRol(['administrador'], <Bitacora />) },
          { path: 'reportes', element: conRol(['administrador', 'encargado', 'cajero'], <ReportesVoz />) },

          { path: 'catalogos', element: conRol(['administrador'], <Catalogos />) },
          { path: 'roles', element: conRol(['administrador'], <Roles />) },
          { path: 'usuarios', element: conRol(['administrador'], <Usuarios />) },
          {
            path: 'trabajadores',
            element: <RequireRol roles={['administrador']} />,
            children: [
              { index: true, element: <Trabajadores /> },
              { path: 'nuevo', element: <TrabajadorForm /> },
              { path: ':id/editar', element: <TrabajadorForm /> },
            ],
          },
          { path: 'proveedores', element: conRol(['administrador'], <Proveedores />) },
          { path: 'ciudades', element: conRol(['administrador'], <Ciudades />) },
          {
            path: 'sucursales',
            element: <RequireRol roles={['administrador']} />,
            children: [
              { index: true, element: <SucursalesAdmin /> },
              { path: 'nueva', element: <SucursalForm /> },
              { path: ':id/editar', element: <SucursalForm /> },
            ],
          },

          {
            path: 'productos',
            element: <RequireRol roles={['administrador']} />,
            children: [
              { index: true, element: <ProductosAdmin /> },
              { path: 'nuevo', element: <ProductoForm /> },
              { path: ':id/editar', element: <ProductoForm /> },
            ],
          },
          {
            path: 'mis-productos',
            element: <RequireRol roles={['proveedor', 'administrador']} />,
            children: [
              { index: true, element: <MisProductos /> },
              { path: 'nuevo', element: <ProductoForm /> },
              { path: ':id/editar', element: <ProductoForm /> },
            ],
          },
          { path: 'inventario', element: conRol(['administrador'], <InventarioGlobal />) },
          { path: 'stock', element: conRol(['encargado', 'administrador'], <StockSucursal />) },

          {
            path: 'promociones',
            element: <RequireRol roles={['administrador']} />,
            children: [
              { index: true, element: <PromocionesAdmin /> },
              { path: 'nueva', element: <PromocionForm /> },
              { path: ':id/editar', element: <PromocionForm /> },
            ],
          },

          {
            path: 'ventas',
            element: <RequireRol roles={['administrador']} />,
            children: [
              { index: true, element: <VentasAdmin /> },
              { path: ':id', element: <VentaDetalleAdmin /> },
            ],
          },
          { path: 'ventas-sucursal', element: conRol(['encargado', 'administrador'], <VentasSucursal />) },
          { path: 'comprobantes', element: conRol(['administrador', 'encargado', 'cajero'], <Comprobantes />) },

          {
            path: 'pos',
            element: <RequireRol roles={['cajero', 'administrador']} />,
            children: [
              { index: true, element: <PuntoVenta /> },
              { path: 'comprobante/:id', element: <ComprobanteTicket /> },
            ],
          },

          { path: 'reservas-sucursal', element: conRol(['encargado', 'administrador'], <ReservasSucursal />) },

          { path: '*', element: <NoEncontrado /> },
        ],
      },

      {
        path: 'login',
        element: (
          <SoloInvitado>
            <Login />
          </SoloInvitado>
        ),
      },
      {
        path: 'registro',
        element: (
          <SoloInvitado>
            <Registro />
          </SoloInvitado>
        ),
      },

      { path: 'sin-permiso', element: <SinPermiso /> },
      { path: 'error-conexion', element: <ErrorConexion /> },
      { path: '*', element: <NoEncontrado /> },
    ],
  },
])
