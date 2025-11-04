import { Controller, Get, Post, Param, ParseIntPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RodadaCasaService } from '../services/rodada-casa.service';
import { CreateRodadaCasaDto } from '../dto/create-rodada-casa.dto';
import { RodadaCasa } from '../entities/rodada-casa.entity';

@ApiTags('rodadas-casa')
@Controller('rodadas-casa')
export class RodadaCasaController {
  constructor(private readonly rodadaCasaService: RodadaCasaService) {}

  @Post(':campeonatoId')
  @ApiOperation({
    summary: 'Criar rodada com valor da casa',
    description: 'Salva uma nova rodada com o valor da casa para um campeonato específico',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiBody({
    type: CreateRodadaCasaDto,
    examples: {
      example1: {
        value: {
          Rodada: 'R01',
          ValorCasa: 500,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Rodada casa criada com sucesso.',
    schema: {
      example: {
        id: 1,
        campeonatoId: 1,
        rodada: 'R01',
        valorCasa: 500,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Campeonato não encontrado.',
  })
  async criarRodadaCasa(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Body() createDto: CreateRodadaCasaDto,
  ): Promise<RodadaCasa> {
    return this.rodadaCasaService.criarRodadaCasa(campeonatoId, createDto);
  }

  @Get(':campeonatoId')
  @ApiOperation({
    summary: 'Listar rodadas casa por campeonato',
    description: 'Retorna todas as rodadas casa de um campeonato específico',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de rodadas casa retornada com sucesso.',
    schema: {
      example: [
        {
          id: 1,
          campeonatoId: 1,
          rodada: 'R01',
          valorCasa: 500,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 2,
          campeonatoId: 1,
          rodada: 'R02',
          valorCasa: 750,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Campeonato não encontrado.',
  })
  async listarRodadasCasaPorCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<RodadaCasa[]> {
    return this.rodadaCasaService.buscarRodadasCasaPorCampeonato(campeonatoId);
  }

  @Get('id/:id')
  @ApiOperation({
    summary: 'Buscar rodada casa por ID',
    description: 'Retorna uma rodada casa específica pelo seu ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rodada casa',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Rodada casa encontrada com sucesso.',
    schema: {
      example: {
        id: 1,
        campeonatoId: 1,
        rodada: 'R01',
        valorCasa: 500,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rodada casa não encontrada.',
  })
  async buscarRodadaCasaPorId(@Param('id', ParseIntPipe) id: number): Promise<RodadaCasa> {
    return this.rodadaCasaService.buscarRodadaCasaPorId(id);
  }
}
