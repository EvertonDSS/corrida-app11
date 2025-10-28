import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Apostador } from '../entities/apostador.entity';
import { Aposta } from '../entities/aposta.entity';

@Injectable()
export class ApostadorService {
  constructor(
    @InjectRepository(Apostador)
    private apostadorRepository: Repository<Apostador>,
    @InjectRepository(Aposta)
    private apostaRepository: Repository<Aposta>,
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
}
