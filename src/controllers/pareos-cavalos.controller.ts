import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PareoService } from '../services/pareo.service';

@ApiTags('pareos-cavalos')
@Controller('pareos-cavalos')
export class PareosCavalosController {
  constructor(private readonly pareoService: PareoService) {}

  @Get(':campeonatoId/:tipoRodadaId')
  @ApiOperation({ 
    summary: 'Listar pareos e cavalos',
    description: 'Retorna todos os pareos e seus respectivos cavalos de um campeonato e tipo de rodada específicos'
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
    description: 'Pareos e cavalos retornados com sucesso.',
    example: {
      campeonatoId: 1,
      tipoRodadaId: 1,
      totalPareos: 8,
      totalCavalos: 24,
      pareos: [
        {
          id: 1,
          numero: '01',
          campeonatoId: 1,
          tipoRodadaId: 1,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
          cavalos: [
            {
              id: 1,
              nome: 'Cavalo A',
              identificador: 'A',
              pareoId: 1
            },
            {
              id: 2,
              nome: 'Cavalo B',
              identificador: 'B',
              pareoId: 1
            }
          ]
        },
        {
          id: 2,
          numero: '02',
          campeonatoId: 1,
          tipoRodadaId: 1,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
          cavalos: [
            {
              id: 3,
              nome: 'Cavalo C',
              identificador: 'A',
              pareoId: 2
            },
            {
              id: 4,
              nome: 'Cavalo D',
              identificador: 'B',
              pareoId: 2
            }
          ]
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Nenhum pareo encontrado.',
    example: {
      statusCode: 404,
      message: 'Nenhum pareo encontrado para o campeonato 1 e tipo de rodada 1',
      error: 'Not Found'
    }
  })
  async listarPareosECavalos(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number
  ): Promise<any> {
    return this.pareoService.listarPareosECavalos(campeonatoId, tipoRodadaId);
  }
}
