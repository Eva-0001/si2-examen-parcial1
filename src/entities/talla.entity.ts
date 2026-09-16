import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';

@Entity('talla')
export class Talla {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 20, unique: true })
  nombre: string;

  @OneToMany(() => Producto, (producto) => producto.talla)
  productos?: Relation<Producto>[];
}
