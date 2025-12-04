import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from '../commands/CreateUser.command';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/aggregates/User';
import { Email } from '../../domain/value-objects/Email';
import { UserProfile } from '../../domain/entities/UserProfile';
import * as bcrypt from 'bcrypt';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly repository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}
  async execute(command: CreateUserCommand): Promise<string> {
    const email = Email.create(command.email);
    const passwordHash = await bcrypt.hash(command.password, 10);
    const user = User.create(
      email,
      passwordHash,
      command.firstName,
      command.lastName,
      null, // tenantId
      null  // organizationId
    );
    await this.repository.save(user);
    user.domainEvents.forEach(event => this.eventBus.publish(event));
    return user.getId().getValue();
  }
}
