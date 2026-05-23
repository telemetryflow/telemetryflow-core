import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RotateApiKeyCommand } from '../commands';
import { ApiKeyRotatedResponseDto } from '../dto';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';
import {
  ApiKeyEncryptionService,
  API_KEY_ENCRYPTION_SERVICE,
} from '../../infrastructure/services/ApiKeyEncryption.service';

@CommandHandler(RotateApiKeyCommand)
export class RotateApiKeyHandler implements ICommandHandler<RotateApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
    @Inject(API_KEY_ENCRYPTION_SERVICE)
    private readonly encryptionService: ApiKeyEncryptionService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RotateApiKeyCommand): Promise<ApiKeyRotatedResponseDto> {
    const apiKey = await this.apiKeyRepository.findById(command.id);

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    // Verify organization ownership
    if (apiKey.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Cannot rotate revoked key
    if (!apiKey.getIsActive()) {
      throw new BadRequestException('Cannot rotate a revoked API key');
    }

    // Rotate (generates new secret + encryption key)
    const { rawKeySecret, rawEncryptionKey } = apiKey.rotate(command.rotatedBy);

    // Encrypt the new per-key encryption key before storing
    const encryptedKey = this.encryptionService.encrypt(rawEncryptionKey);
    apiKey.setEncryptKey(encryptedKey);

    await this.apiKeyRepository.save(apiKey);

    // Publish domain events
    for (const event of apiKey.domainEvents) {
      this.eventBus.publish(event);
    }
    apiKey.clearEvents();

    return ApiKeyRotatedResponseDto.fromDomainWithKeys(apiKey, rawKeySecret, rawEncryptionKey);
  }
}
