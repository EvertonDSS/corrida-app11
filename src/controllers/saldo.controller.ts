import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SaldoService } from '../services/saldo.service';

@ApiTags('saldos')
@Controller('saldos')
export class SaldoController {
  constructor(private readonly saldoService: SaldoService) {}

  @Get('campeonato/:campeonatoId')
  @ApiOperation({
    summary: 'Saldo final do campeonato',
    description: 'Retorna o saldo final do campeonato por apostador (total de prêmios vencidos - total apostado). Calcula os prêmios vencidos verificando se o apostador tem apostas no cavalo vencedor do campeonato (comparação por nome do cavalo).'
  })
  @ApiParam({ name: 'campeonatoId', description: 'ID do campeonato', example: 5, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Saldo por apostador retornado com sucesso. Inclui CASA apenas se houver rodadas casa cadastradas (soma de todas as rodadas casa do campeonato).',
    schema: {
      example: {
        campeonato: { id: 5, nome: 'Campeonato X' },
        apostadores: [
          {
            nome: 'João Silva',
            totalApostado: 1500.0,
            totalPremiosVencidos: 2000.0,
            saldoFinal: 500.0
          },
          {
            nome: 'CASA',
            totalApostado: 2500.0,
            totalPremiosVencidos: 0.0,
            saldoFinal: -2500.0
          }
        ]
      }
    }
  })
  async obterSaldoCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number
  ): Promise<any> {
    return this.saldoService.obterSaldoCampeonato(campeonatoId);
  }
}


