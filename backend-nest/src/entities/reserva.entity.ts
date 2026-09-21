import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ReservaSucursal } from './reserva-sucursal.entity.js';
import { Sucursal } from './sucursal.entity.js';
import { Usuario } from './usuario.entity.js';

@Entity('reserva')
export class Reserva {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'fecha', type: 'date' })
  fecha: string;

  @Column({ name: 'hora', type: 'time' })
  hora: string;

  @Column({ name: 'asistencia', type: 'boolean', default: false })
  asistencia: boolean;

  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id: number;

  @Index('ix_reserva_sucursal')
  @Column({ name: 'sucursal_id', type: 'int', nullable: true })
  sucursal_id: number | null;

  @Column({ name: 'stock_liberado', type: 'boolean', default: false })
  stock_liberado: boolean;

  @ManyToOne(() => Usuario, (usuario) => usuario.reservas)
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario> | null;

  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal?: Relation<Sucursal> | null;

  @OneToMany(() => ReservaSucursal, (detalle) => detalle.reserva, {
    cascade: true,
  })
  detalles?: Relation<ReservaSucursal>[];
}
