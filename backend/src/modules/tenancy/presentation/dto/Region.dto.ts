import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsNotEmpty, MaxLength } from "class-validator";

export class CreateRegionDto {
  @ApiProperty({
    example: "US East (N. Virginia)",
    description: "Region name",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: "us-east-1",
    description: "Unique region code",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    example: "US East region hosted in Virginia",
    description: "Region description",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRegionDto {
  @ApiPropertyOptional({
    example: "US East (N. Virginia) Updated",
    description: "Region name",
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: "Updated region description",
    description: "Region description",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class RegionResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "US East (N. Virginia)" })
  name: string;

  @ApiProperty({ example: "us-east-1" })
  code: string;

  @ApiProperty({ example: "US East region hosted in Virginia" })
  description: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
