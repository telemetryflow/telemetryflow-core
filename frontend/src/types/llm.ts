/**
 * LLM Types
 * TASK-11: Frontend types for BYOLLM AI Insights module
 */

// ==================== ENUMS ====================

export type ProviderType =
  | "anthropic"
  | "claude" // Alias for anthropic
  | "openai"
  | "google" // Alias for gemini
  | "gemini"
  | "deepseek"
  | "qwen"
  | "ollama"
  | "mistral"
  | "grok"
  | "kimi"
  | "zhipu"
  | "mimo"
  | "custom";

export const PROVIDER_TYPES: Record<
  ProviderType,
  { label: string; icon: string; color: string; description: string }
> = {
  anthropic: {
    label: "Claude (Anthropic)",
    icon: "simple-icons:anthropic",
    color: "#D97757",
    description: "Anthropic's Claude models",
  },
  claude: {
    label: "Claude (Anthropic)",
    icon: "simple-icons:anthropic",
    color: "#D97757",
    description: "Anthropic's Claude models",
  },
  openai: {
    label: "ChatGPT (OpenAI)",
    icon: "simple-icons:openai",
    color: "#10a37f",
    description: "OpenAI's GPT models",
  },
  google: {
    label: "Gemini (Google)",
    icon: "simple-icons:google",
    color: "#4285F4",
    description: "Google's Gemini models",
  },
  gemini: {
    label: "Gemini (Google)",
    icon: "simple-icons:google",
    color: "#4285F4",
    description: "Google's Gemini models",
  },
  deepseek: {
    label: "DeepSeek",
    icon: "simple-icons:deepseek",
    color: "#4D6BFE",
    description: "DeepSeek AI models",
  },
  qwen: {
    label: "Qwen (Alibaba)",
    icon: "simple-icons:qwen",
    color: "#FF6A00",
    description: "Alibaba's Qwen models",
  },
  ollama: {
    label: "Ollama (Local)",
    icon: "simple-icons:ollama",
    color: "#8b5cf6",
    description: "Local Ollama deployment",
  },
  mistral: {
    label: "Mistral AI",
    icon: "simple-icons:mistralai",
    color: "#F70000",
    description: "Mistral AI foundation models",
  },
  grok: {
    label: "Grok (xAI)",
    icon: "logos:grok-icon",
    color: "#000000",
    description: "xAI's Grok models",
  },
  kimi: {
    label: "Kimi (Moonshot)",
    icon: "simple-icons:moonshotai",
    color: "#6C5CE7",
    description: "Moonshot AI's Kimi models",
  },
  zhipu: {
    label: "GLM (Z.ai)",
    icon: "custom:zai",
    color: "#3B82F6",
    description: "Z.ai (formerly Zhipu) GLM models",
  },
  mimo: {
    label: "MiMo (Xiaomi)",
    icon: "custom:mimo",
    color: "#FF6900",
    description: "Xiaomi's MiMo models",
  },
  custom: {
    label: "Custom Provider",
    icon: "mdi:cog",
    color: "#64748b",
    description: "OpenAI-compatible custom provider",
  },
};

export type ContextType =
  | "metrics"
  | "logs"
  | "traces"
  | "exemplars"
  | "correlations"
  | "agents"
  | "infra-overview"
  | "infra-cpu"
  | "infra-memory"
  | "infra-storage"
  | "infra-network"
  | "service-map"
  | "network-map"
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
  | "uptime"
  | "status-page"
  | "dashboard"
  | "reports"
  | "iam"
  | "tenancy"
  | "audit"
  | "retention"
  | "subscription"
  | "api-keys"
  | "notifications"
  | "data-masking"
  // IAM sub-features
  | "iam-users"
  | "iam-roles"
  | "iam-permissions"
  | "iam-matrix"
  | "iam-assignments"
  // Tenancy sub-features
  | "tenancy-regions"
  | "tenancy-organizations"
  | "tenancy-workspaces"
  | "tenancy-tenants"
  // System sub-features
  | "system-setup"
  | "system-channels"
  | "ai-assistant"
  // Account sub-features
  | "account-profile"
  | "account-security"
  | "account-sessions"
  | "account-notifications"
  | "account-preferences"
  | "account-organization"
  // AI Intelligence
  | "anomaly-detection"
  | "corrective-maintenance"
  | "predictive-maintenance"
  // AI Cost Optimization
  | "cost-optimization"
  // DB Monitoring
  | "db-monitoring-inventory"
  | "db-monitoring-timescaledb"
  | "db-monitoring-aurora"
  | "db-monitoring-mysql";

