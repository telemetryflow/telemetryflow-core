import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('user_roles')
export class UserRoleEntity {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @PrimaryColumn({ type: 'uuid' })
  role_id: string;
}
