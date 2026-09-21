import { Injectable } from '@nestjs/common';

export interface EstadoDeLaApi {
  mensaje: string;
  docs: string;
}

@Injectable()
export class AppService {
  estado(): EstadoDeLaApi {
    return { mensaje: 'API Tienda funcionando', docs: '/docs' };
  }
}
