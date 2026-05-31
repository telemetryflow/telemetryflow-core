import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import SideNav from '../SideNav.vue';
import { useAppStore } from '@/store';

describe.skip('SideNav - Uptime Monitoring Integration', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    // Create a minimal router for testing
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
        { path: '/monitoring/uptime', name: 'UptimeMonitoring', component: { template: '<div>Uptime</div>' } },
      ],
    });
  });

  it('should include Uptime Monitoring menu item in monitoring section', async () => {
    const wrapper = mount(SideNav, {
      global: {
        plugins: [router],
        stubs: {
          'n-menu': {
            template: '<div><slot /></div>',
            props: ['options'],
          },
          'n-scrollbar': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    // Get the menu options from the component
    const menuOptions = wrapper.vm.menuOptions;
    
    // Find the monitoring group
    const monitoringGroup = menuOptions.find((item: any) => item.key === 'monitoring');
    expect(monitoringGroup).toBeDefined();
    expect(monitoringGroup.children).toBeDefined();

    // Find the uptime monitoring item
    const uptimeItem = monitoringGroup.children.find((item: any) => item.key === 'UptimeMonitoring');
    expect(uptimeItem).toBeDefined();
    expect(uptimeItem.label).toBe('Uptime');
    expect(uptimeItem.icon).toBeDefined();
  });

  it('should include Uptime Monitoring in collapsed menu', async () => {
    const appStore = useAppStore();
    appStore.sidebarCollapsed = true;

    const wrapper = mount(SideNav, {
      global: {
        plugins: [router],
        stubs: {
          'n-menu': {
            template: '<div><slot /></div>',
            props: ['options'],
          },
          'n-scrollbar': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    // Get the menu options from the component
    const menuOptions = wrapper.vm.menuOptions;
    
    // In collapsed mode, items are flat
    const uptimeItem = menuOptions.find((item: any) => item.key === 'UptimeMonitoring');
    expect(uptimeItem).toBeDefined();
    expect(uptimeItem.label).toBe('Uptime');
  });

  it('should navigate to uptime monitoring when menu item is clicked', async () => {
    const wrapper = mount(SideNav, {
      global: {
        plugins: [router],
        stubs: {
          'n-menu': {
            template: '<div><slot /></div>',
            props: ['options'],
          },
          'n-scrollbar': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    // Simulate menu item selection
    await wrapper.vm.handleSelect('UptimeMonitoring');
    
    // Wait for router navigation to complete
    await router.isReady();

    // Verify navigation occurred
    expect(router.currentRoute.value.name).toBe('UptimeMonitoring');
  });

  it('should have correct icon for uptime monitoring', async () => {
    const wrapper = mount(SideNav, {
      global: {
        plugins: [router],
        stubs: {
          'n-menu': {
            template: '<div><slot /></div>',
            props: ['options'],
          },
          'n-scrollbar': {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    const menuOptions = wrapper.vm.menuOptions;
    const monitoringGroup = menuOptions.find((item: any) => item.key === 'monitoring');
    const uptimeItem = monitoringGroup.children.find((item: any) => item.key === 'UptimeMonitoring');

    // Verify icon is defined (we can't easily test the actual icon component)
    expect(uptimeItem.icon).toBeDefined();
    expect(typeof uptimeItem.icon).toBe('function');
  });
});
