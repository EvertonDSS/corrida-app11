import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Pareo } from '../entities/pareo.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { TipoRodada } from '../entities/tipo-rodada.entity';

interface PareoData {
  numero: string;
  cavalos: Array<{
    nome: string;
    identificador?: string | null;
  }>;
}

@Injectable()
export class PareoService {
  constructor(
    @InjectRepository(Pareo)
    private pareoRepository: Repository<Pareo>,
    @InjectRepository(Cavalo)
    private cavaloRepository: Repository<Cavalo>,
    @InjectRepository(TipoRodada)
    private tipoRodadaRepository: Repository<TipoRodada>,
  ) {}

  async criarPareos(campeonatoId: number, tipoRodadaId: number, texto: string): Promise<any> {
    const pareosData = this.processarTextoPareos(texto);
    
    const pareosCriados: Array<{
      pareo: Pareo;
      cavalos: Cavalo[];
    }> = [];

    for (const pareoData of pareosData) {
      // Cria o pareo
      const pareo = this.pareoRepository.create({
        campeonatoId,
        tipoRodadaId,
        numero: pareoData.numero,
      });
      const savedPareo = await this.pareoRepository.save(pareo);

      // Cria os cavalos do pareo
      const cavalos: Cavalo[] = [];
      for (const cavaloData of pareoData.cavalos) {
        const cavalo = this.cavaloRepository.create({
          pareoId: savedPareo.id,
          nome: cavaloData.nome,
          identificador: cavaloData.identificador || undefined,
        });
        const savedCavalo = await this.cavaloRepository.save(cavalo);
        cavalos.push(savedCavalo);
      }

      pareosCriados.push({
        pareo: savedPareo,
        cavalos: cavalos,
      });
    }

    return {
      campeonatoId,
      tipoRodadaId,
      totalPareos: pareosCriados.length,
      totalCavalos: pareosCriados.reduce((sum, p) => sum + p.cavalos.length, 0),
      pareos: pareosCriados,
    };
  }

  private processarTextoPareos(texto: string): PareoData[] {
    const linhas = texto.split('\n').filter(linha => linha.trim());
    const pareosData: PareoData[] = [];
    
    let pareoAtual: string | null = null;
    let cavalosAtual: Array<{
      nome: string;
      identificador?: string | null;
    }> = [];

    for (const linha of linhas) {
      const linhaTrim = linha.trim();
      
      // Verifica se é uma linha de pareo (ex: "01- MAXIMO SENATOR HBR")
      const matchPareo = linhaTrim.match(/^(\d+)- (.+)$/);
      if (matchPareo) {
        // Salva o pareo anterior se existir
        if (pareoAtual) {
          pareosData.push({
            numero: pareoAtual,
            cavalos: cavalosAtual,
          });
        }
        
        // Inicia novo pareo
        pareoAtual = matchPareo[1].padStart(2, '0');
        cavalosAtual = [];
        
        // Adiciona o primeiro cavalo
        const nomeCavalo = matchPareo[2].trim();
        cavalosAtual.push({
          nome: nomeCavalo,
          identificador: null,
        });
      }
      // Verifica se é uma linha de cavalo adicional (sem número de pareo)
      else if (linhaTrim && !linhaTrim.includes('---') && !linhaTrim.includes('/')) {
        // Adiciona cavalo ao pareo atual
        cavalosAtual.push({
          nome: linhaTrim,
          identificador: null,
        });
      }
      // Verifica se é uma linha de identificadores (ex: "A", "B", "C")
      else if (linhaTrim.match(/^[A-Z]$/)) {
        // Atualiza o último cavalo com o identificador
        if (cavalosAtual.length > 0) {
          cavalosAtual[cavalosAtual.length - 1].identificador = linhaTrim;
        }
      }
    }

    // Salva o último pareo
    if (pareoAtual) {
      pareosData.push({
        numero: pareoAtual,
        cavalos: cavalosAtual,
      });
    }

    return pareosData;
  }

  async buscarPareos(campeonatoId: number, tipoRodadaId: number): Promise<Pareo[]> {
    return await this.pareoRepository.find({
      where: { campeonatoId, tipoRodadaId },
      relations: ['cavalos'],
      order: { numero: 'ASC' },
    });
  }

