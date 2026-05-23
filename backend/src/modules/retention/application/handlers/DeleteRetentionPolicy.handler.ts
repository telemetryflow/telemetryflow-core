import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteRetentionPolicyCommand } from '../commands/DeleteRetentionPolicy.command';
import {
  IRetentionPolicyRepository,
  RETENTION_POLICY_REPOSITORY,
} from '../../domain/repositories/IRetentionPolicyRepository';

@CommandHandler(DeleteRetentionPolicyCommand)
export class DeleteRetentionPolicyHandler implements ICommandHandler<DeleteRetentionPolicyCommand> {
  constructor(
    @Inject(RETENTION_POLICY_REPOSITORY)
    private readonly repository: IRetentionPolicyRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: DeleteRetentionPolicyCommand): Promise<void> {
    const policy = await this.repository.findById(command.id);
    if (!policy) {
      throw new NotFoundException(`Retention policy with id "${command.id}" not found`);
    }

    // Check organization access
    if (command.organizationId && policy.organizationId !== command.organizationId) {
      throw new ForbiddenException('Access denied to this retention policy');
    }

    // Don't allow deleting default policies
    if (policy.isDefault) {
      throw new ForbiddenException('Cannot delete default retention policies');
    }

    // Delete and publish events
    const policyWithPublisher = this.publisher.mergeObjectContext(policy);
    policyWithPublisher.delete();
    await this.repository.delete(command.id);
    policyWithPublisher.commit();
  }
}
