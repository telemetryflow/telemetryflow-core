/**
 * Data Masking API — TelemetryFlow Platform
 *
 * Provides functions for managing PII masking policies and testing rules.
 * All endpoints require JWT authentication.
 *
 * Base path: /api/v2/data-masking
 */

import { config } from '@/config'
import { iamClient } from './iam'
import type {
  MaskingPolicy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  ListPoliciesResponse,
  ListPoliciesParams,
  TestRuleRequest,
  TestRuleResponse,
  BuiltinPatternDefinition,
  MaskingRule,
  MatchType,
  MaskType,
  TargetField,
  BuiltinPattern,
} from '@/types/data-masking'
import { MatchType as MatchTypeEnum, MaskType as MaskTypeEnum, TargetField as TargetFieldEnum, BuiltinPattern as BuiltinPatternEnum } from '@/types/data-masking'
import { MOCK_MASKING_POLICIES } from '@/mocks/data-masking'

// ─── Endpoint constants ───────────────────────────────────────────────────────

const BASE = '/data-masking'

export const DATA_MASKING_ENDPOINTS = {
  LIST_POLICIES:        `${BASE}/policies`,
  GET_POLICY:           (id: string) => `${BASE}/policies/${id}`,
  CREATE_POLICY:        `${BASE}/policies`,
  UPDATE_POLICY:        (id: string) => `${BASE}/policies/${id}`,
  DELETE_POLICY:        (id: string) => `${BASE}/policies/${id}`,
  ENABLE_POLICY:        (id: string) => `${BASE}/policies/${id}/enable`,
  DISABLE_POLICY:       (id: string) => `${BASE}/policies/${id}/disable`,
  BUILTIN_PATTERNS:     `${BASE}/builtin-patterns`,
  TEST_RULE:            `${BASE}/test-rule`,
} as const

// ─── Mock data (imported from centralized mocks module) ────────────────────────

// Mutable copy so create/update/delete operations work during mock sessions
const MOCK_POLICIES: MaskingPolicy[] = [...MOCK_MASKING_POLICIES]

