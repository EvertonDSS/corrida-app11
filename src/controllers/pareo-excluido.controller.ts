import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { PareoExcluidoService } from '../services/pareo-excluido.service';

export class SalvarPareoExcluidoDto {
  pareo: string;
}

@ApiTags('pareos-excluidos')
@Controller('pareos-excluidos')
export class PareoExcluidoController {
  constructor(private readonly pareoExcluidoService: PareoExcluidoService) {}

  @Post(':campeonatoId/:tipoRodadaId')
  @ApiOperation({ 
    summary: 'Salvar pareo excluído',
    description: 'Salva um pareo excluído com os dados fornecidos'
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
  @ApiConsumes('application/json')
  @ApiResponse({ 
    status: 201, 
    description: 'Pareo excluído salvo com sucesso.',
    example: {
      id: 1,
      campeonatoId: 1,
      tipoRodadaId: 1,
      numeroPareo: '04',
      dadosPareo: '04',
      createdAt: '2024-01-15T10:00:00.000Z'
    }
  })
  async salvarPareoExcluido(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Body() body: SalvarPareoExcluidoDto
  ): Promise<any> {
    return this.pareoExcluidoService.salvarPareoExcluido(campeonatoId, tipoRodadaId, body.pareo);
  }

  @Get(':campeonatoId/:tipoRodadaId')
  @ApiOperation({ 
    summary: 'Buscar pareos excluídos',
    description: 'Retorna todos os pareos excluídos de um campeonato e tipo de rodada'
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
    description: 'Pareos excluídos retornados com sucesso.'
  })
  async buscarPareosExcluidos(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number
  ): Promise<any> {
    return this.pareoExcluidoService.buscarPareosExcluidos(campeonatoId, tipoRodadaId);
  }
}
