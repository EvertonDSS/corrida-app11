import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pareo } from './pareo.entity';

@Entity('cavalos')
export class Cavalo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pareoId: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  identificador: string;

  @ManyToOne(() => Pareo, pareo => pareo.cavalos)
  @JoinColumn({ name: 'pareoId' })
  pareo: Pareo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
