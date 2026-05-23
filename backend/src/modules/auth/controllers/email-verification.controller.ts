import {
  Controller,
  Post,
  Get,
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
import { AuthenticatedUser } from "../interfaces/jwt-payload.interface";
import { EmailVerificationService } from "../services/email-verification.service";
import {
  VerifyEmailDto,
  VerifyEmailCodeDto,
  EmailVerificationStatusDto,
} from "../dto/email-verification.dto";
import { VerifyEmailCommand } from "../application/commands/VerifyEmail.command";

@ApiTags("auth-email-verification")
@Controller("auth/email")
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly commandBus: CommandBus,
  ) {}

  @Get("verification-status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get email verification status",
    description: "Get the email verification status for the authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "Email verification status",
    type: EmailVerificationStatusDto,
  })
  async getStatus(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<EmailVerificationStatusDto> {
    return this.emailVerificationService.getVerificationStatus(req.user.userId);
  }

  @Post("send-verification")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send verification email",
    description: "Send a verification email to the authenticated user",
  })
  @ApiResponse({ status: 200, description: "Verification email sent" })
  @ApiResponse({ status: 400, description: "Email already verified" })
  async sendVerificationEmail(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<{ message: string }> {
    return this.emailVerificationService.sendVerificationEmail(
      req.user.userId,
      req.user.email,
    );
  }

  @Post("resend-verification")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resend verification email",
    description: "Resend the verification email to the authenticated user",
  })
  @ApiResponse({ status: 200, description: "Verification email sent" })
  @ApiResponse({ status: 400, description: "Email already verified" })
  async resendVerificationEmail(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<{ message: string }> {
    return this.emailVerificationService.resendVerificationEmail(
      req.user.userId,
    );
  }

  @Post("verify-token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify email with token",
    description: "Verify email using the token sent via email",
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: "Email verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async verifyByToken(
    @Body() dto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    // Use CQRS command for email verification (Requirements: 3.3, 3.7)
    return this.commandBus.execute(new VerifyEmailCommand(dto.token));
  }

  @Post("verify-code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify email with code",
    description: "Verify email using the 6-digit code sent via email",
  })
  @ApiBody({ type: VerifyEmailCodeDto })
  @ApiResponse({ status: 200, description: "Email verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired code" })
  async verifyByCode(
    @Body() dto: VerifyEmailCodeDto,
  ): Promise<{ message: string }> {
    return this.emailVerificationService.verifyByCode(dto.email, dto.code);
  }
}
