import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { RevokeRoleFromUserHandler } from '../RevokeRoleFromUser.handler';
import { RevokeRoleFromUserCommand } from '../../commands/RevokeRoleFromUser.command';
import { IUserRoleRepository } from '../../../domain/repositories/IUserRoleRepository';
import { RoleRevokedEvent } from '../../../domain/events/RoleRevoked.event';

describe('RevokeRoleFromUserHandler', () => {
  let handler: RevokeRoleFromUserHandler;
  let repository: jest.Mocked<IUserRoleRepository>;
  let eventBus: jest.Mocked<EventBus>;
  beforeEach(async () => {
    const mockRepository = {
      hasRole: jest.fn(),
      revokeRole: jest.fn(),
    };
    const mockEventBus = {
      publish: jest.fn(),
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevokeRoleFromUserHandler,
        { provide: 'IUserRoleRepository', useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();
    handler = module.get<RevokeRoleFromUserHandler>(RevokeRoleFromUserHandler);
    repository = module.get('IUserRoleRepository');
    eventBus = module.get(EventBus);
  });
  it('should revoke role successfully', async () => {
    const command = new RevokeRoleFromUserCommand('user-1', 'role-1');
    repository.hasRole.mockResolvedValue(true);
    await handler.execute(command);
    expect(repository.revokeRole).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(RoleRevokedEvent)
    );
  it('should throw NotFoundException if role not assigned', async () => {
    repository.hasRole.mockResolvedValue(false);
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(repository.revokeRole).not.toHaveBeenCalled();
});
