import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';
import { Pareo } from '../entities/pareo.entity';

@Injectable()
export class ApostaService {
  constructor(
    @InjectRepository(Aposta)
    private apostaRepository: Repository<Aposta>,
    @InjectRepository(Apostador)
    private apostadorRepository: Repository<Apostador>,
    @InjectRepository(Pareo)
    private pareoRepository: Repository<Pareo>,
  ) {}

  async salvarApostas(campeonatoId: number, tipoRodadaId: number, texto: string): Promise<any> {
    // Processa o texto das apostas (incluindo nome da rodada)
    const { nomeRodada, apostasData, totalApostado, porcentagemRetirada } = this.processarTextoApostas(texto);

    // Verifica se já existem apostas para esta rodada
    const apostasExistentes = await this.apostaRepository.find({
      where: {
        campeonatoId,
        tipoRodadaId,
        nomeRodada
      }
    });

    // Se existem apostas, remove todas antes de adicionar as novas
    if (apostasExistentes.length > 0) {
      await this.apostaRepository.remove(apostasExistentes);
    }

    // Calcula o total de prêmio (total - retirada)
    const totalPremio = totalApostado * (1 - porcentagemRetirada / 100);

    // Processa cada aposta
    for (const apostaData of apostasData) {
      // Busca o pareo pelo número (agora busca por campeonato e tipo)
      const pareo = await this.pareoRepository.findOne({
        where: {
          campeonatoId,
          tipoRodadaId,
          numero: apostaData.numeroPareo
        },
      });

      if (!pareo) {
        continue; // Pula se não encontrar o pareo
      }

      // Processa cada apostador da aposta
      for (const apostadorData of apostaData.apostadores) {
        // Busca ou cria o apostador
        let apostador = await this.apostadorRepository.findOne({
          where: { nome: apostadorData.nome },
        });

        if (!apostador) {
          apostador = this.apostadorRepository.create({
            nome: apostadorData.nome,
          });
          apostador = await this.apostadorRepository.save(apostador);
        }

        // Calcula valores
        const valorAposta = apostaData.valor * (apostadorData.porcentagemAposta / 100);
        const valorOriginalPremio = totalApostado; // Valor original total do prêmio
        const valorPremio = totalPremio; // Valor do prêmio após retirada

        // Cria a aposta
        const aposta = this.apostaRepository.create({
          campeonatoId,
          tipoRodadaId,
          nomeRodada,
          pareoId: pareo.id,
          apostadorId: apostador.id,
          valor: valorAposta,
          valorOriginal: apostaData.valor,
          porcentagemAposta: apostadorData.porcentagemAposta,
          porcentagemPremio: apostadorData.porcentagemPremio,
          valorPremio: valorPremio,
          valorOriginalPremio: valorOriginalPremio,
          porcentagemRetirada: porcentagemRetirada,
        });

        await this.apostaRepository.save(aposta);
      }
    }

    // Retorna os dados processados
    return {
      campeonatoId,
      tipoRodadaId,
      nomeRodada,
      totalApostado,
      porcentagemRetirada,
      totalPremio,
      totalApostas: apostasData.length,
      substituida: apostasExistentes.length > 0
    };
  }

