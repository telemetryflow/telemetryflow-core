import { Entity, PrimaryColumn } from 'typeorm';

@Entity('role_permissions')
export class RolePermissionEntity {
  @PrimaryColumn('uuid')
  role_id: string;

  @PrimaryColumn('uuid')
  permission_id: string;
}
