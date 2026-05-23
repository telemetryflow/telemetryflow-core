import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateApiKeyCommand } from '../commands';
import { ApiKeyResponseDto } from '../dto';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';

@CommandHandler(UpdateApiKeyCommand)
export class UpdateApiKeyHandler implements ICommandHandler<UpdateApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  async execute(command: UpdateApiKeyCommand): Promise<ApiKeyResponseDto> {
    const apiKey = await this.apiKeyRepository.findById(command.id);

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    // Verify organization ownership
    if (apiKey.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Update
    apiKey.update({
      name: command.name,
      description: command.description,
      permissions: command.permissions,
      scopes: command.scopes,
      rateLimit: command.rateLimit,
      expiresAt: command.expiresAt,
    });

    await this.apiKeyRepository.save(apiKey);

    return ApiKeyResponseDto.fromDomain(apiKey);
  }
}
