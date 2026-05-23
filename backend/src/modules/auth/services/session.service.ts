import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, IsNull } from "typeorm";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";

/**
 * Session metadata interface
 */
export interface SessionMetadata {
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  ipAddress?: string;
  location?: Record<string, any>;
  rememberMe?: boolean;
}

/**
 * Session interface
 */
export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  ipAddress: string | null;
  location: Record<string, any> | null;
  rememberMe: boolean;
  isCurrent: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  terminatedAt: Date | null;
  terminatedReason: string | null;
}

/**
 * SessionService - Session management service
 *
 * Responsibilities:
 * - Session CRUD operations
 * - Session creation with device binding
 * - Session activity tracking and expiry handling
 * - Session revocation (single and bulk)
 *
 * Requirements: 1.5, 9.7, 9.8, 9.9, 9.10
 */
@Injectable()
export class SessionService {
  // Default session expiry: 7 days
  private readonly DEFAULT_SESSION_EXPIRY_DAYS = 7;

  // Extended session expiry for "remember me": 30 days
  private readonly EXTENDED_SESSION_EXPIRY_DAYS = 30;

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  /**
   * Create a new session
   * Requirement: 1.5, 9.7
   *
   * @param userId - User ID
   * @param deviceId - Device ID (used as session token)
   * @param metadata - Session metadata (device info, IP, etc.)
   * @returns Created session
   */
  async createSession(
    userId: string,
    deviceId: string,
    metadata: SessionMetadata,
  ): Promise<Session> {
    // Remove any existing sessions for this device to avoid unique constraint violation
    // (session_token = device UUID, and the column has a UNIQUE constraint)
    await this.sessionRepository.delete({
      session_token: deviceId,
    });

    // Calculate expiry date
    const expiryDays = metadata.rememberMe
      ? this.EXTENDED_SESSION_EXPIRY_DAYS
      : this.DEFAULT_SESSION_EXPIRY_DAYS;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create session entity
    const session = this.sessionRepository.create({
      user_id: userId,
      session_token: deviceId,
      device_name: metadata.deviceName || null,
      device_type: metadata.deviceType || null,
      browser: metadata.browser || null,
      browser_version: metadata.browserVersion || null,
      os: metadata.os || null,
      os_version: metadata.osVersion || null,
      ip_address: metadata.ipAddress || null,
      location: metadata.location || null,
      remember_me: metadata.rememberMe || false,
      is_current: true,
      expires_at: expiresAt,
      last_activity_at: new Date(),
    });

    // Save to database
    const savedSession = await this.sessionRepository.save(session);

    return this.mapEntityToSession(savedSession);
  }

  /**
   * Get session by ID
   *
   * @param sessionId - Session ID
   * @returns Session or null if not found
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const entity = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        terminated_at: IsNull(),
      },
    });

    return entity ? this.mapEntityToSession(entity) : null;
  }

  /**
   * Get session by token
   *
   * @param sessionToken - Session token
   * @returns Session or null if not found
   */
  async getSessionByToken(sessionToken: string): Promise<Session | null> {
    const entity = await this.sessionRepository.findOne({
      where: {
        session_token: sessionToken,
        terminated_at: IsNull(),
      },
    });

    return entity ? this.mapEntityToSession(entity) : null;
  }

  /**
   * Get all active sessions for a user
   * Requirement: 9.9
   *
   * @param userId - User ID
   * @returns Array of active sessions
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const entities = await this.sessionRepository.find({
      where: {
        user_id: userId,
        terminated_at: IsNull(),
      },
      order: {
        last_activity_at: "DESC",
      },
    });

    return entities.map((entity) => this.mapEntityToSession(entity));
  }

  /**
   * Update session activity timestamp
   *
   * @param sessionId - Session ID
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      { last_activity_at: new Date() },
    );
  }

  /**
   * Revoke a single session
   * Requirement: 9.8, 9.10
   *
   * @param sessionId - Session ID
   * @param reason - Termination reason (optional)
   * @throws NotFoundException if session not found
   */
  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    await this.sessionRepository.update(
      { id: sessionId },
      {
        terminated_at: new Date(),
        terminated_reason: reason || "User logout",
        is_current: false,
      },
    );
  }

  /**
   * Revoke all sessions for a user
   * Requirement: 4.2, 5.5, 9.8
   *
   * @param userId - User ID
   * @param exceptSessionId - Session ID to exclude from revocation (optional)
   * @param reason - Termination reason (optional)
   */
  async revokeUserSessions(
    userId: string,
    exceptSessionId?: string,
    reason?: string,
  ): Promise<void> {
    const query = this.sessionRepository
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        terminated_at: new Date(),
        terminated_reason: reason || "Security event",
        is_current: false,
      })
      .where("user_id = :userId", { userId })
      .andWhere("terminated_at IS NULL");

    if (exceptSessionId) {
      query.andWhere("id != :exceptSessionId", { exceptSessionId });
    }

    await query.execute();
  }

  /**
   * Revoke all sessions for a device
   * Requirement: 8.5
   *
   * @param deviceId - Device ID (session token)
   * @param reason - Termination reason (optional)
   */
  async revokeDeviceSessions(deviceId: string, reason?: string): Promise<void> {
    await this.sessionRepository.update(
      {
        session_token: deviceId,
        terminated_at: IsNull(),
      },
      {
        terminated_at: new Date(),
        terminated_reason: reason || "Device revoked",
        is_current: false,
      },
    );
  }

  /**
   * Cleanup expired sessions
   * Removes sessions that have passed their expiry date
   *
   * @returns Number of sessions cleaned up
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        terminated_at: new Date(),
        terminated_reason: "Session expired",
        is_current: false,
      })
      .where("expires_at < :now", { now: new Date() })
      .andWhere("terminated_at IS NULL")
      .execute();

    return result.affected || 0;
  }

  /**
   * Delete old terminated sessions
   * Permanently removes sessions terminated more than specified days ago
   *
   * @param daysOld - Number of days (default: 90)
   * @returns Number of sessions deleted
   */
  async deleteOldSessions(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.sessionRepository.delete({
      terminated_at: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  /**
   * Check if a session is valid (not expired or terminated)
   *
   * @param sessionId - Session ID
   * @returns True if session is valid
   */
  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return false;
    }

    // Check if terminated
    if (session.terminated_at) {
      return false;
    }

    // Check if expired
    if (session.expires_at < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Map entity to session interface
   *
   * @param entity - Session entity
   * @returns Session interface
   */
  private mapEntityToSession(entity: SessionEntity): Session {
    return {
      id: entity.id,
      userId: entity.user_id,
      sessionToken: entity.session_token,
      deviceName: entity.device_name,
      deviceType: entity.device_type,
      browser: entity.browser,
      browserVersion: entity.browser_version,
      os: entity.os,
      osVersion: entity.os_version,
      ipAddress: entity.ip_address,
      location: entity.location,
      rememberMe: entity.remember_me,
      isCurrent: entity.is_current,
      lastActivityAt: entity.last_activity_at,
      expiresAt: entity.expires_at,
      createdAt: entity.created_at,
      terminatedAt: entity.terminated_at,
      terminatedReason: entity.terminated_reason,
    };
  }
}
