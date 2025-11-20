import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GanhadorPossivel } from '../entities/ganhador-possivel.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { Aposta } from '../entities/aposta.entity';
import { TipoRodada } from '../entities/tipo-rodada.entity';
import { Pareo } from '../entities/pareo.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';

@Injectable()
export class GanhadorPossivelService {
  constructor(
    @InjectRepository(GanhadorPossivel)
    private readonly ganhadorPossivelRepository: Repository<GanhadorPossivel>,
    @InjectRepository(Cavalo)
    private readonly cavaloRepository: Repository<Cavalo>,
    @InjectRepository(Aposta)
    private readonly apostaRepository: Repository<Aposta>,
    @InjectRepository(TipoRodada)
    private readonly tipoRodadaRepository: Repository<TipoRodada>,
    @InjectRepository(Pareo)
    private readonly pareoRepository: Repository<Pareo>,
    @InjectRepository(PareoExcluido)
    private readonly pareoExcluidoRepository: Repository<PareoExcluido>,
  ) {}

  async definirGanhadoresPossiveis(
    campeonatoId: number,
    cavalosIds: number[],
  ): Promise<GanhadorPossivel[]> {
    // Verifica se os cavalos existem
    const cavalos = await this.cavaloRepository.find({
      where: { id: In(cavalosIds) },
    });

    if (cavalos.length !== cavalosIds.length) {
      const idsEncontrados = cavalos.map(c => c.id);
      const idsNaoEncontrados = cavalosIds.filter(id => !idsEncontrados.includes(id));
      throw new NotFoundException(`Cavalos com IDs ${idsNaoEncontrados.join(', ')} não encontrados`);
    }

    // Busca todos os tipos de rodada que têm pareos no campeonato
    const tiposRodadaIds = await this.pareoRepository
      .createQueryBuilder('pareo')
      .select('DISTINCT pareo.tipoRodadaId', 'tipoRodadaId')
      .where('pareo.campeonatoId = :campeonatoId', { campeonatoId })
      .getRawMany();

    if (tiposRodadaIds.length === 0) {
      throw new NotFoundException(`Nenhum tipo de rodada encontrado para o campeonato ${campeonatoId}`);
    }

    const tiposIds = tiposRodadaIds.map(item => item.tipoRodadaId);

    // Remove registros existentes para este campeonato e todos os tipos de rodada
    const registrosExistentes = await this.ganhadorPossivelRepository.find({
      where: { campeonatoId, tipoRodadaId: In(tiposIds) },
    });

    if (registrosExistentes.length > 0) {
      await this.ganhadorPossivelRepository.remove(registrosExistentes);
    }

    // Cria novos registros para cada tipo de rodada
    const novosRegistros: GanhadorPossivel[] = [];
    for (const tipoRodadaId of tiposIds) {
      for (const cavaloId of cavalosIds) {
        novosRegistros.push(
          this.ganhadorPossivelRepository.create({
            campeonatoId,
            tipoRodadaId,
            cavaloId,
            isVencedor: false,
          })
        );
      }
    }

    return await this.ganhadorPossivelRepository.save(novosRegistros);
  }

  async definirVencedor(
    campeonatoId: number,
    tipoRodadaId: number,
    cavaloId: number,
  ): Promise<GanhadorPossivel> {
    // Busca o registro do ganhador possível
    const ganhadorPossivel = await this.ganhadorPossivelRepository.findOne({
      where: { campeonatoId, tipoRodadaId, cavaloId },
    });

    if (!ganhadorPossivel) {
      throw new NotFoundException(
        `Cavalo ${cavaloId} não está na lista de ganhadores possíveis para o campeonato ${campeonatoId} e tipo de rodada ${tipoRodadaId}`,
      );
    }

    // Remove o status de vencedor de todos os outros cavalos do mesmo campeonato e tipo de rodada
    await this.ganhadorPossivelRepository.update(
      { campeonatoId, tipoRodadaId },
      { isVencedor: false },
    );

    // Define este cavalo como vencedor
    ganhadorPossivel.isVencedor = true;
    return await this.ganhadorPossivelRepository.save(ganhadorPossivel);
  }

  async buscarGanhadoresPossiveis(
    campeonatoId: number,
    tipoRodadaId: number,
  ): Promise<GanhadorPossivel[]> {
    return await this.ganhadorPossivelRepository.find({
      where: { campeonatoId, tipoRodadaId },
      order: { cavaloId: 'ASC' },
    });
  }

