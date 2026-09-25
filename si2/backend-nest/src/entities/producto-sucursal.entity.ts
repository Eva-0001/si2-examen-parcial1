import { Expose } from 'class-transformer';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { DetalleVenta } from './detalle-venta.entity.js';
import { Producto } from './producto.entity.js';
import { ReservaSucursal } from './reserva-sucursal.entity.js';
import { Sucursal } from './sucursal.entity.js';

@Entity('producto_sucursal')
@Unique('uq_producto_sucursal', ['producto_id', 'sucursal_id'])
@Check('ck_producto_sucursal_cantidad', '"cantidad" >= 0')
@Check(
  'ck_producto_sucursal_reservada',
  '"cantidad_reservada" >= 0 AND "cantidad_reservada" <= "cantidad"',
)
export class ProductoSucursal {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'cantidad', type: 'int', default: 0 })
  cantidad: number;

  @Column({ name: 'cantidad_reservada', type: 'int', default: 0 })
  cantidad_reservada: number;

  @Column({ name: 'precio', type: 'numeric', precision: 10, scale: 2 })
  precio: string;

  @Index('ix_producto_sucursal_producto')
  @Column({ name: 'producto_id', type: 'int' })
  producto_id: number;

  @Index('ix_producto_sucursal_sucursal')
  @Column({ name: 'sucursal_id', type: 'int' })
  sucursal_id: number;

  @ManyToOne(() => Producto, (producto) => producto.productos_sucursal, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto?: Relation<Producto> | null;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.productos_sucursal, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal?: Relation<Sucursal> | null;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.producto_sucursal)
  detalles_venta?: Relation<DetalleVenta>[];

  @OneToMany(() => ReservaSucursal, (detalle) => detalle.producto_sucursal)
  reservas_sucursal?: Relation<ReservaSucursal>[];

  @Expose()
  get disponible(): number {
    return this.cantidad - this.cantidad_reservada;
  }
}
