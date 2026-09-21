import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArchivosService } from '../commons/archivos/archivos.service.js';
import type {
  ActualizarSucursalDto,
  CrearSucursalDto,
  FiltroSucursalesDto,
} from '../dto/ubicacion.dto.js';
import type { Sucursal } from '../entities/sucursal.entity.js';
import { SucursalesRepository } from '../repositories/ubicacion.repository.js';

const NO_ENCONTRADA = 'Sucursal no encontrada';

const CARPETA_FOTOS = 'sucursales';

@Injectable()
export class SucursalesService {
  constructor(
    private readonly repo: SucursalesRepository,
    private readonly archivos: ArchivosService,
  ) {}

  listar(filtro: FiltroSucursalesDto): Promise<Sucursal[]> {
    return this.repo.listar(filtro.ciudad_id);
  }

  async obtener(id: number): Promise<Sucursal> {
    const sucursal = await this.repo.obtener(id);
    if (!sucursal) throw new NotFoundException(NO_ENCONTRADA);
    return sucursal;
  }

  async obtenerConCiudad(id: number): Promise<Sucursal> {
    const sucursal = await this.repo.obtenerConCiudad(id);
    if (!sucursal) throw new NotFoundException(NO_ENCONTRADA);
    return sucursal;
  }

  async crear(datos: CrearSucursalDto): Promise<Sucursal> {
    await this.verificarCiudad(datos.ciudad_id);
    return this.repo.crear(datos);
  }

  async actualizar(
    id: number,
    datos: ActualizarSucursalDto,
  ): Promise<Sucursal> {
    const sucursal = await this.obtener(id);
    await this.verificarCiudad(datos.ciudad_id);

    Object.assign(sucursal, datos);
    return this.repo.guardar(sucursal);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const sucursal = await this.obtener(id);

    if (await this.repo.tieneMovimientos(id)) {
      throw new ConflictException(
        'No se puede eliminar la sucursal porque tiene ventas o reservas',
      );
    }

    await this.archivos.eliminar(sucursal.foto);
    await this.repo.eliminar(id);
    return { mensaje: 'Sucursal eliminada' };
  }

  async cambiarFoto(
    id: number,
    archivo: Express.Multer.File,
  ): Promise<Sucursal> {
    const sucursal = await this.obtener(id);
    const ruta = await this.archivos.guardar(archivo, CARPETA_FOTOS);

    await this.archivos.eliminar(sucursal.foto);

    sucursal.foto = ruta;
    return this.repo.guardar(sucursal);
  }

  async quitarFoto(id: number): Promise<Sucursal> {
    const sucursal = await this.obtener(id);

    await this.archivos.eliminar(sucursal.foto);
    sucursal.foto = null;
    return this.repo.guardar(sucursal);
  }

  private async verificarCiudad(ciudadId: number | undefined): Promise<void> {
    if (ciudadId === undefined) return;
    if (!(await this.repo.existeCiudad(ciudadId))) {
      throw new BadRequestException('La ciudad no existe');
    }
  }
}
