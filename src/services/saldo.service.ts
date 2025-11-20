import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';
import { Vencedor } from '../entities/vencedor.entity';
import { RodadaCasa } from '../entities/rodada-casa.entity';
import { VencedorRodada } from '../entities/vencedor-rodada.entity';
import { ApostadorCombinado } from '../entities/apostador-combinado.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';

@Injectable()
export class SaldoService {
  constructor(
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
    @InjectRepository(Aposta)
    private readonly apostaRepository: Repository<Aposta>,
    @InjectRepository(Apostador)
    private readonly apostadorRepository: Repository<Apostador>,
    @InjectRepository(Vencedor)
    private readonly vencedorRepository: Repository<Vencedor>,
    @InjectRepository(RodadaCasa)
    private readonly rodadaCasaRepository: Repository<RodadaCasa>,
    @InjectRepository(VencedorRodada)
    private readonly vencedorRodadaRepository: Repository<VencedorRodada>,
    @InjectRepository(ApostadorCombinado)
    private readonly apostadorCombinadoRepository: Repository<ApostadorCombinado>,
    @InjectRepository(PareoExcluido)
    private readonly pareoExcluidoRepository: Repository<PareoExcluido>,
  ) {}

  async obterSaldoCampeonato(campeonatoId: number): Promise<any> {
    const campeonato = await this.campeonatoRepository.findOne({ where: { id: campeonatoId } });
    if (!campeonato) {
      throw new NotFoundException(`Campeonato ${campeonatoId} não encontrado`);
    }

    // Apostadores com apostas válidas no campeonato
    const apostadoresIds = await this.apostaRepository
      .createQueryBuilder('aposta')
      .select('DISTINCT aposta.apostadorId', 'apostadorId')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.valor > 0')
      .andWhere('aposta.valorPremio > 0')
      .getRawMany();

    const ids = apostadoresIds.map((r) => r.apostadorId);

    const apostadores = ids.length
      ? await this.apostadorRepository
          .createQueryBuilder('apostador')
          .where('apostador.id IN (:...ids)', { ids })
          .orderBy('apostador.nome', 'ASC')
          .getMany()
      : [];

    const combinadosMap = await this.obterGruposCombinados(campeonatoId);
    const itensMap = new Map<
      string,
      {
        nome: string;
        integrantes?: string[];
        totalApostado: number;
        totalPremiosVencidosBruto: number;
      }
    >();

    // Busca pareos excluídos do campeonato
    const pareosExcluidos = await this.pareoExcluidoRepository.find({
      where: { campeonatoId },
    });

    // Cria um mapa para verificar rapidamente se um pareo está excluído
    // Chave: `${tipoRodadaId}-${numeroPareo}`
    const pareosExcluidosMap = new Map<string, PareoExcluido>();
    for (const excluido of pareosExcluidos) {
      const chave = `${excluido.tipoRodadaId}-${excluido.numeroPareo}`;
      pareosExcluidosMap.set(chave, excluido);
    }

    for (const apostador of apostadores) {
      const apostas = await this.apostaRepository.find({
        where: { campeonatoId, apostadorId: apostador.id },
        relations: ['pareo'],
      });

      // Calcula o total apostado descontando apostas em pareos excluídos
      const totalApostado = apostas.reduce((sum, aposta) => {
        // Verifica se a aposta está em um pareo excluído (mesmo tipoRodadaId e mesmo numeroPareo)
        const chavePareo = `${aposta.tipoRodadaId}-${aposta.pareo?.numero ?? ''}`;
        const pareoEstaExcluido = pareosExcluidosMap.has(chavePareo);
        
        // Se a aposta está em um pareo excluído, não conta o valor apostado
        if (pareoEstaExcluido) {
          return sum;
        }
        
        return sum + this.calcularValorRealApostado(aposta);
      }, 0);
      
      const totalPremiosVencidosBruto = await this.calcularTotalPremiosVencidos(apostador.id, campeonatoId);
      const nomeNormalizado = this.normalizarNome(apostador.nome);
      const grupo = combinadosMap.nomeParaGrupo.get(nomeNormalizado);
      const chave = grupo ? `grupo:${grupo.identificador}` : `individual:${apostador.id}`;
      const nomeExibicao = grupo ? grupo.nomeExibicao : apostador.nome;
      const integrantes = grupo ? [...grupo.nomes] : undefined;

      const existente = itensMap.get(chave) ?? {
        nome: nomeExibicao,
        integrantes,
        totalApostado: 0,
        totalPremiosVencidosBruto: 0,
      };

      existente.totalApostado += totalApostado;
      existente.totalPremiosVencidosBruto += totalPremiosVencidosBruto;

      itensMap.set(chave, existente);
    }

    const itens = Array.from(itensMap.values()).map(item => {
      const totalApostado = Number(item.totalApostado.toFixed(2));
      const totalPremiosVencidos = Math.floor(item.totalPremiosVencidosBruto);
      const saldoFinalBruto = totalPremiosVencidos - totalApostado;
      const saldoFinal = Math.floor(saldoFinalBruto);

      return {
        nome: item.nome,
        ...(item.integrantes ? { integrantes: item.integrantes } : {}),
        totalApostado,
        totalPremiosVencidos,
        saldoFinal,
      };
    });

    // Busca e calcula o valor total da CASA
    const rodadasCasa = await this.rodadaCasaRepository.find({
      where: { campeonatoId },
    });
    const totalCasa = rodadasCasa.reduce((sum, rodadaCasa) => sum + Number(rodadaCasa.valorCasa || 0), 0);

    // Adiciona CASA à lista de apostadores apenas se houver rodadas casa cadastradas
    if (rodadasCasa.length > 0 && totalCasa > 0) {
      const totalApostadoCasa = Number(totalCasa.toFixed(2));
      const totalPremiosVencidosCasa = 0;
      const saldoFinalCasaBruto = totalPremiosVencidosCasa - totalApostadoCasa;
      // Arredonda para baixo: positivos (573.75 -> 573), negativos (-573.75 -> -574)
      const saldoFinalCasa = Math.floor(saldoFinalCasaBruto);
      
      itens.push({
        nome: 'CASA',
        totalApostado: totalApostadoCasa,
        totalPremiosVencidos: totalPremiosVencidosCasa,
        saldoFinal: saldoFinalCasa,
      });
    }

    return {
      campeonato: {
        id: campeonato.id,
        nome: campeonato.nome,
      },
      apostadores: itens,
    };
  }

