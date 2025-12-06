import { DataSource } from 'typeorm';
import { DatabaseConfig } from './config/database.config';

export default new DataSource({
  type: 'postgres',
  host: DatabaseConfig.postgres.host,
  port: DatabaseConfig.postgres.port,
  username: DatabaseConfig.postgres.username,
  password: DatabaseConfig.postgres.password,
  database: DatabaseConfig.postgres.database,
  entities: ['src/modules/**/infrastructure/persistence/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  migrationsTableName: 'migrations',
  logging: process.env.NODE_ENV === 'development',
  synchronize: false, // Disabled: Use migrations instead
});
