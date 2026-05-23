import { MigrationInterface } from 'typeorm';
import { CreateRetentionPoliciesTable1717000000001 } from './1717000000001-CreateRetentionPoliciesTable';

export const RetentionMigrations: (new () => MigrationInterface)[] = [
  CreateRetentionPoliciesTable1717000000001,
];

export { CreateRetentionPoliciesTable1717000000001 };
