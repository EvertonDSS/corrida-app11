import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApostadorService } from '../services/apostador.service';

@ApiTags('apostadores')
@Controller('apostadores')
export class ApostadorController {
  constructor(private readonly apostadorService: ApostadorService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todos os apostadores',
    description: 'Retorna todos os apostadores cadastrados no sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de apostadores retornada com sucesso.',
    example: [
      {
        id: 1,
        nome: "João Silva",
        createdAt: "2024-01-15T10:00:00.000Z",
        updatedAt: "2024-01-15T10:00:00.000Z"
      },
      {
        id: 2,
        nome: "Maria Santos",
        createdAt: "2024-01-15T10:00:00.000Z",
        updatedAt: "2024-01-15T10:00:00.000Z"
      }
    ]
  })
  async findAll(): Promise<any[]> {
    return await this.apostadorService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar apostador por ID',
    description: 'Retorna um apostador específico pelo ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do apostador',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({
    status: 200,
    description: 'Apostador encontrado.',
    example: {
      id: 1,
      nome: "João Silva",
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z"
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Apostador não encontrado.',
    example: {
      statusCode: 404,
      message: 'Apostador não encontrado',
      error: 'Not Found'
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.apostadorService.findOne(id);
  }

  @Get('campeonato/:campeonatoId')
  @ApiOperation({
    summary: 'Listar apostadores do campeonato',
    description: 'Retorna todos os apostadores que fizeram apostas em um campeonato específico'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de apostadores do campeonato retornada com sucesso.',
    example: [
      {
        id: 1,
        nome: "João Silva",
        totalApostado: 1500.00,
        totalPremio: 1200.00,
        totalApostas: 5,
        primeiraAposta: "2024-01-15T10:00:00.000Z",
        ultimaAposta: "2024-01-20T15:30:00.000Z",
        createdAt: "2024-01-15T10:00:00.000Z",
        updatedAt: "2024-01-20T15:30:00.000Z"
      }
    ]
  })
  async findByCampeonato(@Param('campeonatoId', ParseIntPipe) campeonatoId: number): Promise<any[]> {
    return await this.apostadorService.findByCampeonato(campeonatoId);
  }
}
