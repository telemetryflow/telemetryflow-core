import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AssignPermissionToUserCommand } from '../commands/AssignPermissionToUser.command';
import { IUserPermissionRepository } from '../../domain/repositories/IUserPermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { EventBus } from '@nestjs/cqrs';
import { PermissionDirectlyAssignedEvent } from '../../domain/events/PermissionDirectlyAssigned.event';

@CommandHandler(AssignPermissionToUserCommand)
export class AssignPermissionToUserHandler implements ICommandHandler<AssignPermissionToUserCommand> {
  constructor(
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    private readonly eventBus: EventBus,
  ) {}
  async execute(command: AssignPermissionToUserCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);
    const permissionId = PermissionId.create(command.permissionId);
    await this.userPermissionRepository.assignPermission(userId, permissionId);
    this.eventBus.publish(new PermissionDirectlyAssignedEvent(userId.getValue(), permissionId.getValue()));
  }
}
