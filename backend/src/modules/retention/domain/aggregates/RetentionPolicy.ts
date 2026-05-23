import { AggregateRoot } from '@nestjs/cqrs';
import { RetentionPolicyCreatedEvent } from '../events/RetentionPolicyCreated.event';
import { RetentionPolicyUpdatedEvent } from '../events/RetentionPolicyUpdated.event';
import { RetentionPolicyDeletedEvent } from '../events/RetentionPolicyDeleted.event';

export type DataType =
  | 'metrics'
  | 'logs'
  | 'traces'
  | 'exemplars'
  | 'uptime'
  | 'alerts'
  | 'audit_logs'
  | 'kubernetes_metrics'
  | 'llm_usage_raw'
  | 'network_map_connection_metrics'
  | 'network_map_traffic'
  | 'service_map_metrics'
  | 'signal_correlations'
  | 'vm_metrics';

export interface RetentionPolicyProps {
  id: string;
  name: string;
  description?: string;
  dataType: DataType;
  retentionDays: number;
  archiveEnabled: boolean;
  archiveDestination?: string;
  filters?: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
  lastEnforcedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class RetentionPolicy extends AggregateRoot {
  private props: RetentionPolicyProps;

  private constructor(props: RetentionPolicyProps) {
    super();
    this.props = props;
  }

  static create(props: Omit<RetentionPolicyProps, 'createdAt' | 'updatedAt'>): RetentionPolicy {
    const now = new Date();
    const policy = new RetentionPolicy({
      ...props,
      createdAt: now,
      updatedAt: now,
    });

    policy.apply(
      new RetentionPolicyCreatedEvent(
        props.id,
        props.name,
        props.dataType,
        props.retentionDays,
        props.organizationId,
      ),
    );

    return policy;
  }

  static reconstitute(props: RetentionPolicyProps): RetentionPolicy {
    return new RetentionPolicy(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get dataType(): DataType {
    return this.props.dataType;
  }

  get retentionDays(): number {
    return this.props.retentionDays;
  }

  get archiveEnabled(): boolean {
    return this.props.archiveEnabled;
  }

  get archiveDestination(): string | undefined {
    return this.props.archiveDestination;
  }

  get filters(): Record<string, string> | undefined {
    return this.props.filters;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get organizationId(): string | undefined {
    return this.props.organizationId;
  }

  get lastEnforcedAt(): Date | undefined {
    return this.props.lastEnforcedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  getProps(): RetentionPolicyProps {
    return { ...this.props };
  }

  // Methods
  update(props: Partial<Omit<RetentionPolicyProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    const oldProps = { ...this.props };

    if (props.name !== undefined) this.props.name = props.name;
    if (props.description !== undefined) this.props.description = props.description;
    if (props.retentionDays !== undefined) this.props.retentionDays = props.retentionDays;
    if (props.archiveEnabled !== undefined) this.props.archiveEnabled = props.archiveEnabled;
    if (props.archiveDestination !== undefined)
      this.props.archiveDestination = props.archiveDestination;
    if (props.filters !== undefined) this.props.filters = props.filters;
    if (props.isDefault !== undefined) this.props.isDefault = props.isDefault;
    if (props.isActive !== undefined) this.props.isActive = props.isActive;

    this.props.updatedAt = new Date();

    this.apply(
      new RetentionPolicyUpdatedEvent(
        this.props.id,
        oldProps,
        this.props,
      ),
    );
  }

  activate(): void {
    if (!this.props.isActive) {
      this.props.isActive = true;
      this.props.updatedAt = new Date();
    }
  }

  deactivate(): void {
    if (this.props.isActive) {
      this.props.isActive = false;
      this.props.updatedAt = new Date();
    }
  }

  markEnforced(): void {
    this.props.lastEnforcedAt = new Date();
    this.props.updatedAt = new Date();
  }

  delete(): void {
    this.apply(
      new RetentionPolicyDeletedEvent(
        this.props.id,
        this.props.name,
        this.props.dataType,
        this.props.organizationId,
      ),
    );
  }

  // Calculate cutoff date for data deletion
  getCutoffDate(): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.props.retentionDays);
    return cutoff;
  }

  // Validate policy
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.props.retentionDays < 1) {
      errors.push('Retention days must be at least 1');
    }

    if (this.props.retentionDays > 3650) {
      errors.push('Retention days cannot exceed 10 years (3650 days)');
    }

    if (this.props.archiveEnabled && !this.props.archiveDestination) {
      errors.push('Archive destination is required when archive is enabled');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