  async obterSaldoCampeonatoNegativados(campeonatoId: number): Promise<any> {
    const saldo = await this.obterSaldoCampeonato(campeonatoId);
    return {
      campeonato: saldo.campeonato,
      apostadores: saldo.apostadores.filter((item: any) => item.saldoFinal < 0),
    };
  }

  async obterSaldoCampeonatoPositivados(campeonatoId: number): Promise<any> {
    const saldo = await this.obterSaldoCampeonato(campeonatoId);
    return {
      campeonato: saldo.campeonato,
      apostadores: saldo.apostadores.filter((item: any) => item.saldoFinal > 0),
    };
  }

  async obterSaldoMultiplosCampeonatos(campeonatoIds: number[]): Promise<any> {
    const idsUnicos = Array.from(new Set(campeonatoIds.filter(id => typeof id === 'number')));

    if (!idsUnicos.length) {
      throw new BadRequestException('Informe ao menos um campeonatoId válido.');
    }

    const saldos = await Promise.all(idsUnicos.map(id => this.obterSaldoCampeonato(id)));

    const agregados = new Map<string, { totalApostado: number; totalPremiosVencidos: number }>();

    saldos.forEach(saldo => {
      saldo.apostadores.forEach(apostador => {
        const chave = apostador.nome;
        const atual = agregados.get(chave) ?? { totalApostado: 0, totalPremiosVencidos: 0 };
        atual.totalApostado += Number(apostador.totalApostado || 0);
        atual.totalPremiosVencidos += Number(apostador.totalPremiosVencidos || 0);
        agregados.set(chave, atual);
      });
    });

    const apostadoresAggregados = Array.from(agregados.entries())
      .map(([nome, valores]) => {
        const totalApostado = Number(valores.totalApostado.toFixed(2));
        const totalPremiosVencidos = Math.floor(valores.totalPremiosVencidos);
        const saldoFinalBruto = totalPremiosVencidos - totalApostado;
        const saldoFinal = Math.floor(saldoFinalBruto);

        return {
          nome,
          totalApostado,
          totalPremiosVencidos,
          saldoFinal,
        };
      })
      .sort((a, b) => {
        if (a.nome === 'CASA') return 1;
        if (b.nome === 'CASA') return -1;
        return a.nome.localeCompare(b.nome);
      });

    return {
      campeonatos: saldos.map(saldo => saldo.campeonato),
      apostadores: apostadoresAggregados,
    };
  }

  async obterSaldoMultiplosCampeonatosNegativados(campeonatoIds: number[]): Promise<any> {
    const saldo = await this.obterSaldoMultiplosCampeonatos(campeonatoIds);
    return {
      campeonatos: saldo.campeonatos,
      apostadores: saldo.apostadores.filter((item: any) => item.saldoFinal < 0),
    };
  }

