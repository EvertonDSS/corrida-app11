import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class GrupoCombinadoDto {
  @ApiPropertyOptional({
    description:
      'Identificador único do grupo combinado. Se não for informado, um identificador será gerado automaticamente.',
    example: 'grupo-1',
  })
  @IsOptional()
  @IsString()
  identificador?: string;

  @ApiProperty({
    description: 'Lista de nomes de apostadores que pertencem a este grupo combinado.',
    example: ['Zezinho', 'Zezeca'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  nomes: string[];
}

export class DefinirApostadoresCombinadosDto {
  @ApiPropertyOptional({
    description:
      'Lista de nomes de apostadores para criar ou atualizar um único grupo combinado. Mantido por compatibilidade; utiliza o campo "grupos" internamente.',
    example: ['Grupo Jóias', 'Zeus'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  nomesApostadores?: string[];

  @ApiPropertyOptional({
    description:
      'Lista de grupos de apostadores combinados. Cada grupo é tratado de forma independente, combinando apenas os apostadores declarados juntos.',
    type: [GrupoCombinadoDto],
    example: [
      {
        identificador: 'grupo-zezinho',
        nomes: ['Zezinho', 'Zezeca'],
      },
      {
        nomes: ['Zeca', 'Zeze'],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GrupoCombinadoDto)
  grupos?: GrupoCombinadoDto[];
}

