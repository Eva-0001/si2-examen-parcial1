import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ProductoSucursal } from './producto-sucursal.entity.js';
import { Reserva } from './reserva.entity.js';

@Entity('reserva_sucursal')
export class ReservaSucursal {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'cantidad', type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'reserva_id', type: 'int' })
  reserva_id: number;

  @Column({ name: 'producto_sucursal_id', type: 'int' })
  producto_sucursal_id: number;

  @ManyToOne(() => Reserva, (reserva) => reserva.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reserva_id' })
  reserva?: Relation<Reserva> | null;

  @ManyToOne(() => ProductoSucursal, (stock) => stock.reservas_sucursal)
  @JoinColumn({ name: 'producto_sucursal_id' })
  producto_sucursal?: Relation<ProductoSucursal> | null;
}
