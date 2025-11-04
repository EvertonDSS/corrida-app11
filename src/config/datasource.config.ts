import { DataSource, DataSourceOptions as TypeOrmDataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from './database.config';
import { Campeonato } from '../entities/campeonato.entity';
import { TipoRodada } from '../entities/tipo-rodada.entity';
import { Pareo } from '../entities/pareo.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';
import { RodadaCasa } from '../entities/rodada-casa.entity';
import { GanhadorPossivel } from '../entities/ganhador-possivel.entity';

const baseConfig = getDatabaseConfig();

export const AppDataSourceConfig: TypeOrmDataSourceOptions = {
  ...baseConfig,
  entities: [Campeonato, TipoRodada, Pareo, Cavalo, Aposta, Apostador, PareoExcluido, RodadaCasa, GanhadorPossivel],
  migrations: ['dist/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  logging: false,
};

// Para usar com TypeORM CLI
export const AppDataSource = new DataSource(AppDataSourceConfig);
