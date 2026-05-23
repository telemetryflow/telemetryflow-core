import { ref, computed, h } from 'vue';
import { NTag } from 'naive-ui';
import type { ReportTableData } from '@/types/report';

/**
 * Composable for managing report detail table state and operations
 */
export function useReportDetailTable() {
  const tableExpanded = ref<Record<number, boolean>>({});
  const tableSearch = ref<Record<number, string>>({});

  type TagType = 'success' | 'warning' | 'error' | 'info' | 'default';

  // Color resolvers per column key — only endpoint uses colored tags
  const TAG_RENDERERS: Record<string, (val: string) => TagType> = {
    // Endpoint — color by HTTP method (GET=blue, POST=green, PUT/PATCH=yellow, DELETE=red)
    endpoint: (v) => {
      const method = v.split(' ')[0]?.toUpperCase();
      return ({ GET: 'info', POST: 'success', PUT: 'warning', PATCH: 'warning', DELETE: 'error' } as Record<string, TagType>)[method] || 'default';
    },
  };

  function renderTag(val: string, resolver: (v: string) => TagType) {
    return h(NTag, { type: resolver(val), size: 'small', bordered: false },
      { default: () => h('strong', val) });
  }

  // Status badge config
  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    up:        { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    good:      { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    healthy:   { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    success:   { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    resolved:  { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    active:    { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    running:   { bg: 'rgba(6,182,212,0.15)',   color: '#06b6d4' },
    warning:   { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    degraded:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    pending:   { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    down:      { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    critical:  { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    error:     { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    failed:    { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    firing:    { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    inactive:  { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
    paused:    { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
  };

  function renderStatusBadge(val: string) {
    const s = val.toLowerCase();
    const cfg = STATUS_COLORS[s] ?? { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' };
    return h('span', {
      style: {
        display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
        borderRadius: '6px', fontSize: '11px', fontWeight: 600,
        letterSpacing: '0.5px', background: cfg.bg, color: cfg.color,
      },
    }, s.toUpperCase());
  }

  function parseNumeric(val: unknown, suffix: string): number | null {
    const str = String(val ?? '').replace(suffix, '').trim();
    const n = parseFloat(str);
    return isNaN(n) ? null : n;
  }

  /**
   * Build data table columns with sorter, status badges, uptime coloring, and title+subtitle support
   */
  function buildTableColumns(table: ReportTableData) {
    return table.columns.map((col) => ({
      title: col.title,
      key: col.key,
      minWidth: 120,
      sorter: (a: any, b: any) => {
        const aVal = a[col.key];
        const bVal = b[col.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return -1;
        if (bVal == null) return 1;
        if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
        return String(aVal).localeCompare(String(bVal));
      },
      render: (row: any) => {
        const value = row[col.key];

        // TAG_RENDERERS (e.g. endpoint)
        if (TAG_RENDERERS[col.key]) {
          return renderTag(String(value ?? ''), TAG_RENDERERS[col.key]);
        }

        // Status → colored badge
        if (col.key === 'status') {
          return renderStatusBadge(String(value ?? ''));
        }

        // Type → colored badge (VM=blue, K8s Node=teal)
        if (col.key === 'type') {
          const t = String(value ?? '');
          const isK8s = t.toLowerCase().includes('k8s') || t.toLowerCase().includes('kubernetes');
          const cfg = isK8s
            ? { bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' }
            : { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' };
          return h('span', {
            style: {
              display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
              borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.5px', background: cfg.bg, color: cfg.color,
            },
          }, t);
        }

        // Uptime % → color-coded
        if (col.key === 'uptime' || col.key === 'uptimePercent' || col.key === 'uptime24h') {
          const pct = parseNumeric(value, '%');
          if (pct !== null) {
            const color = pct >= 99.9 ? '#22c55e' : pct >= 95 ? '#f59e0b' : '#ef4444';
            return h('span', { style: { fontWeight: 600, color, fontFamily: "'SF Mono', Monaco, monospace" } }, String(value));
          }
        }

        // Response time → color-coded
        if (['avgResponse', 'responseTime', 'avgResponseTime', 'avgLatency'].includes(col.key)) {
          const ms = parseNumeric(value, 'ms');
          if (ms !== null) {
            const color = ms < 200 ? '#22c55e' : ms < 500 ? '#f59e0b' : '#ef4444';
            return h('span', { style: { fontWeight: 600, color, fontFamily: "'SF Mono', Monaco, monospace" } }, String(value));
          }
        }

        // Title + subtitle via _sub convention (e.g. monitor + monitor_sub URL)
        const subtitle = row[`${col.key}_sub`] as string | undefined;
        if (subtitle) {
          return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } }, [
            h('div', { style: { fontWeight: 600, fontSize: '14px', lineHeight: '1.3' } }, String(value ?? '-')),
            h('div', {
              style: {
                fontSize: '11px', opacity: 0.55, fontWeight: 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '280px', fontFamily: "'SF Mono', Monaco, monospace",
              },
            }, subtitle),
          ]);
        }

        return h('span', {}, String(value ?? '-'));
      },
    }));
  }

  /**
   * Filter table data based on search query
   */
  function getFilteredTableData(table: ReportTableData, tIndex: number) {
    const searchQuery = tableSearch.value[tIndex];
    if (!searchQuery || !searchQuery.trim()) {
      return table.rows;
    }
    
    const query = searchQuery.toLowerCase();
    return table.rows.filter((row: any) => {
      return table.columns.some((col) => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }

  /**
   * Export table data to CSV format
   */
  function exportTableToCSV(table: ReportTableData, tIndex: number, filename?: string) {
    const data = getFilteredTableData(table, tIndex);
    const headers = table.columns.map(col => col.title);
    const rows = data.map((row: any) => 
      table.columns.map(col => {
        const value = row[col.key];
        return value != null ? `"${String(value).replace(/"/g, '""')}"` : '""';
      })
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    downloadFile(
      csvContent, 
      filename || `${table.title.replace(/\s+/g, '-').toLowerCase()}.csv`,
      'text/csv'
    );
  }

  /**
   * Export table data to JSON format
   */
  function exportTableToJSON(table: ReportTableData, tIndex: number, filename?: string) {
    const data = getFilteredTableData(table, tIndex);
    const jsonContent = JSON.stringify(data, null, 2);
    
    downloadFile(
      jsonContent,
      filename || `${table.title.replace(/\s+/g, '-').toLowerCase()}.json`,
      'application/json'
    );
  }

  /**
   * Helper function to download file
   */
  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Toggle table expanded state
   */
  function toggleTableExpanded(tIndex: number) {
    tableExpanded.value[tIndex] = !tableExpanded.value[tIndex];
  }

  /**
   * Initialize table state (expanded by default)
   */
  function initializeTable(tIndex: number) {
    if (tableExpanded.value[tIndex] === undefined) {
      tableExpanded.value[tIndex] = true;
    }
    if (tableSearch.value[tIndex] === undefined) {
      tableSearch.value[tIndex] = '';
    }
  }

  return {
    tableExpanded,
    tableSearch,
    buildTableColumns,
    getFilteredTableData,
    exportTableToCSV,
    exportTableToJSON,
    toggleTableExpanded,
    initializeTable,
  };
}

/**
 * Composable for managing report detail chart state
 */
export function useReportDetailChart() {
  const chartViewMode = ref<Record<number, 'line' | 'area' | 'bar' | 'table'>>({});

  /**
   * Set chart view mode
   */
  function setChartViewMode(cIndex: number, mode: 'line' | 'area' | 'bar' | 'table') {
    chartViewMode.value[cIndex] = mode;
  }

  /**
   * Get chart view mode (default: line)
   */
  function getChartViewMode(cIndex: number): 'line' | 'area' | 'bar' | 'table' {
    return chartViewMode.value[cIndex] || 'line';
  }

  return {
    chartViewMode,
    setChartViewMode,
    getChartViewMode,
  };
}

/**
 * Utility functions for report detail formatting
 */
export const reportDetailUtils = {
  /**
   * Format execution time in milliseconds
   */
  formatExecutionTime(ms: number | null): string {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  },

  /**
   * Get trend icon based on trend value
   */
  getTrendIcon(trend?: number): string {
    if (!trend) return 'carbon:subtract';
    return trend > 0 ? 'carbon:arrow-up' : 'carbon:arrow-down';
  },

  /**
   * Get trend color based on trend value
   */
  getTrendColor(trend?: number): string {
    if (!trend) return '#6b7280';
    return trend > 0 ? '#22c55e' : '#ef4444';
  },

  /**
   * Format datetime string to YYYY-MM-DD HH:mm:ss
   */
  formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  /**
   * Transform chart data to proper format [number, number][]
   */
  transformChartData(data: any[]): [number, number][] {
    return data.map((d: any) => 
      Array.isArray(d) ? [Number(d[0]), Number(d[1])] : [0, 0]
    );
  },

  /**
   * Get last value from chart series
   */
  getLastChartValue(series: any[]): string {
    if (series.length === 0 || series[0].data.length === 0) {
      return '0';
    }
    const lastPoint = series[0].data[series[0].data.length - 1];
    return String(lastPoint[1] || '0');
  },
};
