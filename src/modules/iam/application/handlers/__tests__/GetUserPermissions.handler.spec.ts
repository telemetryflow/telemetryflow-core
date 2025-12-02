import { Test, TestingModule } from '@nestjs/testing';
import { GetUserPermissionsHandler } from '../GetUserPermissions.handler';
import { GetUserPermissionsQuery } from '../../queries/GetUserPermissions.query';
import { IUserPermissionRepository } from '../../../domain/repositories/IUserPermissionRepository';
import { IPermissionRepository } from '../../../domain/repositories/IPermissionRepository';
import { PermissionId } from '../../../domain/value-objects/PermissionId';

describe('GetUserPermissionsHandler', () => {
  let handler: GetUserPermissionsHandler;
  let userPermissionRepository: jest.Mocked<IUserPermissionRepository>;
  let permissionRepository: jest.Mocked<IPermissionRepository>;

  beforeEach(async () => {
    const mockUserPermissionRepository = {
      getUserPermissions: jest.fn(),
    };

    const mockPermissionRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPermissionsHandler,
        { provide: 'IUserPermissionRepository', useValue: mockUserPermissionRepository },
        { provide: 'IPermissionRepository', useValue: mockPermissionRepository },
      ],
    }).compile();

    handler = module.get<GetUserPermissionsHandler>(GetUserPermissionsHandler);
    userPermissionRepository = module.get('IUserPermissionRepository');
    permissionRepository = module.get('IPermissionRepository');
  });

  it('should return user permissions', async () => {
    const query = new GetUserPermissionsQuery('user-1');
    const permissionId = PermissionId.create('perm-1');
    
    const mockPermission = {
      id: permissionId,
      name: 'read:users',
      description: 'Read users',
      resource: 'users',
      action: 'read',
    };

    userPermissionRepository.getUserPermissions.mockResolvedValue([permissionId]);
    permissionRepository.findById.mockResolvedValue(mockPermission as any);

    const result = await handler.execute(query);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('read:users');
  });
});
