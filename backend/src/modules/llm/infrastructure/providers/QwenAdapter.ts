/**
 * Qwen Adapter
 * Alibaba Qwen LLM provider implementation (OpenAI-compatible API)
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
export class QwenAdapter implements ILLMAdapter {
  readonly providerType = "qwen";
  private readonly baseUrl =
    "https://dashscope.aliyuncs.com/compatible-mode/v1";

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({
        apiKey,
        baseURL: this.baseUrl,
      });
      // qwen-turbo is the cheapest/most available model for validation
      await client.chat.completions.create({
        model: "qwen-turbo",
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

    // Estimate tokens for streaming response
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
    // Qwen models — verified from DashScope API — qwen3 series confirmed
    return [
      "qwen3-max",
      "qwen3-235b-a22b",
      "qwen3-32b",
      "qwen-max",
      "qwen-plus",
      "qwen-turbo",
      "qwen2.5-72b-instruct",
      "qwen2.5-32b-instruct",
    ];
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
