import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

@Entity('workspaces')
@Index(['organization_id'])
export class WorkspaceEntity {
  @PrimaryColumn('uuid')
  workspace_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  datasource_config: Record<string, any>;

  @Column({ type: 'uuid' })
  organization_id: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt: Date;
}
