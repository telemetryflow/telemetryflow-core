import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "administrator.telemetryflow@telemetryflow.id" })
  email: string;

  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiPropertyOptional({ example: "https://telemetryflow.id/avatar.jpg" })
  avatar?: string;

  @ApiProperty({ example: true })
  mfaEnabled: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiPropertyOptional({ example: "00000000-0000-4000-a000-000000000001" })
  organizationId?: string;

  @ApiPropertyOptional({ example: "00000000-0000-4000-a000-000000000003" })
  tenantId?: string;

  @ApiProperty({ example: "2026-02-27T10:00:00Z" })
  createdAt: Date;
}
