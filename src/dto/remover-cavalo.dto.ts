import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoverCavaloDto {
  @ApiProperty({
    description: 'Nome do cavalo a ser removido',
    example: 'Cavalo 4',
    minLength: 2
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nomeCavalo: string;
}
