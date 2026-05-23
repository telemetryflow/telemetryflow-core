import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  Matches,
  Length,
} from "class-validator";

export class CreateOrganizationDto {
  @ApiProperty({
    example: "DevOpsCorner",
    description: "Organization name",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: "devopscorner",
    description: "Unique organization code",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(/^[a-z0-9-]+$/, {
    message: "Code must be lowercase alphanumeric with hyphens",
  })
  code: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Region ID",
  })
  @IsUUID()
  @IsNotEmpty()
  regionId: string;

  @ApiPropertyOptional({
    example: "Telemetri Data Indonesia organization",
    description: "Organization description",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: "devopscorner.id",
    description: "Organization domain",
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    example: "DevOpsCorner Updated",
    description: "Organization name",
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: "Updated organization description",
    description: "Organization description",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: "updated.devopscorner.id",
    description: "Organization domain",
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;
}

export class TenancyOrganizationResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  organizationId: string;

  @ApiProperty({ example: "DevOpsCorner" })
  name: string;

  @ApiProperty({ example: "devopscorner" })
  code: string;

  @ApiProperty({
    example: "Telemetri Data Indonesia organization",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: "devopscorner.id", nullable: true })
  domain: string | null;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  regionId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
