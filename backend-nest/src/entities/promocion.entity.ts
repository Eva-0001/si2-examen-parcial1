import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Sucursal } from './sucursal.entity.js';

@Entity('promociones')
export class Promocion {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio: string;

  @Column({ name: 'fecha_final', type: 'date' })
  fecha_final: string;

  @Column({ name: 'foto', type: 'varchar', length: 255, nullable: true })
  foto: string | null;

  @Column({ name: 'sucursal_id', type: 'int' })
  sucursal_id: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.promociones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal?: Relation<Sucursal> | null;
}
