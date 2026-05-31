<script setup lang="ts">
import { ref, h, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import type { DataTableColumn, SelectOption } from 'naive-ui';
import { NTag, NButton, NSwitch, NDropdown, NInput, NButtonGroup, NTabs, NTabPane, NSpin, NCard, NDrawer, NDrawerContent, NTooltip, useMessage } from 'naive-ui';
import DataTable from '@/components/common/DataTable.vue';
import { useAlertsStore } from '@/store';
import { config } from '@/config';
import alertingApi from '@/api/alerting';
import { formatTimestamp } from '@/utils/format';
import { getChannelIcon } from '@/utils';
import type { AlertRule, AlertSeverity, AlertCondition } from '@/types';
import { usePagination, useLineNumberedEditor } from '@/composables';
import AlertRuleFormModal from './components/AlertRuleFormModal.vue';
import { exportToCSV, exportToJSON, getExportFilename } from '@/utils/export';
import {
  getAllRules,
  getRulesByCategory,
  getCategoriesGrouped,
  searchRules as searchTemplateRules,
  type AlertRuleTemplate,
  type RuleCategory
} from '@/utils/telemetry/alerts/rules-library';

// Search
const searchQuery = ref('');
const activeTab = ref('my-rules');
const templateSearchQuery = ref('');
const selectedCategory = ref<string>('all');
const templatesLoaded = ref(false);

// Template filters
const selectedSeverity = ref<string>('all');
const selectedSource = ref<string>('all');

const router = useRouter();
const alertsStore = useAlertsStore();
const message = useMessage();

// Pagination for templates
const templatePagination = usePagination(10);
const { paginationConfig } = usePagination(10);

// Filtered rules based on search
const filteredRules = computed(() => {
  if (!searchQuery.value) return alertsStore.rules;
  const query = searchQuery.value.toLowerCase();
  return alertsStore.rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(query) ||
      rule.severity.toLowerCase().includes(query) ||
      rule.query.toLowerCase().includes(query),
  );
});

// Template library - lazy load only when tab is active
const allTemplates = computed(() => {
  if (!templatesLoaded.value) return [];
  return getAllRules();
});

const categoriesGrouped = computed(() => {
  if (!templatesLoaded.value) return {};
  return getCategoriesGrouped();
});

// Watch tab change to load templates
watch(activeTab, (newTab) => {
  if (newTab === 'templates' && !templatesLoaded.value) {
    // Delay loading to prevent blocking UI
    setTimeout(() => {
      templatesLoaded.value = true;
    }, 100);
  }
});

// Filtered templates
const filteredTemplates = computed(() => {
  if (!templatesLoaded.value) return [];

  let templates = allTemplates.value;

  // Filter by category
  if (selectedCategory.value !== 'all') {
    templates = getRulesByCategory(selectedCategory.value as RuleCategory);
  }

  // Filter by severity
  if (selectedSeverity.value !== 'all') {
    templates = templates.filter(t => t.severity === selectedSeverity.value);
  }

  // Filter by source
  if (selectedSource.value !== 'all') {
    templates = templates.filter(t => t.source?.name === selectedSource.value);
  }

  // Filter by search
  if (templateSearchQuery.value) {
    templates = searchTemplateRules(templateSearchQuery.value);
    // Re-apply other filters after search
    if (selectedCategory.value !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory.value);
    }
    if (selectedSeverity.value !== 'all') {
      templates = templates.filter(t => t.severity === selectedSeverity.value);
    }
    if (selectedSource.value !== 'all') {
      templates = templates.filter(t => t.source?.name === selectedSource.value);
    }
  }

  return templates;
});

// Category options for filter with proper icon rendering
const categoryOptions = computed(() => {
  const options: any[] = [
    { label: 'All Categories', value: 'all' }
  ];

  if (!templatesLoaded.value) {
    return options;
  }

  const grouped = categoriesGrouped.value;

  if (!grouped || Object.keys(grouped).length === 0) {
    return options;
  }

  Object.entries(grouped).forEach(([groupName, categories]) => {
    if (categories.length > 0) {
      options.push({
        type: 'group',
        label: groupName,
        key: `group-${groupName}`,
        children: categories.map(cat => ({
          label: cat.name,
          value: cat.id,
        }))
      });
    }
  });

  return options;
});

