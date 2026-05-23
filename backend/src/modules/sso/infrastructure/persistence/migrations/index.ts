import { MigrationInterface } from 'typeorm';
import { CreateSsoTables1709000000001 } from './1709000000001-CreateSsoTables';

export const SsoMigrations: (new () => MigrationInterface)[] = [
  CreateSsoTables1709000000001,
];

export { CreateSsoTables1709000000001 };
