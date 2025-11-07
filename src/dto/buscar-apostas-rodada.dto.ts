import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BuscarApostasRodadaDto {
  @ApiProperty({
    description: 'Nome da rodada a ser consultada',
    example: 'R01',
  })
  @IsString()
  @IsNotEmpty()
  nomeRodada: string;
}