export const CONTEXT_TYPES: Record<
  ContextType,
  { label: string; icon: string; description: string }
> = {
  metrics: {
    label: "Metrics",
    icon: "mdi:chart-line",
    description: "Analyze metric patterns and anomalies",
  },
  logs: {
    label: "Logs",
    icon: "mdi:text-box-outline",
    description: "Analyze log patterns and errors",
  },
  traces: {
    label: "Traces",
    icon: "mdi:source-branch",
    description: "Analyze distributed traces and latency",
  },
  exemplars: {
    label: "Exemplars",
    icon: "mdi:file-document-outline",
    description: "Analyze trace exemplars",
  },
  correlations: {
    label: "Correlations",
    icon: "mdi:link-variant",
    description: "Cross-signal correlation analysis",
  },
  agents: {
    label: "Agents",
    icon: "mdi:server",
    description: "Analyze host and VM metrics",
  },
  "infra-overview": {
    label: "Infra Overview",
    icon: "mdi:monitor-multiple",
    description: "Overview of all infrastructure metrics",
  },
  "infra-cpu": {
    label: "Infra CPU",
    icon: "mdi:cpu-64-bit",
    description: "Analyze CPU usage and performance",
  },
  "infra-memory": {
    label: "Infra Memory",
    icon: "mdi:memory",
    description: "Analyze memory usage and allocation",
  },
  "infra-storage": {
    label: "Infra Storage",
    icon: "mdi:harddisk",
    description: "Analyze storage usage and I/O",
  },
  "infra-network": {
    label: "Infra Network",
    icon: "mdi:lan",
    description: "Analyze network traffic and latency",
  },
  "service-map": {
    label: "Service Map",
    icon: "mdi:sitemap",
    description: "Analyze service dependencies",
  },
  "network-map": {
    label: "Network Map",
    icon: "mdi:network",
    description: "Analyze network topology",
  },
  alerts: {
    label: "Alerts",
    icon: "mdi:bell-alert",
    description: "Analyze alert patterns and incidents",
  },
  "alert-rules": {
    label: "Alert Rules",
    icon: "mdi:bell-cog",
    description: "Manage and analyze alert rule configurations",
  },
  "kubernetes-overview": {
    label: "K8S Overview",
    icon: "mdi:kubernetes",
    description: "Cluster-wide health and resource summary",
  },
  "kubernetes-clusters": {
    label: "K8S Clusters",
    icon: "mdi:server-network",
    description: "Analyze cluster inventory and status",
  },
  "kubernetes-namespaces": {
    label: "K8S Namespaces",
    icon: "mdi:folder-network",
    description: "Analyze namespace resource usage",
  },
  "kubernetes-nodes": {
    label: "K8S Nodes",
    icon: "mdi:desktop-tower",
    description: "Analyze node health and capacity",
  },
  "kubernetes-pods": {
    label: "K8S Pods",
    icon: "mdi:cube-outline",
    description: "Analyze pod health and restarts",
  },
  "kubernetes-deployments": {
    label: "K8S Deployments",
    icon: "mdi:rocket-launch",
    description: "Analyze deployment status and rollouts",
  },
  "kubernetes-pv": {
    label: "K8S Persistent Volumes",
    icon: "mdi:database",
    description: "Analyze persistent volume claims and capacity",
  },
  "kubernetes-api-server": {
    label: "K8S API Server",
    icon: "mdi:api",
    description: "Analyze Kubernetes API server metrics and health",
  },
  "kubernetes-coredns": {
    label: "K8S CoreDNS",
    icon: "mdi:dns",
    description: "Analyze CoreDNS performance and query patterns",
  },
  uptime: {
    label: "Uptime",
    icon: "mdi:check-circle",
    description: "Analyze availability and SLA",
  },
  "status-page": {
    label: "Status Page",
    icon: "mdi:clipboard-text",
    description: "Analyze incidents and status",
  },
  dashboard: {
    label: "Dashboard",
    icon: "mdi:view-dashboard",
    description: "Analyze dashboard data",
  },
  reports: {
    label: "Reports",
    icon: "mdi:file-chart",
    description: "Analyze reports and scheduled deliveries",
  },
  iam: {
    label: "IAM",
    icon: "mdi:shield-account",
    description: "Analyze identity, access, and permissions",
  },
  tenancy: {
    label: "Tenancy",
    icon: "mdi:domain",
    description: "Analyze multi-tenant configuration",
  },
  audit: {
    label: "Audit",
    icon: "mdi:clipboard-check",
    description: "Analyze audit logs and compliance",
  },
  retention: {
    label: "Retention",
    icon: "mdi:archive-clock",
    description: "Analyze data retention policies",
  },
  subscription: {
    label: "Subscription",
    icon: "mdi:credit-card",
    description: "Analyze subscription and billing",
  },
  "api-keys": {
    label: "API Keys",
    icon: "mdi:key-variant",
    description: "Analyze API key usage and security",
  },
  notifications: {
    label: "Notifications",
    icon: "mdi:bell-ring",
    description: "Analyze notification channels and delivery",
  },
  "data-masking": {
    label: "PII Data Masking",
    icon: "mdi:shield-eye",
    description: "Manage PII masking rules and compliance policies",
  },
  // IAM sub-features
  "iam-users": {
    label: "IAM Users",
    icon: "mdi:account-group",
    description: "Manage users, invitations, and account status",
  },
  "iam-roles": {
    label: "IAM Roles",
    icon: "mdi:shield-key",
    description: "Manage roles and permission bundles",
  },
  "iam-permissions": {
    label: "IAM Permissions",
    icon: "mdi:lock-open-check",
    description: "Browse and analyze permission catalog",
  },
  "iam-matrix": {
    label: "IAM Matrix",
    icon: "mdi:table-lock",
    description: "View role-permission matrix and access map",
  },
  "iam-assignments": {
    label: "IAM Assignments",
    icon: "mdi:account-arrow-right",
    description: "Manage role assignments for users and workspaces",
  },
  // Tenancy sub-features
  "tenancy-regions": {
    label: "Regions",
    icon: "mdi:earth",
    description: "Manage deployment regions and infrastructure zones",
  },
  "tenancy-organizations": {
    label: "Organizations",
    icon: "mdi:office-building",
    description: "Manage organizations and their subscriptions",
  },
  "tenancy-workspaces": {
    label: "Workspaces",
    icon: "mdi:view-grid-plus",
    description: "Manage workspaces, quotas, and environments",
  },
  "tenancy-tenants": {
    label: "Tenants",
    icon: "mdi:account-tie",
    description: "Manage tenants and ingestion configuration",
  },
  // System sub-features
  "system-setup": {
    label: "System Setup",
    icon: "mdi:cog-transfer",
    description: "Platform configuration and initial setup",
  },
  "system-channels": {
    label: "Notification Channels",
    icon: "mdi:bullhorn",
    description: "Configure and manage notification delivery channels",
  },
  "ai-assistant": {
    label: "AI Assistant",
    icon: "mdi:robot-excited",
    description: "Configure LLM providers and AI assistant settings",
  },
  // Account sub-features
  "account-profile": {
    label: "My Profile",
    icon: "mdi:account-circle",
    description: "View and edit your profile information",
  },
  "account-security": {
    label: "Account Security",
    icon: "mdi:shield-lock",
    description: "Manage password, MFA, and security settings",
  },
  "account-sessions": {
    label: "Active Sessions",
    icon: "mdi:devices",
    description: "Manage active login sessions and device access",
  },
  "account-notifications": {
    label: "Account Notifications",
    icon: "mdi:bell-cog",
    description: "Configure personal notification preferences",
  },
  "account-preferences": {
    label: "Preferences",
    icon: "mdi:tune-variant",
    description: "Customize UI theme, language, and display settings",
  },
  "account-organization": {
    label: "My Organization",
    icon: "mdi:office-building-cog",
    description: "View and manage your organization membership",
  },
  "anomaly-detection": {
    label: "Anomaly Detection",
    icon: "mdi:alert-circle-outline",
    description: "Analyze detected anomalies and perform root cause analysis",
  },
  "corrective-maintenance": {
    label: "Corrective Maintenance",
    icon: "mdi:wrench-outline",
    description: "Generate and manage LLM-powered remediation plans",
  },
  "predictive-maintenance": {
    label: "Predictive Maintenance",
    icon: "mdi:chart-timeline-variant",
    description: "Analyze resource forecasts and failure probability predictions",
  },
  "cost-optimization": {
    label: "Cost Optimization",
    icon: "mdi:currency-usd",
    description: "Analyze multi-cloud costs, budgets, and optimization recommendations",
  },
  "db-monitoring-inventory": {
    label: "DB Inventory",
    icon: "mdi:database",
    description: "Analyze database fleet composition, health, and monitoring coverage",
  },
  "db-monitoring-timescaledb": {
    label: "TimescaleDB Monitoring",
    icon: "mdi:database-clock",
    description: "Analyze TimescaleDB hypertables, compression, continuous aggregates, and job scheduler health",
  },
  "db-monitoring-aurora": {
    label: "Aurora Monitoring",
    icon: "mdi:aws",
    description: "Analyze Aurora cluster topology, Performance Insights, Serverless ACU, Global Database replication, and failover events",
  },
  "db-monitoring-mysql": {
    label: "MySQL Monitoring",
    icon: "mdi:database",
    description: "Analyze MySQL/MariaDB/Percona performance: query analytics, InnoDB buffer pool, replication lag, slow queries, and schema health",
  },
};

