import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ApostadorService } from '../services/apostador.service';
import { RenomearApostadorDto } from '../dto/renomear-apostador.dto';

@ApiTags('apostadores')
@Controller('apostadores')
export class ApostadorController {
  constructor(private readonly apostadorService: ApostadorService) {}

  @Get('campeonato/:campeonatoId')
  @ApiOperation({
    summary: 'Listar apostadores por campeonato',
    description: 'Retorna todos os apostadores que fizeram apostas em um campeonato específico, incluindo suas estatísticas.'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de apostadores retornada com sucesso.',
    example: {
      campeonatoId: 1,
      totalApostadores: 3,
      apostadores: [
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
        },
        {
          id: 2,
          nome: "Maria Santos",
          totalApostado: 2000.00,
          totalPremio: 1800.00,
          totalApostas: 8,
          primeiraAposta: "2024-01-16T09:00:00.000Z",
          ultimaAposta: "2024-01-21T14:00:00.000Z",
          createdAt: "2024-01-16T09:00:00.000Z",
          updatedAt: "2024-01-21T14:00:00.000Z"
        }
      ]
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Nenhum apostador encontrado para o campeonato.',
    example: {
      campeonatoId: 1,
      totalApostadores: 0,
      apostadores: []
    }
  })
  async listarApostadoresPorCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number
  ): Promise<any> {
    const apostadores = await this.apostadorService.findByCampeonato(campeonatoId);
    
    return {
      campeonatoId,
      totalApostadores: apostadores.length,
      apostadores
    };
  }

  @Post('renomear/:campeonatoId')
  @ApiOperation({ 
    summary: 'Renomear apostador',
    description: 'Renomeia um apostador e atualiza todas as suas apostas em um campeonato específico'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiBody({
    type: RenomearApostadorDto,
    description: 'Dados para renomeação do apostador',
    examples: {
      exemplo1: {
        summary: 'Exemplo de renomeação',
        value: {
          nomeOriginal: 'João Silva',
          novoNome: 'João Santos Silva'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Apostador renomeado ou mesclado com sucesso.',
    example: {
      apostador: {
        id: 1,
        nome: 'João Santos Silva',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T15:30:00.000Z'
      },
      apostasAtualizadas: 5,
      campeonatoId: 1,
      nomeOriginal: 'João Silva',
      novoNome: 'João Santos Silva',
      acao: 'renomeado'
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Apostador mesclado com apostador existente.',
    example: {
      apostador: {
        id: 2,
        nome: 'Maria Santos',
        createdAt: '2024-01-10T10:00:00.000Z',
        updatedAt: '2024-01-15T15:30:00.000Z'
      },
      apostasAtualizadas: 3,
      campeonatoId: 1,
      nomeOriginal: 'Maria Silva',
      novoNome: 'Maria Santos',
      acao: 'mesclado',
      apostadorMesclado: {
        id: 2,
        nome: 'Maria Santos'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Apostador não encontrado.',
    example: {
      statusCode: 404,
      message: 'Apostador com nome "João Silva" não encontrado no campeonato',
      error: 'Not Found'
    }
  })
  async renomearApostador(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Body() renomearDto: RenomearApostadorDto
  ): Promise<any> {
    try {
      const resultado = await this.apostadorService.renomearApostador(
        campeonatoId,
        renomearDto.nomeOriginal,
        renomearDto.novoNome
      );
      
      return resultado;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Erro ao renomear apostador: ${error.message}`);
    }
  }
}