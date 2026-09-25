import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '../controllers/auth.controller.js';
import { Sesion } from '../entities/sesion.entity.js';
import { SesionesRepository } from '../repositories/sesiones.repository.js';
import { AuthService } from '../services/auth.service.js';
import { UsuariosModule } from './usuarios.module.js';

@Module({
  imports: [UsuariosModule, TypeOrmModule.forFeature([Sesion])],
  controllers: [AuthController],
  providers: [AuthService, SesionesRepository],
  exports: [AuthService],
})
export class AuthModule {}