export type InsightType =
  | "chronology"
  | "prediction"
  | "recommendation"
  | "root-cause"
  | "pattern";

export const INSIGHT_TYPES: Record<
  InsightType,
  { label: string; icon: string; description: string }
> = {
  chronology: {
    label: "Incident Chronology",
    icon: "mdi:timeline",
    description: "Timeline of events and incident narrative",
  },
  prediction: {
    label: "Predictive Analysis",
    icon: "mdi:crystal-ball",
    description: "Predict potential issues based on patterns",
  },
  recommendation: {
    label: "Recommendations",
    icon: "mdi:lightbulb",
    description: "Actionable recommendations to improve health",
  },
  "root-cause": {
    label: "Root Cause Analysis",
    icon: "mdi:magnify",
    description: "Identify the primary source of issues",
  },
  pattern: {
    label: "Pattern Detection",
    icon: "mdi:chart-scatter-plot",
    description: "Identify patterns and anomalies",
  },
};

// ==================== CORE TYPES ====================

/**
 * LLM Provider configuration
 */
export interface LLMProvider {
  id: string;
  organizationId: string;
  name: string;
  providerType: ProviderType;
  apiKeyHint: string;
  modelId: string;
  baseUrl?: string;
  modelConfig: ModelConfig;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Model configuration
 */
export type SamplingMode = "temperature" | "top_p" | "auto";

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  samplingMode: SamplingMode;
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  tokensUsed?: number;
  modelId?: string;
  latencyMs?: number;
  createdAt: string;
  isError?: boolean;
  /** Image attachments sent with this user message (preview data URLs for display) */
  attachments?: Array<{ name: string; mediaType: string; preview: string }>;
}

