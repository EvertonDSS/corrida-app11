import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';

@Injectable()
export class SaldoService {
  constructor(
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
    @InjectRepository(Aposta)
    private readonly apostaRepository: Repository<Aposta>,
    @InjectRepository(Apostador)
    private readonly apostadorRepository: Repository<Apostador>,
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
          id: apostador.id,
          nome: apostador.nome,
          totalApostado: Number(totalApostado.toFixed(2)),
          totalPremiosVencidos: Number(totalPremiosVencidos.toFixed(2)),
          saldoFinal: Number(saldoFinal.toFixed(2)),
        };
      })
    );

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

  // Placeholder: por enquanto retorna 0 conforme pedido
  private async calcularTotalPremiosVencidos(apostadorId: number, campeonatoId: number): Promise<number> {
    return 0;
  }
}


