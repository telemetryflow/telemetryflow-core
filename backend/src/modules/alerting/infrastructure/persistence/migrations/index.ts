import { MigrationInterface } from "typeorm";
import { CreateAlertingTables1710000000001 } from "./1710000000001-CreateAlertingTables";
import { AddTfqlToAlertRules1710000000010 } from "./1710000000010-AddTfqlToAlertRules";
import { AddIsDefaultToNotificationChannels1710000000011 } from "./1710000000011-AddIsDefaultToNotificationChannels";
import { ExtendAlertRulesQueryTarget1710000000012 } from "./1710000000012-ExtendAlertRulesQueryTarget";

export const AlertingMigrations: (new () => MigrationInterface)[] = [
  CreateAlertingTables1710000000001,
  AddTfqlToAlertRules1710000000010,
  AddIsDefaultToNotificationChannels1710000000011,
  ExtendAlertRulesQueryTarget1710000000012,
];

export {
  CreateAlertingTables1710000000001,
  AddTfqlToAlertRules1710000000010,
  AddIsDefaultToNotificationChannels1710000000011,
  ExtendAlertRulesQueryTarget1710000000012,
};
