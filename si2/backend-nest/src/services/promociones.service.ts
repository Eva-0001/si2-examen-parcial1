import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArchivosService } from '../commons/archivos/archivos.service.js';
import type {
  ActualizarPromocionDto,
  CrearPromocionDto,
  FiltroPromocionesDto,
} from '../dto/ubicacion.dto.js';
import type { Promocion } from '../entities/promocion.entity.js';
import { PromocionesRepository } from '../repositories/ubicacion.repository.js';

const NO_ENCONTRADA = 'Promocion no encontrada';

const CARPETA_FOTOS = 'promociones';

@Injectable()
export class PromocionesService {
  constructor(
    private readonly repo: PromocionesRepository,
    private readonly archivos: ArchivosService,
  ) {}

  listar(filtro: FiltroPromocionesDto): Promise<Promocion[]> {
    return this.repo.listar(filtro.sucursal_id, filtro.solo_vigentes ?? false);
  }

  async obtener(id: number): Promise<Promocion> {
    const promocion = await this.repo.obtener(id);
    if (!promocion) throw new NotFoundException(NO_ENCONTRADA);
    return promocion;
  }

  async obtenerConSucursal(id: number): Promise<Promocion> {
    const promocion = await this.repo.obtenerConSucursal(id);
    if (!promocion) throw new NotFoundException(NO_ENCONTRADA);
    return promocion;
  }

  async crear(datos: CrearPromocionDto): Promise<Promocion> {
    await this.verificarSucursal(datos.sucursal_id);
    return this.repo.crear(datos);
  }

  async actualizar(
    id: number,
    datos: ActualizarPromocionDto,
  ): Promise<Promocion> {
    const promocion = await this.obtener(id);
    await this.verificarSucursal(datos.sucursal_id);

    const inicio = datos.fecha_inicio ?? promocion.fecha_inicio;
    const final = datos.fecha_final ?? promocion.fecha_final;
    if (final < inicio) {
      throw new BadRequestException(
        'fecha_final no puede ser anterior a fecha_inicio',
      );
    }

    Object.assign(promocion, datos);
    return this.repo.guardar(promocion);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const promocion = await this.obtener(id);

    await this.archivos.eliminar(promocion.foto);
    await this.repo.eliminar(id);
    return { mensaje: 'Promocion eliminada' };
  }

  async cambiarFoto(
    id: number,
    archivo: Express.Multer.File,
  ): Promise<Promocion> {
    const promocion = await this.obtener(id);
    const ruta = await this.archivos.guardar(archivo, CARPETA_FOTOS);

    await this.archivos.eliminar(promocion.foto);
    promocion.foto = ruta;
    return this.repo.guardar(promocion);
  }

  async quitarFoto(id: number): Promise<Promocion> {
    const promocion = await this.obtener(id);

    await this.archivos.eliminar(promocion.foto);
    promocion.foto = null;
    return this.repo.guardar(promocion);
  }

  private async verificarSucursal(
    sucursalId: number | undefined,
  ): Promise<void> {
    if (sucursalId === undefined) return;
    if (!(await this.repo.existeSucursal(sucursalId))) {
      throw new BadRequestException('La sucursal no existe');
    }
  }
}
