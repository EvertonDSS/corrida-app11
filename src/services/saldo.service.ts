import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';
import { Vencedor } from '../entities/vencedor.entity';
import { RodadaCasa } from '../entities/rodada-casa.entity';

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
        const totalPremiosVencidos = await this.calcularTotalPremiosVencidos(apostador.id, campeonatoId);
        const saldoFinal = totalPremiosVencidos - totalApostado;

        return {
          nome: apostador.nome,
          totalApostado: Number(totalApostado.toFixed(2)),
          totalPremiosVencidos: Number(totalPremiosVencidos.toFixed(2)),
          saldoFinal: Number(saldoFinal.toFixed(2)),
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
      itens.push({
        nome: 'CASA',
        totalApostado: 0,
        totalPremiosVencidos: 0,
        saldoFinal: Number(totalCasa.toFixed(2)),
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
    // Busca o vencedor do campeonato
    const vencedor = await this.vencedorRepository.findOne({
      where: { campeonatoId },
      relations: ['cavalo'],
    });

    // Se não há vencedor definido, retorna 0
    if (!vencedor || !vencedor.cavalo) {
      return 0;
    }

    const nomeCavaloVencedor = vencedor.cavalo.nome.toLowerCase();

    // Busca o apostador pelo ID
    const apostador = await this.apostadorRepository.findOne({
      where: { id: apostadorId },
    });

    if (!apostador) {
      return 0;
    }

    // Busca todas as apostas do apostador no campeonato com pareos e cavalos carregados
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.apostadorId = :apostadorId', { apostadorId })
      .getMany();

    // Filtra apostas onde o pareo tem algum cavalo com o mesmo nome do cavalo vencedor (case-insensitive)
    const apostasVencedoras = apostas.filter(aposta => {
      if (!aposta.pareo || !aposta.pareo.cavalos) return false;
      return aposta.pareo.cavalos.some(
        cavalo => cavalo.nome.toLowerCase() === nomeCavaloVencedor
      );
    });

    // Soma os valores dos prêmios das apostas vencedoras (proporcional à porcentagemPremio)
    const totalPremiosVencidos = apostasVencedoras.reduce(
      (sum, aposta) => {
        // Calcula o valor proporcional baseado na porcentagem do apostador
        const valorPremioProporcional = Number(aposta.valorPremio || 0) * (Number(aposta.porcentagemPremio || 0) / 100);
        return sum + valorPremioProporcional;
      },
      0
    );

    return totalPremiosVencidos;
  }
}


