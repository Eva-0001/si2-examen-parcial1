import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { instanceToPlain } from 'class-transformer';
import type { Configuracion } from '../config/configuracion.js';
import type { Reserva } from '../entities/reserva.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';
import {
  type RecursoCatalogo,
  SyncRepository,
  TABLAS_CATALOGO,
} from '../repositories/sync.repository.js';

const RECURSOS = Object.keys(TABLAS_CATALOGO) as RecursoCatalogo[];

const RECURSO_POR_TABLA = Object.fromEntries(
  RECURSOS.map((recurso) => [TABLAS_CATALOGO[recurso].tabla, recurso]),
) as Record<string, RecursoCatalogo>;

@Injectable()
export class SyncService {
  private readonly horasVigencia: number;

  constructor(
    private readonly repo: SyncRepository,
    config: ConfigService<Configuracion, true>,
  ) {
    this.horasVigencia = config.get('reservas', { infer: true }).horasVigencia;
  }

  async catalogo(desde?: string) {
    const hasta = await this.repo.corte();
    const inicio = desde ?? null;

    const datos: Record<string, unknown[]> = {};
    for (const recurso of RECURSOS) {
      datos[recurso] = await this.repo.cambiosDe(recurso, inicio);
    }

    const eliminados = Object.fromEntries(
      RECURSOS.map((recurso) => [recurso, [] as number[]]),
    );
    if (inicio) {
      const filas = await this.repo.eliminados(
        RECURSOS.map((recurso) => TABLAS_CATALOGO[recurso].tabla),
        inicio,
      );
      for (const fila of filas) {
        eliminados[RECURSO_POR_TABLA[fila.tabla]].push(fila.registro_id);
      }
    }

    return {
      completo: inicio === null,
      hasta: hasta.toISOString(),
      ...datos,
      eliminados,
    };
  }

  async misDatos(usuario: Usuario, desde?: string) {
    const hasta = await this.repo.corte();
    const inicio = desde ?? null;

    const [reservas, ventas] = await Promise.all([
      this.repo
        .idsCambiados('reserva', usuario.id, inicio)
        .then((ids) => this.repo.reservasCompletas(ids)),
      this.repo
        .idsCambiados('ventas', usuario.id, inicio)
        .then((ids) => this.repo.ventasCompletas(ids)),
    ]);

    const eliminados = { reservas: [] as number[], ventas: [] as number[] };
    if (inicio) {
      const filas = await this.repo.eliminados(
        ['reserva', 'ventas'],
        inicio,
        usuario.id,
      );
      for (const fila of filas) {
        const lista =
          fila.tabla === 'reserva' ? eliminados.reservas : eliminados.ventas;
        lista.push(fila.registro_id);
      }
    }

    return {
      completo: inicio === null,
      hasta: hasta.toISOString(),
      reservas: reservas.map((reserva) => ({
        ...instanceToPlain(reserva),
        vence_en: this.venceEn(reserva),
      })),
      ventas: ventas.map((venta) => instanceToPlain(venta)),
      eliminados,
    };
  }

  // Misma regla que ReservasRepository.vencidas: fecha + hora + horas de
  // vigencia, en hora local de la tienda (sin zona, como fecha y hora).
  private venceEn(reserva: Reserva): string | null {
    const [anio, mes, dia] = reserva.fecha.split('-').map(Number);
    const [hora, minuto, segundo] = reserva.hora.split(':').map(Number);
    if ([anio, mes, dia].some(Number.isNaN)) return null;

    const momento = new Date(
      Date.UTC(anio, mes - 1, dia, hora || 0, minuto || 0, segundo || 0) +
        this.horasVigencia * 60 * 60 * 1000,
    );
    return momento.toISOString().slice(0, 19);
  }
}
