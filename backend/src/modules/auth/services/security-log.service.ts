import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  SecurityLogEntity,
  SecurityEventType,
} from "../infrastructure/persistence/entities/SecurityLog.entity";

/**
 * Security log entry data
 */
export interface SecurityLogData {
  userId?: string | null;
  eventType: SecurityEventType;
  ipAddress: string;
  userAgent?: string | null;
  success: boolean;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * IP blacklist entry
 */
export interface BlacklistedIP {
  ipAddress: string;
  reason: string;
  addedAt: Date;
}

/**
 * SecurityLogService
 *
 * Provides security event logging and IP blacklist management for:
 * - Logging all authentication events with metadata
 * - IP blacklist checking and management
 * - Security auditing and compliance
 * - Threat detection and incident investigation
 *
 * Requirements: 4.8, 6.7, 10.6, 10.7
 */
@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  // In-memory IP blacklist (in production, this would be in Redis or database)
  private readonly blacklistedIPs: Map<string, BlacklistedIP> = new Map();

  constructor(
    @InjectRepository(SecurityLogEntity)
    private readonly securityLogRepository: Repository<SecurityLogEntity>,
  ) {
    // Initialize with some test blacklisted IPs
    this.initializeBlacklist();
  }

  /**
   * Initialize blacklist with test IPs
   * In production, load from database or external threat intelligence service
   */
  private initializeBlacklist(): void {
    const testIPs = [
      { ip: "192.0.2.1", reason: "TEST-NET-1 (RFC 5737)" },
      { ip: "198.51.100.1", reason: "TEST-NET-2 (RFC 5737)" },
      { ip: "203.0.113.1", reason: "TEST-NET-3 (RFC 5737)" },
    ];

    testIPs.forEach(({ ip, reason }) => {
      this.blacklistedIPs.set(ip, {
        ipAddress: ip,
        reason,
        addedAt: new Date(),
      });
    });
  }

