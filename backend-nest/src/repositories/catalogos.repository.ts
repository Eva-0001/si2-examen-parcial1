import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { Categoria } from '../entities/categoria.entity.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Color } from '../entities/color.entity.js';
import { Producto } from '../entities/producto.entity.js';
import { Proveedor } from '../entities/proveedor.entity.js';
import { Talla } from '../entities/talla.entity.js';
import { Temporada } from '../entities/temporada.entity.js';

interface ConNombre extends ObjectLiteral {
  id: number;
  nombre: string;
}

export abstract class CatalogoRepository<T extends ConNombre> {
  protected constructor(protected readonly repo: Repository<T>) {}

  listar(): Promise<T[]> {
    return this.repo.find({ order: { nombre: 'ASC' } as never });
  }

  obtener(id: number): Promise<T | null> {
    return this.repo.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  porNombre(nombre: string, excluirId?: number): Promise<T | null> {
    return this.repo
      .findOne({
        where: { nombre } as FindOptionsWhere<T>,
      })
      .then((encontrado) => {
        if (!encontrado) return null;
        return excluirId !== undefined && encontrado.id === excluirId
          ? null
          : encontrado;
      });
  }

  async crear(datos: DeepPartial<T>): Promise<T> {
    return this.repo.save(this.repo.create(datos));
  }

  guardar(entidad: T): Promise<T> {
    return this.repo.save(entidad as DeepPartial<T> as T);
  }

  async eliminar(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  abstract tieneProductos(id: number): Promise<boolean>;
}

@Injectable()
export class CategoriasRepository extends CatalogoRepository<Categoria> {
  constructor(
    @InjectRepository(Categoria) repo: Repository<Categoria>,
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {
    super(repo);
  }

  tieneProductos(id: number): Promise<boolean> {
    return this.productos.existsBy({ categoria_id: id });
  }
}

@Injectable()
export class ColeccionesRepository extends CatalogoRepository<Coleccion> {
  constructor(
    @InjectRepository(Coleccion) repo: Repository<Coleccion>,
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {
    super(repo);
  }

  tieneProductos(id: number): Promise<boolean> {
    return this.productos.existsBy({ coleccion_id: id });
  }
}

@Injectable()
export class ColoresRepository extends CatalogoRepository<Color> {
  constructor(
    @InjectRepository(Color) repo: Repository<Color>,
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {
    super(repo);
  }

  tieneProductos(id: number): Promise<boolean> {
    return this.productos.existsBy({ color_id: id });
  }
}

@Injectable()
export class TallasRepository extends CatalogoRepository<Talla> {
  constructor(
    @InjectRepository(Talla) repo: Repository<Talla>,
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {
    super(repo);
  }

  tieneProductos(id: number): Promise<boolean> {
    return this.productos.existsBy({ talla_id: id });
  }
}

@Injectable()
export class TemporadasRepository extends CatalogoRepository<Temporada> {
  constructor(
    @InjectRepository(Temporada) repo: Repository<Temporada>,
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {
    super(repo);
  }

  tieneProductos(id: number): Promise<boolean> {
    return this.productos.existsBy({ temporada_id: id });
  }
}

@Injectable()
export class ProveedoresRepository extends CatalogoRepository<Proveedor> {
  constructor(
    @InjectRepository(Proveedor) repo: Repository<Proveedor>,
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {
    super(repo);
  }

  tieneProductos(id: number): Promise<boolean> {
    return this.productos.existsBy({ proveedor_id: id });
  }
}
