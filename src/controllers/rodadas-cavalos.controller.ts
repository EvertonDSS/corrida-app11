import { Controller, Get, Param, ParseIntPipe, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PareoService } from '../services/pareo.service';

@ApiTags('rodadas-cavalos')
@Controller('rodadas-cavalos')
export class RodadasCavalosController {
  constructor(private readonly pareoService: PareoService) {}

  @Get(':campeonatoId/:tipoRodadaId')
  @ApiOperation({
    summary: 'Buscar rodada e cavalos por campeonato e tipo de rodada',
    description: 'Retorna uma rodada (pareo) e seus cavalos para um campeonato e tipo de rodada específicos'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({
    status: 200,
    description: 'Rodada e cavalos retornados com sucesso.',
    schema: {
      example: {
        idrodada: 1,
        nomerodada: '01',
        cavalos: [
          {
            idcavalo: 1,
            nomecavalo: 'Cavalo A'
          },
          {
            idcavalo: 2,
            nomecavalo: 'Cavalo B'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum pareo encontrado para o campeonato e tipo de rodada especificados.',
    example: {
      statusCode: 404,
      message: 'Nenhum pareo encontrado para o campeonato 1 e tipo de rodada 1',
      error: 'Not Found'
    }
  })
  async buscarRodadasECavalosPorCampeonatoETipo(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number
  ): Promise<any> {
    return this.pareoService.buscarRodadasECavalosPorCampeonatoETipo(campeonatoId, tipoRodadaId);
  }

  @Get(':campeonatoId')
  @ApiOperation({
    summary: 'Listar rodadas e cavalos por campeonato',
    description: 'Retorna todas as rodadas agrupadas por tipo de rodada e seus cavalos para um campeonato específico. Pode filtrar por tipoRodadaId usando o query parameter idRodada.'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiQuery({
    name: 'idRodada',
    description: 'ID do tipo de rodada (opcional). Se fornecido, retorna apenas aquele tipo de rodada.',
    required: false,
    type: 'integer',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de rodadas e cavalos agrupadas por tipo de rodada retornada com sucesso.',
    schema: {
      example: [
        {
          tiporodada: 1,
          nomerodada: 'Chave',
          cavalos: [
            {
              idcavalo: 1,
              nomecavalo: 'Cavalo A'
            },
            {
              idcavalo: 2,
              nomecavalo: 'Cavalo B'
            }
          ]
        },
        {
          tiporodada: 2,
          nomerodada: 'Individual',
          cavalos: [
            {
              idcavalo: 3,
              nomecavalo: 'Cavalo C'
            },
            {
              idcavalo: 4,
              nomecavalo: 'Cavalo D'
            }
          ]
        }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum pareo encontrado para o campeonato especificado.',
    example: {
      statusCode: 404,
      message: 'Nenhum pareo encontrado para o campeonato 1',
      error: 'Not Found'
    }
  })
  async buscarRodadasECavalosPorCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Query('idRodada') idRodada?: string
  ): Promise<any[]> {
    const tipoRodadaId = idRodada ? parseInt(idRodada, 10) : undefined;
    return this.pareoService.buscarRodadasECavalosPorCampeonato(campeonatoId, tipoRodadaId);
  }
}
