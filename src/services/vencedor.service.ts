import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vencedor } from '../entities/vencedor.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { Campeonato } from '../entities/campeonato.entity';
import { Aposta } from '../entities/aposta.entity';
import { CreateVencedorDto } from '../dto/create-vencedor.dto';
import { VencedorRodada } from '../entities/vencedor-rodada.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';
import { Pareo } from '../entities/pareo.entity';

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
    @InjectRepository(PareoExcluido)
    private readonly pareoExcluidoRepository: Repository<PareoExcluido>,
    @InjectRepository(Pareo)
    private readonly pareoRepository: Repository<Pareo>,
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

    // Busca todas as apostas do campeonato com pareos e cavalos carregados
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .getMany();



    const vencedoresFormatados = await Promise.all(
      vencedoresCampeonato.map(async vencedor => {
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

        // Calcula o valor excluído por nomeRodada (apenas pareos do mesmo tipoRodadaId)
        const valorExcluidoPorNomeRodada = new Map<string, number>();
        const rodadasUnicas = new Set<string>();
        for (const aposta of apostasVencedoras) {
          rodadasUnicas.add(aposta.nomeRodada);
        }

        // Agrupa apostas vencedoras por tipoRodadaId para verificar pareos excluídos do mesmo tipo
        const tiposRodadaVencedoras = new Set<number>();
        for (const aposta of apostasVencedoras) {
          tiposRodadaVencedoras.add(aposta.tipoRodadaId);
        }

        for (const nomeRodada of rodadasUnicas) {
          let valorExcluidoTotal = 0;
          
          // Busca pareos excluídos apenas dos tipos das apostas vencedoras
          for (const tipoRodadaId of tiposRodadaVencedoras) {
            const pareosExcluidosTipo = pareosExcluidos.filter(
              e => e.tipoRodadaId === tipoRodadaId
            );

            for (const excluido of pareosExcluidosTipo) {
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
          }

          valorExcluidoPorNomeRodada.set(nomeRodada, valorExcluidoTotal);
        }

        // Calcula o valor excluído por apostador e rodada (similar ao PDF)
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
          
          // Busca pareos excluídos deste tipo de rodada
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

        apostasVencedoras.forEach(aposta => {
          const nomeApostador = aposta.apostador?.nome ?? 'Desconhecido';
          const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
          
          // Verifica se a aposta está em um pareo excluído (mesmo tipoRodadaId e mesmo numeroPareo)
          const chavePareo = `${aposta.tipoRodadaId}-${aposta.pareo?.numero ?? ''}`;
          const pareoEstaExcluido = pareosExcluidosMap.has(chavePareo);
          
          // Se a aposta está em um pareo excluído, não conta nada
          if (pareoEstaExcluido) {
            return;
          }

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
      })
    );

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

