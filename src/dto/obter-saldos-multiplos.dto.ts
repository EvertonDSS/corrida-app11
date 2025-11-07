import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class ObterSaldosMultiplosDto {
  @ApiProperty({
    description: 'Lista de IDs de campeonatos a serem consolidados.',
    example: [1, 3, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  campeonatosIds: number[];
}


