import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateVencedorDto {
  @ApiProperty({
    description: 'ID do cavalo vencedor',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  cavaloId: number;
}

