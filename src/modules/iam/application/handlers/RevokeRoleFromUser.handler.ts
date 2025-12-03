import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RevokeRoleFromUserCommand } from '../commands/RevokeRoleFromUser.command';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleRevokedEvent } from '../../domain/events/RoleRevoked.event';
import { CacheService } from '../../../cache/cache.service';
import { LoggerService } from '../../../../logger/logger.service';

@CommandHandler(RevokeRoleFromUserCommand)
export class RevokeRoleFromUserHandler implements ICommandHandler<RevokeRoleFromUserCommand> {
  private readonly context = RevokeRoleFromUserHandler.name;
  constructor(
    @Inject('IUserRoleRepository')
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly eventBus: EventBus,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}
  async execute(command: RevokeRoleFromUserCommand): Promise<void> {
    const userId = UserId.create(command.userId);
    const roleId = RoleId.create(command.roleId);
    const hasRole = await this.userRoleRepository.hasRole(userId, roleId);
    if (!hasRole) {
      throw new NotFoundException('User does not have this role');
    }
    await this.userRoleRepository.revokeRole(userId, roleId);
    // Invalidate permission cache for this user
    await this.cacheService.del(`rbac:permissions:${command.userId}`);
    this.logger.log(
      `✓ Invalidated permission cache for user ${command.userId} after role revocation`,
      this.context,
    );
    this.eventBus.publish(new RoleRevokedEvent(command.userId, command.roleId));
  }
}
