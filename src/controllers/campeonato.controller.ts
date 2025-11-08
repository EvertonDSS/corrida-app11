import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CampeonatoService } from '../services/campeonato.service';
import { Campeonato } from '../entities/campeonato.entity';
import { CreateCampeonatoDto } from '../dto/campeonato.dto';

@ApiTags('campeonatos')
@Controller('campeonatos')
export class CampeonatoController {
  constructor(private readonly campeonatoService: CampeonatoService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Criar campeonato',
    description: 'Cria um novo campeonato no sistema com apenas o nome'
  })
  @ApiBody({ type: CreateCampeonatoDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Campeonato criado com sucesso.',
    type: Campeonato,
    example: {
      id: 1,
      nome: 'Campeonato Brasileiro 2024',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos.',
    example: {
      statusCode: 400,
      message: ['nome should not be empty', 'nome must be longer than or equal to 3 characters'],
      error: 'Bad Request'
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflito - Nome já existe.',
    example: {
      statusCode: 409,
      message: 'Já existe um campeonato com este nome',
      error: 'Conflict'
    }
  })
  async create(@Body() campeonatoData: CreateCampeonatoDto): Promise<Campeonato> {
    return await this.campeonatoService.create(campeonatoData);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todos os campeonatos',
    description: 'Retorna uma lista com todos os campeonatos cadastrados no sistema'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de campeonatos retornada com sucesso.',
    type: [Campeonato],
    example: [
      {
        id: 1,
        nome: 'Campeonato Brasileiro 2024',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      },
      {
        id: 2,
        nome: 'Copa do Brasil 2024',
        createdAt: '2024-01-15T10:05:00.000Z',
        updatedAt: '2024-01-15T10:05:00.000Z'
      }
    ]
  })
  async findAll(): Promise<Campeonato[]> {
    return await this.campeonatoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar campeonato por ID',
    description: 'Retorna os dados de um campeonato específico baseado no ID fornecido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Campeonato encontrado com sucesso.',
    type: Campeonato,
    example: {
      id: 1,
      nome: 'Campeonato Brasileiro 2024',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Campeonato não encontrado.',
    example: {
      statusCode: 404,
      message: 'Campeonato not found',
      error: 'Not Found'
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Campeonato> {
    return await this.campeonatoService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Deletar campeonato',
    description: 'Remove um campeonato do sistema permanentemente. Esta ação não pode ser desfeita.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do campeonato a ser deletado',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({
    status: 200,
    description: 'Campeonato deletado com sucesso.',
    schema: {
      example: {
        message: 'Campeonato "Campeonato Brasileiro 2024" e todos os dados relacionados foram removidos com sucesso.',
        resumo: {
          apostas: 120,
          ganhadoresPossiveis: 16,
          vencedores: 2,
          vencedoresRodada: 5,
          apostadoresCombinados: 4,
          rodadasCasa: 3,
          pareosExcluidos: 6,
          cavalos: 48,
          pareos: 12,
          campeonatos: 1,
        },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Campeonato não encontrado.',
    example: {
      statusCode: 404,
      message: 'Campeonato not found',
      error: 'Not Found'
    }
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; resumo: Record<string, number> }> {
    return await this.campeonatoService.remove(id);
  }
}