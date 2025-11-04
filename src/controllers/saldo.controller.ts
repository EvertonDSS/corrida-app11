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
    description: 'Retorna o saldo final do campeonato por apostador (total de prêmios vencidos - total apostado). O total de prêmios vencidos retorna 0 por enquanto.'
  })
  @ApiParam({ name: 'campeonatoId', description: 'ID do campeonato', example: 5, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Saldo por apostador retornado com sucesso.',
    schema: {
      example: {
        campeonato: { id: 5, nome: 'Campeonato X' },
        apostadores: [
          {
            id: 1,
            nome: 'João Silva',
            totalApostado: 1500.0,
            totalPremiosVencidos: 0,
            saldoFinal: -1500.0
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


