import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import * as argon2 from "argon2";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { ValidateResetTokenResponseDto } from "../dto/password-reset.dto";
import { EmailService } from "../../notification/domain/services/EmailService";
import { SessionService } from "./session.service";

interface ResetToken {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordResetService {
  // In production, use Redis or database for token storage
  private resetTokens: Map<string, ResetToken> = new Map();

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly sessionService: SessionService,
  ) {}

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // Always return success to prevent email enumeration
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: null },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return {
        message:
          "If an account exists with this email, a password reset link will be sent",
      };
    }

    if (!user.isActive) {
      return {
        message:
          "If an account exists with this email, a password reset link will be sent",
      };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean up any existing tokens for this user
    for (const [key, value] of this.resetTokens.entries()) {
      if (value.userId === user.id) {
        this.resetTokens.delete(key);
      }
    }

    // Store token
    this.resetTokens.set(tokenHash, {
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt,
    });

    // Log for development
    console.log(`[Password Reset] User: ${email}`);
    console.log(`[Password Reset] Token: ${token}`);

    // Send email using notification service
    await this.emailService.sendPasswordResetEmail(
      email,
      user.firstName || "User",
      user.lastName || "",
      token,
    );

    return {
      message:
        "If an account exists with this email, a password reset link will be sent",
    };
  }

  async validateResetToken(
    token: string,
  ): Promise<ValidateResetTokenResponseDto> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenData = this.resetTokens.get(tokenHash);

    if (!tokenData) {
      return { valid: false };
    }

    if (tokenData.expiresAt < new Date()) {
      this.resetTokens.delete(tokenHash);
      return { valid: false };
    }

    // Mask email for display
    const emailParts = tokenData.email.split("@");
    const maskedEmail = emailParts[0].substring(0, 2) + "***@" + emailParts[1];

    return {
      valid: true,
      email: maskedEmail,
      expiresAt: tokenData.expiresAt,
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
    ipAddress?: string,
    _userAgent?: string,
  ): Promise<{ message: string }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenData = this.resetTokens.get(tokenHash);

    if (!tokenData) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    if (tokenData.expiresAt < new Date()) {
      this.resetTokens.delete(tokenHash);
      throw new BadRequestException("Reset token has expired");
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: tokenData.userId, deletedAt: null },
    });

    if (!user) {
      this.resetTokens.delete(tokenHash);
      throw new BadRequestException("User not found");
    }

    // Check if new password is same as current
    const isSamePassword = await argon2.verify(user.password, newPassword);
    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from current password",
      );
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword);

    // Update password and clear any locks
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    // Clean up token
    this.resetTokens.delete(tokenHash);

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(
      user.email,
      user.firstName || "User",
      user.lastName || "",
      ipAddress || "Unknown",
    );

    // Invalidate all sessions for this user (security best practice after password reset)
    await this.sessionService.revokeUserSessions(
      user.id,
      undefined,
      "Password reset - all sessions invalidated for security",
    );

    return { message: "Password has been reset successfully" };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    ipAddress?: string,
    _userAgent?: string,
  ): Promise<{ message: string }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify current password
    const isPasswordValid = await argon2.verify(user.password, currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        "New password must be different from current password",
      );
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword);

    // Update password
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(
      user.email,
      user.firstName || "User",
      user.lastName || "",
      ipAddress || "Unknown",
    );

    return { message: "Password changed successfully" };
  }
}
