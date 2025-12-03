import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { AssignPermissionToUserHandler } from '../AssignPermissionToUser.handler';
import { AssignPermissionToUserCommand } from '../../commands/AssignPermissionToUser.command';
import { IUserPermissionRepository } from '../../../domain/repositories/IUserPermissionRepository';
import { PermissionDirectlyAssignedEvent } from '../../../domain/events/PermissionDirectlyAssigned.event';

describe('AssignPermissionToUserHandler', () => {
  let handler: AssignPermissionToUserHandler;
  let repository: jest.Mocked<IUserPermissionRepository>;
  let eventBus: jest.Mocked<EventBus>;
  beforeEach(async () => {
    const mockRepository = {
      assignPermission: jest.fn(),
    };
    const mockEventBus = {
      publish: jest.fn(),
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignPermissionToUserHandler,
        { provide: 'IUserPermissionRepository', useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();
    handler = module.get<AssignPermissionToUserHandler>(AssignPermissionToUserHandler);
    repository = module.get('IUserPermissionRepository');
    eventBus = module.get(EventBus);
  });
  it('should assign permission successfully', async () => {
    const command = new AssignPermissionToUserCommand('user-1', 'perm-1');
    await handler.execute(command);
    expect(repository.assignPermission).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(PermissionDirectlyAssignedEvent)
    );
});
