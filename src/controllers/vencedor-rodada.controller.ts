import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VencedorRodadaService } from '../services/vencedor-rodada.service';
import { CreateVencedorRodadaDto } from '../dto/create-vencedor-rodada.dto';
import { VencedorRodada } from '../entities/vencedor-rodada.entity';

@ApiTags('vencedores-rodada')
@Controller('vencedores-rodada')
export class VencedorRodadaController {
  constructor(private readonly vencedorRodadaService: VencedorRodadaService) {}

  @Post(':campeonatoId')
  @ApiOperation({
    summary: 'Registrar vencedor específico para uma rodada',
    description:
      'Cria ou atualiza um vencedor específico para uma rodada dentro de um campeonato. Esse vencedor não deve ser contabilizado com os vencedores gerais.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiBody({
    type: CreateVencedorRodadaDto,
    examples: {
      somenteRodada: {
        summary: 'Informando apenas o nome da rodada',
        value: {
          nomeRodada: 'R01',
        },
      },
      comCavalo: {
        summary: 'Informando também um cavalo específico para a rodada',
        value: {
          nomeRodada: 'R02',
          cavaloId: 8,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Vencedor específico registrado ou atualizado com sucesso.',
    schema: {
      example: {
        id: 10,
        campeonatoId: 1,
        nomeRodada: 'R01',
        cavaloId: 5,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:05:00.000Z',
      },
    },
  })
  async registrarVencedorRodada(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Body() createDto: CreateVencedorRodadaDto,
  ): Promise<VencedorRodada> {
    return this.vencedorRodadaService.registrarOuAtualizarVencedor(campeonatoId, createDto);
  }

  @Get(':campeonatoId')
  @ApiOperation({
    summary: 'Listar vencedores específicos por rodada',
    description: 'Retorna todos os vencedores específicos cadastrados para um campeonato.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista retornada com sucesso.',
    schema: {
      example: [
        {
          id: 10,
          campeonatoId: 1,
          nomeRodada: 'R01',
          cavaloId: 5,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:05:00.000Z',
        },
      ],
    },
  })
  async listarVencedoresRodada(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<VencedorRodada[]> {
    return this.vencedorRodadaService.listarPorCampeonato(campeonatoId);
  }
}


