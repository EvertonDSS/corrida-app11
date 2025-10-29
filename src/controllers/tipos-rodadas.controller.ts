import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TipoRodadaService } from '../services/tipo-rodada.service';

@ApiTags('tipos-rodadas')
@Controller('tipos-rodadas')
export class TiposRodadasController {
  constructor(private readonly tipoRodadaService: TipoRodadaService) {}

  @Get('campeonato/:campeonatoId')
  @ApiOperation({ 
    summary: 'Listar tipos de rodadas por campeonato',
    description: 'Retorna apenas os tipos de rodadas que existem em um campeonato específico'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tipos de rodadas retornados com sucesso.',
    example: {
      campeonatoId: 1,
      totalTipos: 3,
      tipos: [
        {
          id: 1,
          nome: 'Chave',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          id: 2,
          nome: 'Individual',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          id: 3,
          nome: 'Treinador',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Nenhum tipo de rodada encontrado.',
    example: {
      statusCode: 404,
      message: 'Nenhum tipo de rodada encontrado para o campeonato 1',
      error: 'Not Found'
    }
  })
  async listarTiposPorCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number
  ): Promise<any> {
    return this.tipoRodadaService.listarTiposPorCampeonato(campeonatoId);
  }
}
