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

export class CreateWorkspaceDto {
  @ApiProperty({
    example: "Development",
    description: "Workspace name",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: "dev",
    description: "Unique workspace code",
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
    description: "Organization ID",
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({
    example: "Development environment workspace",
    description: "Workspace description",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({
    example: "Development Updated",
    description: "Workspace name",
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: "Updated workspace description",
    description: "Workspace description",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class WorkspaceResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  workspaceId: string;

  @ApiProperty({ example: "Development" })
  name: string;

  @ApiProperty({ example: "dev" })
  code: string;

  @ApiProperty({ example: "Development environment workspace", nullable: true })
  description: string | null;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  organizationId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