/**
 * Conversation summary
 */
export interface Conversation {
  id: string;
  title?: string;
  contextType: ContextType;
  contextId?: string;
  messageCount: number;
  totalTokensUsed: number;
  lastMessageAt?: string;
  isArchived: boolean;
  createdAt: string;
}

/**
 * Conversation with messages
 */
export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

/**
 * AI-generated insight
 */
export interface Insight {
  insightType: InsightType;
  contextType: ContextType;
  timeRange: {
    from: string;
    to: string;
  };
  content: string;
  modelId: string;
  usage?: TokenUsage;
  latencyMs: number;
  generatedAt: string;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ==================== REQUEST TYPES ====================

/**
 * Create LLM Provider request
 */
export interface CreateLLMProviderRequest {
  name: string;
  providerType: ProviderType;
  apiKey: string;
  modelId: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  samplingMode?: SamplingMode;
  isDefault?: boolean;
}

/**
 * Update LLM Provider request
 */
export interface UpdateLLMProviderRequest {
  name?: string;
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  samplingMode?: SamplingMode;
  isActive?: boolean;
}

/**
 * File attachment for a chat message
 */
export interface SendMessageAttachment {
  /** MIME type, e.g. "image/jpeg" */
  mediaType: string;
  /** Base64-encoded file data (no data-URL prefix) */
  data: string;
  name: string;
}

/**
 * Send message request
 */
export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  providerId?: string;
  contextType: ContextType;
  contextId?: string;
  /** ISO 8601 — start of time range for context queries (defaults to 1h ago on backend) */
  timeFrom?: string;
  /** ISO 8601 — end of time range for context queries (defaults to now on backend) */
  timeTo?: string;
  metadata?: Record<string, unknown>;
  attachments?: SendMessageAttachment[];
}

