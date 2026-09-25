import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrabajadoresController } from '../controllers/trabajadores.controller.js';
import { Sucursal } from '../entities/sucursal.entity.js';
import { Trabajador } from '../entities/trabajador.entity.js';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';
import { TrabajadoresService } from '../services/trabajadores.service.js';
import { UsuariosModule } from './usuarios.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Trabajador, Sucursal]), UsuariosModule],
  controllers: [TrabajadoresController],
  providers: [TrabajadoresRepository, TrabajadoresService],
  exports: [TrabajadoresService],
})
export class TrabajadoresModule {}