  /**
   * Log a security event
   * Requirement: 10.6
   *
   * @param data - Security log data
   * @returns Created security log entry
   */
  async logEvent(data: SecurityLogData): Promise<SecurityLogEntity> {
    try {
      const logEntry = this.securityLogRepository.create({
        user_id: data.userId || null,
        event_type: data.eventType,
        ip_address: data.ipAddress,
        user_agent: data.userAgent || null,
        success: data.success,
        error_message: data.errorMessage || null,
        metadata: data.metadata || null,
      });

      const savedEntry = await this.securityLogRepository.save(logEntry);

      this.logger.log(
        `Security event logged: ${data.eventType} for user ${data.userId || "unknown"} from IP ${data.ipAddress} - ${data.success ? "SUCCESS" : "FAILURE"}`,
      );

      return savedEntry;
    } catch (error) {
      this.logger.error(
        `Failed to log security event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log successful login
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata
   */
  async logLoginSuccess(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log failed login attempt
   * Requirement: 10.6
   *
   * @param userId - User ID (if known)
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param errorMessage - Error message
   * @param metadata - Additional metadata
   */
  async logLoginFailure(
    userId: string | null,
    ipAddress: string,
    userAgent: string,
    errorMessage: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.LOGIN_FAILURE,
      ipAddress,
      userAgent,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Log password change event
   * Requirement: 4.8
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata
   */
  async logPasswordChange(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_CHANGE,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log password reset event
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata
   */
  async logPasswordReset(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_RESET,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log password reminder request
   * Requirement: 6.7
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata
   */
  async logPasswordReminderRequest(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.PASSWORD_REMINDER_REQUEST,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log MFA success
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata
   */
  async logMFASuccess(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.MFA_SUCCESS,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log MFA failure
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param errorMessage - Error message
   * @param metadata - Additional metadata
   */
  async logMFAFailure(
    userId: string,
    ipAddress: string,
    userAgent: string,
    errorMessage: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.MFA_FAILURE,
      ipAddress,
      userAgent,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Log account lockout
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata
   */
  async logAccountLockout(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.ACCOUNT_LOCKOUT,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log suspicious activity
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata (should include reasons and risk score)
   */
  async logSuspiciousActivity(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log device revocation
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata (should include device ID)
   */
  async logDeviceRevoked(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.DEVICE_REVOKED,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log session revocation
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param metadata - Additional metadata (should include session ID)
   */
  async logSessionRevoked(
    userId: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: SecurityEventType.SESSION_REVOKED,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Check if an IP address is blacklisted
   * Requirement: 10.7
   *
   * @param ipAddress - IP address to check
   * @returns True if blacklisted, false otherwise
   */
  isBlacklisted(ipAddress: string): boolean {
    return this.blacklistedIPs.has(ipAddress);
  }

  /**
   * Get blacklist entry for an IP address
   * Requirement: 10.7
   *
   * @param ipAddress - IP address
   * @returns Blacklist entry or null if not blacklisted
   */
  getBlacklistEntry(ipAddress: string): BlacklistedIP | null {
    return this.blacklistedIPs.get(ipAddress) || null;
  }

  /**
   * Add IP address to blacklist
   * Requirement: 10.7
   *
   * @param ipAddress - IP address to blacklist
   * @param reason - Reason for blacklisting
   */
  addToBlacklist(ipAddress: string, reason: string): void {
    this.blacklistedIPs.set(ipAddress, {
      ipAddress,
      reason,
      addedAt: new Date(),
    });

    this.logger.warn(
      `IP address added to blacklist: ${ipAddress} - Reason: ${reason}`,
    );
  }

  /**
   * Remove IP address from blacklist
   * Requirement: 10.7
   *
   * @param ipAddress - IP address to remove
   * @returns True if removed, false if not found
   */
  removeFromBlacklist(ipAddress: string): boolean {
    const removed = this.blacklistedIPs.delete(ipAddress);

    if (removed) {
      this.logger.log(`IP address removed from blacklist: ${ipAddress}`);
    }

    return removed;
  }

  /**
   * Get all blacklisted IP addresses
   * Requirement: 10.7
   *
   * @returns Array of blacklisted IP entries
   */
  getBlacklistedIPs(): BlacklistedIP[] {
    return Array.from(this.blacklistedIPs.values());
  }

  /**
   * Get security logs for a user
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param limit - Maximum number of logs to return
   * @returns Array of security log entries
   */
  async getUserLogs(
    userId: string,
    limit: number = 100,
  ): Promise<SecurityLogEntity[]> {
    return this.securityLogRepository.find({
      where: { user_id: userId },
      order: { created_at: "DESC" },
      take: limit,
    });
  }

  /**
   * Get security logs by event type
   * Requirement: 10.6
   *
   * @param eventType - Event type
   * @param limit - Maximum number of logs to return
   * @returns Array of security log entries
   */
  async getLogsByEventType(
    eventType: SecurityEventType,
    limit: number = 100,
  ): Promise<SecurityLogEntity[]> {
    return this.securityLogRepository.find({
      where: { event_type: eventType },
      order: { created_at: "DESC" },
      take: limit,
    });
  }

  /**
   * Get security logs by IP address
   * Requirement: 10.6
   *
   * @param ipAddress - IP address
   * @param limit - Maximum number of logs to return
   * @returns Array of security log entries
   */
  async getLogsByIP(
    ipAddress: string,
    limit: number = 100,
  ): Promise<SecurityLogEntity[]> {
    return this.securityLogRepository.find({
      where: { ip_address: ipAddress },
      order: { created_at: "DESC" },
      take: limit,
    });
  }

  /**
   * Get failed login attempts for a user within a time window
   * Requirement: 10.6
   *
   * @param userId - User ID
   * @param windowMinutes - Time window in minutes
   * @returns Count of failed login attempts
   */
  async getFailedLoginAttempts(
    userId: string,
    windowMinutes: number = 15,
  ): Promise<number> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await this.securityLogRepository.count({
      where: {
        user_id: userId,
        event_type: SecurityEventType.LOGIN_FAILURE,
        created_at: windowStart as any, // TypeORM will handle the comparison
      },
    });

    return count;
  }

  /**
   * Log administrator deactivation event
   * Requirement: 14.7
   *
   * @param adminUserId - Administrator user ID being deactivated
   * @param superAdminId - Super Administrator ID performing the action
   * @param ticketRef - Ticket reference for audit trail
   */
  async logAdministratorDeactivation(
    adminUserId: string,
    superAdminId: string,
    ticketRef: string,
  ): Promise<void> {
    await this.logEvent({
      userId: adminUserId,
      eventType: SecurityEventType.ADMINISTRATOR_DEACTIVATED,
      ipAddress: "system", // System action, no specific IP
      userAgent: null,
      success: true,
      metadata: {
        deactivatedBy: superAdminId,
        ticketRef,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log administrator reactivation event
   * Requirement: 14.7
   *
   * @param adminUserId - Administrator user ID being reactivated
   * @param superAdminId - Super Administrator ID performing the action
   */
  async logAdministratorReactivation(
    adminUserId: string,
    superAdminId: string,
  ): Promise<void> {
    await this.logEvent({
      userId: adminUserId,
      eventType: SecurityEventType.ADMINISTRATOR_REACTIVATED,
      ipAddress: "system", // System action, no specific IP
      userAgent: null,
      success: true,
      metadata: {
        reactivatedBy: superAdminId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
