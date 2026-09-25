import type { DataSource, EntityManager } from 'typeorm';
import { Genero } from '../../commons/enums/genero.enum.js';
import {
  ROLES_DEL_SISTEMA,
  Rol as NombreDeRol,
} from '../../commons/enums/rol.enum.js';
import { hashearPassword } from '../../commons/passwords.js';
import { TipoVenta } from '../../commons/enums/tipo-venta.enum.js';
import { dataSourceDeConsola } from '../../config/data-source.js';
import { Bitacora } from '../../entities/bitacora.entity.js';
import { Categoria } from '../../entities/categoria.entity.js';
import { Ciudad } from '../../entities/ciudad.entity.js';
import { Coleccion } from '../../entities/coleccion.entity.js';
import { Color } from '../../entities/color.entity.js';
import { Comprobante } from '../../entities/comprobante.entity.js';
import { DetalleVenta } from '../../entities/detalle-venta.entity.js';
import { ProductoSucursal } from '../../entities/producto-sucursal.entity.js';
import { Producto } from '../../entities/producto.entity.js';
import { Promocion } from '../../entities/promocion.entity.js';
import { Proveedor } from '../../entities/proveedor.entity.js';
import { Reserva } from '../../entities/reserva.entity.js';
import { ReservaSucursal } from '../../entities/reserva-sucursal.entity.js';
import { Rol } from '../../entities/rol.entity.js';
import { Sucursal } from '../../entities/sucursal.entity.js';
import { Talla } from '../../entities/talla.entity.js';
import { Temporada } from '../../entities/temporada.entity.js';
import { Trabajador } from '../../entities/trabajador.entity.js';
import { Usuario } from '../../entities/usuario.entity.js';
import { Venta } from '../../entities/venta.entity.js';
import {
  CATEGORIAS,
  CIUDADES,
  COLECCIONES,
  COLORES,
  PROMOCIONES,
  PROVEEDORES,
  SUCURSALES,
  TALLAS,
  TEMPORADAS,
} from './datos/catalogos.datos.js';
import {
  CLIENTES,
  PERSONAL,
  type DatosUsuario,
} from './datos/personas.datos.js';
import { DISENOS } from './datos/productos.datos.js';
import { copiarImagenesDeSeed } from './imagenes.js';
import {
  asegurar,
  asegurarPorNombre,
  comoFecha,
  comoHora,
  comoMonto,
  elegir,
  elegirVarios,
  entero,
  generador,
  idDe,
  sumarDias,
} from './utiles.js';

const SEMILLA = 20260920;
const DIAS_DE_HISTORIA = 120;
const VENTAS_A_GENERAR = 60;
const RESERVAS_A_GENERAR = 16;

/** Stock en memoria: se va descontando al generar ventas y reservas. */
interface FilaDeStock {
  id: number;
  productoId: number;
  producto: string;
  sucursalId: number;
  sucursal: string;
  precio: number;
  cantidad: number;
  reservada: number;
}

// --------------------------------------------------------------------------
// Base: roles y administrador. Corre siempre, en cada arranque.
// --------------------------------------------------------------------------

async function sembrarRoles(manager: EntityManager): Promise<Map<string, number>> {
  return asegurarPorNombre(manager, Rol, ROLES_DEL_SISTEMA);
}

async function sembrarAdministrador(
  manager: EntityManager,
  roles: Map<string, number>,
): Promise<void> {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const usuarios = manager.getRepository(Usuario);

  if (await usuarios.findOne({ where: { username } })) {
    console.log(`administrador '${username}': ya existe`);
    return;
  }

  await usuarios.save(
    usuarios.create({
      nombre: 'Admin',
      apellido: 'Sistema',
      correo: process.env.ADMIN_CORREO || 'admin@tienda.com',
      username,
      password: await hashearPassword(process.env.ADMIN_PASSWORD || 'admin123'),
      genero: Genero.MASCULINO,
      rol_id: idDe(roles, NombreDeRol.ADMINISTRADOR),
      tipo: 'usuario',
    }),
  );

  console.log(`administrador '${username}': creado`);
}

