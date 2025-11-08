import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApostadorService } from '../services/apostador.service';

@ApiTags('apostadores-resumo')
@Controller('apostadores-resumo')
export class ApostadoresResumoController {
  constructor(private readonly apostadorService: ApostadorService) {}

  @Get('campeonato/:campeonatoId')
  @ApiOperation({
    summary: 'Resumo de apostadores por campeonato considerando combinados',
    description:
      'Retorna as estatísticas de apostas de um campeonato agrupando apostadores combinados. Quando houver combinados, os nomes são unidos por "/", e são listados sob um único grupo.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 14,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo gerado com sucesso.',
    schema: {
      example: {
        campeonatoId: 14,
        totalApostadores: 3,
        apostadores: [
          {
            tipo: 'grupo',
            grupoIdentificador: 'grupo-zezinho',
            nome: 'Zezinho/Zezeca',
            integrantes: ['Zezeca', 'Zezinho'],
            totalApostado: 15000,
            totalPremio: 13250,
            totalApostas: 6,
            primeiraAposta: '2025-11-05T04:12:20.000Z',
            ultimaAposta: '2025-11-05T06:12:20.000Z',
            createdAt: '2025-11-05T04:12:20.000Z',
            updatedAt: '2025-11-05T06:12:20.000Z',
          },
          {
            tipo: 'individual',
            apostadorId: 147,
            nome: 'Zeus',
            totalApostado: 5000,
            totalPremio: 7350,
            totalApostas: 2,
            primeiraAposta: '2025-11-03T03:10:30.000Z',
            ultimaAposta: '2025-11-05T03:10:30.000Z',
            createdAt: '2025-11-03T03:10:30.000Z',
            updatedAt: '2025-11-05T03:10:30.000Z',
          },
        ],
      },
    },
  })
  async obterResumoPorCampeonato(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
  ): Promise<{
    campeonatoId: number;
    totalApostadores: number;
    apostadores: Array<{
      tipo: 'grupo' | 'individual';
      grupoIdentificador?: string;
      apostadorId?: number | null;
      nome: string;
      integrantes?: string[];
      totalApostado: number;
      totalPremio: number;
      totalApostas: number;
      primeiraAposta: Date | null;
      ultimaAposta: Date | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }>;
  }> {
    return this.apostadorService.obterResumoApostadoresCombinados(campeonatoId);
  }
}


