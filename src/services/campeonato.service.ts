import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campeonato } from '../entities/campeonato.entity';

@Injectable()
export class CampeonatoService {
  constructor(
    @InjectRepository(Campeonato)
    private campeonatoRepository: Repository<Campeonato>,
  ) {}

  async create(campeonatoData: { nome: string }): Promise<Campeonato> {
    // Verifica se já existe um campeonato com o mesmo nome (case insensitive)
    const existingCampeonato = await this.campeonatoRepository.findOne({
      where: { nome: campeonatoData.nome }
    });

    if (existingCampeonato) {
      throw new ConflictException('Já existe um campeonato com este nome');
    }

    const campeonato = this.campeonatoRepository.create(campeonatoData);
    return await this.campeonatoRepository.save(campeonato);
  }

  async findAll(): Promise<Campeonato[]> {
    return await this.campeonatoRepository.find();
  }

  async findOne(id: number): Promise<Campeonato> {
    const campeonato = await this.campeonatoRepository.findOne({ where: { id } });
    if (!campeonato) {
      throw new NotFoundException('Campeonato not found');
    }
    return campeonato;
  }

  async remove(id: number): Promise<void> {
    const campeonato = await this.findOne(id); // Verifica se existe
    await this.campeonatoRepository.delete(id);
  }
}
