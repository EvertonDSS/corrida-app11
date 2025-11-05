import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vencedor } from '../entities/vencedor.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { CreateVencedorDto } from '../dto/create-vencedor.dto';

@Injectable()
export class VencedorService {
  constructor(
    @InjectRepository(Vencedor)
    private readonly vencedorRepository: Repository<Vencedor>,
    @InjectRepository(Cavalo)
    private readonly cavaloRepository: Repository<Cavalo>,
    @InjectRepository(Campeonato)
    private readonly campeonatoRepository: Repository<Campeonato>,
    @InjectRepository(Aposta)
    private readonly apostaRepository: Repository<Aposta>,
  ) {}

  async criarVencedor(campeonatoId: number, createDto: CreateVencedorDto): Promise<Vencedor> {
    // Verifica se o campeonato existe
    const campeonato = await this.campeonatoRepository.findOne({
      where: { id: campeonatoId },
    });

    if (!campeonato) {
      throw new NotFoundException(`Campeonato com ID ${campeonatoId} não encontrado`);
    }

    // Busca o cavalo pelo ID e verifica se pertence ao campeonato
    const cavaloEncontrado = await this.cavaloRepository
      .createQueryBuilder('cavalo')
      .innerJoin('cavalo.pareo', 'pareo')
      .where('cavalo.id = :cavaloId', { cavaloId: createDto.cavaloId })
      .andWhere('pareo.campeonatoId = :campeonatoId', { campeonatoId })
      .getOne();

    if (!cavaloEncontrado) {
      throw new NotFoundException(
        `Cavalo com ID ${createDto.cavaloId} não encontrado no campeonato ${campeonatoId}`
      );
    }

    // Verifica se já existe um vencedor para este campeonato
    const vencedorExistente = await this.vencedorRepository.findOne({
      where: { campeonatoId },
    });

    if (vencedorExistente) {
      // Atualiza o vencedor existente
      vencedorExistente.cavaloId = cavaloEncontrado.id;
      vencedorExistente.updatedAt = new Date();
      return await this.vencedorRepository.save(vencedorExistente);
    }

    // Cria novo vencedor
    const vencedor = this.vencedorRepository.create({
      campeonatoId,
      cavaloId: cavaloEncontrado.id,
    });

    return await this.vencedorRepository.save(vencedor);
  }

  async buscarVencedorPorCampeonato(campeonatoId: number): Promise<any> {
    const vencedor = await this.vencedorRepository.findOne({
      where: { campeonatoId },
      relations: ['cavalo', 'campeonato'],
    });

    if (!vencedor) {
      throw new NotFoundException(`Vencedor não encontrado para o campeonato ${campeonatoId}`);
    }

    // Busca o nome do cavalo vencedor
    const nomeCavaloVencedor = vencedor.cavalo.nome;
    const nomeCavaloVencedorLower = nomeCavaloVencedor.toLowerCase();

    // Busca todas as apostas do campeonato com pareos e cavalos carregados
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .getMany();

    // Filtra apostas onde o pareo tem algum cavalo com o mesmo nome (case-insensitive)
    const apostasVencedoras = apostas.filter(aposta => {
      if (!aposta.pareo || !aposta.pareo.cavalos) return false;
      return aposta.pareo.cavalos.some(
        cavalo => cavalo.nome.toLowerCase() === nomeCavaloVencedorLower
      );
    });

    // Formata apostadores vencedores com nome e valor do prêmio
    const vencedores = apostasVencedoras.map(aposta => ({
      nomeapostador: aposta.apostador.nome,
      valorpremio: Number(aposta.valorPremio),
    }));

    return {
      nomecavalovencedor: nomeCavaloVencedor,
      vencedores: vencedores,
    };
  }

  async listarVencedores(): Promise<Vencedor[]> {
    return await this.vencedorRepository.find({
      relations: ['cavalo', 'campeonato'],
      order: { createdAt: 'DESC' },
    });
  }
}

