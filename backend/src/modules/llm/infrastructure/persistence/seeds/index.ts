/**
 * LLM Module Seeds Index
 *
 * Exports all LLM provider seeds for the modular seed runner.
 * Each provider has its own seed file for maintainability.
 */

import type { PostgresSeed } from "../../../../../database/shared/interfaces";
import { AnthropicLLMSeed } from "./01-anthropic.seed";
import { GoogleLLMSeed } from "./02-google.seed";
import { OpenAILLMSeed } from "./03-openai.seed";
import { DeepSeekLLMSeed } from "./04-deepseek.seed";
import { QwenLLMSeed } from "./05-qwen.seed";
import { OllamaLLMSeed } from "./06-ollama.seed";
import { MistralLLMSeed } from "./07-mistral.seed";
import { GrokLLMSeed } from "./08-grok.seed";
import { KimiLLMSeed } from "./09-kimi.seed";
import { ZhipuLLMSeed } from "./10-zhipu.seed";
import { MimoLLMSeed } from "./11-mimo.seed";
import { CustomLLMSeed } from "./12-custom.seed";

export const LLMSeeds: (new () => PostgresSeed)[] = [
  AnthropicLLMSeed,
  GoogleLLMSeed,
  OpenAILLMSeed,
  DeepSeekLLMSeed,
  QwenLLMSeed,
  OllamaLLMSeed,
  MistralLLMSeed,
  GrokLLMSeed,
  KimiLLMSeed,
  ZhipuLLMSeed,
  MimoLLMSeed,
  CustomLLMSeed,
];

export {
  AnthropicLLMSeed,
  GoogleLLMSeed,
  OpenAILLMSeed,
  DeepSeekLLMSeed,
  QwenLLMSeed,
  OllamaLLMSeed,
  MistralLLMSeed,
  GrokLLMSeed,
  KimiLLMSeed,
  ZhipuLLMSeed,
  MimoLLMSeed,
  CustomLLMSeed,
};
