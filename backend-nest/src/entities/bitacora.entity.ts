import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { aIsoSinZona } from '../commons/fechas.js';

@Entity('bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'accion', type: 'varchar', length: 255 })
  accion: string;

  @Index('ix_bitacora_encargado')
  @Column({ name: 'encargado', type: 'varchar', length: 150 })
  encargado: string;

  @Column({ name: 'producto', type: 'varchar', length: 150, nullable: true })
  producto: string | null;

  @Column({ name: 'actor_id', type: 'int', nullable: true })
  actor_id: number | null;

  @Transform(({ value }) => aIsoSinZona(value), { toPlainOnly: true })
  @Index('ix_bitacora_fecha')
  @CreateDateColumn({ name: 'fecha', type: 'timestamp' })
  fecha: Date;
}
