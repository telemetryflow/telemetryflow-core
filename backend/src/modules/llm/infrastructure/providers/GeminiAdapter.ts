/**
 * Gemini Adapter
 * Google Gemini LLM provider implementation
 */

import { Injectable } from "@nestjs/common";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import {
  ILLMAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatMessage,
} from "./ILLMAdapter";

@Injectable()
export class GeminiAdapter implements ILLMAdapter {
  readonly providerType = "gemini";

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.0-flash for validation (stable, cheap, widely available)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      await model.generateContent("Hi");
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        // Definitive auth failure patterns from Google AI SDK
        if (
          msg.includes("api key not valid") ||
          msg.includes("api_key_invalid") ||
          msg.includes("invalid api key") ||
          msg.includes("provide an api key") ||
          (msg.includes("400") &&
            (msg.includes("api key") || msg.includes("api_key")))
        ) {
          return false;
        }
        // Quota/rate-limit means key IS valid
        if (
          msg.includes("quota") ||
          msg.includes("resource_exhausted") ||
          msg.includes("429") ||
          msg.includes("rate limit")
        ) {
          return true;
        }
        // Any other error (network, model variant not found, etc.) — key is valid
        // returning false here causes false negatives for valid keys
        return true;
      }
      return false;
    }
  }

  async chat(
    apiKey: string,
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const startTime = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);

    // Convert messages to Gemini format before building the model
    const { systemInstruction, history, lastMessage } = this.convertMessages(
      options.messages,
    );

    // systemInstruction is passed to getGenerativeModel as a string — the SDK
    // wraps it in the correct Content format automatically. Passing it to
    // startChat() instead requires a full Content object with a `role` field,
    // which causes a 400 Bad Request from the API.
    const model = genAI.getGenerativeModel({
      model: options.model,
      systemInstruction, // string | undefined — safe here
      generationConfig: {
        temperature: options.temperature,
        topP: options.topP,
        maxOutputTokens: options.maxTokens || 4096,
        stopSequences: options.stopSequences,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(lastMessage);
    const response = result.response;
    const latencyMs = Date.now() - startTime;

    const content = response.text();
    const usageMetadata = response.usageMetadata;

    return {
      content,
      model: options.model,
      tokensUsed: {
        prompt: usageMetadata?.promptTokenCount || 0,
        completion: usageMetadata?.candidatesTokenCount || 0,
        total: usageMetadata?.totalTokenCount || 0,
      },
      finishReason: response.candidates?.[0]?.finishReason || "STOP",
      latencyMs,
    };
  }

  async *chatStream(
    apiKey: string,
    options: ChatCompletionOptions,
  ): AsyncGenerator<string, ChatCompletionResult, unknown> {
    const startTime = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);

    // Convert messages to Gemini format before building the model
    const { systemInstruction, history, lastMessage } = this.convertMessages(
      options.messages,
    );

    const model = genAI.getGenerativeModel({
      model: options.model,
      systemInstruction, // string | undefined — SDK wraps it correctly
      generationConfig: {
        temperature: options.temperature,
        topP: options.topP,
        maxOutputTokens: options.maxTokens || 4096,
        stopSequences: options.stopSequences,
      },
    });

    const chat = model.startChat({ history });

    const result = await chat.sendMessageStream(lastMessage);

    let fullContent = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let finishReason = "STOP";

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullContent += text;
      yield text;

      // Get usage from final chunk
      if (chunk.usageMetadata) {
        promptTokens = chunk.usageMetadata.promptTokenCount || 0;
        completionTokens = chunk.usageMetadata.candidatesTokenCount || 0;
      }
      if (chunk.candidates?.[0]?.finishReason) {
        finishReason = chunk.candidates[0].finishReason;
      }
    }

    const latencyMs = Date.now() - startTime;

    return {
      content: fullContent,
      model: options.model,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      finishReason,
      latencyMs,
    };
  }

  async getAvailableModels(_apiKey: string): Promise<string[]> {
    // Gemini models — verified from https://ai.google.dev/gemini-api/docs/models
    return [
      "gemini-3.1-pro-preview",
      "gemini-3-pro-preview",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
    ];
  }

  private convertMessages(messages: ChatMessage[]): {
    systemInstruction: string | undefined;
    history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
    lastMessage: string;
  } {
    // Extract system message — returned as a plain string so it can be passed
    // to getGenerativeModel({ systemInstruction }) where the SDK wraps it correctly.
    const systemMessage = messages.find((m) => m.role === "system");
    const systemInstruction = systemMessage?.content || undefined;

    // Filter non-system messages
    const chatMessages = messages.filter((m) => m.role !== "system");

    // Gemini requires alternating user/model messages
    // Convert assistant -> model
    const history: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];

    // All messages except the last one go to history
    for (let i = 0; i < chatMessages.length - 1; i++) {
      const msg = chatMessages[i];
      history.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    // Last message is sent separately
    const lastMessage = chatMessages[chatMessages.length - 1]?.content || "";

    return { systemInstruction, history, lastMessage };
  }
}
