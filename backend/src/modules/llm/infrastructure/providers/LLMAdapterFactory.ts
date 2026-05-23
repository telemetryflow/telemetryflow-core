/**
 * LLM Adapter Factory
 * Creates the appropriate LLM adapter based on provider type
 */

import { Injectable } from "@nestjs/common";
import { ILLMAdapter, ILLMAdapterFactory } from "./ILLMAdapter";
import { ClaudeAdapter } from "./ClaudeAdapter";
import { OpenAIAdapter } from "./OpenAIAdapter";
import { GeminiAdapter } from "./GeminiAdapter";
import { DeepSeekAdapter } from "./DeepSeekAdapter";
import { QwenAdapter } from "./QwenAdapter";
import { OllamaAdapter } from "./OllamaAdapter";
import { CustomAdapter } from "./CustomAdapter";
import {
  ProviderTypeEnum,
  ProviderType,
} from "../../domain/value-objects/ProviderType";

@Injectable()
export class LLMAdapterFactory implements ILLMAdapterFactory {
  private readonly adapters: Map<string, ILLMAdapter>;

  constructor(
    private readonly claudeAdapter: ClaudeAdapter,
    private readonly openaiAdapter: OpenAIAdapter,
    private readonly geminiAdapter: GeminiAdapter,
    private readonly deepseekAdapter: DeepSeekAdapter,
    private readonly qwenAdapter: QwenAdapter,
    private readonly ollamaAdapter: OllamaAdapter,
    private readonly customAdapter: CustomAdapter,
  ) {
    this.adapters = new Map<string, ILLMAdapter>([
      [ProviderTypeEnum.ANTHROPIC, this.claudeAdapter],
      [ProviderTypeEnum.CLAUDE, this.claudeAdapter],
      [ProviderTypeEnum.OPENAI, this.openaiAdapter],
      [ProviderTypeEnum.GOOGLE, this.geminiAdapter],
      [ProviderTypeEnum.GEMINI, this.geminiAdapter],
      [ProviderTypeEnum.DEEPSEEK, this.deepseekAdapter],
      [ProviderTypeEnum.QWEN, this.qwenAdapter],
      [ProviderTypeEnum.OLLAMA, this.ollamaAdapter],
      // OpenAI-compatible providers
      [ProviderTypeEnum.MISTRAL, this.openaiAdapter],
      [ProviderTypeEnum.GROK, this.openaiAdapter],
      [ProviderTypeEnum.KIMI, this.openaiAdapter],
      [ProviderTypeEnum.ZIPU, this.openaiAdapter],
      [ProviderTypeEnum.MIMO, this.openaiAdapter],
      [ProviderTypeEnum.OPENROUTER, this.openaiAdapter],
    ]);
  }

  private static readonly OPENAI_COMPATIBLE = new Set([
    ProviderTypeEnum.MISTRAL,
    ProviderTypeEnum.GROK,
    ProviderTypeEnum.KIMI,
    ProviderTypeEnum.ZIPU,
    ProviderTypeEnum.MIMO,
    ProviderTypeEnum.OPENROUTER,
  ]);

  getAdapter(providerType: string, baseUrl?: string): ILLMAdapter {
    const normalizedType = providerType.toLowerCase();

    // For custom providers, use CustomAdapter with the provided base URL
    if (normalizedType === ProviderTypeEnum.CUSTOM) {
      if (!baseUrl) {
        throw new Error("Custom provider requires a base URL");
      }
      return this.customAdapter.setBaseUrl(baseUrl);
    }

    // For Ollama, set baseUrl if provided (otherwise uses default localhost:11434)
    if (normalizedType === ProviderTypeEnum.OLLAMA) {
      if (baseUrl) {
        return this.ollamaAdapter.setBaseUrl(baseUrl);
      }
      return this.ollamaAdapter;
    }

    // For OpenAI-compatible providers, resolve base URL and configure adapter
    if (
      LLMAdapterFactory.OPENAI_COMPATIBLE.has(
        normalizedType as ProviderTypeEnum,
      )
    ) {
      const resolvedUrl =
        baseUrl || ProviderType.fromString(normalizedType).getDefaultBaseUrl();
      return this.openaiAdapter.setBaseUrl(resolvedUrl);
    }

    const adapter = this.adapters.get(normalizedType);
    if (!adapter) {
      throw new Error(`Unsupported provider type: ${providerType}`);
    }

    return adapter;
  }

  isSupported(providerType: string): boolean {
    const normalizedType = providerType.toLowerCase();
    return (
      this.adapters.has(normalizedType) ||
      normalizedType === ProviderTypeEnum.CUSTOM
    );
  }

  getSupportedProviders(): string[] {
    return [
      ProviderTypeEnum.ANTHROPIC,
      ProviderTypeEnum.OPENAI,
      ProviderTypeEnum.GOOGLE,
      ProviderTypeEnum.DEEPSEEK,
      ProviderTypeEnum.QWEN,
      ProviderTypeEnum.OLLAMA,
      ProviderTypeEnum.MISTRAL,
      ProviderTypeEnum.GROK,
      ProviderTypeEnum.KIMI,
      ProviderTypeEnum.ZIPU,
      ProviderTypeEnum.MIMO,
      ProviderTypeEnum.OPENROUTER,
      ProviderTypeEnum.CUSTOM,
    ];
  }
}