  private processarTextoApostas(texto: string): {
    nomeRodada: string;
    apostasData: Array<{
      numeroPareo: string;
      valor: number;
      apostadores: Array<{
        nome: string;
        porcentagemAposta: number;
        porcentagemPremio: number;
        observacoes?: string;
      }>;
    }>;
    totalApostado: number;
    porcentagemRetirada: number;
  } {
    const linhas = texto.split('\n');
    
    // Extrai o nome da rodada (primeira linha até o ponto e vírgula)
    const primeiraLinha = linhas[0]?.trim() || '';
    const nomeRodada = primeiraLinha.split(';')[0]?.trim() || '';
    
    // Filtra linhas vazias para processar apostas
    const linhasApostas = linhas.filter(linha => linha.trim());
    
    // Extrai total e porcentagem de retirada
    let totalApostado = 0;
    let porcentagemRetirada = 0;

    for (const linha of linhasApostas) {
      if (linha.includes('TOTAL R$')) {
        const match = linha.match(/TOTAL R\$ ([\d.,]+)/);
        if (match) {
          totalApostado = this.parsearValorBrasileiro(match[1]);
        }
      } else if (linha.includes('Retirada')) {
        const match = linha.match(/Retirada (\d+)%/);
        if (match) {
          porcentagemRetirada = parseFloat(match[1]);
        }
      }
    }

    // Processa apostas
    const apostasData: Array<{
      numeroPareo: string;
      valor: number;
      apostadores: Array<{
        nome: string;
        porcentagemAposta: number;
        porcentagemPremio: number;
        observacoes?: string;
      }>;
    }> = [];

    for (const linha of linhasApostas) {
      const match = linha.match(/^(\d+)- ([\d.,]+) (.+?) ✅/);
      if (match) {
        const numeroPareo = match[1].padStart(2, '0');
        const valor = this.parsearValorBrasileiro(match[2]);
        const apostadoresTexto = match[3];

        // Processa apostadores
        const apostadores = this.processarApostadores(apostadoresTexto);

        apostasData.push({
          numeroPareo,
          valor,
          apostadores,
        });
      }
    }

    return { nomeRodada, apostasData, totalApostado, porcentagemRetirada };
  }

  private processarApostadores(apostadoresTexto: string): Array<{
    nome: string;
    porcentagemAposta: number;
    porcentagemPremio: number;
  }> {
    const apostadores: Array<{
      nome: string;
      porcentagemAposta: number;
      porcentagemPremio: number;
    }> = [];

    // Verifica se há divisão com múltiplos apostadores (ex: "nome1 50% / nome2 25% / nome3 25%")
    if (apostadoresTexto.includes(' / ')) {
      const partes = apostadoresTexto.split(' / ').map(p => p.trim());
      const apostadoresComPorcentagem: Array<{ nome: string; porcentagem?: number }> = [];
      let totalPorcentagemDefinida = 0;

      // Processa cada parte para extrair nome e porcentagem
      for (const parte of partes) {
        const match = parte.match(/^(.+?)\s+(\d+)%$/);
        if (match) {
          const nome = match[1].trim();
          const porcentagem = parseFloat(match[2]);
          apostadoresComPorcentagem.push({ nome, porcentagem });
          totalPorcentagemDefinida += porcentagem;
        } else {
          // Nome sem porcentagem definida
          apostadoresComPorcentagem.push({ nome: parte });
        }
      }

      // Calcula porcentagens
      const totalApostadores = apostadoresComPorcentagem.length;
      const porcentagemRestante = 100 - totalPorcentagemDefinida;
      const apostadoresSemPorcentagem = apostadoresComPorcentagem.filter(a => !a.porcentagem);

      for (const apostador of apostadoresComPorcentagem) {
        let porcentagem: number;
        
        if (apostador.porcentagem) {
          porcentagem = apostador.porcentagem;
        } else if (apostadoresSemPorcentagem.length === 1) {
          // Se só há um sem porcentagem, ele fica com o restante
          porcentagem = porcentagemRestante;
        } else {
          // Se há múltiplos sem porcentagem, divide igualmente o restante
          porcentagem = porcentagemRestante / apostadoresSemPorcentagem.length;
        }

        apostadores.push({
          nome: apostador.nome,
          porcentagemAposta: porcentagem,
          porcentagemPremio: porcentagem,
        });
      }
    }
    // Apostador único
    else {
      apostadores.push({
        nome: apostadoresTexto.trim(),
        porcentagemAposta: 100,
        porcentagemPremio: 100,
      });
    }

    return apostadores;
  }

  private parsearValorBrasileiro(valor: string): number {
    // Remove pontos de milhares e substitui vírgula por ponto
    return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
  }

  async findByNomeRodada(campeonatoId: number, tipoRodadaId: number, nomeRodada: string): Promise<Aposta[]> {
    return await this.apostaRepository.find({
      where: { campeonatoId, tipoRodadaId, nomeRodada },
      relations: ['apostador', 'pareo', 'tipoRodada'],
    });
  }

  async findByCampeonato(campeonatoId: number): Promise<Aposta[]> {
    return await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .where('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .getMany();
  }



}
