import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ChangePasswordCommand } from '../commands/ChangePassword.command';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import * as argon2 from 'argon2';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly repository: IUserRepository,
  ) {}
  async execute(command: ChangePasswordCommand): Promise<void> {
    const user = await this.repository.findById(UserId.fromString(command.userId));
    if (!user) throw new NotFoundException('User not found');
    const hashedPassword = await argon2.hash(command.newPassword);
    user.changePassword(hashedPassword);
    await this.repository.save(user);
  }
}
