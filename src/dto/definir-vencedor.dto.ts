import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DefinirVencedorDto {
  @ApiProperty({
    description: 'ID do cavalo vencedor',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  cavaloId: number;
}
