import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AtualizarApostaRodadaItemDto {
  @ApiProperty({
    description: 'ID da aposta a ser atualizada',
    example: 364,
  })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({
    description: 'Número do páreo (apenas informativo)',
    example: '01',
    required: false,
  })
  @IsOptional()
  @IsString()
  numeroPareo?: string;

  @ApiProperty({
    description: 'Identificador do apostador (apenas informativo)',
    example: {
      id: 147,
      nome: 'Zeus',
    },
    required: false,
  })
  @IsOptional()
  apostador?: {
    id?: number;
    nome?: string;
  };

  @ApiProperty({
    description: 'Valor apostado',
    example: '5000.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  valor?: string;

  @ApiProperty({
    description: 'Valor original apostado',
    example: '10000.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  valorOriginal?: string;

  @ApiProperty({
    description: 'Porcentagem da aposta',
    example: '50.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  porcentagemAposta?: string;

  @ApiProperty({
    description: 'Porcentagem do prêmio',
    example: '50.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  porcentagemPremio?: string;

  @ApiProperty({
    description: 'Valor do prêmio',
    example: '14715.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  valorPremio?: string;

  @ApiProperty({
    description: 'Valor original do prêmio',
    example: '16350.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  valorOriginalPremio?: string;

  @ApiProperty({
    description: 'Porcentagem de retirada',
    example: '10.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  porcentagemRetirada?: string;
}

export class AtualizarApostasRodadaDto {
  @ApiProperty({
    description: 'Nome da rodada cujas apostas devem ser atualizadas',
    example: 'R01',
  })
  @IsString()
  @IsNotEmpty()
  nomeRodada: string;

  @ApiProperty({
    description: 'Lista de apostas a serem atualizadas',
    type: [AtualizarApostaRodadaItemDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AtualizarApostaRodadaItemDto)
  apostas: AtualizarApostaRodadaItemDto[];
}


