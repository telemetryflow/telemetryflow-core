import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetRetentionPolicyQuery } from '../queries/GetRetentionPolicy.query';
import {
  IRetentionPolicyRepository,
  RETENTION_POLICY_REPOSITORY,
} from '../../domain/repositories/IRetentionPolicyRepository';
import { RetentionPolicyResponseDto } from '../dto/RetentionPolicyResponse.dto';

@QueryHandler(GetRetentionPolicyQuery)
export class GetRetentionPolicyHandler implements IQueryHandler<GetRetentionPolicyQuery> {
  constructor(
    @Inject(RETENTION_POLICY_REPOSITORY)
    private readonly repository: IRetentionPolicyRepository,
  ) {}

  async execute(query: GetRetentionPolicyQuery): Promise<RetentionPolicyResponseDto> {
    const policy = await this.repository.findById(query.id);
    if (!policy) {
      throw new NotFoundException(`Retention policy with id "${query.id}" not found`);
    }

    // Check organization access - allow global policies
    if (
      query.organizationId &&
      policy.organizationId &&
      policy.organizationId !== query.organizationId
    ) {
      throw new ForbiddenException('Access denied to this retention policy');
    }

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
  }
}
