import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsNotEmpty, MaxLength } from "class-validator";

/**
 * DTO for updating organization settings
 * Only the organization creator can modify organization settings
 */
export class UpdateOrganizationSettingsDto {
  @ApiPropertyOptional({
    description: "Organization name",
    example: "My Organization",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: "Organization description",
    example: "A description of my organization",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: "Organization domain",
    example: "myorg.com",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;
}

/**
 * DTO for adding a user to an organization
 */
export class AddUserToOrganizationDto {
  @ApiProperty({
    description: "User ID to add to the organization",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: "Role to assign to the user",
    example: "developer",
    enum: [
      "super_administrator",
      "administrator",
      "developer",
      "viewer",
      "demo",
    ],
  })
  @IsNotEmpty()
  @IsString()
  role: string;
}

/**
 * Response DTO for organization details
 */
export class AuthOrganizationResponseDto {
  @ApiProperty({
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Organization name",
    example: "org-1234567890",
  })
  name: string;

  @ApiProperty({
    description: "Organization code",
    example: "ORG1234567890",
  })
  code: string;

  @ApiPropertyOptional({
    description: "Organization description",
    example: "Organization for user 123",
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Organization domain",
    example: "myorg.com",
  })
  domain?: string;

  @ApiProperty({
    description: "Organization creator user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  creatorUserId: string;

  @ApiProperty({
    description: "Organization creation date",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Organization last update date",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}

/**
 * Response DTO for organization user
 */
export class OrganizationUserResponseDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Username",
    example: "john.doe",
  })
  username: string;

  @ApiProperty({
    description: "Email address",
    example: "john.doe@example.com",
  })
  email: string;

  @ApiProperty({
    description: "User role",
    example: "administrator",
  })
  role: string;

  @ApiProperty({
    description: "Whether user is the organization creator",
    example: true,
  })
  isOrganizationCreator: boolean;

  @ApiProperty({
    description: "Whether user is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "User creation date",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;
}
