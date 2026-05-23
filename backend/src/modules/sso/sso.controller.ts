import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { SsoService } from './sso.service';
import {
  CreateSsoProviderDto,
  UpdateSsoProviderDto,
  SsoProviderResponseDto,
  SsoConnectionResponseDto,
  SsoAuthResponseDto,
  SsoInitiateResponseDto,
  SsoCallbackDto,
} from './dto';

@ApiTags('sso')
@Controller('sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  // --- Public Endpoints ---

  @Get('providers/:organizationId/public')
  @ApiOperation({
    summary: 'List enabled SSO providers',
    description: 'Get enabled SSO providers for an organization (public)',
  })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, type: [SsoProviderResponseDto] })
  async listEnabledProviders(
    @Param('organizationId') organizationId: string,
  ): Promise<SsoProviderResponseDto[]> {
    return this.ssoService.listEnabledProviders(organizationId);
  }

  @Post('initiate')
  @ApiOperation({
    summary: 'Initiate SSO authentication',
    description: 'Start the SSO authentication flow',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', format: 'uuid' },
        providerId: { type: 'string' },
        redirectUrl: { type: 'string', format: 'uri' },
      },
      required: ['providerId'],
    },
  })
  @ApiResponse({ status: 200, type: SsoInitiateResponseDto })
  async initiateAuth(
    @Body() body: { organizationId?: string; providerId: string; redirectUrl?: string },
  ): Promise<SsoInitiateResponseDto> {
    return this.ssoService.initiateAuth(
      body.organizationId,
      body.providerId,
      body.redirectUrl,
    );
  }

  @Get('callback/:provider')
  @ApiOperation({
    summary: 'SSO callback (redirect)',
    description: 'Handle SSO callback and redirect to frontend',
  })
  @ApiParam({ name: 'provider', description: 'Provider name' })
  async callbackRedirect(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    try {
      const result = await this.ssoService.handleCallback(code, state);

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        is_new_user: result.isNewUser.toString(),
      });

      res.redirect(`${frontendUrl}/auth/sso/callback?${params.toString()}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      res.redirect(`${frontendUrl}/auth/sso/error?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'SSO callback (API)',
    description: 'Handle SSO callback and return tokens',
  })
  @ApiBody({ type: SsoCallbackDto })
  @ApiResponse({ status: 200, type: SsoAuthResponseDto })
  async callback(@Body() dto: SsoCallbackDto): Promise<SsoAuthResponseDto> {
    return this.ssoService.handleCallback(dto.code, dto.state);
  }

  // --- Admin Provider Management ---

  @Get('providers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('sso:read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List SSO providers',
    description: 'Get all SSO providers for the organization',
  })
  @ApiResponse({ status: 200, type: [SsoProviderResponseDto] })
  async listProviders(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<SsoProviderResponseDto[]> {
    if (!req.user.organizationId) {
      throw new BadRequestException('User must belong to an organization');
    }
    return this.ssoService.listProviders(req.user.organizationId);
  }

  @Post('providers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('sso:write')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create SSO provider',
    description: 'Create a new SSO provider for the organization',
  })
  @ApiBody({ type: CreateSsoProviderDto })
  @ApiResponse({ status: 201, type: SsoProviderResponseDto })
  async createProvider(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: CreateSsoProviderDto,
  ): Promise<SsoProviderResponseDto> {
    if (!req.user.organizationId) {
      throw new BadRequestException('User must belong to an organization');
    }
    return this.ssoService.createProvider(req.user.organizationId, dto);
  }

  @Get('providers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('sso:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get SSO provider', description: 'Get SSO provider by ID' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, type: SsoProviderResponseDto })
  async getProvider(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ): Promise<SsoProviderResponseDto> {
    if (!req.user.organizationId) {
      throw new BadRequestException('User must belong to an organization');
    }
    return this.ssoService.getProvider(req.user.organizationId, id);
  }

  @Patch('providers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('sso:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update SSO provider', description: 'Update SSO provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiBody({ type: UpdateSsoProviderDto })
  @ApiResponse({ status: 200, type: SsoProviderResponseDto })
  async updateProvider(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() dto: UpdateSsoProviderDto,
  ): Promise<SsoProviderResponseDto> {
    if (!req.user.organizationId) {
      throw new BadRequestException('User must belong to an organization');
    }
    return this.ssoService.updateProvider(req.user.organizationId, id, dto);
  }

  @Delete('providers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('sso:delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete SSO provider', description: 'Delete SSO provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 204, description: 'Provider deleted' })
  async deleteProvider(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ): Promise<void> {
    if (!req.user.organizationId) {
      throw new BadRequestException('User must belong to an organization');
    }
    await this.ssoService.deleteProvider(req.user.organizationId, id);
  }

  // --- User Connection Management ---

  @Get('connections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List user SSO connections',
    description: 'Get all SSO connections for the authenticated user',
  })
  @ApiResponse({ status: 200, type: [SsoConnectionResponseDto] })
  async listConnections(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<SsoConnectionResponseDto[]> {
    return this.ssoService.getUserConnections(req.user.userId);
  }

  @Delete('connections/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink SSO connection',
    description: 'Remove an SSO connection from the authenticated user',
  })
  @ApiParam({ name: 'id', description: 'Connection ID' })
  @ApiResponse({ status: 204, description: 'Connection removed' })
  async unlinkConnection(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ): Promise<void> {
    await this.ssoService.unlinkConnection(req.user.userId, id);
  }
}
