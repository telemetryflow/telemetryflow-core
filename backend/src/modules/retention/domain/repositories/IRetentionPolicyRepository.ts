import { RetentionPolicy, DataType } from '../aggregates/RetentionPolicy';

export interface IRetentionPolicyRepository {
  save(policy: RetentionPolicy): Promise<void>;
  findById(id: string): Promise<RetentionPolicy | null>;
  findByOrganizationId(organizationId: string): Promise<RetentionPolicy[]>;
  findByDataType(dataType: DataType, organizationId?: string): Promise<RetentionPolicy[]>;
  findDefaultPolicies(): Promise<RetentionPolicy[]>;
  findActivePolicies(): Promise<RetentionPolicy[]>;
  findAll(organizationId?: string): Promise<RetentionPolicy[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByNameAndOrganization(name: string, organizationId?: string): Promise<boolean>;
}

export const RETENTION_POLICY_REPOSITORY = Symbol('IRetentionPolicyRepository');
