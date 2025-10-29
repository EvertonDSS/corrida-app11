import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async renomearApostador(campeonatoId: number, nomeOriginal: string, novoNome: string): Promise<any> {
    // Normaliza os nomes
    const nomeOriginalNormalizado = nomeOriginal.trim();
    const novoNomeNormalizado = novoNome.trim();

    // Verifica se o novo nome já existe (case insensitive)
    const apostadorExistente = await this.apostadorRepository
      .createQueryBuilder('apostador')
      .where('LOWER(apostador.nome) = LOWER(:nome)', { nome: novoNomeNormalizado })
      .getOne();

    if (apostadorExistente) {
      throw new ConflictException(`Já existe um apostador com o nome "${novoNomeNormalizado}"`);
    }

    // Busca o apostador pelo nome original (case insensitive)
    const apostador = await this.apostadorRepository
      .createQueryBuilder('apostador')
      .where('LOWER(apostador.nome) = LOWER(:nome)', { nome: nomeOriginalNormalizado })
      .getOne();

    if (!apostador) {
      throw new NotFoundException(`Apostador com nome "${nomeOriginalNormalizado}" não encontrado`);
    }

    // Verifica se o apostador tem apostas no campeonato especificado
    const apostasNoCampeonato = await this.apostaRepository.find({
      where: {
        apostadorId: apostador.id,
        campeonatoId: campeonatoId
      }
    });

    if (apostasNoCampeonato.length === 0) {
      throw new NotFoundException(`Apostador "${nomeOriginalNormalizado}" não possui apostas no campeonato ${campeonatoId}`);
    }

    // Atualiza o nome do apostador
    apostador.nome = novoNomeNormalizado;
    apostador.updatedAt = new Date();
    
    const apostadorAtualizado = await this.apostadorRepository.save(apostador);

    // Retorna o resultado
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
      novoNome: novoNomeNormalizado
    };
  }
}
