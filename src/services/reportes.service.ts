import { Injectable } from '@nestjs/common';
import type {
  FiltroReporteInventarioDto,
  FiltroReporteVentasDto,
} from '../dto/reporte.dto.js';
import { ReportesRepository } from '../repositories/reportes.repository.js';

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

  async dashboard() {
    const [totales, inventario, reservas, top] = await Promise.all([
      this.repo.totalesDelDashboard(),
      this.repo.inventarioPorSucursal(),
      this.repo.reservasPendientes(),
      this.repo.topProductos({}, 5),
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
}
