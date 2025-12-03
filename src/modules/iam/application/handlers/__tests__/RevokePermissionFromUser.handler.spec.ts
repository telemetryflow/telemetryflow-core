import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { RevokePermissionFromUserHandler } from '../RevokePermissionFromUser.handler';
import { RevokePermissionFromUserCommand } from '../../commands/RevokePermissionFromUser.command';
import { IUserPermissionRepository } from '../../../domain/repositories/IUserPermissionRepository';
import { PermissionDirectlyRevokedEvent } from '../../../domain/events/PermissionDirectlyRevoked.event';

describe('RevokePermissionFromUserHandler', () => {
  let handler: RevokePermissionFromUserHandler;
  let repository: jest.Mocked<IUserPermissionRepository>;
  let eventBus: jest.Mocked<EventBus>;
  beforeEach(async () => {
    const mockRepository = {
      revokePermission: jest.fn(),
    };
    const mockEventBus = {
      publish: jest.fn(),
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevokePermissionFromUserHandler,
        { provide: 'IUserPermissionRepository', useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();
    handler = module.get<RevokePermissionFromUserHandler>(RevokePermissionFromUserHandler);
    repository = module.get('IUserPermissionRepository');
    eventBus = module.get(EventBus);
  });
  it('should revoke permission successfully', async () => {
    const command = new RevokePermissionFromUserCommand('user-1', 'perm-1');
    await handler.execute(command);
    expect(repository.revokePermission).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(PermissionDirectlyRevokedEvent)
    );
});