// Severity filter options
const severityFilterOptions = computed(() => [
  { label: 'All Severities', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
]);

// Source filter options
const sourceFilterOptions = computed(() => {
  if (!templatesLoaded.value) return [{ label: 'All Sources', value: 'all' }];

  const sources = new Set<string>();
  allTemplates.value.forEach(t => {
    if (t.source?.name) sources.add(t.source.name);
  });

  return [
    { label: 'All Sources', value: 'all' },
    ...Array.from(sources).map(s => ({ label: s, value: s }))
  ];
});

// Refresh templates by toggling the loaded state
function refreshTemplates() {
  templatesLoaded.value = false;
  window.setTimeout(() => {
    templatesLoaded.value = true;
  }, 100);
}

// Reset filters
function resetFilters() {
  selectedCategory.value = 'all';
  selectedSeverity.value = 'all';
  selectedSource.value = 'all';
  templateSearchQuery.value = '';
}

// Export functionality for templates
function handleExportTemplatesCSV() {
  const filename = getExportFilename('alert-rule-templates');
  exportToCSV(filteredTemplates.value as unknown as Record<string, unknown>[], filename);
}

function handleExportTemplatesJSON() {
  const filename = getExportFilename('alert-rule-templates');
  exportToJSON(filteredTemplates.value as unknown as Record<string, unknown>[], filename);
}

// Export functionality
function handleExportCSV() {
  const filename = getExportFilename('alert-rules');
  exportToCSV(filteredRules.value, filename);
}

function handleExportJSON() {
  const filename = getExportFilename('alert-rules');
  exportToJSON(filteredRules.value, filename);
}

// Detail panel
const showDetailPanel = ref(false);
const selectedRule = ref<AlertRule | null>(null);

function openDetailPanel(rule: AlertRule) {
  selectedRule.value = rule;
  showDetailPanel.value = true;
}

const showModal = ref(false);
const editingRule = ref<AlertRule | null>(null);
const useTemplate = ref(false);
const selectedTemplate = ref<AlertRuleTemplate | null>(null);
const activeRuleTab = ref<'basic' | 'query' | 'condition' | 'settings'>('basic');

const ruleForm = ref({
  name: '',
  query: '',
  operator: 'gt' as AlertCondition['operator'],
  threshold: 0,
  duration: '5m',
  severity: 'warning' as AlertSeverity,
  description: '',
  useDefaultChannels: true,
  channelIds: [] as string[],
});

// Use line-numbered editor composable for query
const queryContent = computed(() => ruleForm.value.query);
const { lineCount: queryLineCount } = useLineNumberedEditor(queryContent);

const channelOptions = computed(() =>
  alertsStore.notificationChannels
    .filter((c) => c.enabled)
    .map((c) => ({
      label: `${c.name} (${c.type.toUpperCase()})`,
      value: c.id,
      icon: getChannelIcon(c.type),
    }))
);

function renderChannelLabel(option: SelectOption & { icon?: string }) {
  return h('div', { style: 'display: flex; align-items: center; gap: 8px' }, [
    option.icon ? h(Icon, { icon: option.icon, width: 16, height: 16 }) : null,
    h('span', null, option.label as string),
  ]);
}


const operatorOptions = [
  { label: '> (greater than)', value: 'gt' },
  { label: '>= (greater than or equal)', value: 'gte' },
  { label: '< (less than)', value: 'lt' },
  { label: '<= (less than or equal)', value: 'lte' },
  { label: '== (equal)', value: 'eq' },
  { label: '!= (not equal)', value: 'neq' },
];

const severityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
];

const durationOptions = [
  { label: '1 minute', value: '1m' },
  { label: '5 minutes', value: '5m' },
  { label: '10 minutes', value: '10m' },
  { label: '15 minutes', value: '15m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
];

// Helper to format duration for preview
function formatDurationLabel(duration: string): string {
  const labels: Record<string, string> = {
    '1m': '1 minute',
    '5m': '5 minutes',
    '10m': '10 minutes',
    '15m': '15 minutes',
    '30m': '30 minutes',
    '1h': '1 hour',
  };
  return labels[duration] || duration;
}

// Helper to get operator symbol for preview
function getOperatorSymbol(op: string): string {
  const symbols: Record<string, string> = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '==',
    neq: '!=',
  };
  return symbols[op] || op;
}

const severityOrder: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// Status colors for badges
const statusBadgeColors: Record<string, { bg: string; color: string }> = {
  enabled: { bg: '#22c55e', color: '#ffffff' },
  disabled: { bg: '#6b7280', color: '#ffffff' },
};

// Severity colors for badges
const severityBadgeColors: Record<AlertSeverity, { bg: string; color: string }> = {
  critical: { bg: '#ef4444', color: '#ffffff' },
  warning: { bg: '#f59e0b', color: '#ffffff' },
  info: { bg: '#3b82f6', color: '#ffffff' },
};

