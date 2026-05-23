<script setup lang="ts">
/**
 * Retention Policies View
 * TASK-10: Frontend view for Retention module
 *
 * Features:
 * - List all retention policies
 * - Create/Edit retention policies
 * - View retention statistics
 * - Enforce retention manually
 */

import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { NButton, NGrid, NGi, NTabs, NTabPane } from "naive-ui";
import { StatPanel } from "@/components/charts";
import { useStatPanelsFromRegistry } from "@/composables/useStatPanelsFromRegistry";
import RetentionPolicies from "./components/RetentionPolicies.vue";
import StatisticPolicies from "./components/StatisticPolicies.vue";

const activeRetentionTab = ref("policies");
const retentionPoliciesRef = ref<InstanceType<typeof RetentionPolicies> | null>(
  null,
);

// ==================== STAT CARDS ====================

const policyStats = ref({
  totalPolicies: 0,
  activePolicies: 0,
  customPolicies: 0,
  archiveEnabled: 0,
});

const statCards = useStatPanelsFromRegistry(
  ["RET20001", "RET20002", "RET20003", "RET20004"],
  {
    RET20001: computed(() => policyStats.value.totalPolicies),
    RET20002: computed(() => policyStats.value.activePolicies),
    RET20003: computed(() => policyStats.value.customPolicies),
    RET20004: computed(() => policyStats.value.archiveEnabled),
  },
  undefined,
  { sizeOverride: "small" },
);

function handleStatsUpdated(stats: typeof policyStats.value) {
  policyStats.value = stats;
}
</script>

<template>
  <div class="retention-policy-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="carbon:rule" class="title-icon" />
          Retention Policies
        </h1>
        <span class="page-subtitle">Manage data retention policies</span>
      </div>
      <div class="header-right">
        <NButton
          type="primary"
          @click="retentionPoliciesRef?.openCreateModal()"
        >
          <template #icon>
            <Icon icon="carbon:add" />
          </template>
          Add Policy
        </NButton>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stat-cards-container">
      <NGrid :cols="4" :x-gap="16" :y-gap="16">
        <NGi v-for="(config, index) in statCards" :key="`stat-${index}`">
          <StatPanel v-bind="config" />
        </NGi>
      </NGrid>
    </div>

    <!-- Tabs -->
    <NTabs
      v-model:value="activeRetentionTab"
      type="segment"
      animated
      class="main-tabs"
    >
      <NTabPane name="policies">
        <template #tab>
          <div class="tab-label">
            <Icon icon="carbon:data-backup" class="tab-icon" />
            <span>Policies</span>
          </div>
        </template>
        <RetentionPolicies
          ref="retentionPoliciesRef"
          @stats-updated="handleStatsUpdated"
        />
      </NTabPane>

      <NTabPane name="statistics">
        <template #tab>
          <div class="tab-label">
            <Icon icon="carbon:chart-line" class="tab-icon" />
            <span>Statistics</span>
          </div>
        </template>
        <StatisticPolicies />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped lang="scss">
/* ==================== RESPONSIVE BREAKPOINTS ==================== */
/* Mobile: max-width 768px, Tablet: max-width 1024px */

.retention-policy-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.title-icon {
  font-size: 28px;
  color: var(--primary-color);
}

.page-subtitle {
  color: var(--text-color-3);
  font-size: 14px;
}

.stat-cards-container {
  margin-bottom: 24px;
}

// Main tabs styles
.main-tabs {
  :deep(.n-tabs-rail) {
    background: rgba(128, 128, 128, 0.1);
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 8px;
    padding: 4px;
  }

  :deep(.n-tabs-tab) {
    font-weight: 700 !important;
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 6px;

    .tab-icon {
      font-size: 16px;
    }
  }
}

/* ==================== TABLET STYLES (max-width: 1024px) ==================== */
@media (max-width: 1024px) {
  .retention-policy-view {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .title-icon {
    font-size: 24px;
  }

  /* Stat cards - 2 columns on tablet */
  .stat-cards-container :deep(.n-grid) {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
  }
}

/* ==================== MOBILE STYLES (max-width: 768px) ==================== */
@media (max-width: 768px) {
  .retention-policy-view {
    padding: 16px 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .header-left {
    width: 100%;
  }

  .header-right {
    width: 100%;
  }

  .header-right :deep(.n-button) {
    width: 100%;
  }

  .page-title {
    font-size: 20px;
    gap: 8px;
  }

  .title-icon {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .stat-cards-container {
    margin-bottom: 16px;
  }
}

/* ==================== SMALL MOBILE (max-width: 480px) ==================== */
@media (max-width: 480px) {
  .retention-policy-view {
    padding: 12px 8px;
  }

  .page-title {
    font-size: 18px;
  }

  .title-icon {
    font-size: 20px;
  }

  /* Single column stat cards on very small screens */
  .stat-cards-container :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}
</style>
