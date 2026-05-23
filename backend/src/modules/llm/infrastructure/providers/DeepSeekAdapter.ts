/**
 * DeepSeek Adapter
 * DeepSeek LLM provider implementation (OpenAI-compatible API)
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
export class DeepSeekAdapter implements ILLMAdapter {
  readonly providerType = "deepseek";
  private readonly baseUrl = "https://api.deepseek.com";

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({
        apiKey,
        baseURL: this.baseUrl,
      });
      // Minimal call — deepseek-chat is the cheapest/most available model
      await client.chat.completions.create({
        model: "deepseek-chat",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      });
      return true;
    } catch (error: unknown) {
      // 401 = definitively invalid key
      if (error instanceof OpenAI.AuthenticationError) {
        return false;
      }
      // Everything else (429 RateLimit, 403, network) = key is valid
      return true;
    }
  }

  async chat(
    apiKey: string,
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const startTime = Date.now();
    const client = new OpenAI({
      apiKey,
      baseURL: this.baseUrl,
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
  ): AsyncGenerator<string, ChatCompletionResult, unknown> {
    const startTime = Date.now();
    const client = new OpenAI({
      apiKey,
      baseURL: this.baseUrl,
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
    }

    const latencyMs = Date.now() - startTime;

    // DeepSeek streaming doesn't provide token counts in stream
    // We estimate based on content length
    const estimatedPromptTokens = Math.ceil(
      options.messages.reduce((acc, m) => acc + m.content.length, 0) / 4,
    );
    const estimatedCompletionTokens = Math.ceil(fullContent.length / 4);

    return {
      content: fullContent,
      model,
      tokensUsed: {
        prompt: estimatedPromptTokens,
        completion: estimatedCompletionTokens,
        total: estimatedPromptTokens + estimatedCompletionTokens,
      },
      finishReason,
      latencyMs,
    };
  }

  async getAvailableModels(_apiKey: string): Promise<string[]> {
    // DeepSeek models — verified from api-docs.deepseek.com — only 2 real model IDs
    return ["deepseek-chat", "deepseek-reasoner"];
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
