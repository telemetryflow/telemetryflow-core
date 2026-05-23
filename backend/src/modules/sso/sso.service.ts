import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { SsoProviderEntity } from "./infrastructure/entities/SsoProvider.entity";
import { SsoConnectionEntity } from "./infrastructure/entities/SsoConnection.entity";
import { UserEntity } from "../iam/infrastructure/persistence/entities/User.entity";
import { UserRoleEntity } from "../iam/infrastructure/persistence/entities/UserRole.entity";
import { OAuth2ProviderFactory } from "./providers/oauth2.provider";
import {
  SsoProviderConfig,
  SsoProviderType,
  SsoUserProfile,
  ISsoProvider,
} from "./interfaces";
import {
  CreateSsoProviderDto,
  UpdateSsoProviderDto,
  SsoProviderResponseDto,
  SsoConnectionResponseDto,
  SsoAuthResponseDto,
  SsoInitiateResponseDto,
} from "./dto";

interface PendingAuth {
  providerId: string;
  organizationId: string;
  redirectUrl?: string;
  nonce: string;
  createdAt: Date;
}

@Injectable()
export class SsoService {
  private pendingAuths: Map<string, PendingAuth> = new Map();

  constructor(
    @InjectRepository(SsoProviderEntity)
    private readonly providerRepository: Repository<SsoProviderEntity>,
    @InjectRepository(SsoConnectionEntity)
    private readonly connectionRepository: Repository<SsoConnectionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    private readonly oauth2Factory: OAuth2ProviderFactory,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // --- Provider Management ---

  async createProvider(
    organizationId: string,
    dto: CreateSsoProviderDto,
  ): Promise<SsoProviderResponseDto> {
    // Check for existing provider with same name
    const existing = await this.providerRepository.findOne({
      where: { organizationId, providerName: dto.providerName },
    });

    if (existing) {
      throw new BadRequestException(
        `SSO provider ${dto.providerName} already exists for this organization`,
      );
    }

    const callbackUrl = this.buildCallbackUrl(dto.providerName);

    const provider = this.providerRepository.create({
      organizationId,
      name: dto.name,
      providerType: dto.providerType,
      providerName: dto.providerName,
      enabled: false,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret,
      authorizationUrl: dto.authorizationUrl,
      tokenUrl: dto.tokenUrl,
      userInfoUrl: dto.userInfoUrl,
      scopes: dto.scopes || [],
      entityId: dto.entityId,
      ssoUrl: dto.ssoUrl,
      sloUrl: dto.sloUrl,
      certificate: dto.certificate,
      callbackUrl,
      allowedDomains: dto.allowedDomains || [],
      autoCreateUsers: dto.autoCreateUsers || false,
      defaultRoleId: dto.defaultRoleId,
      attributeMapping: dto.attributeMapping,
    });

    const saved = await this.providerRepository.save(provider);
    return this.toProviderResponse(saved);
  }

  async updateProvider(
    organizationId: string,
    providerId: string,
    dto: UpdateSsoProviderDto,
  ): Promise<SsoProviderResponseDto> {
    const provider = await this.findProviderOrFail(providerId, organizationId);

    Object.assign(provider, {
      ...dto,
      updatedAt: new Date(),
    });

    const saved = await this.providerRepository.save(provider);
    return this.toProviderResponse(saved);
  }

  async deleteProvider(
    organizationId: string,
    providerId: string,
  ): Promise<void> {
    const provider = await this.findProviderOrFail(providerId, organizationId);

    // Delete all connections for this provider
    await this.connectionRepository.delete({ providerId });

    await this.providerRepository.remove(provider);
  }

  async getProvider(
    organizationId: string,
    providerId: string,
  ): Promise<SsoProviderResponseDto> {
    const provider = await this.findProviderOrFail(providerId, organizationId);
    return this.toProviderResponse(provider);
  }

  async listProviders(
    organizationId: string,
  ): Promise<SsoProviderResponseDto[]> {
    const providers = await this.providerRepository.find({
      where: { organizationId },
      order: { createdAt: "DESC" },
    });

    return providers.map((p) => this.toProviderResponse(p));
  }

  async listEnabledProviders(
    organizationId: string,
  ): Promise<SsoProviderResponseDto[]> {
    const providers = await this.providerRepository.find({
      where: { organizationId, enabled: true },
      order: { name: "ASC" },
    });

    return providers.map((p) => this.toProviderResponse(p));
  }

  // --- SSO Authentication Flow ---

  async initiateAuth(
    organizationId: string | undefined,
    providerId: string,
    redirectUrl?: string,
  ): Promise<SsoInitiateResponseDto> {
    const provider = organizationId
      ? await this.findProviderOrFail(providerId, organizationId)
      : await this.findProviderById(providerId);

    if (!provider.enabled) {
      throw new BadRequestException("SSO provider is not enabled");
    }

    // Generate state and nonce
    const state = crypto.randomBytes(32).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    // Store pending auth (use provider's organizationId if not explicitly provided)
    this.pendingAuths.set(state, {
      providerId,
      organizationId: organizationId || provider.organizationId,
      redirectUrl,
      nonce,
      createdAt: new Date(),
    });

    // Clean up old pending auths (older than 10 minutes)
    this.cleanupPendingAuths();

    // Get authorization URL
    const ssoProvider = this.createSsoProvider(provider);
    const authorizationUrl = await ssoProvider.getAuthorizationUrl(
      state,
      nonce,
    );

    return {
      authorizationUrl,
      state,
    };
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<SsoAuthResponseDto> {
    // Validate state
    const pendingAuth = this.pendingAuths.get(state);
    if (!pendingAuth) {
      throw new UnauthorizedException(
        "Invalid or expired authentication state",
      );
    }

    // Check expiration (10 minutes)
    const age = Date.now() - pendingAuth.createdAt.getTime();
    if (age > 10 * 60 * 1000) {
      this.pendingAuths.delete(state);
      throw new UnauthorizedException("Authentication session expired");
    }

    // Clean up
    this.pendingAuths.delete(state);

    // Get provider
    const provider = await this.providerRepository.findOne({
      where: { id: pendingAuth.providerId },
    });

    if (!provider) {
      throw new NotFoundException("SSO provider not found");
    }

    // Handle callback with provider
    const ssoProvider = this.createSsoProvider(provider);
    const result = await ssoProvider.handleCallback(code, state);

    if (!result.success || !result.user) {
      throw new UnauthorizedException(
        result.error || "SSO authentication failed",
      );
    }

    // Validate email domain if configured
    if (provider.allowedDomains.length > 0) {
      const emailDomain = result.user.email.split("@")[1];
      if (!provider.allowedDomains.includes(emailDomain)) {
        throw new UnauthorizedException("Email domain not allowed");
      }
    }

    // Find or create user and connection
    const { user, isNewUser } = await this.findOrCreateUser(
      provider,
      result.user,
    );

    // Update or create connection
    await this.upsertConnection(provider, user.id, result.user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [], // Would need to fetch roles
        permissions: [], // Would need to fetch permissions
      },
    };
  }

  // --- Connection Management ---

  async getUserConnections(
    userId: string,
  ): Promise<SsoConnectionResponseDto[]> {
    const connections = await this.connectionRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    return connections.map((c) => this.toConnectionResponse(c));
  }

  async unlinkConnection(userId: string, connectionId: string): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new NotFoundException("Connection not found");
    }

