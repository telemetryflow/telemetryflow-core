import {
  AlertInstance,
  AlertInstanceStatus,
} from "../aggregates/AlertInstance";

export const ALERT_INSTANCE_REPOSITORY = Symbol("ALERT_INSTANCE_REPOSITORY");

export interface FindAlertInstancesOptions {
  page?: number;
  pageSize?: number;
  status?: AlertInstanceStatus | AlertInstanceStatus[];
  severity?: string;
  alertRuleId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IAlertInstanceRepository {
  findById(id: string): Promise<AlertInstance | null>;
  findByFingerprint(fingerprint: string): Promise<AlertInstance | null>;
  findActiveByAlertRule(alertRuleId: string): Promise<AlertInstance[]>;
  findByOrganization(
    organizationId: string,
    options?: FindAlertInstancesOptions,
  ): Promise<{ items: AlertInstance[]; total: number }>;
  findActiveByOrganization(organizationId: string): Promise<AlertInstance[]>;
  findByOrganizationAndDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AlertInstance[]>;
  save(alertInstance: AlertInstance): Promise<void>;
  delete(id: string): Promise<void>;
  countByStatus(
    organizationId: string,
  ): Promise<Record<AlertInstanceStatus, number>>;
}
