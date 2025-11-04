import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GanhadorPossivel } from '../entities/ganhador-possivel.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { Aposta } from '../entities/aposta.entity';
import { TipoRodada } from '../entities/tipo-rodada.entity';
import { Pareo } from '../entities/pareo.entity';

@Injectable()
export class GanhadorPossivelService {
  constructor(
    @InjectRepository(GanhadorPossivel)
    private readonly ganhadorPossivelRepository: Repository<GanhadorPossivel>,
    @InjectRepository(Cavalo)
    private readonly cavaloRepository: Repository<Cavalo>,
    @InjectRepository(Aposta)
    private readonly apostaRepository: Repository<Aposta>,
    @InjectRepository(TipoRodada)
    private readonly tipoRodadaRepository: Repository<TipoRodada>,
    @InjectRepository(Pareo)
    private readonly pareoRepository: Repository<Pareo>,
  ) {}

  async definirGanhadoresPossiveis(
    campeonatoId: number,
    tipoRodadaId: number,
    cavalosIds: number[],
  ): Promise<GanhadorPossivel[]> {
    // Verifica se os cavalos existem
    const cavalos = await this.cavaloRepository.find({
      where: { id: In(cavalosIds) },
    });

    if (cavalos.length !== cavalosIds.length) {
      const idsEncontrados = cavalos.map(c => c.id);
      const idsNaoEncontrados = cavalosIds.filter(id => !idsEncontrados.includes(id));
      throw new NotFoundException(`Cavalos com IDs ${idsNaoEncontrados.join(', ')} não encontrados`);
    }

    // Remove registros existentes para este campeonato e tipo de rodada
    const registrosExistentes = await this.ganhadorPossivelRepository.find({
      where: { campeonatoId, tipoRodadaId },
    });

    if (registrosExistentes.length > 0) {
      await this.ganhadorPossivelRepository.remove(registrosExistentes);
    }

    // Cria novos registros
    const novosRegistros = cavalosIds.map(cavaloId => {
      return this.ganhadorPossivelRepository.create({
        campeonatoId,
        tipoRodadaId,
        cavaloId,
        isVencedor: false,
      });
    });

    return await this.ganhadorPossivelRepository.save(novosRegistros);
  }

  async definirVencedor(
    campeonatoId: number,
    tipoRodadaId: number,
    cavaloId: number,
  ): Promise<GanhadorPossivel> {
    // Busca o registro do ganhador possível
    const ganhadorPossivel = await this.ganhadorPossivelRepository.findOne({
      where: { campeonatoId, tipoRodadaId, cavaloId },
    });

    if (!ganhadorPossivel) {
      throw new NotFoundException(
        `Cavalo ${cavaloId} não está na lista de ganhadores possíveis para o campeonato ${campeonatoId} e tipo de rodada ${tipoRodadaId}`,
      );
    }

    // Remove o status de vencedor de todos os outros cavalos do mesmo campeonato e tipo de rodada
    await this.ganhadorPossivelRepository.update(
      { campeonatoId, tipoRodadaId },
      { isVencedor: false },
    );

    // Define este cavalo como vencedor
    ganhadorPossivel.isVencedor = true;
    return await this.ganhadorPossivelRepository.save(ganhadorPossivel);
  }

  async buscarGanhadoresPossiveis(
    campeonatoId: number,
    tipoRodadaId: number,
  ): Promise<GanhadorPossivel[]> {
    return await this.ganhadorPossivelRepository.find({
      where: { campeonatoId, tipoRodadaId },
      order: { cavaloId: 'ASC' },
    });
  }

  async buscarGanhadoresPossiveisComApostadores(campeonatoId: number): Promise<any[]> {
    // Busca todos os ganhadores possíveis do campeonato
    const ganhadoresPossiveis = await this.ganhadorPossivelRepository.find({
      where: { campeonatoId },
      order: { tipoRodadaId: 'ASC', cavaloId: 'ASC' },
    });

    if (ganhadoresPossiveis.length === 0) {
      return [];
    }

    // Busca os tipos de rodada únicos
    const tiposRodadaIds = [...new Set(ganhadoresPossiveis.map(g => g.tipoRodadaId))];
    const tiposRodada = await this.tipoRodadaRepository.find({
      where: { id: In(tiposRodadaIds) },
    });
    const tiposRodadaMap = new Map(tiposRodada.map(tipo => [tipo.id, tipo.nome]));

    // Busca os cavalos
    const cavalosIds = [...new Set(ganhadoresPossiveis.map(g => g.cavaloId))];
    const cavalos = await this.cavaloRepository.find({
      where: { id: In(cavalosIds) },
      relations: ['pareo'],
    });
    const cavalosMap = new Map(cavalos.map(cavalo => [cavalo.id, cavalo]));

    // Busca todas as apostas do campeonato relacionadas aos pareos dos cavalos possíveis ganhadores
    const pareosIds = cavalos.map(c => c.pareoId);
    const apostas = await this.apostaRepository.find({
      where: {
        campeonatoId,
        pareoId: In(pareosIds),
      },
      relations: ['apostador', 'pareo'],
    });

    // Agrupa por tipoRodadaId
    const agrupadoPorTipo = new Map<number, any>();

    for (const tipoRodadaId of tiposRodadaIds) {
      const ganhadoresDoTipo = ganhadoresPossiveis.filter(g => g.tipoRodadaId === tipoRodadaId);
      
      const cavalosComApostadores: any = {};
      
      for (const ganhador of ganhadoresDoTipo) {
        const cavalo = cavalosMap.get(ganhador.cavaloId);
        if (!cavalo) continue;

        // Busca apostas relacionadas a este pareo
        const apostasDoPareo = apostas.filter(a => a.pareoId === cavalo.pareoId);
        
        // Formata apostadores com nome e valorPremio
        const apostadores = apostasDoPareo.map(aposta => ({
          nomeapostador: aposta.apostador.nome,
          valorpremio: Number(aposta.valorPremio),
        }));

        // Usa o nome do cavalo como chave
        cavalosComApostadores[`cavalo${ganhador.cavaloId}`] = apostadores;
      }

      agrupadoPorTipo.set(tipoRodadaId, {
        tiporodada: tipoRodadaId,
        nometiporodada: tiposRodadaMap.get(tipoRodadaId) || '',
        ...cavalosComApostadores,
      });
    }

    return Array.from(agrupadoPorTipo.values());
  }
}