// Template columns
const templateColumns: DataTableColumn<AlertRuleTemplate>[] = [
  {
    title: 'NAME',
    key: 'name',
    minWidth: 300,
    sorter: (a, b) => a.name.localeCompare(b.name),
    defaultSortOrder: 'ascend',
    filter: true,
    render: (row) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
        h('div', { style: { fontWeight: 600, fontSize: '15px', whiteSpace: 'normal', wordBreak: 'break-word' } }, row.name),
        h('div', { style: { fontSize: '12px', opacity: 0.6, fontWeight: 400, whiteSpace: 'normal', wordBreak: 'break-word' } }, row.description),
      ]),
  },
  {
    title: 'CATEGORY',
    key: 'category',
    width: 140,
    sorter: (a, b) => a.category.localeCompare(b.category),
    filter: true,
    render: (row) => {
      return h('span', {
        style: {
          fontSize: '13px',
          textTransform: 'capitalize',
        }
      }, row.category.replace(/-/g, ' '));
    },
  },
  {
    title: 'SEVERITY',
    key: 'severity',
    width: 120,
    sorter: (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    filter: true,
    render: (row) => {
      const config = severityBadgeColors[row.severity];
      return h('span', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: config.bg,
          color: config.color,
          textTransform: 'uppercase',
        },
      }, row.severity);
    },
  },
  {
    title: 'QUERY',
    key: 'query',
    minWidth: 300,
    ellipsis: {
      tooltip: true
    },
    filter: true,
    render: (row) => {
      const query = row.promql || row.tfqlQuery || 'No query';
      return h('code', {
        style: {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: 'var(--n-text-color-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
        }
      }, query);
    },
  },
  {
    title: 'SOURCE',
    key: 'source',
    width: 180,
    filter: true,
    render: (row) => {
      return h('span', {
        style: { fontSize: '13px' }
      }, row.source?.name || 'Custom');
    },
  },
  {
    title: 'ACTION',
    key: 'actions',
    width: 100,
    fixed: 'right' as const,
    align: 'center',
    render: (row) => {
      const options = [
        {
          label: 'Use Template',
          key: 'use',
          icon: () => h(Icon, { icon: 'carbon:edit', width: 16, height: 16 }),
        },
        {
          label: 'Import',
          key: 'import',
          icon: () => h(Icon, { icon: 'carbon:add', width: 16, height: 16 }),
        },
      ];

      return h(NDropdown, {
        trigger: 'click',
        options,
        onSelect: (key: string) => {
          if (key === 'use') openCreateFromTemplate(row);
          if (key === 'import') importTemplate(row);
        },
      }, {
        default: () => h(NButton, {
          size: 'small',
          quaternary: true,
          circle: true,
        }, () => h(Icon, { icon: 'carbon:overflow-menu-vertical', width: 18, height: 18 })),
      });
    },
  },
];

const columns: DataTableColumn<AlertRule>[] = [
  {
    title: 'NAME',
    key: 'name',
    minWidth: 300,
    sorter: (a, b) => a.name.localeCompare(b.name),
    defaultSortOrder: 'ascend',
    render: (row) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
        h('div', { style: { fontWeight: 600, fontSize: '15px', whiteSpace: 'normal', wordBreak: 'break-word' } }, row.name),
        h('div', { style: { fontSize: '12px', opacity: 0.6, fontWeight: 400, whiteSpace: 'normal', wordBreak: 'break-word' } },
          row.description || row.query
        ),
      ]),
  },
  {
    title: 'STATUS',
    key: 'enabled',
    width: 160,
    sorter: (a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1),
    render: (row) => {
      const status = row.enabled ? 'enabled' : 'disabled';
      const config = statusBadgeColors[status];
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' } }, [
        h(NSwitch, {
          value: row.enabled,
          size: 'small',
          onUpdateValue: () => alertsStore.toggleRule(row.id),
        }),
        h('span', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: config.bg,
            color: config.color,
            textTransform: 'uppercase',
          },
        }, status),
      ]);
    },
  },
  {
    title: 'SEVERITY',
    key: 'severity',
    width: 120,
    sorter: (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    render: (row) => {
      const config = severityBadgeColors[row.severity];
      return h('span', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: config.bg,
          color: config.color,
          textTransform: 'uppercase',
        },
      }, row.severity);
    },
  },
  {
    title: 'CONDITION',
    key: 'condition',
    width: 120,
    sorter: (a, b) => a.condition.threshold - b.condition.threshold,
    render: (row) => {
      const ops: Record<string, string> = { gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '==', neq: '!=' };
      return h('span', {
        style: { fontFamily: 'monospace', fontSize: '13px' }
      }, `${ops[row.condition.operator]} ${row.condition.threshold}`);
    },
  },
  {
    title: 'DURATION',
    key: 'duration',
    width: 100,
    sorter: (a, b) => a.duration.localeCompare(b.duration),
    render: (row) => h('span', { style: { fontSize: '13px' } }, row.duration),
  },
  {
    title: 'TAGS',
    key: 'tags',
    minWidth: 260,
    render: (row) => {
      const status = row.enabled ? 'enabled' : 'disabled';
      const statusConfig = statusBadgeColors[status];
      const severityConfig = severityBadgeColors[row.severity];
      const ops: Record<string, string> = { gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '==', neq: '!=' };

      const badgeStyle = (bg: string, color: string, extra?: Record<string, string>) => ({
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: '600',
        backgroundColor: bg,
        color: color,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: '0',
        ...extra,
      });

      // Fixed tags: status, severity, condition, duration
      const fixedTags = [
        h('span', { style: badgeStyle(statusConfig.bg, statusConfig.color) }, status),
        h('span', { style: badgeStyle(severityConfig.bg, severityConfig.color) }, row.severity),
        h('span', { style: badgeStyle('rgba(139, 92, 246, 0.9)', '#ffffff', { fontFamily: 'monospace', fontWeight: '500' }) }, `${ops[row.condition.operator]} ${row.condition.threshold}`),
        h('span', { style: badgeStyle('rgba(100, 116, 139, 0.7)', '#ffffff', { fontWeight: '500' }) }, row.duration),
      ];

      // Channel tags (limit to 1 visible, show +N for the rest)
      const channelTags: ReturnType<typeof h>[] = [];
      const channels = (row.channelIds && !row.useDefaultChannels)
        ? row.channelIds.map((id: string) => alertsStore.notificationChannels.find(c => c.id === id)).filter(Boolean)
        : [];

      if (channels.length > 0) {
        const first = channels[0]!;
        channelTags.push(
          h('span', {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: '500',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              whiteSpace: 'nowrap',
              flexShrink: '0',
            },
          }, [
            h(Icon, { icon: getChannelIcon(first.type), width: 14, height: 14 }),
            first.name,
          ])
        );
        if (channels.length > 1) {
          channelTags.push(
            h(NTooltip, { trigger: 'hover' }, {
              trigger: () => h('span', {
                style: badgeStyle('rgba(59, 130, 246, 0.15)', '#60a5fa', {
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer',
                  fontWeight: '500',
                }),
              }, `+${channels.length - 1}`),
              default: () => channels.slice(1).map(c => c!.name).join(', '),
            })
          );
        }
      }

      return h('div', {
        style: {
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          padding: '4px 0',
        },
      }, [...fixedTags, ...channelTags]);
    },
  },
  {
    title: 'ACTION',
    key: 'actions',
    width: 80,
    fixed: 'right' as const,
    align: 'center',
    render: (row) => {
      const options = [
        {
          label: 'Details',
          key: 'details',
          icon: () => h(Icon, { icon: 'carbon:magnify', width: 16, height: 16 }),
        },
        {
          label: 'Edit',
          key: 'edit',
          icon: () => h(Icon, { icon: 'carbon:edit', width: 16, height: 16 }),
        },
        {
          label: 'Duplicate',
          key: 'duplicate',
          icon: () => h(Icon, { icon: 'carbon:copy', width: 16, height: 16 }),
        },
        { type: "divider", key: "d1" },
        {
          label: 'Delete',
          key: 'delete',
          icon: () => h(Icon, { icon: 'carbon:trash-can', width: 16, height: 16 }),
        },
      ];

      return h(NDropdown, {
        trigger: 'click',
        options,
        onSelect: (key: string) => {
          if (key === 'details') openDetailPanel(row);
          if (key === 'edit') openEditModal(row);
          if (key === 'duplicate') alertsStore.duplicateRule(row.id);
          if (key === 'delete') alertsStore.deleteRule(row.id);
        },
      }, {
        default: () => h(NButton, {
          size: 'small',
          quaternary: true,
          circle: true,
        }, () => h(Icon, { icon: 'carbon:overflow-menu-vertical', width: 18, height: 18 })),
      });
    },
  },
];

