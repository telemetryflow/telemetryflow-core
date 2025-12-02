import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/aggregates/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { UserEntity } from './entities/User.entity';
import { UserMapper } from './UserMapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { email: email.value } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const entity = UserMapper.toEntity(user);
    await this.repo.save(entity);
  }

  async delete(id: UserId): Promise<void> {
    await this.repo.softDelete(id.value);
  }
}
