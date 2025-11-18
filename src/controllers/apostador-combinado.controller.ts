import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApostadorCombinadoService } from '../services/apostador-combinado.service';
import { DefinirApostadoresCombinadosDto } from '../dto/definir-apostadores-combinados.dto';
import { DescombinarApostadoresDto } from '../dto/descombinar-apostadores.dto';

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
      grupos: {
        value: {
          grupos: [
            {
              identificador: 'grupo-zezinho',
              nomes: ['Zezinho', 'Zezeca'],
            },
            {
              nomes: ['Zeca', 'Zeze'],
            },
          ],
        },
      },
      unicoGrupo: {
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
  ): Promise<Array<{ grupoIdentificador: string; apostadores: string[] }>> {
    return this.apostadorCombinadoService.definirCombinados(campeonatoId, body);
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
  ): Promise<Array<{ grupoIdentificador: string; apostadores: string[] }>> {
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
  ): Promise<any> {
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

  @Get(':campeonatoId/grupos/:grupoIdentificador')
  @ApiOperation({
    summary: 'Detalhes consolidados de um grupo combinado',
    description:
      'Retorna as apostas do grupo combinado informado (semelhante ao endpoint pdf/dados), agregando as apostas dos apostadores pertencentes ao grupo.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 12,
    type: 'integer',
  })
  @ApiParam({
    name: 'grupoIdentificador',
    description: 'Identificador do grupo combinado. Caso tenha sido gerado automaticamente, utilize o valor retornado pelos endpoints de combinados.',
    example: 'grupo-joias__zeus',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do grupo retornados com sucesso.',
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo não encontrado para o campeonato informado.',
  })
  async obterDetalhesGrupo(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('grupoIdentificador') grupoIdentificadorParam: string,
  ): Promise<any> {
    const grupoIdentificador = decodeURIComponent(grupoIdentificadorParam).trim();
    return this.apostadorCombinadoService.obterDetalhesGrupo(campeonatoId, grupoIdentificador);
  }

  @Delete(':campeonatoId')
  @ApiOperation({
    summary: 'Descombinar apostadores',
    description:
      'Remove a combinação de apostadores. Pode remover um grupo inteiro (usando grupoIdentificador) ou apenas apostadores específicos (usando nomesApostadores).',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 11,
    type: 'integer',
  })
  @ApiBody({
    type: DescombinarApostadoresDto,
    examples: {
      removerGrupo: {
        summary: 'Remover todo um grupo',
        value: {
          grupoIdentificador: 'grupo-joias__zeus',
        },
      },
      removerApostadores: {
        summary: 'Remover apostadores específicos',
        value: {
          nomesApostadores: ['Zezinho', 'Zezeca'],
        },
      },
      removerApostadoresDoGrupo: {
        summary: 'Remover apostadores específicos de um grupo',
        value: {
          grupoIdentificador: 'grupo-joias__zeus',
          nomesApostadores: ['Zeus'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Apostadores descombinados com sucesso. Retorna os grupos combinados restantes.',
    schema: {
      example: [
        {
          grupoIdentificador: 'grupo-joias',
          apostadores: ['Grupo Jóias'],
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos. É necessário informar pelo menos "nomesApostadores" ou "grupoIdentificador".',
  })
  @ApiResponse({
    status: 404,
    description: 'Campeonato, grupo ou apostadores não encontrados.',
  })
  async descombinarApostadores(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Body() body: DescombinarApostadoresDto,
  ): Promise<Array<{ grupoIdentificador: string; apostadores: string[] }>> {
    return this.apostadorCombinadoService.descombinarApostadores(campeonatoId, body);
  }
}


