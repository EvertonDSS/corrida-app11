import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ApostadorCombinado } from '../entities/apostador-combinado.entity';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';
import { DefinirApostadoresCombinadosDto, GrupoCombinadoDto } from '../dto/definir-apostadores-combinados.dto';
import { DescombinarApostadoresDto } from '../dto/descombinar-apostadores.dto';

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

  async definirCombinados(
    campeonatoId: number,
    payload: DefinirApostadoresCombinadosDto,
  ): Promise<Array<{ grupoIdentificador: string; apostadores: string[] }>> {
    const campeonato = await this.campeonatoRepository.findOne({ where: { id: campeonatoId } });

    if (!campeonato) {
      throw new NotFoundException(`Campeonato ${campeonatoId} não encontrado.`);
    }

    const gruposNormalizados = this.normalizarGruposEntrada(payload);

    if (!gruposNormalizados.length) {
      const combinadosExistentes = await this.apostadorCombinadoRepository.find({
        where: { campeonatoId },
        order: { grupoIdentificador: 'ASC', nomeApostador: 'ASC' },
      });

      return this.agruparCombinados(combinadosExistentes);
    }

    const existentes = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
    });

    const existentesPorNome = new Map<string, ApostadorCombinado>();
    existentes.forEach(item => existentesPorNome.set(this.normalizarNome(item.nomeApostador), item));

    const nomesProcessados = new Set<string>();
    const gruposAfetados = new Set<string>();
    const registrosParaAtualizar: ApostadorCombinado[] = [];
    const registrosParaCriar: ApostadorCombinado[] = [];

    for (const grupo of gruposNormalizados) {
      const identificadorGerado = this.gerarIdentificadorGrupo(grupo.nomes);
      const identificadorExistente = this.obterIdentificadorExistente(grupo.nomes, existentesPorNome);
      let grupoIdentificador =
        grupo.identificador || identificadorExistente || identificadorGerado || randomUUID();

      gruposAfetados.add(grupoIdentificador);

      for (const nome of grupo.nomes) {
        const chave = this.normalizarNome(nome);
        if (nomesProcessados.has(chave)) {
          throw new BadRequestException(`O apostador "${nome}" foi informado em mais de um grupo combinado.`);
        }
        nomesProcessados.add(chave);

        const existente = existentesPorNome.get(chave);
        if (existente) {
          gruposAfetados.add(existente.grupoIdentificador);
          if (
            existente.grupoIdentificador !== grupoIdentificador ||
            existente.nomeApostador.trim() !== nome
          ) {
            existente.grupoIdentificador = grupoIdentificador;
            existente.nomeApostador = nome;
            registrosParaAtualizar.push(existente);
          }
        } else {
          registrosParaCriar.push(
            this.apostadorCombinadoRepository.create({
              campeonatoId,
              nomeApostador: nome,
              grupoIdentificador,
            }),
          );
        }
      }
    }

    const registrosParaRemover = existentes.filter(existente => {
      if (!gruposAfetados.has(existente.grupoIdentificador)) {
        return false;
      }
      return !nomesProcessados.has(this.normalizarNome(existente.nomeApostador));
    });

    if (registrosParaRemover.length) {
      await this.apostadorCombinadoRepository.remove(registrosParaRemover);
    }

    if (registrosParaAtualizar.length) {
      await this.apostadorCombinadoRepository.save(registrosParaAtualizar);
    }

    if (registrosParaCriar.length) {
      await this.apostadorCombinadoRepository.save(registrosParaCriar);
    }

    const combinadosAtualizados = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { grupoIdentificador: 'ASC', nomeApostador: 'ASC' },
    });

    return this.agruparCombinados(combinadosAtualizados);
  }

  async listarPorCampeonato(
    campeonatoId: number,
  ): Promise<Array<{ grupoIdentificador: string; apostadores: string[] }>> {
    const combinados = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { grupoIdentificador: 'ASC', nomeApostador: 'ASC' },
    });

    return this.agruparCombinados(combinados);
  }

  async descombinarApostadores(
    campeonatoId: number,
    payload: DescombinarApostadoresDto,
  ): Promise<Array<{ grupoIdentificador: string; apostadores: string[] }>> {
    const campeonato = await this.campeonatoRepository.findOne({ where: { id: campeonatoId } });

    if (!campeonato) {
      throw new NotFoundException(`Campeonato ${campeonatoId} não encontrado.`);
    }

    if (!payload.nomesApostadores?.length && !payload.grupoIdentificador) {
      throw new BadRequestException(
        'É necessário informar pelo menos "nomesApostadores" ou "grupoIdentificador" para descombinar.',
      );
    }

    const combinadosExistentes = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
    });

    if (combinadosExistentes.length === 0) {
      return [];
    }

    let registrosParaRemover: ApostadorCombinado[] = [];

    if (payload.grupoIdentificador) {
      // Remove todo o grupo
      const grupoIdentificadorNormalizado = payload.grupoIdentificador.trim();
      registrosParaRemover = combinadosExistentes.filter(
        item => this.normalizarNome(item.grupoIdentificador) === this.normalizarNome(grupoIdentificadorNormalizado),
      );

      if (registrosParaRemover.length === 0) {
        throw new NotFoundException(
          `Grupo com identificador "${payload.grupoIdentificador}" não encontrado no campeonato ${campeonatoId}.`,
        );
      }

      // Se também foram informados nomes específicos, filtra apenas esses nomes do grupo
      if (payload.nomesApostadores && payload.nomesApostadores.length > 0) {
        const nomesNormalizados = new Set(
          payload.nomesApostadores.map(nome => this.normalizarNome(nome)),
        );
        registrosParaRemover = registrosParaRemover.filter(item =>
          nomesNormalizados.has(this.normalizarNome(item.nomeApostador)),
        );

        if (registrosParaRemover.length === 0) {
          throw new NotFoundException(
            `Nenhum dos apostadores informados foi encontrado no grupo "${payload.grupoIdentificador}".`,
          );
        }
      }
    } else if (payload.nomesApostadores && payload.nomesApostadores.length > 0) {
      // Remove apenas os apostadores informados (de qualquer grupo)
      const nomesNormalizados = new Set(payload.nomesApostadores.map(nome => this.normalizarNome(nome)));
      registrosParaRemover = combinadosExistentes.filter(item =>
        nomesNormalizados.has(this.normalizarNome(item.nomeApostador)),
      );

      if (registrosParaRemover.length === 0) {
        throw new NotFoundException(
          `Nenhum dos apostadores informados foi encontrado como combinado no campeonato ${campeonatoId}.`,
        );
      }
    }

    if (registrosParaRemover.length > 0) {
      await this.apostadorCombinadoRepository.remove(registrosParaRemover);
    }

    // Retorna os combinados restantes
    const combinadosRestantes = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { grupoIdentificador: 'ASC', nomeApostador: 'ASC' },
    });

    return this.agruparCombinados(combinadosRestantes);
  }

  async listarApostasCombinadas(
    campeonatoId: number,
  ): Promise<
    Array<{
      grupoIdentificador: string;
      apostadores: Array<{ id: number | null; nome: string; createdAt: Date | null; updatedAt: Date | null }>;
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
    }>
  > {
    const combinados = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { grupoIdentificador: 'ASC', nomeApostador: 'ASC' },
    });

    if (!combinados.length) {
      return [];
    }

    const grupos = this.agruparCombinados(combinados);
    const nomesNormalizados = new Set<string>();
    grupos.forEach(grupo =>
      grupo.apostadores.forEach(nome => nomesNormalizados.add(this.normalizarNome(nome))),
    );

    if (!nomesNormalizados.size) {
      return grupos.map(grupo => ({
        grupoIdentificador: grupo.grupoIdentificador,
        apostadores: grupo.apostadores.map(nome => ({
          id: null,
          nome,
          createdAt: null,
          updatedAt: null,
        })),
        apostasPorRodada: [],
        totalApostado: 0,
        totalPremio: 0,
        totalApostas: 0,
        totalRodadas: 0,
        pareosExcluidos: [],
      }));
    }

    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalo')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('LOWER(TRIM(apostador.nome)) IN (:...nomes)', {
        nomes: Array.from(nomesNormalizados.values()),
      })
      .getMany();

    return Promise.all(
      grupos.map(async grupo => {
        const nomesGrupo = new Set(grupo.apostadores.map(nome => this.normalizarNome(nome)));
        const apostasDoGrupo = apostas.filter(aposta => {
          const nome = aposta.apostador?.nome;
          if (!nome) {
            return false;
          }
          return nomesGrupo.has(this.normalizarNome(nome));
        });

        const detalhes = await this.processarDetalhesGrupo(campeonatoId, apostasDoGrupo);
        const { apostadores: apostadoresDetalhes, ...detalhesSemApostadores } = detalhes;
        const apostadoresPorNome = new Map(
          apostadoresDetalhes.map(apostador => [this.normalizarNome(apostador.nome), apostador]),
        );
        const apostadoresResposta = grupo.apostadores.map(nome => {
          const chave = this.normalizarNome(nome);
          const existente = apostadoresPorNome.get(chave);
          return (
            existente ?? {
              id: null,
              nome,
              createdAt: null,
              updatedAt: null,
            }
          );
        });

        return {
          grupoIdentificador: grupo.grupoIdentificador,
          apostadores: apostadoresResposta,
          ...detalhesSemApostadores,
        };
      }),
    );
  }

  async obterDetalhesApostaCombinada(
    campeonatoId: number,
    apostaId: number,
  ): Promise<{
    grupoIdentificador: string;
    apostadores: Array<{ id: number | null; nome: string; createdAt: Date | null; updatedAt: Date | null }>;
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

    const combinacao = await this.apostadorCombinadoRepository.findOne({
      where: { campeonatoId, nomeApostador: apostadorNome },
    });

    if (!combinacao) {
      throw new NotFoundException(
        `Apostador "${apostadorNome}" não está marcado como combinado no campeonato ${campeonatoId}.`,
      );
    }

    const integrantesDoGrupo = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId, grupoIdentificador: combinacao.grupoIdentificador },
      order: { nomeApostador: 'ASC' },
    });

    const nomesGrupo = new Set(integrantesDoGrupo.map(item => this.normalizarNome(item.nomeApostador)));

    const apostasDoGrupo = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalo')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('LOWER(TRIM(apostador.nome)) IN (:...nomes)', {
        nomes: Array.from(nomesGrupo.values()),
      })
      .orderBy('aposta.nomeRodada', 'ASC')
      .addOrderBy('aposta.tipoRodadaId', 'ASC')
      .addOrderBy('aposta.id', 'ASC')
      .getMany();

    const detalhes = await this.processarDetalhesGrupo(campeonatoId, apostasDoGrupo);
    const { apostadores: apostadoresDetalhes, ...detalhesSemApostadores } = detalhes;

    const apostadoresPorNome = new Map(
      apostadoresDetalhes.map(apostador => [this.normalizarNome(apostador.nome), apostador]),
    );

    const apostadoresCompletos = integrantesDoGrupo.map(registro => {
      const chave = this.normalizarNome(registro.nomeApostador);
      return (
        apostadoresPorNome.get(chave) ?? {
          id: null,
          nome: registro.nomeApostador,
          createdAt: null,
          updatedAt: null,
        }
      );
    });

    return {
      grupoIdentificador: combinacao.grupoIdentificador,
      apostadores: apostadoresCompletos,
      ...detalhesSemApostadores,
    };
  }

  async obterDetalhesGrupo(
    campeonatoId: number,
    grupoIdentificador: string,
  ): Promise<{
    grupoIdentificador: string;
    apostadores: Array<{ id: number | null; nome: string; createdAt: Date | null; updatedAt: Date | null }>;
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
    const registrosGrupo = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId, grupoIdentificador },
      order: { nomeApostador: 'ASC' },
    });

    if (!registrosGrupo.length) {
      throw new NotFoundException(
        `Grupo identificado por "${grupoIdentificador}" não encontrado no campeonato ${campeonatoId}.`,
      );
    }

    const nomesGrupo = registrosGrupo
      .map(registro => registro.nomeApostador?.trim())
      .filter((nome): nome is string => !!nome);

    const nomesNormalizados = nomesGrupo.map(nome => this.normalizarNome(nome));

    const apostasDoGrupo = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalo')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('LOWER(TRIM(apostador.nome)) IN (:...nomes)', {
        nomes: nomesNormalizados,
      })
      .orderBy('aposta.nomeRodada', 'ASC')
      .addOrderBy('aposta.tipoRodadaId', 'ASC')
      .addOrderBy('aposta.id', 'ASC')
      .getMany();

    const detalhes = await this.processarDetalhesGrupo(campeonatoId, apostasDoGrupo);
    const { apostadores: apostadoresDetalhes, ...detalhesSemApostadores } = detalhes;

    const apostadoresPorNome = new Map(
      apostadoresDetalhes.map(apostador => [this.normalizarNome(apostador.nome), apostador]),
    );

    const apostadoresCompletos = registrosGrupo.map(registro => {
      const chave = this.normalizarNome(registro.nomeApostador);
      return (
        apostadoresPorNome.get(chave) ?? {
          id: null,
          nome: registro.nomeApostador,
          createdAt: null,
          updatedAt: null,
        }
      );
    });

    return {
      grupoIdentificador,
      apostadores: apostadoresCompletos,
      ...detalhesSemApostadores,
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
      id: apostador?.id ?? null,
      nome: apostador?.nome ?? '',
      createdAt: apostador?.createdAt ?? null,
      updatedAt: apostador?.updatedAt ?? null,
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

  private normalizarNome(nome: string): string {
    return nome.trim().toLowerCase();
  }

  private normalizarGruposEntrada(dto: DefinirApostadoresCombinadosDto): GrupoCombinadoDto[] {
    const grupos: GrupoCombinadoDto[] = [];

    if (dto.grupos?.length) {
      for (const grupo of dto.grupos) {
        const nomes = Array.from(
          new Set(
            (grupo.nomes || [])
              .map(nome => nome?.trim())
              .filter((nome): nome is string => !!nome),
          ),
        );

        if (!nomes.length) {
          continue;
        }

        grupos.push({
          identificador: (grupo.identificador?.trim() || this.gerarIdentificadorGrupo(nomes)) ?? undefined,
          nomes,
        });
      }
    } else if (dto.nomesApostadores?.length) {
      const nomes = Array.from(
        new Set(
          dto.nomesApostadores
            .map(nome => nome?.trim())
            .filter((nome): nome is string => !!nome),
        ),
      );

      if (nomes.length) {
        grupos.push({
          identificador: this.gerarIdentificadorGrupo(nomes) ?? undefined,
          nomes,
        });
      }
    }

    return grupos;
  }

  private gerarIdentificadorGrupo(nomes: string[]): string | undefined {
    if (!nomes.length) {
      return undefined;
    }

    const partes = nomes
      .map(nome =>
        nome
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    if (!partes.length) {
      return undefined;
    }

    const base = partes.join('__');
    return base.substring(0, 100);
  }

  private obterIdentificadorExistente(
    nomes: string[],
    existentesPorNome: Map<string, ApostadorCombinado>,
  ): string | undefined {
    for (const nome of nomes) {
      const existente = existentesPorNome.get(this.normalizarNome(nome));
      if (existente?.grupoIdentificador) {
        return existente.grupoIdentificador;
      }
    }

    return undefined;
  }

  private agruparCombinados(
    combinados: ApostadorCombinado[],
  ): Array<{ grupoIdentificador: string; apostadores: string[] }> {
    const mapa = new Map<string, Set<string>>();

    for (const combinado of combinados) {
      const identificador = combinado.grupoIdentificador;
      if (!mapa.has(identificador)) {
        mapa.set(identificador, new Set());
      }

      mapa.get(identificador)!.add(combinado.nomeApostador);
    }

    return Array.from(mapa.entries()).map(([grupoIdentificador, nomes]) => ({
      grupoIdentificador,
      apostadores: Array.from(nomes.values()).sort((a, b) => a.localeCompare(b)),
    }));
  }

  private async processarDetalhesGrupo(
    campeonatoId: number,
    apostas: Aposta[],
  ): Promise<{
    apostadores: Array<{ id: number | null; nome: string; createdAt: Date | null; updatedAt: Date | null }>;
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
    if (!apostas.length) {
      return {
        apostadores: [],
        apostasPorRodada: [],
        totalApostado: 0,
        totalPremio: 0,
        totalApostas: 0,
        totalRodadas: 0,
        pareosExcluidos: [],
      };
    }

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

    apostas.forEach(aposta => {
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

    const pareosExcluidos = await this.obterPareosExcluidosDetalhados(campeonatoId, apostas);

    return {
      apostadores: this.formatarApostadores(apostas),
      apostasPorRodada,
      totalApostado: Number(totalApostado.toFixed(2)),
      totalPremio: Number(totalPremio.toFixed(2)),
      totalApostas: apostas.length,
      totalRodadas: apostasPorRodada.length,
      pareosExcluidos,
    };
  }
}


