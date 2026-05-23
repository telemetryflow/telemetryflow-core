/**
 * OpenAI Adapter
 * OpenAI/ChatGPT LLM provider implementation
 */

import { Injectable } from "@nestjs/common";
import OpenAI, { type ClientOptions } from "openai";
import {
  ILLMAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "./ILLMAdapter";

@Injectable()
export class OpenAIAdapter implements ILLMAdapter {
  readonly providerType = "openai";
  private customBaseUrl?: string;

  setBaseUrl(url: string): this {
    this.customBaseUrl = url;
    return this;
  }

  private createClient(apiKey: string): OpenAI {
    const options: ClientOptions = { apiKey };
    if (this.customBaseUrl) {
      options.baseURL = this.customBaseUrl;
    }
    return new OpenAI(options);
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = this.createClient(apiKey);
      await client.models.list();
      return true;
    } catch (error) {
      // 401 = definitively invalid key
      if (error instanceof OpenAI.AuthenticationError) {
        return false;
      }
      // Everything else (403 PermissionDenied, 429 RateLimit, network errors)
      // means the key is valid but some other condition failed
      return true;
    }
  }

  async chat(
    apiKey: string,
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const startTime = Date.now();
    const client = this.createClient(apiKey);

    const response = await client.chat.completions.create({
      model: options.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stopSequences,
    });

    const latencyMs = Date.now() - startTime;

    return {
      content: response.choices[0]?.message?.content || "",
      model: response.model,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
      finishReason: response.choices[0]?.finish_reason || "stop",
      latencyMs,
    };
  }

  async *chatStream(
    apiKey: string,
    options: ChatCompletionOptions,
  ): AsyncGenerator<string, ChatCompletionResult, unknown> {
    const startTime = Date.now();
    const client = this.createClient(apiKey);

    const stream = await client.chat.completions.create({
      model: options.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stopSequences,
      stream: true,
    });

    let fullContent = "";
    let finishReason = "stop";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullContent += delta;
        yield delta;
      }
      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason;
      }
    }

    const latencyMs = Date.now() - startTime;

    // Note: Token usage is not available in streaming mode for OpenAI
    // We estimate based on content length (rough approximation)
    const estimatedTokens = Math.ceil(fullContent.length / 4);

    return {
      content: fullContent,
      model: options.model,
      tokensUsed: {
        prompt: 0, // Not available in stream
        completion: estimatedTokens,
        total: estimatedTokens,
      },
      finishReason,
      latencyMs,
    };
  }

  async getAvailableModels(apiKey: string): Promise<string[]> {
    try {
      const client = this.createClient(apiKey);
      const response = await client.models.list();

      return response.data
        .filter(
          (m) =>
            m.id.startsWith("gpt-5.5-pro") ||
            m.id.startsWith("gpt-5") ||
            m.id.startsWith("gpt-4.1") ||
            m.id.startsWith("gpt-4.1-mini") ||
            m.id.startsWith("gpt-4o") ||
            m.id.startsWith("gpt-4-turbo") ||
            m.id.startsWith("gpt-4") ||
            m.id.startsWith("o3") ||
            m.id.startsWith("o1") ||
            m.id.startsWith("gpt-3.5-turbo")
        )
        .map((m) => m.id)
        .sort()
        .reverse(); // Newest models first
    } catch {
      // Return default list if API call fails
      // return [
      //   "claude-opus-4-7",
      //   "claude-opus-4-7-fast",
      //   "claude-opus-4-6",
      //   "claude-opus-4-6-fast",
      //   "claude-opus-4-5",
      //   "claude-sonnet-4-6",
      //   "claude-sonnet-4-5-20250929",
      //   "claude-haiku-4-5",
      //   "claude-haiku-4-5-20251001",
      //   "claude-sonnet-4-20250514",
      //   "gemini-3.5-flash",
      //   "gemini-3.1-flash-lite",
      //   "gemini-3.1-pro-preview",
      //   "gemini-3-flash-preview",
      //   "gemini-2.5-pro",
      //   "gemini-2.5-flash",
      //   "gemini-2.5-flash-lite",
      //   "gemini-2.0-flash",
      //   "gemini-2.0-flash-lite",
      //   "gemini-1.5-pro",
      //   "gpt-5.5-pro",
      //   "gpt-5.5",
      //   "gpt-5",
      //   "gpt-4.1",
      //   "gpt-4.1-mini",
      //   "gpt-4o",
      //   "gpt-4-turbo",
      //   "gpt-4",
      //   "o3",
      //   "o1",
      //   "gpt-3.5-turbo",
      //   "deepseek-v4-pro",
      //   "deepseek-v4-flash",
      //   "deepseek-v3.2-speciale",
      //   "deepseek-chat",
      //   "deepseek-v3.2",
      //   "deepseek-reasoner",
      //   "qwen3.6-max-preview",
      //   "qwen3.6-plus",
      //   "qwen3.6-flash",
      //   "qwen3.6-35b-a3b",
      //   "qwen3.6-27b",
      //   "qwen3.5-plus",
      //   "llama4:maverick-17b",
      //   "gemma4:26b",
      //   "qwen3:32b",
      //   "deepseek-r1:70b",
      //   "llama3.3:70b",
      //   "phi4:14b",
      //   "mistral-medium-2508",
      //   "mistral-large-2411",
      //   "mistral-small-2506",
      //   "codestral-2508",
      //   "devstral-small-2507",
      //   "ministral-3b-2410",
      //   "grok-4.20-0309-reasoning",
      //   "grok-4.20-0309-non-reasoning",
      //   "grok-4.20-multi-agent-0309",
      //   "grok-4-1-fast-reasoning",
      //   "grok-4-1-fast-non-reasoning",
      //   "grok-3",
      //   "kimi-k2.6",
      //   "kimi-k2.5",
      //   "moonshot-v1-128k",
      //   "moonshot-v1-32k",
      //   "kimi-k2-thinking",
      //   "kimi-k2-turbo-preview",
      //   "glm-5.1",
      //   "glm-5",
      //   "glm-4.7",
      //   "glm-4.5",
      //   "glm-4.5-air",
      //   "glm-4-flash",
      //   "mimo-v2-pro",
      //   "mimo-v2-flash",
      //   "mimo-v2-omni",
      //   "mimo-v2-tts",
      //   "mimo-7b",
      //   "mimo-vl-7b"
      // ];
      return [
        "gpt-5.5-pro",
        "gpt-5.5",
        "gpt-5",
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4o",
        "gpt-4-turbo",
        "gpt-4",
        "o3",
        "o1",
        "gpt-3.5-turbo"
      ];
    }
  }
}
