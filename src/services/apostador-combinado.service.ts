import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApostadorCombinado } from '../entities/apostador-combinado.entity';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';

@Injectable()
export class ApostadorCombinadoService {
  constructor(
    @InjectRepository(ApostadorCombinado)
    private readonly apostadorCombinadoRepository: Repository<ApostadorCombinado>,
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
    @InjectRepository(Aposta)
    private readonly apostaRepository: Repository<Aposta>,
    @InjectRepository(PareoExcluido)
    private readonly pareoExcluidoRepository: Repository<PareoExcluido>,
  ) {}

  async definirCombinados(campeonatoId: number, nomesApostadores: string[]): Promise<ApostadorCombinado[]> {
    const campeonato = await this.campeonatoRepository.findOne({ where: { id: campeonatoId } });

    if (!campeonato) {
      throw new NotFoundException(`Campeonato ${campeonatoId} não encontrado.`);
    }

    const nomesNormalizados = Array.from(
      new Set(
        nomesApostadores
          .map(nome => nome?.trim())
          .filter((nome): nome is string => !!nome),
      ),
    );

    if (!nomesNormalizados.length) {
      return this.apostadorCombinadoRepository.find({ where: { campeonatoId }, order: { nomeApostador: 'ASC' } });
    }

    const existentes = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
    });

    const existentesMap = new Map<string, ApostadorCombinado>();
    existentes.forEach(item => existentesMap.set(item.nomeApostador.toLowerCase(), item));

    const novosRegistros: ApostadorCombinado[] = [];
    for (const nome of nomesNormalizados) {
      const chave = nome.toLowerCase();
      if (!existentesMap.has(chave)) {
        const novo = this.apostadorCombinadoRepository.create({
          campeonatoId,
          nomeApostador: nome,
        });
        novosRegistros.push(novo);
      }
    }

    if (novosRegistros.length) {
      await this.apostadorCombinadoRepository.save(novosRegistros);
    }

    return this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { nomeApostador: 'ASC' },
    });
  }

  async listarPorCampeonato(campeonatoId: number): Promise<ApostadorCombinado[]> {
    return this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { nomeApostador: 'ASC' },
    });
  }

  async listarApostasCombinadas(campeonatoId: number): Promise<Record<string, any[]>> {
    const combinados = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { nomeApostador: 'ASC' },
    });

    if (!combinados.length) {
      return {};
    }

    const nomesNormalizados = combinados.map(item => item.nomeApostador.trim().toLowerCase());

    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .getMany();

    const resposta: Record<string, any[]> = {};

    apostas.forEach(aposta => {
      const nomeApostador = aposta.apostador?.nome?.trim();
      if (!nomeApostador) {
        return;
      }
      const nomeNormalizado = nomeApostador.toLowerCase();
      if (!nomesNormalizados.includes(nomeNormalizado)) {
        return;
      }

      if (!resposta[nomeApostador]) {
        resposta[nomeApostador] = [];
      }

      resposta[nomeApostador].push({
        id: aposta.id,
        tipoRodadaId: aposta.tipoRodadaId,
        nomeRodada: aposta.nomeRodada,
        pareo: aposta.pareo
          ? {
              id: aposta.pareo.id,
              numero: aposta.pareo.numero,
            }
          : null,
        valor: aposta.valor,
        valorOriginal: aposta.valorOriginal,
        porcentagemAposta: aposta.porcentagemAposta,
        porcentagemPremio: aposta.porcentagemPremio,
        valorPremio: aposta.valorPremio,
        valorOriginalPremio: aposta.valorOriginalPremio,
        porcentagemRetirada: aposta.porcentagemRetirada,
      });
    });

    return resposta;
  }

  async obterDetalhesApostaCombinada(
    campeonatoId: number,
    apostaId: number,
  ): Promise<{
    apostadores: { id: number; nome: string; createdAt: Date; updatedAt: Date }[];
    apostasPorRodada: Array<{
      nomeRodada: string;
      tipoRodada: any;
      apostas: any[];
      totalRodada: number;
      totalRodadaCalculado: boolean;
    }>;
    totalApostado: number;
    totalPremio: number;
    totalApostas: number;
    totalRodadas: number;
    pareosExcluidos: any[];
  }> {
    const apostaBase = await this.apostaRepository.findOne({
      where: { id: apostaId, campeonatoId },
      relations: ['apostador', 'tipoRodada'],
    });

    if (!apostaBase) {
      throw new NotFoundException(
        `Aposta combinada ${apostaId} não encontrada para o campeonato ${campeonatoId}.`,
      );
    }

    const apostadorNome = apostaBase.apostador?.nome?.trim();
    if (!apostadorNome) {
      throw new NotFoundException(`Aposta ${apostaId} não possui apostador vinculado.`);
    }

    const combinados = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
    });

    const nomesCombinados = new Set(
      combinados.map(item => item.nomeApostador.trim().toLowerCase()),
    );

    if (!nomesCombinados.has(apostadorNome.toLowerCase())) {
      throw new NotFoundException(
        `Apostador "${apostadorNome}" não está marcado como combinado no campeonato ${campeonatoId}.`,
      );
    }

    const apostasDoApostador = await this.apostaRepository.find({
      where: { campeonatoId, apostadorId: apostaBase.apostadorId },
      relations: ['tipoRodada', 'apostador', 'pareo', 'pareo.cavalos'],
      order: { nomeRodada: 'ASC' },
    });

    const apostasPorRodadaMap = new Map<
      string,
      {
        nomeRodada: string;
        tipoRodada: any;
        apostas: Aposta[];
      }
    >();

    let totalApostado = 0;
    let totalPremio = 0;

    apostasDoApostador.forEach(aposta => {
      const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
      if (!apostasPorRodadaMap.has(chaveRodada)) {
        apostasPorRodadaMap.set(chaveRodada, {
          nomeRodada: aposta.nomeRodada,
          tipoRodada: aposta.tipoRodada,
          apostas: [],
        });
      }

      const grupoRodada = apostasPorRodadaMap.get(chaveRodada)!;

      grupoRodada.apostas.push(aposta);
      totalApostado += Number(aposta.valor || 0);
      totalPremio += Number(aposta.valorPremio || 0);
    });

    const apostasPorRodada = Array.from(apostasPorRodadaMap.values()).map(rodada => {
      const apostasFormatadas = rodada.apostas.map(aposta => this.formatarAposta(aposta));
      const totalRodada = apostasFormatadas.reduce(
        (sum, aposta) => sum + Number(aposta.valorPremio || 0),
        0,
      );

      const tipoRodadaFormatada = rodada.tipoRodada
        ? {
            id: rodada.tipoRodada.id,
            nome: rodada.tipoRodada.nome,
            createdAt: rodada.tipoRodada.createdAt,
            updatedAt: rodada.tipoRodada.updatedAt,
          }
        : null;

      return {
        nomeRodada: rodada.nomeRodada,
        tipoRodada: tipoRodadaFormatada,
        apostas: apostasFormatadas,
        totalRodada: Number(totalRodada.toFixed(2)),
        totalRodadaCalculado: true,
      };
    });

    const rodadasChaves = apostasPorRodada.map(rodada => ({
      nomeRodada: rodada.nomeRodada,
      tipoRodadaId: rodada.tipoRodada?.id ?? rodada.apostas[0]?.tipoRodadaId,
    }));

    const pareosExcluidos = await this.obterPareosExcluidosDetalhados(
      campeonatoId,
      apostasDoApostador,
    );

    return {
      apostadores: this.formatarApostadores(apostasDoApostador),
      apostasPorRodada,
      totalApostado: Number(totalApostado.toFixed(2)),
      totalPremio: Number(totalPremio.toFixed(2)),
      totalApostas: apostasDoApostador.length,
      totalRodadas: apostasPorRodada.length,
      pareosExcluidos,
    };
  }

  private formatarApostadores(apostas: Aposta[]) {
    const vistos = new Map<number, Aposta['apostador']>();
    for (const aposta of apostas) {
      if (aposta.apostador && !vistos.has(aposta.apostador.id)) {
        vistos.set(aposta.apostador.id, aposta.apostador);
      }
    }

    return Array.from(vistos.values()).map(apostador => ({
      id: apostador!.id,
      nome: apostador!.nome,
      createdAt: apostador!.createdAt,
      updatedAt: apostador!.updatedAt,
    }));
  }

  private formatarAposta(aposta: Aposta) {
    return {
      id: aposta.id,
      campeonatoId: aposta.campeonatoId,
      tipoRodadaId: aposta.tipoRodadaId,
      nomeRodada: aposta.nomeRodada,
      pareoId: aposta.pareoId,
      apostadorId: aposta.apostadorId,
      valor: Number(aposta.valor || 0),
      valorOriginal: aposta.valorOriginal,
      porcentagemAposta: aposta.porcentagemAposta,
      porcentagemPremio: aposta.porcentagemPremio,
      valorPremio: Number(aposta.valorPremio || 0),
      valorOriginalPremio: aposta.valorOriginalPremio,
      porcentagemRetirada: aposta.porcentagemRetirada,
      tipoRodada: aposta.tipoRodada
        ? {
            id: aposta.tipoRodada.id,
            nome: aposta.tipoRodada.nome,
            createdAt: aposta.tipoRodada.createdAt,
            updatedAt: aposta.tipoRodada.updatedAt,
          }
        : null,
      pareo: aposta.pareo
        ? {
            id: aposta.pareo.id,
            campeonatoId: aposta.pareo.campeonatoId,
            tipoRodadaId: aposta.pareo.tipoRodadaId,
            numero: aposta.pareo.numero,
            cavalos: aposta.pareo.cavalos?.map(cavalo => ({
              id: cavalo.id,
              pareoId: cavalo.pareoId,
              nome: cavalo.nome,
              identificador: cavalo.identificador,
              createdAt: cavalo.createdAt,
              updatedAt: cavalo.updatedAt,
            })),
            createdAt: aposta.pareo.createdAt,
            updatedAt: aposta.pareo.updatedAt,
          }
        : null,
      apostador: aposta.apostador
        ? {
            id: aposta.apostador.id,
            nome: aposta.apostador.nome,
            createdAt: aposta.apostador.createdAt,
            updatedAt: aposta.apostador.updatedAt,
          }
        : null,
      createdAt: aposta.createdAt,
      updatedAt: aposta.updatedAt,
    };
  }

  private async obterPareosExcluidosDetalhados(campeonatoId: number, apostas: Aposta[]): Promise<any[]> {
    const excluidos = await this.pareoExcluidoRepository.find({ where: { campeonatoId } });

    if (!excluidos.length) {
      return [];
    }

    const rodadas = new Map<string, { nomeRodada: string; tipoRodadaId: number; tipoRodada?: any }>();
    for (const aposta of apostas) {
      const chave = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
      if (!rodadas.has(chave)) {
        rodadas.set(chave, {
          nomeRodada: aposta.nomeRodada,
          tipoRodadaId: aposta.tipoRodadaId,
          tipoRodada: aposta.tipoRodada
            ? {
                id: aposta.tipoRodada.id,
                nome: aposta.tipoRodada.nome,
              }
            : undefined,
        });
      }
    }

    const resultado: any[] = [];

    for (const { nomeRodada, tipoRodadaId, tipoRodada } of rodadas.values()) {
      const excluidosRodada = excluidos.filter(ex => ex.tipoRodadaId === tipoRodadaId);

      for (const excluido of excluidosRodada) {
        const apostasPareo = await this.apostaRepository.find({
          where: {
            campeonatoId,
            tipoRodadaId,
            nomeRodada,
          },
          relations: ['pareo'],
        });

        const apostasDoPareo = apostasPareo.filter(
          aposta => aposta.pareo?.numero === excluido.numeroPareo,
        );

        const valorExcluido = apostasDoPareo.reduce((sum, aposta) => sum + Number(aposta.valor || 0), 0);

        resultado.push({
          chaveRodada: `${nomeRodada}-${tipoRodadaId}`,
          nomeRodada,
          tipoRodada: tipoRodada
            ? { id: tipoRodada.id, nome: tipoRodada.nome }
            : { id: tipoRodadaId, nome: null },
          numeroPareo: excluido.numeroPareo,
          valorExcluido: Number(valorExcluido.toFixed(2)),
          temApostasAtivas: apostasDoPareo.length > 0,
          quantidadeApostas: apostasDoPareo.length,
          dadosPareo: excluido.dadosPareo,
          createdAt: excluido.createdAt,
        });
      }
    }

    return resultado;
  }
}


