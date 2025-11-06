import { Controller, Get, Post, Param, ParseIntPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VencedorService } from '../services/vencedor.service';
import { CreateVencedorDto } from '../dto/create-vencedor.dto';
import { Vencedor } from '../entities/vencedor.entity';

@ApiTags('vencedores')
@Controller('vencedores')
export class VencedorController {
  constructor(private readonly vencedorService: VencedorService) {}

  @Post(':campeonatoId')
  @ApiOperation({
    summary: 'Definir cavalo vencedor',
    description: 'Salva um cavalo como vencedor de um campeonato. Permite cadastrar múltiplos vencedores para o mesmo campeonato.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiBody({
    type: CreateVencedorDto,
    examples: {
      unico: {
        summary: 'Adicionar somente um cavalo',
        value: {
          cavaloId: 5,
        },
      },
      multiplo: {
        summary: 'Substituir pelos cavalos informados',
        value: {
          cavalosIds: [5, 8, 12],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Vencedores cadastrados/atualizados com sucesso.',
    schema: {
      example: [
        {
          id: 10,
          campeonatoId: 1,
          cavaloId: 5,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 11,
          campeonatoId: 1,
          cavaloId: 8,
          createdAt: '2024-01-15T10:01:00.000Z',
          updatedAt: '2024-01-15T10:01:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Campeonato ou cavalo não encontrado.',
  })
  async criarVencedor(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Body() createDto: CreateVencedorDto,
  ): Promise<Vencedor[]> {
    return this.vencedorService.criarVencedor(campeonatoId, createDto);
  }

  @Get(':campeonatoId')
  @ApiOperation({
    summary: 'Buscar vencedor por campeonato',
    description: 'Retorna os cavalos vencedores e lista de apostadores vencedores com seus valores de prêmio',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Vencedores encontrados com sucesso.',
    schema: {
      example: {
        vencedores: [
          {
            cavaloId: 5,
            nomecavalovencedor: 'Cavalo Vencedor 1',
            vencedores: [
              {
                nomeapostador: 'João Silva',
                valorpremio: 150.0,
              },
              {
                nomeapostador: 'Maria Santos',
                valorpremio: 200.0,
              },
            ],
          },
          {
            cavaloId: 8,
            nomecavalovencedor: 'Cavalo Vencedor 2',
            vencedores: [
              {
                nomeapostador: 'Pedro Oliveira',
                valorpremio: 300.0,
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum vencedor encontrado para o campeonato.',
  })
  async buscarVencedorPorCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<any> {
    return this.vencedorService.buscarVencedorPorCampeonato(campeonatoId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os vencedores',
    description: 'Retorna todos os vencedores cadastrados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vencedores retornada com sucesso.',
    schema: {
      example: [
        {
          id: 1,
          campeonatoId: 1,
          cavaloId: 5,
          cavalo: {
            id: 5,
            nome: 'Cavalo Vencedor',
            pareoId: 3,
          },
          campeonato: {
            id: 1,
            nome: 'Campeonato 2024',
          },
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    },
  })
  async listarVencedores(): Promise<Vencedor[]> {
    return this.vencedorService.listarVencedores();
  }
}

