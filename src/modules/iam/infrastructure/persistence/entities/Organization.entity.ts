import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

@Entity('organizations')
@Index(['code'])
@Index(['region_id'])
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  organization_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  domain: string;

  @Column({ name: 'isActive', default: true })
  is_active: boolean;

  @Column({ type: 'uuid' })
  region_id: string;

  @CreateDateColumn({ name: 'createdAt' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deletedAt' })
  deleted_at: Date;
}
