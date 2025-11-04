import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateRodadaCasaDto {
  @ApiProperty({
    description: 'Nome da rodada',
    example: 'R01',
  })
  @IsString()
  @IsNotEmpty()
  Rodada: string;

  @ApiProperty({
    description: 'Valor da casa para esta rodada',
    example: 500,
  })
  @IsNumber()
  @Min(0)
  ValorCasa: number;
}
