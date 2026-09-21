import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100, unique: true })
  nombre: string;

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos?: Relation<Producto>[];
}
