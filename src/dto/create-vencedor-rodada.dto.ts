import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateVencedorRodadaDto {
  @ApiProperty({
    description: 'Nome da rodada que terá um vencedor específico',
    example: 'R01',
  })
  @IsString()
  @IsNotEmpty()
  nomeRodada: string;

  @ApiPropertyOptional({
    description: 'ID do cavalo vencedor específico para a rodada',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  cavaloId?: number;
}


