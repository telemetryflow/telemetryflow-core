import { User } from '../aggregates/User';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
