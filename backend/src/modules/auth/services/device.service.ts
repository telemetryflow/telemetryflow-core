import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Request } from "express";
import * as crypto from "crypto";
import * as geoip from "geoip-lite";
import { DeviceEntity } from "../infrastructure/persistence/entities/Device.entity";

/**
 * Device information interface
 */
export interface DeviceInfo {
  fingerprint: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  ipAddress?: string;
  location?: GeoLocation;
  userAgent: string;
  deviceType?: string;
}

/**
 * Geo location interface
 */
export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Device interface
 */
export interface Device {
  id: string;
  userId: string;
  fingerprint: string;
  name: string | null;
  deviceType: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  lastIpAddress: string | null;
  lastLocation: GeoLocation | null;
  loginCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  isTrusted: boolean;
  trustExpiresAt: Date | null;
}

/**
 * DeviceService - Device fingerprinting and management
 *
 * Responsibilities:
 * - Device fingerprinting logic
 * - Device detection and tracking
 * - Device revocation and cleanup
 * - New device detection
 *
 * Requirements: 8.1, 8.2, 8.5, 8.7, 8.8
 */
@Injectable()
export class DeviceService {
  // Inactive device cleanup threshold: 90 days
  private readonly INACTIVE_DEVICE_DAYS = 90;

  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
  ) {}

  /**
   * Generate device fingerprint from request
   * Requirement: 8.1
   *
   * Creates a unique fingerprint based on:
   * - User agent
   * - IP address
   * - Accept headers
   *
   * @param request - Express request object
   * @returns Device fingerprint hash
   */
  generateFingerprint(request: Request): string {
    const components = [
      request.headers["user-agent"] || "",
      request.ip || "",
      request.headers["accept-language"] || "",
      request.headers["accept-encoding"] || "",
    ];

    const fingerprintString = components.join("|");

    return crypto.createHash("sha256").update(fingerprintString).digest("hex");
  }

  /**
   * Extract device information from request
   * Requirement: 8.1
   *
   * @param request - Express request object
   * @returns Device information
   */
  extractDeviceInfo(request: Request): DeviceInfo {
    const userAgent = request.headers["user-agent"] || "";
    const fingerprint = this.generateFingerprint(request);

    // Parse user agent for browser and OS info
    const { browser, browserVersion, os, osVersion, deviceType } =
      this.parseUserAgent(userAgent);

    // Resolve real IP (strip IPv6 prefix for IPv4-mapped addresses)
    const rawIp = request.ip || request.socket?.remoteAddress || "";
    const ipAddress = rawIp.startsWith("::ffff:") ? rawIp.slice(7) : rawIp;

    // GeoIP lookup — skipped for loopback/private IPs
    const location = this.lookupGeoLocation(ipAddress);

    return {
      fingerprint,
      browser,
      browserVersion,
      os,
      osVersion,
      ipAddress,
      location,
      userAgent,
      deviceType,
    };
  }

  /**
   * Lookup geolocation for an IP address using geoip-lite.
   * Returns null for private/loopback addresses.
   */
  private lookupGeoLocation(ip: string): GeoLocation | undefined {
    if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      return undefined;
    }
    const geo = geoip.lookup(ip);
    if (!geo) return undefined;
    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.ll?.[0],
      longitude: geo.ll?.[1],
    };
  }

  /**
   * Get or create device
   * Requirement: 8.2, 8.8
   *
   * @param userId - User ID
   * @param fingerprint - Device fingerprint
   * @param info - Device information
   * @returns Device object
   */
  async getOrCreateDevice(
    userId: string,
    fingerprint: string,
    info: DeviceInfo,
  ): Promise<Device> {
    // Try to find existing device
    let device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_fingerprint: fingerprint,
      },
    });

    if (device) {
      // Update existing device
      device.login_count += 1;
      device.last_seen_at = new Date();
      device.last_ip_address = info.ipAddress || null;
      device.last_location = info.location || null;
      device.browser = info.browser || null;
      device.browser_version = info.browserVersion || null;
      device.os = info.os || null;
      device.os_version = info.osVersion || null;
      device.device_type = info.deviceType || null;

      await this.deviceRepository.save(device);
    } else {
      // Create new device
      device = this.deviceRepository.create({
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: this.generateDeviceName(info),
        device_type: info.deviceType || null,
        browser: info.browser || null,
        browser_version: info.browserVersion || null,
        os: info.os || null,
        os_version: info.osVersion || null,
        last_ip_address: info.ipAddress || null,
        last_location: info.location || null,
        login_count: 1,
        is_trusted: false,
        trust_expires_at: null,
      });

      await this.deviceRepository.save(device);
    }

    return this.mapEntityToDevice(device);
  }

  /**
   * Auto-generate a human-readable device name from parsed UA info.
   * e.g. "Chrome on macOS" / "Safari on iPhone" / "Firefox on Windows"
   */
  private generateDeviceName(info: DeviceInfo): string {
    const parts: string[] = [];
    if (info.browser) parts.push(info.browser);
    if (info.os) {
      // Friendly mobile labels
      if (info.os === "iOS" && info.deviceType === "tablet") parts.push("on iPad");
      else if (info.os === "iOS") parts.push("on iPhone");
      else if (info.os === "Android" && info.deviceType === "tablet") parts.push("on Android Tablet");
      else if (info.os === "Android") parts.push("on Android");
      else parts.push(`on ${info.os}`);
    }
    return parts.length > 0 ? parts.join(" ") : "Unknown Device";
  }

  /**
   * Get all devices for a user
   * Requirement: 8.3
   *
   * @param userId - User ID
   * @returns Array of devices
   */
  async getUserDevices(userId: string): Promise<Device[]> {
    const entities = await this.deviceRepository.find({
      where: { user_id: userId },
      order: { last_seen_at: "DESC" },
    });

    return entities.map((entity) => this.mapEntityToDevice(entity));
  }

  /**
   * Check if device is known for user
   * Requirement: 8.2
   *
   * @param userId - User ID
   * @param fingerprint - Device fingerprint
   * @returns True if device is known
   */
  async isKnownDevice(userId: string, fingerprint: string): Promise<boolean> {
    const device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_fingerprint: fingerprint,
      },
    });

    return device !== null;
  }

  /**
   * Update device activity
   *
   * @param deviceId - Device ID
   */
  async updateDeviceActivity(deviceId: string): Promise<void> {
    await this.deviceRepository.update(
      { id: deviceId },
      {
        last_seen_at: new Date(),
        login_count: () => "login_count + 1",
      },
    );
  }

  /**
   * Revoke device
   * Requirement: 8.5
   *
   * @param deviceId - Device ID
   * @throws NotFoundException if device not found
   */
  async revokeDevice(deviceId: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException("Device not found");
    }

    // Delete the device
    await this.deviceRepository.delete({ id: deviceId });
  }

  /**
   * Trust a device
   * Requirement: 7.4 (MFA skip on trusted devices)
   *
   * @param deviceId - Device ID
   * @param trustDays - Number of days to trust (default: 30)
   */
  async trustDevice(deviceId: string, trustDays: number = 30): Promise<void> {
    const trustExpiresAt = new Date();
    trustExpiresAt.setDate(trustExpiresAt.getDate() + trustDays);

    await this.deviceRepository.update(
      { id: deviceId },
      {
        is_trusted: true,
        trust_expires_at: trustExpiresAt,
      },
    );
  }

  /**
   * Untrust a device
   *
   * @param deviceId - Device ID
   */
  async untrustDevice(deviceId: string): Promise<void> {
    await this.deviceRepository.update(
      { id: deviceId },
      {
        is_trusted: false,
        trust_expires_at: null,
      },
    );
  }

  /**
   * Update device name
   * Requirement: 8.9
   *
   * @param deviceId - Device ID
   * @param name - Device name
   */
  async updateDeviceName(deviceId: string, name: string): Promise<void> {
    await this.deviceRepository.update({ id: deviceId }, { device_name: name });
  }

  /**
   * Cleanup inactive devices
   * Requirement: 8.7
   *
   * Removes devices not used for specified number of days
   *
   * @param inactiveDays - Number of days (default: 90)
   * @returns Number of devices cleaned up
   */
  async cleanupInactiveDevices(
    inactiveDays: number = this.INACTIVE_DEVICE_DAYS,
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const result = await this.deviceRepository.delete({
      last_seen_at: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  /**
   * Parse user agent string
   * Simple parser for browser and OS detection
   *
   * @param userAgent - User agent string
   * @returns Parsed device information
   */
  private parseUserAgent(userAgent: string): {
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    deviceType?: string;
  } {
    const result: any = {};

    // Detect browser
    if (userAgent.includes("Chrome")) {
      result.browser = "Chrome";
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      if (match) result.browserVersion = match[1];
    } else if (userAgent.includes("Firefox")) {
      result.browser = "Firefox";
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      if (match) result.browserVersion = match[1];
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      result.browser = "Safari";
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      if (match) result.browserVersion = match[1];
    } else if (userAgent.includes("Edge")) {
      result.browser = "Edge";
      const match = userAgent.match(/Edge\/(\d+\.\d+)/);
      if (match) result.browserVersion = match[1];
    }

    // Detect OS (check more specific patterns first)
    if (userAgent.includes("Android")) {
      result.os = "Android";
      const match = userAgent.match(/Android (\d+\.\d+)/);
      if (match) result.osVersion = match[1];
    } else if (
      userAgent.includes("iOS") ||
      userAgent.includes("iPhone") ||
      userAgent.includes("iPad")
    ) {
      result.os = "iOS";
      const match = userAgent.match(/OS (\d+[._]\d+)/);
      if (match) result.osVersion = match[1].replace("_", ".");
    } else if (userAgent.includes("Windows")) {
      result.os = "Windows";
      if (userAgent.includes("Windows NT 10.0")) result.osVersion = "10";
      else if (userAgent.includes("Windows NT 6.3")) result.osVersion = "8.1";
      else if (userAgent.includes("Windows NT 6.2")) result.osVersion = "8";
      else if (userAgent.includes("Windows NT 6.1")) result.osVersion = "7";
    } else if (userAgent.includes("Mac OS X")) {
      result.os = "macOS";
      const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      if (match) result.osVersion = match[1].replace("_", ".");
    } else if (userAgent.includes("Linux")) {
      result.os = "Linux";
    }

    // Detect device type (check more specific patterns first)
    if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
      result.deviceType = "tablet";
    } else if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
      result.deviceType = "mobile";
    } else {
      result.deviceType = "desktop";
    }

    return result;
  }

  /**
   * Map entity to device interface
   *
   * @param entity - Device entity
   * @returns Device interface
   */
  private mapEntityToDevice(entity: DeviceEntity): Device {
    return {
      id: entity.id,
      userId: entity.user_id,
      fingerprint: entity.device_fingerprint,
      name: entity.device_name,
      deviceType: entity.device_type,
      browser: entity.browser,
      browserVersion: entity.browser_version,
      os: entity.os,
      osVersion: entity.os_version,
      lastIpAddress: entity.last_ip_address,
      lastLocation: entity.last_location,
      loginCount: entity.login_count,
      firstSeenAt: entity.first_seen_at,
      lastSeenAt: entity.last_seen_at,
      isTrusted: entity.is_trusted,
      trustExpiresAt: entity.trust_expires_at,
    };
  }
}
