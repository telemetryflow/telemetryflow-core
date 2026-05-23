import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RevokeApiKeyCommand } from '../commands';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';

@CommandHandler(RevokeApiKeyCommand)
export class RevokeApiKeyHandler implements ICommandHandler<RevokeApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RevokeApiKeyCommand): Promise<void> {
    const apiKey = await this.apiKeyRepository.findById(command.id);

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    // Verify organization ownership
    if (apiKey.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // System keys cannot be revoked/deleted
    if (apiKey.getIsSystem()) {
      throw new BadRequestException('System API keys cannot be revoked or deleted');
    }

    // Revoke (domain aggregate also checks isSystem)
    apiKey.revoke(command.revokedBy, command.reason);

    await this.apiKeyRepository.save(apiKey);

    // Publish domain events
    for (const event of apiKey.domainEvents) {
      this.eventBus.publish(event);
    }
    apiKey.clearEvents();
  }
}
