import { Group } from '../aggregates/Group';
import { GroupId } from '../value-objects/GroupId';

export interface IGroupRepository {
  save(group: Group): Promise<void>;
  findById(id: GroupId): Promise<Group | null>;
  findAll(): Promise<Group[]>;
  delete(id: GroupId): Promise<void>;
}
