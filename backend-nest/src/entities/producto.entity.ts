import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Categoria } from './categoria.entity.js';
import { Coleccion } from './coleccion.entity.js';
import { Color } from './color.entity.js';
import { ProductoSucursal } from './producto-sucursal.entity.js';
import { Proveedor } from './proveedor.entity.js';
import { Talla } from './talla.entity.js';
import { Temporada } from './temporada.entity.js';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre: string;

  @Column({ name: 'foto', type: 'varchar', length: 255, nullable: true })
  foto: string | null;

  @Column({ name: 'precio', type: 'numeric', precision: 10, scale: 2 })
  precio: string;

  @Column({ name: 'categoria_id', type: 'int', nullable: true })
  categoria_id: number | null;

  @Column({ name: 'coleccion_id', type: 'int', nullable: true })
  coleccion_id: number | null;

  @Column({ name: 'color_id', type: 'int', nullable: true })
  color_id: number | null;

  @Column({ name: 'talla_id', type: 'int', nullable: true })
  talla_id: number | null;

  @Column({ name: 'temporada_id', type: 'int', nullable: true })
  temporada_id: number | null;

  @Column({ name: 'proveedor_id', type: 'int', nullable: true })
  proveedor_id: number | null;

  @ManyToOne(() => Categoria, (categoria) => categoria.productos)
  @JoinColumn({ name: 'categoria_id' })
  categoria?: Relation<Categoria> | null;

  @ManyToOne(() => Coleccion, (coleccion) => coleccion.productos)
  @JoinColumn({ name: 'coleccion_id' })
  coleccion?: Relation<Coleccion> | null;

  @ManyToOne(() => Color, (color) => color.productos)
  @JoinColumn({ name: 'color_id' })
  color?: Relation<Color> | null;

  @ManyToOne(() => Talla, (talla) => talla.productos)
  @JoinColumn({ name: 'talla_id' })
  talla?: Relation<Talla> | null;

  @ManyToOne(() => Temporada, (temporada) => temporada.productos)
  @JoinColumn({ name: 'temporada_id' })
  temporada?: Relation<Temporada> | null;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor?: Relation<Proveedor> | null;

  @OneToMany(() => ProductoSucursal, (stock) => stock.producto)
  productos_sucursal?: Relation<ProductoSucursal>[];
}