// --------------------------------------------------------------------------
// Catalogos
// --------------------------------------------------------------------------

interface Catalogos {
  ciudades: Map<string, number>;
  categorias: Map<string, number>;
  colecciones: Map<string, number>;
  colores: Map<string, number>;
  tallas: Map<string, number>;
  temporadas: Map<string, number>;
  proveedores: Map<string, number>;
}

async function sembrarCatalogos(manager: EntityManager): Promise<Catalogos> {
  const colecciones = new Map<string, number>();
  for (const coleccion of COLECCIONES) {
    const fila = await asegurar(
      manager,
      Coleccion,
      { nombre: coleccion.nombre },
      coleccion,
    );
    colecciones.set(coleccion.nombre, fila.id);
  }

  const proveedores = new Map<string, number>();
  for (const proveedor of PROVEEDORES) {
    const fila = await asegurar(
      manager,
      Proveedor,
      { nombre: proveedor.nombre },
      proveedor,
    );
    proveedores.set(proveedor.nombre, fila.id);
  }

  const catalogos: Catalogos = {
    ciudades: await asegurarPorNombre(manager, Ciudad, CIUDADES),
    categorias: await asegurarPorNombre(manager, Categoria, CATEGORIAS),
    colores: await asegurarPorNombre(manager, Color, COLORES),
    tallas: await asegurarPorNombre(manager, Talla, TALLAS),
    temporadas: await asegurarPorNombre(manager, Temporada, TEMPORADAS),
    colecciones,
    proveedores,
  };

  console.log(
    `catalogos: ${CIUDADES.length} ciudades, ${CATEGORIAS.length} categorias, ` +
      `${COLECCIONES.length} colecciones, ${COLORES.length} colores, ` +
      `${TALLAS.length} tallas, ${TEMPORADAS.length} temporadas, ` +
      `${PROVEEDORES.length} proveedores`,
  );

  return catalogos;
}

async function sembrarSucursales(
  manager: EntityManager,
  ciudades: Map<string, number>,
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();

  for (const sucursal of SUCURSALES) {
    const fila = await asegurar(
      manager,
      Sucursal,
      { nombre: sucursal.nombre },
      {
        nombre: sucursal.nombre,
        ubicacion: sucursal.ubicacion,
        ciudad_id: idDe(ciudades, sucursal.ciudad),
      },
    );
    mapa.set(sucursal.nombre, fila.id);
  }

  console.log(`sucursales: ${mapa.size}`);
  return mapa;
}

// --------------------------------------------------------------------------
// Usuarios, personal y clientes
// --------------------------------------------------------------------------

async function sembrarPersonas(
  manager: EntityManager,
  roles: Map<string, number>,
  sucursales: Map<string, number>,
): Promise<{ personal: Usuario[]; clientes: Usuario[] }> {
  const password = await hashearPassword(process.env.SEED_PASSWORD || 'demo1234');
  const hoy = new Date();

  const crear = async (datos: DatosUsuario): Promise<Usuario> => {
    const usuario = await asegurar(
      manager,
      Usuario,
      { username: datos.username },
      {
        nombre: datos.nombre,
        apellido: datos.apellido,
        correo: datos.correo,
        username: datos.username,
        password,
        genero: datos.genero,
        rol_id: idDe(roles, datos.rol),
        tipo: datos.trabajador ? 'trabajador' : 'usuario',
      },
    );

    if (datos.trabajador) {
      await asegurar(
        manager,
        Trabajador,
        { id: usuario.id },
        {
          id: usuario.id,
          codigo: datos.trabajador.codigo,
          fecha_contrato: comoFecha(
            sumarDias(hoy, -datos.trabajador.antiguedadDias),
          ),
          sueldo: comoMonto(datos.trabajador.sueldo),
          sucursal_id: idDe(sucursales, datos.trabajador.sucursal),
        },
      );
    }

    return usuario;
  };

  const personal: Usuario[] = [];
  for (const datos of PERSONAL) personal.push(await crear(datos));

  const clientes: Usuario[] = [];
  for (const datos of CLIENTES) clientes.push(await crear(datos));

  console.log(
    `usuarios: ${personal.length} del personal, ${clientes.length} clientes ` +
      `(password: ${process.env.SEED_PASSWORD || 'demo1234'})`,
  );

  return { personal, clientes };
}

