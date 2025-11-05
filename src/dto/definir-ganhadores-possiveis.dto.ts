import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayMinSize, Min } from 'class-validator';

export class DefinirGanhadoresPossiveisDto {
  @ApiProperty({
    description: 'ID do tipo de rodada',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  tipoRodadaId: number;

  @ApiProperty({
    description: 'Lista de IDs dos cavalos possíveis ganhadores',
    example: [1, 2, 3, 4],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  cavalosIds: number[];
}
