/**
 * Ollama LLM Adapter
 * Supports local Ollama deployment (OpenAI-compatible API)
 */

import { Injectable } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import {
  ILLMAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
  TokenUsage,
} from "./ILLMAdapter";

@Injectable()
export class OllamaAdapter implements ILLMAdapter {
  readonly providerType = "ollama";
  private baseUrl: string = "http://localhost:11434/v1";
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setBaseUrl(url: string): this {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isLocalHost =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    const isAllowedPort = parsed.port === "" || parsed.port === "11434";
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    const isAllowedPath =
      normalizedPath === "" || normalizedPath === "/" || normalizedPath === "/v1";
    const hasCredentials = Boolean(parsed.username || parsed.password);

    if (
      parsed.protocol !== "http:" ||
      !isLocalHost ||
      !isAllowedPort ||
      !isAllowedPath ||
      hasCredentials
    ) {
      throw new Error(
        "Invalid Ollama base URL: only http://localhost:11434/v1 (or 127.0.0.1 / [::1]) is allowed",
      );
    }

    const canonical = new URL("http://localhost:11434/v1");
    canonical.hostname = host;
    this.baseUrl = canonical.toString().replace(/\/+$/, "");

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return this;
  }

  async chat(
    apiKey: string,
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const startTime = Date.now();

    try {
      const response = await this.client.post(
        "/chat/completions",
        {
          model: options.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          top_p: options.topP ?? 1.0,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      const latencyMs = Date.now() - startTime;
      const choice = response.data.choices[0];

      return {
        content: choice.message.content,
        model: response.data.model,
        tokensUsed: {
          prompt: response.data.usage?.prompt_tokens || 0,
          completion: response.data.usage?.completion_tokens || 0,
          total: response.data.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason || "stop",
        latencyMs,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message;
        throw new Error(
          `Ollama API error (${status || "unknown"}): ${message}`,
        );
      }
      throw error;
    }
  }

  async *chatStream(
    apiKey: string,
    options: ChatCompletionOptions,
  ): AsyncGenerator<string, ChatCompletionResult, unknown> {
    const startTime = Date.now();
    let fullContent = "";
    let finalUsage: TokenUsage = {
      prompt: 0,
      completion: 0,
      total: 0,
    };
    let finishReason = "stop";
    let modelId = options.model;

    try {
      const response = await this.client.post(
        "/chat/completions",
        {
          model: options.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          top_p: options.topP ?? 1.0,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          responseType: "stream",
        },
      );

      const stream = response.data;

      for await (const chunk of stream) {
        const lines = chunk
          .toString()
          .split("\n")
          .filter((line: string) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              const latencyMs = Date.now() - startTime;
              return {
                content: fullContent,
                model: modelId,
                tokensUsed: finalUsage,
                finishReason,
                latencyMs,
              };
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;

              if (delta?.content) {
                fullContent += delta.content;
                yield delta.content;
              }

              if (parsed.choices[0]?.finish_reason) {
                finishReason = parsed.choices[0].finish_reason;
              }

              if (parsed.usage) {
                finalUsage = {
                  prompt: parsed.usage.prompt_tokens || 0,
                  completion: parsed.usage.completion_tokens || 0,
                  total: parsed.usage.total_tokens || 0,
                };
              }

              if (parsed.model) {
                modelId = parsed.model;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Fallback return if stream ends without [DONE]
      const latencyMs = Date.now() - startTime;
      return {
        content: fullContent,
        model: modelId,
        tokensUsed: finalUsage,
        finishReason,
        latencyMs,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message;
        throw new Error(
          `Ollama API error (${status || "unknown"}): ${message}`,
        );
      }
      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // Ollama typically doesn't require API keys for local deployments
      // But we'll try to list models to verify connectivity
      const response = await this.client.get("/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      // For local Ollama, no auth is typically required
      // So we consider it "valid" if the endpoint is reachable
      if (axios.isAxiosError(error)) {
        // 401 means auth failed, other errors might mean Ollama is not running
        return error.response?.status !== 401;
      }
      return false;
    }
  }

  async getAvailableModels(apiKey: string): Promise<string[]> {
    try {
      const response = await this.client.get("/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // Parse Ollama's models response format
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map((model: any) => model.id || model.name);
      }

      // Fallback to default models if API doesn't return models
      return [
        "llama3.3:70b",
        "llama3.2",
        "llama3.1:8b",
        "mistral:7b",
        "codellama:13b",
        "phi3:medium",
      ];
    } catch (error) {
      // Return default models if endpoint is not reachable
      return [
        "llama3.3:70b",
        "llama3.2",
        "llama3.1:8b",
        "mistral:7b",
        "codellama:13b",
        "phi3:medium",
      ];
    }
  }
}
