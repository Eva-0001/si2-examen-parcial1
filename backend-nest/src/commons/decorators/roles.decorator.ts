import { SetMetadata } from '@nestjs/common';
import type { Rol } from '../enums/rol.enum.js';

export const ROLES = 'roles';

export const Roles = (...roles: readonly Rol[]) => SetMetadata(ROLES, roles);
