import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsIn } from "class-validator";

/**
 * DTO for initiating OAuth login
 */
export class OAuthLoginDto {
  @ApiProperty({
    description: "OAuth provider name",
    enum: ["google", "github"],
    example: "google",
  })
  @IsString()
  @IsNotEmpty({ message: "OAuth provider is required" })
  @IsIn(["google", "github"], { message: "Provider must be either 'google' or 'github'" })
  provider: string;

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
 * Response DTO for OAuth login initiation
 */
export class OAuthLoginResponseDto {
  @ApiProperty({
    description: "OAuth provider authorization URL to redirect user to",
    example:
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid+email+profile&state=abc123",
  })
  authorizationUrl: string;

  @ApiProperty({
    description: "State token for CSRF protection (should be stored by client)",
    example: "abc123def456",
  })
  state: string;
}

/**
 * DTO for OAuth callback
 */
export class OAuthCallbackDto {
  @ApiProperty({
    description: "Authorization code from OAuth provider",
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
