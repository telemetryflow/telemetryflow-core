/**
 * Sessions API client
 * Manages active user sessions including listing, viewing current, and revoking
 * Uses iamClient for real HTTP calls (auth endpoints) with config.useMock branching
 */

import { iamClient } from "./iam";
import { config } from "@/config";

// ==================== TYPES ====================
// Aligned with backend SessionDto

export interface Session {
  id: string;
  deviceId: string;
  deviceName: string | null;
  browser: string;
  os: string;
  ipAddress: string;
  location: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface SessionListResponse {
  sessions: Session[];
  total: number;
  currentSessionId: string;
}

export interface RevokeSessionResponse {
  message: string;
  sessionsTerminated?: number;
}

// ==================== ENDPOINTS ====================
// Relative to iamClient base (config.iamApiUrl + /api/v2)

export const SESSION_ENDPOINTS = {
  LIST: "/auth/sessions",
  REVOKE: (id: string) => `/auth/sessions/${id}`,
  REVOKE_ALL: "/auth/sessions",
} as const;

// ==================== MOCK DATA ====================

function generateMockSessions(): Session[] {
  const now = Date.now();

  return [
    {
      id: "session-001",
      deviceId: "device-001",
      deviceName: "MacBook Pro 16-inch",
      browser: "Chrome 120.0.6099",
      os: "macOS Sonoma 14.2",
      ipAddress: "192.168.1.100",
      location: "Jakarta, Indonesia",
      isCurrent: true,
      createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 2 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 16 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "session-002",
      deviceId: "device-002",
      deviceName: "iPhone 15 Pro",
      browser: "Safari 17.2",
      os: "iOS 17.2",
      ipAddress: "10.0.0.50",
      location: "Jakarta, Indonesia",
      isCurrent: false,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 45 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "session-003",
      deviceId: "device-003",
      deviceName: "Windows Desktop",
      browser: "Firefox 121.0",
      os: "Windows 11",
      ipAddress: "172.16.0.25",
      location: "Singapore",
      isCurrent: false,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "session-004",
      deviceId: "device-004",
      deviceName: "Linux Workstation",
      browser: "Chrome 120.0.6099",
      os: "Ubuntu 22.04",
      ipAddress: "203.0.113.42",
      location: "Bandung, Indonesia",
      isCurrent: false,
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "session-005",
      deviceId: "device-005",
      deviceName: "iPad Air",
      browser: "Safari 17.1",
      os: "iPadOS 17.1",
      ipAddress: "10.0.1.15",
      location: "Surabaya, Indonesia",
      isCurrent: false,
      createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// ==================== API CLIENT ====================

export const sessionsApi = {
  /**
   * List all sessions for the current user
   */
  async listSessions(): Promise<SessionListResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const sessions = generateMockSessions();
      const currentSession = sessions.find((s) => s.isCurrent);
      return {
        sessions,
        total: sessions.length,
        currentSessionId: currentSession?.id || sessions[0].id,
      };
    }

    const sessions = await iamClient.get<Session[]>(SESSION_ENDPOINTS.LIST);
    const currentSession = sessions.find((s) => s.isCurrent);
    return {
      sessions,
      total: sessions.length,
      currentSessionId: currentSession?.id || "",
    };
  },

  /**
   * Revoke a specific session by ID
   */
  async revokeSession(id: string): Promise<RevokeSessionResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { message: "Session revoked successfully" };
    }

    return iamClient.delete<RevokeSessionResponse>(SESSION_ENDPOINTS.REVOKE(id));
  },

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllSessions(): Promise<RevokeSessionResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const sessions = generateMockSessions();
      const otherCount = sessions.filter((s) => !s.isCurrent).length;
      return {
        message: `${otherCount} sessions revoked successfully`,
        sessionsTerminated: otherCount,
      };
    }

    return iamClient.delete<RevokeSessionResponse>(SESSION_ENDPOINTS.REVOKE_ALL);
  },
};

export default sessionsApi;
