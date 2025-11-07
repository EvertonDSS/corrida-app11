import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApostadorCombinadoService } from '../services/apostador-combinado.service';
import { DefinirApostadoresCombinadosDto } from '../dto/definir-apostadores-combinados.dto';
import { ApostadorCombinado } from '../entities/apostador-combinado.entity';

@ApiTags('apostadores-combinados')
@Controller('apostadores-combinados')
export class ApostadorCombinadoController {
  constructor(private readonly apostadorCombinadoService: ApostadorCombinadoService) {}

  @Post(':campeonatoId')
  @ApiOperation({
    summary: 'Definir apostadores que combinaram apostas',
    description: 'Registra apostadores que combinaram suas apostas dentro de um campeonato específico.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 11,
    type: 'integer',
  })
  @ApiBody({
    type: DefinirApostadoresCombinadosDto,
    examples: {
      exemplo: {
        value: {
          nomesApostadores: ['Grupo Jóias', 'Zeus'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Apostadores combinados registrados com sucesso.',
  })
  async definirCombinados(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Body() body: DefinirApostadoresCombinadosDto,
  ): Promise<ApostadorCombinado[]> {
    return this.apostadorCombinadoService.definirCombinados(campeonatoId, body.nomesApostadores);
  }

  @Get(':campeonatoId')
  @ApiOperation({
    summary: 'Listar apostadores combinados',
    description: 'Retorna todos os apostadores registrados como combinados para um campeonato.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 11,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de apostadores combinados retornada com sucesso.',
  })
  async listarCombinados(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<ApostadorCombinado[]> {
    return this.apostadorCombinadoService.listarPorCampeonato(campeonatoId);
  }

  @Get(':campeonatoId/apostas')
  @ApiOperation({
    summary: 'Listar apostas de apostadores combinados',
    description:
      'Retorna todas as apostas registradas no campeonato, agrupadas pelos apostadores marcados como combinados.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 11,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Apostas combinadas retornadas com sucesso.',
  })
  async listarApostasCombinadas(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<Record<string, any[]>> {
    return this.apostadorCombinadoService.listarApostasCombinadas(campeonatoId);
  }

  @Get(':campeonatoId/apostas/:apostaId')
  @ApiOperation({
    summary: 'Detalhes de uma aposta combinada',
    description:
      'Retorna a estrutura completa de uma aposta combinada específica, incluindo apostadores, rodadas, totais e pareos excluídos.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 11,
    type: 'integer',
  })
  @ApiParam({
    name: 'apostaId',
    description: 'ID da aposta combinada de referência',
    example: 379,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da aposta combinada retornados com sucesso.',
  })
  async obterDetalhesApostaCombinada(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('apostaId', ParseIntPipe) apostaId: number,
  ): Promise<any> {
    return this.apostadorCombinadoService.obterDetalhesApostaCombinada(campeonatoId, apostaId);
  }
}


