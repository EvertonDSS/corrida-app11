import { Body, Controller, Delete, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApostaService } from '../services/aposta.service';
import { BuscarApostasRodadaDto } from '../dto/buscar-apostas-rodada.dto';
import { AtualizarApostasRodadaDto } from '../dto/atualizar-apostas-rodada.dto';

@ApiTags('apostas')
@Controller('apostas')
export class ApostaRodadaController {
  constructor(private readonly apostaService: ApostaService) {}

  @Post('rodadas/:campeonatoId/:tipoRodadaId')
  @ApiOperation({
    summary: 'Buscar apostas de uma rodada via corpo da requisição',
    description:
      'Recebe o ID do campeonato, o ID do tipo de rodada e o nome da rodada no corpo para retornar as apostas correspondentes.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 12,
    type: 'integer',
  })
  @ApiBody({
    type: BuscarApostasRodadaDto,
    examples: {
      exemplo: {
        value: {
          nomeRodada: 'R01',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Apostas da rodada retornadas com sucesso.',
    schema: {
      example: [
        {
          id: 303,
          numeroPareo: '04',
          apostador: {
            id: 105,
            nome: 'Jota Jota',
          },
          valor: 3000,
          valorOriginal: '3000.00',
          porcentagemAposta: '100.00',
          porcentagemPremio: '100.00',
          valorPremio: 14715,
          valorOriginalPremio: 16350,
          porcentagemRetirada: '10.00',
        },
      ],
    },
  })
  async buscarApostasPorRodada(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Body() body: BuscarApostasRodadaDto,
  ): Promise<any[]> {
    const nomeRodada = body.nomeRodada.trim();
    const apostas = await this.apostaService.findByNomeRodada(campeonatoId, tipoRodadaId, nomeRodada);

    return apostas.map(aposta => ({
      id: aposta.id,
      numeroPareo: aposta.pareo?.numero ?? null,
      apostador: aposta.apostador
        ? {
            id: aposta.apostador.id,
            nome: aposta.apostador.nome,
          }
        : null,
      valor: aposta.valor,
      valorOriginal: aposta.valorOriginal,
      porcentagemAposta: aposta.porcentagemAposta,
      porcentagemPremio: aposta.porcentagemPremio,
      valorPremio: aposta.valorPremio,
      valorOriginalPremio: aposta.valorOriginalPremio,
      porcentagemRetirada: aposta.porcentagemRetirada,
    }));
  }

  @Put('rodadas/:campeonatoId/:tipoRodadaId')
  @ApiOperation({
    summary: 'Atualizar apostas de uma rodada',
    description:
      'Atualiza apostas específicas de uma rodada informando os novos valores no corpo da requisição.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 12,
    type: 'integer',
  })
  @ApiBody({
    type: AtualizarApostasRodadaDto,
    examples: {
      exemplo: {
        value: {
          nomeRodada: 'R01',
          apostas: [
            {
              id: 364,
              numeroPareo: '01',
              apostador: {
                id: 147,
                nome: 'Zeus',
              },
              valor: '5000.00',
              valorOriginal: '10000.00',
              porcentagemAposta: '50.00',
              porcentagemPremio: '50.00',
              valorPremio: '14715.00',
              valorOriginalPremio: '16350.00',
              porcentagemRetirada: '10.00',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Apostas atualizadas com sucesso.',
  })
  async atualizarApostasPorRodada(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Body() body: AtualizarApostasRodadaDto,
  ): Promise<any[]> {
    const nomeRodada = body.nomeRodada.trim();
    const apostasAtualizadas = await this.apostaService.atualizarApostasRodada(
      campeonatoId,
      tipoRodadaId,
      nomeRodada,
      body.apostas.map(aposta => ({
        id: aposta.id,
        valor: aposta.valor,
        valorOriginal: aposta.valorOriginal,
        porcentagemAposta: aposta.porcentagemAposta,
        porcentagemPremio: aposta.porcentagemPremio,
        valorPremio: aposta.valorPremio,
        valorOriginalPremio: aposta.valorOriginalPremio,
        porcentagemRetirada: aposta.porcentagemRetirada,
      })),
    );

    return apostasAtualizadas.map(aposta => ({
      id: aposta.id,
      numeroPareo: aposta.pareo?.numero ?? null,
      apostador: aposta.apostador
        ? {
            id: aposta.apostador.id,
            nome: aposta.apostador.nome,
          }
        : null,
      valor: aposta.valor,
      valorOriginal: aposta.valorOriginal,
      porcentagemAposta: aposta.porcentagemAposta,
      porcentagemPremio: aposta.porcentagemPremio,
      valorPremio: aposta.valorPremio,
      valorOriginalPremio: aposta.valorOriginalPremio,
      porcentagemRetirada: aposta.porcentagemRetirada,
    }));
  }

  @Delete('rodadas/:campeonatoId/:tipoRodadaId')
  @ApiOperation({
    summary: 'Excluir uma rodada completa',
    description:
      'Remove todas as apostas e vencedores de rodada associados a um campeonato, tipo de rodada e nome de rodada informados no corpo da requisição.',
  })
  @ApiParam({
    name: 'campeonatoId',
    description: 'ID do campeonato',
    example: 1,
    type: 'integer',
  })
  @ApiParam({
    name: 'tipoRodadaId',
    description: 'ID do tipo de rodada',
    example: 12,
    type: 'integer',
  })
  @ApiBody({
    type: BuscarApostasRodadaDto,
    examples: {
      exemplo: {
        value: {
          nomeRodada: 'RODADA - 03',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Rodada excluída com sucesso.',
    schema: {
      example: {
        campeonatoId: 11,
        tipoRodadaId: 14,
        nomeRodada: 'RODADA - 03',
        apostasRemovidas: 8,
        vencedoresRodadaRemovidos: 1,
      },
    },
  })
  async removerRodadaCompleta(
    @Param('campeonatoId', ParseIntPipe) campeonatoId: number,
    @Param('tipoRodadaId', ParseIntPipe) tipoRodadaId: number,
    @Body() body: BuscarApostasRodadaDto,
  ): Promise<{
    campeonatoId: number;
    tipoRodadaId: number;
    nomeRodada: string;
    apostasRemovidas: number;
    vencedoresRodadaRemovidos: number;
  }> {
    const nomeRodada = body.nomeRodada.trim();
    return this.apostaService.removerApostasRodada(campeonatoId, tipoRodadaId, nomeRodada);
  }
}


