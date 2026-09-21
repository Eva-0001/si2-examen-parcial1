import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Configuracion } from '../../config/configuracion.js';

export const URL_PUBLICA_UPLOADS = '/uploads';

export const EXTENSIONES_PERMITIDAS = [
  '.jpg',
  '.jpeg',
  '.jpe',
  '.png',
  '.webp',
  '.gif',
];

@Injectable()
export class ArchivosService {
  private readonly carpeta: string;

  constructor(config: ConfigService<Configuracion, true>) {
    this.carpeta = config.get('uploads', { infer: true }).carpeta;
  }

  async guardar(
    archivo: Express.Multer.File,
    subcarpeta: string,
  ): Promise<string> {
    const extension = extname(archivo.originalname ?? '').toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      throw new BadRequestException(
        `Solo se aceptan imagenes: ${EXTENSIONES_PERMITIDAS.join(', ')}`,
      );
    }

    const destino = join(this.carpeta, subcarpeta);
    await mkdir(destino, { recursive: true });

    const nombre = `${randomUUID()}${extension}`;
    await writeFile(join(destino, nombre), archivo.buffer);

    return `${URL_PUBLICA_UPLOADS}/${subcarpeta}/${nombre}`;
  }

  async eliminar(rutaPublica: string | null | undefined): Promise<void> {
    if (!rutaPublica?.startsWith(`${URL_PUBLICA_UPLOADS}/`)) return;

    const relativa = rutaPublica.slice(URL_PUBLICA_UPLOADS.length + 1);
    await unlink(join(this.carpeta, relativa)).catch(() => undefined);
  }
}
