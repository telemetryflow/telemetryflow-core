import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateRetentionPolicyCommand } from '../commands/CreateRetentionPolicy.command';
import { RetentionPolicy } from '../../domain/aggregates/RetentionPolicy';
import {
  IRetentionPolicyRepository,
  RETENTION_POLICY_REPOSITORY,
} from '../../domain/repositories/IRetentionPolicyRepository';

@CommandHandler(CreateRetentionPolicyCommand)
export class CreateRetentionPolicyHandler implements ICommandHandler<CreateRetentionPolicyCommand> {
  constructor(
    @Inject(RETENTION_POLICY_REPOSITORY)
    private readonly repository: IRetentionPolicyRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateRetentionPolicyCommand): Promise<string> {
    // Check for duplicate name
    const exists = await this.repository.existsByNameAndOrganization(
      command.name,
      command.organizationId,
    );
    if (exists) {
      throw new ConflictException(`Retention policy with name "${command.name}" already exists`);
    }

    // Create the policy
    const policy = RetentionPolicy.create({
      id: uuidv4(),
      name: command.name,
      description: command.description,
      dataType: command.dataType,
      retentionDays: command.retentionDays,
      archiveEnabled: command.archiveEnabled || false,
      archiveDestination: command.archiveDestination,
      filters: command.filters,
      isDefault: false,
      isActive: true,
      organizationId: command.organizationId,
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

    return policy.id;
  }
}
