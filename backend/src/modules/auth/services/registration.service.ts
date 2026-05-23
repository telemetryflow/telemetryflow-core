import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { RegisterUserCommand } from '../../iam/application/commands/RegisterUser.command';
import { EmailVerificationService } from './email-verification.service';

/**
 * Registration orchestration service.
 *
 * Lives in the auth module (public endpoint owner) and delegates
 * domain logic to the IAM module via CQRS CommandBus.
 */
@Injectable()
export class RegistrationService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    // 1. Execute registration command via CQRS (handled by IAM module)
    const userId: string = await this.commandBus.execute(
      new RegisterUserCommand(
        dto.username,
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
        dto.regionId,
        dto.organizationId,
      ),
    );

    // 2. Trigger email verification
    try {
      await this.emailVerificationService.sendVerificationEmail(
        userId,
        dto.email,
      );
    } catch {
      // Email verification failure should not block registration
      // The user can resend verification later
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      userId,
      email: dto.email,
    };
  }
}
