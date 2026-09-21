import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { TipoVenta } from '../commons/enums/tipo-venta.enum.js';
import { aIsoSinZona } from '../commons/fechas.js';
import { Comprobante } from './comprobante.entity.js';
import { DetalleVenta } from './detalle-venta.entity.js';
import { Usuario } from './usuario.entity.js';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({
    name: 'tipo_venta',
    type: 'enum',
    enum: TipoVenta,
    enumName: 'tipo_venta_enum',
  })
  tipo_venta: TipoVenta;

  @Column({
    name: 'total',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  total: string;

  @Index('ix_ventas_pago_id', { unique: true })
  @Column({ name: 'pago_id', type: 'varchar', length: 255, nullable: true })
  pago_id: string | null;

  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id: number;

  @Transform(({ value }) => aIsoSinZona(value), { toPlainOnly: true })
  @Index('ix_ventas_creada_en')
  @CreateDateColumn({ name: 'creada_en', type: 'timestamp' })
  creada_en: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.ventas)
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario> | null;

  @OneToMany(() => Comprobante, (comprobante) => comprobante.venta, {
    cascade: true,
  })
  comprobantes?: Relation<Comprobante>[];

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta, { cascade: true })
  detalles?: Relation<DetalleVenta>[];
}