  async obterSaldoMultiplosCampeonatosPositivados(campeonatoIds: number[]): Promise<any> {
    const saldo = await this.obterSaldoMultiplosCampeonatos(campeonatoIds);
    return {
      campeonatos: saldo.campeonatos,
      apostadores: saldo.apostadores.filter((item: any) => item.saldoFinal > 0),
    };
  }

  private calcularValorRealApostado(aposta: Aposta): number {
    const valorOriginal = Number((aposta as any).valorOriginal ?? 0);
    const porcentagemAposta = Number((aposta as any).porcentagemAposta ?? 0);
    const valorCampo = Number((aposta as any).valor ?? 0);

    // Se temos valorOriginal e porcentagemAposta, calcula o valor real da parte do apostador
    if (valorOriginal > 0 && porcentagemAposta > 0) {
      return valorOriginal * (porcentagemAposta / 100);
    }
    // Caso contrário, usa o campo valor
    return valorCampo;
  }

  private async calcularTotalPremiosVencidos(apostadorId: number, campeonatoId: number): Promise<number> {
    // Busca os vencedores gerais do campeonato
    const vencedores = await this.vencedorRepository.find({
      where: { campeonatoId },
      relations: ['cavalo'],
    });

    const nomesCavalosVencedores = vencedores
      .filter(v => v.cavalo?.nome)
      .map(v => v.cavalo.nome.trim().toLowerCase());

    if (!nomesCavalosVencedores.length) {
      return 0;
    }

    const rodadasEspecificas = await this.vencedorRodadaRepository.find({
      where: { campeonatoId },
    });
    const rodadasIgnoradas = new Set(
      rodadasEspecificas.map(rodada => rodada.nomeRodada.trim().toLowerCase()),
    );

    // Busca pareos excluídos do campeonato
    const pareosExcluidos = await this.pareoExcluidoRepository.find({
      where: { campeonatoId },
    });

    // Cria um mapa para verificar rapidamente se um pareo está excluído
    const pareosExcluidosMap = new Map<string, PareoExcluido>();
    for (const excluido of pareosExcluidos) {
      const chave = `${excluido.tipoRodadaId}-${excluido.numeroPareo}`;
      pareosExcluidosMap.set(chave, excluido);
    }

    // Busca todas as apostas do apostador no campeonato com pareos e cavalos carregados
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.apostadorId = :apostadorId', { apostadorId })
      .getMany();

    const nomesCavalosVencedoresSet = new Set(nomesCavalosVencedores);

    const apostasVencedoras = apostas.filter(aposta => {
      if (!aposta.pareo || !aposta.pareo.cavalos) return false;

      // Verifica se a aposta está em um pareo excluído (mesmo tipoRodadaId e mesmo numeroPareo)
      const chavePareo = `${aposta.tipoRodadaId}-${aposta.pareo?.numero ?? ''}`;
      const pareoEstaExcluido = pareosExcluidosMap.has(chavePareo);
      
      // Se a aposta está em um pareo excluído, não conta nada
      if (pareoEstaExcluido) {
        return false;
      }

      const nomeRodada = aposta.nomeRodada?.trim().toLowerCase();
      if (nomeRodada && rodadasIgnoradas.has(nomeRodada)) {
        return false;
      }

      return aposta.pareo.cavalos.some(cavalo => {
        const nomeCavalo = cavalo.nome?.trim().toLowerCase();
        return nomeCavalo ? nomesCavalosVencedoresSet.has(nomeCavalo) : false;
      });
    });

    // Calcula o valor excluído por nomeRodada (agrupa todas as rodadas com mesmo nome)
    const valorExcluidoPorNomeRodada = new Map<string, number>();
    const rodadasUnicas = new Set<string>();
    for (const aposta of apostasVencedoras) {
      rodadasUnicas.add(aposta.nomeRodada);
    }

    for (const nomeRodada of rodadasUnicas) {
      let valorExcluidoTotal = 0;
      
      // Busca pareos excluídos apenas do mesmo tipoRodadaId
      for (const excluido of pareosExcluidos) {
        // Busca apostas do pareo excluído nesta rodada específica e do mesmo tipo
        const apostasPareoExcluido = await this.apostaRepository.find({
          where: {
            campeonatoId,
            tipoRodadaId: excluido.tipoRodadaId,
            nomeRodada: nomeRodada,
            pareo: { numero: excluido.numeroPareo }
          }
        });

        // Soma o valor das apostas do pareo excluído nesta rodada
        if (apostasPareoExcluido.length > 0) {
          const valorExcluidoPareo = apostasPareoExcluido.reduce(
            (sum, a) => sum + Number(a.valor),
            0
          );
          valorExcluidoTotal += valorExcluidoPareo;
        }
      }

      valorExcluidoPorNomeRodada.set(nomeRodada, valorExcluidoTotal);
    }

    // Calcula o valor excluído por apostador e rodada
    const valorExcluidoPorApostadorRodada = new Map<string, number>();
    
    // Agrupa apostas vencedoras por apostador e rodada
    const apostasPorApostadorRodada = new Map<string, Aposta[]>();
    for (const aposta of apostasVencedoras) {
      const chaveApostadorRodada = `${aposta.apostadorId}-${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
      if (!apostasPorApostadorRodada.has(chaveApostadorRodada)) {
        apostasPorApostadorRodada.set(chaveApostadorRodada, []);
      }
      apostasPorApostadorRodada.get(chaveApostadorRodada)!.push(aposta);
    }

    for (const [chaveApostadorRodada, apostasApostadorRodada] of apostasPorApostadorRodada) {
      const primeiraAposta = apostasApostadorRodada[0];
      const apostadorId = primeiraAposta.apostadorId;
      
      // Busca pareos excluídos apenas do mesmo tipoRodadaId
      const pareosExcluidosTipo = pareosExcluidos.filter(
        e => e.tipoRodadaId === primeiraAposta.tipoRodadaId
      );

      let valorExcluidoApostador = 0;
      for (const excluido of pareosExcluidosTipo) {
        // Busca apostas do pareo excluído nesta rodada específica e do mesmo tipo
        const apostasPareoExcluido = await this.apostaRepository.find({
          where: {
            campeonatoId,
            tipoRodadaId: excluido.tipoRodadaId,
            nomeRodada: primeiraAposta.nomeRodada,
            pareo: { numero: excluido.numeroPareo }
          }
        });

        // Calcula apenas a proporção deste apostador no pareo excluído
        if (apostasPareoExcluido.length > 0) {
          const apostasDoApostadorNoPareoExcluido = apostasPareoExcluido.filter(
            a => a.apostadorId === apostadorId
          );
          const valorApostadorNoPareoExcluido = apostasDoApostadorNoPareoExcluido.reduce(
            (sum, a) => sum + Number(a.valor),
            0
          );
          valorExcluidoApostador += valorApostadorNoPareoExcluido;
        }
      }

      valorExcluidoPorApostadorRodada.set(chaveApostadorRodada, valorExcluidoApostador);
    }

    const totalPremiosVencidos = apostasVencedoras.reduce((sum, aposta) => {
      // Calcula o valorOriginalPremio ajustado (descontando pareos excluídos por nomeRodada)
      const valorExcluidoPorNome = valorExcluidoPorNomeRodada.get(aposta.nomeRodada) || 0;
      const valorOriginalPremioAjustado = Number(aposta.valorOriginalPremio ?? 0) - valorExcluidoPorNome;
      
      // Desconta também o valor excluído específico deste apostador nesta rodada
      const chaveApostadorRodada = `${aposta.apostadorId}-${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
      const valorExcluidoApostador = valorExcluidoPorApostadorRodada.get(chaveApostadorRodada) || 0;
      const valorPremioAjustado = valorOriginalPremioAjustado - valorExcluidoApostador;
      
      // Aplica a retirada
      const valorPremioAposRetirada = valorPremioAjustado * (1 - Number(aposta.porcentagemRetirada ?? 0) / 100);
      
      // Calcula o valor proporcional baseado na porcentagem do apostador
      const valorPremioProporcional = valorPremioAposRetirada * (Number(aposta.porcentagemPremio ?? 0) / 100);
      
      return sum + valorPremioProporcional;
    }, 0);

    return totalPremiosVencidos;
  }

  private async obterGruposCombinados(
    campeonatoId: number,
  ): Promise<{
    nomeParaGrupo: Map<
      string,
      {
        identificador: string;
        nomeExibicao: string;
        nomes: string[];
      }
    >;
  }> {
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
      if (!identificador || !nome) {
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
        nomeExibicao: string;
        nomes: string[];
      }
    >();

    for (const grupo of gruposPorIdentificador.values()) {
      grupo.nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      grupo.nomeExibicao = grupo.nomes.join('/');

      for (const nome of grupo.nomes) {
        nomeParaGrupo.set(this.normalizarNome(nome), {
          identificador: grupo.identificador,
          nomeExibicao: grupo.nomeExibicao,
          nomes: [...grupo.nomes],
        });
      }
    }

    return { nomeParaGrupo };
  }

  private normalizarNome(nome: string): string {
    return nome.trim().toLowerCase();
  }
}


