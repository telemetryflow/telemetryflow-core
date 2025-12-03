import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { AssignRoleToUserHandler } from '../AssignRoleToUser.handler';
import { AssignRoleToUserCommand } from '../../commands/AssignRoleToUser.command';
import { IUserRoleRepository } from '../../../domain/repositories/IUserRoleRepository';
import { RoleAssignedEvent } from '../../../domain/events/RoleAssigned.event';

describe('AssignRoleToUserHandler', () => {
  let handler: AssignRoleToUserHandler;
  let repository: jest.Mocked<IUserRoleRepository>;
  let eventBus: jest.Mocked<EventBus>;
  beforeEach(async () => {
    const mockRepository = {
      hasRole: jest.fn(),
      assignRole: jest.fn(),
    };
    const mockEventBus = {
      publish: jest.fn(),
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignRoleToUserHandler,
        { provide: 'IUserRoleRepository', useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();
    handler = module.get<AssignRoleToUserHandler>(AssignRoleToUserHandler);
    repository = module.get('IUserRoleRepository');
    eventBus = module.get(EventBus);
  });
  it('should assign role successfully', async () => {
    const command = new AssignRoleToUserCommand('user-1', 'role-1');
    repository.hasRole.mockResolvedValue(false);
    await handler.execute(command);
    expect(repository.assignRole).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(RoleAssignedEvent)
    );
  it('should throw ConflictException if role already assigned', async () => {
    repository.hasRole.mockResolvedValue(true);
    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(repository.assignRole).not.toHaveBeenCalled();
});
