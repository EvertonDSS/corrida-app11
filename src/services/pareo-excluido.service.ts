import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PareoExcluido } from '../entities/pareo-excluido.entity';

@Injectable()
export class PareoExcluidoService {
  constructor(
    @InjectRepository(PareoExcluido)
    private pareoExcluidoRepository: Repository<PareoExcluido>,
  ) {}

  async salvarPareoExcluido(campeonatoId: number, tipoRodadaId: number, numeroPareo: string): Promise<PareoExcluido> {
    const pareoExcluido = this.pareoExcluidoRepository.create({
      campeonatoId,
      tipoRodadaId,
      numeroPareo: numeroPareo.padStart(2, '0'),
      dadosPareo: numeroPareo,
    });

    return await this.pareoExcluidoRepository.save(pareoExcluido);
  }

  async buscarPareosExcluidos(campeonatoId: number, tipoRodadaId: number): Promise<PareoExcluido[]> {
    return await this.pareoExcluidoRepository.find({
      where: { campeonatoId, tipoRodadaId },
      order: { createdAt: 'DESC' },
    });
  }

}
