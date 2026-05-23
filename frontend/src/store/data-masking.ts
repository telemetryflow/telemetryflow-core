import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dataMaskingApi } from '@/api/data-masking'
import type {
  MaskingPolicy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  ListPoliciesParams,
  BuiltinPatternDefinition,
  TestRuleRequest,
  TestRuleResponse,
} from '@/types/data-masking'

export const useDataMaskingStore = defineStore('data-masking', () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  const policies = ref<MaskingPolicy[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(1)

  const builtinPatterns = ref<BuiltinPatternDefinition[]>([])
  const selectedPolicy = ref<MaskingPolicy | null>(null)

  const loading = ref(false)
  const saving = ref(false)
  const testing = ref(false)
  const error = ref<string | null>(null)

  // ─── Computed ──────────────────────────────────────────────────────────────
  const enabledPolicies = computed(() => policies.value.filter((p) => p.enabled))
  const disabledPolicies = computed(() => policies.value.filter((p) => !p.enabled))
  const totalActiveRules = computed(() =>
    policies.value.reduce((sum, p) => sum + p.activeRuleCount, 0),
  )

  // ─── Actions ───────────────────────────────────────────────────────────────
  // HttpExceptionFilter wraps errors as { error: { message } } — not top-level message
  function extractApiError(err: any, fallback: string): string {
    const apiMsg = err?.response?.data?.error?.message ?? err?.response?.data?.message
    if (Array.isArray(apiMsg)) return apiMsg.join('; ')
    return apiMsg ?? err?.message ?? fallback
  }

  async function fetchPolicies(params: ListPoliciesParams = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await dataMaskingApi.listPolicies({
        ...params,
        page: page.value,
        pageSize: pageSize.value,
      })
      policies.value = res.data
      total.value = res.total
      totalPages.value = res.totalPages
    } catch (err: any) {
      error.value = extractApiError(err, 'Failed to load policies')
    } finally {
      loading.value = false
    }
  }

  async function fetchPolicy(id: string): Promise<MaskingPolicy | null> {
    loading.value = true
    error.value = null
    try {
      const policy = await dataMaskingApi.getPolicy(id)
      selectedPolicy.value = policy
      return policy
    } catch (err: any) {
      error.value = extractApiError(err, 'Failed to load policy')
      return null
    } finally {
      loading.value = false
    }
  }

  async function createPolicy(payload: CreatePolicyRequest): Promise<MaskingPolicy | null> {
    saving.value = true
    error.value = null
    try {
      const policy = await dataMaskingApi.createPolicy(payload)
      policies.value.unshift(policy)
      total.value++
      return policy
    } catch (err: any) {
      error.value = extractApiError(err, 'Failed to create policy')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updatePolicy(id: string, payload: UpdatePolicyRequest): Promise<MaskingPolicy | null> {
    saving.value = true
    error.value = null
    try {
      const updated = await dataMaskingApi.updatePolicy(id, payload)
      const idx = policies.value.findIndex((p) => p.id === id)
      if (idx >= 0) policies.value[idx] = updated
      if (selectedPolicy.value?.id === id) selectedPolicy.value = updated
      return updated
    } catch (err: any) {
      error.value = extractApiError(err, 'Failed to update policy')
      return null
    } finally {
      saving.value = false
    }
  }

  async function deletePolicy(id: string): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      await dataMaskingApi.deletePolicy(id)
      policies.value = policies.value.filter((p) => p.id !== id)
      total.value--
      if (selectedPolicy.value?.id === id) selectedPolicy.value = null
      return true
    } catch (err: any) {
      error.value = extractApiError(err, 'Failed to delete policy')
      return false
    } finally {
      saving.value = false
    }
  }

  async function togglePolicy(id: string, enabled: boolean): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const updated = enabled
        ? await dataMaskingApi.enablePolicy(id)
        : await dataMaskingApi.disablePolicy(id)
      const idx = policies.value.findIndex((p) => p.id === id)
      if (idx >= 0) policies.value[idx] = updated
      if (selectedPolicy.value?.id === id) selectedPolicy.value = updated
      return true
    } catch (err: any) {
      error.value = extractApiError(err, 'Failed to toggle policy')
      return false
    } finally {
      saving.value = false
    }
  }

  async function fetchBuiltinPatterns(): Promise<void> {
    if (builtinPatterns.value.length > 0) return
    try {
      builtinPatterns.value = await dataMaskingApi.getBuiltinPatterns()
    } catch {
      // Non-critical — built-in patterns are also defined client-side
    }
  }

  async function testRule(payload: TestRuleRequest): Promise<TestRuleResponse | null> {
    testing.value = true
    error.value = null
    try {
      return await dataMaskingApi.testRule(payload)
    } catch (err: any) {
      error.value = extractApiError(err, 'Rule test failed')
      return null
    } finally {
      testing.value = false
    }
  }

  function setPage(p: number) {
    page.value = p
  }

  function clearError() {
    error.value = null
  }

  function setSelected(policy: MaskingPolicy | null) {
    selectedPolicy.value = policy
  }

  return {
    // State
    policies,
    total,
    page,
    pageSize,
    totalPages,
    builtinPatterns,
    selectedPolicy,
    loading,
    saving,
    testing,
    error,
    // Computed
    enabledPolicies,
    disabledPolicies,
    totalActiveRules,
    // Actions
    fetchPolicies,
    fetchPolicy,
    createPolicy,
    updatePolicy,
    deletePolicy,
    togglePolicy,
    fetchBuiltinPatterns,
    testRule,
    setPage,
    clearError,
    setSelected,
  }
})
