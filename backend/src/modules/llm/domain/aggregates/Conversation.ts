/**
 * Conversation Aggregate Root
 * Represents a chat conversation with an LLM
 */

import { ConversationId } from "../value-objects";
import { Message, MessageRole } from "../entities/Message";
import { ConversationStartedEvent, MessageSentEvent } from "../events";

export type ContextType =
  // Core telemetry
  | "metrics"
  | "logs"
  | "traces"
  | "exemplars"
  | "correlations"
  // Alerting & monitoring
  | "alerts"
  | "alert-rules"
  | "kubernetes-overview"
  | "kubernetes-clusters"
  | "kubernetes-namespaces"
  | "kubernetes-nodes"
  | "kubernetes-pods"
  | "kubernetes-deployments"
  | "kubernetes-pv"
  | "kubernetes-api-server"
  | "kubernetes-coredns"
  | "agents"
  | "uptime"
  | "status-page"
  // Infrastructure
  | "infra-overview"
  | "infra-cpu"
  | "infra-memory"
  | "infra-storage"
  | "infra-network"
  // Topology
  | "service-map"
  | "network-map"
  // Dashboard & reports
  | "dashboard"
  | "reports"
  // Platform management
  | "iam"
  | "iam-users"
  | "iam-roles"
  | "iam-permissions"
  | "iam-matrix"
  | "iam-assignments"
  | "tenancy"
  | "tenancy-regions"
  | "tenancy-organizations"
  | "tenancy-workspaces"
  | "tenancy-tenants"
  | "audit"
  | "retention"
  | "subscription"
  | "api-keys"
  | "notifications"
  | "data-masking"
  // System settings
  | "system-setup"
  | "system-channels"
  | "ai-assistant"
  // Account
  | "account-profile"
  | "account-security"
  | "account-sessions"
  | "account-notifications"
  | "account-preferences"
  | "account-organization"
  // AI Intelligence
  | "anomaly-detection"
  | "corrective-maintenance"
  | "cost-optimization"
  | "predictive-maintenance"
  // DB Monitoring
  | "db-monitoring-inventory"
  | "db-monitoring-clickhouse"
  | "db-monitoring-mariadb"
  | "db-monitoring-mysql"
  | "db-monitoring-percona"
  | "db-monitoring-sqlite3"
  | "db-monitoring-timescaledb"
  | "db-monitoring-aurora"
  | "db-monitoring-mssql"
  | "db-monitoring-postgresql"
  | "db-monitoring-mongodb-community"
  | "db-monitoring-mongodb-atlas"
  | "db-monitoring-aws-rds-mysql"
  | "db-monitoring-aws-rds-aurora"
  | "db-monitoring-aws-dynamodb"
  | "db-monitoring-cockroachdb"
  | "db-monitoring-qan";

export interface ConversationProps {
  id: ConversationId;
  organizationId: string;
  userId: string;
  providerId: string;
  title?: string;
  contextType: ContextType;
  contextId?: string;
  metadata?: Record<string, unknown>;
  messages: Message[];
  messageCount: number;
  totalTokensUsed: number;
  lastMessageAt?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationParams {
  organizationId: string;
  userId: string;
  providerId: string;
  contextType: ContextType;
  contextId?: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export class Conversation {
  private _domainEvents: unknown[] = [];
  private props: ConversationProps;

  private constructor(props: ConversationProps) {
    this.props = props;
  }

  static create(params: CreateConversationParams): Conversation {
    const now = new Date();
    const conversation = new Conversation({
      id: ConversationId.generate(),
      organizationId: params.organizationId,
      userId: params.userId,
      providerId: params.providerId,
      title: params.title,
      contextType: params.contextType,
      contextId: params.contextId,
      metadata: params.metadata,
      messages: [],
      messageCount: 0,
      totalTokensUsed: 0,
      lastMessageAt: undefined,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    conversation._domainEvents.push(
      new ConversationStartedEvent(
        conversation.getId(),
        conversation.getOrganizationId(),
        conversation.getUserId(),
        conversation.getContextType(),
      ),
    );

    return conversation;
  }

  static reconstitute(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  // Getters
  getId(): string {
    return this.props.id.getValue();
  }

  getIdObject(): ConversationId {
    return this.props.id;
  }

  getOrganizationId(): string {
    return this.props.organizationId;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getProviderId(): string {
    return this.props.providerId;
  }

  getTitle(): string | undefined {
    return this.props.title;
  }

  getContextType(): ContextType {
    return this.props.contextType;
  }

  getContextId(): string | undefined {
    return this.props.contextId;
  }

  getMetadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  getMessages(): Message[] {
    return [...this.props.messages];
  }

  getMessageCount(): number {
    return this.props.messageCount;
  }

  getTotalTokensUsed(): number {
    return this.props.totalTokensUsed;
  }

  getLastMessageAt(): Date | undefined {
    return this.props.lastMessageAt;
  }

  isArchived(): boolean {
    return this.props.isArchived;
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
  addMessage(
    role: MessageRole,
    content: string,
    options?: {
      tokensUsed?: number;
      modelId?: string;
      latencyMs?: number;
      metadata?: Record<string, unknown>;
    },
  ): Message {
    const message = Message.create({
      conversationId: this.getId(),
      role,
      content,
      tokensUsed: options?.tokensUsed,
      modelId: options?.modelId,
      latencyMs: options?.latencyMs,
      metadata: options?.metadata,
    });

    this.props.messages.push(message);
    this.props.messageCount += 1;
    this.props.lastMessageAt = new Date();
    this.props.updatedAt = new Date();

    if (options?.tokensUsed) {
      this.props.totalTokensUsed += options.tokensUsed;
    }

    // Auto-generate title from first user message if not set
    if (!this.props.title && role === "user" && this.props.messageCount === 1) {
      this.props.title = this.generateTitleFromContent(content);
    }

    this._domainEvents.push(
      new MessageSentEvent(
        message.getId(),
        this.getId(),
        this.getOrganizationId(),
        role,
      ),
    );

    return message;
  }

  setMessages(messages: Message[]): void {
    this.props.messages = messages;
    this.props.messageCount = messages.length;
  }

  updateTitle(title: string): void {
    if (title && title.trim().length > 0) {
      this.props.title = title.trim();
      this.props.updatedAt = new Date();
    }
  }

  archive(): void {
    this.props.isArchived = true;
    this.props.updatedAt = new Date();
  }

  unarchive(): void {
    this.props.isArchived = false;
    this.props.updatedAt = new Date();
  }

  private generateTitleFromContent(content: string): string {
    // Take first 50 characters and add ellipsis if longer
    const maxLength = 50;
    const trimmed = content.trim();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return trimmed.substring(0, maxLength).trim() + "...";
  }
}
