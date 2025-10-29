import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenomearApostadorDto {
  @ApiProperty({
    description: 'Nome original do apostador',
    example: 'João Silva',
    minLength: 2
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nomeOriginal: string;

  @ApiProperty({
    description: 'Novo nome do apostador',
    example: 'João Santos Silva',
    minLength: 2
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  novoNome: string;
}
