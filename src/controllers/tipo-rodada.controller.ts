import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { TipoRodadaService } from '../services/tipo-rodada.service';
import { TipoRodada } from '../entities/tipo-rodada.entity';
import { CreateTipoRodadaDto } from '../dto/tipo-rodada.dto';

@ApiTags('tipos-rodada')
@Controller('tipos-rodada')
export class TipoRodadaController {
  constructor(private readonly tipoRodadaService: TipoRodadaService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Criar tipo de rodada',
    description: 'Cria um novo tipo de rodada no sistema com apenas o nome'
  })
  @ApiBody({ type: CreateTipoRodadaDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Tipo de rodada criado com sucesso.',
    type: TipoRodada,
    example: {
      id: 1,
      nome: 'Eliminatória',
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
      message: 'Já existe um tipo de rodada com este nome',
      error: 'Conflict'
    }
  })
  async create(@Body() tipoRodadaData: CreateTipoRodadaDto): Promise<TipoRodada> {
    return await this.tipoRodadaService.create(tipoRodadaData);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todos os tipos de rodada',
    description: 'Retorna uma lista com todos os tipos de rodada cadastrados no sistema'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de tipos de rodada retornada com sucesso.',
    type: [TipoRodada],
    example: [
      {
        id: 1,
        nome: 'Eliminatória',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      },
      {
        id: 2,
        nome: 'Classificatória',
        createdAt: '2024-01-15T10:05:00.000Z',
        updatedAt: '2024-01-15T10:05:00.000Z'
      }
    ]
  })
  async findAll(): Promise<TipoRodada[]> {
    return await this.tipoRodadaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar tipo de rodada por ID',
    description: 'Retorna os dados de um tipo de rodada específico baseado no ID fornecido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do tipo de rodada',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tipo de rodada encontrado com sucesso.',
    type: TipoRodada,
    example: {
      id: 1,
      nome: 'Eliminatória',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Tipo de rodada não encontrado.',
    example: {
      statusCode: 404,
      message: 'Tipo de rodada not found',
      error: 'Not Found'
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TipoRodada> {
    return await this.tipoRodadaService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Deletar tipo de rodada',
    description: 'Remove um tipo de rodada do sistema permanentemente. Esta ação não pode ser desfeita.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do tipo de rodada a ser deletado',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tipo de rodada deletado com sucesso.',
    example: {
      message: 'Tipo de rodada deleted successfully'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Tipo de rodada não encontrado.',
    example: {
      statusCode: 404,
      message: 'Tipo de rodada not found',
      error: 'Not Found'
    }
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.tipoRodadaService.remove(id);
  }
}
