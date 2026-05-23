import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";

/**
 * DTO for initiating SSO login
 */
export class SSOLoginDto {
  @ApiProperty({
    description: "SSO provider ID from SSO module",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID('4', { message: "Provider ID must be a valid UUID" })
  @IsNotEmpty({ message: "Provider ID is required" })
  providerId: string;

  @ApiProperty({
    description: "Organization ID for user association",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  @IsNotEmpty({ message: "Organization ID is required" })
  organizationId: string;

  @ApiPropertyOptional({
    description: "Optional redirect URL after successful authentication",
    example: "https://app.example.com/dashboard",
  })
  @IsString()
  @IsOptional()
  redirectUrl?: string;
}

/**
 * Response DTO for SSO login initiation
 */
export class SSOLoginResponseDto {
  @ApiProperty({
    description: "SSO provider authorization URL to redirect user to",
    example:
      "https://sso.example.com/auth?SAMLRequest=...&RelayState=abc123",
  })
  authorizationUrl: string;

  @ApiProperty({
    description: "State token for CSRF protection (should be stored by client)",
    example: "abc123def456",
  })
  state: string;
}

/**
 * DTO for SSO callback
 */
export class SSOCallbackDto {
  @ApiProperty({
    description: "Authorization code or SAML response from SSO provider",
    example: "4/0AX4XfWh...",
  })
  @IsString()
  @IsNotEmpty({ message: "Authorization code is required" })
  code: string;

  @ApiProperty({
    description: "State token for CSRF protection",
    example: "abc123def456",
  })
  @IsString()
  @IsNotEmpty({ message: "State token is required" })
  state: string;
}
