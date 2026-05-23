import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import * as argon2 from "argon2";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import {
  SetupMfaResponseDto,
  MfaStatusResponseDto,
  RegenerateMfaCodesResponseDto,
} from "../dto/mfa.dto";

// TOTP implementation using crypto (no external dependency)
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_WINDOW = 1;

@Injectable()
export class MfaService {
  private readonly mfa_secrets: Map<
    string,
    { secret: string; createdAt: Date }
  > = new Map();

  // Temporary MFA session storage (userId -> { token, expiresAt, deviceInfo })
  private readonly mfaSessions: Map<
    string,
    { userId: string; expiresAt: Date; deviceInfo: any }
  > = new Map();

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}

  async setupMfa(userId: string): Promise<SetupMfaResponseDto> {
    const user = await this.findUserOrFail(userId);

    if (user.mfa_enabled) {
      throw new BadRequestException("MFA is already enabled");
    }

    // Generate secret
    const secret = this.generateSecret();

    // Store temporarily (will be confirmed on verification)
    this.mfa_secrets.set(userId, { secret, createdAt: new Date() });

    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes();

    // Build QR code URL
    const appName =
      this.configService.get<string>("APP_NAME") || "TelemetryFlow";
    const qrCodeUrl = this.generateTotpUri(secret, user.email, appName);

    return {
      secret,
      qrCodeUrl,
      recoveryCodes,
    };
  }

  async verifyMfaSetup(userId: string, code: string): Promise<void> {
    const pendingSetup = this.mfa_secrets.get(userId);

    if (!pendingSetup) {
      throw new BadRequestException(
        "No MFA setup in progress. Please initiate setup first.",
      );
    }

    // Check if setup expired (10 minutes)
    const setupAge = Date.now() - pendingSetup.createdAt.getTime();
    if (setupAge > 10 * 60 * 1000) {
      this.mfa_secrets.delete(userId);
      throw new BadRequestException(
        "MFA setup expired. Please initiate setup again.",
      );
    }

    // Verify the code
    const isValid = this.verifyTotp(pendingSetup.secret, code);
    if (!isValid) {
      throw new BadRequestException("Invalid verification code");
    }

    // Generate and hash recovery codes
    const recoveryCodes = this.generateRecoveryCodes();
    const hashedCodes = await Promise.all(
      recoveryCodes.map((code) => argon2.hash(code)),
    );

    // Save to user
    await this.userRepository.update(userId, {
      mfa_enabled: true,
      mfa_secret: pendingSetup.secret,
      mfa_backup_codes: hashedCodes,
      mfa_enrolled_at: new Date(),
    });

    // Clean up
    this.mfa_secrets.delete(userId);
  }

  async verifyMfaCode(
    userId: string,
    code: string,
    isRecoveryCode = false,
  ): Promise<boolean> {
    const user = await this.findUserOrFail(userId);

    if (!user.mfa_enabled || !user.mfa_secret) {
      throw new BadRequestException("MFA is not enabled");
    }

    if (isRecoveryCode) {
      return this.verifyRecoveryCode(user, code);
    }

    // Update last used timestamp
    await this.userRepository.update(userId, {
      mfa_last_used_at: new Date(),
    });

    return this.verifyTotp(user.mfa_secret, code);
  }

  async getMfaStatus(userId: string): Promise<MfaStatusResponseDto> {
    const user = await this.findUserOrFail(userId);

    const recoveryCodesRemaining = user.mfa_backup_codes?.length || 0;

    return {
      enabled: user.mfa_enabled || false,
      methods: user.mfa_enabled ? ["totp"] : [],
      recoveryCodesRemaining,
    };
  }

  async disableMfa(
    userId: string,
    password: string,
    code: string,
  ): Promise<void> {
    const user = await this.findUserOrFail(userId);

    if (!user.mfa_enabled) {
      throw new BadRequestException("MFA is not enabled");
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Verify TOTP code
    const isCodeValid = this.verifyTotp(user.mfa_secret, code);
    if (!isCodeValid) {
      throw new BadRequestException("Invalid verification code");
    }

    // Disable MFA
    await this.userRepository.update(userId, {
      mfa_enabled: false,
      mfa_secret: null,
      mfa_backup_codes: null,
    });
  }

  async regenerateRecoveryCodes(
    userId: string,
    password: string,
    code: string,
  ): Promise<RegenerateMfaCodesResponseDto> {
    const user = await this.findUserOrFail(userId);

    if (!user.mfa_enabled) {
      throw new BadRequestException("MFA is not enabled");
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Verify TOTP code
    const isCodeValid = this.verifyTotp(user.mfa_secret, code);
    if (!isCodeValid) {
      throw new BadRequestException("Invalid verification code");
    }

    // Generate new recovery codes
    const recoveryCodes = this.generateRecoveryCodes();
    const hashedCodes = await Promise.all(
      recoveryCodes.map((code) => argon2.hash(code)),
    );

    // Save new codes
    await this.userRepository.update(userId, {
      mfa_backup_codes: hashedCodes,
    });

    return { recoveryCodes };
  }

  // Private helper methods

  private async findUserOrFail(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    return user;
  }

  private generateSecret(length = 20): string {
    const buffer = crypto.randomBytes(length);
    return this.base32Encode(buffer);
  }

  private generateRecoveryCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(5).toString("hex").toUpperCase();
      codes.push(`${code.slice(0, 5)}-${code.slice(5, 10)}`);
    }
    return codes;
  }

  private generateTotpUri(
    secret: string,
    email: string,
    issuer: string,
  ): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  }

  private verifyTotp(secret: string, code: string): boolean {
    const currentTime = Math.floor(Date.now() / 1000);

    for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
      const timeStep = Math.floor(
        (currentTime + i * TOTP_PERIOD) / TOTP_PERIOD,
      );
      const expectedCode = this.generateTotpCode(secret, timeStep);
      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  }

  private generateTotpCode(secret: string, timeStep: number): string {
    const secretBuffer = this.base32Decode(secret);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep));

    const hmac = crypto.createHmac("sha1", secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, TOTP_DIGITS);
    return otp.toString().padStart(TOTP_DIGITS, "0");
  }

  private async verifyRecoveryCode(
    user: UserEntity,
    code: string,
  ): Promise<boolean> {
    if (!user.mfa_backup_codes || user.mfa_backup_codes.length === 0) {
      return false;
    }

    const normalizedCode = code.replace(/-/g, "").toUpperCase();

    for (let i = 0; i < user.mfa_backup_codes.length; i++) {
      const hashedCode = user.mfa_backup_codes[i];
      try {
        const isValid = await argon2.verify(hashedCode, normalizedCode);
        if (isValid) {
          // Remove used recovery code
          const updatedCodes = [...user.mfa_backup_codes];
          updatedCodes.splice(i, 1);
          await this.userRepository.update(user.id, {
            mfa_backup_codes: updatedCodes,
          });
          return true;
        }
      } catch {
        // Continue to next code
      }
    }

    return false;
  }

  // Base32 encoding/decoding (RFC 4648)
  private base32Encode(buffer: Buffer): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let result = "";
    let bits = 0;
    let value = 0;

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  private base32Decode(encoded: string): Buffer {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleanedInput = encoded.replace(/=+$/, "").toUpperCase();
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (const char of cleanedInput) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  /**
   * Create temporary MFA session token
   * Requirements: 7.4
   * Returns a temporary token that must be verified with MFA code
   */
  createMfaSession(userId: string, deviceInfo: any): string {
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    this.mfaSessions.set(token, {
      userId,
      expiresAt,
      deviceInfo,
    });

    return token;
  }

  /**
   * Validate MFA session token
   * Requirements: 7.4
   */
  validateMfaSession(token: string): {
    userId: string;
    deviceInfo: any;
  } | null {
    const session = this.mfaSessions.get(token);

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      this.mfaSessions.delete(token);
      return null;
    }

    return {
      userId: session.userId,
      deviceInfo: session.deviceInfo,
    };
  }

  /**
   * Remove MFA session token after successful verification
   */
  removeMfaSession(token: string): void {
    this.mfaSessions.delete(token);
  }

  /**
   * Check if user is locked due to MFA failures
   * Requirements: 7.6
   */
  async isMfaLocked(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.mfa_locked_until) {
      return false;
    }

    return user.mfa_locked_until > new Date();
  }

  /**
   * Increment MFA failure count and lock if threshold reached
   * Requirements: 7.5, 7.6
   * - Track MFA failures
   * - Lock account after 5 failures for 15 minutes
   */
  async incrementMfaFailures(userId: string): Promise<void> {
    const user = await this.findUserOrFail(userId);

    const maxAttempts = 5;
    const lockDurationMinutes = 15; // Requirement 7.6: 15 minutes lockout

    user.mfa_failure_count = (user.mfa_failure_count || 0) + 1;

    // Lock account if threshold reached (Requirement 7.6)
    if (user.mfa_failure_count >= maxAttempts) {
      user.mfa_locked_until = new Date(
        Date.now() + lockDurationMinutes * 60 * 1000,
      );
    }

    await this.userRepository.save(user);
  }

  /**
   * Reset MFA failure count on successful verification
   * Requirements: 7.5
   */
  async resetMfaFailures(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      mfa_failure_count: 0,
      mfa_locked_until: null,
    });
  }
}
