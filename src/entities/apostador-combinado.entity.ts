import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Campeonato } from './campeonato.entity';

@Entity('apostadores_combinados')
@Index(['campeonatoId', 'nomeApostador'], { unique: true })
export class ApostadorCombinado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campeonatoId: number;

  @Column()
  nomeApostador: string;

  @ManyToOne(() => Campeonato, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campeonatoId' })
  campeonato: Campeonato;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


