/**
 * DataMaskingPolicy Aggregate
 *
 * Root aggregate for a PII masking policy scoped to an organization
 * (and optionally a workspace). Contains an ordered list of MaskingRules
 * which are applied sequentially in priority order during log ingestion.
 */

import { MaskingRule, MaskingRuleProps } from "../value-objects/MaskingRule";

export interface DataMaskingPolicyProps {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules: MaskingRuleProps[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DataMaskingPolicy {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string | undefined;
  readonly name: string;
  readonly description: string | undefined;
  readonly enabled: boolean;
  readonly rules: MaskingRule[];
  readonly createdBy: string;
  readonly updatedBy: string | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: DataMaskingPolicyProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
    this.description = props.description;
    this.enabled = props.enabled;
    this.rules = (props.rules ?? [])
      .map((r) => new MaskingRule(r))
      .sort((a, b) => a.priority - b.priority);
    this.createdBy = props.createdBy;
    this.updatedBy = props.updatedBy;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Returns only active (enabled) rules sorted by priority ascending */
  get activeRules(): MaskingRule[] {
    return this.rules.filter((r) => r.enabled);
  }

  /** Whether the policy has at least one active rule */
  get hasActiveRules(): boolean {
    return this.activeRules.length > 0;
  }
}
