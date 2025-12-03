import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListUsersQuery } from '../queries/ListUsers.query';
import { UserEntity } from '../../infrastructure/persistence/entities/User.entity';
import { UserResponseDto } from '../dto/UserResponse.dto';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}
  async execute(query: ListUsersQuery): Promise<UserResponseDto[]> {
    const qb = this.repo.createQueryBuilder('user').where('user.deletedAt IS NULL');
    if (query.email) qb.andWhere('user.email = :email', { email: query.email });
    const users = await qb.getMany();
    return users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      mfaEnabled: u.mfa_enabled,
      isActive: u.isActive,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    }));
  }
}
