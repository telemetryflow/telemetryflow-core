/**
 * Claude Adapter
 * Anthropic Claude LLM provider implementation
 */

import { Injectable } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import {
  ILLMAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatMessage,
  ChatAttachment,
  SamplingMode,
} from "./ILLMAdapter";

@Injectable()
export class ClaudeAdapter implements ILLMAdapter {
  readonly providerType = "claude";

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new Anthropic({ apiKey });
      // Use claude-3-haiku (cheapest model) for minimal-cost validation
      await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      });
      return true;
    } catch (error) {
      // 401 = definitively invalid key
      if (error instanceof Anthropic.AuthenticationError) {
        return false;
      }
      // Everything else (429 RateLimit, 403 PermissionDenied, network) = key is valid
      return true;
    }
  }

  private static readonly THINKING_ONLY_PREFIXES = [
    "claude-mythos",
  ];

  private static isThinkingOnlyModel(model: string): boolean {
    const lower = model.toLowerCase();
    for (const prefix of ClaudeAdapter.THINKING_ONLY_PREFIXES) {
      if (lower.startsWith(prefix)) return true;
    }
    // Model IDs use dashes: claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5
    const match = lower.match(/claude-(?:opus|sonnet|haiku)-(\d+)(?:-(\d+))?/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = match[2] ? parseInt(match[2], 10) : 0;
      const version = parseFloat(`${major}.${minor}`);
      return version >= 4.7;
    }
    return false;
  }

  private static buildSamplingParams(
    model: string,
    temperature?: number,
    topP?: number,
    samplingMode: SamplingMode = "auto",
  ): Record<string, number> {
    if (ClaudeAdapter.isThinkingOnlyModel(model)) {
      return {};
    }
    if (samplingMode === "top_p") {
      if (topP !== undefined) return { top_p: topP };
      return {};
    }
    if (samplingMode === "temperature") {
      if (temperature !== undefined) return { temperature };
      return {};
    }
    // "auto" mode: temperature preferred, fallback to top_p
    if (temperature !== undefined) return { temperature };
    if (topP !== undefined) return { top_p: topP };
    return {};
  }

  async chat(
    apiKey: string,
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const startTime = Date.now();
    const client = new Anthropic({ apiKey });

    // Extract system message if present
    const systemMessage = options.messages.find((m) => m.role === "system");
    const userMessages = this.convertMessages(options.messages);

    const samplingParams = ClaudeAdapter.buildSamplingParams(
      options.model,
      options.temperature,
      options.topP,
      options.samplingMode,
    );

    const response = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      ...samplingParams,
      system: systemMessage?.content,
      messages: userMessages,
      stop_sequences: options.stopSequences,
    });

    const latencyMs = Date.now() - startTime;

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return {
      content,
      model: response.model,
      tokensUsed: {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason || "end_turn",
      latencyMs,
    };
  }

  async *chatStream(
    apiKey: string,
    options: ChatCompletionOptions,
  ): AsyncGenerator<string, ChatCompletionResult, unknown> {
    const startTime = Date.now();
    const client = new Anthropic({ apiKey });

    // Extract system message if present
    const systemMessage = options.messages.find((m) => m.role === "system");
    const userMessages = this.convertMessages(options.messages);

    const samplingParams = ClaudeAdapter.buildSamplingParams(
      options.model,
      options.temperature,
      options.topP,
      options.samplingMode,
    );

    const stream = client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      ...samplingParams,
      system: systemMessage?.content,
      messages: userMessages,
      stop_sequences: options.stopSequences,
    });

    let fullContent = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let model = options.model;
    let stopReason = "end_turn";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullContent += event.delta.text;
        yield event.delta.text;
      }
      if (event.type === "message_start" && event.message) {
        model = event.message.model;
        if (event.message.usage) {
          inputTokens = event.message.usage.input_tokens;
        }
      }
      if (event.type === "message_delta") {
        if (event.usage) {
          outputTokens = event.usage.output_tokens;
        }
        if (event.delta?.stop_reason) {
          stopReason = event.delta.stop_reason;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    return {
      content: fullContent,
      model,
      tokensUsed: {
        prompt: inputTokens,
        completion: outputTokens,
        total: inputTokens + outputTokens,
      },
      finishReason: stopReason,
      latencyMs,
    };
  }

  async getAvailableModels(_apiKey: string): Promise<string[]> {
    // Verified from https://docs.anthropic.com/en/docs/about-claude/models
    return [
      "claude-opus-4-6",
      "claude-opus-4-5",
      "claude-sonnet-4-6",
      "claude-sonnet-4-5",
      "claude-haiku-4-5",
      "claude-haiku-4-5-20251001",
    ];
  }

  private convertMessages(
    messages: ChatMessage[],
  ): Array<Anthropic.MessageParam> {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        const role = m.role as "user" | "assistant";
        const imageAttachments = (m.attachments ?? []).filter(
          (a: ChatAttachment) => a.mediaType.startsWith("image/"),
        );

        if (imageAttachments.length > 0) {
          // Build multi-part content: images first, then text
          const contentBlocks: Anthropic.ContentBlockParam[] = [
            ...imageAttachments.map(
              (a: ChatAttachment): Anthropic.ImageBlockParam => ({
                type: "image",
                source: {
                  type: "base64",
                  media_type: a.mediaType as
                    | "image/jpeg"
                    | "image/png"
                    | "image/gif"
                    | "image/webp",
                  data: a.data,
                },
              }),
            ),
            { type: "text", text: m.content },
          ];
          return { role, content: contentBlocks };
        }

        return { role, content: m.content };
      });
  }
}
