import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { aCentavos, deCentavos } from '../commons/dinero.js';
import type { Configuracion } from '../config/configuracion.js';
import type { Usuario } from '../entities/usuario.entity.js';

export interface ConfigDePagos {
  habilitado: boolean;
  modo_prueba: boolean;
  moneda: string;
  tasa_bob: number;
}

export interface IntencionDePago {
  pago_id: string;
  client_secret: string;
  total_bs: string;
  monto: number;
  moneda: string;
}

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);
  private readonly stripe: Stripe | null;
  private readonly opciones: Configuracion['stripe'];

  constructor(config: ConfigService<Configuracion, true>) {
    this.opciones = config.get('stripe', { infer: true });
    this.stripe = this.opciones.habilitado
      ? new Stripe(this.opciones.secretKey)
      : null;
  }

  get habilitado(): boolean {
    return this.stripe !== null;
  }

  configuracion(): ConfigDePagos {
    return {
      habilitado: this.opciones.habilitado,
      modo_prueba: this.opciones.modoPrueba,
      moneda: this.opciones.moneda,
      tasa_bob: this.opciones.tasaBob,
    };
  }

  exigirPasarela(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'La pasarela de pago no esta configurada en el servidor (falta STRIPE_SECRET_KEY)',
      );
    }
    return this.stripe;
  }

  aCentavosDeCobro(totalBs: string): number {
    return Math.round(aCentavos(totalBs) / this.opciones.tasaBob);
  }

  async crearIntencion(
    totalBs: string,
    usuario: Usuario,
  ): Promise<IntencionDePago> {
    const stripe = this.exigirPasarela();
    const centavos = this.aCentavosDeCobro(totalBs);

    if (centavos < this.opciones.minimoCentavos) {
      throw new BadRequestException(
        `El monto es demasiado bajo para la pasarela (minimo ${this.opciones.minimoCentavos} ` +
          `centavos ${this.opciones.moneda.toUpperCase()}). Agrega mas productos al carrito.`,
      );
    }

    try {
      const intencion = await stripe.paymentIntents.create({
        amount: centavos,
        currency: this.opciones.moneda,
        // Solo tarjeta: con automatic_payment_methods Stripe suma Link
        // (el "pago rapido con link") y otros metodos de su catalogo.
        payment_method_types: ['card'],
        description: `Tienda - compra de ${usuario.username}`,
        metadata: {
          usuario_id: String(usuario.id),
          username: usuario.username,
          total_bs: totalBs,
        },
      });

      return {
        pago_id: intencion.id,
        client_secret: intencion.client_secret ?? '',
        total_bs: totalBs,
        monto: centavos,
        moneda: this.opciones.moneda,
      };
    } catch (error) {
      throw new BadGatewayException(
        `Stripe rechazo la solicitud: ${this.mensaje(error)}`,
      );
    }
  }

  async verificar(pagoId: string, totalBs: string): Promise<void> {
    const stripe = this.exigirPasarela();

    let intencion: Stripe.PaymentIntent;
    try {
      intencion = await stripe.paymentIntents.retrieve(pagoId);
    } catch (error) {
      throw new BadRequestException(
        `No pudimos verificar el pago: ${this.mensaje(error)}`,
      );
    }

    if (intencion.status !== 'succeeded') {
      throw new HttpException(
        `El pago no esta aprobado (estado: ${intencion.status})`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const esperado = this.aCentavosDeCobro(totalBs);
    if (intencion.amount_received !== esperado) {
      throw new ConflictException(
        'El monto pagado no coincide con el total del pedido: los precios cambiaron ' +
          'mientras pagabas. No se registro la venta.',
      );
    }

    if (intencion.currency !== this.opciones.moneda) {
      throw new ConflictException(
        'La moneda del pago no coincide con la configurada',
      );
    }
  }

  async marcarVenta(pagoId: string, ventaId: number): Promise<void> {
    if (!this.stripe) return;

    try {
      await this.stripe.paymentIntents.update(pagoId, {
        metadata: { venta_id: String(ventaId) },
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo anotar la venta ${ventaId} en el pago ${pagoId}: ${this.mensaje(error)}`,
      );
    }
  }

  formatear(centavos: number): string {
    return deCentavos(centavos);
  }

  private mensaje(error: unknown): string {
    if (error instanceof Stripe.errors.StripeError) {
      return error.message;
    }
    return error instanceof Error ? error.message : String(error);
  }
}