function goBack() {
  router.push('/alerts');
}

function openCreateModal() {
  editingRule.value = null;
  useTemplate.value = false;
  selectedTemplate.value = null;
  activeRuleTab.value = 'basic';
  ruleForm.value = {
    name: '',
    query: '',
    operator: 'gt',
    threshold: 0,
    duration: '5m',
    severity: 'warning',
    description: '',
    useDefaultChannels: true,
    channelIds: [],
  };
  showModal.value = true;
}

function openCreateFromTemplate(template: AlertRuleTemplate) {
  editingRule.value = null;
  useTemplate.value = true;
  selectedTemplate.value = template;
  activeRuleTab.value = 'basic';

  // Pre-fill form with template data
  // Use promql if available, otherwise use tfqlQuery
  const query = template.promql || template.tfqlQuery || '';

  // Debug log to check template data
  console.log('Template data:', template);
  console.log('Query:', query);

  ruleForm.value = {
    name: template.name,
    query: query,
    operator: 'gt', // Default, user can change
    threshold: 0, // User needs to set
    duration: template.forDuration || '5m',
    severity: template.severity,
    description: template.description,
    useDefaultChannels: true,
    channelIds: [],
  };
  showModal.value = true;
}

function importTemplate(template: AlertRuleTemplate) {
  // Directly import template as a rule
  const condition: AlertCondition = {
    operator: 'gt',
    threshold: 0, // Default threshold
  };

  // Use promql if available, otherwise use tfqlQuery
  const query = template.promql || template.tfqlQuery || '';

  alertsStore.createRule(
    template.name,
    query,
    condition,
    template.severity,
    {
      duration: template.forDuration || '5m',
      description: template.description,
    }
  );

  message.success(`Rule "${template.name}" imported successfully`);
  activeTab.value = 'my-rules';
}

function openEditModal(rule: AlertRule) {
  editingRule.value = rule;
  ruleForm.value = {
    name: rule.name || '',
    query: rule.query || '',
    operator: rule.condition?.operator || 'gt',
    threshold: rule.condition?.threshold || 0,
    duration: rule.duration || '5m',
    severity: rule.severity || 'warning',
    description: rule.description || '',
    useDefaultChannels: rule.useDefaultChannels !== false,
    channelIds: rule.channelIds || [],
  };
  showModal.value = true;
}