  async buscarGanhadoresPossiveisComApostadores(campeonatoId: number, agrupado: boolean = true): Promise<any> {
    // Busca todos os ganhadores possíveis do campeonato
    const ganhadoresPossiveis = await this.ganhadorPossivelRepository.find({
      where: { campeonatoId },
      order: { tipoRodadaId: 'ASC', cavaloId: 'ASC' },
    });

    if (ganhadoresPossiveis.length === 0) {
      return agrupado ? [] : {};
    }

    // Busca os tipos de rodada únicos
    const tiposRodadaIds = [...new Set(ganhadoresPossiveis.map(g => g.tipoRodadaId))];
    const tiposRodada = await this.tipoRodadaRepository.find({
      where: { id: In(tiposRodadaIds) },
    });
    const tiposRodadaMap = new Map(tiposRodada.map(tipo => [tipo.id, tipo.nome]));

    // Busca os cavalos ganhadores possíveis para obter os nomes
    const cavalosIds = [...new Set(ganhadoresPossiveis.map(g => g.cavaloId))];
    const cavalosGanhadoresPossiveis = await this.cavaloRepository.find({
      where: { id: In(cavalosIds) },
    });
    const nomesCavalosGanhadores = new Map(
      cavalosGanhadoresPossiveis.map(cavalo => [cavalo.id, (cavalo.nome || '').trim().toLowerCase()])
    );
    const nomesCavalosOriginais = new Map(
      cavalosGanhadoresPossiveis.map(cavalo => [cavalo.id, (cavalo.nome || '').trim()])
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

    if (agrupado) {
      // Agrupa por tipoRodadaId
      const agrupadoPorTipo = new Map<number, any>();

      for (const tipoRodadaId of tiposRodadaIds) {
        const ganhadoresDoTipo = ganhadoresPossiveis.filter(g => g.tipoRodadaId === tipoRodadaId);
        
        const cavalosComApostadores: any = {};
        const apostadoresPorCavalo = new Map<string, Map<string, number>>();
        
        // Filtra apostas apenas deste tipo de rodada quando agrupado
        const apostasDoTipo = apostas.filter(aposta => aposta.tipoRodadaId === tipoRodadaId);
        
        for (const ganhador of ganhadoresDoTipo) {
          const nomeCavaloGanhador = nomesCavalosGanhadores.get(ganhador.cavaloId);
          const nomeCavaloOriginal = nomesCavalosOriginais.get(ganhador.cavaloId);
          if (!nomeCavaloGanhador || !nomeCavaloOriginal) continue;

          // Busca apostas onde o pareo tem algum cavalo com o mesmo nome (case-insensitive)
          const apostasDoCavalo = apostasDoTipo.filter(aposta => {
            if (!aposta.pareo || !aposta.pareo.cavalos) return false;
            return aposta.pareo.cavalos.some(
              cavalo => cavalo.nome && cavalo.nome.trim().toLowerCase() === nomeCavaloGanhador.trim().toLowerCase()
            );
          });

          // Inicializa o mapa para este cavalo se não existir
          if (!apostadoresPorCavalo.has(nomeCavaloOriginal)) {
            apostadoresPorCavalo.set(nomeCavaloOriginal, new Map<string, number>());
          }

          const mapaApostadores = apostadoresPorCavalo.get(nomeCavaloOriginal)!;

          // Soma os valores de prêmio para cada apostador (proporcional à porcentagemPremio)
          for (const aposta of apostasDoCavalo) {
            // Verifica se a aposta está em um pareo excluído (mesmo tipoRodadaId e mesmo numeroPareo)
            const chavePareo = `${aposta.tipoRodadaId}-${aposta.pareo?.numero ?? ''}`;
            const pareoEstaExcluido = pareosExcluidosMap.has(chavePareo);
            
            // Se a aposta está em um pareo excluído, não conta nada
            if (pareoEstaExcluido) {
              continue;
            }

            // Se agrupado = true, não soma se o nomeRodada contiver 'final' (case-insensitive)
            if (agrupado && aposta.nomeRodada && aposta.nomeRodada.toLowerCase().includes('final')) {
              continue;
            }

            const nomeApostador = aposta.apostador.nome;
            
            // Calcula o valor excluído por nomeRodada (apenas pareos do mesmo tipoRodadaId)
            const rodadasUnicas = new Set<string>();
            rodadasUnicas.add(aposta.nomeRodada);
            
            let valorExcluidoPorNome = 0;
            for (const nomeRodada of rodadasUnicas) {
              // Busca pareos excluídos apenas do mesmo tipoRodadaId
              const pareosExcluidosTipo = pareosExcluidos.filter(
                e => e.tipoRodadaId === aposta.tipoRodadaId
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
                  valorExcluidoPorNome += valorExcluidoPareo;
                }
              }
            }

            // Calcula o valor excluído específico deste apostador nesta rodada
            const pareosExcluidosTipoApostador = pareosExcluidos.filter(
              e => e.tipoRodadaId === aposta.tipoRodadaId
            );

            let valorExcluidoApostador = 0;
            for (const excluido of pareosExcluidosTipoApostador) {
              // Busca apostas do pareo excluído nesta rodada específica e do mesmo tipo
              const apostasPareoExcluido = await this.apostaRepository.find({
                where: {
                  campeonatoId,
                  tipoRodadaId: excluido.tipoRodadaId,
                  nomeRodada: aposta.nomeRodada,
                  pareo: { numero: excluido.numeroPareo }
                }
              });

              // Calcula apenas a proporção deste apostador no pareo excluído
              if (apostasPareoExcluido.length > 0) {
                const apostasDoApostadorNoPareoExcluido = apostasPareoExcluido.filter(
                  a => a.apostadorId === aposta.apostadorId
                );
                const valorApostadorNoPareoExcluido = apostasDoApostadorNoPareoExcluido.reduce(
                  (sum, a) => sum + Number(a.valor),
                  0
                );
                valorExcluidoApostador += valorApostadorNoPareoExcluido;
              }
            }

            // Calcula o valorOriginalPremio ajustado (descontando pareos excluídos por nomeRodada)
            const valorOriginalPremioAjustado = Number(aposta.valorOriginalPremio ?? 0) - valorExcluidoPorNome;
            
            // Desconta também o valor excluído específico deste apostador nesta rodada
            const valorPremioAjustado = valorOriginalPremioAjustado - valorExcluidoApostador;
            
            // Aplica a retirada
            const valorPremioAposRetirada = valorPremioAjustado * (1 - Number(aposta.porcentagemRetirada ?? 0) / 100);
            
            // Calcula o valor proporcional baseado na porcentagem do apostador
            const valorPremioProporcional = valorPremioAposRetirada * (Number(aposta.porcentagemPremio ?? 0) / 100);
            
            if (mapaApostadores.has(nomeApostador)) {
              mapaApostadores.set(nomeApostador, mapaApostadores.get(nomeApostador)! + valorPremioProporcional);
            } else {
              mapaApostadores.set(nomeApostador, valorPremioProporcional);
            }
          }
        }

        // Converte os mapas em arrays de objetos para cada cavalo
        for (const [nomeCavalo, mapaApostadores] of apostadoresPorCavalo) {
          const apostadores = Array.from(mapaApostadores.entries())
            .map(([nomeapostador, valorpremio]) => ({
              nomeapostador,
              valorpremio: Number(valorpremio.toFixed(2)),
            }))
            .sort((a, b) => a.nomeapostador.localeCompare(b.nomeapostador));
          cavalosComApostadores[nomeCavalo] = apostadores;
        }

        agrupadoPorTipo.set(tipoRodadaId, {
          tiporodada: tipoRodadaId,
          nometiporodada: tiposRodadaMap.get(tipoRodadaId) || '',
          ...cavalosComApostadores,
        });
      }

      return Array.from(agrupadoPorTipo.values());
    } else {
      // Não agrupa por tipo de rodada - agrupa apenas por cavalo
      const cavalosComApostadores: any = {};
      const apostadoresPorCavalo = new Map<string, Map<string, number>>();

      // Para cada ganhador possível, busca suas apostas
      for (const ganhador of ganhadoresPossiveis) {
        const nomeCavaloGanhador = nomesCavalosGanhadores.get(ganhador.cavaloId);
        const nomeCavaloOriginal = nomesCavalosOriginais.get(ganhador.cavaloId);
        if (!nomeCavaloGanhador || !nomeCavaloOriginal) continue;

        // Busca apostas onde o pareo tem algum cavalo com o mesmo nome (case-insensitive)
        const apostasDoCavalo = apostas.filter(aposta => {
          if (!aposta.pareo || !aposta.pareo.cavalos) return false;
          return aposta.pareo.cavalos.some(
            cavalo => cavalo.nome && cavalo.nome.trim().toLowerCase() === nomeCavaloGanhador.trim().toLowerCase()
          );
        });

        // Inicializa o mapa para este cavalo se não existir
        if (!apostadoresPorCavalo.has(nomeCavaloOriginal)) {
          apostadoresPorCavalo.set(nomeCavaloOriginal, new Map<string, number>());
        }

        const mapaApostadores = apostadoresPorCavalo.get(nomeCavaloOriginal)!;

        // Soma os valores de prêmio para cada apostador (proporcional à porcentagemPremio)
        for (const aposta of apostasDoCavalo) {
          // Verifica se a aposta está em um pareo excluído (mesmo tipoRodadaId e mesmo numeroPareo)
          const chavePareo = `${aposta.tipoRodadaId}-${aposta.pareo?.numero ?? ''}`;
          const pareoEstaExcluido = pareosExcluidosMap.has(chavePareo);
          
          // Se a aposta está em um pareo excluído, não conta nada
          if (pareoEstaExcluido) {
            continue;
          }

          // Se agrupado = false, não soma se o nometiporodada contiver 'final' (case-insensitive)
          if (!agrupado) {
            const nomeTipoRodada = tiposRodadaMap.get(aposta.tipoRodadaId) || '';
            if (nomeTipoRodada.toLowerCase().includes('final')) {
              continue;
            }
          }
          
          const nomeApostador = aposta.apostador.nome;
          
          // Calcula o valor excluído por nomeRodada (apenas pareos do mesmo tipoRodadaId)
          const rodadasUnicas = new Set<string>();
          rodadasUnicas.add(aposta.nomeRodada);
          
          let valorExcluidoPorNome = 0;
          for (const nomeRodada of rodadasUnicas) {
            // Busca pareos excluídos apenas do mesmo tipoRodadaId
            const pareosExcluidosTipo = pareosExcluidos.filter(
              e => e.tipoRodadaId === aposta.tipoRodadaId
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
                valorExcluidoPorNome += valorExcluidoPareo;
              }
            }
          }

          // Calcula o valor excluído específico deste apostador nesta rodada
          const pareosExcluidosTipoApostador = pareosExcluidos.filter(
            e => e.tipoRodadaId === aposta.tipoRodadaId
          );

          let valorExcluidoApostador = 0;
          for (const excluido of pareosExcluidosTipoApostador) {
            // Busca apostas do pareo excluído nesta rodada específica e do mesmo tipo
            const apostasPareoExcluido = await this.apostaRepository.find({
              where: {
                campeonatoId,
                tipoRodadaId: excluido.tipoRodadaId,
                nomeRodada: aposta.nomeRodada,
                pareo: { numero: excluido.numeroPareo }
              }
            });

            // Calcula apenas a proporção deste apostador no pareo excluído
            if (apostasPareoExcluido.length > 0) {
              const apostasDoApostadorNoPareoExcluido = apostasPareoExcluido.filter(
                a => a.apostadorId === aposta.apostadorId
              );
              const valorApostadorNoPareoExcluido = apostasDoApostadorNoPareoExcluido.reduce(
                (sum, a) => sum + Number(a.valor),
                0
              );
              valorExcluidoApostador += valorApostadorNoPareoExcluido;
            }
          }

          // Calcula o valorOriginalPremio ajustado (descontando pareos excluídos por nomeRodada)
          const valorOriginalPremioAjustado = Number(aposta.valorOriginalPremio ?? 0) - valorExcluidoPorNome;
          
          // Desconta também o valor excluído específico deste apostador nesta rodada
          const valorPremioAjustado = valorOriginalPremioAjustado - valorExcluidoApostador;
          
          // Aplica a retirada
          const valorPremioAposRetirada = valorPremioAjustado * (1 - Number(aposta.porcentagemRetirada ?? 0) / 100);
          
          // Calcula o valor proporcional baseado na porcentagem do apostador
          const valorPremioProporcional = valorPremioAposRetirada * (Number(aposta.porcentagemPremio ?? 0) / 100);
          
          if (mapaApostadores.has(nomeApostador)) {
            mapaApostadores.set(nomeApostador, mapaApostadores.get(nomeApostador)! + valorPremioProporcional);
          } else {
            mapaApostadores.set(nomeApostador, valorPremioProporcional);
          }
        }
      }

      // Converte os mapas em arrays de objetos
      for (const [nomeCavalo, mapaApostadores] of apostadoresPorCavalo) {
        const apostadores = Array.from(mapaApostadores.entries())
          .map(([nomeapostador, valorpremio]) => ({
            nomeapostador,
            valorpremio: Number(valorpremio.toFixed(2)),
          }))
          .sort((a, b) => a.nomeapostador.localeCompare(b.nomeapostador));
        cavalosComApostadores[nomeCavalo] = apostadores;
      }

      return cavalosComApostadores;
    }
  }
}
