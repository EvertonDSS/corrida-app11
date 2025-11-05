import { Controller, Get, Post, Put, Param, ParseIntPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GanhadorPossivelService } from '../services/ganhador-possivel.service';
import { DefinirGanhadoresPossiveisDto } from '../dto/definir-ganhadores-possiveis.dto';
import { DefinirVencedorDto } from '../dto/definir-vencedor.dto';
import { GanhadorPossivel } from '../entities/ganhador-possivel.entity';

@ApiTags('ganhadores-possiveis')
@Controller('ganhadores-possiveis')
export class GanhadorPossivelController {
  constructor(private readonly ganhadorPossivelService: GanhadorPossivelService) {}

  @Post(':campeonatoId/:tipoRodadaId')
  @ApiOperation({
    summary: 'Definir ganhadores possíveis',
    description: 'Define a lista de cavalos possíveis ganhadores para um campeonato e tipo de rodada. Substitui registros existentes se já houver.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 1,
    type: 'integer',
  })
  @ApiBody({
    type: DefinirGanhadoresPossiveisDto,
    examples: {
      example1: {
        value: {
          cavalosIds: [1, 2, 3, 4],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ganhadores possíveis definidos com sucesso.',
    schema: {
      example: [
        {
          id: 1,
          campeonatoId: 1,
          tipoRodadaId: 1,
          cavaloId: 1,
          isVencedor: false,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 2,
          campeonatoId: 1,
          tipoRodadaId: 1,
          cavaloId: 2,
          isVencedor: false,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Um ou mais cavalos não foram encontrados.',
  })
  async definirGanhadoresPossiveis(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Body() dto: DefinirGanhadoresPossiveisDto,
  ): Promise<GanhadorPossivel[]> {
    return this.ganhadorPossivelService.definirGanhadoresPossiveis(
      campeonatoId,
      tipoRodadaId,
      dto.cavalosIds,
    );
  }

  @Put(':campeonatoId/:tipoRodadaId/vencedor')
  @ApiOperation({
    summary: 'Definir cavalo vencedor',
    description: 'Define qual cavalo é o vencedor para um campeonato e tipo de rodada específicos. Remove o status de vencedor dos outros cavalos.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 1,
    type: 'integer',
  })
  @ApiBody({
    type: DefinirVencedorDto,
    examples: {
      example1: {
        value: {
          cavaloId: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Vencedor definido com sucesso.',
    schema: {
      example: {
        id: 1,
        campeonatoId: 1,
        tipoRodadaId: 1,
        cavaloId: 1,
        isVencedor: true,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cavalo não encontrado na lista de ganhadores possíveis.',
  })
  async definirVencedor(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Body() dto: DefinirVencedorDto,
  ): Promise<GanhadorPossivel> {
    return this.ganhadorPossivelService.definirVencedor(
      campeonatoId,
      tipoRodadaId,
      dto.cavaloId,
    );
  }

  @Get(':campeonatoId/:tipoRodadaId')
  @ApiOperation({
    summary: 'Buscar ganhadores possíveis por tipo de rodada',
    description: 'Retorna a lista de ganhadores possíveis para um campeonato e tipo de rodada específicos',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ganhadores possíveis retornada com sucesso.',
    schema: {
      example: [
        {
          id: 1,
          campeonatoId: 1,
          tipoRodadaId: 1,
          cavaloId: 1,
          isVencedor: false,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 2,
          campeonatoId: 1,
          tipoRodadaId: 1,
          cavaloId: 2,
          isVencedor: true,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    },
  })
  async buscarGanhadoresPossiveis(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
  ): Promise<GanhadorPossivel[]> {
    return this.ganhadorPossivelService.buscarGanhadoresPossiveis(campeonatoId, tipoRodadaId);
  }

  @Get(':campeonatoId')
  @ApiOperation({
    summary: 'Buscar ganhadores possíveis com apostadores',
    description: 'Retorna os ganhadores possíveis agrupados por tipo de rodada com os apostadores e seus valores de prêmio para cada cavalo',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ganhadores possíveis com apostadores retornada com sucesso.',
    schema: {
      example: [
        {
          tiporodada: 1,
          nometiporodada: 'Chave',
          'Cavalo Vencedor': [
            {
              nomeapostador: 'João Silva',
              valorpremio: 100.0,
            },
          ],
          'Cavalo Azul': [
            {
              nomeapostador: 'Maria Santos',
              valorpremio: 200.0,
            },
            {
              nomeapostador: 'Pedro Oliveira',
              valorpremio: 150.0,
            },
          ],
        },
        {
          tiporodada: 2,
          nometiporodada: 'Individual',
          'Cavalo Branco': [
            {
              nomeapostador: 'Ana Costa',
              valorpremio: 300.0,
            },
          ],
        },
      ],
    },
  })
  async buscarGanhadoresPossiveisComApostadores(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<any[]> {
    return this.ganhadorPossivelService.buscarGanhadoresPossiveisComApostadores(campeonatoId);
  }
}
