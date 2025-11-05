import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Campeonato } from './campeonato.entity';
import { Cavalo } from './cavalo.entity';

@Entity('vencedores')
export class Vencedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campeonatoId: number;

  @Column()
  cavaloId: number;

  @ManyToOne(() => Campeonato)
  @JoinColumn({ name: 'campeonatoId' })
  campeonato: Campeonato;

  @ManyToOne(() => Cavalo)
  @JoinColumn({ name: 'cavaloId' })
  cavalo: Cavalo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

