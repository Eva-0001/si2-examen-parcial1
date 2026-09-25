import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Configuracion } from '../../config/configuracion.js';
import { ArchivosService } from './archivos.service.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Configuracion, true>) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.get('uploads', { infer: true }).maxBytes },
      }),
    }),
  ],
  providers: [ArchivosService],
  exports: [ArchivosService, MulterModule],
})
export class ArchivosModule {}
