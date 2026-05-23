import {
  IsEmail,
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: "Username for the account",
    example: "john.doe",
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3, { message: "Username must be at least 3 characters" })
  @MaxLength(50, { message: "Username must not exceed 50 characters" })
  username: string;

  @ApiProperty({
    description: "Email address",
    example: "john.doe@telemetryflow.id",
  })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @ApiProperty({
    description:
      "Password (min 8 chars, must include uppercase, lowercase, number, and special character)",
    example: "SecurePass@123",
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
    {
      message:
        "Password must include uppercase, lowercase, number, and special character",
    },
  )
  password: string;

  @ApiProperty({
    description: "First name",
    example: "John",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: "First name is required" })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: "Last name",
    example: "Doe",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: "Last name is required" })
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: "Region UUID for the user",
    example: "00000000-0000-4000-a000-000000000001",
  })
  @IsUUID("4", { message: "Region ID must be a valid UUID" })
  regionId: string;

  @ApiPropertyOptional({
    description: "Organization UUID (optional, user can join an existing org)",
    example: "00000000-0000-4000-a000-000000000001",
  })
  @IsOptional()
  @IsUUID("4", { message: "Organization ID must be a valid UUID" })
  organizationId?: string;

  @ApiPropertyOptional({
    description: "Workspace UUID within the selected organization",
    example: "00000000-0000-4000-a000-000000000002",
  })
  @IsOptional()
  @IsUUID("4", { message: "Workspace ID must be a valid UUID" })
  workspaceId?: string;

  @ApiPropertyOptional({
    description: "Tenant UUID within the selected workspace",
    example: "00000000-0000-4000-a000-000000000003",
  })
  @IsOptional()
  @IsUUID("4", { message: "Tenant ID must be a valid UUID" })
  tenantId?: string;

  @ApiPropertyOptional({
    description:
      "Whether to send a verification email after registration. Defaults to true.",
    example: true,
    default: true,
  })
  @IsOptional()
  sendEmailVerification?: boolean;

  @ApiPropertyOptional({
    description: "Invite token (required when REGISTRATION_MODE=invite)",
  })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: "Success message",
    example:
      "Registration successful. Please check your email to verify your account.",
  })
  message: string;

  @ApiProperty({
    description: "Created user ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  userId: string;

  @ApiProperty({
    description: "Registered email address",
    example: "john.doe@telemetryflow.id",
  })
  email: string;
}
