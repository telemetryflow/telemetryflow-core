/**
 * LLMProvider Aggregate Root
 * Represents an LLM provider configuration for an organization
 */

import {
  LLMProviderId,
  ProviderType,
  ModelConfig,
  EncryptedApiKey,
  SamplingMode,
} from "../value-objects";
import { LLMProviderCreatedEvent, LLMProviderUpdatedEvent } from "../events";

export interface LLMProviderProps {
  id: LLMProviderId;
  organizationId: string;
  name: string;
  providerType: ProviderType;
  encryptedApiKey: EncryptedApiKey;
  baseUrl?: string;
  modelId: string;
  modelConfig: ModelConfig;
  isDefault: boolean;
  isActive: boolean;
  lastUsedAt?: Date;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLLMProviderParams {
  organizationId: string;
  name: string;
  providerType: ProviderType;
  encryptedApiKey: EncryptedApiKey;
  modelId: string;
  createdBy: string;
  baseUrl?: string;
  modelConfig?: Partial<{
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    systemPrompt: string;
    samplingMode: SamplingMode;
  }>;
  isDefault?: boolean;
}

export class LLMProvider {
  private _domainEvents: unknown[] = [];
  private props: LLMProviderProps;

  private constructor(props: LLMProviderProps) {
    this.props = props;
  }

  static create(params: CreateLLMProviderParams): LLMProvider {
    const now = new Date();
    const provider = new LLMProvider({
      id: LLMProviderId.generate(),
      organizationId: params.organizationId,
      name: params.name,
      providerType: params.providerType,
      encryptedApiKey: params.encryptedApiKey,
      baseUrl: params.baseUrl || params.providerType.getDefaultBaseUrl(),
      modelId: params.modelId,
      modelConfig: ModelConfig.create(params.modelConfig || {}),
      isDefault: params.isDefault ?? false,
      isActive: true,
      lastUsedAt: undefined,
      usageCount: 0,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    provider._domainEvents.push(
      new LLMProviderCreatedEvent(
        provider.getId(),
        provider.getOrganizationId(),
        provider.getName(),
        provider.getProviderType().toString(),
        provider.getCreatedBy(),
      ),
    );

    return provider;
  }

  static reconstitute(props: LLMProviderProps): LLMProvider {
    return new LLMProvider(props);
  }

  // Getters
  getId(): string {
    return this.props.id.getValue();
  }

  getIdObject(): LLMProviderId {
    return this.props.id;
  }

  getOrganizationId(): string {
    return this.props.organizationId;
  }

  getName(): string {
    return this.props.name;
  }

  getProviderType(): ProviderType {
    return this.props.providerType;
  }

  getEncryptedApiKey(): EncryptedApiKey {
    return this.props.encryptedApiKey;
  }

  getApiKeyHint(): string {
    return this.props.encryptedApiKey.getHint();
  }

  getBaseUrl(): string | undefined {
    return this.props.baseUrl;
  }

  getModelId(): string {
    return this.props.modelId;
  }

  getModelConfig(): ModelConfig {
    return this.props.modelConfig;
  }

  isDefault(): boolean {
    return this.props.isDefault;
  }

  isActive(): boolean {
    return this.props.isActive;
  }

  getLastUsedAt(): Date | undefined {
    return this.props.lastUsedAt;
  }

  getUsageCount(): number {
    return this.props.usageCount;
  }

  getCreatedBy(): string {
    return this.props.createdBy;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain Events
  get domainEvents(): unknown[] {
    return this._domainEvents;
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  // Business Logic Methods
  updateName(name: string): void {
    if (name && name.trim().length > 0) {
      this.props.name = name.trim();
      this.props.updatedAt = new Date();
      this.addUpdatedEvent();
    }
  }

  updateApiKey(encryptedApiKey: EncryptedApiKey): void {
    this.props.encryptedApiKey = encryptedApiKey;
    this.props.updatedAt = new Date();
    this.addUpdatedEvent();
  }

  updateModel(modelId: string): void {
    if (modelId && modelId.trim().length > 0) {
      this.props.modelId = modelId.trim();
      this.props.updatedAt = new Date();
      this.addUpdatedEvent();
    }
  }

  updateModelConfig(
    config: Partial<{
      temperature: number;
      maxTokens: number;
      topP: number;
      frequencyPenalty: number;
      presencePenalty: number;
      systemPrompt: string;
      samplingMode: SamplingMode;
    }>,
  ): void {
    this.props.modelConfig = ModelConfig.create({
      ...this.props.modelConfig.toJSON(),
      ...config,
    });
    this.props.updatedAt = new Date();
    this.addUpdatedEvent();
  }

  updateBaseUrl(baseUrl: string | undefined): void {
    this.props.baseUrl = baseUrl;
    this.props.updatedAt = new Date();
    this.addUpdatedEvent();
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  unsetAsDefault(): void {
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
    this.addUpdatedEvent();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
    this.addUpdatedEvent();
  }

  recordUsage(): void {
    this.props.lastUsedAt = new Date();
    this.props.usageCount += 1;
    this.props.updatedAt = new Date();
  }

  private addUpdatedEvent(): void {
    this._domainEvents.push(
      new LLMProviderUpdatedEvent(
        this.getId(),
        this.getOrganizationId(),
        this.getName(),
      ),
    );
  }
}
