import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import UnoCSS from 'unocss/vite';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import { resolve } from 'path';
import mockServerPlugin from './vite-mock-server';

export default defineConfig(({ mode }) => {
  // Load env from both root and frontend directories (root first, local overrides)
  const env = {
    ...loadEnv(mode, resolve(__dirname, '..'), ''),
    ...loadEnv(mode, process.cwd(), ''),
  };

  const isDev = (env.NODE_ENV || mode) === 'development';
  const useMock = env.TELEMETRYFLOW_USE_MOCK === 'true';

  return {
    base: env.TELEMETRYFLOW_BASE_URL || '/',

    // Vitest configuration
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['src/test-setup.ts'],
      include: ['src/**/*.{test,spec}.{js,ts}'],
    },

    // Expose TELEMETRYFLOW_ prefixed env variables to client
    define: {
      'import.meta.env.TELEMETRYFLOW_APP_TITLE': JSON.stringify(env.TELEMETRYFLOW_APP_TITLE || 'TelemetryFlow-Viz'),
      'import.meta.env.TELEMETRYFLOW_APP_CODE': JSON.stringify(env.TELEMETRYFLOW_APP_CODE || 'TFO-Viz'),
      'import.meta.env.TELEMETRYFLOW_BASE_URL': JSON.stringify(env.TELEMETRYFLOW_BASE_URL || '/'),
      'import.meta.env.TELEMETRYFLOW_API_URL': JSON.stringify(isDev ? (env.TELEMETRYFLOW_API_URL || '') : (process.env.TELEMETRYFLOW_API_URL || '')),
      'import.meta.env.TELEMETRYFLOW_GRPC_URL': JSON.stringify(env.TELEMETRYFLOW_GRPC_URL || 'http://localhost:4317'),
      'import.meta.env.TELEMETRYFLOW_WS_URL': JSON.stringify(env.TELEMETRYFLOW_WS_URL || 'ws://localhost:4319'),
      // Always use explicit env value; default to 'false' (never auto-enable mock in dev)
      'import.meta.env.TELEMETRYFLOW_USE_MOCK': JSON.stringify(env.TELEMETRYFLOW_USE_MOCK ?? 'false'),
      'import.meta.env.TELEMETRYFLOW_REFRESH_INTERVAL': JSON.stringify(env.TELEMETRYFLOW_REFRESH_INTERVAL || '5000'),
      // SECURITY: VIZ credentials are NOT exposed to client bundle — auth config uses runtime injection only
      'import.meta.env.TELEMETRYFLOW_SSO_GOOGLE': JSON.stringify(env.TELEMETRYFLOW_SSO_GOOGLE || 'false'),
      'import.meta.env.TELEMETRYFLOW_SSO_MICROSOFT': JSON.stringify(env.TELEMETRYFLOW_SSO_MICROSOFT || 'false'),
      'import.meta.env.TELEMETRYFLOW_SSO_APPLE': JSON.stringify(env.TELEMETRYFLOW_SSO_APPLE || 'false'),
      'import.meta.env.TELEMETRYFLOW_SSO_SLACK': JSON.stringify(env.TELEMETRYFLOW_SSO_SLACK || 'false'),
      'import.meta.env.TELEMETRYFLOW_SSO_COGNITO': JSON.stringify(env.TELEMETRYFLOW_SSO_COGNITO || 'false'),
      // reCAPTCHA v3
      'import.meta.env.TELEMETRYFLOW_RECAPTCHA_SITE_KEY': JSON.stringify(env.TELEMETRYFLOW_RECAPTCHA_SITE_KEY || ''),
      // App config vars
      'import.meta.env.TELEMETRYFLOW_IAM_API_URL': JSON.stringify(isDev ? (env.TELEMETRYFLOW_IAM_API_URL || '') : (process.env.TELEMETRYFLOW_IAM_API_URL || '')),
      'import.meta.env.TELEMETRYFLOW_API_KEY': JSON.stringify(env.TELEMETRYFLOW_API_KEY || ''),
      'import.meta.env.TELEMETRYFLOW_API_KEY_HEADER': JSON.stringify(env.TELEMETRYFLOW_API_KEY_HEADER || 'x-api-key'),
      'import.meta.env.TELEMETRYFLOW_ENABLE_CACHE': JSON.stringify(env.TELEMETRYFLOW_ENABLE_CACHE || 'true'),
      'import.meta.env.TELEMETRYFLOW_CACHE_TTL': JSON.stringify(env.TELEMETRYFLOW_CACHE_TTL || '300000'),
      // Soft limit: default rows per fetch per organization
      'import.meta.env.TELEMETRYFLOW_LIMIT_DATA': JSON.stringify(env.TELEMETRYFLOW_LIMIT_DATA || '50000'),
      // Hard limit: absolute max rows per fetch
      'import.meta.env.TELEMETRYFLOW_LIMIT_DATA_MAX': JSON.stringify(env.TELEMETRYFLOW_LIMIT_DATA_MAX || '100000'),
      // White Label / Branding
      'import.meta.env.TELEMETRYFLOW_BRAND_NAME': JSON.stringify(env.TELEMETRYFLOW_BRAND_NAME || ''),
      'import.meta.env.TELEMETRYFLOW_BRAND_TAGLINE': JSON.stringify(env.TELEMETRYFLOW_BRAND_TAGLINE || ''),
      'import.meta.env.TELEMETRYFLOW_DOMAIN': JSON.stringify(env.TELEMETRYFLOW_DOMAIN || ''),
      'import.meta.env.TELEMETRYFLOW_GITHUB_URL': JSON.stringify(env.TELEMETRYFLOW_GITHUB_URL || ''),
      // Logo
      'import.meta.env.TELEMETRYFLOW_LOGO_LIGHT': JSON.stringify(env.TELEMETRYFLOW_LOGO_LIGHT || ''),
      'import.meta.env.TELEMETRYFLOW_LOGO_DARK': JSON.stringify(env.TELEMETRYFLOW_LOGO_DARK || ''),
      'import.meta.env.TELEMETRYFLOW_LOGO_ICON': JSON.stringify(env.TELEMETRYFLOW_LOGO_ICON || ''),
      'import.meta.env.TELEMETRYFLOW_LOGO_WIDTH': JSON.stringify(env.TELEMETRYFLOW_LOGO_WIDTH || ''),
      'import.meta.env.TELEMETRYFLOW_LOGO_HEIGHT': JSON.stringify(env.TELEMETRYFLOW_LOGO_HEIGHT || ''),
      // Copyright
      'import.meta.env.TELEMETRYFLOW_COPYRIGHT_COMPANY': JSON.stringify(env.TELEMETRYFLOW_COPYRIGHT_COMPANY || ''),
      'import.meta.env.TELEMETRYFLOW_COPYRIGHT_YEAR': JSON.stringify(env.TELEMETRYFLOW_COPYRIGHT_YEAR || ''),
      'import.meta.env.TELEMETRYFLOW_COPYRIGHT_TEXT': JSON.stringify(env.TELEMETRYFLOW_COPYRIGHT_TEXT || ''),
      'import.meta.env.TELEMETRYFLOW_SHOW_POWERED_BY': JSON.stringify(env.TELEMETRYFLOW_SHOW_POWERED_BY || 'false'),
      // Links
      'import.meta.env.TELEMETRYFLOW_LINK_WEBSITE': JSON.stringify(env.TELEMETRYFLOW_LINK_WEBSITE || ''),
      'import.meta.env.TELEMETRYFLOW_LINK_DOCS': JSON.stringify(env.TELEMETRYFLOW_LINK_DOCS || ''),
      'import.meta.env.TELEMETRYFLOW_LINK_SUPPORT': JSON.stringify(env.TELEMETRYFLOW_LINK_SUPPORT || ''),
      'import.meta.env.TELEMETRYFLOW_LINK_PRIVACY': JSON.stringify(env.TELEMETRYFLOW_LINK_PRIVACY || ''),
      'import.meta.env.TELEMETRYFLOW_LINK_TERMS': JSON.stringify(env.TELEMETRYFLOW_LINK_TERMS || ''),
      // Theme Colors
      'import.meta.env.TELEMETRYFLOW_THEME_PRIMARY_COLOR': JSON.stringify(env.TELEMETRYFLOW_THEME_PRIMARY_COLOR || ''),
      'import.meta.env.TELEMETRYFLOW_THEME_ACCENT_COLOR': JSON.stringify(env.TELEMETRYFLOW_THEME_ACCENT_COLOR || ''),
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '~': resolve(__dirname),
      },
    },

    plugins: [
      vue(),
      vueJsx(),
      UnoCSS(),

      // Mock API server for /v2/* endpoints (only when TELEMETRYFLOW_USE_MOCK=true)
      ...(useMock ? [mockServerPlugin()] : []),

      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
        dts: resolve(__dirname, 'src/types/auto-imports.d.ts'),
        dirs: [resolve(__dirname, 'src/composables')],
        vueTemplate: true,
      }),

      Components({
        resolvers: [NaiveUiResolver()],
        dts: resolve(__dirname, 'src/types/components.d.ts'),
        dirs: [resolve(__dirname, 'src/components')],
      }),
    ],

    server: {
      host: '0.0.0.0',
      port: 3100,
      open: false,
      cors: true,
      proxy: {
        // NestJS backend API (IAM, telemetry, monitoring, etc.)
        '/api/v2': {
          target: env.TELEMETRYFLOW_IAM_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
        // OTEL community endpoints (v1 ingestion)
        '/v1': {
          target: env.TELEMETRYFLOW_API_URL || 'http://localhost:4318',
          changeOrigin: true,
        },
        '/ws': {
          target: env.TELEMETRYFLOW_WS_URL || 'ws://localhost:4319',
          ws: true,
          changeOrigin: true,
        },
      },
    },

    preview: {
      port: parseInt(env.FRONTEND_PORT || '3101'),
    },

    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: isDev,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/vue/') || id.includes('node_modules/vue-router/') || id.includes('node_modules/pinia/')) return 'vue-vendor'
            if (id.includes('node_modules/naive-ui/')) return 'ui-vendor'
            if (id.includes('node_modules/echarts/') || id.includes('node_modules/vue-echarts/')) return 'chart-vendor'
          },
        },
      },
    },

    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'naive-ui',
        'echarts',
        'vue-echarts',
        'axios',
        'dayjs',
        'lodash-es',
      ],
    },

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },
  };
});
