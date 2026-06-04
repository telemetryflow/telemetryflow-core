/**
 * LLM Providers Controller
 * Manages LLM provider configurations
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../auth/guards/permissions.guard";
import { RequirePermissions } from "../../../auth/decorators/permissions.decorator";
import type { AuthenticatedUser } from "../../../auth/interfaces/jwt-payload.interface";
import {
  CreateLLMProviderRequestDto,
  UpdateLLMProviderRequestDto,
  ListLLMProvidersQueryDto,
  TestLLMProviderKeyDto,
} from "../dto";
import { LLMProviderRepository } from "../../infrastructure/repositories/LLMProvider.repository";
import { LLMEncryptionService } from "../../application/services/EncryptionService";
import { LLMAdapterFactory } from "../../infrastructure/providers/LLMAdapterFactory";
import { LLMProvider } from "../../domain/aggregates/LLMProvider";
import { UrlValidator } from "@/shared/security";
import {
  LLMProviderId,
  ProviderType,
  ModelConfig,
  EncryptedApiKey,
} from "../../domain/value-objects";

@ApiTags("llm-providers")
@ApiBearerAuth()
@Controller("llm/providers")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LLMProvidersController {
  constructor(
    private readonly providerRepo: LLMProviderRepository,
    private readonly encryptionService: LLMEncryptionService,
    private readonly adapterFactory: LLMAdapterFactory,
  ) {}

  @Post()
  @RequirePermissions("llm:write")
  @ApiOperation({
    summary: "Create LLM provider",
    description: "Create a new LLM provider configuration for the organization",
  })
  @ApiBody({ type: CreateLLMProviderRequestDto })
  @ApiResponse({ status: 201, description: "Provider created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async create(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: CreateLLMProviderRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    // Validate provider type is supported
    if (!this.adapterFactory.isSupported(dto.providerType)) {
      throw new BadRequestException(
        `Unsupported provider type: ${dto.providerType}`,
      );
    }

    // Custom provider requires base URL
    if (dto.providerType === "custom" && !dto.baseUrl) {
      throw new BadRequestException("Custom provider requires a base URL");
    }

    // Encrypt the API key
    const encryptedKey = this.encryptionService.encrypt(dto.apiKey);
    const keyHint = this.encryptionService.generateKeyHint(dto.apiKey);

    // If setting as default, clear existing default first
    if (dto.isDefault) {
      await this.providerRepo.clearDefaultForOrganization(
        req.user.organizationId,
      );
    }

    // Create the provider
    const provider = LLMProvider.create({
      organizationId: req.user.organizationId,
      name: dto.name,
      providerType: ProviderType.fromString(dto.providerType),
      encryptedApiKey: EncryptedApiKey.create(encryptedKey, keyHint),
      modelId: dto.modelId,
      modelConfig: {
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
        topP: dto.topP,
        samplingMode: dto.samplingMode as any,
      },
      baseUrl: dto.baseUrl,
      isDefault: dto.isDefault || false,
      createdBy: req.user.userId,
    });

    await this.providerRepo.save(provider);

    return this.toResponse(provider);
  }

  @Get()
  @RequirePermissions("llm:read")
  @ApiOperation({
    summary: "List LLM providers",
    description: "Get all LLM providers for the organization",
  })
  @ApiResponse({ status: 200, description: "List of providers" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async list(
    @Request() req: { user: AuthenticatedUser },
    @Query() queryDto: ListLLMProvidersQueryDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const result = await this.providerRepo.findByOrganization(
      req.user.organizationId,
      {
        page: queryDto.page,
        pageSize: queryDto.pageSize,
        isActive: queryDto.isActive,
        providerType: queryDto.providerType,
      },
    );

    return {
      items: result.items.map((p) => this.toResponse(p)),
      total: result.total,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
    };
  }

  @Get("default")
  @RequirePermissions("llm:read")
  @ApiOperation({
    summary: "Get default provider",
    description: "Get the default LLM provider for the organization",
  })
  @ApiResponse({ status: 200, description: "Default provider" })
  @ApiResponse({ status: 404, description: "No default provider configured" })
  async getDefault(@Request() req: { user: AuthenticatedUser }) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const provider = await this.providerRepo.findDefaultByOrganization(
      req.user.organizationId,
    );

    if (!provider) {
      throw new NotFoundException("No default LLM provider configured");
    }

    return this.toResponse(provider);
  }

  @Post("test-key")
  @RequirePermissions("llm:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Test API key",
    description:
      "Validate a raw API key against a provider type without needing a saved provider record",
  })
  @ApiBody({ type: TestLLMProviderKeyDto })
  @ApiResponse({ status: 200, description: "Validation result" })
  @ApiResponse({
    status: 400,
    description: "Invalid provider type or missing base URL",
  })
  async testKey(
    @Body() dto: TestLLMProviderKeyDto,
  ): Promise<{ valid: boolean; message: string }> {
    if (!this.adapterFactory.isSupported(dto.providerType)) {
      throw new BadRequestException(
        `Unsupported provider type: ${dto.providerType}`,
      );
    }

    if (
      (dto.providerType === "custom" || dto.providerType === "ollama") &&
      !dto.baseUrl
    ) {
      throw new BadRequestException(
        `Provider type "${dto.providerType}" requires a base URL`,
      );
    }

    let validatedBaseUrl = dto.baseUrl;

    if (dto.baseUrl) {
      await UrlValidator.validatePublicUrl(dto.baseUrl);

      if (dto.providerType === "ollama") {
        let parsed: URL;
        try {
          parsed = new URL(dto.baseUrl);
        } catch {
          throw new BadRequestException("Invalid Ollama base URL");
        }

        const host = parsed.hostname.toLowerCase();
        const isLocalHost =
          host === "localhost" || host === "127.0.0.1" || host === "::1";

        if (parsed.protocol !== "http:" || !isLocalHost) {
          throw new BadRequestException(
            "Invalid Ollama base URL: only local http://localhost/127.0.0.1/[::1] endpoints are allowed",
          );
        }

        const normalizedPath = parsed.pathname.replace(/\/+$/, "");
        if (!normalizedPath.endsWith("/v1")) {
          parsed.pathname = `${normalizedPath || ""}/v1`;
        }
        validatedBaseUrl = parsed.toString().replace(/\/+$/, "");
      }
    }

    const adapter = this.adapterFactory.getAdapter(
      dto.providerType,
      validatedBaseUrl,
    );

    try {
      const isValid = await adapter.validateApiKey(dto.apiKey);
      return {
        valid: isValid,
        message: isValid ? "API key is valid" : "API key is invalid",
      };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : "Validation failed",
      };
    }
  }

  @Get(":id")
  @RequirePermissions("llm:read")
  @ApiOperation({
    summary: "Get LLM provider",
    description: "Get LLM provider by ID",
  })
  @ApiParam({ name: "id", description: "Provider ID" })
  @ApiResponse({ status: 200, description: "Provider details" })
  @ApiResponse({ status: 404, description: "Provider not found" })
  async get(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const provider = await this.providerRepo.findById(id);

    if (!provider || provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    return this.toResponse(provider);
  }

  @Patch(":id")
  @RequirePermissions("llm:write")
  @ApiOperation({
    summary: "Update LLM provider",
    description: "Update LLM provider configuration",
  })
  @ApiParam({ name: "id", description: "Provider ID" })
  @ApiBody({ type: UpdateLLMProviderRequestDto })
  @ApiResponse({ status: 200, description: "Provider updated" })
  @ApiResponse({ status: 404, description: "Provider not found" })
  async update(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto: UpdateLLMProviderRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const provider = await this.providerRepo.findById(id);

    if (!provider || provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    // Update basic fields
    if (dto.name !== undefined) {
      provider.updateName(dto.name);
    }

    if (dto.modelId !== undefined) {
      provider.updateModel(dto.modelId);
    }

    if (dto.baseUrl !== undefined) {
      provider.updateBaseUrl(dto.baseUrl);
    }

    // Update model config
    if (
      dto.temperature !== undefined ||
      dto.maxTokens !== undefined ||
      dto.topP !== undefined ||
      dto.samplingMode !== undefined
    ) {
      const currentConfig = provider.getModelConfig();
      provider.updateModelConfig({
        temperature: dto.temperature ?? currentConfig.getTemperature(),
        maxTokens: dto.maxTokens ?? currentConfig.getMaxTokens(),
        topP: dto.topP ?? currentConfig.getTopP(),
        samplingMode: (dto.samplingMode as any) ?? currentConfig.getSamplingMode(),
      });
    }

    // Update API key if provided
    if (dto.apiKey) {
      const encryptedKey = this.encryptionService.encrypt(dto.apiKey);
      const keyHint = this.encryptionService.generateKeyHint(dto.apiKey);
      provider.updateApiKey(EncryptedApiKey.create(encryptedKey, keyHint));
    }

    // Update active status
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        provider.activate();
      } else {
        provider.deactivate();
      }
    }

    await this.providerRepo.save(provider);

    return this.toResponse(provider);
  }

  @Post(":id/set-default")
  @RequirePermissions("llm:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Set as default provider",
    description: "Set this provider as the default for the organization",
  })
  @ApiParam({ name: "id", description: "Provider ID" })
  @ApiResponse({ status: 200, description: "Provider set as default" })
  @ApiResponse({ status: 404, description: "Provider not found" })
  async setDefault(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const provider = await this.providerRepo.findById(id);

    if (!provider || provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    // Clear existing default
    await this.providerRepo.clearDefaultForOrganization(
      req.user.organizationId,
    );

    // Set new default
    provider.setAsDefault();
    await this.providerRepo.save(provider);

    return this.toResponse(provider);
  }

  @Post(":id/validate")
  @RequirePermissions("llm:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate API key",
    description: "Test if the provider API key is valid",
  })
  @ApiParam({ name: "id", description: "Provider ID" })
  @ApiResponse({ status: 200, description: "Validation result" })
  @ApiResponse({ status: 404, description: "Provider not found" })
  async validate(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const provider = await this.providerRepo.findById(id);

    if (!provider || provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    // Decrypt API key and validate
    const encryptedKey = provider.getEncryptedApiKey();
    const apiKey = this.encryptionService.decrypt(encryptedKey.getValue());

    const adapter = this.adapterFactory.getAdapter(
      provider.getProviderType().toString(),
      provider.getBaseUrl(),
    );

    try {
      const isValid = await adapter.validateApiKey(apiKey);
      return {
        valid: isValid,
        message: isValid ? "API key is valid" : "API key is invalid",
      };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : "Validation failed",
      };
    }
  }

  @Delete(":id")
  @RequirePermissions("llm:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete LLM provider",
    description: "Delete an LLM provider configuration",
  })
  @ApiParam({ name: "id", description: "Provider ID" })
  @ApiResponse({ status: 204, description: "Provider deleted" })
  @ApiResponse({ status: 404, description: "Provider not found" })
  async delete(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const provider = await this.providerRepo.findById(id);

    if (!provider || provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    await this.providerRepo.delete(id);
  }

  private toResponse(provider: LLMProvider) {
    const modelConfig = provider.getModelConfig();
    return {
      id: provider.getId(),
      organizationId: provider.getOrganizationId(),
      name: provider.getName(),
      providerType: provider.getProviderType().toString(),
      apiKeyHint: provider.getEncryptedApiKey().getHint(),
      modelId: provider.getModelId(),
      baseUrl: provider.getBaseUrl(),
      modelConfig: {
        temperature: modelConfig.getTemperature(),
        maxTokens: modelConfig.getMaxTokens(),
        topP: modelConfig.getTopP(),
        samplingMode: modelConfig.getSamplingMode(),
      },
      isDefault: provider.isDefault(),
      isActive: provider.isActive(),
      usageCount: provider.getUsageCount(),
      lastUsedAt: provider.getLastUsedAt(),
      createdAt: provider.getCreatedAt(),
      updatedAt: provider.getUpdatedAt(),
    };
  }
}
