import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Usuario } from './usuario.entity.js';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50, unique: true })
  nombre: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios?: Relation<Usuario>[];
}
