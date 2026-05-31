<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useAppStore } from "@/store";

const appStore = useAppStore();
</script>

<template>
  <n-card title="Appearance" size="small">
    <div class="appearance-grid">
      <div class="appearance-item">
        <span class="appearance-label">Theme</span>
        <n-radio-group :value="appStore.theme" @update:value="appStore.setTheme">
          <n-radio-button value="light">
            <span class="theme-option">
              <Icon icon="carbon:sun" />
              <span>Light</span>
            </span>
          </n-radio-button>
          <n-radio-button value="dark">
            <span class="theme-option">
              <Icon icon="carbon:moon" />
              <span>Dark</span>
            </span>
          </n-radio-button>
        </n-radio-group>
      </div>

      <div class="appearance-item">
        <span class="appearance-label">Sidebar</span>
        <div class="sidebar-toggle">
          <n-switch
            :value="!appStore.sidebarCollapsed" @update:value="
              (expanded: boolean) => (appStore.sidebarCollapsed = !expanded)
            "
          />
          <span class="toggle-label">{{
            appStore.sidebarCollapsed ? "Collapsed" : "Expanded"
          }}</span>
        </div>
      </div>
    </div>
  </n-card>
</template>

<style scoped lang="scss">
.appearance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.appearance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;

  :deep(.n-radio-group) {
    min-width: 200px;
    display: flex;
  }

  :deep(.n-radio-button) {
    flex: 1;
    min-width: 90px;
    justify-content: center;
  }
}

.appearance-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  font-size: 0.875rem;
  color: var(--n-text-color-2);
}

.theme-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>