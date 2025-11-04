import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ganhadores_possiveis')
export class GanhadorPossivel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campeonatoId: number;

  @Column()
  tipoRodadaId: number;

  @Column()
  cavaloId: number;

  @Column({ default: false })
  isVencedor: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
