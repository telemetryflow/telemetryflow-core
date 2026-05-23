import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { SetupMFAQuery } from "../queries/SetupMFA.query";
import { MfaService } from "../../services/mfa.service";
import { SetupMfaResponseDto } from "../../dto/mfa.dto";

/**
 * SetupMFAHandler - Handles MFA setup query
 *
 * Responsibilities:
 * - Generate MFA secret key (base32 encoded)
 * - Create QR code URL for authenticator app setup
 * - Generate backup/recovery codes for account recovery
 * - Store temporary setup data for verification
 *
 * Requirements: 7.1, 7.8
 *
 * Property 19: MFA setup generates secrets
 * For any MFA setup request, the system should generate a secret key,
 * QR code, and backup codes.
 */
@QueryHandler(SetupMFAQuery)
@Injectable()
export class SetupMFAHandler implements IQueryHandler<SetupMFAQuery> {
  constructor(private readonly mfaService: MfaService) {}

  async execute(query: SetupMFAQuery): Promise<SetupMfaResponseDto> {
    // Delegate to MFA service which:
    // 1. Generates a random secret key (base32 encoded) - Requirement 7.1
    // 2. Creates TOTP URI and QR code URL - Requirement 7.1
    // 3. Generates backup codes - Requirement 7.8
    // 4. Stores temporary setup data for later verification
    return this.mfaService.setupMfa(query.userId);
  }
}