async function handleModalSave(payload: {
  name: string; query: string; condition: AlertCondition; severity: AlertSeverity;
  duration: string; description?: string; useDefaultChannels: boolean; channelIds?: string[];
}) {
  const notifChannels = (!payload.useDefaultChannels && payload.channelIds?.length)
    ? payload.channelIds.map((id) => ({ channelId: id, sendOnResolve: true }))
    : undefined;

  if (!config.useMock) {
    // When creating from a template, use the template's query config.
    // Otherwise fall back to generic tfql/condition rule.
    const tmpl = useTemplate.value ? selectedTemplate.value : null;
    const queryLanguage = tmpl?.queryLanguage ?? 'tfql';
    const queryTarget = tmpl?.queryTarget;
    const queryString = tmpl?.promql || tmpl?.tfqlQuery || payload.query;

    // Build conditions: prefer template conditions (with proper metric names)
    const conditions = tmpl?.conditions?.length
      ? tmpl.conditions.map((c) => ({
          metric: c.metric,
          field: c.metric,
          aggregation: c.aggregation,
          operator: c.operator,
          threshold: c.threshold,
          value: c.threshold,
          timeWindow: 300,
          duration: c.duration,
          ...(c.labels ? { labels: c.labels } : {}),
        }))
      : [{ field: 'count', operator: payload.condition.operator, value: payload.condition.threshold, timeWindow: 300 }];

    if (editingRule.value) {
      await alertingApi.updateRule(editingRule.value.id, {
        name: payload.name,
        description: payload.description,
        severity: payload.severity,
        conditions,
        queryString,
        queryLanguage,
        ...(queryTarget ? { queryTarget } : {}),
        notificationChannels: notifChannels,
      });
    } else {
      await alertingApi.createRule({
        name: payload.name,
        description: payload.description,
        severity: payload.severity,
        conditions,
        queryString,
        queryLanguage,
        ...(queryTarget ? { queryTarget } : {}),
        evaluationInterval: tmpl?.evaluationInterval || '1m',
        forDuration: payload.duration || tmpl?.forDuration || '5m',
        notificationChannels: notifChannels,
      });
    }
    await alertsStore.fetchRules(); // refresh all from backend
  } else {
    // Mock mode — localStorage only
    if (editingRule.value) {
      alertsStore.updateRule(editingRule.value.id, {
        name: payload.name,
        query: payload.query,
        condition: payload.condition,
        duration: payload.duration,
        severity: payload.severity,
        description: payload.description,
        useDefaultChannels: payload.useDefaultChannels,
        channelIds: payload.channelIds,
      });
    } else {
      alertsStore.createRule(payload.name, payload.query, payload.condition, payload.severity, {
        duration: payload.duration,
        description: payload.description,
        useDefaultChannels: payload.useDefaultChannels,
        channelIds: payload.channelIds,
      });
    }
  }
}

// Add some mock rules for demo
if (alertsStore.rules.length === 0) {
  alertsStore.createRule(
    'High Error Rate',
    'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05',
    { operator: 'gt', threshold: 5 },
    'critical',
    { description: 'Alert when error rate exceeds 5%' }
  );
  alertsStore.createRule(
    'High Latency P95',
    'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5',
    { operator: 'gt', threshold: 500 },
    'warning',
    { description: 'Alert when P95 latency exceeds 500ms' }
  );
}

// Fetch all rules from real backend on mount (centralized — all queryTargets)
onMounted(() => {
  alertsStore.fetchRules();
  alertsStore.fetchChannels(); // load real channels for TAGS column name lookup
});
</script>

