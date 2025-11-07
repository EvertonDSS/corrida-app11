import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PareoService } from '../services/pareo.service';
import { RemoverCavaloDto } from '../dto/remover-cavalo.dto';
import { AtualizarCavalosRodadaDto } from '../dto/atualizar-cavalos-rodada.dto';

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

  @Post('remover-cavalo/:campeonatoId/:tipoRodadaId/:numeroPareo')
  @ApiOperation({ 
    summary: 'Remover cavalo de pareo',
    description: 'Remove um cavalo específico de um pareo sem alterar valores ou outras informações'
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
  @ApiParam({
    name: 'numeroPareo',
    description: 'Número do pareo',
    example: '04',
    type: 'string'
  })
  @ApiBody({
    type: RemoverCavaloDto,
    description: 'Nome do cavalo a ser removido',
    examples: {
      exemplo1: {
        summary: 'Remover cavalo específico',
        value: {
          nomeCavalo: 'Cavalo 4'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cavalo removido com sucesso.',
    example: {
      pareo: {
        id: 1,
        numero: '04',
        campeonatoId: 1,
        tipoRodadaId: 1,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T15:30:00.000Z'
      },
      cavalosRestantes: [
        {
          id: 1,
          nome: 'Cavalo 1',
          identificador: 'A',
          pareoId: 1
        },
        {
          id: 2,
          nome: 'Cavalo 2',
          identificador: 'B',
          pareoId: 1
        },
        {
          id: 3,
          nome: 'Cavalo 3',
          identificador: 'C',
          pareoId: 1
        }
      ],
      cavaloRemovido: {
        id: 4,
        nome: 'Cavalo 4',
        identificador: 'D'
      },
      totalCavalosAntes: 4,
      totalCavalosDepois: 3
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Pareo ou cavalo não encontrado.',
    example: {
      statusCode: 404,
      message: 'Cavalo "Cavalo 4" não encontrado no pareo 04',
      error: 'Not Found'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Não é possível remover o último cavalo.',
    example: {
      statusCode: 404,
      message: 'Não é possível remover o último cavalo do pareo 04. O pareo deve ter pelo menos um cavalo.',
      error: 'Not Found'
    }
  })
  async removerCavalo(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Param('numeroPareo') numeroPareo: string,
    @Body() removerCavaloDto: RemoverCavaloDto
  ): Promise<any> {
    return this.pareoService.removerCavalo(
      campeonatoId,
      tipoRodadaId,
      numeroPareo,
      removerCavaloDto.nomeCavalo
    );
  }

  @Put(':campeonatoId/:tipoRodadaId/cavalos')
  @ApiOperation({
    summary: 'Atualizar nomes de cavalos em pareos existentes',
    description:
      'Permite atualizar os nomes de cavalos específicos pertencentes a pareos de um campeonato e tipo de rodada.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 11,
    type: 'integer',
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 14,
    type: 'integer',
  })
  @ApiBody({
    type: AtualizarCavalosRodadaDto,
    examples: {
      exemplo: {
        value: {
          cavalos: [
            {
              pareoId: 262,
              id: 325,
              nome: 'LUIS STRAW HRZ',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cavalos atualizados com sucesso.',
  })
  async atualizarCavalos(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Body() body: AtualizarCavalosRodadaDto,
  ): Promise<any> {
    return this.pareoService.atualizarCavalos(campeonatoId, tipoRodadaId, body.cavalos);
  }
}
