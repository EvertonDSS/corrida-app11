import { Controller, Post, Body, Param, ParseIntPipe, NotFoundException, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ApostadorService } from '../services/apostador.service';
import { RenomearApostadorDto } from '../dto/renomear-apostador.dto';

@ApiTags('apostadores')
@Controller('apostadores')
export class ApostadorController {
  constructor(private readonly apostadorService: ApostadorService) {}

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
    description: 'Apostador renomeado com sucesso.',
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
      novoNome: 'João Santos Silva'
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
  @ApiResponse({ 
    status: 409, 
    description: 'Conflito - Novo nome já existe.',
    example: {
      statusCode: 409,
      message: 'Já existe um apostador com o nome "João Santos Silva"',
      error: 'Conflict'
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
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new NotFoundException(`Erro ao renomear apostador: ${error.message}`);
    }
  }
}