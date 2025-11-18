import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class DescombinarApostadoresDto {
  @ApiPropertyOptional({
    description:
      'Lista de nomes de apostadores a serem descombinados. Se informado, remove apenas esses apostadores das combinações.',
    example: ['Zezinho', 'Zezeca'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  nomesApostadores?: string[];

  @ApiPropertyOptional({
    description:
      'Identificador do grupo a ser descombinado. Se informado, remove todos os apostadores desse grupo.',
    example: 'grupo-joias__zeus',
  })
  @IsOptional()
  @IsString()
  grupoIdentificador?: string;
}

