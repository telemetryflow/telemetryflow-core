import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetRoleUsersQuery } from '../queries/GetRoleUsers.query';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';

@QueryHandler(GetRoleUsersQuery)
export class GetRoleUsersHandler implements IQueryHandler<GetRoleUsersQuery> {
  constructor(
    @Inject('IUserRoleRepository')
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}
  async execute(query: GetRoleUsersQuery): Promise<string[]> {
    const roleId = RoleId.create(query.roleId);
    const userIds = await this.userRoleRepository.getRoleUsers(roleId);
    return userIds.map(userId => userId.getValue());
  }
}
