import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RevokePermissionFromUserCommand } from '../commands/RevokePermissionFromUser.command';
import { IUserPermissionRepository } from '../../domain/repositories/IUserPermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { EventBus } from '@nestjs/cqrs';
import { PermissionDirectlyRevokedEvent } from '../../domain/events/PermissionDirectlyRevoked.event';

@CommandHandler(RevokePermissionFromUserCommand)
export class RevokePermissionFromUserHandler implements ICommandHandler<RevokePermissionFromUserCommand> {
  constructor(
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    private readonly eventBus: EventBus,
  ) {}
  async execute(command: RevokePermissionFromUserCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);
    const permissionId = PermissionId.create(command.permissionId);
    await this.userPermissionRepository.revokePermission(userId, permissionId);
    this.eventBus.publish(new PermissionDirectlyRevokedEvent(userId.getValue(), permissionId.getValue()));
  }
}
