import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateApiKeyCommand } from '../commands';
import { ApiKeyCreatedResponseDto } from '../dto';
import { ApiKey, API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';
import {
  ApiKeyEncryptionService,
  API_KEY_ENCRYPTION_SERVICE,
} from '../../infrastructure/services/ApiKeyEncryption.service';

@CommandHandler(CreateApiKeyCommand)
export class CreateApiKeyHandler implements ICommandHandler<CreateApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
    @Inject(API_KEY_ENCRYPTION_SERVICE)
    private readonly encryptionService: ApiKeyEncryptionService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateApiKeyCommand): Promise<ApiKeyCreatedResponseDto> {
    // Check if name already exists in organization
    const existing = await this.apiKeyRepository.findByName(
      command.name,
      command.organizationId,
    );

    if (existing) {
      throw new ConflictException(`API key with name '${command.name}' already exists`);
    }

    // Create the API key (generates 3 keys)
    const { apiKey, rawKeyId, rawKeySecret, rawEncryptionKey } = ApiKey.create({
      name: command.name,
      description: command.description,
      keyType: command.keyType,
      permissions: command.permissions,
      scopes: command.scopes,
      rateLimit: command.rateLimit,
      expiresAt: command.expiresAt,
      organizationId: command.organizationId,
      workspaceId: command.workspaceId,
      tenantId: command.tenantId,
      createdBy: command.createdBy,
    });

    // Encrypt the per-key encryption key before storing
    const encryptedKey = this.encryptionService.encrypt(rawEncryptionKey);
    apiKey.setEncryptKey(encryptedKey);

    // Save
    await this.apiKeyRepository.save(apiKey);

    // Publish domain events
    for (const event of apiKey.domainEvents) {
      this.eventBus.publish(event);
    }
    apiKey.clearEvents();

    return ApiKeyCreatedResponseDto.fromDomainWithKeys(
      apiKey,
      rawKeyId,
      rawKeySecret,
      rawEncryptionKey,
    );
  }
}
