import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { aIsoSinZona } from '../commons/fechas.js';
import { Venta } from './venta.entity.js';

@Entity('comprobantes')
export class Comprobante {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre: string;

  @Column({ name: 'cantidad', type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'monto', type: 'numeric', precision: 10, scale: 2 })
  monto: string;

  @Transform(({ value }) => aIsoSinZona(value), { toPlainOnly: true })
  @CreateDateColumn({ name: 'fecha', type: 'timestamp' })
  fecha: Date;

  @Column({ name: 'venta_id', type: 'int' })
  venta_id: number;

  @ManyToOne(() => Venta, (venta) => venta.comprobantes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'venta_id' })
  venta?: Relation<Venta> | null;
}
