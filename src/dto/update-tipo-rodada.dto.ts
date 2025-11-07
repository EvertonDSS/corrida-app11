import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateTipoRodadaDto {
  @ApiProperty({
    description: 'Novo nome do tipo de rodada',
    example: 'BOLÃO INDIVIDUAL',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nome: string;
}


