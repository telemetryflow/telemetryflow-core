import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListPermissionsQuery } from '../queries/ListPermissions.query';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { CacheService } from '@/shared/cache/cache.service';
import { PermissionResponseDto } from '../dto/PermissionResponse.dto';

@QueryHandler(ListPermissionsQuery)
export class ListPermissionsHandler implements IQueryHandler<ListPermissionsQuery> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    private readonly cacheService: CacheService,
  ) {}
  async execute(query: ListPermissionsQuery): Promise<{ data: PermissionResponseDto[]; total: number }> {
    const cacheKey = `iam:permissions:list:${query.resource || 'all'}`;
    return this.cacheService.getOrSet(cacheKey, () => this.fetchPermissions(query), { ttl: 600 });
  }
  private async fetchPermissions(query: ListPermissionsQuery): Promise<{ data: PermissionResponseDto[]; total: number }> {
    const permissions = await this.permissionRepository.findAll();
    const data = permissions
      .filter(p => !query.resource || p.getResource() === query.resource)
      .map(permission => ({
        id: permission.getId().getValue(),
        name: permission.getName(),
        description: permission.getDescription(),
        resource: permission.getResource(),
        action: permission.getAction(),
        createdAt: permission.getCreatedAt(),
        updatedAt: permission.getUpdatedAt(),
      }));
    return { data, total: data.length };
  }
}
