import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * ChangePasswordDto - Request DTO for password change
 *
 * Requirements: 4.1, 4.5, 12.4
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: "Current password",
    example: "OldPassword123!",
  })
  @IsString()
  @IsNotEmpty({ message: "Current password is required" })
  currentPassword: string;

  @ApiProperty({
    description:
      "New password (min 8 chars, must include uppercase, lowercase, number, special char)",
    example: "NewPassword123!",
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: "New password is required" })
  @MinLength(8, { message: "New password must be at least 8 characters" })
  @MaxLength(100, { message: "New password must not exceed 100 characters" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
    {
      message:
        "New password must include uppercase, lowercase, number, and special character",
    },
  )
  newPassword: string;

  @ApiPropertyOptional({ description: "Confirm new password" })
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}

/**
 * ChangePasswordResponseDto - Response DTO for password change
 */
export class ChangePasswordResponseDto {
  @ApiProperty({
    description: "Success message",
    example:
      "Password changed successfully. Other sessions have been terminated.",
  })
  message: string;
}
