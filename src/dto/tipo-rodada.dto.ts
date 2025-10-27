import { ApiProperty } from '@nestjs/swagger';

export class CreateTipoRodadaDto {
  @ApiProperty({
    description: 'Nome do tipo de rodada',
    example: 'Eliminatória',
    minLength: 3,
    maxLength: 50,
  })
  nome: string;
}
