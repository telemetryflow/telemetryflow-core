import { ApiProperty } from "@nestjs/swagger";

/**
 * Session response DTO
 * Requirements: 9.9
 */
export class SessionDto {
  @ApiProperty({
    description: "Session ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({
    description: "Device ID associated with this session",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  deviceId: string;

  @ApiProperty({
    description: "Device name (if set)",
    example: "My MacBook Pro",
    nullable: true,
  })
  deviceName: string | null;

  @ApiProperty({
    description: "Browser information",
    example: "Chrome 120.0.0",
  })
  browser: string;

  @ApiProperty({
    description: "Operating system",
    example: "macOS 14.0",
  })
  os: string;

  @ApiProperty({
    description: "IP address",
    example: "192.168.1.1",
  })
  ipAddress: string;

  @ApiProperty({
    description: "Location (if available)",
    example: "San Francisco, CA, US",
    nullable: true,
  })
  location: string | null;

  @ApiProperty({
    description: "Session creation time",
    example: "2026-02-27T12:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last activity time",
    example: "2026-02-27T12:30:00Z",
  })
  lastActivityAt: Date;

  @ApiProperty({
    description: "Session expiration time",
    example: "2024-01-22T12:00:00Z",
  })
  expiresAt: Date;

  @ApiProperty({
    description: "Whether this is the current session",
    example: true,
  })
  isCurrent: boolean;
}

/**
 * Revoke session response DTO
 */
export class RevokeSessionResponseDto {
  @ApiProperty({
    description: "Success message",
    example: "Session revoked successfully.",
  })
  message: string;
}

/**
 * Revoke all sessions response DTO
 */
export class RevokeAllSessionsResponseDto {
  @ApiProperty({
    description: "Success message",
    example: "All other sessions have been terminated.",
  })
  message: string;

  @ApiProperty({
    description: "Number of sessions terminated",
    example: 3,
  })
  sessionsTerminated: number;
}
