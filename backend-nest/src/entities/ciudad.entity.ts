import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Sucursal } from './sucursal.entity.js';

@Entity('ciudades')
export class Ciudad {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100, unique: true })
  nombre: string;

  @OneToMany(() => Sucursal, (sucursal) => sucursal.ciudad)
  sucursales?: Relation<Sucursal>[];
}