<template>
  <div class="alert-rules-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <n-button quaternary @click="goBack">
          <template #icon>
            <Icon icon="carbon:arrow-left" />
          </template>
        </n-button>
        <div>
          <h2 class="page-title">Alert Rules</h2>
          <p class="page-subtitle">Configure alerting rules for your telemetry data</p>
        </div>
      </div>
      <n-button type="primary" @click="openCreateModal">
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        New Rule
      </n-button>
    </div>

    <!-- Tabs -->
    <n-tabs v-model:value="activeTab" type="segment" animated class="main-tabs">
      <!-- My Rules Tab -->
      <n-tab-pane name="my-rules">
        <template #tab>
          <div class="tab-label">
            <Icon icon="carbon:rule" class="tab-icon" />
            <span>My Rules</span>
          </div>
        </template>
        <div class="section">
          <div class="section-header">
            <div class="section-title">
              <Icon icon="carbon:rule" class="section-icon" />
              <span>Alert Rules</span>
              <n-tag :bordered="false" size="small" type="info">
                {{ filteredRules.length }} rules
              </n-tag>
            </div>
            <div class="table-actions">
              <n-input
                v-model:value="searchQuery" placeholder="Search rules..." size="small" clearable
                class="search-input"
              >
                <template #prefix>
                  <Icon icon="carbon:search" />
                </template>
              </n-input>
              <n-button-group size="small">
                <n-button @click="handleExportCSV">
                  <template #icon>
                    <Icon icon="carbon:download" />
                  </template>
                  CSV
                </n-button>
                <n-button @click="handleExportJSON">
                  <template #icon>
                    <Icon icon="carbon:json-reference" />
                  </template>
                  JSON
                </n-button>
              </n-button-group>
            </div>
          </div>
          <div class="section-content table-content">
            <DataTable
              :columns="columns"
              :data="filteredRules"
              :row-key="(row: AlertRule) => row.id"
              :bordered="false"
              :bottom-bordered="true"
              :striped="true"
              size="small"
              :scroll-x="1120"
              :pagination="{ ...paginationConfig, itemCount: filteredRules.length }"
            />
          </div>
        </div>
      </n-tab-pane>

      <!-- Templates Tab -->
      <n-tab-pane name="templates">
        <template #tab>
          <div class="tab-label">
            <Icon icon="carbon:template" class="tab-icon" />
            <span>Rule Templates</span>
          </div>
        </template>
        <div class="section">
          <div class="section-header">
            <div class="section-title">
              <Icon icon="carbon:template" class="section-icon" />
              <span>Rule Templates Library</span>
              <n-tag :bordered="false" size="small" type="success">
                {{ filteredTemplates.length }} templates
              </n-tag>
            </div>
            <div class="table-actions">
              <n-input
                v-model:value="templateSearchQuery" placeholder="Search templates..." size="small" clearable
                class="search-input" :disabled="!templatesLoaded"
              >
                <template #prefix>
                  <Icon icon="carbon:search" />
                </template>
              </n-input>
              <n-button-group size="small">
                <n-button :disabled="!templatesLoaded" @click="handleExportTemplatesCSV">
                  <template #icon>
                    <Icon icon="carbon:download" />
                  </template>
                  CSV
                </n-button>
                <n-button :disabled="!templatesLoaded" @click="handleExportTemplatesJSON">
                  <template #icon>
                    <Icon icon="carbon:json-reference" />
                  </template>
                  JSON
                </n-button>
              </n-button-group>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <n-select
              v-model:value="selectedCategory" :options="categoryOptions" size="small"
              style="width: 200px; min-width: 200px;" placeholder="All Categories" clearable class="category-select"
            />
            <n-select
              v-model:value="selectedSeverity" :options="severityFilterOptions" size="small"
              style="width: 150px" placeholder="All Severities"
            />
            <n-select
              v-model:value="selectedSource" :options="sourceFilterOptions" size="small" style="width: 180px"
              placeholder="All Sources"
            />
            <n-button size="small" :disabled="!templatesLoaded" @click="resetFilters">
              <template #icon>
                <Icon icon="carbon:reset" />
              </template>
              Reset
            </n-button>
            <n-button size="small" :disabled="!templatesLoaded" @click="refreshTemplates">
              <template #icon>
                <Icon icon="carbon:renew" />
              </template>
              Refresh
            </n-button>
          </div>
          <div class="section-content table-content">
            <!-- Loading State -->
            <div v-if="!templatesLoaded" class="loading-state">
              <n-spin size="large" />
              <p>Loading templates...</p>
            </div>

            <!-- DataTable -->
            <DataTable
              v-else
              :columns="templateColumns"
              :data="filteredTemplates"
              :row-key="(row: AlertRuleTemplate) => row.id"
              :bordered="false"
              :bottom-bordered="true"
              :striped="true"
              size="small"
              :scroll-x="1160"
              :pagination="{ ...templatePagination.paginationConfig.value, itemCount: filteredTemplates.length }"
            />
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- Create/Edit Modal -->
    <AlertRuleFormModal
      v-model:show="showModal"
      :rule="editingRule"
      @save="handleModalSave"
    />

    <!-- Rule Detail Panel (Drawer) -->
    <n-drawer :show="showDetailPanel" :width="520" placement="right" @update:show="(val) => (showDetailPanel = val)">
      <n-drawer-content v-if="selectedRule">
        <template #header>
          <div class="drawer-header">
            <Icon icon="carbon:rule" class="drawer-header-icon" />
            <span>Rule Details</span>
          </div>
        </template>
        <template #footer>
          <div class="drawer-footer">
            <n-button type="primary" ghost @click="showDetailPanel = false">
              <template #icon>
                <Icon icon="carbon:close" />
              </template>
              Close
            </n-button>
            <n-button type="primary" @click="showDetailPanel = false; openEditModal(selectedRule!)">
              <template #icon>
                <Icon icon="carbon:edit" />
              </template>
              Edit Rule
            </n-button>
          </div>
        </template>

        <!-- Status Banner -->
        <div class="status-banner" :class="selectedRule.enabled ? 'enabled' : 'disabled'">
          <Icon :icon="selectedRule.enabled ? 'carbon:checkmark-filled' : 'carbon:close-filled'" />
          <span>
            <strong>{{ selectedRule.enabled ? 'ENABLED' : 'DISABLED' }}</strong> — {{ selectedRule.name }}
          </span>
        </div>

        <div class="detail-content">
          <!-- Basic Information -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:information" />
              <span>Basic Information</span>
            </div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label">Name</td>
                  <td class="info-value"><code>{{ selectedRule.name }}</code></td>
                </tr>
                <tr v-if="selectedRule.description">
                  <td class="info-label">Description</td>
                  <td class="info-value">{{ selectedRule.description }}</td>
                </tr>
                <tr>
                  <td class="info-label">Status</td>
                  <td class="info-value">
                    <n-tag :bordered="false" size="small" :type="selectedRule.enabled ? 'success' : 'default'">
                      {{ selectedRule.enabled ? 'Enabled' : 'Disabled' }}
                    </n-tag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label">Severity</td>
                  <td class="info-value">
                    <span
                      class="severity-badge" :style="{
                        backgroundColor: severityBadgeColors[selectedRule.severity].bg,
                        color: severityBadgeColors[selectedRule.severity].color,
                      }"
                    >
                      {{ selectedRule.severity.toUpperCase() }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Condition -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:warning-alt" />
              <span>Condition</span>
            </div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label">Operator</td>
                  <td class="info-value"><code>{{ getOperatorSymbol(selectedRule.condition.operator) }}</code></td>
                </tr>
                <tr>
                  <td class="info-label">Threshold</td>
                  <td class="info-value"><code>{{ selectedRule.condition.threshold }}</code></td>
                </tr>
                <tr>
                  <td class="info-label">Duration</td>
                  <td class="info-value"><code>{{ selectedRule.duration }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Query -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:query" />
              <span>Query</span>
            </div>
            <div class="query-box">
              <code>{{ selectedRule.query }}</code>
            </div>
          </div>

          <!-- Notification Channels -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:notification" />
              <span>Notification</span>
            </div>
            <div class="channels-card">
              <div class="channels-card-header">
                <Icon icon="carbon:notification" />
                <span>Notification Channels</span>
                <n-tag :bordered="false" size="tiny" round type="info">
                  {{ (selectedRule.channelIds && !selectedRule.useDefaultChannels) ? selectedRule.channelIds.length : 0
                  }}
                </n-tag>
              </div>
              <div
                v-if="selectedRule.channelIds && selectedRule.channelIds.length > 0 && !selectedRule.useDefaultChannels"
                class="channels-card-body"
              >
                <template v-for="chId in selectedRule.channelIds" :key="chId">
                  <span v-if="alertsStore.notificationChannels.find(c => c.id === chId)" class="channel-badge">
                    <Icon
                      :icon="getChannelIcon(alertsStore.notificationChannels.find(c => c.id === chId)!.type)"
                      :width="14" :height="14"
                    />
                    {{ alertsStore.notificationChannels.find(c => c.id === chId)!.name }}
                  </span>
                </template>
              </div>
              <div v-else class="channels-card-body channels-card-empty">
                Using global default channels
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:time" />
              <span>Timestamps</span>
            </div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label">Created</td>
                  <td class="info-value"><code>{{ formatTimestamp(selectedRule.createdAt) }}</code></td>
                </tr>
                <tr>
                  <td class="info-label">Updated</td>
                  <td class="info-value"><code>{{ formatTimestamp(selectedRule.updatedAt) }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";
@import "@/styles/tfo-channels-card.scss";

.alert-rules-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--n-text-color);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
}

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
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  font-size: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 15px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 160px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

// Condition box styles
.condition-box {
  width: 100%;
  background: var(--n-color-popover);
  border: 1px solid var(--k8s-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.condition-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.08);
  border-bottom: 1px solid var(--k8s-border-color);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--n-text-color);

  :root.dark & {
    background: rgba(59, 130, 246, 0.12);
  }
}

