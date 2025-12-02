import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@telemetryflow.id', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123456', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @MaxLength(100)
  lastName: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'User avatar URL' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: 'UTC', description: 'User timezone' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'en', description: 'User locale' })
  @IsString()
  @IsOptional()
  locale?: string;
}

export class AdminResetPasswordDto {
  @ApiProperty({ example: 'NewPassword@123456', description: 'New password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;
}