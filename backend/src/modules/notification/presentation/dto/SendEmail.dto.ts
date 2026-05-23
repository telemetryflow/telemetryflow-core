import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailTemplateType } from '../../domain/services/EmailService';

/**
 * DTO for email attachment
 */
export class EmailAttachmentDto {
  @ApiProperty({
    description: 'Filename of the attachment',
    example: 'report.pdf',
  })
  @IsString()
  filename: string;

  @ApiPropertyOptional({
    description: 'Base64 encoded content of the attachment',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Path to the file to attach',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: 'MIME type of the attachment',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  contentType?: string;
}

/**
 * DTO for sending a raw email
 */
export class SendRawEmailDto {
  @ApiProperty({
    description: 'Recipient email address(es)',
    example: 'user@telemetryflow.id',
  })
  @IsEmail({}, { each: true })
  to: string | string[];

  @ApiProperty({
    description: 'Email subject line',
    example: 'Welcome to TelemetryFlow',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'HTML content of the email',
    example: '<h1>Welcome!</h1><p>Thank you for registering.</p>',
  })
  @IsString()
  html: string;

  @ApiPropertyOptional({
    description: 'Plain text content of the email',
    example: 'Welcome! Thank you for registering.',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Sender email address (overrides default)',
    example: 'noreply@telemetryflow.id',
  })
  @IsOptional()
  @IsEmail()
  from?: string;

  @ApiPropertyOptional({
    description: 'Reply-to email address',
    example: 'support@telemetryflow.id',
  })
  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @ApiPropertyOptional({
    description: 'Email attachments',
    type: [EmailAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}

/**
 * DTO for sending a templated email
 */
export class SendTemplatedEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@telemetryflow.id',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Email template type',
    enum: EmailTemplateType,
    example: EmailTemplateType.WELCOME,
  })
  @IsEnum(EmailTemplateType)
  templateType: EmailTemplateType;

  @ApiProperty({
    description: 'Template variables',
    example: { firstName: 'John', loginLink: 'https://app.telemetryflow.id/login' },
  })
  @IsObject()
  variables: Record<string, unknown>;
}

/**
 * Response DTO for email send operations
 */
export class EmailSendResultDto {
  @ApiProperty({
    description: 'Whether the email was sent successfully',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Message ID from the email provider',
    example: '<abc123@telemetryflow.id>',
  })
  messageId?: string;

  @ApiPropertyOptional({
    description: 'Error message if sending failed',
    example: 'Connection timeout',
  })
  error?: string;
}