  async removerCavalo(campeonatoId: number, tipoRodadaId: number, numeroPareo: string, nomeCavalo: string): Promise<any> {
    // Normaliza o nome do cavalo
    const nomeCavaloNormalizado = nomeCavalo.trim();
    
    // Busca o pareo
    const pareo = await this.pareoRepository.findOne({
      where: {
        campeonatoId,
        tipoRodadaId,
        numero: numeroPareo
      },
      relations: ['cavalos']
    });

    if (!pareo) {
      throw new NotFoundException(`Pareo ${numeroPareo} não encontrado no campeonato ${campeonatoId} e tipo de rodada ${tipoRodadaId}`);
    }

    // Busca o cavalo pelo nome (case insensitive)
    const cavalo = await this.cavaloRepository
      .createQueryBuilder('cavalo')
      .where('cavalo.pareoId = :pareoId', { pareoId: pareo.id })
      .andWhere('LOWER(cavalo.nome) = LOWER(:nome)', { nome: nomeCavaloNormalizado })
      .getOne();

    if (!cavalo) {
      throw new NotFoundException(`Cavalo "${nomeCavaloNormalizado}" não encontrado no pareo ${numeroPareo}`);
    }

    // Verifica se há outros cavalos no pareo
    const totalCavalos = await this.cavaloRepository.count({
      where: { pareoId: pareo.id }
    });

    if (totalCavalos <= 1) {
      throw new NotFoundException(`Não é possível remover o último cavalo do pareo ${numeroPareo}. O pareo deve ter pelo menos um cavalo.`);
    }

    // Remove o cavalo
    await this.cavaloRepository.remove(cavalo);

    // Busca o pareo atualizado com os cavalos restantes
    const pareoAtualizado = await this.pareoRepository.findOne({
      where: { id: pareo.id },
      relations: ['cavalos']
    });

    if (!pareoAtualizado) {
      throw new NotFoundException(`Erro ao buscar pareo atualizado após remoção do cavalo`);
    }

    return {
      pareo: {
        id: pareoAtualizado.id,
        numero: pareoAtualizado.numero,
        campeonatoId: pareoAtualizado.campeonatoId,
        tipoRodadaId: pareoAtualizado.tipoRodadaId,
        createdAt: pareoAtualizado.createdAt,
        updatedAt: pareoAtualizado.updatedAt
      },
      cavalosRestantes: pareoAtualizado.cavalos.map(cavalo => ({
        id: cavalo.id,
        nome: cavalo.nome,
        identificador: cavalo.identificador,
        pareoId: cavalo.pareoId
      })),
      cavaloRemovido: {
        id: cavalo.id,
        nome: cavalo.nome,
        identificador: cavalo.identificador
      },
      totalCavalosAntes: totalCavalos,
      totalCavalosDepois: pareoAtualizado.cavalos.length
    };
  }

  async listarPareosECavalos(campeonatoId: number, tipoRodadaId: number): Promise<any> {
    // Busca todos os pareos com seus cavalos
    const pareos = await this.pareoRepository.find({
      where: { campeonatoId, tipoRodadaId },
      relations: ['cavalos'],
      order: { numero: 'ASC' }
    });

    if (pareos.length === 0) {
      throw new NotFoundException(`Nenhum pareo encontrado para o campeonato ${campeonatoId} e tipo de rodada ${tipoRodadaId}`);
    }

    // Calcula totais
    const totalCavalos = pareos.reduce((sum, pareo) => sum + pareo.cavalos.length, 0);

    // Formata os dados de retorno
    const pareosFormatados = pareos.map(pareo => ({
      id: pareo.id,
      numero: pareo.numero,
      campeonatoId: pareo.campeonatoId,
      tipoRodadaId: pareo.tipoRodadaId,
      createdAt: pareo.createdAt,
      updatedAt: pareo.updatedAt,
      cavalos: pareo.cavalos.map(cavalo => ({
        id: cavalo.id,
        nome: cavalo.nome,
        identificador: cavalo.identificador,
        pareoId: cavalo.pareoId
      }))
    }));

    return {
      campeonatoId,
      tipoRodadaId,
      totalPareos: pareos.length,
      totalCavalos,
      pareos: pareosFormatados
    };
  }

  async buscarRodadasECavalosPorCampeonatoETipo(campeonatoId: number, tipoRodadaId: number): Promise<any> {
    const pareos = await this.pareoRepository.find({
      where: { campeonatoId, tipoRodadaId },
      relations: ['cavalos'],
      order: { numero: 'ASC' }
    });

    if (pareos.length === 0) {
      throw new NotFoundException(`Nenhum pareo encontrado para o campeonato ${campeonatoId} e tipo de rodada ${tipoRodadaId}`);
    }

    // Retorna o primeiro pareo formatado como objeto único
    const pareo = pareos[0];

    return {
      idrodada: pareo.id,
      nomerodada: pareo.numero,
      cavalos: pareo.cavalos.map(cavalo => ({
        idcavalo: cavalo.id,
        nomecavalo: cavalo.nome
      }))
    };
  }

  async buscarRodadasECavalosPorCampeonato(campeonatoId: number): Promise<any[]> {
    // Busca todos os pareos do campeonato
    const pareos = await this.pareoRepository.find({
      where: { campeonatoId },
      relations: ['cavalos'],
      order: { tipoRodadaId: 'ASC', numero: 'ASC' }
    });

    if (pareos.length === 0) {
      throw new NotFoundException(`Nenhum pareo encontrado para o campeonato ${campeonatoId}`);
    }

    // Coleta todos os cavalos e remove duplicatas baseado no nome (case-insensitive)
    const cavalosUnicos = new Map<string, { idcavalo: number; nomecavalo: string }>();
    
    for (const pareo of pareos) {
      for (const cavalo of pareo.cavalos) {
        const nomeNormalizado = cavalo.nome.toLowerCase();
        // Se ainda não existe um cavalo com este nome, adiciona
        if (!cavalosUnicos.has(nomeNormalizado)) {
          cavalosUnicos.set(nomeNormalizado, {
            idcavalo: cavalo.id,
            nomecavalo: cavalo.nome
          });
        }
      }
    }

    // Retorna array de cavalos únicos
    return Array.from(cavalosUnicos.values());
  }
}