import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from '../controllers/roles.controller.js';
import { Rol } from '../entities/rol.entity.js';
import { Usuario } from '../entities/usuario.entity.js';
import { RolesRepository } from '../repositories/roles.repository.js';
import { RolesService } from '../services/roles.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, Usuario])],
  controllers: [RolesController],
  providers: [RolesRepository, RolesService],
  exports: [RolesService],
})
export class RolesModule {}
