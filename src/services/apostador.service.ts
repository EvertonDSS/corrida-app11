import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Apostador } from '../entities/apostador.entity';
import { Aposta } from '../entities/aposta.entity';
import { ApostadorCombinado } from '../entities/apostador-combinado.entity';

@Injectable()
export class ApostadorService {
  constructor(
    @InjectRepository(Apostador)
    private apostadorRepository: Repository<Apostador>,
    @InjectRepository(Aposta)
    private apostaRepository: Repository<Aposta>,
    @InjectRepository(ApostadorCombinado)
    private apostadorCombinadoRepository: Repository<ApostadorCombinado>,
  ) {}

  async findAll(): Promise<Apostador[]> {
    return await this.apostadorRepository.find({
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Apostador> {
    const apostador = await this.apostadorRepository.findOne({
      where: { id },
    });

    if (!apostador) {
      throw new NotFoundException('Apostador não encontrado');
    }

    return apostador;
  }

  async findByCampeonato(campeonatoId: number): Promise<any[]> {
    // Busca apostadores únicos que fizeram apostas no campeonato
    const apostadoresIds = await this.apostaRepository
      .createQueryBuilder('aposta')
      .select('DISTINCT aposta.apostadorId', 'apostadorId')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.valorPremio > 0')
      .andWhere('aposta.valor > 0')
      .getRawMany();

    if (apostadoresIds.length === 0) {
      return [];
    }

    const ids = apostadoresIds.map(item => item.apostadorId);

    // Busca os apostadores pelos IDs
    const apostadores = await this.apostadorRepository
      .createQueryBuilder('apostador')
      .where('apostador.id IN (:...ids)', { ids })
      .orderBy('apostador.nome', 'ASC')
      .getMany();

    // Para cada apostador, calcula estatísticas
    const apostadoresComEstatisticas = await Promise.all(
      apostadores.map(async (apostador) => {
        // Busca todas as apostas do apostador no campeonato
        const apostas = await this.apostaRepository.find({
          where: {
            apostadorId: apostador.id,
            campeonatoId: campeonatoId,
          },
          order: { createdAt: 'ASC' },
        });

        // Filtra apenas apostas válidas
        const apostasValidas = apostas.filter(aposta => 
          Number(aposta.valorPremio) > 0 && Number(aposta.valor) > 0
        );

        // Calcula estatísticas
        const totalApostado = apostasValidas.reduce((sum, aposta) => sum + Number(aposta.valor), 0);
        const totalPremio = apostasValidas.reduce((sum, aposta) => sum + Number(aposta.valorPremio), 0);
        const totalApostas = apostasValidas.length;
        
        const primeiraAposta = apostasValidas.length > 0 ? apostasValidas[0].createdAt : null;
        const ultimaAposta = apostasValidas.length > 0 ? apostasValidas[apostasValidas.length - 1].createdAt : null;

        return {
          id: apostador.id,
          nome: apostador.nome,
          totalApostado: Number(totalApostado.toFixed(2)),
          totalPremio: Number(totalPremio.toFixed(2)),
          totalApostas: totalApostas,
          primeiraAposta: primeiraAposta,
          ultimaAposta: ultimaAposta,
          createdAt: apostador.createdAt,
          updatedAt: apostador.updatedAt,
        };
      })
    );

    return apostadoresComEstatisticas;
  }

  async obterResumoApostadoresCombinados(
    campeonatoId: number,
  ): Promise<{
    campeonatoId: number;
    totalApostadores: number;
    apostadores: Array<{
      tipo: 'grupo' | 'individual';
      grupoIdentificador?: string;
      apostadorId?: number | null;
      nome: string;
      integrantes?: string[];
      totalApostado: number;
      totalPremio: number;
      totalApostas: number;
      primeiraAposta: Date | null;
      ultimaAposta: Date | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }>;
  }> {
    const participantes = await this.calcularResumoApostadoresCombinados(campeonatoId);

    return {
      campeonatoId,
      totalApostadores: participantes.length,
      apostadores: participantes,
    };
  }

  private async calcularResumoApostadoresCombinados(
    campeonatoId: number,
  ): Promise<
    Array<{
      tipo: 'grupo' | 'individual';
      grupoIdentificador?: string;
      apostadorId?: number | null;
      nome: string;
      integrantes?: string[];
      totalApostado: number;
      totalPremio: number;
      totalApostas: number;
      primeiraAposta: Date | null;
      ultimaAposta: Date | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }>
  > {
    const combinados = await this.apostadorCombinadoRepository.find({
      where: { campeonatoId },
      order: { grupoIdentificador: 'ASC', nomeApostador: 'ASC' },
    });

    const gruposPorIdentificador = new Map<
      string,
      {
        identificador: string;
        nomes: string[];
        nomesNormalizados: Set<string>;
        nomeExibicao: string;
      }
    >();

    combinados.forEach(registro => {
      const identificador = registro.grupoIdentificador;
      const nome = registro.nomeApostador?.trim();
      if (!nome) {
        return;
      }
      if (!gruposPorIdentificador.has(identificador)) {
        gruposPorIdentificador.set(identificador, {
          identificador,
          nomes: [],
          nomesNormalizados: new Set<string>(),
          nomeExibicao: '',
        });
      }
      const grupo = gruposPorIdentificador.get(identificador)!;
      const nomeNormalizado = this.normalizarNome(nome);
      if (!grupo.nomesNormalizados.has(nomeNormalizado)) {
        grupo.nomes.push(nome);
        grupo.nomesNormalizados.add(nomeNormalizado);
      }
    });

    const nomeParaGrupo = new Map<
      string,
      {
        identificador: string;
        nomes: string[];
        nomeExibicao: string;
      }
    >();

    for (const grupo of gruposPorIdentificador.values()) {
      grupo.nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      grupo.nomeExibicao = grupo.nomes.join('/');
      for (const nome of grupo.nomes) {
        nomeParaGrupo.set(this.normalizarNome(nome), {
          identificador: grupo.identificador,
          nomes: grupo.nomes,
          nomeExibicao: grupo.nomeExibicao,
        });
      }
    }

    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.valorPremio > 0')
      .andWhere('aposta.valor > 0')
      .orderBy('aposta.createdAt', 'ASC')
      .getMany();

    if (!apostas.length) {
      return [];
    }

    type ResumoParticipante = {
      tipo: 'grupo' | 'individual';
      grupoIdentificador?: string;
      apostadorId?: number | null;
      nome: string;
      integrantes?: string[];
      totalApostado: number;
      totalPremio: number;
      totalApostas: number;
      primeiraAposta: Date | null;
      ultimaAposta: Date | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    };

    const estatisticas = new Map<string, ResumoParticipante>();

    for (const aposta of apostas) {
      const apostador = aposta.apostador;
      const nomeApostador = apostador?.nome?.trim();
      if (!apostador || !nomeApostador) {
        continue;
      }

      const nomeNormalizado = this.normalizarNome(nomeApostador);
      const grupo = nomeParaGrupo.get(nomeNormalizado);

      const chave = grupo ? `grupo:${grupo.identificador}` : `individual:${apostador.id}`;

      if (!estatisticas.has(chave)) {
        estatisticas.set(chave, {
          tipo: grupo ? 'grupo' : 'individual',
          grupoIdentificador: grupo ? grupo.identificador : undefined,
          apostadorId: grupo ? null : apostador.id,
          nome: grupo ? grupo.nomeExibicao : nomeApostador,
          integrantes: grupo ? [...grupo.nomes] : undefined,
          totalApostado: 0,
          totalPremio: 0,
          totalApostas: 0,
          primeiraAposta: null,
          ultimaAposta: null,
          createdAt: apostador.createdAt ?? null,
          updatedAt: apostador.updatedAt ?? null,
        });
      }

      const resumo = estatisticas.get(chave)!;

      const valorAposta = Number(aposta.valor) || 0;
      const valorPremio = Number(aposta.valorPremio) || 0;

      resumo.totalApostado += valorAposta;
      resumo.totalPremio += valorPremio;
      resumo.totalApostas += 1;

      const dataCriacaoAposta = aposta.createdAt ?? null;
      const dataAtualizacaoAposta = aposta.updatedAt ?? aposta.createdAt ?? null;

      if (dataCriacaoAposta) {
        if (!resumo.primeiraAposta || dataCriacaoAposta < resumo.primeiraAposta) {
          resumo.primeiraAposta = dataCriacaoAposta;
        }
        if (!resumo.ultimaAposta || dataCriacaoAposta > resumo.ultimaAposta) {
          resumo.ultimaAposta = dataCriacaoAposta;
        }
      }

      if (dataAtualizacaoAposta) {
        if (!resumo.updatedAt || dataAtualizacaoAposta > resumo.updatedAt) {
          resumo.updatedAt = dataAtualizacaoAposta;
        }
      }

      if (apostador.createdAt) {
        if (!resumo.createdAt || apostador.createdAt < resumo.createdAt) {
          resumo.createdAt = apostador.createdAt;
        }
      }

      if (apostador.updatedAt) {
        if (!resumo.updatedAt || apostador.updatedAt > resumo.updatedAt) {
          resumo.updatedAt = apostador.updatedAt;
        }
      }
    }

    const participantes = Array.from(estatisticas.values()).map(participante => ({
      ...participante,
      totalApostado: Number(participante.totalApostado.toFixed(2)),
      totalPremio: Number(participante.totalPremio.toFixed(2)),
    }));

    participantes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return participantes;
  }

  private normalizarNome(nome: string): string {
    return nome.trim().toLowerCase();
  }

  async renomearApostador(campeonatoId: number, nomeOriginal: string, novoNome: string): Promise<any> {
    // Normaliza os nomes
    const nomeOriginalNormalizado = nomeOriginal.trim();
    const novoNomeNormalizado = novoNome.trim();

    // Busca o apostador pelo nome original (case insensitive)
    const apostadorOriginal = await this.apostadorRepository
      .createQueryBuilder('apostador')
      .where('LOWER(apostador.nome) = LOWER(:nome)', { nome: nomeOriginalNormalizado })
      .getOne();

    if (!apostadorOriginal) {
      throw new NotFoundException(`Apostador com nome "${nomeOriginalNormalizado}" não encontrado`);
    }

    // Verifica se o apostador tem apostas no campeonato especificado
    const apostasNoCampeonato = await this.apostaRepository.find({
      where: {
        apostadorId: apostadorOriginal.id,
        campeonatoId: campeonatoId
      }
    });

    if (apostasNoCampeonato.length === 0) {
      throw new NotFoundException(`Apostador "${nomeOriginalNormalizado}" não possui apostas no campeonato ${campeonatoId}`);
    }

    // Verifica se o novo nome já existe (case insensitive)
    const apostadorExistente = await this.apostadorRepository
      .createQueryBuilder('apostador')
      .where('LOWER(apostador.nome) = LOWER(:nome)', { nome: novoNomeNormalizado })
      .getOne();

    if (apostadorExistente) {
      // Se o novo nome já existe, mescla as apostas do apostador original com o existente
      await this.apostaRepository.update(
        { apostadorId: apostadorOriginal.id },
        { apostadorId: apostadorExistente.id }
      );

      // Remove o apostador original (se não tiver mais apostas)
      const apostasRestantes = await this.apostaRepository.count({
        where: { apostadorId: apostadorOriginal.id }
      });

      if (apostasRestantes === 0) {
        await this.apostadorRepository.remove(apostadorOriginal);
      }

      // Retorna o resultado da mesclagem
      return {
        apostador: {
          id: apostadorExistente.id,
          nome: apostadorExistente.nome,
          createdAt: apostadorExistente.createdAt,
          updatedAt: apostadorExistente.updatedAt
        },
        apostasAtualizadas: apostasNoCampeonato.length,
        campeonatoId: campeonatoId,
        nomeOriginal: nomeOriginalNormalizado,
        novoNome: novoNomeNormalizado,
        acao: 'mesclado', // Indica que foi mesclado com apostador existente
        apostadorMesclado: {
          id: apostadorExistente.id,
          nome: apostadorExistente.nome
        }
      };
    } else {
      // Se o novo nome não existe, apenas atualiza o nome do apostador
      apostadorOriginal.nome = novoNomeNormalizado;
      apostadorOriginal.updatedAt = new Date();
      
      const apostadorAtualizado = await this.apostadorRepository.save(apostadorOriginal);

      return {
        apostador: {
          id: apostadorAtualizado.id,
          nome: apostadorAtualizado.nome,
          createdAt: apostadorAtualizado.createdAt,
          updatedAt: apostadorAtualizado.updatedAt
        },
        apostasAtualizadas: apostasNoCampeonato.length,
        campeonatoId: campeonatoId,
        nomeOriginal: nomeOriginalNormalizado,
        novoNome: novoNomeNormalizado,
        acao: 'renomeado' // Indica que foi apenas renomeado
      };
    }
  }
}
