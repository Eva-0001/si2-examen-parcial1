import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdir } from 'node:fs/promises';
import { AppModule } from './app.module.js';
import { URL_PUBLICA_UPLOADS } from './commons/archivos/archivos.service.js';
import { fabricaDeErroresDeValidacion } from './commons/validacion.js';
import type { Configuracion } from './config/configuracion.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService<Configuracion, true>);
  const uploads = config.get('uploads', { infer: true });
  const puerto = config.get('puerto', { infer: true });

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: fabricaDeErroresDeValidacion,
    }),
  );

  await mkdir(uploads.carpeta, { recursive: true });
  app.useStaticAssets(uploads.carpeta, { prefix: `${URL_PUBLICA_UPLOADS}/` });

  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('API Tienda')
      .setVersion('2.0.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, documento);

  await app.listen(puerto);
  console.log(`API escuchando en http://localhost:${puerto}`);
}

await bootstrap();
