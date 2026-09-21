import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { Reserva } from '../entities/reserva.entity.js';
import { Rol } from '../entities/rol.entity.js';
import { Usuario } from '../entities/usuario.entity.js';
import { Venta } from '../entities/venta.entity.js';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { UsuariosService } from '../services/usuarios.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol, Venta, Reserva])],
  controllers: [UsuariosController],
  providers: [UsuariosRepository, UsuariosService],
  exports: [UsuariosService, UsuariosRepository],
})
export class UsuariosModule {}
