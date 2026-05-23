/**
 * Subscription Types
 * TASK-10: Frontend types for Subscription module
 *
 * Matches backend DTOs from subscription module
 */

// ==================== ENUMS ====================

export type PlanType =
  | "FREE"
  | "STARTER"
  | "PROFESSIONAL"
  | "ENTERPRISE"
  | "CUSTOM";

export const PLAN_TYPES: Record<
  PlanType,
  { label: string; color: string; icon: string }
> = {
  FREE: { label: "Free", color: "default", icon: "carbon:gift" },
  STARTER: { label: "Starter", color: "info", icon: "carbon:rocket" },
  PROFESSIONAL: {
    label: "Professional",
    color: "success",
    icon: "carbon:star",
  },
  ENTERPRISE: {
    label: "Enterprise",
    color: "warning",
    icon: "carbon:enterprise",
  },
  CUSTOM: { label: "Custom", color: "purple", icon: "carbon:settings" },
};

export type BillingCycle = "MONTHLY" | "YEARLY";

export const BILLING_CYCLES: Record<
  BillingCycle,
  { label: string; discount?: string }
> = {
  MONTHLY: { label: "Monthly" },
  YEARLY: { label: "Yearly", discount: "Save 20%" },
};

export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID"
  | "PAUSED";

export const SUBSCRIPTION_STATUS: Record<
  SubscriptionStatus,
  { label: string; color: string }
> = {
  ACTIVE: { label: "Active", color: "success" },
  TRIALING: { label: "Trial", color: "info" },
  PAST_DUE: { label: "Past Due", color: "warning" },
  CANCELED: { label: "Canceled", color: "default" },
  UNPAID: { label: "Unpaid", color: "error" },
  PAUSED: { label: "Paused", color: "default" },
};

export type UsageMetricType =
  | "LOG_INGESTION_GB"
  | "METRIC_DATA_POINTS"
  | "TRACE_SPANS"
  | "EXEMPLARS"
  | "UPTIME_CHECKS"
  | "AUDIT_LOGS"
  | "KUBERNETES_METRICS"
  | "LLM_USAGE"
  | "NETWORK_MAP_CONNECTIONS"
  | "NETWORK_MAP_TRAFFIC"
  | "SERVICE_MAP_METRICS"
  | "SIGNAL_CORRELATIONS"
  | "VM_METRICS"
  | "API_CALLS"
  | "USERS"
  | "DASHBOARDS"
  | "ALERT_RULES"
  | "API_KEYS";

// Icons match sidebar menu exactly (SideNav.vue)
export const USAGE_METRICS: Record<
  UsageMetricType,
  { label: string; unit: string; icon: string }
> = {
  LOG_INGESTION_GB: {
    label: "Log Ingestion",
    unit: "GB",
    icon: "carbon:document",
  },
  METRIC_DATA_POINTS: {
    label: "Metric Data Points",
    unit: "points",
    icon: "carbon:chart-line",
  },
  TRACE_SPANS: { label: "Trace Spans", unit: "spans", icon: "carbon:flow" },
  EXEMPLARS: { label: "Exemplars", unit: "records", icon: "carbon:link" },
  UPTIME_CHECKS: {
    label: "Uptime Checks",
    unit: "checks",
    icon: "carbon:activity",
  },
  AUDIT_LOGS: {
    label: "Audit Logs",
    unit: "records",
    icon: "carbon:document-security",
  },
  KUBERNETES_METRICS: {
    label: "Kubernetes",
    unit: "records",
    icon: "simple-icons:kubernetes",
  },
  LLM_USAGE: {
    label: "AI Assistant",
    unit: "records",
    icon: "carbon:ai-status",
  },
  NETWORK_MAP_CONNECTIONS: {
    label: "Network Map",
    unit: "records",
    icon: "carbon:network-overlay",
  },
  NETWORK_MAP_TRAFFIC: {
    label: "Network Traffic",
    unit: "records",
    icon: "carbon:network-3",
  },
  SERVICE_MAP_METRICS: {
    label: "Service Map",
    unit: "records",
    icon: "carbon:flow-connection",
  },
  SIGNAL_CORRELATIONS: {
    label: "Correlations",
    unit: "records",
    icon: "carbon:connect",
  },
  VM_METRICS: { label: "VM Metrics", unit: "records", icon: "carbon:chip" },
  API_CALLS: { label: "API Calls", unit: "calls", icon: "carbon:api" },
  USERS: { label: "Users", unit: "users", icon: "carbon:user-multiple" },
  DASHBOARDS: {
    label: "Dashboards",
    unit: "dashboards",
    icon: "carbon:dashboard",
  },
  ALERT_RULES: {
    label: "Alert Rules",
    unit: "rules",
    icon: "carbon:warning-alt",
  },
  API_KEYS: { label: "API Keys", unit: "keys", icon: "carbon:password" },
};

