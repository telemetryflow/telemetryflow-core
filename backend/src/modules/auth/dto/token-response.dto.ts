import { ApiProperty } from "@nestjs/swagger";

export class UserProfileDto {
  @ApiProperty({ description: "User ID", example: "uuid-string" })
  id: string;

  @ApiProperty({
    description: "User email",
    example: "demo.telemetryflow@telemetryflow.id",
  })
  email: string;

  @ApiProperty({ description: "First name", example: "Demo" })
  firstName: string;

  @ApiProperty({ description: "Last name", example: "User" })
  lastName: string;

  @ApiProperty({ description: "User roles", example: ["Demo"] })
  roles: string[];

  @ApiProperty({ description: "User permissions", example: ["dashboard:read"] })
  permissions: string[];

  @ApiProperty({
    description: "User avatar URL",
    example: null,
    nullable: true,
  })
  avatar: string | null;

  @ApiProperty({ description: "Tenant ID", example: null, nullable: true })
  tenantId: string | null;

  @ApiProperty({
    description: "Organization ID",
    example: null,
    nullable: true,
  })
  organizationId: string | null;
}

export class TokenResponseDto {
  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken: string;

  @ApiProperty({
    description: "Refresh token for obtaining new access tokens",
    example: "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  })
  refreshToken: string;

  @ApiProperty({
    description: "Token expiration time in seconds",
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: "Token type",
    example: "Bearer",
  })
  tokenType: string;

  @ApiProperty({
    description: "User profile information",
    type: UserProfileDto,
  })
  user: UserProfileDto;
}
