import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { DeviceEntity } from "../infrastructure/persistence/entities/Device.entity";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";
import { EmailService, SecurityAlertType } from "./email.service";
import { DeviceInfo, GeoLocation } from "./device.service";

/**
 * Suspicious activity detection result
 */
export interface SuspiciousActivityResult {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
  requiresVerification: boolean;
}

/**
 * Suspicious activity detection configuration
 */
interface SuspiciousActivityConfig {
  // Impossible travel: max km/hour for human travel
  maxTravelSpeedKmh: number;
  // Time window for rapid location changes (minutes)
  rapidLocationChangeWindow: number;
  // Max location changes in window
  maxLocationChanges: number;
  // Unusual hours: login outside typical hours (0-6 AM)
  unusualHoursStart: number;
  unusualHoursEnd: number;
  // Risk score threshold for flagging
  riskScoreThreshold: number;
}

/**
 * SuspiciousActivityService
 *
 * Detects suspicious authentication activity including:
 * - Impossible travel (geographically distant logins in short time)
 * - Unusual access patterns (unusual times, rapid location changes)
 * - Malicious IPs (blacklisted IP addresses)
 *
 * Requirements: 10.3, 10.4
 */
@Injectable()
export class SuspiciousActivityService {
  private readonly logger = new Logger(SuspiciousActivityService.name);

  // Configuration
  private readonly config: SuspiciousActivityConfig = {
    maxTravelSpeedKmh: 1000, // Max speed: ~1000 km/h (commercial flight)
    rapidLocationChangeWindow: 60, // 60 minutes
    maxLocationChanges: 3, // Max 3 location changes in 60 minutes
    unusualHoursStart: 0, // Midnight
    unusualHoursEnd: 6, // 6 AM
    riskScoreThreshold: 50, // Flag if risk score >= 50
  };

  // Blacklisted IP addresses (in production, this would be from a database or external service)
  private readonly blacklistedIPs: Set<string> = new Set([
    // Example malicious IPs - in production, load from database or threat intelligence service
    "192.0.2.1", // TEST-NET-1 (RFC 5737)
    "198.51.100.1", // TEST-NET-2 (RFC 5737)
    "203.0.113.1", // TEST-NET-3 (RFC 5737)
  ]);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Detect suspicious activity for a login attempt
   * Requirement: 10.3, 10.4
   *
   * @param userId - User ID
   * @param deviceInfo - Device information from current login
   * @returns Suspicious activity result
   */
  async detectSuspiciousActivity(
    userId: string,
    deviceInfo: DeviceInfo,
  ): Promise<SuspiciousActivityResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for blacklisted IP (Requirement: 10.4)
    if (deviceInfo.ipAddress && this.isBlacklistedIP(deviceInfo.ipAddress)) {
      reasons.push("Login from blacklisted IP address");
      riskScore += 100; // Immediate high risk
      this.logger.warn(
        `Blacklisted IP detected for user ${userId}: ${deviceInfo.ipAddress}`,
      );
    }

    // Check for impossible travel (Requirement: 10.4)
    const impossibleTravelCheck = await this.checkImpossibleTravel(
      userId,
      deviceInfo,
    );
    if (impossibleTravelCheck.detected) {
      reasons.push(impossibleTravelCheck.reason);
      riskScore += impossibleTravelCheck.riskScore;
    }

    // Check for unusual access patterns (Requirement: 10.4)
    const unusualPatternCheck = await this.checkUnusualPatterns(
      userId,
      deviceInfo,
    );
    if (unusualPatternCheck.detected) {
      reasons.push(...unusualPatternCheck.reasons);
      riskScore += unusualPatternCheck.riskScore;
    }

    const isSuspicious = riskScore >= this.config.riskScoreThreshold;
    const requiresVerification = riskScore >= 75; // High risk requires additional verification

    if (isSuspicious) {
      this.logger.warn(
        `Suspicious activity detected for user ${userId}: ${reasons.join(", ")} (Risk Score: ${riskScore})`,
      );
    }