export type InvoiceStatus =
  | "DRAFT"
  | "OPEN"
  | "PAID"
  | "VOID"
  | "UNCOLLECTIBLE";

export const INVOICE_STATUS: Record<
  InvoiceStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: "Draft", color: "default" },
  OPEN: { label: "Open", color: "warning" },
  PAID: { label: "Paid", color: "success" },
  VOID: { label: "Void", color: "default" },
  UNCOLLECTIBLE: { label: "Uncollectible", color: "error" },
};

// ==================== CORE TYPES ====================

/**
 * Plan feature
 */
export interface PlanFeature {
  name: string;
  code: string;
  limit?: number | null;
  unit?: string;
}

/**
 * Plan pricing
 */
export interface PlanPricing {
  billingCycle: BillingCycle;
  amount: number; // in cents
  currency: string;
  discountPercent?: number;
}

/**
 * Plan entity
 */
export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  description?: string;
  features: PlanFeature[];
  pricing: PlanPricing[];
  isActive: boolean;
  isDefault: boolean;
  trialDays: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

/**
 * Subscription entity
 */
export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trialStart?: number;
  trialEnd?: number;
  canceledAt?: number;
  cancelAtPeriodEnd: boolean;
  daysRemainingInPeriod: number;
  daysRemainingInTrial?: number;
  isActive: boolean;
  isTrialing: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Usage metric
 */
export interface UsageMetric {
  metricType: UsageMetricType;
  current: number;
  limit?: number;
  percentUsed: number;
  allowed: boolean;
}

/**
 * Usage entity
 */
export interface Usage {
  id: string;
  organizationId: string;
  subscriptionId: string;
  periodStart: number;
  periodEnd: number;
  daysRemaining: number;
  metrics: Record<string, number>;
  lastUpdated: number;
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  periodStart?: number;
  periodEnd?: number;
}

/**
 * Invoice entity
 */
export interface Invoice {
  id: string;
  organizationId: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  formattedTotal: string;
  formattedAmountDue: string;
  lineItems: InvoiceLineItem[];
  periodStart: number;
  periodEnd: number;
  dueDate: number;
  paidAt?: number;
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
  isOverdue: boolean;
  daysUntilDue: number;
  createdAt: number;
}

// ==================== BACKEND RESPONSE TYPES ====================
// NOTE: Backend NestJS controller returns camelCase JSON with lowercase enum values.
// Transform functions below convert to frontend conventions (UPPERCASE enums, timestamps).

