import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Aposta } from '../entities/aposta.entity';
import { TipoRodada } from '../entities/tipo-rodada.entity';

@Injectable()
export class RodadaService {
  constructor(
    @InjectRepository(Aposta)
    private apostaRepository: Repository<Aposta>,
    @InjectRepository(TipoRodada)
    private tipoRodadaRepository: Repository<TipoRodada>,
  ) {}

  async listarRodadasPorCampeonato(campeonatoId: number): Promise<any> {
    // Busca todas as apostas do campeonato com nomeRodada
    const apostas = await this.apostaRepository.find({
      where: { campeonatoId },
      select: ['tipoRodadaId', 'nomeRodada'],
    });

    if (apostas.length === 0) {
      throw new NotFoundException(`Nenhuma rodada encontrada para o campeonato ${campeonatoId}`);
    }

    // Agrupa por tipoRodadaId e coleta nomes únicos de rodadas
    const rodadasPorTipo = new Map<number, Set<string>>();

    for (const aposta of apostas) {
      if (!rodadasPorTipo.has(aposta.tipoRodadaId)) {
        rodadasPorTipo.set(aposta.tipoRodadaId, new Set<string>());
      }
      rodadasPorTipo.get(aposta.tipoRodadaId)!.add(aposta.nomeRodada);
    }

    // Busca os tipos de rodada pelos IDs encontrados
    const tiposRodadaIds = Array.from(rodadasPorTipo.keys());
    const tiposRodada = await this.tipoRodadaRepository.find({
      where: { id: In(tiposRodadaIds) },
    });

    // Cria um mapa de ID para nome do tipo de rodada
    const tiposRodadaMap = new Map(tiposRodada.map(tipo => [tipo.id, tipo.nome]));

    // Converte para o formato solicitado: {tiporodada: {tiporodada, nometiporodada, rodadas: [...]}}
    const resultado: any = {};
    for (const [tipoRodadaId, nomesRodadas] of rodadasPorTipo) {
      resultado[tipoRodadaId] = {
        tiporodada: tipoRodadaId,
        nometiporodada: tiposRodadaMap.get(tipoRodadaId) || '',
        rodadas: Array.from(nomesRodadas).sort(),
      };
    }

    return resultado;
  }
}

