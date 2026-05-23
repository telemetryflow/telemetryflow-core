import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({ description: "Email address associated with the account" })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: "Password reset token from email" })
  @IsString()
  @IsNotEmpty({ message: "Reset token is required" })
  token: string;

  @ApiProperty({
    description:
      "New password (min 8 chars, must contain uppercase, lowercase, number, special char)",
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: "New password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  newPassword: string;

  @ApiProperty({ description: "Confirm new password" })
  @IsString()
  @IsNotEmpty({ message: "Password confirmation is required" })
  confirmPassword: string;
}

export class ValidateResetTokenDto {
  @ApiProperty({ description: "Password reset token to validate" })
  @IsString()
  @IsNotEmpty({ message: "Reset token is required" })
  token: string;
}

export class ValidateResetTokenResponseDto {
  @ApiProperty({ description: "Whether the token is valid" })
  valid: boolean;

  @ApiProperty({ description: "Email associated with the token (masked)" })
  email?: string;

  @ApiProperty({ description: "Token expiration time" })
  expiresAt?: Date;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ description: "Success message" })
  message: string;

  @ApiProperty({ description: "Whether the password was reset successfully" })
  success: boolean;
}
