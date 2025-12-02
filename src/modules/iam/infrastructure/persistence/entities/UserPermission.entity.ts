import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('user_permissions')
export class UserPermissionEntity {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn('uuid')
  permission_id: string;

  @CreateDateColumn()
  created_at: Date;
}
