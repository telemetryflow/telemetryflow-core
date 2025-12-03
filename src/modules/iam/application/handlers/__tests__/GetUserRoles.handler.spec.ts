import { Test, TestingModule } from '@nestjs/testing';
import { GetUserRolesHandler } from '../GetUserRoles.handler';
import { GetUserRolesQuery } from '../../queries/GetUserRoles.query';
import { IUserRoleRepository } from '../../../domain/repositories/IUserRoleRepository';
import { IRoleRepository } from '../../../domain/repositories/IRoleRepository';
import { Role } from '../../../domain/aggregates/Role';
import { RoleId } from '../../../domain/value-objects/RoleId';

describe('GetUserRolesHandler', () => {
  let handler: GetUserRolesHandler;
  let userRoleRepository: jest.Mocked<IUserRoleRepository>;
  let roleRepository: jest.Mocked<IRoleRepository>;
  beforeEach(async () => {
    const mockUserRoleRepository = {
      getUserRoles: jest.fn(),
    };
    const mockRoleRepository = {
      findById: jest.fn(),
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserRolesHandler,
        { provide: 'IUserRoleRepository', useValue: mockUserRoleRepository },
        { provide: 'IRoleRepository', useValue: mockRoleRepository },
      ],
    }).compile();
    handler = module.get<GetUserRolesHandler>(GetUserRolesHandler);
    userRoleRepository = module.get('IUserRoleRepository');
    roleRepository = module.get('IRoleRepository');
  });
  it('should return user roles', async () => {
    const query = new GetUserRolesQuery('user-1');
    const roleId = RoleId.create('role-1');
    
    const mockRole = {
      getId: () => roleId,
      getName: () => 'Admin',
      getDescription: () => 'Admin role',
      getPermissions: () => [],
      getTenantId: () => null,
      getIsSystem: () => true,
      getCreatedAt: () => new Date(),
      getUpdatedAt: () => new Date(),
    } as Role;
    userRoleRepository.getUserRoles.mockResolvedValue([roleId]);
    roleRepository.findById.mockResolvedValue(mockRole);
    const result = await handler.execute(query);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Admin');
});
