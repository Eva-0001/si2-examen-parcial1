import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Usuario } from './usuario.entity.js';

@Entity('sesiones')
export class Sesion {
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  id: string;

  @Index('ix_sesiones_usuario')
  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id: number;

  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  token_hash: string;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expira_en: Date;

  @CreateDateColumn({ name: 'creada_en', type: 'timestamptz' })
  creada_en: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario> | null;
}
