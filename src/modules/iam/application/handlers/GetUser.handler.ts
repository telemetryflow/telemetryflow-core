import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery } from '../queries/GetUser.query';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { UserResponseDto } from '../dto/UserResponse.dto';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject('IUserRepository')
    private readonly repository: IUserRepository,
  ) {}
  async execute(query: GetUserQuery): Promise<UserResponseDto> {
    const user = await this.repository.findById(UserId.fromString(query.userId));
    if (!user) throw new Error('User not found');
    return {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      avatar: null, // User aggregate doesn't have avatar
      mfaEnabled: user.getMfaEnabled(),
      isActive: user.getIsActive(),
      emailVerified: user.getEmailVerified(),
      createdAt: user.getCreatedAt(),
    };
  }
}
