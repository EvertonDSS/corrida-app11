import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RodadaService } from '../services/rodada.service';

@ApiTags('rodadas')
@Controller('rodadas')
export class RodadaController {
  constructor(private readonly rodadaService: RodadaService) {}

  @Get('campeonato/:campeonatoId')
  @ApiOperation({
    summary: 'Listar rodadas por campeonato',
    description: 'Retorna as rodadas cadastradas no campeonato, agrupadas por tipo de rodada',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Rodadas listadas com sucesso.',
    schema: {
      example: {
        1: {
          tiporodada: 1,
          nometiporodada: 'Chave',
          rodadas: ['R01', 'R02', 'R03'],
        },
        2: {
          tiporodada: 2,
          nometiporodada: 'Individual',
          rodadas: ['R01', 'R04'],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhuma rodada encontrada para o campeonato.',
    example: {
      statusCode: 404,
      message: 'Nenhuma rodada encontrada para o campeonato 1',
      error: 'Not Found',
    },
  })
  async listarRodadasPorCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<any> {
    return await this.rodadaService.listarRodadasPorCampeonato(campeonatoId);
  }
}

