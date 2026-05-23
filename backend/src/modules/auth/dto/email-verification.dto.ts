import { IsString, IsNotEmpty, IsEmail, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendVerificationEmailDto {
  @ApiProperty({ description: "Email address to verify" })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: "Verification token from email" })
  @IsString()
  @IsNotEmpty({ message: "Verification token is required" })
  token: string;
}

export class VerifyEmailCodeDto {
  @ApiProperty({ description: "Email address" })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    description: "6-digit verification code",
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: "Verification code is required" })
  @Length(6, 6, { message: "Verification code must be exactly 6 digits" })
  code: string;
}

export class EmailVerificationStatusDto {
  @ApiProperty({ description: "Whether the email is verified" })
  verified: boolean;

  @ApiProperty({ description: "Verification date if verified" })
  verifiedAt?: Date;
}

export class VerifyEmailResponseDto {
  @ApiProperty({ description: "Success message" })
  message: string;

  @ApiProperty({ description: "Whether the email was verified successfully" })
  verified: boolean;
}
