<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { NButton } from "naive-ui";
import type { AuditLog } from "@/types/audit";
import { AuditTable, AuditDetail } from "./components";

const tableRef = ref<InstanceType<typeof AuditTable> | null>(null);

// ==================== DETAIL PANEL ====================

const showDetail = ref(false);
const selectedLog = ref<AuditLog | null>(null);

function handleShowDetail(log: AuditLog) {
  selectedLog.value = log;
  showDetail.value = true;
}

// ==================== REFRESH ====================

function handleRefresh() {
  tableRef.value?.refreshStats();
  tableRef.value?.refreshTable();
}
</script>

<template>
  <div class="audit-logs-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="carbon:document-tasks" class="title-icon" />
          Audit Logs
        </h1>
        <span class="page-subtitle">Track and monitor all system activities</span>
      </div>
      <div class="header-right">
        <NButton ghost @click="handleRefresh">
          <template #icon>
            <Icon icon="carbon:renew" />
          </template>
          Refresh
        </NButton>
      </div>
    </div>

    <!-- Stats + Charts + Data Table -->
    <AuditTable ref="tableRef" @show-detail="handleShowDetail" />

    <!-- Detail Drawer -->
    <AuditDetail v-model:show="showDetail" :log="selectedLog" />
  </div>
</template>

<style scoped lang="scss">
.audit-logs-view {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.header-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 1024px) {
  .audit-logs-view { padding: 20px 16px; }
  .page-title { font-size: 22px; }
  .title-icon { font-size: 24px; }
}

@media (max-width: 768px) {
  .audit-logs-view { padding: 16px 12px; }
  .page-header { flex-direction: column; gap: 12px; }
  .header-left, .header-right { width: 100%; }
  .header-right :deep(.n-button) { width: 100%; }
  .page-title { font-size: 20px; gap: 8px; }
  .title-icon { font-size: 22px; }
  .page-subtitle { font-size: 13px; }
}

@media (max-width: 480px) {
  .audit-logs-view { padding: 12px 8px; }
  .page-title { font-size: 18px; }
  .title-icon { font-size: 20px; }
}
</style>
