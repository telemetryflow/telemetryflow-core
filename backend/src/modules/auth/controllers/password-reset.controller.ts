import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { CommandBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RateLimitGuard, RateLimit } from "../guards/rate-limit.guard";
import { PasswordResetService } from "../services/password-reset.service";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ValidateResetTokenDto,
  ValidateResetTokenResponseDto,
} from "../dto/password-reset.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { RequestPasswordResetCommand } from "../application/commands/RequestPasswordReset.command";
import { ConfirmPasswordResetCommand } from "../application/commands/ConfirmPasswordReset.command";
import { RequestPasswordReminderCommand } from "../application/commands/RequestPasswordReminder.command";
import {
  RequestPasswordReminderDto,
  PasswordReminderResponseDto,
} from "../dto/password-reminder.dto";

@ApiTags("auth-password")
@Controller("auth/password")
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post("forgot")
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    keyGenerator: (req) => `password-reset:${req.body.email || "unknown"}`,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Request password reset",
    description:
      "Send a password reset email. Always returns success to prevent email enumeration. Rate limited to 3 requests per hour per email address.",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent (if account exists)",
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests. Rate limit exceeded.",
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Use CQRS command for password reset request (Requirements: 5.1, 5.2, 5.7)
    return this.commandBus.execute(
      new RequestPasswordResetCommand(dto.email, ipAddress, userAgent),
    );
  }

  @Post("validate-token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate reset token",
    description: "Check if a password reset token is valid",
  })
  @ApiBody({ type: ValidateResetTokenDto })
  @ApiResponse({
    status: 200,
    description: "Token validation result",
    type: ValidateResetTokenResponseDto,
  })
  async validateToken(
    @Body() dto: ValidateResetTokenDto,
  ): Promise<ValidateResetTokenResponseDto> {
    return this.passwordResetService.validateResetToken(dto.token);
  }

  @Post("reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reset password",
    description:
      "Reset password using the token from the password reset email. Invalidates all sessions.",
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({
    status: 400,
    description:
      "Invalid or expired token, or password does not meet requirements",
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Use CQRS command for password reset confirmation (Requirements: 5.4, 5.5, 5.6, 5.8)
    return this.commandBus.execute(
      new ConfirmPasswordResetCommand(
        dto.token,
        dto.newPassword,
        ipAddress,
        userAgent,
      ),
    );
  }

  @Post("change")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change password",
    description: "Change password for the authenticated user",
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({
    status: 400,
    description: "Passwords do not match or same as current",
  })
  @ApiResponse({ status: 401, description: "Current password is incorrect" })
  async changePassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    return this.passwordResetService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
      ipAddress,
      userAgent,
    );
  }

  @Post("reminder")
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000, // 3 requests per day
    keyGenerator: (req) => `password-reminder:${req.body.email || "unknown"}`,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Request password reminder",
    description:
      "Send a password reminder email if one is set. Always returns success to prevent email enumeration. Rate limited to 3 requests per day per email address.",
  })
  @ApiBody({ type: RequestPasswordReminderDto })
  @ApiResponse({
    status: 200,
    description:
      "Password reminder sent (if account exists and reminder is set)",
    type: PasswordReminderResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests. Rate limit exceeded.",
  })
  async requestPasswordReminder(
    @Body() dto: RequestPasswordReminderDto,
    @Request() req: any,
  ): Promise<PasswordReminderResponseDto> {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Use CQRS command for password reminder request (Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7)
    return this.commandBus.execute(
      new RequestPasswordReminderCommand(dto.email, ipAddress, userAgent),
    );
  }
}
