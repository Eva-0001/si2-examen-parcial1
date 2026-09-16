import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { UsuariosModule } from './usuarios.module.js';

@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