// --------------------------------------------------------------------------
// Productos y stock
// --------------------------------------------------------------------------

async function sembrarProductos(
  manager: EntityManager,
  catalogos: Catalogos,
  imagenes: Map<string, string>,
): Promise<{ id: number; nombre: string; precio: number }[]> {
  const repo = manager.getRepository(Producto);
  const productos: { id: number; nombre: string; precio: number }[] = [];
  let sinFoto = 0;

  for (const diseno of DISENOS) {
    const foto = imagenes.get(diseno.archivo) ?? null;
    if (!foto) sinFoto++;

    for (const talla of diseno.tallas) {
      const nombre = `${diseno.base} - Talla ${talla}`;

      let producto = await repo.findOne({ where: { nombre } });
      if (!producto) {
        producto = await repo.save(
          repo.create({
            nombre,
            foto,
            precio: comoMonto(diseno.precio),
            categoria_id: idDe(catalogos.categorias, diseno.categoria),
            coleccion_id: idDe(catalogos.colecciones, diseno.coleccion),
            color_id: idDe(catalogos.colores, diseno.color),
            talla_id: idDe(catalogos.tallas, talla),
            temporada_id: idDe(catalogos.temporadas, diseno.temporada),
            proveedor_id: idDe(catalogos.proveedores, diseno.proveedor),
          }),
        );
      }

      productos.push({ id: producto.id, nombre, precio: diseno.precio });
    }
  }

  console.log(
    `productos: ${productos.length} desde ${DISENOS.length} disenos` +
      (sinFoto ? ` (${sinFoto} disenos sin imagen en seed/)` : ''),
  );

  return productos;
}

async function sembrarStock(
  manager: EntityManager,
  productos: { id: number; nombre: string; precio: number }[],
  sucursales: Map<string, number>,
  rng: () => number,
): Promise<FilaDeStock[]> {
  const repo = manager.getRepository(ProductoSucursal);
  const nombres = [...sucursales.keys()];
  const filas: FilaDeStock[] = [];

  for (const producto of productos) {
    // Cada producto llega a 2-4 sucursales, no a todas: asi el reporte de
    // inventario y el de "por reponer" muestran diferencias reales.
    for (const sucursal of elegirVarios(rng, nombres, entero(rng, 2, 4))) {
      const sucursalId = idDe(sucursales, sucursal);
      // Ajuste de precio por plaza: +-8% sobre el precio de lista.
      const precio =
        Math.round(producto.precio * (1 + (entero(rng, -8, 8) / 100)) * 100) /
        100;

      const existente = await repo.findOne({
        where: { producto_id: producto.id, sucursal_id: sucursalId },
      });

      // Una de cada diez lineas queda casi o totalmente agotada, para que el
      // reporte "por reponer" y el aviso de sin stock tengan que mostrar algo.
      const cantidad = rng() < 0.1 ? entero(rng, 0, 3) : entero(rng, 12, 60);

      const fila =
        existente ??
        (await repo.save(
          repo.create({
            producto_id: producto.id,
            sucursal_id: sucursalId,
            cantidad,
            cantidad_reservada: 0,
            precio: comoMonto(precio),
          }),
        ));

      filas.push({
        id: fila.id,
        productoId: producto.id,
        producto: producto.nombre,
        sucursalId,
        sucursal,
        precio: Number(fila.precio),
        cantidad: fila.cantidad,
        reservada: 0,
      });
    }
  }

  console.log(`stock: ${filas.length} lineas producto/sucursal`);
  return filas;
}

