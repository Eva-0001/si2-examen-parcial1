import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DeepPartial, ObjectLiteral } from 'typeorm';
import type { CatalogoRepository } from '../repositories/catalogos.repository.js';
import {
  CategoriasRepository,
  ColeccionesRepository,
  ColoresRepository,
  ProveedoresRepository,
  TallasRepository,
  TemporadasRepository,
} from '../repositories/catalogos.repository.js';
import { Categoria } from '../entities/categoria.entity.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Color } from '../entities/color.entity.js';
import { Proveedor } from '../entities/proveedor.entity.js';
import { Talla } from '../entities/talla.entity.js';
import { Temporada } from '../entities/temporada.entity.js';

interface ConNombre extends ObjectLiteral {
  id: number;
  nombre: string;
}

export interface TextosDeCatalogo {
  noEncontrado: string;
  duplicado: string | null;
  conProductos: string;
  eliminado: string;
}

export abstract class CatalogoService<T extends ConNombre> {
  protected constructor(
    protected readonly repo: CatalogoRepository<T>,
    protected readonly textos: TextosDeCatalogo,
  ) {}

  listar(): Promise<T[]> {
    return this.repo.listar();
  }

  async obtener(id: number): Promise<T> {
    const encontrado = await this.repo.obtener(id);
    if (!encontrado) throw new NotFoundException(this.textos.noEncontrado);
    return encontrado;
  }

  async crear(datos: DeepPartial<T>): Promise<T> {
    await this.verificarNombreLibre(datos.nombre as string | undefined);
    return this.repo.crear(datos);
  }

  async actualizar(id: number, datos: DeepPartial<T>): Promise<T> {
    const actual = await this.obtener(id);

    await this.verificarNombreLibre(datos.nombre as string | undefined, id);

    Object.assign(actual, datos);
    return this.repo.guardar(actual);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    await this.obtener(id);

    if (await this.repo.tieneProductos(id)) {
      throw new ConflictException(this.textos.conProductos);
    }

    await this.repo.eliminar(id);
    return { mensaje: this.textos.eliminado };
  }

  private async verificarNombreLibre(
    nombre: string | undefined,
    excluirId?: number,
  ): Promise<void> {
    if (!this.textos.duplicado || nombre === undefined) return;

    if (await this.repo.porNombre(nombre, excluirId)) {
      throw new ConflictException(this.textos.duplicado);
    }
  }
}

@Injectable()
export class CategoriasService extends CatalogoService<Categoria> {
  constructor(repo: CategoriasRepository) {
    super(repo, {
      noEncontrado: 'Categoria no encontrada',
      duplicado: 'Ya existe una categoria con ese nombre',
      conProductos:
        'No se puede eliminar la categoria porque tiene productos asociados',
      eliminado: 'Categoria eliminada',
    });
  }
}

@Injectable()
export class ColeccionesService extends CatalogoService<Coleccion> {
  constructor(repo: ColeccionesRepository) {
    super(repo, {
      noEncontrado: 'Coleccion no encontrada',
      duplicado: 'Ya existe una coleccion con ese nombre',
      conProductos:
        'No se puede eliminar la coleccion porque tiene productos asociados',
      eliminado: 'Coleccion eliminada',
    });
  }
}

@Injectable()
export class ColoresService extends CatalogoService<Color> {
  constructor(repo: ColoresRepository) {
    super(repo, {
      noEncontrado: 'Color no encontrado',
      duplicado: 'Ya existe un color con ese nombre',
      conProductos:
        'No se puede eliminar el color porque tiene productos asociados',
      eliminado: 'Color eliminado',
    });
  }
}

@Injectable()
export class TallasService extends CatalogoService<Talla> {
  constructor(repo: TallasRepository) {
    super(repo, {
      noEncontrado: 'Talla no encontrada',
      duplicado: 'Ya existe una talla con ese nombre',
      conProductos:
        'No se puede eliminar la talla porque tiene productos asociados',
      eliminado: 'Talla eliminada',
    });
  }
}

@Injectable()
export class TemporadasService extends CatalogoService<Temporada> {
  constructor(repo: TemporadasRepository) {
    super(repo, {
      noEncontrado: 'Temporada no encontrada',
      duplicado: 'Ya existe una temporada con ese nombre',
      conProductos:
        'No se puede eliminar la temporada porque tiene productos asociados',
      eliminado: 'Temporada eliminada',
    });
  }
}

@Injectable()
export class ProveedoresService extends CatalogoService<Proveedor> {
  constructor(repo: ProveedoresRepository) {
    super(repo, {
      noEncontrado: 'Proveedor no encontrado',
      duplicado: null,
      conProductos:
        'No se puede eliminar el proveedor porque tiene productos asociados',
      eliminado: 'Proveedor eliminado',
    });
  }
}
