import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';
import { Pareo } from '../entities/pareo.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Aposta)
    private apostaRepository: Repository<Aposta>,
    @InjectRepository(Apostador)
    private apostadorRepository: Repository<Apostador>,
    @InjectRepository(Pareo)
    private pareoRepository: Repository<Pareo>,
    @InjectRepository(Cavalo)
    private cavaloRepository: Repository<Cavalo>,
    @InjectRepository(PareoExcluido)
    private pareoExcluidoRepository: Repository<PareoExcluido>,
  ) {}

  async obterDadosEstruturados(campeonatoId: number, apostadorId: number): Promise<any> {
    // Busca o apostador
    const apostador = await this.apostadorRepository.findOne({
      where: { id: apostadorId },
    });

    if (!apostador) {
      throw new NotFoundException('Apostador não encontrado');
    }

    // Busca pareos excluídos do campeonato primeiro
    const pareosExcluidosEntities = await this.pareoExcluidoRepository.find({
      where: { campeonatoId },
    });

    // Busca os IDs dos pareos excluídos de forma otimizada
    const pareosIdsExcluidos: number[] = [];
    if (pareosExcluidosEntities.length > 0) {
      // Agrupa pareos excluídos por tipoRodadaId para buscar em lote
      const tiposRodadaIds = [...new Set(pareosExcluidosEntities.map(p => p.tipoRodadaId))];
      
      for (const tipoRodadaId of tiposRodadaIds) {
        const pareosExcluidosDoTipo = pareosExcluidosEntities.filter(p => p.tipoRodadaId === tipoRodadaId);
        const numerosPareos = pareosExcluidosDoTipo.map(p => p.numeroPareo);
        
        // Busca todos os pareos deste tipo usando query builder com IN
        const pareosEncontrados = await this.pareoRepository
          .createQueryBuilder('pareo')
          .where('pareo.campeonatoId = :campeonatoId', { campeonatoId })
          .andWhere('pareo.tipoRodadaId = :tipoRodadaId', { tipoRodadaId })
          .andWhere('pareo.numero IN (:...numerosPareos)', { numerosPareos })
          .getMany();

        pareosIdsExcluidos.push(...pareosEncontrados.map(p => p.id));
      }
    }

    // Busca todas as apostas do apostador no campeonato
    const queryBuilder = this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.apostadorId = :apostadorId', { apostadorId })
      .andWhere('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.valorPremio > 0')
      .andWhere('aposta.valor > 0');

    // Exclui apostas de pareos excluídos
    if (pareosIdsExcluidos.length > 0) {
      queryBuilder.andWhere('aposta.pareoId NOT IN (:...pareosIdsExcluidos)', { pareosIdsExcluidos });
    }

    const apostas = await queryBuilder
      .orderBy('aposta.updatedAt', 'DESC')
      .addOrderBy('pareo.numero', 'ASC')
      .getMany();

    const pareosExcluidos = await this.buscarPareosExcluidos(campeonatoId, apostas);
    const pareosExcluidosDetalhados = await this.buscarPareosExcluidosDetalhados(campeonatoId, apostas);
    
    // Cria mapa de valorExcluido por nomeRodada (somente quando temApostasAtivas = true)
    // Agrupa por nomeRodada para somar todos os valorExcluido da mesma rodada
    const valorExcluidoPorNomeRodada = new Map<string, number>();
    for (const excluido of pareosExcluidosDetalhados) {
      if (excluido.temApostasAtivas) {
        const nomeRodada = excluido.nomeRodada;
        const valorAtual = valorExcluidoPorNomeRodada.get(nomeRodada) || 0;
        valorExcluidoPorNomeRodada.set(nomeRodada, valorAtual + Number(excluido.valorExcluido));
      }
    }
    
    const apostasPorRodada = this.agruparApostasPorRodada(apostas, pareosExcluidos, valorExcluidoPorNomeRodada);

    const totalApostado = apostas.reduce((sum, aposta) => sum + Number(aposta.valor), 0);
    const totalPremio = apostas.reduce((sum, aposta) => sum + Number(aposta.valorPremio), 0);

    const apostasPorRodadaArray = Array.from(apostasPorRodada.values());

    return {
      apostador: {
        id: apostador.id,
        nome: apostador.nome,
        createdAt: apostador.createdAt,
        updatedAt: apostador.updatedAt
      },
      apostasPorRodada: apostasPorRodadaArray,
      totalApostado: Number(totalApostado.toFixed(2)),
      totalPremio: Number(totalPremio.toFixed(2)),
      totalApostas: apostas.length,
      totalRodadas: apostasPorRodadaArray.length,
      pareosExcluidos: pareosExcluidosDetalhados
    };
  }

  private async buscarPareosExcluidosDetalhados(campeonatoId: number, apostas: Aposta[]): Promise<any[]> {
    const pareosExcluidosDetalhados: any[] = [];
    
    // Busca todos os pareos excluídos do campeonato
    const excluidos = await this.pareoExcluidoRepository.find({
      where: { campeonatoId },
    });

    // Agrupa apostas por rodada específica (nomeRodada + tipoRodadaId)
    const apostasPorRodada = new Map<string, Aposta[]>();
    for (const aposta of apostas) {
      const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
      if (!apostasPorRodada.has(chaveRodada)) {
        apostasPorRodada.set(chaveRodada, []);
      }
      apostasPorRodada.get(chaveRodada)!.push(aposta);
    }

    // Para cada rodada específica, verifica se há pareos excluídos
    for (const [chaveRodada, apostasRodada] of apostasPorRodada) {
      const primeiraAposta = apostasRodada[0];
      const tipoRodada = primeiraAposta.tipoRodada;
      
      // Busca pareos excluídos deste tipo de rodada
      const excluidosTipo = excluidos.filter(e => e.tipoRodadaId === primeiraAposta.tipoRodadaId);
      
      for (const excluido of excluidosTipo) {
        // Busca apostas ativas do pareo excluído APENAS desta rodada específica
        const apostasPareoExcluido = await this.apostaRepository.find({
          where: {
            campeonatoId,
            tipoRodadaId: excluido.tipoRodadaId,
            nomeRodada: primeiraAposta.nomeRodada, // Filtra pela rodada específica
            pareo: { numero: excluido.numeroPareo }
          },
          relations: ['pareo']
        });
        
        // Calcula o valor excluído (soma dos valores reais das apostas ativas desta rodada)
        const valorExcluido = apostasPareoExcluido.length > 0 
          ? apostasPareoExcluido.reduce((sum, a) => sum + Number(a.valor), 0)
          : 0;

        pareosExcluidosDetalhados.push({
          chaveRodada: chaveRodada, // Inclui a chave da rodada específica
          nomeRodada: primeiraAposta.nomeRodada,
          tipoRodada: {
            id: tipoRodada?.id || primeiraAposta.tipoRodadaId,
            nome: tipoRodada?.nome || 'Tipo Desconhecido'
          },
          numeroPareo: excluido.numeroPareo,
          valorExcluido: Number(valorExcluido.toFixed(2)),
          temApostasAtivas: apostasPareoExcluido.length > 0,
          quantidadeApostas: apostasPareoExcluido.length,
          dadosPareo: excluido.dadosPareo,
          createdAt: excluido.createdAt
        });
      }
    }

    return pareosExcluidosDetalhados;
  }

  private async buscarPareosExcluidos(campeonatoId: number, apostas: Aposta[]): Promise<Map<string, number>> {
    const pareosExcluidos = new Map<string, number>();
    
    // Busca todos os pareos excluídos do campeonato
    const excluidos = await this.pareoExcluidoRepository.find({
      where: { campeonatoId },
    });

    // Agrupa apostas por rodada específica (nomeRodada + tipoRodadaId)
    const apostasPorRodada = new Map<string, Aposta[]>();
    for (const aposta of apostas) {
      const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
      if (!apostasPorRodada.has(chaveRodada)) {
        apostasPorRodada.set(chaveRodada, []);
      }
      apostasPorRodada.get(chaveRodada)!.push(aposta);
    }

    // Para cada rodada específica, calcula o valor dos pareos excluídos
    for (const [chaveRodada, apostasRodada] of apostasPorRodada) {
      const primeiraAposta = apostasRodada[0];
      
      // Busca pareos excluídos do mesmo tipo de rodada
      const excluidosTipo = excluidos.filter(e => e.tipoRodadaId === primeiraAposta.tipoRodadaId);
      
      // Calcula o valor total dos pareos excluídos para esta rodada específica
      let valorExcluidos = 0;
      for (const excluido of excluidosTipo) {
        // Busca apostas ativas do pareo excluído APENAS desta rodada específica
        const apostasPareoExcluido = await this.apostaRepository.find({
          where: {
            campeonatoId,
            tipoRodadaId: excluido.tipoRodadaId,
            nomeRodada: primeiraAposta.nomeRodada, // Filtra pela rodada específica
            pareo: { numero: excluido.numeroPareo }
          },
          relations: ['pareo']
        });
        
        // Só adiciona o valor se houver apostas ativas no pareo excluído desta rodada
        if (apostasPareoExcluido.length > 0) {
          // Calcula a proporção que este apostador representa no pareo excluído desta rodada
          const apostasDoApostadorNoPareoExcluido = apostasPareoExcluido.filter(a => a.apostadorId === primeiraAposta.apostadorId);
          const valorApostadorNoPareoExcluido = apostasDoApostadorNoPareoExcluido.reduce((sum, a) => sum + Number(a.valor), 0);
          
          // Adiciona apenas a proporção deste apostador (baseado no valor real apostado)
          valorExcluidos += valorApostadorNoPareoExcluido;
        }
      }
      
      pareosExcluidos.set(chaveRodada, valorExcluidos);
    }

    return pareosExcluidos;
  }

  private agruparApostasPorRodada(apostas: Aposta[], pareosExcluidos: Map<string, number>, valorExcluidoPorNomeRodada: Map<string, number>): Map<string, any> {
    const agrupadas = new Map();

    for (const aposta of apostas) {
      const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;

      if (!agrupadas.has(chaveRodada)) {
        agrupadas.set(chaveRodada, {
          nomeRodada: aposta.nomeRodada,
          tipoRodada: aposta.tipoRodada,
          apostas: [],
          totalRodada: 0,
        });
      }

      // Calcula o valorOriginalPremio ajustado diminuindo valorExcluido quando temApostasAtivas = true
      // Busca pelo nomeRodada (não pela chaveRodada completa)
      const valorExcluido = valorExcluidoPorNomeRodada.get(aposta.nomeRodada) || 0;
      const valorOriginalPremioAjustado = Number(aposta.valorOriginalPremio) - valorExcluido;

      // Calcula o prêmio individual considerando pareos excluídos
      const valorExcluidos = pareosExcluidos.get(chaveRodada) || 0;
      const valorPremioAjustado = valorOriginalPremioAjustado - valorExcluidos;
      const valorPremioComRetirada = valorPremioAjustado * (1 - Number(aposta.porcentagemRetirada) / 100);
      const premioIndividual = valorPremioComRetirada * (Number(aposta.porcentagemPremio) / 100);

      // Calcula o valor real da aposta (considerando a porcentagem)
      const valorApostaReal = Number(aposta.valorOriginal) * (Number(aposta.porcentagemAposta) / 100);

      // Cria uma cópia da aposta com os valores calculados
      const apostaComValoresCalculados = {
        ...aposta,
        valor: valorApostaReal, // Valor real apostado pelo apostador
        valorPremio: premioIndividual, // Prêmio individual calculado
        valorOriginalPremio: valorOriginalPremioAjustado // ValorOriginalPremio ajustado (diminuindo pareos excluídos)
      };

      agrupadas.get(chaveRodada).apostas.push(apostaComValoresCalculados);
      
      // Atualiza o total da rodada apenas uma vez (valor total após retirada)
      if (!agrupadas.get(chaveRodada).totalRodadaCalculado) {
        agrupadas.get(chaveRodada).totalRodada = valorPremioComRetirada;
        agrupadas.get(chaveRodada).totalRodadaCalculado = true;
      }
    }

    return agrupadas;
  }
}
