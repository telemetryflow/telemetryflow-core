import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailService } from './domain/services/EmailService';
import {
  EMAIL_PROVIDER,
  SMTPEmailProvider,
} from './infrastructure/providers';
import {
  NotificationLogEntity,
  NotificationTemplateEntity,
  NotificationChannelEntity,
} from './infrastructure/entities';
import {
  NotificationLogRepository,
  NotificationTemplateRepository,
  NotificationChannelRepository,
} from './infrastructure/repositories';

/**
 * Notification Module
 *
 * Provides email notification services for the TelemetryFlow Platform.
 * This module handles all outbound email communications including:
 * - Registration verification emails
 * - Welcome emails
 * - Password reset emails
 * - Password changed notifications
 * - New login location alerts
 * - Security alerts
 * - Email OTP codes
 *
 * The module uses SMTP via Nodemailer and Handlebars for templating.
 * Persistence layer includes notification logs, templates, and channels.
 *
 * @example
 * // Inject EmailService in any service
 * constructor(private readonly emailService: EmailService) {}
 *
 * // Send verification email
 * await this.emailService.sendVerificationEmail(
 *   'user@telemetryflow.id',
 *   'John',
 *   'https://app.telemetryflow.id/verify?token=abc123',
 *   24
 * );
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      NotificationLogEntity,
      NotificationTemplateEntity,
      NotificationChannelEntity,
    ]),
  ],
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useClass: SMTPEmailProvider,
    },
    EmailService,
    NotificationLogRepository,
    NotificationTemplateRepository,
    NotificationChannelRepository,
  ],
  exports: [
    EmailService,
    NotificationLogRepository,
    NotificationTemplateRepository,
    NotificationChannelRepository,
  ],
})
export class NotificationModule {}
