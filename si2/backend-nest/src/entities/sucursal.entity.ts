import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Ciudad } from './ciudad.entity.js';
import { ProductoSucursal } from './producto-sucursal.entity.js';
import { Promocion } from './promocion.entity.js';
import { Trabajador } from './trabajador.entity.js';

@Entity('sucursales')
export class Sucursal {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'ubicacion', type: 'varchar', length: 255, nullable: true })
  ubicacion: string | null;

  @Column({ name: 'foto', type: 'varchar', length: 255, nullable: true })
  foto: string | null;

  @Column({ name: 'ciudad_id', type: 'int' })
  ciudad_id: number;

  @ManyToOne(() => Ciudad, (ciudad) => ciudad.sucursales)
  @JoinColumn({ name: 'ciudad_id' })
  ciudad?: Relation<Ciudad> | null;

  @OneToMany(() => Trabajador, (trabajador) => trabajador.sucursal)
  trabajadores?: Relation<Trabajador>[];

  @OneToMany(() => Promocion, (promocion) => promocion.sucursal)
  promociones?: Relation<Promocion>[];

  @OneToMany(() => ProductoSucursal, (stock) => stock.sucursal)
  productos_sucursal?: Relation<ProductoSucursal>[];
}
