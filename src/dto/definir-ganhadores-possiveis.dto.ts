import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

export class DefinirGanhadoresPossiveisDto {
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
