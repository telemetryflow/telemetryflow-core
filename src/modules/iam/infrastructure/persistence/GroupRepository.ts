import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { Group } from '../../domain/aggregates/Group';
import { GroupId } from '../../domain/value-objects/GroupId';
import { GroupEntity } from './entities/GroupEntity';
import { GroupMapper } from './GroupMapper';

@Injectable()
export class GroupRepository implements IGroupRepository {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repository: Repository<GroupEntity>,
  ) {}

  async save(group: Group): Promise<void> {
    const entity = GroupMapper.toEntity(group);
    await this.repository.save(entity);
  }

  async findById(id: GroupId): Promise<Group | null> {
    const entity = await this.repository.findOne({
      where: { id: id.getValue(), deletedAt: null },
    });
    return entity ? GroupMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Group[]> {
    const entities = await this.repository.find({
      where: { deletedAt: null },
    });
    return entities.map(GroupMapper.toDomain);
  }

  async delete(id: GroupId): Promise<void> {
    await this.repository.softDelete(id.getValue());
  }
}
