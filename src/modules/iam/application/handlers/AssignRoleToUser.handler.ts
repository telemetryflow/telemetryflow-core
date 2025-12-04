import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { AssignRoleToUserCommand } from '../commands/AssignRoleToUser.command';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleAssignedEvent } from '../../domain/events/RoleAssigned.event';
import { CacheService } from '../../../cache/cache.service';
import { LoggerService } from '../../../../logger/logger.service';

@CommandHandler(AssignRoleToUserCommand)
export class AssignRoleToUserHandler implements ICommandHandler<AssignRoleToUserCommand> {
  private readonly context = AssignRoleToUserHandler.name;
  constructor(
    @Inject('IUserRoleRepository')
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly eventBus: EventBus,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}
  async execute(command: AssignRoleToUserCommand): Promise<void> {
    const userId = UserId.create(command.userId);
    const roleId = RoleId.create(command.roleId);
    const hasRole = await this.userRoleRepository.hasRole(userId, roleId);
    if (hasRole) {
      throw new ConflictException('User already has this role');
    }
    await this.userRoleRepository.assignRole(userId, roleId);
    // Invalidate permission cache for this user
    await this.cacheService.del(`rbac:permissions:${command.userId}`);
    this.logger.log(
      `✓ Invalidated permission cache for user ${command.userId} after role assignment`,
      this.context,
    );
    this.eventBus.publish(new RoleAssignedEvent(command.userId, command.roleId));
  }
}
