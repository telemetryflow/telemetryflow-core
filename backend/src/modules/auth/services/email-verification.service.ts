import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { randomInt } from "crypto";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { EmailVerificationStatusDto } from "../dto/email-verification.dto";
import { EmailService } from "../../notification/domain/services/EmailService";

interface VerificationToken {
  userId: string;
  email: string;
  token: string;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class EmailVerificationService {
  // In production, use Redis or database for token storage
  private verificationTokens: Map<string, VerificationToken> = new Map();

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async sendVerificationEmail(
    userId: string,
    email: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.emailVerified) {
      throw new BadRequestException("Email is already verified");
    }

    // Generate verification token and code
    const token = crypto.randomBytes(32).toString("hex");
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token
    this.verificationTokens.set(token, {
      userId,
      email,
      token,
      code,
      expiresAt,
    });

    // Also index by email for code verification
    this.verificationTokens.set(`code:${email}`, {
      userId,
      email,
      token,
      code,
      expiresAt,
    });

    // Log for development
    console.log(`[Email Verification] User: ${email}`);
    console.log(`[Email Verification] Code: ${code}`);
    console.log(`[Email Verification] Token: ${token}`);

    // Send email using notification service
    await this.emailService.sendVerificationEmail(
      email,
      user.firstName || "User",
      user.lastName || "",
      token,
    );

    return { message: "Verification email sent" };
  }

  async verifyByToken(token: string): Promise<{ message: string }> {
    const tokenData = this.verificationTokens.get(token);

    if (!tokenData) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    if (tokenData.expiresAt < new Date()) {
      this.verificationTokens.delete(token);
      this.verificationTokens.delete(`code:${tokenData.email}`);
      throw new BadRequestException("Verification token has expired");
    }

    // Verify the email
    await this.userRepository.update(tokenData.userId, {
      emailVerified: true,
      email_verified_at: new Date(),
    });

    // Clean up tokens
    this.verificationTokens.delete(token);
    this.verificationTokens.delete(`code:${tokenData.email}`);

    return { message: "Email verified successfully" };
  }

  async verifyByCode(
    email: string,
    code: string,
  ): Promise<{ message: string }> {
    const tokenData = this.verificationTokens.get(`code:${email}`);

    if (!tokenData) {
      throw new BadRequestException("No pending verification for this email");
    }

    if (tokenData.expiresAt < new Date()) {
      this.verificationTokens.delete(tokenData.token);
      this.verificationTokens.delete(`code:${email}`);
      throw new BadRequestException("Verification code has expired");
    }

    if (tokenData.code !== code) {
      throw new BadRequestException("Invalid verification code");
    }

    // Verify the email
    await this.userRepository.update(tokenData.userId, {
      emailVerified: true,
      email_verified_at: new Date(),
    });

    // Clean up tokens
    this.verificationTokens.delete(tokenData.token);
    this.verificationTokens.delete(`code:${email}`);

    return { message: "Email verified successfully" };
  }

  async getVerificationStatus(
    userId: string,
  ): Promise<EmailVerificationStatusDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      verified: user.emailVerified || false,
      verifiedAt: user.email_verified_at,
    };
  }

  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.emailVerified) {
      throw new BadRequestException("Email is already verified");
    }

    // Clean up any existing tokens for this user
    for (const [key, value] of this.verificationTokens.entries()) {
      if (value.userId === userId) {
        this.verificationTokens.delete(key);
      }
    }

    // Send new verification email
    return this.sendVerificationEmail(userId, user.email);
  }

  private generateVerificationCode(): string {
    return randomInt(100000, 1000000).toString();
  }
}
