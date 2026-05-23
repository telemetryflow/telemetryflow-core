import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeactivateUserCommand } from '../commands/DeactivateUser.command';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly repository: IUserRepository,
  ) {}
  async execute(command: DeactivateUserCommand): Promise<void> {
    const user = await this.repository.findById(UserId.create(command.userId));
    if (!user) throw new NotFoundException('User not found');
    user.deactivate();
    await this.repository.save(user);
  }
}
