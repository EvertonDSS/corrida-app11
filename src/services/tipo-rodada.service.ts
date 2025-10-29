import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoRodada } from '../entities/tipo-rodada.entity';
import { Aposta } from '../entities/aposta.entity';

@Injectable()
export class TipoRodadaService {
  constructor(
    @InjectRepository(TipoRodada)
    private tipoRodadaRepository: Repository<TipoRodada>,
    @InjectRepository(Aposta)
    private apostaRepository: Repository<Aposta>,
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

  async listarTiposPorCampeonato(campeonatoId: number): Promise<any> {
    // Busca tipos de rodada únicos que têm apostas no campeonato
    const tiposIds = await this.apostaRepository
      .createQueryBuilder('aposta')
      .select('DISTINCT aposta.tipoRodadaId', 'tipoRodadaId')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .getRawMany();

    if (tiposIds.length === 0) {
      throw new NotFoundException(`Nenhum tipo de rodada encontrado para o campeonato ${campeonatoId}`);
    }

    const ids = tiposIds.map(item => item.tipoRodadaId);

    // Busca os tipos de rodada pelos IDs
    const tipos = await this.tipoRodadaRepository
      .createQueryBuilder('tipoRodada')
      .where('tipoRodada.id IN (:...ids)', { ids })
      .orderBy('tipoRodada.nome', 'ASC')
      .getMany();

    return {
      campeonatoId,
      totalTipos: tipos.length,
      tipos: tipos.map(tipo => ({
        id: tipo.id,
        nome: tipo.nome,
        createdAt: tipo.createdAt,
        updatedAt: tipo.updatedAt
      }))
    };
  }
}
