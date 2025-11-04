import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RodadaCasa } from '../entities/rodada-casa.entity';
import { Campeonato } from '../entities/campeonato.entity';
import { CreateRodadaCasaDto } from '../dto/create-rodada-casa.dto';

@Injectable()
export class RodadaCasaService {
  constructor(
    @InjectRepository(RodadaCasa)
    private readonly rodadaCasaRepository: Repository<RodadaCasa>,
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
  ) {}

  async criarRodadaCasa(campeonatoId: number, createDto: CreateRodadaCasaDto): Promise<RodadaCasa> {
    const campeonato = await this.campeonatoRepository.findOne({ where: { id: campeonatoId } });
    if (!campeonato) {
      throw new NotFoundException(`Campeonato ${campeonatoId} não encontrado`);
    }

    const rodadaCasa = this.rodadaCasaRepository.create({
      campeonatoId,
      rodada: createDto.Rodada,
      valorCasa: createDto.ValorCasa,
    });

    return await this.rodadaCasaRepository.save(rodadaCasa);
  }

  async buscarRodadasCasaPorCampeonato(campeonatoId: number): Promise<RodadaCasa[]> {
    const campeonato = await this.campeonatoRepository.findOne({ where: { id: campeonatoId } });
    if (!campeonato) {
      throw new NotFoundException(`Campeonato ${campeonatoId} não encontrado`);
    }

    return await this.rodadaCasaRepository.find({
      where: { campeonatoId },
      order: { rodada: 'ASC' },
    });
  }

  async buscarRodadaCasaPorId(id: number): Promise<RodadaCasa> {
    const rodadaCasa = await this.rodadaCasaRepository.findOne({ where: { id } });
    if (!rodadaCasa) {
      throw new NotFoundException(`Rodada casa ${id} não encontrada`);
    }
    return rodadaCasa;
  }
}
