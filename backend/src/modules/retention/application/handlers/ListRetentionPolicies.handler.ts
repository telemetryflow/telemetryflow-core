import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRetentionPoliciesQuery } from '../queries/ListRetentionPolicies.query';
import {
  IRetentionPolicyRepository,
  RETENTION_POLICY_REPOSITORY,
} from '../../domain/repositories/IRetentionPolicyRepository';
import { RetentionPolicyResponseDto } from '../dto/RetentionPolicyResponse.dto';

@QueryHandler(ListRetentionPoliciesQuery)
export class ListRetentionPoliciesHandler implements IQueryHandler<ListRetentionPoliciesQuery> {
  constructor(
    @Inject(RETENTION_POLICY_REPOSITORY)
    private readonly repository: IRetentionPolicyRepository,
  ) {}

  async execute(query: ListRetentionPoliciesQuery): Promise<RetentionPolicyResponseDto[]> {
    let policies;

    if (query.dataType) {
      policies = await this.repository.findByDataType(query.dataType, query.organizationId);
    } else if (query.organizationId) {
      policies = await this.repository.findAll(query.organizationId);
    } else {
      policies = await this.repository.findDefaultPolicies();
    }

    // Filter out defaults if requested
    if (query.includeDefaults === false) {
      policies = policies.filter((p) => !p.isDefault);
    }

    return policies.map((policy) => {
      const props = policy.getProps();
      return {
        id: props.id,
        name: props.name,
        description: props.description,
        dataType: props.dataType,
        retentionDays: props.retentionDays,
        archiveEnabled: props.archiveEnabled,
        archiveDestination: props.archiveDestination,
        filters: props.filters,
        isDefault: props.isDefault,
        isActive: props.isActive,
        organizationId: props.organizationId,
        lastEnforcedAt: props.lastEnforcedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      };
    });
  }
}
