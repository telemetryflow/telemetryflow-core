/**
 * Frontend types for the Data Masking feature
 */

export enum TargetField {
  BODY = 'body',
  RESOURCE_ATTRIBUTES = 'resource_attributes',
  LOG_ATTRIBUTES = 'log_attributes',
  RESOURCE_ATTRIBUTE_KEY = 'resource_attribute_key',
  LOG_ATTRIBUTE_KEY = 'log_attribute_key',
  ALL = 'all',
}

export enum BuiltinPattern {
  EMAIL = 'EMAIL',
  CREDIT_CARD = 'CREDIT_CARD',
  SSN = 'SSN',
  PHONE = 'PHONE',
  IP_ADDRESS = 'IP_ADDRESS',
  JWT_TOKEN = 'JWT_TOKEN',
  API_KEY_GENERIC = 'API_KEY_GENERIC',
  URL_CREDENTIALS = 'URL_CREDENTIALS',
  AWS_ACCESS_KEY = 'AWS_ACCESS_KEY',
  PRIVATE_KEY = 'PRIVATE_KEY',
}

export enum MaskType {
  REDACT = 'REDACT',
  HASH = 'HASH',
  REPLACE = 'REPLACE',
  TRUNCATE = 'TRUNCATE',
}

export enum MatchType {
  BUILTIN = 'builtin',
  REGEX = 'regex',
  EXACT = 'exact',
}

export interface MaskingRule {
  id?: string
  name: string
  description?: string
  enabled: boolean
  priority: number
  targetField: TargetField
  fieldKey?: string
  matchType: MatchType
  builtinPattern?: BuiltinPattern
  customPattern?: string
  maskType: MaskType
  replacement?: string
  truncateLength?: number
}

export interface MaskingPolicy {
  id: string
  organizationId: string
  workspaceId: string | null
  name: string
  description: string | null
  enabled: boolean
  rules: MaskingRule[]
  ruleCount: number
  activeRuleCount: number
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePolicyRequest {
  name: string
  description?: string
  enabled?: boolean
  workspaceId?: string
  rules: MaskingRule[]
}

export interface UpdatePolicyRequest {
  name?: string
  description?: string
  enabled?: boolean
  rules?: MaskingRule[]
}

export interface ListPoliciesResponse {
  data: MaskingPolicy[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListPoliciesParams {
  workspaceId?: string
  enabled?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export interface TestRuleRequest {
  rule: MaskingRule
  sampleInput: string
}

export interface TestRuleResponse {
  original: string
  masked: string
  changed: boolean
  matchCount: number
}

export interface BuiltinPatternDefinition {
  name: string
  regexSource: string
  flags: string
  description: string
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export const TARGET_FIELD_LABELS: Record<TargetField, string> = {
  [TargetField.BODY]: 'Log Body',
  [TargetField.RESOURCE_ATTRIBUTES]: 'All Resource Attributes',
  [TargetField.LOG_ATTRIBUTES]: 'All Log Attributes',
  [TargetField.RESOURCE_ATTRIBUTE_KEY]: 'Resource Attribute (specific key)',
  [TargetField.LOG_ATTRIBUTE_KEY]: 'Log Attribute (specific key)',
  [TargetField.ALL]: 'All Fields',
}

export const MASK_TYPE_LABELS: Record<MaskType, string> = {
  [MaskType.REDACT]: 'Redact',
  [MaskType.HASH]: 'Hash (SHA-256)',
  [MaskType.REPLACE]: 'Replace',
  [MaskType.TRUNCATE]: 'Truncate',
}

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  [MatchType.BUILTIN]: 'Built-in Pattern',
  [MatchType.REGEX]: 'Custom Regex',
  [MatchType.EXACT]: 'Exact Match',
}

export const BUILTIN_PATTERN_LABELS: Record<BuiltinPattern, string> = {
  [BuiltinPattern.EMAIL]: 'Email Address',
  [BuiltinPattern.CREDIT_CARD]: 'Credit Card Number',
  [BuiltinPattern.SSN]: 'Social Security Number (SSN)',
  [BuiltinPattern.PHONE]: 'Phone Number',
  [BuiltinPattern.IP_ADDRESS]: 'IP Address',
  [BuiltinPattern.JWT_TOKEN]: 'JWT Token',
  [BuiltinPattern.API_KEY_GENERIC]: 'Generic API Key / Secret',
  [BuiltinPattern.URL_CREDENTIALS]: 'URL with Credentials',
  [BuiltinPattern.AWS_ACCESS_KEY]: 'AWS Access Key ID',
  [BuiltinPattern.PRIVATE_KEY]: 'Private Key (PEM)',
}
