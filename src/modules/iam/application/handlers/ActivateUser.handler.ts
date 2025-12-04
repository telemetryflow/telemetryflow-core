import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateUserCommand } from '../commands/ActivateUser.command';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly repository: IUserRepository,
  ) {}
  async execute(command: ActivateUserCommand): Promise<void> {
    const user = await this.repository.findById(UserId.create(command.userId));
    if (!user) throw new Error('User not found');
    user.activate();
    await this.repository.save(user);
  }
}
