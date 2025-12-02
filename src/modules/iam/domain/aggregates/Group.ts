import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { GroupId } from '../value-objects/GroupId';
import { UserId } from '../value-objects/UserId';
import { OrganizationId } from '../value-objects/OrganizationId';
import { GroupCreatedEvent } from '../events/GroupCreated.event';
import { GroupUpdatedEvent } from '../events/GroupUpdated.event';
import { UserAddedToGroupEvent } from '../events/UserAddedToGroup.event';
import { UserRemovedFromGroupEvent } from '../events/UserRemovedFromGroup.event';

export class Group extends AggregateRoot<GroupId> {
  private constructor(
    id: GroupId,
    private name: string,
    private description: string,
    private userIds: UserId[],
    private organizationId: OrganizationId | null,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {
    super();
    this._id = id;
  }

  static create(
    name: string,
    description: string,
    organizationId: OrganizationId | null = null,
  ): Group {
    const group = new Group(
      GroupId.create(),
      name,
      description,
      [],
      organizationId,
      new Date(),
      new Date(),
      null,
    );
    group.addDomainEvent(new GroupCreatedEvent(group.id.getValue(), name));
    return group;
  }

  static reconstitute(
    id: GroupId,
    name: string,
    description: string,
    userIds: UserId[],
    organizationId: OrganizationId | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Group {
    return new Group(id, name, description, userIds, organizationId, createdAt, updatedAt, deletedAt);
  }

  update(name?: string, description?: string): void {
    if (name) this.name = name;
    if (description) this.description = description;
    this.updatedAt = new Date();
    this.addDomainEvent(new GroupUpdatedEvent(this.id.getValue(), name, description));
  }

  addUser(userId: UserId): void {
    if (this.hasUser(userId)) {
      throw new Error('User already in group');
    }
    this.userIds.push(userId);
    this.updatedAt = new Date();
    this.addDomainEvent(new UserAddedToGroupEvent(this.id.getValue(), userId.getValue()));
  }

  removeUser(userId: UserId): void {
    if (!this.hasUser(userId)) {
      throw new Error('User not in group');
    }
    this.userIds = this.userIds.filter(u => !u.equals(userId));
    this.updatedAt = new Date();
    this.addDomainEvent(new UserRemovedFromGroupEvent(this.id.getValue(), userId.getValue()));
  }

  hasUser(userId: UserId): boolean {
    return this.userIds.some(u => u.equals(userId));
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  getId(): GroupId { return this.id; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getUserIds(): UserId[] { return [...this.userIds]; }
  getOrganizationId(): OrganizationId | null { return this.organizationId; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getDeletedAt(): Date | null { return this.deletedAt; }
  isDeleted(): boolean { return this.deletedAt !== null; }
}