/**
 * Generate insight request
 */
export interface GenerateInsightRequest {
  insightType: InsightType;
  contextType: ContextType;
  contextId?: string;
  providerId?: string;
  timeFrom?: string;
  timeTo?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * List providers query
 */
export interface ListLLMProvidersQuery {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  providerType?: ProviderType;
}

/**
 * List conversations query
 */
export interface ListConversationsQuery {
  page?: number;
  pageSize?: number;
  contextType?: ContextType;
  isArchived?: boolean;
  search?: string;
}

// ==================== RESPONSE TYPES ====================

/**
 * Send message response
 */
export interface SendMessageResponse {
  conversationId: string;
  message: ChatMessage;
  usage?: TokenUsage;
}

/**
 * Paginated providers response
 */
export interface PaginatedProviders {
  items: LLMProvider[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated conversations response
 */
export interface PaginatedConversations {
  items: Conversation[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * API key validation response
 */
export interface ValidateApiKeyResponse {
  valid: boolean;
  message: string;
}

// ==================== DEFAULT MODELS ====================

export const DEFAULT_MODELS: Record<
  ProviderType,
  { id: string; name: string }[]
> = {
  anthropic: [
    { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Oct 2025)" },
  ],
  claude: [
    { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Oct 2025)" },
  ],
  openai: [
    { id: "gpt-5.5", name: "GPT-5.5" },
    { id: "gpt-5", name: "GPT-5" },
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "o3", name: "o3" },
    { id: "gpt-4o", name: "GPT-4o" },
  ],
  google: [
    { id: "gemini-3", name: "Gemini 3" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  ],
  gemini: [
    { id: "gemini-3", name: "Gemini 3" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  ],
  deepseek: [
    { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
    { id: "deepseek-chat", name: "DeepSeek Chat V3.2" },
    { id: "deepseek-v3.2", name: "DeepSeek V3.2" },
    { id: "deepseek-v3.1", name: "DeepSeek V3.1" },
    { id: "deepseek-reasoner", name: "DeepSeek R2 Reasoner" },
    { id: "deepseek-ocr-2", name: "DeepSeek OCR 2" },
  ],
  qwen: [
    { id: "qwen3-max", name: "Qwen3 Max" },
    { id: "qwen3-235b-a22b", name: "Qwen3 235B A22B" },
    { id: "qwen3-32b", name: "Qwen3 32B" },
    { id: "qwen-max", name: "Qwen Max" },
    { id: "qwen2.5-72b-instruct", name: "Qwen 2.5 72B Instruct" },
    { id: "qwen2.5-32b-instruct", name: "Qwen 2.5 32B Instruct" },
  ],
  ollama: [
    { id: "llama4:maverick-17b", name: "Llama 4 Maverick 17B" },
    { id: "gemma4:26b", name: "Gemma 4 26B" },
    { id: "qwen3:32b", name: "Qwen3 32B" },
    { id: "deepseek-r1:70b", name: "DeepSeek R1 70B" },
    { id: "llama3.3:70b", name: "Llama 3.3 70B" },
    { id: "phi4:14b", name: "Phi-4 14B" },
  ],
  mistral: [
    { id: "mistral-medium-2508", name: "Mistral Medium 3.1" },
    { id: "mistral-large-2411", name: "Mistral Large 2.1" },
    { id: "mistral-small-2506", name: "Mistral Small 3.2" },
    { id: "codestral-2508", name: "Codestral 2508" },
    { id: "devstral-small-2507", name: "Devstral Small 1.1" },
    { id: "ministral-3b-2410", name: "Ministral 3B" },
  ],
  grok: [
    { id: "grok-4.20-0309-reasoning", name: "Grok 4.20 Reasoning" },
    { id: "grok-4.20-0309-non-reasoning", name: "Grok 4.20 Non-Reasoning" },
    { id: "grok-4.20-multi-agent-0309", name: "Grok 4.20 Multi-Agent" },
    { id: "grok-4-1-fast-reasoning", name: "Grok 4.1 Fast Reasoning" },
    { id: "grok-4-1-fast-non-reasoning", name: "Grok 4.1 Fast Non-Reasoning" },
    { id: "grok-3", name: "Grok 3" },
  ],
  kimi: [
    { id: "kimi-k2.6", name: "Kimi K2.6" },
    { id: "kimi-k2.5", name: "Kimi K2.5" },
    { id: "moonshot-v1-128k", name: "Moonshot V1 128K" },
    { id: "moonshot-v1-32k", name: "Moonshot V1 32K" },
    { id: "kimi-k2-thinking", name: "Kimi K2 Thinking" },
    { id: "kimi-k2-turbo-preview", name: "Kimi K2 Turbo Preview" },
  ],
  zhipu: [
    { id: "glm-5.1", name: "GLM-5.1" },
    { id: "glm-5", name: "GLM-5" },
    { id: "glm-4.7", name: "GLM-4.7" },
    { id: "glm-4.5", name: "GLM-4.5" },
    { id: "glm-4.5-air", name: "GLM-4.5 Air" },
    { id: "glm-4-flash", name: "GLM-4 Flash" },
  ],
  mimo: [
    { id: "mimo-v2-pro", name: "MiMo-V2-Pro" },
    { id: "mimo-v2-flash", name: "MiMo-V2-Flash" },
    { id: "mimo-v2-omni", name: "MiMo-V2-Omni" },
    { id: "mimo-v2-tts", name: "MiMo-V2-TTS" },
    { id: "mimo-7b", name: "MiMo-7B" },
    { id: "mimo-vl-7b", name: "MiMo-VL-7B" },
  ],
  custom: [],
};

// ==================== STREAMING TYPES ====================

/**
 * SSE event types for streaming
 */
export type StreamEventType = "start" | "chunk" | "end" | "error";

export interface StreamStartEvent {
  type: "start";
  conversationId: string;
}

export interface StreamChunkEvent {
  type: "chunk";
  content: string;
}

export interface StreamEndEvent {
  type: "end";
  messageId: string;
  latencyMs: number;
}

export interface StreamErrorEvent {
  type: "error";
  message: string;
}

export type StreamEvent =
  | StreamStartEvent
  | StreamChunkEvent
  | StreamEndEvent
  | StreamErrorEvent;