async function sembrarPromociones(
  manager: EntityManager,
  sucursales: Map<string, number>,
): Promise<void> {
  const hoy = new Date();

  for (const promocion of PROMOCIONES) {
    await asegurar(
      manager,
      Promocion,
      { nombre: promocion.nombre },
      {
        nombre: promocion.nombre,
        descripcion: promocion.descripcion,
        fecha_inicio: comoFecha(sumarDias(hoy, promocion.desdeDias)),
        fecha_final: comoFecha(sumarDias(hoy, promocion.hastaDias)),
        sucursal_id: idDe(sucursales, promocion.sucursal),
      },
    );
  }

  console.log(`promociones: ${PROMOCIONES.length}`);
}

// --------------------------------------------------------------------------
// Operaciones: ventas, reservas y bitacora
// --------------------------------------------------------------------------

interface VentaSembrada {
  id: number;
  fecha: Date;
  tipo: TipoVenta;
  cajero: Usuario | null;
  lineas: { stock: FilaDeStock; cantidad: number }[];
}

async function sembrarVentas(
  manager: EntityManager,
  stock: FilaDeStock[],
  clientes: Usuario[],
  personal: Usuario[],
  rng: () => number,
): Promise<VentaSembrada[]> {
  const ventas = manager.getRepository(Venta);
  const detalles = manager.getRepository(DetalleVenta);
  const comprobantes = manager.getRepository(Comprobante);

  const cajeros = personal.filter((u) => u.tipo === 'trabajador');
  const ahora = new Date();
  const sembradas: VentaSembrada[] = [];

  for (let i = 0; i < VENTAS_A_GENERAR; i++) {
    // Mas ventas cerca de hoy que hace cuatro meses: la curva del dashboard
    // sale creciente en vez de plana.
    const antiguedad = Math.floor(DIAS_DE_HISTORIA * rng() * rng());
    const fecha = sumarDias(ahora, -antiguedad);
    fecha.setHours(entero(rng, 9, 20), entero(rng, 0, 59), entero(rng, 0, 59), 0);

    // Toda la venta sale de una sola sucursal, como en la tienda real.
    const sucursalId = elegir(rng, stock).sucursalId;
    const candidatos = stock.filter(
      (fila) => fila.sucursalId === sucursalId && fila.cantidad > 2,
    );
    if (candidatos.length === 0) continue;

    const lineas: { stock: FilaDeStock; cantidad: number }[] = [];
    for (const fila of elegirVarios(rng, candidatos, entero(rng, 1, 3))) {
      const cantidad = Math.min(entero(rng, 1, 3), fila.cantidad - 1);
      if (cantidad <= 0) continue;
      fila.cantidad -= cantidad;
      lineas.push({ stock: fila, cantidad });
    }
    if (lineas.length === 0) continue;

    const total = lineas.reduce(
      (suma, linea) => suma + linea.stock.precio * linea.cantidad,
      0,
    );
    const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
    const esVirtual = rng() < 0.55;

    const venta = await ventas.save(
      ventas.create({
        tipo_venta: esVirtual ? TipoVenta.VIRTUAL : TipoVenta.PRESENCIAL,
        total: comoMonto(total),
        usuario_id: elegir(rng, clientes).id,
        pago_id: esVirtual ? `pi_seed_${SEMILLA}_${i}` : null,
      }),
    );

    for (const linea of lineas) {
      await detalles.save(
        detalles.create({
          venta_id: venta.id,
          producto_sucursal_id: linea.stock.id,
          cantidad: linea.cantidad,
          precio: comoMonto(linea.stock.precio),
        }),
      );
    }

    const comprobante = await comprobantes.save(
      comprobantes.create({
        venta_id: venta.id,
        nombre: `${esVirtual ? 'Recibo' : 'Factura'} ${String(venta.id).padStart(6, '0')}`,
        cantidad: unidades,
        monto: comoMonto(total),
      }),
    );

    // `creada_en` y `fecha` son @CreateDateColumn: TypeORM las fija al insertar,
    // asi que la fecha historica se escribe despues.
    await manager.query('UPDATE ventas SET creada_en = $1 WHERE id = $2', [
      fecha,
      venta.id,
    ]);
    await manager.query('UPDATE comprobantes SET fecha = $1 WHERE id = $2', [
      fecha,
      comprobante.id,
    ]);

    sembradas.push({
      id: venta.id,
      fecha,
      tipo: esVirtual ? TipoVenta.VIRTUAL : TipoVenta.PRESENCIAL,
      cajero: !esVirtual && cajeros.length > 0 ? elegir(rng, cajeros) : null,
      lineas,
    });
  }

  console.log(`ventas: ${sembradas.length} con sus detalles y comprobantes`);
  return sembradas;
}

