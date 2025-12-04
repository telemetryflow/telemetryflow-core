import { IsString, IsUUID, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'DevOpsCorner', description: 'Organization name' })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiProperty({ example: 'devopscorner', description: 'Unique organization code' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Code must be lowercase alphanumeric with hyphens' })
  code: string;

  @ApiProperty({ example: '00000001-0000-0000-0000-000000000001', description: 'Region ID' })
  @IsUUID()
  regionId: string;

  @ApiPropertyOptional({ example: 'DevOpsCorner Indonesia organization', description: 'Organization description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'devopscorner.id', description: 'Organization domain' })
  @IsOptional()
  @IsString()
  domain?: string;
}

export class UpdateOrganizationDto {
  @ApiProperty({ example: 'DevOpsCorner Updated', description: 'Organization name' })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Organization description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'updated.devopscorner.id', description: 'Organization domain' })
  @IsOptional()
  @IsString()
  domain?: string;
}
