import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { Pareo } from '../entities/pareo.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';
import { RodadaCasa } from '../entities/rodada-casa.entity';
import { GanhadorPossivel } from '../entities/ganhador-possivel.entity';
import { Vencedor } from '../entities/vencedor.entity';
import { VencedorRodada } from '../entities/vencedor-rodada.entity';
import { ApostadorCombinado } from '../entities/apostador-combinado.entity';

@Injectable()
export class CampeonatoService {
  constructor(
    @InjectRepository(Campeonato)
    private campeonatoRepository: Repository<Campeonato>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

  async remove(id: number): Promise<{
    message: string;
    resumo: Record<string, number>;
  }> {
    const campeonato = await this.findOne(id);

    const resumo = {
      apostas: 0,
      ganhadoresPossiveis: 0,
      vencedores: 0,
      vencedoresRodada: 0,
      apostadoresCombinados: 0,
      rodadasCasa: 0,
      pareosExcluidos: 0,
      cavalos: 0,
      pareos: 0,
      campeonatos: 0,
    };

    await this.dataSource.transaction(async manager => {
      resumo.apostas =
        (await manager.getRepository(Aposta).delete({ campeonatoId: id })).affected ?? 0;

      resumo.ganhadoresPossiveis =
        (await manager.getRepository(GanhadorPossivel).delete({ campeonatoId: id })).affected ?? 0;

      resumo.vencedoresRodada =
        (await manager.getRepository(VencedorRodada).delete({ campeonatoId: id })).affected ?? 0;

      resumo.vencedores =
        (await manager.getRepository(Vencedor).delete({ campeonatoId: id })).affected ?? 0;

      resumo.apostadoresCombinados =
        (await manager.getRepository(ApostadorCombinado).delete({ campeonatoId: id })).affected ?? 0;

      resumo.rodadasCasa =
        (await manager.getRepository(RodadaCasa).delete({ campeonatoId: id })).affected ?? 0;

      resumo.pareosExcluidos =
        (await manager.getRepository(PareoExcluido).delete({ campeonatoId: id })).affected ?? 0;

      const pareosIds = (
        await manager.getRepository(Pareo).find({
          where: { campeonatoId: id },
          select: ['id'],
        })
      ).map(pareo => pareo.id);

      if (pareosIds.length) {
        resumo.cavalos =
          (await manager.getRepository(Cavalo).delete({ pareoId: In(pareosIds) })).affected ?? 0;
      }

      resumo.pareos =
        (await manager.getRepository(Pareo).delete({ campeonatoId: id })).affected ?? 0;

      resumo.campeonatos =
        (await manager.getRepository(Campeonato).delete(id)).affected ?? 0;
    });

    return {
      message: `Campeonato "${campeonato.nome}" e todos os dados relacionados foram removidos com sucesso.`,
      resumo,
    };
  }
}
