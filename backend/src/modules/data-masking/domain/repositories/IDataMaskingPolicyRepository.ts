import { DataMaskingPolicy } from "../aggregates/DataMaskingPolicy";

export interface ListPoliciesOptions {
  organizationId: string;
  workspaceId?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ListPoliciesResult {
  data: DataMaskingPolicy[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IDataMaskingPolicyRepository {
  findById(id: string): Promise<DataMaskingPolicy | null>;
  findByOrganization(
    organizationId: string,
    enabled?: boolean,
  ): Promise<DataMaskingPolicy[]>;
  list(options: ListPoliciesOptions): Promise<ListPoliciesResult>;
  save(policy: DataMaskingPolicy): Promise<DataMaskingPolicy>;
  delete(id: string): Promise<void>;
}

export const DATA_MASKING_POLICY_REPOSITORY = Symbol(
  "DATA_MASKING_POLICY_REPOSITORY",
);
