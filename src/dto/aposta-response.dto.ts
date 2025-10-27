import { ApiProperty } from '@nestjs/swagger';

export class ApostadorDto {
  @ApiProperty({
    description: 'ID do apostador',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do apostador',
    example: 'Leonardo Miranda',
  })
  nome: string;
}

export class ApostaDto {
  @ApiProperty({
    description: 'ID da aposta',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Número do pareo',
    example: '01',
  })
  numeroPareo: string;

  @ApiProperty({
    description: 'Dados do apostador',
    type: ApostadorDto,
  })
  apostador: ApostadorDto;

  @ApiProperty({
    description: 'Valor da aposta',
    example: 800.00,
  })
  valor: number;

  @ApiProperty({
    description: 'Valor original da aposta',
    example: 1000.00,
  })
  valorOriginal: number;

  @ApiProperty({
    description: 'Porcentagem da aposta',
    example: 100.00,
  })
  porcentagemAposta: number;

  @ApiProperty({
    description: 'Porcentagem do prêmio',
    example: 20.00,
  })
  porcentagemPremio: number;

  @ApiProperty({
    description: 'Valor total do prêmio (após retirada)',
    example: 4000.00,
  })
  valorPremio: number;

  @ApiProperty({
    description: 'Valor original total do prêmio (antes da retirada)',
    example: 5000.00,
  })
  valorOriginalPremio: number;

  @ApiProperty({
    description: 'Porcentagem de retirada',
    example: 20.00,
  })
  porcentagemRetirada: number;
}

export class ApostasResponseDto {

  @ApiProperty({
    description: 'ID do campeonato',
    example: 1,
  })
  campeonatoId: number;

  @ApiProperty({
    description: 'ID do tipo de rodada',
    example: 1,
  })
  tipoRodadaId: number;

  @ApiProperty({
    description: 'Nome da rodada',
    example: 'Chave',
  })
  nomeRodada: string;

  @ApiProperty({
    description: 'Total apostado',
    example: 5000.00,
  })
  totalApostado: number;

  @ApiProperty({
    description: 'Porcentagem de retirada',
    example: 20.00,
  })
  porcentagemRetirada: number;

  @ApiProperty({
    description: 'Total de prêmio',
    example: 4000.00,
  })
  totalPremio: number;

  @ApiProperty({
    description: 'Lista de apostas',
    type: [ApostaDto],
  })
  apostas: ApostaDto[];

  @ApiProperty({
    description: 'Total de apostas',
    example: 8,
  })
  totalApostas: number;

  @ApiProperty({
    description: 'Valor removido das apostas com ❌',
    example: 1200.00,
    required: false,
  })
  valorRemovido?: number;

  @ApiProperty({
    description: 'Mensagem de retorno',
    example: 'Apostas atualizadas com sucesso',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Indica se as apostas foram substituídas (true) ou criadas (false)',
    example: true,
    required: false,
  })
  substituida?: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;
}