const MOCK_BUILTIN_PATTERNS: BuiltinPatternDefinition[] = [
  { name: 'EMAIL', regexSource: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}', flags: 'g', description: 'Standard email addresses (RFC-5322 simplified)' },
  { name: 'CREDIT_CARD', regexSource: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|...)\\b', flags: 'g', description: 'Visa, Mastercard, Amex, Discover, JCB' },
  { name: 'SSN', regexSource: '\\b\\d{3}-\\d{2}-\\d{4}\\b', flags: 'g', description: 'US Social Security Numbers' },
  { name: 'PHONE', regexSource: '(?:\\+?1[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'g', description: 'North American phone numbers' },
  { name: 'IP_ADDRESS', regexSource: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', flags: 'g', description: 'IPv4 addresses' },
  { name: 'JWT_TOKEN', regexSource: 'eyJ[A-Za-z0-9_-]{2,}\\.eyJ[A-Za-z0-9_-]{2,}\\.[A-Za-z0-9_-]{2,}', flags: 'g', description: 'JSON Web Tokens' },
  { name: 'API_KEY_GENERIC', regexSource: '(?:api[_-]?key|token|secret|password)\\s*[=:]\\s*["\']?([A-Za-z0-9_\\-\\.]{16,})', flags: 'gi', description: 'Generic API keys and secrets' },
  { name: 'URL_CREDENTIALS', regexSource: 'https?:\\/\\/[^:@\\/\\s]+:[^@\\/\\s]+@[^\\s]+', flags: 'g', description: 'URLs with embedded credentials' },
  { name: 'AWS_ACCESS_KEY', regexSource: '\\b(?:AKIA|ASIA|AROA|AIDA)[A-Z0-9]{16}\\b', flags: 'g', description: 'AWS IAM access key IDs' },
  { name: 'PRIVATE_KEY', regexSource: '-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\\s\\S]+?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----', flags: 'g', description: 'PEM-encoded private key blocks' },
]

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// ─── API functions ─────────────────────────────────────────────────────────────

export async function listPolicies(
  params: ListPoliciesParams = {},
): Promise<ListPoliciesResponse> {
  if (config.useMock) {
    await delay()
    let data = [...MOCK_POLICIES]
    if (params.enabled !== undefined) data = data.filter((p) => p.enabled === params.enabled)
    if (params.search) {
      const s = params.search.toLowerCase()
      data = data.filter((p) => p.name.toLowerCase().includes(s))
    }
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const paginated = data.slice((page - 1) * pageSize, page * pageSize)
    return { data: paginated, total: data.length, page, pageSize, totalPages: Math.ceil(data.length / pageSize) }
  }

  return iamClient.get<ListPoliciesResponse>(DATA_MASKING_ENDPOINTS.LIST_POLICIES, { params })
}

export async function getPolicy(id: string): Promise<MaskingPolicy> {
  if (config.useMock) {
    await delay()
    const policy = MOCK_POLICIES.find((p) => p.id === id)
    if (!policy) throw new Error(`Policy ${id} not found`)
    return policy
  }

  return iamClient.get<MaskingPolicy>(DATA_MASKING_ENDPOINTS.GET_POLICY(id))
}

export async function createPolicy(payload: CreatePolicyRequest): Promise<MaskingPolicy> {
  if (config.useMock) {
    await delay(500)
    const newPolicy: MaskingPolicy = {
      id: `dm-policy-${Date.now()}`,
      organizationId: 'org-001',
      workspaceId: payload.workspaceId ?? null,
      name: payload.name,
      description: payload.description ?? null,
      enabled: payload.enabled ?? true,
      rules: payload.rules,
      ruleCount: payload.rules.length,
      activeRuleCount: payload.rules.filter((r) => r.enabled).length,
      createdBy: 'user-001',
      updatedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    MOCK_POLICIES.unshift(newPolicy)
    return newPolicy
  }

  return iamClient.post<MaskingPolicy>(DATA_MASKING_ENDPOINTS.CREATE_POLICY, payload)
}

export async function updatePolicy(id: string, payload: UpdatePolicyRequest): Promise<MaskingPolicy> {
  if (config.useMock) {
    await delay(400)
    const idx = MOCK_POLICIES.findIndex((p) => p.id === id)
    if (idx < 0) throw new Error(`Policy ${id} not found`)
    const updated = {
      ...MOCK_POLICIES[idx],
      ...payload,
      ruleCount: payload.rules?.length ?? MOCK_POLICIES[idx].ruleCount,
      activeRuleCount: payload.rules?.filter((r) => r.enabled).length ?? MOCK_POLICIES[idx].activeRuleCount,
      updatedAt: new Date().toISOString(),
    }
    MOCK_POLICIES[idx] = updated
    return updated
  }

  return iamClient.patch<MaskingPolicy>(DATA_MASKING_ENDPOINTS.UPDATE_POLICY(id), payload)
}

export async function deletePolicy(id: string): Promise<void> {
  if (config.useMock) {
    await delay(300)
    const idx = MOCK_POLICIES.findIndex((p) => p.id === id)
    if (idx >= 0) MOCK_POLICIES.splice(idx, 1)
    return
  }

  await iamClient.delete(DATA_MASKING_ENDPOINTS.DELETE_POLICY(id))
}

export async function enablePolicy(id: string): Promise<MaskingPolicy> {
  if (config.useMock) {
    await delay(200)
    const idx = MOCK_POLICIES.findIndex((p) => p.id === id)
    if (idx < 0) throw new Error(`Policy ${id} not found`)
    MOCK_POLICIES[idx] = { ...MOCK_POLICIES[idx], enabled: true, updatedAt: new Date().toISOString() }
    return MOCK_POLICIES[idx]
  }

  return iamClient.patch<MaskingPolicy>(DATA_MASKING_ENDPOINTS.ENABLE_POLICY(id))
}

export async function disablePolicy(id: string): Promise<MaskingPolicy> {
  if (config.useMock) {
    await delay(200)
    const idx = MOCK_POLICIES.findIndex((p) => p.id === id)
    if (idx < 0) throw new Error(`Policy ${id} not found`)
    MOCK_POLICIES[idx] = { ...MOCK_POLICIES[idx], enabled: false, updatedAt: new Date().toISOString() }
    return MOCK_POLICIES[idx]
  }

  return iamClient.patch<MaskingPolicy>(DATA_MASKING_ENDPOINTS.DISABLE_POLICY(id))
}

export async function getBuiltinPatterns(): Promise<BuiltinPatternDefinition[]> {
  if (config.useMock) {
    await delay(100)
    return MOCK_BUILTIN_PATTERNS
  }

  return iamClient.get<BuiltinPatternDefinition[]>(DATA_MASKING_ENDPOINTS.BUILTIN_PATTERNS)
}

export async function testRule(payload: TestRuleRequest): Promise<TestRuleResponse> {
  if (config.useMock) {
    await delay(200)
    // Simple client-side simulation for mock mode
    const { sampleInput, rule } = payload
    const changed = sampleInput.includes('@') || sampleInput.match(/\d{3}-\d{2}-\d{4}/) !== null
    const masked = changed
      ? sampleInput.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, rule.replacement ?? '[REDACTED]')
      : sampleInput
    return { original: sampleInput, masked, changed, matchCount: changed ? 1 : 0 }
  }

  return iamClient.post<TestRuleResponse>(DATA_MASKING_ENDPOINTS.TEST_RULE, payload)
}

export const dataMaskingApi = {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  enablePolicy,
  disablePolicy,
  getBuiltinPatterns,
  testRule,
}
