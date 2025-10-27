import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pareo } from './pareo.entity';
import { Apostador } from './apostador.entity';
import { TipoRodada } from './tipo-rodada.entity';

@Entity('apostas')
export class Aposta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campeonatoId: number;

  @Column()
  tipoRodadaId: number;

  @Column()
  nomeRodada: string;

  @Column()
  pareoId: number;

  @Column()
  apostadorId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valorOriginal: number;

  @Column('decimal', { precision: 5, scale: 2 })
  porcentagemAposta: number;

  @Column('decimal', { precision: 5, scale: 2 })
  porcentagemPremio: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valorPremio: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valorOriginalPremio: number;

  @Column('decimal', { precision: 5, scale: 2 })
  porcentagemRetirada: number;

  @ManyToOne(() => TipoRodada)
  @JoinColumn({ name: 'tipoRodadaId' })
  tipoRodada: TipoRodada;

  @ManyToOne(() => Pareo)
  @JoinColumn({ name: 'pareoId' })
  pareo: Pareo;

  @ManyToOne(() => Apostador)
  @JoinColumn({ name: 'apostadorId' })
  apostador: Apostador;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
