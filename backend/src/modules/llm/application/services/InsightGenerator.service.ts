/**
 * Insight Generator Service
 * Orchestrates AI-powered insight generation using LLM providers
 */

import { Injectable, Logger, Inject } from "@nestjs/common";
import {
  LLMAdapterFactory,
  ChatCompletionOptions,
} from "../../infrastructure/providers";
import {
  LLM_PROVIDER_REPOSITORY,
  ILLMProviderRepository,
} from "../../domain/repositories";
import {
  PromptBuilderService,
  TelemetryContext,
} from "./PromptBuilder.service";
import {
  ContextCollectorService,
  CollectContextOptions,
} from "./ContextCollector.service";
import type { ContextType } from "../../domain/aggregates/Conversation";

export type InsightType =
  | "chronology"
  | "prediction"
  | "recommendation"
  | "root-cause"
  | "pattern"
  | "summary"
  | "analysis";

export interface GenerateInsightOptions {
  organizationId: string;
  userId: string;
  insightType: InsightType;
  contextType: ContextType;
  contextId?: string;
  timeRange?: { from: Date; to: Date };
  providerId?: string;
  customPrompt?: string;
}

export interface InsightResult {
  insight: string;
  insightType: InsightType;
  contextType: ContextType;
  providerId: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
  context: TelemetryContext;
  generatedAt: Date;
}

export interface StreamingInsightOptions extends GenerateInsightOptions {
  onChunk: (chunk: string) => void;
}

@Injectable()
export class InsightGeneratorService {
  private readonly logger = new Logger(InsightGeneratorService.name);

  constructor(
    @Inject(LLM_PROVIDER_REPOSITORY)
    private readonly providerRepository: ILLMProviderRepository,
    private readonly adapterFactory: LLMAdapterFactory,
    private readonly promptBuilder: PromptBuilderService,
    private readonly contextCollector: ContextCollectorService,
  ) {}

