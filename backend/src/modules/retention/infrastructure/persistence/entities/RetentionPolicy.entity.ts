import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('retention_policies')
@Index(['organizationId', 'dataType'])
@Index(['dataType', 'isActive'])
export class RetentionPolicyEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'data_type',
    type: 'varchar',
    length: 50,
  })
  dataType: string;

  @Column({ name: 'retention_days', type: 'integer' })
  retentionDays: number;

  @Column({ name: 'archive_enabled', type: 'boolean', default: false })
  archiveEnabled: boolean;

  @Column({ name: 'archive_destination', type: 'varchar', length: 500, nullable: true })
  archiveDestination: string | null;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, string> | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  @Index()
  organizationId: string | null;

  @Column({ name: 'last_enforced_at', type: 'timestamp with time zone', nullable: true })
  lastEnforcedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