.condition-icon {
  color: #3b82f6;
  font-size: 18px;
  flex-shrink: 0;
}

.condition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.condition-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.condition-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--n-text-color-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.condition-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(34, 197, 94, 0.08);
  border-top: 1px solid var(--k8s-border-color);
  font-size: 0.8125rem;
  color: var(--n-text-color-2);

  :root.dark & {
    background: rgba(34, 197, 94, 0.12);
  }

  :deep(svg) {
    color: #22c55e;
    font-size: 16px;
    flex-shrink: 0;
  }

  strong {
    color: var(--n-text-color);
    font-weight: 600;
  }
}

// Section styles (matching agent monitoring)
.section {
  border-radius: 8px;
  overflow: hidden;
  background: var(--n-card-color);
  border: 1px solid var(--k8s-border-color);
}

:global(html.dark) .section {
  background: rgba(30, 41, 59, 0.3);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 0.875rem;
  background: var(--n-card-color);
  border-bottom: 1px solid var(--k8s-border-color);
  flex-wrap: wrap;
  gap: 12px;
}

:global(html.dark) .section-header {
  background: rgba(30, 41, 59, 0.4);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-icon {
  font-size: 18px;
  color: var(--n-text-color-3);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 220px;
}

.section-content {
  padding: 16px;
  border-top: 1px solid var(--k8s-border-color);
}

// Table content (pagination styling)
.table-content :deep(.n-pagination) {
  margin-top: 1px;
  padding: 0 10px 12px;
  justify-content: flex-end;
}

.table-content :deep(.n-data-table-base-table-body) {
  border-bottom: 1px solid var(--k8s-border-color);
  padding-bottom: 0 !important;
}

.table-content :deep(.n-data-table-tbody) {
  padding-bottom: 0 !important;
}

// Loading state
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;

  p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--n-text-color-3);
  }
}

// Filter bar (like Uptime Monitoring)
.filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--n-card-color);
  border-top: 1px solid var(--k8s-border-color);

  :global(html.dark) & {
    background: rgba(30, 41, 59, 0.25);
  }
}

// Rule modal with vertical tabs
.rule-modal-content {
  display: flex;
  gap: 0;
  min-height: 320px;
  max-height: 500px;
  max-height: 450px;
  background: var(--n-color-modal);
}

.rule-tabs {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--n-border-color);
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rule-tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--n-text-color-3);
  background: transparent;
  border: none;
  margin: 0 8px;
  border-radius: 8px;

  .tab-icon {
    font-size: 18px;
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  .tab-label {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--n-text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--n-primary-color);

    .tab-icon {
      color: var(--n-primary-color);
    }

    .tab-label {
      font-weight: 600;
    }
  }
}

