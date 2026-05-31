<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAppStore, useLLMStore } from "@/store";
import { useLLMContext } from '@/composables/useLLMContext';
import SideNav from './SideNav.vue';
import TopBar from './TopBar.vue';
import { ChatBox } from '@/components/llm';

const appStore = useAppStore();
const llmStore = useLLMStore();

// Auto-detect context from route
useLLMContext();

// Initialize LLM store on mount
onMounted(() => {
  llmStore.initialize();
});

const sidebarWidth = computed(() => appStore.sidebarCollapsed ? 64 : 240);

const mainStyle = computed(() => ({
  marginLeft: `${sidebarWidth.value}px`,
  transition: 'margin-left 0.3s ease',
}));
</script>

<template>
  <n-layout has-sider class="min-h-screen">
    <!-- Sidebar -->
    <n-layout-sider
      bordered :collapsed="appStore.sidebarCollapsed" :collapsed-width="64" :width="240"
      :native-scrollbar="false" collapse-mode="width" class="sidebar"
    >
      <SideNav />
    </n-layout-sider>

    <!-- Main Content -->
    <n-layout :style="mainStyle" class="main-layout">
      <!-- Top Bar -->
      <n-layout-header bordered class="topbar">
        <TopBar />
      </n-layout-header>

      <!-- Page Content -->
      <n-layout-content class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>

    <!-- AI Assistant ChatBox (Global) -->
    <ChatBox />
  </n-layout>
</template>

<style scoped lang="scss">
// Dark mode colors - softer zinc palette
$dark-bg-base: #1a1a1e;
$dark-bg-elevated: #242428;
$dark-border: #3f3f46;

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  background-color: white;

  .dark & {
    background-color: $dark-bg-elevated;
    border-color: $dark-border;
  }
}

.main-layout {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 99;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background-color: white;

  .dark & {
    background-color: $dark-bg-elevated;
    border-color: $dark-border;
  }
}

.content {
  padding: 24px;
  min-height: calc(100vh - 56px);
  background-color: #f9fafb;

  .dark & {
    background-color: $dark-bg-base;
  }
}
</style>