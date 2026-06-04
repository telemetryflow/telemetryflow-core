/**
 * ModelConfig Value Object
 * Configuration parameters for LLM model
 */

import type { SamplingMode } from "../../infrastructure/providers/ILLMAdapter";

export type { SamplingMode };

const VALID_SAMPLING_MODES: SamplingMode[] = [
  "temperature",
  "top_p",
  "auto",
];

export interface ModelConfigProps {
  temperature: number;
  maxTokens: number;
  topP: number;
  samplingMode: SamplingMode;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

export class ModelConfig {
  private readonly props: ModelConfigProps;

  private constructor(props: ModelConfigProps) {
    this.props = Object.freeze({ ...props });
    Object.freeze(this);
  }

  static create(props: Partial<ModelConfigProps> = {}): ModelConfig {
    return new ModelConfig({
      temperature: this.clamp(props.temperature ?? 0.7, 0, 2),
      maxTokens: this.clamp(props.maxTokens ?? 4096, 1, 128000),
      topP: this.clamp(props.topP ?? 1.0, 0, 1),
      samplingMode: VALID_SAMPLING_MODES.includes(props.samplingMode as SamplingMode)
        ? (props.samplingMode as SamplingMode)
        : "auto",
      frequencyPenalty: this.clamp(props.frequencyPenalty ?? 0, -2, 2),
      presencePenalty: this.clamp(props.presencePenalty ?? 0, -2, 2),
      stopSequences: props.stopSequences,
      systemPrompt: props.systemPrompt,
    });
  }

  static default(): ModelConfig {
    return ModelConfig.create();
  }

  static fromJSON(json: Record<string, unknown>): ModelConfig {
    return ModelConfig.create({
      temperature:
        typeof json.temperature === "number" ? json.temperature : undefined,
      maxTokens:
        typeof json.maxTokens === "number" ? json.maxTokens : undefined,
      topP: typeof json.topP === "number" ? json.topP : undefined,
      samplingMode:
        VALID_SAMPLING_MODES.includes(json.samplingMode as SamplingMode)
          ? (json.samplingMode as SamplingMode)
          : undefined,
      frequencyPenalty:
        typeof json.frequencyPenalty === "number"
          ? json.frequencyPenalty
          : undefined,
      presencePenalty:
        typeof json.presencePenalty === "number"
          ? json.presencePenalty
          : undefined,
      stopSequences: Array.isArray(json.stopSequences)
        ? json.stopSequences
        : undefined,
      systemPrompt:
        typeof json.systemPrompt === "string" ? json.systemPrompt : undefined,
    });
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  getTemperature(): number {
    return this.props.temperature;
  }

  getMaxTokens(): number {
    return this.props.maxTokens;
  }

  getTopP(): number {
    return this.props.topP;
  }

  getSamplingMode(): SamplingMode {
    return this.props.samplingMode;
  }

  getFrequencyPenalty(): number {
    return this.props.frequencyPenalty;
  }

  getPresencePenalty(): number {
    return this.props.presencePenalty;
  }

  getStopSequences(): string[] | undefined {
    return this.props.stopSequences;
  }

  getSystemPrompt(): string | undefined {
    return this.props.systemPrompt;
  }

  withTemperature(temperature: number): ModelConfig {
    return ModelConfig.create({
      ...this.props,
      temperature,
    });
  }

  withMaxTokens(maxTokens: number): ModelConfig {
    return ModelConfig.create({
      ...this.props,
      maxTokens,
    });
  }

  withSystemPrompt(systemPrompt: string): ModelConfig {
    return ModelConfig.create({
      ...this.props,
      systemPrompt,
    });
  }

  toJSON(): ModelConfigProps {
    return { ...this.props };
  }

  equals(other: ModelConfig): boolean {
    return (
      this.props.temperature === other.props.temperature &&
      this.props.maxTokens === other.props.maxTokens &&
      this.props.topP === other.props.topP &&
      this.props.samplingMode === other.props.samplingMode &&
      this.props.frequencyPenalty === other.props.frequencyPenalty &&
      this.props.presencePenalty === other.props.presencePenalty
    );
  }
}
