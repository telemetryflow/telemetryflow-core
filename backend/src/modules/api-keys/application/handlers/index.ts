// Command Handlers
export * from './CreateApiKey.handler';
export * from './UpdateApiKey.handler';
export * from './RevokeApiKey.handler';
export * from './DeleteApiKey.handler';
export * from './RotateApiKey.handler';
export * from './ActivateApiKey.handler';
export * from './DeactivateApiKey.handler';

// Query Handlers
export * from './GetApiKey.handler';
export * from './ListApiKeys.handler';

import { CreateApiKeyHandler } from './CreateApiKey.handler';
import { UpdateApiKeyHandler } from './UpdateApiKey.handler';
import { RevokeApiKeyHandler } from './RevokeApiKey.handler';
import { DeleteApiKeyHandler } from './DeleteApiKey.handler';
import { RotateApiKeyHandler } from './RotateApiKey.handler';
import { ActivateApiKeyHandler } from './ActivateApiKey.handler';
import { DeactivateApiKeyHandler } from './DeactivateApiKey.handler';
import { GetApiKeyHandler } from './GetApiKey.handler';
import { ListApiKeysHandler } from './ListApiKeys.handler';

export const CommandHandlers = [
  CreateApiKeyHandler,
  UpdateApiKeyHandler,
  RevokeApiKeyHandler,
  DeleteApiKeyHandler,
  RotateApiKeyHandler,
  ActivateApiKeyHandler,
  DeactivateApiKeyHandler,
];

export const QueryHandlers = [GetApiKeyHandler, ListApiKeysHandler];
