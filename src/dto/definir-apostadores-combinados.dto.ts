import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class DefinirApostadoresCombinadosDto {
  @ApiProperty({
    description: 'Lista de nomes de apostadores que combinaram as apostas',
    example: ['Grupo Jóias', 'Zeus'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  nomesApostadores: string[];
}


