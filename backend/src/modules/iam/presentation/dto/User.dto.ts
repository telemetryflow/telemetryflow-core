import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    example: "administrator.telemetryflow@telemetryflow.id",
    description: "User email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Admin@654123",
    description:
      "User password (min 8 chars, must include uppercase, lowercase, number, and special character)",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/, {
    message:
      "Password must include uppercase, lowercase, number, and special character",
  })
  password: string;

  @ApiProperty({ example: "Administrator", description: "User first name" })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: "TelemetryFlow", description: "User last name" })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: "Organization UUID to assign the user to",
    example: "00000000-0000-4000-a000-000000000001",
  })
  @IsOptional()
  @IsUUID("4")
  organizationId?: string;

  @ApiPropertyOptional({
    description: "Workspace UUID within the organization",
    example: "00000000-0000-4000-a000-000000000002",
  })
  @IsOptional()
  @IsUUID("4")
  workspaceId?: string;

  @ApiPropertyOptional({
    description: "Tenant UUID within the workspace",
    example: "00000000-0000-4000-a000-000000000003",
  })
  @IsOptional()
  @IsUUID("4")
  tenantId?: string;

  @ApiPropertyOptional({
    description: "Role UUID to assign (defaults to Viewer if omitted)",
    example: "00000000-0000-4000-a000-000000000010",
  })
  @IsOptional()
  @IsUUID("4")
  roleId?: string;

  @ApiPropertyOptional({
    description:
      "Send a verification email to the new user after creation. Default: false for admin-created accounts.",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendEmailVerification?: boolean;

  @ApiPropertyOptional({
    description: "Force the user to change their password on next login. Default: false.",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: "Administrator",
    description: "User first name",
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    example: "TelemetryFlow",
    description: "User last name",
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    example: "https://telemetryflow.id/avatar.jpg",
    description: "User avatar URL",
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: "UTC", description: "User timezone" })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: "en", description: "User locale" })
  @IsString()
  @IsOptional()
  locale?: string;
}

export class AdminResetPasswordDto {
  @ApiProperty({
    example: "NewPassword@654123",
    description: "New password (min 8 characters)",
  })
  @IsString()
  @MinLength(8)
  password: string;
}
