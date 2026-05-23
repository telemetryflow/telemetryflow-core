import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UpdateRetentionPolicyCommand } from '../commands/UpdateRetentionPolicy.command';
import {
  IRetentionPolicyRepository,
  RETENTION_POLICY_REPOSITORY,
} from '../../domain/repositories/IRetentionPolicyRepository';

@CommandHandler(UpdateRetentionPolicyCommand)
export class UpdateRetentionPolicyHandler implements ICommandHandler<UpdateRetentionPolicyCommand> {
  constructor(
    @Inject(RETENTION_POLICY_REPOSITORY)
    private readonly repository: IRetentionPolicyRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateRetentionPolicyCommand): Promise<void> {
    const policy = await this.repository.findById(command.id);
    if (!policy) {
      throw new NotFoundException(`Retention policy with id "${command.id}" not found`);
    }

    // Check organization access
    if (command.organizationId && policy.organizationId !== command.organizationId) {
      // Allow if policy is a global default (no org) - read only
      if (policy.organizationId === undefined) {
        throw new ForbiddenException('Cannot modify global default policies');
      }
      throw new ForbiddenException('Access denied to this retention policy');
    }

    // Don't allow modifying default policies
    if (policy.isDefault) {
      throw new ForbiddenException('Cannot modify default retention policies');
    }

    // Update the policy
    policy.update({
      name: command.name,
      description: command.description,
      retentionDays: command.retentionDays,
      archiveEnabled: command.archiveEnabled,
      archiveDestination: command.archiveDestination,
      filters: command.filters,
      isActive: command.isActive,
    });

    // Validate the policy
    const validation = policy.validate();
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    // Save and publish events
    const policyWithPublisher = this.publisher.mergeObjectContext(policy);
    await this.repository.save(policyWithPublisher);
    policyWithPublisher.commit();
  }
}
