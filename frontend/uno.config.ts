import {
  defineConfig,
  presetUno,
  presetIcons,
  presetAttributify,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],

  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],

  shortcuts: {
    // Layout
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // Cards & Containers
    'card': 'bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600',
    'card-hover': 'card hover:shadow-md transition-shadow duration-200',

    // Text
    'text-title': 'text-lg font-semibold text-gray-900 dark:text-gray-100',
    'text-subtitle': 'text-sm text-gray-600 dark:text-gray-400',
    'text-muted': 'text-xs text-gray-500 dark:text-gray-500',

    // Status colors
    'status-success': 'text-green-600 dark:text-green-400',
    'status-warning': 'text-yellow-600 dark:text-yellow-400',
    'status-error': 'text-red-600 dark:text-red-400',
    'status-info': 'text-blue-600 dark:text-blue-400',

    // Log levels
    'log-trace': 'text-gray-500',
    'log-debug': 'text-blue-500',
    'log-info': 'text-green-500',
    'log-warn': 'text-yellow-500',
    'log-error': 'text-red-500',
    'log-fatal': 'text-purple-500',

    // Telemetry signal badges
    'badge-metric': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'badge-log': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'badge-trace': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'badge-exemplar': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },

  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      dark: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
    },
  },

  safelist: [
    // Log levels
    'log-trace', 'log-debug', 'log-info', 'log-warn', 'log-error', 'log-fatal',
    // Status
    'status-success', 'status-warning', 'status-error', 'status-info',
    // Badges
    'badge-metric', 'badge-log', 'badge-trace', 'badge-exemplar',
  ],
});
