<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  NGrid,
  NGi,
  NTag,
  NTime,
  NText,
  NAlert,
  NSpin,
  useMessage,
} from "naive-ui";
import { retentionApi } from "@/api/retention";
import type { RetentionStatistics } from "@/types/retention";
import { DATA_TYPES } from "@/types/retention";

const message = useMessage();

const statistics = ref<RetentionStatistics[]>([]);
const statsLoading = ref(false);

async function fetchStatistics() {
  statsLoading.value = true;
  try {
    statistics.value = await retentionApi.getStatistics();
  } catch (error) {
    message.error("Failed to fetch retention statistics");
    console.error(error);
  } finally {
    statsLoading.value = false;
  }
}

onMounted(() => {
  fetchStatistics();
});
</script>

<template>
  <div class="statistic-policies">
    <NSpin :show="statsLoading">
      <NGrid :cols="2" :x-gap="16" :y-gap="16">
        <NGi v-for="s in statistics" :key="`stats-${s.dataType}`">
          <div class="stats-card">
            <div class="stats-card-header">
              <div class="stats-card-title">
                <Icon
                  :icon="DATA_TYPES[s.dataType].icon"
                  class="stats-card-icon"
                />
                <span>{{ DATA_TYPES[s.dataType].label }}</span>
              </div>
              <NTag
                :color="{
                  color: `${DATA_TYPES[s.dataType].hexColor}26`,
                  borderColor: DATA_TYPES[s.dataType].hexColor,
                  textColor: DATA_TYPES[s.dataType].hexColor,
                }"
                size="small"
              >
                {{ s.totalRecords.toLocaleString() }} records
              </NTag>
            </div>
            <table class="stats-info-table">
              <tbody>
                <tr>
                  <td class="stats-label">Total Records</td>
                  <td class="stats-value">
                    {{ s.totalRecords.toLocaleString() }}
                  </td>
                  <td class="stats-label">Estimated Size</td>
                  <td class="stats-value">{{ s.estimatedSize }}</td>
                </tr>
                <tr>
                  <td class="stats-label">Oldest Record</td>
                  <td class="stats-value">
                    <NTime
                      v-if="s.oldestRecord"
                      :time="s.oldestRecord"
                      type="relative"
                    />
                    <span v-else class="stats-none">None</span>
                  </td>
                  <td class="stats-label">Newest Record</td>
                  <td class="stats-value">
                    <NTime
                      v-if="s.newestRecord"
                      :time="s.newestRecord"
                      type="relative"
                    />
                    <span v-else class="stats-none">None</span>
                  </td>
                </tr>
                <tr>
                  <td class="stats-label">Active Policy</td>
                  <td class="stats-value">
                    <NTag v-if="s.retentionPolicy" type="info" size="small">
                      {{ s.retentionPolicy.name }}
                    </NTag>
                    <span v-else class="stats-none">None</span>
                  </td>
                  <td class="stats-label">Records to Delete</td>
                  <td class="stats-value">
                    <NText v-if="s.recordsToDelete" type="error" strong>
                      {{ s.recordsToDelete.toLocaleString() }}
                    </NText>
                    <span v-else class="stats-none">0</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </NGi>
      </NGrid>
    </NSpin>

    <NAlert type="info" style="margin-top: 16px">
      <template #icon>
        <Icon icon="carbon:information" />
      </template>
      Retention enforcement runs automatically on a scheduled basis. Statistics
      show estimated data to be removed during the next enforcement cycle.
    </NAlert>
  </div>
</template>

<style scoped lang="scss">
.statistic-policies {
  padding: 0;
}

/* ==================== STATISTICS CARDS ==================== */

.stats-card {
  border: 1px solid var(--k8s-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.stats-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--k8s-border-color);
  background: #f1f5f9;

  :root.dark & {
    background: #2a2a3a;
  }
}

.stats-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

.stats-card-icon {
  font-size: 18px;
  color: var(--primary-color);
}

.stats-info-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;

  td {
    padding: 10px 14px;
    font-size: 0.8125rem;
    border-bottom: 1px solid var(--k8s-border-color);
    border-right: 1px solid var(--k8s-border-color);
    vertical-align: middle;

    &:last-child {
      border-right: none;
    }
  }

  tr:last-child td {
    border-bottom: none;
  }

  .stats-label {
    font-weight: 500;
    color: var(--n-text-color-3);
    width: 25%;
    word-break: break-word;
    overflow-wrap: break-word;
    background: rgba(100, 116, 139, 0.06);

    :root.dark & {
      background: rgba(255, 255, 255, 0.03);
    }
  }

  .stats-value {
    font-weight: 700;
    color: var(--n-text-color);
    width: 25%;
    overflow: hidden;
    word-break: break-word;
    overflow-wrap: break-word;

    :deep(.n-tag) {
      white-space: normal;
      word-break: break-word;
      max-width: 100%;
      height: auto;
      line-height: 1.4;
    }
  }

  .stats-none {
    color: var(--n-text-color-3);
    font-weight: 400;
  }
}

/* ==================== MOBILE (max-width: 768px) ==================== */
@media (max-width: 768px) {
  :deep(.n-grid) {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .stats-info-table {
    tr {
      display: flex;
      flex-wrap: wrap;
    }

    td {
      width: 50% !important;
      box-sizing: border-box;
    }

    .stats-label {
      min-width: unset;
    }
  }
}
</style>