  /**
   * Generate an AI insight based on the telemetry context
   */
  async generateInsight(
    options: GenerateInsightOptions,
  ): Promise<InsightResult> {
    const startTime = Date.now();
    this.logger.debug(
      `Generating ${options.insightType} insight for ${options.contextType}`,
    );

    // 1. Get the LLM provider (use specified or default)
    const provider = options.providerId
      ? await this.providerRepository.findById(options.providerId)
      : await this.providerRepository.findDefaultByOrganization(
          options.organizationId,
        );

    if (!provider) {
      throw new Error(
        "No LLM provider configured. Please add an LLM provider in settings.",
      );
    }

    // 2. Collect telemetry context
    const context = await this.contextCollector.collectContext({
      organizationId: options.organizationId,
      contextType: options.contextType,
      contextId: options.contextId,
      timeRange: options.timeRange,
    });

    // 3. Build prompts
    const systemPrompt = this.promptBuilder.buildSystemPrompt(
      options.contextType,
      options.customPrompt,
    );

    const userPrompt = this.buildUserPrompt(options.insightType, context);

    // 4. Get the appropriate adapter
    const adapter = this.adapterFactory.getAdapter(
      provider.getProviderType().toString(),
      provider.getBaseUrl(),
    );

    // 5. Build chat options and call the LLM
    const modelConfig = provider.getModelConfig();

    const chatOptions: ChatCompletionOptions = {
      model: provider.getModelId(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: modelConfig.getTemperature() || 0.7,
      maxTokens: modelConfig.getMaxTokens() || 2048,
      topP: modelConfig.getTopP() || 0.9,
      samplingMode: modelConfig.getSamplingMode(),
    };

    const result = await adapter.chat(
      provider.getEncryptedApiKey().getValue(),
      chatOptions,
    );

    // 6. Update provider usage stats
    provider.recordUsage();
    await this.providerRepository.save(provider);

    const totalLatency = Date.now() - startTime;
    this.logger.debug(`Insight generated in ${totalLatency}ms`);

    return {
      insight: result.content,
      insightType: options.insightType,
      contextType: options.contextType,
      providerId: provider.getId(),
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: totalLatency,
      context,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate insight with streaming response
   */
  async *generateInsightStream(
    options: GenerateInsightOptions,
  ): AsyncGenerator<string, InsightResult, unknown> {
    const startTime = Date.now();
    this.logger.debug(
      `Streaming ${options.insightType} insight for ${options.contextType}`,
    );

    // 1. Get the LLM provider
    const provider = options.providerId
      ? await this.providerRepository.findById(options.providerId)
      : await this.providerRepository.findDefaultByOrganization(
          options.organizationId,
        );

    if (!provider) {
      throw new Error(
        "No LLM provider configured. Please add an LLM provider in settings.",
      );
    }

    // 2. Collect context
    const context = await this.contextCollector.collectContext({
      organizationId: options.organizationId,
      contextType: options.contextType,
      contextId: options.contextId,
      timeRange: options.timeRange,
    });

    // 3. Build prompts
    const systemPrompt = this.promptBuilder.buildSystemPrompt(
      options.contextType,
      options.customPrompt,
    );
    const userPrompt = this.buildUserPrompt(options.insightType, context);

    // 4. Get adapter and call LLM with streaming
    const adapter = this.adapterFactory.getAdapter(
      provider.getProviderType().toString(),
      provider.getBaseUrl(),
    );
    const modelConfig = provider.getModelConfig();

    const chatOptions: ChatCompletionOptions = {
      model: provider.getModelId(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: modelConfig.getTemperature() || 0.7,
      maxTokens: modelConfig.getMaxTokens() || 2048,
      topP: modelConfig.getTopP() || 0.9,
      samplingMode: modelConfig.getSamplingMode(),
    };

    const streamGenerator = adapter.chatStream(
      provider.getEncryptedApiKey().getValue(),
      chatOptions,
    );

    // Stream the chunks
    let fullContent = "";
    let result: any;

    for await (const chunk of streamGenerator) {
      fullContent += chunk;
      yield chunk;
    }

    // Get the final result from the generator
    try {
      result = await streamGenerator.next();
    } catch {
      // Generator already finished
    }

    // Update provider usage stats
    provider.recordUsage();
    await this.providerRepository.save(provider);

    const totalLatency = Date.now() - startTime;

    return {
      insight: fullContent,
      insightType: options.insightType,
      contextType: options.contextType,
      providerId: provider.getId(),
      model: provider.getModelId(),
      tokensUsed: result?.value?.tokensUsed || {
        prompt: 0,
        completion: 0,
        total: 0,
      },
      latencyMs: totalLatency,
      context,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate a quick summary of the current context
   */
  async generateQuickSummary(
    organizationId: string,
    contextType: ContextType,
    contextId?: string,
  ): Promise<string> {
    const result = await this.generateInsight({
      organizationId,
      userId: "system",
      insightType: "summary",
      contextType,
      contextId,
    });

    return result.insight;
  }

  /**
   * Generate incident chronology
   */
  async generateChronology(
    organizationId: string,
    userId: string,
    contextType: ContextType,
    timeRange: { from: Date; to: Date },
  ): Promise<InsightResult> {
    return this.generateInsight({
      organizationId,
      userId,
      insightType: "chronology",
      contextType,
      timeRange,
    });
  }

  /**
   * Generate root cause analysis
   */
  async generateRootCauseAnalysis(
    organizationId: string,
    userId: string,
    contextType: ContextType,
    contextId?: string,
  ): Promise<InsightResult> {
    return this.generateInsight({
      organizationId,
      userId,
      insightType: "root-cause",
      contextType,
      contextId,
    });
  }

  /**
   * Generate predictive analysis
   */
  async generatePrediction(
    organizationId: string,
    userId: string,
    contextType: ContextType,
  ): Promise<InsightResult> {
    return this.generateInsight({
      organizationId,
      userId,
      insightType: "prediction",
      contextType,
    });
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(
    organizationId: string,
    userId: string,
    contextType: ContextType,
    contextId?: string,
  ): Promise<InsightResult> {
    return this.generateInsight({
      organizationId,
      userId,
      insightType: "recommendation",
      contextType,
      contextId,
    });
  }

  /**
   * Build user prompt based on insight type
   */
  private buildUserPrompt(
    insightType: InsightType,
    context: TelemetryContext,
  ): string {
    const contextPrompt = this.promptBuilder.buildContextPrompt(context);

    const insightInstructions: Record<InsightType, string> = {
      chronology: `Based on the provided context, create a detailed timeline of events. Include:
1. **Event Timeline** - Chronological list of significant events
2. **Sequence Analysis** - How events relate to each other
3. **Cascade Effects** - Any chain reactions identified
4. **Resolution Status** - Current state and any actions taken`,

      prediction: `Based on the provided context, predict potential issues:
1. **Risk Assessment** - Likely problems that may arise
2. **Early Warning Signs** - Indicators to watch for
3. **Probability Analysis** - Likelihood of predicted issues
4. **Preventive Actions** - Steps to avoid predicted problems`,

      recommendation: `Provide actionable recommendations based on the context:
1. **Immediate Actions** - What needs attention right now
2. **Short-term Improvements** - Changes for the next few days
3. **Long-term Optimizations** - Strategic improvements
4. **Priority Ranking** - Order of importance`,

      "root-cause": `Perform root cause analysis:
1. **Primary Root Cause** - The fundamental source of the issue
2. **Contributing Factors** - Secondary causes and influences
3. **Evidence** - Data points supporting this analysis
4. **Prevention Strategy** - How to prevent recurrence`,

      pattern: `Identify patterns in the data:
1. **Detected Patterns** - Recurring behaviors or anomalies
2. **Frequency Analysis** - How often patterns occur
3. **Impact Assessment** - Effect of these patterns
4. **Correlation Analysis** - Relationships between patterns`,

      summary: `Provide a concise summary of the current state:
1. **Current Status** - Overall health and status
2. **Key Metrics** - Important numbers at a glance
3. **Notable Events** - Anything requiring attention
4. **Recommendations** - Quick wins if applicable`,

      analysis: `Perform a comprehensive analysis:
1. **Overview** - High-level assessment
2. **Detailed Findings** - In-depth examination
3. **Trends** - Patterns over time
4. **Action Items** - Next steps to consider`,
    };

    return `${contextPrompt}

## Analysis Request

${insightInstructions[insightType]}

Please structure your response clearly using markdown formatting. Be specific and actionable in your analysis.`;
  }
}
