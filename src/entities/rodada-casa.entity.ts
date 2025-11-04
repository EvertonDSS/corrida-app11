import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Campeonato } from './campeonato.entity';

@Entity('rodadas_casa')
export class RodadaCasa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campeonatoId: number;

  @ManyToOne(() => Campeonato)
  @JoinColumn({ name: 'campeonatoId' })
  campeonato: Campeonato;

  @Column()
  rodada: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valorCasa: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
