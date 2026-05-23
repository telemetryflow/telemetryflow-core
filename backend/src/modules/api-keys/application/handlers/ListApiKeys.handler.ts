import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListApiKeysQuery } from '../queries';
import { ApiKeyResponseDto } from '../dto';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain';

export interface PaginatedApiKeysResponse {
  items: ApiKeyResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@QueryHandler(ListApiKeysQuery)
export class ListApiKeysHandler implements IQueryHandler<ListApiKeysQuery> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  async execute(query: ListApiKeysQuery): Promise<PaginatedApiKeysResponse> {
    const { items, total } = await this.apiKeyRepository.findByOrganization(
      query.organizationId,
      {
        page: query.page,
        pageSize: query.pageSize,
        isActive: query.isActive,
        keyType: query.keyType,
        search: query.search,
      },
    );

    const totalPages = Math.ceil(total / query.pageSize);

    return {
      items: items.map((apiKey) => ApiKeyResponseDto.fromDomain(apiKey)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
    };
  }
}
