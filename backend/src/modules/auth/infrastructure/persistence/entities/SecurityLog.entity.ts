import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Security event types for authentication logging
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  MFA_SUCCESS = "mfa_success",
  MFA_FAILURE = "mfa_failure",
  PASSWORD_CHANGE = "password_change",
  PASSWORD_RESET = "password_reset",
  ACCOUNT_LOCKOUT = "account_lockout",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  DEVICE_REVOKED = "device_revoked",
  SESSION_REVOKED = "session_revoked",
  EMAIL_VERIFICATION = "email_verification",
  REGISTRATION = "registration",
  LOGOUT = "logout",
  TOKEN_REFRESH = "token_refresh",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_REMINDER_REQUEST = "password_reminder_request",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  ADMINISTRATOR_DEACTIVATED = "administrator_deactivated",
  ADMINISTRATOR_REACTIVATED = "administrator_reactivated",
}

/**
 * SecurityLogEntity - Security event logging
 * Maps to 'security_logs' table
 *
 * Stores all authentication and security events for:
 * - Security auditing
 * - Threat detection
 * - Compliance reporting
 * - Incident investigation
 *
 * Requirements: 4.8, 6.7, 10.6, 10.7
 */
@Entity("security_logs")
@Index(["user_id"])
@Index(["event_type"])
@Index(["ip_address"])
@Index(["created_at"])
@Index(["user_id", "event_type"])
@Index(["user_id", "created_at"])
export class SecurityLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true, name: "user_id" })
  user_id: string | null;

  @Column({
    type: "enum",
    enum: SecurityEventType,
    name: "event_type",
  })
  event_type: SecurityEventType;

  @Column({ type: "varchar", length: 45, name: "ip_address" })
  ip_address: string;

  @Column({ type: "text", nullable: true, name: "user_agent" })
  user_agent: string | null;

  @Column({ type: "boolean", default: false })
  success: boolean;

  @Column({ type: "text", nullable: true, name: "error_message" })
  error_message: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;
}
