/**
 * Insights Controller
 * Generates AI-powered observability insights
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../auth/guards/permissions.guard";
import { RequirePermissions } from "../../../auth/decorators/permissions.decorator";
import { LLMRateLimiterGuard, LLMRateLimit } from "../../infrastructure/guards";
import type { AuthenticatedUser } from "../../../auth/interfaces/jwt-payload.interface";
import { GenerateInsightRequestDto } from "../dto";
import { LLMProviderRepository } from "../../infrastructure/repositories/LLMProvider.repository";
import { LLMEncryptionService } from "../../application/services/EncryptionService";
import {
  PromptBuilderService,
  TelemetryContext,
} from "../../application/services/PromptBuilder.service";
import { LLMAdapterFactory } from "../../infrastructure/providers/LLMAdapterFactory";
import type { ChatMessage } from "../../infrastructure/providers/ILLMAdapter";

@ApiTags("llm-insights")
@ApiBearerAuth()
@Controller("llm/insights")
@UseGuards(JwtAuthGuard, PermissionsGuard, LLMRateLimiterGuard)
@LLMRateLimit(50) // Lower rate limit for insight generation (more expensive)
export class InsightsController {
  constructor(
    private readonly providerRepo: LLMProviderRepository,
    private readonly encryptionService: LLMEncryptionService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly adapterFactory: LLMAdapterFactory,
  ) {}

  @Post("generate")
  @RequirePermissions("llm:insights")
  @ApiOperation({
    summary: "Generate insight",
    description: "Generate an AI-powered insight based on context",
  })
  @ApiBody({ type: GenerateInsightRequestDto })
  @ApiResponse({ status: 200, description: "Generated insight" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  async generateInsight(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: GenerateInsightRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    // Get provider
    const provider = dto.providerId
      ? await this.providerRepo.findById(dto.providerId)
      : await this.providerRepo.findDefaultByOrganization(
          req.user.organizationId,
        );

    if (!provider) {
      throw new BadRequestException(
        "No LLM provider configured. Please configure one in Settings > AI Assistant.",
      );
    }

    if (provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    if (!provider.isActive()) {
      throw new BadRequestException("LLM provider is not active");
    }

    // Build context
    const timeRange = {
      from: dto.timeFrom
        ? new Date(dto.timeFrom)
        : new Date(Date.now() - 24 * 60 * 60 * 1000),
      to: dto.timeTo ? new Date(dto.timeTo) : new Date(),
    };

    // In a real implementation, this would fetch actual telemetry data
    // For now, we'll use the additional context or a placeholder
    const telemetryContext: TelemetryContext = {
      type: dto.contextType,
      timeRange,
      summary: `Analysis requested for ${dto.contextType} from ${timeRange.from.toISOString()} to ${timeRange.to.toISOString()}`,
      data: dto.additionalContext || {
        note: "Context data would be fetched from telemetry services",
      },
    };

    // Build prompts
    const systemPrompt = this.promptBuilder.buildSystemPrompt(dto.contextType);
    const insightPrompt = this.promptBuilder.buildInsightPrompt(
      dto.insightType,
      telemetryContext,
    );

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: insightPrompt },
    ];

    // Get adapter and generate insight
    const adapter = this.adapterFactory.getAdapter(
      provider.getProviderType().toString(),
      provider.getBaseUrl(),
    );
    const apiKey = this.encryptionService.decrypt(
      provider.getEncryptedApiKey().getValue(),
    );
    const modelConfig = provider.getModelConfig();

    const startTime = Date.now();
    const result = await adapter.chat(apiKey, {
      model: provider.getModelId(),
      messages: chatMessages,
      temperature: modelConfig.getTemperature(),
      maxTokens: modelConfig.getMaxTokens(),
      topP: modelConfig.getTopP(),
    });
    const latencyMs = Date.now() - startTime;

    // Update provider usage
    provider.recordUsage();
    await this.providerRepo.save(provider);

    return {
      insightType: dto.insightType,
      contextType: dto.contextType,
      timeRange,
      content: result.content,
      modelId: provider.getModelId(),
      tokensUsed: result.tokensUsed,
      latencyMs,
      generatedAt: new Date().toISOString(),
    };
  }

  @Post("chronology")
  @RequirePermissions("llm:insights")
  @ApiOperation({
    summary: "Generate incident chronology",
    description: "Generate a chronological analysis of an incident",
  })
  @ApiResponse({ status: 200, description: "Incident chronology" })
  async generateChronology(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: Omit<GenerateInsightRequestDto, "insightType">,
  ) {
    return this.generateInsight(req, { ...dto, insightType: "chronology" });
  }

  @Post("root-cause")
  @RequirePermissions("llm:insights")
  @ApiOperation({
    summary: "Root cause analysis",
    description: "Perform root cause analysis on an incident or issue",
  })
  @ApiResponse({ status: 200, description: "Root cause analysis" })
  async generateRootCause(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: Omit<GenerateInsightRequestDto, "insightType">,
  ) {
    return this.generateInsight(req, { ...dto, insightType: "root-cause" });
  }

  @Post("predict")
  @RequirePermissions("llm:insights")
  @ApiOperation({
    summary: "Predictive analysis",
    description: "Predict potential issues based on current patterns",
  })
  @ApiResponse({ status: 200, description: "Predictive analysis" })
  async generatePrediction(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: Omit<GenerateInsightRequestDto, "insightType">,
  ) {
    return this.generateInsight(req, { ...dto, insightType: "prediction" });
  }

  @Post("recommend")
  @RequirePermissions("llm:insights")
  @ApiOperation({
    summary: "Get recommendations",
    description: "Get actionable recommendations based on telemetry data",
  })
  @ApiResponse({ status: 200, description: "Recommendations" })
  async generateRecommendations(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: Omit<GenerateInsightRequestDto, "insightType">,
  ) {
    return this.generateInsight(req, { ...dto, insightType: "recommendation" });
  }

  @Post("patterns")
  @RequirePermissions("llm:insights")
  @ApiOperation({
    summary: "Detect patterns",
    description: "Identify patterns and anomalies in telemetry data",
  })
  @ApiResponse({ status: 200, description: "Pattern analysis" })
  async detectPatterns(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: Omit<GenerateInsightRequestDto, "insightType">,
  ) {
    return this.generateInsight(req, { ...dto, insightType: "pattern" });
  }
}
