import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';
import { Vencedor } from '../entities/vencedor.entity';
import { RodadaCasa } from '../entities/rodada-casa.entity';
import { VencedorRodada } from '../entities/vencedor-rodada.entity';

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

    const itens = await Promise.all(
      apostadores.map(async (apostador) => {
        const apostas = await this.apostaRepository.find({
          where: { campeonatoId, apostadorId: apostador.id },
        });

        const totalApostado = apostas.reduce((sum, aposta) => sum + this.calcularValorRealApostado(aposta), 0);
        const totalPremiosVencidosBruto = await this.calcularTotalPremiosVencidos(apostador.id, campeonatoId);
        // Arredonda para baixo: 573.75 -> 573
        const totalPremiosVencidos = Math.floor(totalPremiosVencidosBruto);
        const saldoFinalBruto = totalPremiosVencidos - totalApostado;
        // Arredonda para baixo: positivos (573.75 -> 573), negativos (-573.75 -> -574)
        const saldoFinal = Math.floor(saldoFinalBruto);

        return {
          nome: apostador.nome,
          totalApostado: Number(totalApostado.toFixed(2)),
          totalPremiosVencidos: totalPremiosVencidos,
          saldoFinal: saldoFinal,
        };
      })
    );

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

      const nomeRodada = aposta.nomeRodada?.trim().toLowerCase();
      if (nomeRodada && rodadasIgnoradas.has(nomeRodada)) {
        return false;
      }

      return aposta.pareo.cavalos.some(cavalo => {
        const nomeCavalo = cavalo.nome?.trim().toLowerCase();
        return nomeCavalo ? nomesCavalosVencedoresSet.has(nomeCavalo) : false;
      });
    });

    const totalPremiosVencidos = apostasVencedoras.reduce((sum, aposta) => {
      const valorPremioProporcional =
        Number(aposta.valorPremio || 0) * (Number(aposta.porcentagemPremio || 0) / 100);
      return sum + valorPremioProporcional;
    }, 0);

    return totalPremiosVencidos;
  }
}


