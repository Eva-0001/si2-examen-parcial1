import { ForbiddenException, Injectable } from '@nestjs/common';
import { Rol } from '../commons/enums/rol.enum.js';
import type {
  FiltroReporteInventarioDto,
  FiltroReporteVentasDto,
  ParametrosReporte,
  TipoReporte,
} from '../dto/reporte.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { ReportesRepository } from '../repositories/reportes.repository.js';

export interface ReporteTabular {
  tipo: TipoReporte;
  titulo: string;
  parametros: ParametrosReporte;
  grafico: 'barras' | 'lineas';
  formato: 'bs' | 'entero';
  serie: { etiqueta: string; valor: number; detalle?: string }[];
  tabla: { encabezados: string[]; filas: (string | number)[][] };
  totales: Record<string, unknown>;
}

/** Roles que solo ven reportes de la sucursal de su ficha de trabajador. */
const ROLES_DE_SUCURSAL: readonly string[] = [Rol.ENCARGADO, Rol.CAJERO];

export const limitadoASucursal = (usuario: Usuario) =>
  ROLES_DE_SUCURSAL.includes(usuario.rol?.nombre ?? '');

const bs = (valor: unknown) => Number(valor ?? 0).toFixed(2);

const contarPor = (filas: Record<string, unknown>[], campo: string) => {
  const conteo = new Map<string, number>();
  for (const fila of filas) {
    const clave = String(fila[campo]);
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  return [...conteo].map(([etiqueta, valor]) => ({ etiqueta, valor }));
};

@Injectable()
export class ReportesService {
  constructor(private readonly repo: ReportesRepository) {}

  async ventas(filtro: FiltroReporteVentasDto) {
    const rango = {
      desde: filtro.desde,
      hasta: filtro.hasta,
      sucursal_id: filtro.sucursal_id,
    };

    const [resumen, porDia, top] = await Promise.all([
      this.repo.resumenDeVentas(rango),
      this.repo.ventasPorDia(rango),
      this.repo.topProductos(rango, filtro.top ?? 10),
    ]);

    return {
      periodo: { desde: filtro.desde ?? null, hasta: filtro.hasta ?? null },
      sucursal_id: filtro.sucursal_id ?? null,
      resumen: resumen[0] ?? {
        ventas: 0,
        unidades: 0,
        importe: '0',
        clientes: 0,
      },
      por_dia: porDia,
      top_productos: top,
    };
  }

  async inventario(filtro: FiltroReporteInventarioDto) {
    const [porSucursal, reponer] = await Promise.all([
      this.repo.inventarioPorSucursal(filtro.sucursal_id),
      this.repo.porReponer(filtro.sucursal_id, filtro.umbral ?? 3),
    ]);

    return {
      sucursal_id: filtro.sucursal_id ?? null,
      por_sucursal: porSucursal,
      por_reponer: reponer,
    };
  }

  /**
   * Sucursal a la que queda limitado el reporte. Encargado y cajero solo ven la suya (la de su
   * ficha de trabajador), sin importar lo que pidan; el administrador ve la que pidio o todas.
   */
  async sucursalPermitida(
    usuario: Usuario,
    pedida?: number,
  ): Promise<number | undefined> {
    if (!limitadoASucursal(usuario)) return pedida;

    const propia = await this.repo.sucursalDeTrabajador(usuario.id);
    if (propia === null) {
      throw new ForbiddenException(
        'No tenes una sucursal asignada: pedile al administrador que te asigne una',
      );
    }
    if (pedida !== undefined && pedida !== propia) {
      throw new ForbiddenException('Solo podes ver reportes de tu sucursal');
    }
    return propia;
  }

  async dashboard(sucursalId?: number) {
    const [totales, inventario, reservas, top] = await Promise.all([
      this.repo.totalesDelDashboard(sucursalId),
      this.repo.inventarioPorSucursal(sucursalId),
      this.repo.reservasPendientes(sucursalId),
      this.repo.topProductos({ sucursal_id: sucursalId }, 5),
    ]);

    return {
      ventas: totales[0] ?? {
        importe_hoy: '0',
        ventas_hoy: 0,
        importe_mes: '0',
        ventas_mes: 0,
      },
      inventario,
      reservas_pendientes: reservas,
      top_productos: top,
    };
  }

  /** Reportes con forma de tabla + serie; son los que elige el generador con IA. */
  async generar(
    tipo: TipoReporte,
    parametros: ParametrosReporte,
  ): Promise<ReporteTabular> {
    const rango = {
      desde: parametros.desde,
      hasta: parametros.hasta,
      sucursal_id: parametros.sucursal_id,
    };

    switch (tipo) {
      case 'ventas_por_dia': {
        const [resumen, porDia] = await Promise.all([
          this.repo.resumenDeVentas(rango),
          this.repo.ventasPorDia(rango),
        ]);
        return {
          tipo,
          titulo: 'Ventas por dia',
          parametros,
          grafico: 'lineas',
          formato: 'bs',
          serie: porDia.map((f) => ({
            etiqueta: String(f.dia).slice(5),
            detalle: `${String(f.dia)}: ${Number(f.ventas)} ventas`,
            valor: Number(f.importe),
          })),
          tabla: {
            encabezados: ['Dia', 'Ventas', 'Importe (Bs)'],
            filas: porDia.map((f) => [
              String(f.dia),
              Number(f.ventas),
              bs(f.importe),
            ]),
          },
          totales: resumen[0] ?? {},
        };
      }

      case 'ventas_por_sucursal': {
        const [resumen, porSucursal] = await Promise.all([
          this.repo.resumenDeVentas(rango),
          this.repo.ventasPorSucursal(rango),
        ]);
        return {
          tipo,
          titulo: 'Ventas por sucursal',
          parametros,
          grafico: 'barras',
          formato: 'bs',
          serie: porSucursal.map((f) => ({
            etiqueta: String(f.sucursal),
            detalle: `${Number(f.ventas)} ventas`,
            valor: Number(f.importe),
          })),
          tabla: {
            encabezados: ['Sucursal', 'Ventas', 'Unidades', 'Importe (Bs)'],
            filas: porSucursal.map((f) => [
              String(f.sucursal),
              Number(f.ventas),
              Number(f.unidades),
              bs(f.importe),
            ]),
          },
          totales: resumen[0] ?? {},
        };
      }

      case 'top_productos': {
        const top = await this.repo.topProductos(rango, parametros.top ?? 10);
        return {
          tipo,
          titulo: 'Prendas mas vendidas',
          parametros,
          grafico: 'barras',
          formato: 'entero',
          serie: top.map((f) => ({
            etiqueta: String(f.producto),
            detalle: `Bs ${bs(f.importe)}`,
            valor: Number(f.unidades),
          })),
          tabla: {
            encabezados: ['Prenda', 'Categoria', 'Unidades', 'Importe (Bs)'],
            filas: top.map((f) => [
              String(f.producto),
              String(f.categoria),
              Number(f.unidades),
              bs(f.importe),
            ]),
          },
          totales: {
            prendas: top.length,
            unidades: top.reduce((a, f) => a + Number(f.unidades), 0),
          },
        };
      }

      case 'inventario_por_sucursal': {
        const filas = await this.repo.inventarioPorSucursal(
          parametros.sucursal_id,
        );
        const sumar = (campo: string) =>
          filas.reduce((a, f) => a + Number(f[campo]), 0);
        return {
          tipo,
          titulo: 'Inventario por sucursal',
          parametros,
          grafico: 'barras',
          formato: 'entero',
          serie: filas.map((f) => ({
            etiqueta: String(f.sucursal),
            detalle: `${Number(f.agotados)} agotados`,
            valor: Number(f.disponibles),
          })),
          tabla: {
            encabezados: [
              'Sucursal',
              'Unidades',
              'Reservadas',
              'Disponibles',
              'Agotados',
              'Valorizado (Bs)',
            ],
            filas: filas.map((f) => [
              String(f.sucursal),
              Number(f.unidades),
              Number(f.reservadas),
              Number(f.disponibles),
              Number(f.agotados),
              bs(f.valorizado),
            ]),
          },
          totales: {
            unidades: sumar('unidades'),
            disponibles: sumar('disponibles'),
            agotados: sumar('agotados'),
          },
        };
      }

      case 'por_reponer': {
        const umbral = parametros.umbral ?? 3;
        const filas = await this.repo.porReponer(
          parametros.sucursal_id,
          umbral,
        );
        return {
          tipo,
          titulo: umbral === 0 ? 'Prendas sin stock' : 'Prendas por reponer',
          parametros: { ...parametros, umbral },
          grafico: 'barras',
          formato: 'entero',
          serie: contarPor(filas, 'sucursal'),
          tabla: {
            encabezados: [
              'Prenda',
              'Sucursal',
              'Cantidad',
              'Reservadas',
              'Disponibles',
            ],
            filas: filas.map((f) => [
              String(f.producto),
              String(f.sucursal),
              Number(f.cantidad),
              Number(f.reservadas),
              Number(f.disponibles),
            ]),
          },
          totales: { lineas: filas.length, umbral, maximo_de_lineas: 50 },
        };
      }

      case 'reservas': {
        const filas = await this.repo.reservasDelRango(rango);
        const porEstado = Object.fromEntries(
          contarPor(filas, 'estado').map((e) => [e.etiqueta, e.valor]),
        );
        return {
          tipo,
          titulo: 'Reservas',
          parametros,
          grafico: 'barras',
          formato: 'entero',
          serie: contarPor(filas, 'sucursal'),
          tabla: {
            encabezados: [
              'Fecha',
              'Hora',
              'Cliente',
              'Sucursal',
              'Prendas',
              'Estado',
            ],
            filas: filas.map((f) => [
              String(f.fecha),
              String(f.hora),
              String(f.cliente),
              String(f.sucursal),
              Number(f.prendas),
              String(f.estado),
            ]),
          },
          totales: {
            reservas: filas.length,
            por_estado: porEstado,
            maximo_de_lineas: 200,
          },
        };
      }
    }
  }
}
