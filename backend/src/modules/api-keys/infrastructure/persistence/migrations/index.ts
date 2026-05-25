import { MigrationInterface } from 'typeorm';
import { CreateApiKeysTable1708000000001 } from './1708000000001-CreateApiKeysTable';
import { AddApiKeyExtendedFields1708000000002 } from './1708000000002-AddApiKeyExtendedFields';
import { WidenApiKeySecretColumn1708000000003 } from './1708000000003-WidenApiKeySecretColumn';

export const ApiKeysMigrations: (new () => MigrationInterface)[] = [
  CreateApiKeysTable1708000000001,
  AddApiKeyExtendedFields1708000000002,
  WidenApiKeySecretColumn1708000000003,
];

export { CreateApiKeysTable1708000000001, AddApiKeyExtendedFields1708000000002, WidenApiKeySecretColumn1708000000003 };
