/**
 * Session Types
 * Type definitions for user sessions and device management
 */

export interface Session {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  ipAddress: string;
  location: string;
  country: string;
  city: string;
  isCurrent: boolean;
  isActive: boolean;
  lastActivityAt: number;
  createdAt: number;
  expiresAt: number;
  userAgent: string;
}

export interface SessionListResponse {
  sessions: Session[];
  total: number;
  currentSessionId: string;
}

export interface RevokeSessionResponse {
  message: string;
  revokedCount?: number;
}
