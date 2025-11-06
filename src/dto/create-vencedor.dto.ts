import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateVencedorDto {
  @ApiPropertyOptional({
    description: 'ID único do cavalo vencedor. Utilize quando quiser adicionar apenas um cavalo.',
    example: 5,
    minimum: 1,
  })
  @ValidateIf(dto => !dto.cavalosIds || dto.cavalosIds.length === 0)
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  cavaloId?: number;

  @ApiPropertyOptional({
    description: 'Lista de IDs de cavalos vencedores. Quando enviada, substitui todos os vencedores atuais do campeonato.',
    example: [5, 8, 12],
    type: [Number],
  })
  @ValidateIf(dto => dto.cavalosIds !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  cavalosIds?: number[];
}