.template-info-box {
  margin-top: auto;
  padding: 12px;
  background: rgba(var(--info-color-rgb), 0.08);
  border: 1px solid rgba(var(--info-color-rgb), 0.2);
  border-radius: 8px;
  margin: 12px 8px 8px 8px;

  :global(html.dark) & {
    background: rgba(var(--info-color-rgb), 0.12);
  }
}

.template-info-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--n-color-target);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.6px;

  svg {
    font-size: 14px;
  }
}

.template-info-content {
  .template-info-name {
    margin: 0 0 6px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--n-text-color);
    line-height: 1.4;
  }

  .template-info-desc {
    margin: 0;
    font-size: 11px;
    color: var(--n-text-color-3);
    line-height: 1.5;
  }
}

.rule-form {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  max-height: 500px;
  background: var(--n-color-modal);

  :deep(.n-form-item) {
    margin-bottom: 16px;
  }

  :deep(.n-form-item-label) {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 8px;
    color: var(--n-text-color-1);
  }

  :deep(.n-input),
  :deep(.n-input-number),
  :deep(.n-select) {
    --n-border: 1px solid var(--n-border-color);
    --n-border-hover: 1px solid var(--n-primary-color);
    --n-border-focus: 1px solid var(--n-primary-color);
    --n-border-radius: 6px;
  }

  :deep(.n-input__input),
  :deep(.n-input__textarea) {
    font-size: 14px;
  }

  :deep(.n-input--textarea) {
    .n-input__textarea {
      padding: 10px 12px;
    }
  }

  :deep(.n-form-item-feedback-wrapper) {
    margin-top: 6px;
  }

  // Custom width for query editor
  .line-numbered-editor-wrapper {
    width: 100%;
    max-width: 100%;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 15px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 160px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

.channels-assignment {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  :deep(.n-checkbox) {
    font-size: 14px;
  }
}

.no-channels-hint {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(100, 116, 139, 0.05);
  border-radius: 6px;
  border: 1px solid var(--n-border-color);

  :root.dark & {
    background: rgba(51, 65, 85, 0.2);
  }

  :deep(svg) {
    flex-shrink: 0;
  }
}

// Query editor with line numbers (like raw JSON view)
.query-editor-wrapper {
  display: flex;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--n-color-modal);
  transition: border-color 0.3s ease;

  &:focus-within {
    border-color: var(--n-primary-color);
  }
}

.query-line-numbers {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  background: rgba(0, 0, 0, 0.1);
  border-right: 1px solid var(--n-border-color);
  user-select: none;
  flex-shrink: 0;

  :root.dark & {
    background: rgba(0, 0, 0, 0.2);
  }

  .query-line-number {
    padding: 0 12px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 13px;
    line-height: 20px;
    height: 20px;
    color: #64748b;
    text-align: right;
    min-width: 48px;
    white-space: nowrap;
    display: block;
  }
}

.query-textarea {
  flex: 1;
  padding: 10px 12px;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 20px;
  color: var(--n-text-color);
  resize: none;
  min-height: 160px;
  width: 100%;

  &::placeholder {
    color: var(--n-text-color-3);
    opacity: 0.6;
  }

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(100, 116, 139, 0.5);
    }
  }
}

// Detail Drawer Panel
.drawer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.drawer-header-icon {
  font-size: 20px;
  color: var(--n-primary-color);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 5px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 120px;
    min-width: 100px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 20px;
  border: 1px solid;

  &.enabled {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.2);
  }

  &.disabled {
    background-color: rgba(107, 114, 128, 0.1);
    color: #6b7280;
    border-color: rgba(107, 114, 128, 0.2);
  }

  :deep(svg) {
    font-size: 18px;
  }
}

.detail-content {
  margin-top: 4px;
}

.detail-section {
  margin-top: 24px;

  &:first-child {
    margin-top: 0;
  }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--n-text-color-3);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  :deep(svg) {
    font-size: 16px;
  }
}

.info-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  overflow: hidden;

  tr:not(:last-child) td {
    border-bottom: 1px solid var(--k8s-border-color);
  }

  td {
    padding: 10px 12px;
  }

  .info-label {
    font-weight: 500;
    color: var(--n-text-color-3);
    font-size: 0.8125rem;
    width: 160px;
    min-width: 140px;
    background: rgba(100, 116, 139, 0.1);

    :root.dark & {
      background: rgba(51, 65, 85, 0.4);
    }
  }

  .info-value {
    color: var(--n-text-color);
    font-size: 0.8125rem;

    code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 0.8125rem;
      background: transparent;
      padding: 0;
      border: none;
    }
  }
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.query-box {
  padding: 12px 16px;
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  overflow-x: auto;

  :root.dark & {
    background: rgba(51, 65, 85, 0.4);
  }

  code {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.8125rem;
    color: var(--n-text-color);
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>

<style lang="scss">
// Category select group header styling (non-scoped for teleported dropdown)
.n-base-select-menu .n-base-select-group-header {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 8px 14px 4px;
  color: var(--n-group-header-text-color);
  background: var(--n-action-color, rgba(255, 255, 255, 0.04));
  border-top: 1px solid var(--k8s-border-color, rgba(255, 255, 255, 0.09));
  border-bottom: 1px solid var(--k8s-border-color, rgba(255, 255, 255, 0.09));

  &:first-child {
    border-top: none;
  }
}
</style>