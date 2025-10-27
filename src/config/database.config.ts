import * as fs from 'fs';
import * as path from 'path';

export const DB_CONFIG = {
  // Defina como true para usar PostgreSQL, false para SQLite
  USE_POSTGRES: true,
  
  // Configuração PostgreSQL
  POSTGRES: {
    type: 'postgres' as const,
    host: 'square-cloud-db-5f7fc35aec824eaf8faa4b4518907b79.squareweb.app',
    port: 7068,
    username: 'squarecloud',
    password: 'YlpqpZbevxvDgO439aLuNSte',
    database: 'corrida-test-2', // Altere este nome se o banco tiver outro nome
    entities: [],
    synchronize: true, // Apenas para desenvolvimento
    ssl: {
      rejectUnauthorized: false,
      ca: fs.readFileSync(path.join(__dirname, '../../certs/client.crt')).toString(),
      cert: fs.readFileSync(path.join(__dirname, '../../certs/client.crt')).toString(),
      key: fs.readFileSync(path.join(__dirname, '../../certs/client.key')).toString(),
    },
  },

  // Configuração SQLite
  SQLITE: {
    type: 'sqlite' as const,
    database: 'database.sqlite',
    entities: [],
    synchronize: true, // Apenas para desenvolvimento
  },
};

export function getDatabaseConfig() {
  if (DB_CONFIG.USE_POSTGRES) {
    console.log('🗄️ Usando PostgreSQL');
    return DB_CONFIG.POSTGRES;
  } else {
    console.log('🗄️ Usando SQLite');
    return DB_CONFIG.SQLITE;
  }
}

// Removida função ensureDatabaseExists
// O TypeORM com synchronize: true cria automaticamente o banco e tabelas
