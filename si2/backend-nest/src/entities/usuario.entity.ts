import { Exclude } from 'class-transformer';
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
import { Genero } from '../commons/enums/genero.enum.js';
import { Reserva } from './reserva.entity.js';
import { Rol } from './rol.entity.js';
import { Venta } from './venta.entity.js';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'apellido', type: 'varchar', length: 100 })
  apellido: string;

  @Index('ix_usuarios_correo', { unique: true })
  @Column({ name: 'correo', type: 'varchar', length: 150 })
  correo: string;

  @Index('ix_usuarios_username', { unique: true })
  @Column({ name: 'username', type: 'varchar', length: 50 })
  username: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({
    name: 'genero',
    type: 'enum',
    enum: Genero,
    enumName: 'genero_enum',
    nullable: true,
  })
  genero: Genero | null;

  @Column({ name: 'rol_id', type: 'int' })
  rol_id: number;

  @Exclude()
  @Column({ name: 'tipo', type: 'varchar', length: 20, default: 'usuario' })
  tipo: string;

  @ManyToOne(() => Rol, (rol) => rol.usuarios)
  @JoinColumn({ name: 'rol_id' })
  rol?: Relation<Rol> | null;

  @OneToMany(() => Venta, (venta) => venta.usuario)
  ventas?: Relation<Venta>[];

  @OneToMany(() => Reserva, (reserva) => reserva.usuario)
  reservas?: Relation<Reserva>[];
}
