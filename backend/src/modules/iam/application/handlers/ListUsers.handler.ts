import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListUsersQuery } from '../queries/ListUsers.query';
import { UserEntity } from '../../infrastructure/persistence/entities/User.entity';
import { UserResponseDto } from '../dto/UserResponse.dto';

export interface ListUsersResult {
  data: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async execute(query: ListUsersQuery): Promise<ListUsersResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const offset = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('user').where('user.deletedAt IS NULL');

    if (query.email) {
      qb.andWhere('user.email = :email', { email: query.email });
    }
    if (query.organizationId) {
      qb.andWhere('user.organization_id = :organizationId', { organizationId: query.organizationId });
    }
    if (query.tenantId) {
      qb.andWhere('user.tenant_id = :tenantId', { tenantId: query.tenantId });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }
    if (query.search) {
      qb.andWhere(
        '(LOWER(user.email) LIKE :search OR LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(offset).take(limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        avatar: u.avatar,
        mfaEnabled: u.mfa_enabled,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        organizationId: u.organization_id ?? undefined,
        tenantId: u.tenant_id ?? undefined,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
