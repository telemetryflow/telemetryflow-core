/**
 * Custom Adapter
 * OpenAI-compatible custom LLM provider implementation
 */

import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import {
  ILLMAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatMessage,
} from "./ILLMAdapter";

@Injectable()
export class CustomAdapter implements ILLMAdapter {
  readonly providerType = "custom";
  private baseUrl: string = "";

  /**
   * Set the base URL for the custom provider
   */
  setBaseUrl(baseUrl: string): CustomAdapter {
    this.baseUrl = baseUrl;
    return this;
  }

  async validateApiKey(apiKey: string, baseUrl?: string): Promise<boolean> {
    const url = baseUrl || this.baseUrl;
    if (!url) {
      throw new Error("Base URL is required for custom provider");
    }

    try {
      const client = new OpenAI({
        apiKey,
        baseURL: url,
      });
      // Try to list models or make a minimal request
      await client.models.list();
      return true;
    } catch (error: unknown) {
      // Check for authentication errors
      if (error instanceof OpenAI.AuthenticationError) {
        return false;
      }
      // For rate limits or other errors, the key might still be valid
      if (error instanceof OpenAI.RateLimitError) {
        return true;
      }
      // If models.list fails, try a minimal chat completion as fallback
      try {
        const fallbackClient = new OpenAI({
          apiKey,
          baseURL: url,
        });
        await fallbackClient.chat.completions.create({
          model: "gpt-3.5-turbo", // Most compatible default
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        });
        return true;
      } catch (innerError: unknown) {
        // Only return false for definitive auth failure
        if (innerError instanceof OpenAI.AuthenticationError) {
          return false;
        }
        // Network errors, model-not-found, rate limits — key may still be valid
        return true;
      }
    }
  }

  async chat(
    apiKey: string,
    options: ChatCompletionOptions,
    baseUrl?: string,
  ): Promise<ChatCompletionResult> {
    const url = baseUrl || this.baseUrl;
    if (!url) {
      throw new Error("Base URL is required for custom provider");
    }

    const startTime = Date.now();
    const client = new OpenAI({
      apiKey,
      baseURL: url,
    });

    const response = await client.chat.completions.create({
      model: options.model,
      messages: this.convertMessages(options.messages),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stopSequences,
    });

    const latencyMs = Date.now() - startTime;
    const choice = response.choices[0];

    return {
      content: choice.message.content || "",
      model: response.model,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason || "stop",
      latencyMs,
    };
  }

  async *chatStream(
    apiKey: string,
    options: ChatCompletionOptions,
    baseUrl?: string,
  ): AsyncGenerator<string, ChatCompletionResult, unknown> {
    const url = baseUrl || this.baseUrl;
    if (!url) {
      throw new Error("Base URL is required for custom provider");
    }

    const startTime = Date.now();
    const client = new OpenAI({
      apiKey,
      baseURL: url,
    });

    const stream = await client.chat.completions.create({
      model: options.model,
      messages: this.convertMessages(options.messages),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stopSequences,
      stream: true,
    });

    let fullContent = "";
    let model = options.model;
    let finishReason = "stop";
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        yield delta.content;
      }
      if (chunk.model) {
        model = chunk.model;
      }
      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason;
      }
      // Some providers include usage in stream chunks
      if (
        (
          chunk as {
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          }
        ).usage
      ) {
        const usage = (
          chunk as {
            usage: { prompt_tokens?: number; completion_tokens?: number };
          }
        ).usage;
        promptTokens = usage.prompt_tokens || promptTokens;
        completionTokens = usage.completion_tokens || completionTokens;
      }
    }

    const latencyMs = Date.now() - startTime;

    // Estimate tokens if not provided
    if (!promptTokens) {
      promptTokens = Math.ceil(
        options.messages.reduce((acc, m) => acc + m.content.length, 0) / 4,
      );
    }
    if (!completionTokens) {
      completionTokens = Math.ceil(fullContent.length / 4);
    }

    return {
      content: fullContent,
      model,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      finishReason,
      latencyMs,
    };
  }

  async getAvailableModels(
    apiKey: string,
    baseUrl?: string,
  ): Promise<string[]> {
    const url = baseUrl || this.baseUrl;
    if (!url) {
      return [];
    }

    try {
      const client = new OpenAI({
        apiKey,
        baseURL: url,
      });
      const response = await client.models.list();
      return response.data.map((m) => m.id);
    } catch {
      // Return empty if models endpoint not available
      return [];
    }
  }

  private convertMessages(
    messages: ChatMessage[],
  ): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }
}
