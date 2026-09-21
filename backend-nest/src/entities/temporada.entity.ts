import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';

@Entity('temporadas')
export class Temporada {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50, unique: true })
  nombre: string;

  @OneToMany(() => Producto, (producto) => producto.temporada)
  productos?: Relation<Producto>[];
}
