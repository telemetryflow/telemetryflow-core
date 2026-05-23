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

export class CreateTenantDto {
  @ApiProperty({
    example: "Default Tenant",
    description: "Tenant name",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: "default",
    description: "Unique tenant code",
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
    description: "Workspace ID",
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiPropertyOptional({
    example: "Default tenant for the workspace",
    description: "Tenant description",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({
    example: "Updated Tenant",
    description: "Tenant name",
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: "Updated tenant description",
    description: "Tenant description",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class TenantResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  tenantId: string;

  @ApiProperty({ example: "Default Tenant" })
  name: string;

  @ApiProperty({ example: "default" })
  code: string;

  @ApiProperty({ example: "Default tenant for the workspace", nullable: true })
  description: string | null;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  workspaceId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
