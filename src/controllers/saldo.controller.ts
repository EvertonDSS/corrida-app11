import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SaldoService } from '../services/saldo.service';
import { ObterSaldosMultiplosDto } from '../dto/obter-saldos-multiplos.dto';

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

  @Get('campeonato/:campeonatoId/negativados')
  @ApiOperation({
    summary: 'Saldo negativado do campeonato',
    description: 'Retorna apenas os apostadores (incluindo CASA) com saldo final negativo para o campeonato informado.',
  })
  async obterSaldoCampeonatoNegativados(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<any> {
    return this.saldoService.obterSaldoCampeonatoNegativados(campeonatoId);
  }

  @Get('campeonato/:campeonatoId/positivados')
  @ApiOperation({
    summary: 'Saldo positivado do campeonato',
    description: 'Retorna apenas os apostadores (incluindo CASA) com saldo final positivo para o campeonato informado.',
  })
  async obterSaldoCampeonatoPositivados(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<any> {
    return this.saldoService.obterSaldoCampeonatoPositivados(campeonatoId);
  }

  @Post('campeonatos')
  @ApiOperation({
    summary: 'Saldo consolidado de múltiplos campeonatos',
    description:
      'Recebe uma lista de campeonatos e retorna o saldo consolidado de apostadores e CASA, somando apostas, prêmios e saldo final por nome. Considera pareos excluídos e ignora rodadas com vencedores específicos.',
  })
  @ApiBody({
    type: ObterSaldosMultiplosDto,
    examples: {
      exemploPadrao: {
        summary: 'Consolidar saldos dos campeonatos 1, 2 e 5',
        value: {
          campeonatosIds: [1, 2, 5],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo consolidado retornado com sucesso.',
    schema: {
      example: {
        campeonatos: [
          { id: 1, nome: 'Campeonato 1' },
          { id: 2, nome: 'Campeonato 2' },
        ],
        apostadores: [
          {
            nome: 'João Silva',
            totalApostado: 3000,
            totalPremiosVencidos: 2500,
            saldoFinal: -500,
          },
          {
            nome: 'CASA',
            totalApostado: 4000,
            totalPremiosVencidos: 0,
            saldoFinal: -4000,
          },
        ],
      },
    },
  })
  async obterSaldoMultiplosCampeonatos(
    @Body() body: ObterSaldosMultiplosDto,
  ): Promise<any> {
    return this.saldoService.obterSaldoMultiplosCampeonatos(body.campeonatosIds);
  }

  @Post('campeonatos/negativados')
  @ApiOperation({
    summary: 'Saldo negativado consolidado de múltiplos campeonatos',
    description: 'Recebe uma lista de campeonatos e retorna apenas os apostadores (incluindo CASA) com saldo final negativo.',
  })
  async obterSaldoMultiplosNegativados(
    @Body() body: ObterSaldosMultiplosDto,
  ): Promise<any> {
    return this.saldoService.obterSaldoMultiplosCampeonatosNegativados(body.campeonatosIds);
  }

  @Post('campeonatos/positivados')
  @ApiOperation({
    summary: 'Saldo positivado consolidado de múltiplos campeonatos',
    description: 'Recebe uma lista de campeonatos e retorna apenas os apostadores (incluindo CASA) com saldo final positivo.',
  })
  async obterSaldoMultiplosPositivados(
    @Body() body: ObterSaldosMultiplosDto,
  ): Promise<any> {
    return this.saldoService.obterSaldoMultiplosCampeonatosPositivados(body.campeonatosIds);
  }
}


