import { IsString, IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DeactivateAdministratorDto - Request DTO for administrator deactivation
 *
 * Requirements: 14.1, 14.3, 14.7
 */
export class DeactivateAdministratorDto {
  @ApiProperty({
    description: "ID of the administrator to deactivate",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID("4", { message: "Administrator ID must be a valid UUID" })
  @IsNotEmpty({ message: "Administrator ID is required" })
  adminUserId: string;

  @ApiProperty({
    description: "Ticket reference for audit trail",
    example: "TICKET-12345",
  })
  @IsString()
  @IsNotEmpty({ message: "Ticket reference is required" })
  ticketRef: string;
}

/**
 * ReactivateAdministratorDto - Request DTO for administrator reactivation
 *
 * Requirements: 14.2
 */
export class ReactivateAdministratorDto {
  @ApiProperty({
    description: "ID of the administrator to reactivate",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID("4", { message: "Administrator ID must be a valid UUID" })
  @IsNotEmpty({ message: "Administrator ID is required" })
  adminUserId: string;
}

/**
 * AdminManagementResponseDto - Response DTO for admin management operations
 */
export class AdminManagementResponseDto {
  @ApiProperty({
    description: "Success message",
    example: "Administrator account deactivated successfully",
  })
  message: string;

  @ApiProperty({
    description: "Timestamp of the operation",
    example: "2024-01-15T10:30:00Z",
  })
  timestamp: string;
}
