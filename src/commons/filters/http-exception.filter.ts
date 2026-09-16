import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const MULTER_ARCHIVO_GRANDE = 'File too large';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Excepcion');

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const respuesta = contexto.getResponse<Response>();
    const peticion = contexto.getRequest<Request>();

    const { estado, detalle } = this.traducir(excepcion);

    if (estado === HttpStatus.UNAUTHORIZED) {
      respuesta.setHeader('WWW-Authenticate', 'Bearer');
    }

    if (estado >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${peticion.method} ${peticion.originalUrl} -> ${estado}`,
        excepcion instanceof Error ? excepcion.stack : String(excepcion),
      );
    }

    respuesta.status(estado).json({ detail: detalle });
  }

  private traducir(excepcion: unknown): { estado: number; detalle: unknown } {
    if (!(excepcion instanceof HttpException)) {
      return {
        estado: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error interno del servidor',
      };
    }

    const estado = excepcion.getStatus();
    const cuerpo = excepcion.getResponse();

    if (typeof cuerpo === 'string') {
      return { estado, detalle: this.ajustarMensaje(estado, cuerpo) };
    }

    const objeto = cuerpo as Record<string, unknown>;

    if ('detail' in objeto) {
      return { estado, detalle: objeto.detail };
    }

    const mensaje = objeto.message ?? excepcion.message;
    const texto = Array.isArray(mensaje) ? mensaje.join('; ') : String(mensaje);
    return { estado, detalle: this.ajustarMensaje(estado, texto) };
  }

  private ajustarMensaje(estado: number, mensaje: string): string {
    if (
      estado === HttpStatus.PAYLOAD_TOO_LARGE &&
      mensaje === MULTER_ARCHIVO_GRANDE
    ) {
      return 'La imagen supera el tamano maximo permitido';
    }
    return mensaje;
  }
}
