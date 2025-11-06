import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Campeonato } from './campeonato.entity';
import { Cavalo } from './cavalo.entity';

@Entity('vencedores_rodada')
@Index(['campeonatoId', 'nomeRodada'], { unique: true })
export class VencedorRodada {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campeonatoId: number;

  @Column()
  nomeRodada: string;

  @Column({ nullable: true })
  cavaloId?: number | null;

  @ManyToOne(() => Campeonato)
  @JoinColumn({ name: 'campeonatoId' })
  campeonato: Campeonato;

  @ManyToOne(() => Cavalo, { nullable: true })
  @JoinColumn({ name: 'cavaloId' })
  cavalo?: Cavalo | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


