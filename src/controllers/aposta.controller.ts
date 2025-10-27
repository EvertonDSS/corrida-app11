import { Controller, Get, Post, Body, Param, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { ApostaService } from '../services/aposta.service';
import { ApostasResponseDto } from '../dto/aposta-response.dto';

@ApiTags('apostas')
@Controller('apostas')
export class ApostaController {
  constructor(private readonly apostaService: ApostaService) {}

  @Post(':campeonatoId/:tipoRodadaId')
  @ApiOperation({ 
    summary: 'Salvar apostas',
    description: 'Salva apostas para uma rodada específica de um campeonato'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 1,
    type: 'integer'
  })
  @ApiConsumes('text/plain')
  @ApiResponse({ 
    status: 201, 
    description: 'Apostas salvas com sucesso.',
    type: ApostasResponseDto,
    example: {
      rodadaId: 1,
      campeonatoId: 1,
      tipoRodadaId: 1,
      nomeRodada: 'Chave',
      totalApostado: 5000.00,
      porcentagemRetirada: 20.00,
      totalPremio: 4000.00,
      totalApostas: 8,
      createdAt: '2024-01-15T10:00:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada.',
    example: {
      statusCode: 404,
      message: 'Rodada não encontrada para este campeonato e tipo',
      error: 'Not Found'
    }
  })
  async salvarApostas(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Req() req: any
  ): Promise<ApostasResponseDto> {
    const texto = req.body ? req.body.toString() : '';
    const resultado = await this.apostaService.salvarApostas(campeonatoId, tipoRodadaId, texto);
    
    return {
      campeonatoId: resultado.campeonatoId,
      tipoRodadaId: resultado.tipoRodadaId,
      nomeRodada: resultado.nomeRodada,
      totalApostado: resultado.totalApostado,
      porcentagemRetirada: resultado.porcentagemRetirada,
      totalPremio: resultado.totalPremio,
      totalApostas: resultado.totalApostas,
      apostas: [], // Será preenchido se necessário
      substituida: resultado.substituida,
      createdAt: new Date(),
    };
  }

  @Get('rodada/:campeonatoId/:tipoRodadaId/:nomeRodada')
  @ApiOperation({ 
    summary: 'Buscar apostas por nome da rodada',
    description: 'Retorna todas as apostas de uma rodada específica'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 1,
    type: 'integer'
  })
  @ApiParam({
    name: 'nomeRodada',
    description: 'Nome da rodada',
    example: 'R01',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Apostas da rodada retornadas com sucesso.',
    type: [ApostasResponseDto]
  })
  async findByNomeRodada(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Param('nomeRodada') nomeRodada: string
  ): Promise<any> {
    const apostas = await this.apostaService.findByNomeRodada(campeonatoId, tipoRodadaId, nomeRodada);
    
    return apostas.map(aposta => ({
      id: aposta.id,
      numeroPareo: aposta.pareo.numero,
      apostador: {
        id: aposta.apostador.id,
        nome: aposta.apostador.nome,
      },
      valor: aposta.valor,
      valorOriginal: aposta.valorOriginal,
      porcentagemAposta: aposta.porcentagemAposta,
      porcentagemPremio: aposta.porcentagemPremio,
      valorPremio: aposta.valorPremio,
      valorOriginalPremio: aposta.valorOriginalPremio,
      porcentagemRetirada: aposta.porcentagemRetirada,
    }));
  }

  @Get('campeonato/:campeonatoId')
  @ApiOperation({ 
    summary: 'Buscar apostas por campeonato',
    description: 'Retorna todas as apostas de um campeonato específico'
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Apostas do campeonato retornadas com sucesso.',
    type: [ApostasResponseDto]
  })
  async findByCampeonato(@Param('campeonatoId', ParseIntPipe) campeonatoId: number): Promise<any> {
    const apostas = await this.apostaService.findByCampeonato(campeonatoId);
    
    return apostas.map(aposta => ({
      id: aposta.id,
      numeroPareo: aposta.pareo.numero,
      apostador: {
        id: aposta.apostador.id,
        nome: aposta.apostador.nome,
      },
      valor: aposta.valor,
      valorOriginal: aposta.valorOriginal,
      porcentagemAposta: aposta.porcentagemAposta,
      porcentagemPremio: aposta.porcentagemPremio,
      valorPremio: aposta.valorPremio,
      valorOriginalPremio: aposta.valorOriginalPremio,
      porcentagemRetirada: aposta.porcentagemRetirada,
    }));
  }

}
