import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

@Entity('tenants')
@Index(['workspace_id'])
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  tenant_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  domain: string;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt: Date;
}
