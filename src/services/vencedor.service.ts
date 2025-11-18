import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vencedor } from '../entities/vencedor.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { CreateVencedorDto } from '../dto/create-vencedor.dto';
import { VencedorRodada } from '../entities/vencedor-rodada.entity';

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
    @InjectRepository(VencedorRodada)
    private readonly vencedorRodadaRepository: Repository<VencedorRodada>,
  ) {}

  async criarVencedor(
    campeonatoId: number,
    createDto: CreateVencedorDto,
  ): Promise<Vencedor[]> {
    // Verifica se o campeonato existe
    const campeonato = await this.campeonatoRepository.findOne({
      where: { id: campeonatoId },
    });

    if (!campeonato) {
      throw new NotFoundException(`Campeonato com ID ${campeonatoId} não encontrado`);
    }

    const idsInformados = this.normalizarCavalosIds(createDto);

    if (!idsInformados.length) {
      throw new BadRequestException('Informe pelo menos um cavalo para registrar como vencedor.');
    }

    const cavalosEncontrados = await this.cavaloRepository
      .createQueryBuilder('cavalo')
      .innerJoin('cavalo.pareo', 'pareo')
      .where('cavalo.id IN (:...cavalosIds)', { cavalosIds: idsInformados })
      .andWhere('pareo.campeonatoId = :campeonatoId', { campeonatoId })
      .getMany();

    const idsEncontrados = cavalosEncontrados.map(cavalo => cavalo.id);
    const idsNaoEncontrados = idsInformados.filter(id => !idsEncontrados.includes(id));

    if (idsNaoEncontrados.length) {
      throw new NotFoundException(
        `Os cavalos [${idsNaoEncontrados.join(', ')}] não foram encontrados no campeonato ${campeonatoId}`,
      );
    }

    const substituirTodos = !!createDto.cavalosIds?.length;

    if (substituirTodos) {
      await this.vencedorRepository.delete({ campeonatoId });
    }

    const existentes = await this.vencedorRepository.find({
      where: { campeonatoId },
    });
    const idsJaCadastrados = new Set(existentes.map(v => v.cavaloId));

    const idsParaCriar = substituirTodos
      ? idsInformados
      : idsInformados.filter(id => !idsJaCadastrados.has(id));

    if (idsParaCriar.length) {
      const vencedoresParaSalvar = idsParaCriar.map(id =>
        this.vencedorRepository.create({ campeonatoId, cavaloId: id }),
      );
      await this.vencedorRepository.save(vencedoresParaSalvar);
    }

    return this.vencedorRepository.find({
      where: { campeonatoId },
      relations: ['cavalo', 'campeonato'],
      order: { createdAt: 'ASC' },
    });
  }

  async buscarVencedorPorCampeonato(campeonatoId: number): Promise<any> {
    const vencedoresCampeonato = await this.vencedorRepository.find({
      where: { campeonatoId },
      relations: ['cavalo', 'campeonato'],
      order: { createdAt: 'ASC' },
    });

    if (!vencedoresCampeonato.length) {
      throw new NotFoundException(`Vencedor não encontrado para o campeonato ${campeonatoId}`);
    }

    const vencedoresEspecificos = await this.vencedorRodadaRepository.find({
      where: { campeonatoId },
    });
    const rodadasComVencedorEspecifico = new Set(
      vencedoresEspecificos.map(item => item.nomeRodada.trim().toLowerCase()),
    );

    // Busca todas as apostas do campeonato com pareos e cavalos carregados
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .getMany();

    const vencedoresFormatados = vencedoresCampeonato.map(vencedor => {
      const nomeCavaloVencedor = vencedor.cavalo.nome;
      const nomeCavaloVencedorLower = nomeCavaloVencedor.toLowerCase();

      const apostasVencedoras = apostas.filter(aposta => {
        if (!aposta.pareo || !aposta.pareo.cavalos) return false;
        const nomeRodadaAposta = aposta.nomeRodada?.trim().toLowerCase();
        if (nomeRodadaAposta && rodadasComVencedorEspecifico.has(nomeRodadaAposta)) {
          return false;
        }
        return aposta.pareo.cavalos.some(
          cavalo => cavalo.nome.toLowerCase() === nomeCavaloVencedorLower
        );
      });

      const valoresPorApostador = new Map<string, number>();

      apostasVencedoras.forEach(aposta => {
        const nomeApostador = aposta.apostador?.nome ?? 'Desconhecido';
        // Calcula o valor proporcional baseado na porcentagem do apostador
        const valorPremioProporcional = Number(aposta.valorPremio ?? 0) * (Number(aposta.porcentagemPremio ?? 0) / 100);
        const acumuladoAtual = valoresPorApostador.get(nomeApostador) ?? 0;
        valoresPorApostador.set(nomeApostador, acumuladoAtual + valorPremioProporcional);
      });

      const vencedores = Array.from(valoresPorApostador.entries())
        .map(([nome, valor]) => ({
          nomeapostador: nome,
          valorpremio: Number(valor.toFixed(2)),
        }))
        .sort((a, b) => a.nomeapostador.localeCompare(b.nomeapostador));

      return {
        cavaloId: vencedor.cavaloId,
        nomecavalovencedor: nomeCavaloVencedor,
        vencedores,
      };
    });

    return {
      vencedores: vencedoresFormatados,
    };
  }

  async listarVencedores(): Promise<Vencedor[]> {
    return await this.vencedorRepository.find({
      relations: ['cavalo', 'campeonato'],
      order: { createdAt: 'DESC' },
    });
  }

  private normalizarCavalosIds(createDto: CreateVencedorDto): number[] {
    if (createDto.cavalosIds?.length) {
      return Array.from(new Set(createDto.cavalosIds));
    }

    if (createDto.cavaloId) {
      return [createDto.cavaloId];
    }

    return [];
  }
}

