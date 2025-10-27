import { ApiProperty } from '@nestjs/swagger';

export class CreateCampeonatoDto {
  @ApiProperty({
    description: 'Nome do campeonato',
    example: 'Campeonato Brasileiro 2024',
    minLength: 3,
    maxLength: 100,
  })
  nome: string;
}
