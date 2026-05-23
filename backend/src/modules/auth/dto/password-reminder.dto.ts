import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * RequestPasswordReminderDto - Request DTO for password reminder
 *
 * Requirements: 6.1, 6.2
 */
export class RequestPasswordReminderDto {
  @ApiProperty({
    description: "Email address associated with the account",
    example: "user@telemetryflow.id",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * PasswordReminderResponseDto - Response DTO for password reminder
 */
export class PasswordReminderResponseDto {
  @ApiProperty({
    description: "Success message",
    example:
      "If an account exists with this email and has a password reminder set, it will be sent.",
  })
  message: string;
}
