import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Cavalo } from './cavalo.entity';

@Entity('pareos')
export class Pareo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campeonatoId: number;

  @Column()
  tipoRodadaId: number;

  @Column()
  numero: string;

  @OneToMany(() => Cavalo, cavalo => cavalo.pareo)
  cavalos: Cavalo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
