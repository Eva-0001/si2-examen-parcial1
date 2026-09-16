import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Sucursal } from './sucursal.entity.js';
import { Usuario } from './usuario.entity.js';

@Entity('trabajador')
export class Trabajador {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  usuario?: Relation<Usuario>;

  @Index('ix_trabajador_codigo', { unique: true })
  @Column({ name: 'codigo', type: 'varchar', length: 50 })
  codigo: string;

  @Column({ name: 'fecha_contrato', type: 'date' })
  fecha_contrato: string;

  @Column({ name: 'sueldo', type: 'numeric', precision: 10, scale: 2 })
  sueldo: string;

  @Column({ name: 'sucursal_id', type: 'int', nullable: true })
  sucursal_id: number | null;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.trabajadores)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal?: Relation<Sucursal> | null;
}
