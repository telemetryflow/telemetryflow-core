// ─── Detection Rules ──────────────────────────────────────────────────────────

export type DetectionMethod = 'z-score' | 'iqr' | 'isolation-forest' | 'lstm' | 'vae' | 'ensemble';
export type SignalType = 'metric' | 'log' | 'trace';
export type DetectionRuleState = 'initializing' | 'active' | 'baseline-stale' | 'error';
export type BaselineStatus = 'pending' | 'computing' | 'ready' | 'failed';
export type AnomalySeverity = 'warning' | 'critical';

export interface BaselineConfig {
  lookbackWeeks: number;
  temporalSegmentation: boolean;
  warningSigma: number;
  criticalSigma: number;
  minDataPoints: number;
  stddevFloor: number;
}

export interface DetectionRule {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  metricName: string;
  signalType: SignalType;
  detectionMethod: DetectionMethod;
  baselineConfig: BaselineConfig;
  state: DetectionRuleState;
  baselineStatus: BaselineStatus;
  enabled: boolean;
  createAlertOnAnomaly: boolean;
  lastEvaluatedAt?: string;
  lastErrorMessage?: string;
  lastAnomalyAt?: string;
  lastAnomalyScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDetectionRuleRequest {
  name: string;
  metricName: string;
  signalType?: SignalType;
  detectionMethod?: DetectionMethod;
  lookbackWeeks?: number;
  temporalSegmentation?: boolean;
  warningSigma?: number;
  criticalSigma?: number;
  minDataPoints?: number;
  stddevFloor?: number;
  createAlertOnAnomaly?: boolean;
  workspaceId?: string;
}

export interface UpdateDetectionRuleRequest extends Partial<CreateDetectionRuleRequest> {}

// ─── Anomaly Events ───────────────────────────────────────────────────────────

export interface AnomalyEvent {
  id: string;
  organizationId: string;
  workspaceId?: string;
  detectionRuleId: string;
  metricName: string;
  signalType: SignalType;
  observedValue: number;
  expectedValue: number;
  anomalyScore: number;
  zScore: number;
  sigmaLevel: number;
  severity: AnomalySeverity;
  detectionMethod: DetectionMethod;
  labels: Record<string, string>;
  resourceAttributes: Record<string, string>;
  correlatedSignals: string[];
  llmAnalysis?: LLMAnomalyAnalysis;
  timestamp: string;
}

export interface LLMAnomalyAnalysis {
  summary: string;
  rootCauses: string[];
  impact: string;
  recommendations: string[];
  confidence: number;
  analysisTimestamp: string;
}

// ─── Stats / Timeline ─────────────────────────────────────────────────────────

export interface AnomalyStats {
  total: number;
  critical: number;
  warning: number;
  last24h: number;
  avgAnomalyScore: number;
  topMetrics: { metricName: string; count: number }[];
}

export interface AnomalyTimelinePoint {
  bucket: string;
  total: number;
  critical: number;
  warning: number;
  avgScore: number;
}

// ─── Corrective Maintenance ───────────────────────────────────────────────────

export type PlanStatus = "proposed" | "approved" | "executing" | "completed" | "failed" | "rejected";
export type ActionStatus = "pending" | "executing" | "completed" | "failed" | "skipped";
export type TriggerType = "anomaly" | "prediction" | "alert" | "manual";
export type RiskLevel = "low" | "medium" | "high";
export type ActionType =
  | "scale"
  | "restart"
  | "config-change"
  | "alert-suppress"
  | "runbook"
  | "manual"
  | "investigate";

export interface RemediationAction {
  id: string;
  planId: string;
  sequenceOrder: number;
  actionType: ActionType;
  title: string;
  description?: string;
  parameters?: Record<string, unknown>;
  status: ActionStatus;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RemediationPlan {
  id: string;
  organizationId: string;
  workspaceId?: string;
  triggerType: TriggerType;
  triggerSourceId?: string;
  triggerContext?: Record<string, unknown>;
  title: string;
  description?: string;
  rootCauseHypothesis?: string;
  riskLevel: RiskLevel;
  status: PlanStatus;
  llmProviderId?: string;
  llmModel?: string;
  llmTokensUsed?: number;
  llmLatencyMs?: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  notifyOnCreate: boolean;
  actions?: RemediationAction[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RemediationStats {
  total: number;
  byStatus: Record<string, number>;
  byTriggerType: Record<string, number>;
  successRate: number;
  pendingApproval: number;
}

export interface ListRemediationPlansResponse {
  data: RemediationPlan[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GenerateRemediationPlanRequest {
  triggerType: TriggerType | string;
  triggerSourceId?: string;
  triggerContext?: Record<string, unknown>;
  workspaceId?: string;
  notifyOnCreate?: boolean;
}

export interface ListRemediationPlansQuery {
  page?: number;
  pageSize?: number;
  status?: PlanStatus;
  triggerType?: TriggerType;
  riskLevel?: RiskLevel;
  from?: string;
  to?: string;
}

// ─── List responses ───────────────────────────────────────────────────────────

export interface ListDetectionRulesResponse {
  data: DetectionRule[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListAnomalyEventsResponse {
  data: AnomalyEvent[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export interface ListDetectionRulesQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  state?: DetectionRuleState;
}

export interface ListAnomalyEventsQuery {
  page?: number;
  pageSize?: number;
  detectionRuleId?: string;
  severity?: AnomalySeverity;
  signalType?: SignalType;
  from?: string;
  to?: string;
}

// ─── Cost Optimization ────────────────────────────────────────────────────────

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'alibaba' | 'huawei' | 'digitalocean';
export type CloudAccountStatus = 'pending' | 'active' | 'error' | 'disabled';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type BudgetStatus = 'ok' | 'warning' | 'critical';
export type RecommendationCategory =
  | 'rightsizing'
  | 'commitment'
  | 'waste'
  | 'architecture'
  | 'storage'
  | 'network'
  | 'scheduling';
export type RecommendationStatus = 'open' | 'accepted' | 'dismissed' | 'implemented';

export interface CloudAccount {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  provider: CloudProvider;
  accountIdentifier?: string;
  syncConfig: Record<string, unknown>;
  status: CloudAccountStatus;
  lastSyncAt?: string;
  lastSyncError?: string;
  consecutiveSyncFailures: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCloudAccountRequest {
  name: string;
  provider: CloudProvider;
  accountIdentifier?: string;
  credentials: Record<string, string>;
  syncConfig?: Record<string, unknown>;
  workspaceId?: string;
}

export interface UpdateCloudAccountRequest {
  name?: string;
  accountIdentifier?: string;
  credentials?: Record<string, string>;
  syncConfig?: Record<string, unknown>;
  isEnabled?: boolean;
}

export interface BudgetThreshold {
  level: 'warning' | 'critical';
  percentage: number;
}

export interface CostBudget {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  scope: Record<string, unknown>;
  thresholds: BudgetThreshold[];
  status: BudgetStatus;
  currentSpend: number;
  lastEvaluatedAt?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCostBudgetRequest {
  name: string;
  amount: number;
  currency?: string;
  period: BudgetPeriod;
  scope?: Record<string, unknown>;
  thresholds?: BudgetThreshold[];
  workspaceId?: string;
}

export interface UpdateCostBudgetRequest extends Partial<CreateCostBudgetRequest> {
  isEnabled?: boolean;
}

export interface BudgetStatusResponse {
  budgetId: string;
  name: string;
  amount: number;
  currency: string;
  currentSpend: number;
  percentage: number;
  status: BudgetStatus;
  thresholdsTriggered: { level: string; percentage: number }[];
  periodFrom: string;
  periodTo: string;
}

export interface CostRecommendation {
  id: string;
  organizationId: string;
  workspaceId?: string;
  category: RecommendationCategory;
  title: string;
  description?: string;
  estimatedMonthlySavings?: number;
  confidenceScore?: number;
  provider?: CloudProvider;
  affectedResources: Record<string, unknown>[];
  status: RecommendationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CostDataPoint {
  date: string;
  provider: string;
  serviceName: string;
  serviceCategory: string;
  region: string;
  pricingModel: string;
  totalCostUsd: number;
  totalUsage: number;
}

export interface CostAnalysisQuery {
  from: string;
  to: string;
  providers?: string[];
  accounts?: string[];
  services?: string[];
  regions?: string[];
  granularity?: 'daily' | 'monthly';
  groupBy?: string[];
  limit?: number;
}

// ─── Cost list responses ──────────────────────────────────────────────────────

export interface ListCloudAccountsResponse {
  data: CloudAccount[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListCostBudgetsResponse {
  data: CostBudget[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListCostRecommendationsResponse {
  data: CostRecommendation[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Predictive Maintenance ───────────────────────────────────────────────────

export type ResourceType = 'cpu' | 'memory' | 'disk' | 'network' | 'pod' | 'node';
export type Algorithm = 'linear-regression' | 'holt-winters';
export type PredictionHorizon = '1h' | '6h' | '24h' | '7d';
export type HealthStatus = 'healthy' | 'warning' | 'degrading' | 'critical' | 'failing';
export type PredictionModelState = 'initializing' | 'active' | 'error';

export interface HoltWintersConfig {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface PredictionModel {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  resourceType: ResourceType;
  algorithm: Algorithm;
  horizons: PredictionHorizon[];
  lookbackMultiplier: number;
  alertThreshold: number;
  holtWintersConfig: HoltWintersConfig;
  notificationChannelIds: string[];
  isEnabled: boolean;
  state: PredictionModelState;
  lastEvaluatedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  organizationId: string;
  workspaceId?: string;
  predictionModelId: string;
  resourceType: string;
  resourceIdentifier: string;
  algorithm: string;
  horizon: string;
  predictedValue: number;
  failureProbability: number;
  timeToFailureSeconds?: number | null;
  confidenceUpper: number;
  confidenceLower: number;
  rSquared: number;
  healthScore: number;
  healthStatus: HealthStatus;
  labels?: Record<string, string>;
  timestamp: string;
}

export interface HealthScore {
  resourceType: string;
  resourceIdentifier: string;
  avgHealthScore: number;
  minHealthScore: number;
  maxHealthScore: number;
  predictionCount: number;
  hour: string;
}

export interface PredictionTimelinePoint {
  bucket: string;
  avgFailureProbability: number;
  avgHealthScore: number;
  count: number;
}

export interface CreatePredictionModelRequest {
  name: string;
  resourceType: ResourceType;
  description?: string;
  algorithm?: Algorithm;
  horizons?: PredictionHorizon[];
  lookbackMultiplier?: number;
  alertThreshold?: number;
  holtWintersConfig?: HoltWintersConfig;
  notificationChannelIds?: string[];
  workspaceId?: string;
}

export interface UpdatePredictionModelRequest extends Partial<CreatePredictionModelRequest> {}

export interface ListPredictionModelsResponse {
  data: PredictionModel[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListPredictionsResponse {
  data: Prediction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListPredictionModelsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  resourceType?: ResourceType;
}

export interface ListPredictionsQuery {
  page?: number;
  pageSize?: number;
  resourceType?: ResourceType;
  horizon?: PredictionHorizon;
  from?: string;
  to?: string;
}