async function sembrarReservas(
  manager: EntityManager,
  stock: FilaDeStock[],
  clientes: Usuario[],
  rng: () => number,
): Promise<number> {
  const reservas = manager.getRepository(Reserva);
  const detalles = manager.getRepository(ReservaSucursal);
  const hoy = new Date();
  let creadas = 0;

  for (let i = 0; i < RESERVAS_A_GENERAR; i++) {
    // Dos tercios ya pasaron (asistio / no asistio) y el resto esta pendiente,
    // que es lo unico que mantiene stock reservado.
    const pendiente = i % 3 === 0;
    const dias = pendiente ? entero(rng, 1, 14) : -entero(rng, 1, 45);
    const fecha = sumarDias(hoy, dias);

    const sucursalId = elegir(rng, stock).sucursalId;
    const candidatos = stock.filter(
      (fila) => fila.sucursalId === sucursalId && fila.cantidad - fila.reservada > 3,
    );
    if (candidatos.length === 0) continue;

    const asistio = !pendiente && rng() < 0.7;

    const reserva = await reservas.save(
      reservas.create({
        fecha: comoFecha(fecha),
        hora: comoHora(entero(rng, 10, 19), elegir(rng, [0, 15, 30, 45])),
        asistencia: asistio,
        usuario_id: elegir(rng, clientes).id,
        sucursal_id: sucursalId,
        // Las pasadas ya devolvieron (o consumieron) el stock; las futuras no.
        stock_liberado: !pendiente,
      }),
    );

    for (const fila of elegirVarios(rng, candidatos, entero(rng, 1, 2))) {
      const cantidad = Math.min(
        entero(rng, 1, 2),
        fila.cantidad - fila.reservada,
      );
      if (cantidad <= 0) continue;

      await detalles.save(
        detalles.create({
          reserva_id: reserva.id,
          producto_sucursal_id: fila.id,
          cantidad,
        }),
      );

      if (pendiente) fila.reservada += cantidad;
    }

    creadas++;
  }

  console.log(`reservas: ${creadas}`);
  return creadas;
}

/** Vuelca a la base las cantidades que quedaron tras ventas y reservas. */
async function actualizarStock(
  manager: EntityManager,
  stock: FilaDeStock[],
): Promise<void> {
  for (const fila of stock) {
    await manager.query(
      'UPDATE producto_sucursal SET cantidad = $1, cantidad_reservada = $2 WHERE id = $3',
      [fila.cantidad, Math.min(fila.reservada, fila.cantidad), fila.id],
    );
  }
}