    return {
      isSuspicious,
      reasons,
      riskScore,
      requiresVerification,
    };
  }

  /**
   * Flag account for suspicious activity
   * Requirement: 10.3
   *
   * @param userId - User ID
   * @param reasons - Reasons for flagging
   * @param riskScore - Risk score
   */
  async flagAccount(
    userId: string,
    reasons: string[],
    riskScore: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.error(`User not found for flagging: ${userId}`);
      return;
    }

    // In a production system, you would:
    // 1. Add a flag to the user entity (e.g., is_flagged, flagged_at, flag_reason)
    // 2. Create a security incident record
    // 3. Potentially lock the account or require additional verification

    // For now, we'll log the flag and send an alert email
    this.logger.warn(
      `Account flagged for user ${userId}: ${reasons.join(", ")} (Risk Score: ${riskScore})`,
    );

    // Send security alert email (Requirement: 10.3)
    try {
      await this.emailService.sendSecurityAlert(
        user.email,
        SecurityAlertType.SUSPICIOUS_ACTIVITY,
        {
          reasons,
          riskScore,
          timestamp: new Date(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send security alert email for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Check if IP is blacklisted
   * Requirement: 10.4
   *
   * @param ipAddress - IP address to check
   * @returns True if blacklisted
   */
  private isBlacklistedIP(ipAddress: string): boolean {
    return this.blacklistedIPs.has(ipAddress);
  }

  /**
   * Check for impossible travel
   * Requirement: 10.4
   *
   * Detects if user logged in from geographically distant locations
   * in a time period that would be impossible for human travel
   *
   * @param userId - User ID
   * @param currentDeviceInfo - Current device information
   * @returns Detection result
   */
  private async checkImpossibleTravel(
    userId: string,
    currentDeviceInfo: DeviceInfo,
  ): Promise<{ detected: boolean; reason: string; riskScore: number }> {
    // Get the most recent login location
    const recentDevice = await this.deviceRepository.findOne({
      where: { user_id: userId },
      order: { last_seen_at: "DESC" },
    });

    if (
      !recentDevice ||
      !recentDevice.last_location ||
      !currentDeviceInfo.location
    ) {
      // Can't check without location data
      return { detected: false, reason: "", riskScore: 0 };
    }

    const previousLocation = recentDevice.last_location as GeoLocation;
    const currentLocation = currentDeviceInfo.location;

    // Calculate time difference in hours
    const timeDiffMs = Date.now() - recentDevice.last_seen_at.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    // Calculate distance between locations
    const distance = this.calculateDistance(previousLocation, currentLocation);

    // Calculate required speed
    const requiredSpeed = distance / timeDiffHours;

    // Check if travel speed is impossible
    if (requiredSpeed > this.config.maxTravelSpeedKmh) {
      return {
        detected: true,
        reason: `Impossible travel detected: ${Math.round(distance)} km in ${Math.round(timeDiffHours * 60)} minutes (${Math.round(requiredSpeed)} km/h)`,
        riskScore: 60,
      };
    }

    return { detected: false, reason: "", riskScore: 0 };
  }

  /**
   * Check for unusual access patterns
   * Requirement: 10.4
   *
   * Detects:
   * - Logins during unusual hours (0-6 AM)
   * - Rapid location changes
   *
   * @param userId - User ID
   * @param deviceInfo - Device information
   * @returns Detection result
   */
  private async checkUnusualPatterns(
    userId: string,
    deviceInfo: DeviceInfo,
  ): Promise<{ detected: boolean; reasons: string[]; riskScore: number }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for unusual hours
    const currentHour = new Date().getHours();
    if (
      currentHour >= this.config.unusualHoursStart &&
      currentHour < this.config.unusualHoursEnd
    ) {
      reasons.push(`Login during unusual hours (${currentHour}:00)`);
      riskScore += 20;
    }

    // Check for rapid location changes
    if (deviceInfo.location) {
      const recentDevices = await this.deviceRepository.find({
        where: { user_id: userId },
        order: { last_seen_at: "DESC" },
        take: 5,
      });

      if (recentDevices && recentDevices.length > 0) {
        // Count unique locations in the recent window
        const windowStart = new Date(
          Date.now() - this.config.rapidLocationChangeWindow * 60 * 1000,
        );
        const recentLocations = recentDevices
          .filter((d) => d.last_seen_at >= windowStart && d.last_location)
          .map((d) => {
            const loc = d.last_location as GeoLocation;
            return `${loc.country}-${loc.city}`;
          });

        const uniqueLocations = new Set(recentLocations);

        if (uniqueLocations.size > this.config.maxLocationChanges) {
          reasons.push(
            `Rapid location changes: ${uniqueLocations.size} locations in ${this.config.rapidLocationChangeWindow} minutes`,
          );
          riskScore += 30;
        }
      }
    }

    return {
      detected: reasons.length > 0,
      reasons,
      riskScore,
    };
  }

  /**
   * Calculate distance between two geographic coordinates using Haversine formula
   *
   * @param loc1 - First location
   * @param loc2 - Second location
   * @returns Distance in kilometers
   */
  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    if (
      !loc1.latitude ||
      !loc1.longitude ||
      !loc2.latitude ||
      !loc2.longitude
    ) {
      return 0;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) *
        Math.cos(this.toRadians(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Add IP to blacklist
   *
   * @param ipAddress - IP address to blacklist
   */
  async addToBlacklist(ipAddress: string): Promise<void> {
    this.blacklistedIPs.add(ipAddress);
    this.logger.log(`IP address added to blacklist: ${ipAddress}`);
  }

  /**
   * Remove IP from blacklist
   *
   * @param ipAddress - IP address to remove
   */
  async removeFromBlacklist(ipAddress: string): Promise<void> {
    this.blacklistedIPs.delete(ipAddress);
    this.logger.log(`IP address removed from blacklist: ${ipAddress}`);
  }

  /**
   * Get blacklisted IPs
   *
   * @returns Array of blacklisted IP addresses
   */
  getBlacklistedIPs(): string[] {
    return Array.from(this.blacklistedIPs);
  }
}
