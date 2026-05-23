import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SetupMfaResponseDto {
  @ApiProperty({ description: "Secret key for TOTP setup (base32 encoded)" })
  secret: string;

  @ApiProperty({ description: "QR code URL for authenticator app" })
  qrCodeUrl: string;

  @ApiProperty({ description: "Recovery codes (shown once)" })
  recoveryCodes: string[];
}

export class VerifyMfaSetupDto {
  @ApiProperty({
    description: "TOTP code from authenticator app",
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: "TOTP code is required" })
  @Length(6, 6, { message: "TOTP code must be exactly 6 digits" })
  code: string;
}

export class VerifyMfaDto {
  @ApiProperty({ description: "Temporary MFA session token" })
  @IsString()
  @IsNotEmpty({ message: "MFA token is required" })
  mfaToken: string;

  @ApiProperty({ description: "TOTP code or recovery code" })
  @IsString()
  @IsNotEmpty({ message: "Verification code is required" })
  code: string;

  @ApiPropertyOptional({ description: "Set to true if using a recovery code" })
  @IsOptional()
  @IsBoolean()
  isRecoveryCode?: boolean;

  @ApiPropertyOptional({ description: "Trust this device (extends session)" })
  @IsOptional()
  @IsBoolean()
  trustDevice?: boolean;
}

export class MfaStatusResponseDto {
  @ApiProperty({ description: "Whether MFA is enabled" })
  enabled: boolean;

  @ApiProperty({ description: "Methods configured", type: [String] })
  methods: string[];

  @ApiProperty({ description: "Number of remaining recovery codes" })
  recoveryCodesRemaining: number;
}

export class DisableMfaDto {
  @ApiProperty({ description: "Current password for verification" })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password: string;

  @ApiProperty({
    description: "TOTP code for verification",
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: "TOTP code is required" })
  @Length(6, 6, { message: "TOTP code must be exactly 6 digits" })
  code: string;
}

export class RegenerateMfaCodesDto {
  @ApiProperty({ description: "Current password for verification" })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password: string;

  @ApiProperty({
    description: "TOTP code for verification",
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: "TOTP code is required" })
  @Length(6, 6, { message: "TOTP code must be exactly 6 digits" })
  code: string;
}

export class RegenerateMfaCodesResponseDto {
  @ApiProperty({ description: "New recovery codes" })
  recoveryCodes: string[];
}

export class MfaRequiredResponseDto {
  @ApiProperty({ description: "Indicates MFA verification is required" })
  mfaRequired: true;

  @ApiProperty({ description: "Temporary token for MFA verification" })
  mfaToken: string;

  @ApiProperty({ description: "Token expiration time in seconds" })
  expiresIn: number;
}
