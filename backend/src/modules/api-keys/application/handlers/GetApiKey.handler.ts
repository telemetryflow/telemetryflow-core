import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetApiKeyQuery } from '../queries';
import { ApiKeyResponseDto } from '../dto';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';

@QueryHandler(GetApiKeyQuery)
export class GetApiKeyHandler implements IQueryHandler<GetApiKeyQuery> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  async execute(query: GetApiKeyQuery): Promise<ApiKeyResponseDto> {
    const apiKey = await this.apiKeyRepository.findById(query.id);

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    // Verify organization ownership
    if (apiKey.getOrganizationId() !== query.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    return ApiKeyResponseDto.fromDomain(apiKey);
  }
}
