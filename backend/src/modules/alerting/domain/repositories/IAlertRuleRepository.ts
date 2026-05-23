import { AlertRule } from "../aggregates/AlertRule";

export const ALERT_RULE_REPOSITORY = Symbol("ALERT_RULE_REPOSITORY");

export interface FindAlertRulesOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
  severity?: string;
  state?: string;
  search?: string;
  /** Filter rules linked to a specific graph registry ID (stored in labels.graphId) */
  graphId?: string;
}

export interface IAlertRuleRepository {
  findById(id: string): Promise<AlertRule | null>;
  findByOrganization(
    organizationId: string,
    options?: FindAlertRulesOptions,
  ): Promise<{ items: AlertRule[]; total: number }>;
  findEnabledByOrganization(organizationId: string): Promise<AlertRule[]>;
  findByWorkspace(workspaceId: string): Promise<AlertRule[]>;
  findOrganizationsWithEnabledRules(): Promise<string[]>;
  save(alertRule: AlertRule): Promise<void>;
  delete(id: string): Promise<void>;
  existsByName(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean>;
}
