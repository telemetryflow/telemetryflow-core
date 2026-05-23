import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserEntity } from "../../../../iam/infrastructure/persistence/entities/User.entity";

/**
 * DeviceEntity - Known device tracking
 * Maps to 'known_devices' table
 *
 * Stores known/trusted devices for:
 * - Device fingerprinting and recognition
 * - New device login alerts
 * - Skip MFA on trusted devices
 * - Security auditing
 */
@Entity("known_devices")
@Index(["user_id"])
@Index(["device_fingerprint"])
@Index(["user_id", "device_fingerprint"], { unique: true })
export class DeviceEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @Column({ type: "varchar", length: 255, name: "device_fingerprint" })
  device_fingerprint: string;

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

  @Column({ type: "boolean", default: false, name: "is_trusted" })
  is_trusted: boolean;

  @Column({ type: "timestamp", nullable: true, name: "trust_expires_at" })
  trust_expires_at: Date | null;

  @Column({
    type: "varchar",
    length: 45,
    nullable: true,
    name: "last_ip_address",
  })
  last_ip_address: string | null;

  @Column({ type: "jsonb", nullable: true, name: "last_location" })
  last_location: Record<string, any> | null;

  @Column({ type: "integer", default: 1, name: "login_count" })
  login_count: number;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    name: "first_seen_at",
  })
  first_seen_at: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    name: "last_seen_at",
  })
  last_seen_at: Date;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;
}
