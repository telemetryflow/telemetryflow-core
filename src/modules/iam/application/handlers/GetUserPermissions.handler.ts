import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserPermissionsQuery } from '../queries/GetUserPermissions.query';
import { IUserPermissionRepository } from '../../domain/repositories/IUserPermissionRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { PermissionResponseDto } from '../dto/PermissionResponse.dto';

@QueryHandler(GetUserPermissionsQuery)
export class GetUserPermissionsHandler implements IQueryHandler<GetUserPermissionsQuery> {
  constructor(
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(query: GetUserPermissionsQuery): Promise<PermissionResponseDto[]> {
    const userId = UserId.fromString(query.userId);
    const permissionIds = await this.userPermissionRepository.getUserPermissions(userId);
    const permissions = await Promise.all(
      permissionIds.map(id => this.permissionRepository.findById(id))
    );
    return permissions.filter(p => p !== null).map(p => ({
      id: p.getId().getValue(),
      name: p.getName(),
      description: p.getDescription(),
      resource: p.getResource(),
      action: p.getAction(),
      createdAt: p.getCreatedAt(),
      updatedAt: p.getUpdatedAt(),
    }));
  }
}
