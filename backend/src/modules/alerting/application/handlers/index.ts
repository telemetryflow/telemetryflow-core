// Command Handlers
export * from './CreateAlertRule.handler';
export * from './UpdateAlertRule.handler';
export * from './DeleteAlertRule.handler';
export * from './ToggleAlertRule.handler';
export * from './AcknowledgeAlert.handler';
export * from './ResolveAlert.handler';
export * from './SilenceAlert.handler';

// Query Handlers
export * from './GetAlertRule.handler';
export * from './ListAlertRules.handler';
export * from './GetAlertInstance.handler';
export * from './ListAlertInstances.handler';
export * from './GetAlertStats.handler';

import { CreateAlertRuleHandler } from './CreateAlertRule.handler';
import { UpdateAlertRuleHandler } from './UpdateAlertRule.handler';
import { DeleteAlertRuleHandler } from './DeleteAlertRule.handler';
import { EnableAlertRuleHandler, DisableAlertRuleHandler } from './ToggleAlertRule.handler';
import { AcknowledgeAlertHandler } from './AcknowledgeAlert.handler';
import { ResolveAlertHandler } from './ResolveAlert.handler';
import { SilenceAlertHandler } from './SilenceAlert.handler';
import { GetAlertRuleHandler } from './GetAlertRule.handler';
import { ListAlertRulesHandler } from './ListAlertRules.handler';
import { GetAlertInstanceHandler } from './GetAlertInstance.handler';
import { ListAlertInstancesHandler } from './ListAlertInstances.handler';
import { GetAlertStatsHandler } from './GetAlertStats.handler';

export const CommandHandlers = [
  CreateAlertRuleHandler,
  UpdateAlertRuleHandler,
  DeleteAlertRuleHandler,
  EnableAlertRuleHandler,
  DisableAlertRuleHandler,
  AcknowledgeAlertHandler,
  ResolveAlertHandler,
  SilenceAlertHandler,
];

export const QueryHandlers = [
  GetAlertRuleHandler,
  ListAlertRulesHandler,
  GetAlertInstanceHandler,
  ListAlertInstancesHandler,
  GetAlertStatsHandler,
];
