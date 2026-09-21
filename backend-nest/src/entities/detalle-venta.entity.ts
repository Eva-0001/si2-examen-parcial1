import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ProductoSucursal } from './producto-sucursal.entity.js';
import { Venta } from './venta.entity.js';

@Entity('detalle_venta')
export class DetalleVenta {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'cantidad', type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'precio', type: 'numeric', precision: 10, scale: 2 })
  precio: string;

  @Column({ name: 'venta_id', type: 'int' })
  venta_id: number;

  @Column({ name: 'producto_sucursal_id', type: 'int' })
  producto_sucursal_id: number;

  @ManyToOne(() => Venta, (venta) => venta.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_id' })
  venta?: Relation<Venta> | null;

  @ManyToOne(() => ProductoSucursal, (stock) => stock.detalles_venta)
  @JoinColumn({ name: 'producto_sucursal_id' })
  producto_sucursal?: Relation<ProductoSucursal> | null;
}
