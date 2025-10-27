import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pareo } from '../entities/pareo.entity';
import { Cavalo } from '../entities/cavalo.entity';

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
}