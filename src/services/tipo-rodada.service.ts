import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoRodada } from '../entities/tipo-rodada.entity';

@Injectable()
export class TipoRodadaService {
  constructor(
    @InjectRepository(TipoRodada)
    private tipoRodadaRepository: Repository<TipoRodada>,
  ) {}

  async create(tipoRodadaData: { nome: string }): Promise<TipoRodada> {
    // Verifica se já existe um tipo de rodada com o mesmo nome (case insensitive)
    const existingTipoRodada = await this.tipoRodadaRepository.findOne({
      where: { nome: tipoRodadaData.nome }
    });

    if (existingTipoRodada) {
      throw new ConflictException('Já existe um tipo de rodada com este nome');
    }

    const tipoRodada = this.tipoRodadaRepository.create(tipoRodadaData);
    return await this.tipoRodadaRepository.save(tipoRodada);
  }

  async findAll(): Promise<TipoRodada[]> {
    return await this.tipoRodadaRepository.find();
  }

  async findOne(id: number): Promise<TipoRodada> {
    const tipoRodada = await this.tipoRodadaRepository.findOne({ where: { id } });
    if (!tipoRodada) {
      throw new NotFoundException('Tipo de rodada not found');
    }
    return tipoRodada;
  }

  async remove(id: number): Promise<void> {
    const tipoRodada = await this.findOne(id); // Verifica se existe
    await this.tipoRodadaRepository.delete(id);
  }
}
