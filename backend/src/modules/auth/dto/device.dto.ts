import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

/**
 * Device response DTO
 * Requirements: 8.3, 8.4
 */
export class DeviceDto {
  @ApiProperty({
    description: "Device ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({
    description: "Device fingerprint hash",
    example: "abc123def456",
  })
  fingerprint: string;

  @ApiPropertyOptional({
    description: "User-assigned device name",
    example: "My MacBook Pro",
    nullable: true,
  })
  name: string | null;

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
    description: "Last known IP address",
    example: "192.168.1.1",
  })
  lastIpAddress: string;

  @ApiPropertyOptional({
    description: "Last known location",
    example: "San Francisco, CA, US",
    nullable: true,
  })
  lastLocation: string | null;

  @ApiProperty({
    description: "First time device was seen",
    example: "2024-01-01T00:00:00Z",
  })
  firstSeenAt: Date;

  @ApiProperty({
    description: "Last time device was used",
    example: "2026-02-27T12:30:00Z",
  })
  lastSeenAt: Date;

  @ApiProperty({
    description: "Whether device has been verified",
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: "Whether device is trusted",
    example: false,
  })
  isTrusted: boolean;
}

/**
 * Update device DTO
 * Requirements: 8.9
 */
export class UpdateDeviceDto {
  @ApiPropertyOptional({
    description: "User-assigned device name",
    example: "My MacBook Pro",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "Mark device as trusted",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;
}

/**
 * Revoke device response DTO
 */
export class RevokeDeviceResponseDto {
  @ApiProperty({
    description: "Success message",
    example:
      "Device revoked successfully. All sessions for this device have been terminated.",
  })
  message: string;

  @ApiProperty({
    description: "Number of sessions terminated",
    example: 2,
  })
  sessionsTerminated: number;
}
