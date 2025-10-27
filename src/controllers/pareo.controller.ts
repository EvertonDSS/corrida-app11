import { Controller, Post, Get, Body, Param, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { PareoService } from '../services/pareo.service';

@ApiTags('pareos')
@Controller('pareos')
export class PareoController {
  constructor(private readonly pareoService: PareoService) {}

  @Post(':campeonatoId/:tipoRodadaId')
  @ApiOperation({ 
    summary: 'Criar pareos e cavalos',
    description: 'Cria pareos e cavalos para um campeonato e tipo de rodada específicos'
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
  @ApiConsumes('text/plain')
  @ApiResponse({ 
    status: 201, 
    description: 'Pareos e cavalos criados com sucesso.',
    example: {
      campeonatoId: 1,
      tipoRodadaId: 1,
      totalPareos: 8,
      totalCavalos: 10,
      pareos: []
    }
  })
  async criarPareos(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Req() req: any
  ): Promise<any> {
    const texto = req.body ? req.body.toString() : '';
    return this.pareoService.criarPareos(campeonatoId, tipoRodadaId, texto);
  }

  @Get(':campeonatoId/:tipoRodadaId')
  @ApiOperation({ 
    summary: 'Buscar pareos por campeonato e tipo',
    description: 'Retorna todos os pareos de um campeonato e tipo de rodada específicos'
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
    description: 'Pareos retornados com sucesso.'
  })
  async buscarPareos(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number
  ): Promise<any> {
    return this.pareoService.buscarPareos(campeonatoId, tipoRodadaId);
  }
}