export interface PlanResponse {
  id: string;
  name: string;
  type: string; // lowercase from backend (e.g. "starter")
  description?: string;
  features: PlanFeature[];
  pricing: Array<{
    billingCycle: string; // lowercase (e.g. "monthly")
    amount: number;
    currency: string;
    discountPercent?: number;
  }>;
  isActive: boolean;
  isDefault: boolean;
  trialDays: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

export interface SubscriptionResponse {
  id: string;
  organizationId: string;
  planId: string;
  planType: string; // lowercase
  status: string; // lowercase
  billingCycle: string; // lowercase
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  cancelAtPeriodEnd: boolean;
  daysRemainingInPeriod: number;
  daysRemainingInTrial?: number;
  isActive: boolean;
  isTrialing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageResponse {
  id: string;
  organizationId: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  daysRemaining: number;
  metrics: Record<string, number>;
  lastUpdated: string;
}

export interface InvoiceResponse {
  id: string;
  organizationId: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: string; // lowercase
  currency: string;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  formattedTotal: string;
  formattedAmountDue: string;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
    periodStart?: string;
    periodEnd?: string;
  }>;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt?: string;
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
  isOverdue: boolean;
  daysUntilDue: number;
  createdAt: string;
}

// ==================== TRANSFORM FUNCTIONS ====================
// Backend returns camelCase fields with lowercase enum values.
// These transforms convert lowercase enums → UPPERCASE for frontend constants.

export function transformPlan(response: PlanResponse): Plan {
  return {
    id: response.id,
    name: response.name,
    type: (response.type as string).toUpperCase() as PlanType,
    description: response.description,
    features: response.features,
    pricing: response.pricing.map((p) => ({
      billingCycle: (p.billingCycle as string).toUpperCase() as BillingCycle,
      amount: p.amount,
      currency: p.currency,
      discountPercent: p.discountPercent,
    })),
    isActive: response.isActive,
    isDefault: response.isDefault,
    trialDays: response.trialDays,
    monthlyPrice: response.monthlyPrice,
    yearlyPrice: response.yearlyPrice,
  };
}

export function transformSubscription(
  response: SubscriptionResponse,
): Subscription {
  return {
    id: response.id,
    organizationId: response.organizationId,
    planId: response.planId,
    planType: (response.planType as string).toUpperCase() as PlanType,
    status: (response.status as string).toUpperCase() as SubscriptionStatus,
    billingCycle: (
      response.billingCycle as string
    ).toUpperCase() as BillingCycle,
    currentPeriodStart: new Date(response.currentPeriodStart).getTime(),
    currentPeriodEnd: new Date(response.currentPeriodEnd).getTime(),
    trialStart: response.trialStart
      ? new Date(response.trialStart).getTime()
      : undefined,
    trialEnd: response.trialEnd
      ? new Date(response.trialEnd).getTime()
      : undefined,
    canceledAt: response.canceledAt
      ? new Date(response.canceledAt).getTime()
      : undefined,
    cancelAtPeriodEnd: response.cancelAtPeriodEnd,
    daysRemainingInPeriod: response.daysRemainingInPeriod,
    daysRemainingInTrial: response.daysRemainingInTrial,
    isActive: response.isActive,
    isTrialing: response.isTrialing,
    createdAt: new Date(response.createdAt).getTime(),
    updatedAt: new Date(response.updatedAt).getTime(),
  };
}

export function transformUsage(response: UsageResponse): Usage {
  return {
    id: response.id,
    organizationId: response.organizationId,
    subscriptionId: response.subscriptionId,
    periodStart: new Date(response.periodStart).getTime(),
    periodEnd: new Date(response.periodEnd).getTime(),
    daysRemaining: response.daysRemaining,
    metrics: response.metrics,
    lastUpdated: new Date(response.lastUpdated).getTime(),
  };
}

export function transformInvoice(response: InvoiceResponse): Invoice {
  return {
    id: response.id,
    organizationId: response.organizationId,
    subscriptionId: response.subscriptionId,
    invoiceNumber: response.invoiceNumber,
    status: (response.status as string).toUpperCase() as InvoiceStatus,
    currency: response.currency,
    subtotal: response.subtotal,
    tax: response.tax,
    taxRate: response.taxRate,
    discount: response.discount,
    total: response.total,
    amountPaid: response.amountPaid,
    amountDue: response.amountDue,
    formattedTotal: response.formattedTotal,
    formattedAmountDue: response.formattedAmountDue,
    lineItems: response.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      amount: item.amount,
      periodStart: item.periodStart
        ? new Date(item.periodStart).getTime()
        : undefined,
      periodEnd: item.periodEnd
        ? new Date(item.periodEnd).getTime()
        : undefined,
    })),
    periodStart: new Date(response.periodStart).getTime(),
    periodEnd: new Date(response.periodEnd).getTime(),
    dueDate: new Date(response.dueDate).getTime(),
    paidAt: response.paidAt ? new Date(response.paidAt).getTime() : undefined,
    hostedInvoiceUrl: response.hostedInvoiceUrl,
    pdfUrl: response.pdfUrl,
    isOverdue: response.isOverdue,
    daysUntilDue: response.daysUntilDue,
    createdAt: new Date(response.createdAt).getTime(),
  };
}

// ==================== REQUEST TYPES ====================

export interface CreateSubscriptionRequest {
  planType?: PlanType;
  billingCycle?: BillingCycle;
  withTrial?: boolean;
}

export interface ChangePlanRequest {
  planType: PlanType;
  billingCycle?: BillingCycle;
  immediate?: boolean;
}

export interface CancelSubscriptionRequest {
  immediate?: boolean;
  reason?: string;
}

export interface PauseSubscriptionRequest {
  resumeAt?: string;
}

export interface IncrementUsageRequest {
  metricType: UsageMetricType;
  amount?: number;
}

export interface ListInvoicesQuery {
  status?: InvoiceStatus;
  limit?: number;
  offset?: number;
}

// ==================== UI HELPERS ====================

/**
 * Format price in cents to display string
 */
export function formatPrice(cents: number, currency: string = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Get feature limit display string
 */
export function formatFeatureLimit(limit: number | null | undefined): string {
  if (limit === undefined || limit === null || limit === -1) return "Unlimited";
  return limit.toLocaleString();
}

/**
 * Get usage percentage color
 */
export function getUsageColor(percent: number): string {
  if (percent >= 90) return "error";
  if (percent >= 75) return "warning";
  return "success";
}

/**
 * Check if subscription can be upgraded
 */
export function canUpgrade(current: PlanType, target: PlanType): boolean {
  const order: PlanType[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
  return order.indexOf(target) > order.indexOf(current);
}

/**
 * Check if subscription can be downgraded
 */
export function canDowngrade(current: PlanType, target: PlanType): boolean {
  const order: PlanType[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
  return order.indexOf(target) < order.indexOf(current);
}
