import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ActivateApiKeyCommand } from '../commands';
import { ApiKeyResponseDto } from '../dto';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';

@CommandHandler(ActivateApiKeyCommand)
export class ActivateApiKeyHandler implements ICommandHandler<ActivateApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  async execute(command: ActivateApiKeyCommand): Promise<ApiKeyResponseDto> {
    const apiKey = await this.apiKeyRepository.findById(command.id);

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    // Verify organization ownership
    if (apiKey.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Activate
    apiKey.activate();

    await this.apiKeyRepository.save(apiKey);

    return ApiKeyResponseDto.fromDomain(apiKey);
  }
}
