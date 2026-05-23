export * from './CreateRetentionPolicy.handler';
export * from './UpdateRetentionPolicy.handler';
export * from './DeleteRetentionPolicy.handler';
export * from './GetRetentionPolicy.handler';
export * from './ListRetentionPolicies.handler';

import { CreateRetentionPolicyHandler } from './CreateRetentionPolicy.handler';
import { UpdateRetentionPolicyHandler } from './UpdateRetentionPolicy.handler';
import { DeleteRetentionPolicyHandler } from './DeleteRetentionPolicy.handler';
import { GetRetentionPolicyHandler } from './GetRetentionPolicy.handler';
import { ListRetentionPoliciesHandler } from './ListRetentionPolicies.handler';

export const CommandHandlers = [
  CreateRetentionPolicyHandler,
  UpdateRetentionPolicyHandler,
  DeleteRetentionPolicyHandler,
];

export const QueryHandlers = [GetRetentionPolicyHandler, ListRetentionPoliciesHandler];
