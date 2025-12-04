import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetPermissionQuery } from '../queries/GetPermission.query';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { PermissionResponseDto } from '../dto/PermissionResponse.dto';

@QueryHandler(GetPermissionQuery)
export class GetPermissionHandler implements IQueryHandler<GetPermissionQuery> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(query: GetPermissionQuery): Promise<PermissionResponseDto> {
    const permissionId = PermissionId.create(query.id);
    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return {
      id: permission.getId().getValue(),
      name: permission.getName(),
      description: permission.getDescription(),
      resource: permission.getResource(),
      action: permission.getAction(),
      createdAt: permission.getCreatedAt(),
      updatedAt: permission.getUpdatedAt(),
    };
  }
}
