import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListPermissionsQuery } from '../queries/ListPermissions.query';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { PermissionResponseDto } from '../dto/PermissionResponse.dto';

@QueryHandler(ListPermissionsQuery)
export class ListPermissionsHandler implements IQueryHandler<ListPermissionsQuery> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(query: ListPermissionsQuery): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.findAll();
    return permissions
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
  }
}
