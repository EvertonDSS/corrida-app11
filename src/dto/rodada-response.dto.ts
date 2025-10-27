import { ApiProperty } from '@nestjs/swagger';

export class CavaloDto {
  @ApiProperty({
    description: 'ID do cavalo',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do cavalo',
    example: 'MAXIMO SENATOR HBR',
  })
  nome: string;

  @ApiProperty({
    description: 'Identificador do cavalo no pareo',
    example: 'A',
    required: false,
  })
  identificador?: string;
}

export class PareoDto {
  @ApiProperty({
    description: 'ID do pareo',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Número do pareo',
    example: '01',
  })
  numero: string;

  @ApiProperty({
    description: 'Lista de cavalos do pareo',
    type: [CavaloDto],
  })
  cavalos: CavaloDto[];
}

export class RodadaResponseDto {
  @ApiProperty({
    description: 'ID da rodada',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID do campeonato',
    example: 1,
  })
  campeonatoId: number;

  @ApiProperty({
    description: 'ID do tipo de rodada',
    example: 1,
  })
  tipoRodadaId: number;

  @ApiProperty({
    description: 'Nome da rodada',
    example: 'Chave',
  })
  nome: string;

  @ApiProperty({
    description: 'Lista de pareos da rodada',
    type: [PareoDto],
  })
  pareos: PareoDto[];

  @ApiProperty({
    description: 'Total de pareos',
    example: 8,
  })
  totalPareos: number;

  @ApiProperty({
    description: 'Total de cavalos',
    example: 15,
  })
  totalCavalos: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:00:00.000Z',
  })
  updatedAt: Date;
}
