import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateUserCommand } from '../commands/UpdateUser.command';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly repository: IUserRepository,
  ) {}
  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.repository.findById(UserId.create(command.userId));
    if (!user) throw new Error('User not found');
    // Update user profile using aggregate methods
    user.updateProfile(command.firstName, command.lastName);
    await this.repository.save(user);
  }
}
