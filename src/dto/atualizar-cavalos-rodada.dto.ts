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

export class AtualizarCavaloDto {
  @ApiProperty({
    description: 'ID do páreo ao qual o cavalo pertence',
    example: 262,
  })
  @IsInt()
  @Min(1)
  pareoId: number;

  @ApiProperty({
    description: 'ID do cavalo a ser atualizado',
    example: 325,
  })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({
    description: 'Nome atual do cavalo',
    example: 'LUIS STRAW HRZ',
  })
  @IsString()
  @IsOptional()
  nome?: string;
}

export class AtualizarCavalosRodadaDto {
  @ApiProperty({
    description: 'Lista de cavalos com os nomes atualizados',
    type: [AtualizarCavaloDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AtualizarCavaloDto)
  cavalos: AtualizarCavaloDto[];
}