async function sembrarBitacora(
  manager: EntityManager,
  ventasSembradas: VentaSembrada[],
  personal: Usuario[],
  admin: Usuario | null,
  rng: () => number,
): Promise<void> {
  const repo = manager.getRepository(Bitacora);
  const encargados = personal.filter((u) => u.tipo === 'trabajador');
  const registros: { accion: string; actor: Usuario; producto: string | null; fecha: Date }[] =
    [];

  for (const venta of ventasSembradas) {
    const actor =
      venta.cajero ?? (encargados.length > 0 ? elegir(rng, encargados) : admin);
    if (!actor) continue;

    for (const linea of venta.lineas) {
      registros.push({
        accion: `Venta #${venta.id}: salida de ${linea.cantidad} unidad(es)`,
        actor,
        producto: linea.stock.producto,
        fecha: venta.fecha,
      });
    }
  }

  // Movimientos de inventario sueltos, para que la bitacora no sea solo ventas.
  const hoy = new Date();
  const acciones = [
    'Ingreso de mercaderia del proveedor',
    'Ajuste de inventario por conteo fisico',
    'Traspaso entre sucursales',
    'Correccion de precio de venta',
    'Baja por prenda danada',
  ];

  for (let i = 0; i < 18; i++) {
    const actor = encargados.length > 0 ? elegir(rng, encargados) : admin;
    if (!actor) continue;

    const fecha = sumarDias(hoy, -entero(rng, 0, DIAS_DE_HISTORIA));
    fecha.setHours(entero(rng, 8, 19), entero(rng, 0, 59), 0, 0);

    registros.push({
      accion: elegir(rng, acciones),
      actor,
      producto:
        ventasSembradas.length > 0
          ? (elegir(rng, ventasSembradas).lineas[0]?.stock.producto ?? null)
          : null,
      fecha,
    });
  }

  for (const registro of registros) {
    const fila = await repo.save(
      repo.create({
        accion: registro.accion,
        encargado: registro.actor.username,
        actor_id: registro.actor.id,
        producto: registro.producto,
      }),
    );
    await manager.query('UPDATE bitacora SET fecha = $1 WHERE id = $2', [
      registro.fecha,
      fila.id,
    ]);
  }

  console.log(`bitacora: ${registros.length} registros`);
}

// --------------------------------------------------------------------------
// Orquestacion
// --------------------------------------------------------------------------

function activado(variable: string, porDefecto: boolean): boolean {
  const valor = process.env[variable]?.trim().toLowerCase();
  if (valor === undefined || valor === '') return porDefecto;
  return valor !== 'false' && valor !== '0' && valor !== 'no';
}

async function sembrarDemo(manager: EntityManager, roles: Map<string, number>) {
  const rng = generador(SEMILLA);

  const catalogos = await sembrarCatalogos(manager);
  const sucursales = await sembrarSucursales(manager, catalogos.ciudades);
  const { personal, clientes } = await sembrarPersonas(
    manager,
    roles,
    sucursales,
  );

  const imagenes = await copiarImagenesDeSeed();
  const productos = await sembrarProductos(manager, catalogos, imagenes);
  const stock = await sembrarStock(manager, productos, sucursales, rng);
  await sembrarPromociones(manager, sucursales);

  const ventas = await sembrarVentas(manager, stock, clientes, personal, rng);
  await sembrarReservas(manager, stock, clientes, rng);
  await actualizarStock(manager, stock);

  const admin = await manager.getRepository(Usuario).findOne({
    where: { username: process.env.ADMIN_USERNAME || 'admin' },
  });
  await sembrarBitacora(manager, ventas, personal, admin, rng);
}

async function main(): Promise<void> {
  const dataSource: DataSource = dataSourceDeConsola();
  await dataSource.initialize();

  try {
    const manager = dataSource.manager;

    const roles = await sembrarRoles(manager);
    await sembrarAdministrador(manager, roles);

    if (!activado('SEED_DEMO', true)) {
      console.log('datos de demostracion: omitidos (SEED_DEMO=false)');
      return;
    }

    const yaHayProductos = await manager.getRepository(Producto).count();
    if (yaHayProductos > 0 && !activado('SEED_FORZAR', false)) {
      console.log(
        `datos de demostracion: omitidos, ya hay ${yaHayProductos} productos ` +
          '(usa SEED_FORZAR=true para volver a sembrar)',
      );
      return;
    }

    await sembrarDemo(manager, roles);
    console.log('seed completado');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
