/**
 * LLM Adapter Interface
 * Defines the contract for LLM provider integrations
 */

export interface ChatAttachment {
  /** MIME type, e.g. "image/jpeg", "image/png" */
  mediaType: string;
  /** Base64-encoded file data (no data-URL prefix) */
  data: string;
  name: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
}

export type SamplingMode = "temperature" | "top_p" | "auto";

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  samplingMode?: SamplingMode;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  tokensUsed: TokenUsage;
  finishReason: string;
  latencyMs: number;
}

export interface StreamChunk {
  type: "chunk" | "complete" | "error";
  content?: string;
  result?: ChatCompletionResult;
  error?: string;
}

export interface ILLMAdapter {
  /**
   * The provider type identifier
   */
  readonly providerType: string;

  /**
   * Validate an API key with the provider
   */
  validateApiKey(apiKey: string): Promise<boolean>;

  /**
   * Send a chat completion request (non-streaming)
   */
  chat(
    apiKey: string,
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult>;

  /**
   * Send a chat completion request with streaming response
   * Returns an async generator that yields content chunks
   * and returns the final result
   */
  chatStream(
    apiKey: string,
    options: ChatCompletionOptions,
  ): AsyncGenerator<string, ChatCompletionResult, unknown>;

  /**
   * Get available models for this provider
   */
  getAvailableModels(apiKey: string): Promise<string[]>;
}

export const LLM_ADAPTER_FACTORY = Symbol("LLM_ADAPTER_FACTORY");

export interface ILLMAdapterFactory {
  /**
   * Get an adapter for the specified provider type
   */
  getAdapter(providerType: string, baseUrl?: string): ILLMAdapter;

  /**
   * Check if a provider type is supported
   */
  isSupported(providerType: string): boolean;
}