    // Check if user has other login methods (password or other connections)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const otherConnections = await this.connectionRepository.count({
      where: { userId },
    });

    if (!user?.password && otherConnections <= 1) {
      throw new BadRequestException(
        "Cannot unlink the only authentication method. Please set a password first.",
      );
    }

    await this.connectionRepository.remove(connection);
  }

  // --- Private Methods ---

  private async findProviderOrFail(
    providerId: string,
    organizationId: string,
  ): Promise<SsoProviderEntity> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId, organizationId },
    });

    if (!provider) {
      throw new NotFoundException("SSO provider not found");
    }

    return provider;
  }

  /** Look up a provider by ID only (for public SSO initiate without org context). */
  private async findProviderById(
    providerId: string,
  ): Promise<SsoProviderEntity> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException("SSO provider not found");
    }

    return provider;
  }

  private createSsoProvider(entity: SsoProviderEntity): ISsoProvider {
    const config: SsoProviderConfig = {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      providerType: entity.providerType as SsoProviderType,
      providerName: entity.providerName,
      enabled: entity.enabled,
      clientId: entity.clientId || undefined,
      clientSecret: entity.clientSecret || undefined,
      authorizationUrl: entity.authorizationUrl || undefined,
      tokenUrl: entity.tokenUrl || undefined,
      userInfoUrl: entity.userInfoUrl || undefined,
      scopes: entity.scopes,
      entityId: entity.entityId || undefined,
      ssoUrl: entity.ssoUrl || undefined,
      sloUrl: entity.sloUrl || undefined,
      certificate: entity.certificate || undefined,
      callbackUrl: entity.callbackUrl || undefined,
      allowedDomains: entity.allowedDomains,
      autoCreateUsers: entity.autoCreateUsers,
      defaultRoleId: entity.defaultRoleId || undefined,
      attributeMapping: entity.attributeMapping || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    switch (entity.providerType) {
      case SsoProviderType.OAUTH2:
      case SsoProviderType.OIDC:
        return this.oauth2Factory.create(config);
      default:
        throw new BadRequestException(
          `Unsupported provider type: ${entity.providerType}`,
        );
    }
  }

  private async findOrCreateUser(
    provider: SsoProviderEntity,
    profile: SsoUserProfile,
  ): Promise<{ user: UserEntity; isNewUser: boolean }> {
    // Try to find by existing connection
    const existingConnection = await this.connectionRepository.findOne({
      where: {
        providerId: provider.id,
        externalId: profile.externalId,
      },
    });

    if (existingConnection) {
      const user = await this.userRepository.findOne({
        where: { id: existingConnection.userId },
      });
      if (user) {
        return { user, isNewUser: false };
      }
    }

    // Try to find by email
    let user = await this.userRepository.findOne({
      where: { email: profile.email, deletedAt: null },
    });

    if (user) {
      return { user, isNewUser: false };
    }

    // Create new user if allowed
    if (!provider.autoCreateUsers) {
      throw new UnauthorizedException(
        "User not found and automatic user creation is disabled",
      );
    }

    user = this.userRepository.create({
      email: profile.email,
      firstName:
        profile.firstName || profile.displayName?.split(" ")[0] || "User",
      lastName:
        profile.lastName ||
        profile.displayName?.split(" ").slice(1).join(" ") ||
        "",
      password: "", // No password for SSO users
      isActive: true,
      emailVerified: profile.emailVerified,
      email_verified_at: profile.emailVerified ? new Date() : undefined,
      organization_id: provider.organizationId,
      avatar: profile.avatar,
      locale: profile.locale,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign default role if configured
    if (provider.defaultRoleId) {
      await this.assignDefaultRole(savedUser.id, provider.defaultRoleId);
    }

    return { user: savedUser, isNewUser: true };
  }

  private async upsertConnection(
    provider: SsoProviderEntity,
    userId: string,
    profile: SsoUserProfile,
  ): Promise<SsoConnectionEntity> {
    let connection = await this.connectionRepository.findOne({
      where: {
        userId,
        providerId: provider.id,
      },
    });

    if (connection) {
      connection.email = profile.email;
      connection.displayName = profile.displayName || null;
      connection.lastLoginAt = new Date();
    } else {
      connection = this.connectionRepository.create({
        userId,
        providerId: provider.id,
        providerType: provider.providerType,
        providerName: provider.providerName,
        externalId: profile.externalId,
        email: profile.email,
        displayName: profile.displayName || null,
        lastLoginAt: new Date(),
      });
    }

    return this.connectionRepository.save(connection);
  }

  private async generateTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: [],
      permissions: [],
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
    };

    const expiresIn = 86400; // 24 hours
    const accessToken = this.jwtService.sign(payload, { expiresIn });
    const refreshToken = crypto.randomBytes(64).toString("base64url");

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: "Bearer",
    };
  }

  private buildCallbackUrl(providerName: string): string {
    const baseUrl =
      this.configService.get<string>("APP_URL") || "http://localhost:3000";
    return `${baseUrl}/api/sso/callback/${providerName}`;
  }

  private cleanupPendingAuths(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [state, auth] of this.pendingAuths.entries()) {
      if (now - auth.createdAt.getTime() > maxAge) {
        this.pendingAuths.delete(state);
      }
    }
  }

  private toProviderResponse(
    entity: SsoProviderEntity,
  ): SsoProviderResponseDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      providerType: entity.providerType as SsoProviderType,
      providerName: entity.providerName,
      enabled: entity.enabled,
      clientId: entity.clientId
        ? `${entity.clientId.substring(0, 8)}...`
        : undefined,
      callbackUrl: entity.callbackUrl || undefined,
      allowedDomains: entity.allowedDomains,
      autoCreateUsers: entity.autoCreateUsers,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toConnectionResponse(
    entity: SsoConnectionEntity,
  ): SsoConnectionResponseDto {
    return {
      id: entity.id,
      providerType: entity.providerType as SsoProviderType,
      providerName: entity.providerName,
      email: entity.email,
      displayName: entity.displayName || undefined,
      lastLoginAt: entity.lastLoginAt || undefined,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Assign default role to a newly created SSO user
   * @param userId - User ID
   * @param roleId - Role ID to assign
   */
  private async assignDefaultRole(
    userId: string,
    roleId: string,
  ): Promise<void> {
    // Check if role assignment already exists
    const existingAssignment = await this.userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId },
    });

    if (existingAssignment) {
      return; // Role already assigned
    }

    // Create new role assignment
    const userRole = this.userRoleRepository.create({
      user_id: userId,
      role_id: roleId,
      assigned_by: null, // System-assigned via SSO
      assigned_at: new Date(),
      expires_at: null, // No expiration for SSO default roles
    });

    await this.userRoleRepository.save(userRole);
  }
}
