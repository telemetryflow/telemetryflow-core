import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeactivateApiKeyCommand } from '../commands';
import { ApiKeyResponseDto } from '../dto';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';

@CommandHandler(DeactivateApiKeyCommand)
export class DeactivateApiKeyHandler implements ICommandHandler<DeactivateApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  async execute(command: DeactivateApiKeyCommand): Promise<ApiKeyResponseDto> {
    const apiKey = await this.apiKeyRepository.findById(command.id);

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    // Verify organization ownership
    if (apiKey.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Deactivate
    apiKey.deactivate();

    await this.apiKeyRepository.save(apiKey);

    return ApiKeyResponseDto.fromDomain(apiKey);
  }
}
