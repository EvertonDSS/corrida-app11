import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfService } from '../services/pdf.service';

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('relatorio/:campeonatoId/:apostadorId')
  @ApiOperation({ 
    summary: 'Gerar relatório PDF do apostador',
    description: 'Gera um relatório em PDF com todas as apostas de um apostador em um campeonato específico'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiParam({
    name: 'apostadorId',
    description: 'ID do apostador',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'PDF gerado com sucesso.',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Apostador ou apostas não encontradas.',
    example: {
      statusCode: 404,
      message: 'Apostador não encontrado',
      error: 'Not Found'
    }
  })
  async gerarRelatorioApostador(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('apostadorId', ParseIntPipe) apostadorId: number,
    @Res() res: Response
  ): Promise<void> {
    try {
      const pdf = await this.pdfService.gerarRelatorioApostador(campeonatoId, apostadorId);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-apostador-${apostadorId}-campeonato-${campeonatoId}.pdf"`,
        'Content-Length': pdf.length.toString(),
      });

      res.send(pdf);
    } catch (error) {
      res.status(404).json({
        statusCode: 404,
        message: error.message,
        error: 'Not Found'
      });
    }
  }

  @Get('dados/:campeonatoId/:apostadorId')
  @ApiOperation({ 
    summary: 'Obter dados estruturados para PDF',
    description: 'Retorna os dados estruturados de um apostador em um campeonato específico para criação de PDF'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiParam({
    name: 'apostadorId',
    description: 'ID do apostador',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados estruturados retornados com sucesso.',
    example: {
      apostador: {
        id: 1,
        nome: "João Silva"
      },
      apostasPorRodada: [
        {
          nomeRodada: "R01",
          tipoRodada: {
            id: 1,
            nome: "Chave"
          },
          apostas: [
            {
              pareo: {
                numero: "01",
                cavalos: [
                  { nome: "Cavalo A" },
                  { nome: "Cavalo B" }
                ]
              },
              valor: 250.00,
              porcentagemAposta: 50,
              valorPremio: 200.00,
              valorOriginalPremio: 1000.00
            }
          ],
          totalRodada: 1000.00
        }
      ],
      totalApostado: 500.00,
      totalPremio: 400.00
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
  async obterDadosEstruturados(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('apostadorId', ParseIntPipe) apostadorId: number
  ): Promise<any> {
    return await this.pdfService.obterDadosEstruturados(campeonatoId, apostadorId);
  }
}
