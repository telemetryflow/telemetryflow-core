import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserEntity } from "../../../../iam/infrastructure/persistence/entities/User.entity";

/**
 * SessionEntity - User session tracking
 * Maps to 'user_sessions' table
 *
 * Tracks active user sessions for:
 * - Session management and visibility
 * - Security auditing
 * - Remote session termination
 */
@Entity("user_sessions")
@Index(["user_id"])
@Index(["session_token"])
export class SessionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @Column({ type: "varchar", length: 255, unique: true, name: "session_token" })
  session_token: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "device_name" })
  device_name: string | null;

  @Column({ type: "varchar", length: 50, nullable: true, name: "device_type" })
  device_type: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  browser: string | null;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
    name: "browser_version",
  })
  browser_version: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  os: string | null;

  @Column({ type: "varchar", length: 50, nullable: true, name: "os_version" })
  os_version: string | null;

  @Column({ type: "varchar", length: 45, nullable: true, name: "ip_address" })
  ip_address: string | null;

  @Column({ type: "jsonb", nullable: true })
  location: Record<string, any> | null;

  @Column({ type: "boolean", default: false, name: "remember_me" })
  remember_me: boolean;

  @Column({ type: "boolean", default: false, name: "is_current" })
  is_current: boolean;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    name: "last_activity_at",
  })
  last_activity_at: Date;

  @Column({ type: "timestamp", name: "expires_at" })
  expires_at: Date;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @Column({ type: "timestamp", nullable: true, name: "terminated_at" })
  terminated_at: Date | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    name: "terminated_reason",
  })
  terminated_reason: string | null;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;
}
