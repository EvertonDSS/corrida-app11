import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VencedorRodada } from '../entities/vencedor-rodada.entity';
import { CreateVencedorRodadaDto } from '../dto/create-vencedor-rodada.dto';
import { Campeonato } from '../entities/campeonato.entity';
import { Cavalo } from '../entities/cavalo.entity';

@Injectable()
export class VencedorRodadaService {
  constructor(
    @InjectRepository(VencedorRodada)
    private readonly vencedorRodadaRepository: Repository<VencedorRodada>,
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
    @InjectRepository(Cavalo)
    private readonly cavaloRepository: Repository<Cavalo>,
  ) {}

  async registrarOuAtualizarVencedor(
    campeonatoId: number,
    createDto: CreateVencedorRodadaDto,
  ): Promise<VencedorRodada> {
    const campeonato = await this.campeonatoRepository.findOne({
      where: { id: campeonatoId },
    });

    if (!campeonato) {
      throw new NotFoundException(`Campeonato com ID ${campeonatoId} não encontrado`);
    }

    const nomeRodadaNormalizado = createDto.nomeRodada.trim();

    let cavaloEncontrado: Cavalo | null = null;
    if (createDto.cavaloId) {
      cavaloEncontrado = await this.cavaloRepository
        .createQueryBuilder('cavalo')
        .innerJoin('cavalo.pareo', 'pareo')
        .where('cavalo.id = :cavaloId', { cavaloId: createDto.cavaloId })
        .andWhere('pareo.campeonatoId = :campeonatoId', { campeonatoId })
        .getOne();

      if (!cavaloEncontrado) {
        throw new NotFoundException(
          `Cavalo com ID ${createDto.cavaloId} não encontrado no campeonato ${campeonatoId}`,
        );
      }
    }

    const existente = await this.vencedorRodadaRepository.findOne({
      where: { campeonatoId, nomeRodada: nomeRodadaNormalizado },
    });

    if (existente) {
      existente.cavaloId = cavaloEncontrado?.id ?? null;
      existente.nomeRodada = nomeRodadaNormalizado;
      return this.vencedorRodadaRepository.save(existente);
    }

    const novo = this.vencedorRodadaRepository.create({
      campeonatoId,
      nomeRodada: nomeRodadaNormalizado,
      cavaloId: cavaloEncontrado?.id ?? null,
    });

    return this.vencedorRodadaRepository.save(novo);
  }

  async listarPorCampeonato(campeonatoId: number): Promise<VencedorRodada[]> {
    return this.vencedorRodadaRepository.find({
      where: { campeonatoId },
      order: { nomeRodada: 'ASC' },
    });
  }
}


