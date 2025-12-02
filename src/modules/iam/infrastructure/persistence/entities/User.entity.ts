import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

/**
 * UserEntity - DDD Migration Entity
 * Maps to legacy 'users' table schema
 * Reference: backend/database/postgres/entities/user.entity.ts
 */
@Entity('users')
@Index(['email', 'deletedAt'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'firstName' })
  firstName: string;

  @Column({ name: 'lastName' })
  lastName: string;

  @Column({ default: true, name: 'isActive' })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  organization_id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  group_user_id: string;

  @Column({ default: 'UTC', length: 50 })
  timezone: string;

  @Column({ default: 'en-US', length: 10 })
  locale: string;

  @Column({ type: 'timestamp', nullable: true, name: 'lastLoginAt' })
  lastLoginAt: Date;

  @Column({ default: 0, name: 'loginCount' })
  loginCount: number;

  @Column({ type: 'jsonb', default: '[]', name: 'passwordHistory' })
  passwordHistory: string[];

  @Column({ type: 'timestamp', nullable: true, name: 'passwordChangedAt' })
  passwordChangedAt: Date;

  @Column({ default: 0, name: 'failedLoginAttempts' })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true, name: 'lockedUntil' })
  lockedUntil: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'lastFailedLoginAt' })
  lastFailedLoginAt: Date;

  @Column({ default: false })
  mfa_enabled: boolean;

  @Column({ nullable: true, length: 255 })
  mfa_secret: string;

  @Column({ type: 'jsonb', nullable: true })
  mfa_backup_codes: string[];

  @Column({ type: 'timestamp', nullable: true })
  mfa_enrolled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  mfa_last_used_at: Date;

  @Column({ default: false })
  force_password_change: boolean;

  @Column({ nullable: true, length: 255 })
  password_change_reason: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt: Date;
}
