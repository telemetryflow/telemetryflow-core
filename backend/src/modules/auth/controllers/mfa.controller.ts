import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { MfaService } from '../services/mfa.service';
import { SetupMFAQuery } from '../application/queries/SetupMFA.query';
import { EnableMFACommand } from '../application/commands/EnableMFA.command';
import { DisableMFACommand } from '../application/commands/DisableMFA.command';
import {
  SetupMfaResponseDto,
  VerifyMfaSetupDto,
  MfaStatusResponseDto,
  DisableMfaDto,
  RegenerateMfaCodesDto,
  RegenerateMfaCodesResponseDto,
} from '../dto/mfa.dto';

@ApiTags('auth-mfa')
@ApiBearerAuth()
@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get MFA status',
    description: 'Get the current MFA status for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'MFA status', type: MfaStatusResponseDto })
  async getStatus(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<MfaStatusResponseDto> {
    return this.mfaService.getMfaStatus(req.user.userId);
  }

  @Post('setup')
  @ApiOperation({
    summary: 'Initiate MFA setup',
    description: 'Start the MFA setup process. Returns secret and QR code for authenticator app.',
  })
  @ApiResponse({
    status: 200,
    description: 'MFA setup initiated',
    type: SetupMfaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'MFA already enabled' })
  async setup(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<SetupMfaResponseDto> {
    return this.queryBus.execute(new SetupMFAQuery(req.user.userId));
  }

  @Post('verify-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify MFA setup',
    description: 'Verify the TOTP code to complete MFA setup',
  })
  @ApiBody({ type: VerifyMfaSetupDto })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifySetup(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: VerifyMfaSetupDto,
  ): Promise<{ message: string }> {
    return this.commandBus.execute(
      new EnableMFACommand(
        req.user.userId,
        dto.code,
        req['ip'],
        req['headers']?.['user-agent'],
      ),
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable MFA',
    description: 'Disable MFA for the authenticated user. Requires password and TOTP code.',
  })
  @ApiBody({ type: DisableMfaDto })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code or MFA not enabled' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async disable(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: DisableMfaDto,
  ): Promise<{ message: string }> {
    return this.commandBus.execute(
      new DisableMFACommand(
        req.user.userId,
        dto.password,
        dto.code,
        req['ip'],
        req['headers']?.['user-agent'],
      ),
    );
  }

  @Post('recovery-codes/regenerate')
  @ApiOperation({
    summary: 'Regenerate recovery codes',
    description: 'Generate new recovery codes. Old codes will be invalidated.',
  })
  @ApiBody({ type: RegenerateMfaCodesDto })
  @ApiResponse({
    status: 200,
    description: 'New recovery codes generated',
    type: RegenerateMfaCodesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code or MFA not enabled' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async regenerateRecoveryCodes(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: RegenerateMfaCodesDto,
  ): Promise<RegenerateMfaCodesResponseDto> {
    return this.mfaService.regenerateRecoveryCodes(
      req.user.userId,
      dto.password,
      dto.code,
    );
  }
}
