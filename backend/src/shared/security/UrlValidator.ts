import { BadRequestException } from "@nestjs/common";
import * as dns from "dns/promises";

const PRIVATE_IPV4_RANGES = [
  { start: "10.0.0.0", end: "10.255.255.255" },
  { start: "172.16.0.0", end: "172.31.255.255" },
  { start: "192.168.0.0", end: "192.168.255.255" },
  { start: "127.0.0.0", end: "127.255.255.255" },
  { start: "169.254.0.0", end: "169.254.255.255" },
  { start: "0.0.0.0", end: "0.255.255.255" },
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
];

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".local",
  ".internal",
  ".svc",
  ".cluster.local",
  ".localhost",
];

function ipToNum(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  if (ip === "0.0.0.0") return true;
  const num = ipToNum(ip);
  return PRIVATE_IPV4_RANGES.some((range) => {
    const start = ipToNum(range.start);
    const end = ipToNum(range.end);
    return num >= start && num <= end;
  });
}

function isLinkLocalIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return normalized.startsWith("fe80:") || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd");
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  return BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => lower.endsWith(suffix) || lower === suffix.slice(1));
}

async function resolveHostname(hostname: string): Promise<string[]> {
  try {
    const result = await dns.resolve4(hostname);
    return result;
  } catch {
    try {
      const v6 = await dns.resolve6(hostname);
      return v6;
    } catch {
      return [];
    }
  }
}

export class UrlValidator {
  static async validatePublicUrl(url: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException(`URL is not allowed: invalid URL format`);
    }

    if (parsed.protocol !== "https:") {
      throw new BadRequestException(`URL is not allowed: only HTTPS protocol is allowed`);
    }

    await this.validateHostname(parsed.hostname);
  }

  static async validateMonitorUrl(url: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException(`URL is not allowed: invalid URL format`);
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new BadRequestException(`URL is not allowed: only HTTP/HTTPS protocols are allowed`);
    }

    await this.validateHostname(parsed.hostname);
  }

  static async validateWebhookUrl(url: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException(`URL is not allowed: invalid URL format`);
    }

    if (parsed.protocol !== "https:") {
      throw new BadRequestException(`URL is not allowed: webhook URLs must use HTTPS`);
    }

    await this.validateHostname(parsed.hostname);
  }

  private static async validateHostname(hostname: string): Promise<void> {
    if (isBlockedHostname(hostname)) {
      throw new BadRequestException(`URL is not allowed: hostname "${hostname}" is blocked`);
    }

    const resolved = await resolveHostname(hostname);
    if (resolved.length === 0) {
      throw new BadRequestException(`URL is not allowed: cannot resolve hostname "${hostname}"`);
    }

    for (const ip of resolved) {
      if (ip.includes(":")) {
        if (isLinkLocalIPv6(ip)) {
          throw new BadRequestException(`URL is not allowed: resolved to internal/private IP address`);
        }
      } else {
        if (isPrivateIPv4(ip)) {
          throw new BadRequestException(`URL is not allowed: resolved to internal/private IP address`);
        }
      }
    }
  }
}
