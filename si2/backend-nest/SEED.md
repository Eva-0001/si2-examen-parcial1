# Seeder

Llena la base con una tienda completa y creíble: catálogos, personal, productos
con foto, stock, ventas históricas, reservas y bitácora.

```bash
npm run seed        # compila y siembra
npm run db:setup    # migraciones + seed
```

En Docker se ejecuta solo, desde `docker-entrypoint.sh`, en cada arranque de la API.

## Qué siembra

| Paso | Contenido |
| --- | --- |
| **Siempre** | Los 5 roles del sistema y el usuario administrador (`ADMIN_*`). |
| Catálogos | 6 ciudades, 7 categorías, 6 colecciones, 10 colores, 6 tallas, 5 temporadas, 5 proveedores. |
| Sucursales | 4 (Equipetrol, Ventura Mall, Sopocachi, El Prado). |
| Usuarios | 7 del personal (con su fila en `trabajador`) y 8 clientes. |
| Productos | 10 diseños × sus tallas = 35 productos, todos con foto. |
| Stock | Cada producto en 2–4 sucursales, con precio propio por plaza. |
| Promociones | 5, mezclando vigentes, vencidas y futuras. |
| Ventas | 60 de los últimos 120 días, con detalles y comprobantes. |
| Reservas | 16: pasadas con y sin asistencia, y futuras pendientes. |
| Bitácora | ~138 registros derivados de las ventas más movimientos de inventario. |

Las credenciales de todo el personal y los clientes son `SEED_PASSWORD`
(`demo1234` por defecto). El administrador conserva su propia `ADMIN_PASSWORD`.

## Las imágenes

La carpeta `seed/` tiene las fotos de producto. El seeder las copia a
`uploads/productos/` con un nombre estable (`seed-<slug>.<ext>`) y guarda la ruta
pública en `productos.foto` (`/uploads/productos/...`), que es exactamente lo que
el frontend concatena a `VITE_API_URL`.

Para usar tus propias fotos: poné los archivos en `seed/` (`.jpg`, `.jpeg`,
`.jpe`, `.png`, `.webp` o `.gif`) y referencialos por nombre en el campo
`archivo` de `src/database/seeds/datos/productos.datos.ts`. Un diseño cuyo
archivo no exista se siembra igual, pero sin foto, y el seeder lo avisa.

## Coherencia de los datos

No son filas sueltas al azar; el seeder mantiene las invariantes del esquema:

- El `total` de cada venta es la suma de sus detalles.
- El stock final ya tiene descontadas las ventas generadas.
- `cantidad_reservada` coincide con las reservas pendientes (`stock_liberado = false`),
  y nunca supera `cantidad`.
- Toda la venta sale de una sola sucursal.
- Hay más ventas cerca de hoy que hace cuatro meses, y alrededor de un 10% de las
  líneas de stock queda casi agotada, para que los reportes de tendencia y de
  "por reponer" tengan algo que mostrar.

Usa un generador pseudoaleatorio con semilla fija (`SEMILLA` en `seed.ts`), así
la misma base sale idéntica en cualquier máquina.

## Variables

| Variable | Por defecto | Para qué |
| --- | --- | --- |
| `SEED_DEMO` | `true` | `false` siembra solo roles y administrador. |
| `SEED_FORZAR` | `false` | `true` vuelve a sembrar aunque ya existan productos. |
| `SEED_PASSWORD` | `demo1234` | Password del personal y los clientes de prueba. |
| `SEED_DIR` | `seed` | Carpeta de donde salen las imágenes. |
| `UPLOAD_DIR` | `uploads` | Carpeta a donde se copian. |

## Re-ejecución

Es idempotente: los catálogos se crean solo si faltan (búsqueda por nombre
único), y los datos de demostración se omiten si la tabla `productos` ya tiene
filas. Por eso el entrypoint de Docker puede correrlo en cada arranque.

Para volver a sembrar de cero:

```bash
docker compose down -v && docker compose up -d   # borra base y uploads
# o, sin borrar nada:
SEED_FORZAR=true npm run seed
```

`SEED_FORZAR=true` **agrega** sobre lo que ya hay (no borra): sirve para sumar
productos nuevos tras editar los archivos de `datos/`, no para reiniciar.

## Archivos

```
src/database/seeds/
├── seed.ts                     orquestación y lógica de inserción
├── imagenes.ts                 copia de seed/ a uploads/
├── utiles.ts                   aleatorio con semilla y helpers idempotentes
└── datos/
    ├── catalogos.datos.ts      ciudades, categorías, sucursales, promociones…
    ├── personas.datos.ts       personal y clientes
    └── productos.datos.ts      los 10 diseños y sus tallas
```
