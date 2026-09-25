import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CrearUsuarioDto } from './usuario.dto.js';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegistroDto extends OmitType(CrearUsuarioDto, [
  'rol_id',
] as const) {}

export class TokenDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ example: 'bearer' })
  token_type: string;

  @ApiProperty({
    description:
      'Token de larga duracion para pedir un access_token nuevo en /auth/refresh',
  })
  refresh_token: string;

  @ApiProperty()
  usuario: unknown;
}

export class RefrescarDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
