<script setup lang="ts">
/**
 * API Keys Management View
 * TASK-09: Frontend view for API Keys module
 *
 * Features:
 * - List all API keys with filters
 * - Create new API key (with raw key display)
 * - Edit API key properties
 * - Rotate API key
 * - Activate/Deactivate API key
 * - Revoke API key (permanent)
 */

import { h, ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  NButton,
  NTag,
  NSelect,
  NInput,
  NDataTable,
  NCard,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NCheckboxGroup,
  NCheckbox,
  NAlert,
  NText,
  NTime,
  NDropdown,
  NDivider,
  NTooltip,
  useMessage,
  useDialog,
} from "naive-ui";
import type {
  FormInst,
  DataTableColumns,
  SelectOption,
  DropdownOption,
} from "naive-ui";
import { StatPanel } from "@/components/charts";
import { useStatPanelsFromRegistry } from "@/composables/useStatPanelsFromRegistry";
import { apiKeysApi } from "@/api/apikeys";
import { organizationsApi } from "@/api/organizations";
import { workspacesApi } from "@/api/workspaces";
import type { Organization, Workspace } from "@/types";
import type {
  ApiKey,
  ApiKeyType,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ListApiKeysQuery,
} from "@/types/apikey";
import {
  API_KEY_TYPES,
  API_KEY_STATUS,
  API_KEY_PERMISSIONS,
  API_KEY_SCOPES,
  getApiKeyStatus,
  formatApiKeyDisplay,
} from "@/types/apikey";
import { usePagination } from "@/composables/usePagination";
import {
  useApiKeyGuide,
  codeBlock,
  installCode,
  binaryCode,
  dockerCliCode,
  helmRepoCode,
  k8sApplyCode,
  k8sRotateApplyCode,
  TFO_AGENT_VERSION,
  TFO_COLLECTOR_VERSION,
} from "./components/useApiKeyGuide";
import { copyToClipboard } from "@/utils/clipboard";
import { getEntityColor } from "@/utils/tag-colors";
import { formatDateTime } from "@/utils/format";
import {
  ApiKeyDetailPanel,
  ApiKeyNodeGraph,
  ApiKeyCredentialsModal,
} from "./components";
import { tenantsApi } from "@/api/tenants";
import { regionsApi } from "@/api/regions";
import type { Tenant, Region } from "@/types";
import { exportToCSV, exportToJSON, getExportFilename } from "@/utils/export";

const message = useMessage();
const dialog = useDialog();

// ==================== DATA ====================

const apiKeys = ref<ApiKey[]>([]);
const organizations = ref<Organization[]>([]);
const workspaces = ref<Workspace[]>([]);
const tenants = ref<Tenant[]>([]);
const regions = ref<Region[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

usePagination(10);

// View mode: 'grid', 'table', or 'graph'
const viewMode = ref<"grid" | "table" | "graph">("table");

// Detail Panel
const showDetailPanel = ref(false);
const selectedDetailApiKey = ref<ApiKey | null>(null);

// Filters
const searchQuery = ref("");
const filterActive = ref<string | null>(null);
const filterKeyType = ref<ApiKeyType | null>(null);

const activeOptions: SelectOption[] = [
  { label: "All Status", value: "all" },
  { label: "Active Only", value: "true" },
  { label: "Inactive Only", value: "false" },
];

const keyTypeOptions = [
  { label: "All Types", value: null as unknown as string },
  ...Object.entries(API_KEY_TYPES).map(([key, val]) => ({
    label: val.label,
    value: key as ApiKeyType,
  })),
] as SelectOption[];

// ==================== STATISTICS ====================

const totalKeysCount = computed(() => total.value);
const activeKeysCount = computed(
  () => apiKeys.value.filter((k) => k.isActive && !k.revokedAt).length,
);
const expiredKeysCount = computed(
  () =>
    apiKeys.value.filter(
      (k) => k.isExpired || (k.expiresAt && k.expiresAt < Date.now()),
    ).length,
);
const revokedKeysCount = computed(
  () => apiKeys.value.filter((k) => !!k.revokedAt).length,
);

// Stat panels from registry (APK20001-APK20004)
const statCards = useStatPanelsFromRegistry(
  ["APK20001", "APK20002", "APK20003", "APK20004"],
  {
    APK20001: totalKeysCount,
    APK20002: activeKeysCount,
    APK20003: expiredKeysCount,
    APK20004: revokedKeysCount,
  },
);

// ==================== FETCH ====================

async function fetchApiKeys() {
  loading.value = true;
  try {
    const query: ListApiKeysQuery = {
      page: page.value,
      pageSize: pageSize.value,
      search: searchQuery.value || undefined,
      isActive:
        filterActive.value === "true"
          ? true
          : filterActive.value === "false"
            ? false
            : undefined,
      keyType: filterKeyType.value ?? undefined,
    };

    const [keysResult, orgsResult, wsResult, tenantsResult, regionsResult] =
      await Promise.allSettled([
        apiKeysApi.listApiKeys(query),
        organizationsApi.list({ limit: 100 }),
        workspacesApi.list({ limit: 500 }),
        tenantsApi.list({ limit: 500 }),
        regionsApi.list({ limit: 100 }),
      ]);

    if (keysResult.status === "rejected") throw keysResult.reason;

    apiKeys.value = keysResult.value.data;
    total.value = keysResult.value.total;
    organizations.value =
      orgsResult.status === "fulfilled"
        ? orgsResult.value.data || []
        : organizations.value;
    workspaces.value =
      wsResult.status === "fulfilled"
        ? wsResult.value.data || []
        : workspaces.value;
    tenants.value =
      tenantsResult.status === "fulfilled"
        ? tenantsResult.value.data || []
        : tenants.value;
    regions.value =
      regionsResult.status === "fulfilled"
        ? regionsResult.value.data || []
        : regions.value;
  } catch (error) {
    message.error("Failed to fetch API keys");
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// Get organization name — with fallback from API key metadata
function getOrgName(orgId: string): string {
  const org = organizations.value.find((o) => o.id === orgId);
  if (org) return org.name;
  // Fallback: look up org code from any API key's metadata
  const key = apiKeys.value.find((k) => k.organizationId === orgId);
  const code = key?.metadata?.organization_code as string | undefined;
  return code ? code : "Unknown";
}

// Get workspace name
function getWorkspaceName(wsId: string | undefined): string {
  if (!wsId) return "—";
  const ws = workspaces.value.find((w) => w.id === wsId);
  return ws ? ws.name : "Unknown";
}

// Get organization color using shared entity colors
function getOrgColor(orgId: string) {
  return getEntityColor(orgId, organizations.value);
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  fetchApiKeys();
}

function handlePageSizeChange(newSize: number) {
  pageSize.value = newSize;
  page.value = 1;
  fetchApiKeys();
}

function handleSearch() {
  page.value = 1;
  fetchApiKeys();
}

function handleResetFilters() {
  searchQuery.value = "";
  filterActive.value = null;
  filterKeyType.value = null;
  page.value = 1;
  fetchApiKeys();
}

onMounted(() => {
  fetchApiKeys();
});

// ==================== DETAIL PANEL ====================

function openDetailPanel(key: ApiKey) {
  selectedDetailApiKey.value = key;
  showDetailPanel.value = true;
}

function handleDetailEdit(key: ApiKey) {
  showDetailPanel.value = false;
  openEditModal(key);
}

function handleDetailRotate(key: ApiKey) {
  showDetailPanel.value = false;
  handleRotate(key);
}

function handleDetailActivate(key: ApiKey) {
  handleActivate(key);
  // Refresh the selected key after activation
  setTimeout(() => {
    const updated = apiKeys.value.find((k) => k.id === key.id);
    if (updated) selectedDetailApiKey.value = updated;
  }, 500);
}

function handleDetailDeactivate(key: ApiKey) {
  handleDeactivate(key);
  // Refresh the selected key after deactivation
  setTimeout(() => {
    const updated = apiKeys.value.find((k) => k.id === key.id);
    if (updated) selectedDetailApiKey.value = updated;
  }, 500);
}

function handleDetailRevoke(key: ApiKey) {
  showDetailPanel.value = false;
  handleRevoke(key);
}

// ==================== COLUMNS ====================

function getStatusTagType(
  status: string,
): "success" | "error" | "warning" | "default" {
  const typeMap: Record<string, "success" | "error" | "warning" | "default"> = {
    success: "success",
    error: "error",
    warning: "warning",
    default: "default",
  };
  return (
    typeMap[API_KEY_STATUS[status as keyof typeof API_KEY_STATUS]?.color] ||
    "default"
  );
}

const columns = computed<DataTableColumns<ApiKey>>(() => [
  {
    title: "Name",
    key: "name",
    width: 350,
    sorter: (a, b) => a.name.localeCompare(b.name),
    render(row) {
      return h("div", { class: "key-name-cell" }, [
        h(
          NText,
          {
            strong: true,
            style: "font-size: 14px; font-weight: 600; display: block",
          },
          { default: () => row.name },
        ),
        row.description
          ? h(
              NText,
              {
                depth: 3,
                style:
                  "font-size: 12px; display: block; margin-top: 2px; white-space: normal; word-break: break-word; overflow-wrap: anywhere; line-height: 1.4;",
              },
              { default: () => row.description },
            )
          : null,
      ]);
    },
  },
  {
    title: "Key",
    key: "keyHint",
    width: 120,
    align: "center",
    render(row) {
      return h(
        NText,
        { code: true, style: "font-size: 12px" },
        { default: () => formatApiKeyDisplay(row) },
      );
    },
  },
  {
    title: "Type",
    key: "keyType",
    width: 100,
    align: "center",
    sorter: (a, b) => a.keyType.localeCompare(b.keyType),
    render(row) {
      return h(
        NTag,
        {
          type: row.keyType === "service" ? "warning" : "info",
          size: "small",
        },
        { default: () => API_KEY_TYPES[row.keyType]?.label },
      );
    },
  },
  {
    title: "Status",
    key: "status",
    width: 120,
    align: "center",
    sorter: (a, b) => getApiKeyStatus(a).localeCompare(getApiKeyStatus(b)),
    render(row) {
      const status = getApiKeyStatus(row);
      return h(
        NTag,
        {
          type: getStatusTagType(status),
          size: "small",
        },
        { default: () => API_KEY_STATUS[status]?.label },
      );
    },
  },
  {
    title: "Organization",
    key: "organizationId",
    width: 150,
    align: "center",
    render(row) {
      const orgName = getOrgName(row.organizationId);
      const color = getOrgColor(row.organizationId);
      return h(
        NTag,
        {
          size: "small",
          bordered: false,
          style: `background: ${color.bg}; color: ${color.color}; border: 1px solid ${color.border}; font-weight: 600;`,
        },
        { default: () => orgName },
      );
    },
  },
  {
    title: "Rate Limit",
    key: "rateLimit",
    align: "center",
    width: 100,
    sorter: (a, b) => a.rateLimit - b.rateLimit,
    render(row) {
      return h(NText, null, {
        default: () => (row.rateLimit ? `${row.rateLimit}/min` : "—"),
      });
    },
  },
  {
    title: "Usage",
    key: "usageCount",
    width: 100,
    align: "center",
    sorter: (a, b) => a.usageCount - b.usageCount,
    render(row) {
      return h(NText, null, { default: () => row.usageCount.toLocaleString() });
    },
  },
  {
    title: "Last Used",
    key: "lastUsedAt",
    width: 170,
    align: "center",
    sorter: (a, b) => (a.lastUsedAt || 0) - (b.lastUsedAt || 0),
    render(row) {
      if (!row.lastUsedAt)
        return h(NText, { depth: 3 }, { default: () => "Never" });
      return h(NTime, { time: row.lastUsedAt, format: "yyyy-MM-dd HH:mm:ss" });
    },
  },
  {
    title: "Created",
    key: "createdAt",
    width: 170,
    sorter: (a, b) => a.createdAt - b.createdAt,
    render(row) {
      return h(NTime, { time: row.createdAt, format: "yyyy-MM-dd HH:mm:ss" });
    },
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    align: "center" as const,
    fixed: "right" as const,
    render(row) {
      const status = getApiKeyStatus(row);
      const isRevoked = status === "revoked";

      const options: DropdownOption[] = [
        {
          label: "Detail",
          key: "detail",
          icon: () =>
            h(Icon, { icon: "carbon:magnify", width: 16, height: 16 }),
        },
        {
          label: "Edit",
          key: "edit",
          disabled: isRevoked,
          icon: () => h(Icon, { icon: "carbon:edit", width: 16, height: 16 }),
        },
        {
          label: "Rotate Key",
          key: "rotate",
          disabled: isRevoked,
          icon: () => h(Icon, { icon: "carbon:renew", width: 16, height: 16 }),
        },
        {
          label: row.isActive ? "Deactivate" : "Activate",
          key: row.isActive ? "deactivate" : "activate",
          disabled: isRevoked,
          icon: () =>
            h(Icon, {
              icon: row.isActive ? "carbon:pause" : "carbon:play",
              width: 16,
              height: 16,
            }),
        },
        { type: "divider", key: "d1" },
        {
          label: "Revoke",
          key: "revoke",
          disabled: isRevoked,
          icon: () =>
            h(Icon, { icon: "carbon:warning-alt", width: 16, height: 16 }),
          props: { class: "delete-action" },
        },
        {
          label: "Delete",
          key: "delete",
          disabled: !isRevoked,
          icon: () =>
            h(Icon, { icon: "carbon:trash-can", width: 16, height: 16 }),
          props: { class: "delete-action" },
        },
      ];

      function handleActionSelect(key: string) {
        switch (key) {
          case "detail":
            openDetailPanel(row);
            break;
          case "edit":
            openEditModal(row);
            break;
          case "rotate":
            handleRotate(row);
            break;
          case "activate":
            handleActivate(row);
            break;
          case "deactivate":
            handleDeactivate(row);
            break;
          case "revoke":
            dialog.warning({
              title: "Revoke API Key",
              content: `Permanently revoke "${row.name}"? The key will be disabled but kept in records.`,
              positiveText: "Revoke",
              negativeText: "Cancel",
              onPositiveClick: () => handleRevoke(row),
            });
            break;
          case "delete":
            dialog.error({
              title: "Delete API Key",
              content: `Permanently delete "${row.name}" from the database? This cannot be undone.`,
              positiveText: "Delete",
              negativeText: "Cancel",
              onPositiveClick: () => handleDelete(row),
            });
            break;
        }
      }

      return h(
        NDropdown,
        { options, trigger: "click", onSelect: handleActionSelect },
        {
          default: () =>
            h(
              NButton,
              { size: "small", quaternary: true },
              {
                icon: () =>
                  h(Icon, {
                    icon: "carbon:overflow-menu-vertical",
                    width: 16,
                    height: 16,
                  }),
              },
            ),
        },
      );
    },
  },
]);

// ==================== FORM TABS ====================

type ApiKeyFormTab = "general" | "permissions" | "scopes";

const activeCreateTab = ref<ApiKeyFormTab>("general");
const activeEditTab = ref<ApiKeyFormTab>("general");

const formTabs: { label: string; value: ApiKeyFormTab; icon: string }[] = [
  { label: "General", value: "general", icon: "carbon:settings" },
  { label: "Permissions", value: "permissions", icon: "carbon:locked" },
  { label: "Scopes", value: "scopes", icon: "carbon:catalog" },
];

const tabDescriptions: Record<ApiKeyFormTab, string> = {
  general: "Basic settings including name, description, and rate limits",
  permissions: "Control what actions this API key is allowed to perform",
  scopes: "Define which data domains this API key can access",
};

// ==================== CREATE MODAL ====================

const showCreateModal = ref(false);
const createFormRef = ref<FormInst | null>(null);
const createLoading = ref(false);
const createdKeys = ref<{
  rawApiKeyId: string;
  rawApiKeySecret: string;
  rawEncryptKey: string;
} | null>(null);

const createForm = ref<CreateApiKeyRequest>({
  name: "",
  description: "",
  keyType: "standard",
  permissions: ["read:telemetry"],
  scopes: ["metrics", "logs", "traces"],
  rateLimit: 1000,
});

const createRules = {
  name: [{ required: true, message: "Name is required", trigger: "blur" }],
};

function openCreateModal() {
  activeCreateTab.value = "general";
  createForm.value = {
    name: "",
    description: "",
    keyType: "standard",
    permissions: ["read:telemetry"],
    scopes: ["metrics", "logs", "traces"],
    rateLimit: 1000,
  };
  createdKeys.value = null;
  resetGuide();
  showCreateModal.value = true;
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate();
  } catch {
    return;
  }

  createLoading.value = true;
  try {
    const result = await apiKeysApi.createApiKey(createForm.value);
    createdKeys.value = {
      rawApiKeyId: result.rawApiKeyId,
      rawApiKeySecret: result.rawApiKeySecret,
      rawEncryptKey: result.rawEncryptKey,
    };
    message.success("API key created successfully");
    fetchApiKeys();
  } catch (error) {
    message.error("Failed to create API key");
    console.error(error);
  } finally {
    createLoading.value = false;
  }
}

function handleCopyKey(key: string, label: string) {
  copyToClipboard(key);
  message.success(`${label} copied to clipboard`);
}

function closeCreateModal() {
  showCreateModal.value = false;
  createdKeys.value = null;
}

// ==================== EDIT MODAL ====================

const showEditModal = ref(false);
const editFormRef = ref<FormInst | null>(null);
const editLoading = ref(false);
const editingKey = ref<ApiKey | null>(null);

const editForm = ref<UpdateApiKeyRequest>({
  name: "",
  description: "",
  permissions: [],
  scopes: [],
  rateLimit: 1000,
});

function openEditModal(key: ApiKey) {
  activeEditTab.value = "general";
  editingKey.value = key;
  editForm.value = {
    name: key.name,
    description: key.description,
    permissions: [...key.permissions],
    scopes: [...key.scopes],
    rateLimit: key.rateLimit,
    expiresAt: key.expiresAt
      ? new Date(key.expiresAt).toISOString()
      : undefined,
  };
  showEditModal.value = true;
}

async function handleEdit() {
  if (!editingKey.value) return;

  try {
    await editFormRef.value?.validate();
  } catch {
    return;
  }

  editLoading.value = true;
  try {
    await apiKeysApi.updateApiKey(editingKey.value.id, editForm.value);
    message.success("API key updated successfully");
    showEditModal.value = false;
    fetchApiKeys();
  } catch (error) {
    message.error("Failed to update API key");
    console.error(error);
  } finally {
    editLoading.value = false;
  }
}

// ==================== ACTIONS ====================

const rotatedKeys = ref<{
  apiKeyId: string;
  rawApiKeySecret: string;
  rawEncryptKey: string;
} | null>(null);
const showRotatedKeyModal = ref(false);

// ==================== CREDENTIALS MODAL ====================
// Ephemeral — cleared on close, never stored in Pinia
const showCredentialsModal = ref(false);
const credentialsModalMode = ref<"create" | "rotate">("create");
const pendingCredentials = ref<{
  apiKeyId?: string;
  apiKeySecret: string;
  encryptionKey: string;
} | null>(null);

function closeCredentialsModal() {
  showCredentialsModal.value = false;
  pendingCredentials.value = null;
}
const {
  implGuideTab,
  implInstallPlatform,
  guideTabs,
  installPlatformOptions,
  rawOf,
  resetGuide,
} = useApiKeyGuide();

const rotateTabs = guideTabs;

const createEnvCode = computed(() => {
  if (!createdKeys.value) return "";
  const {
    rawApiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = createdKeys.value;
  return codeBlock(
    `# Credentials (same for Agent and Collector)
TELEMETRYFLOW_API_KEY_ID=${id}
TELEMETRYFLOW_API_KEY_SECRET=${sec}
ENCRYPTION_KEY=${enc}

# TFO Agent endpoint
TELEMETRYFLOW_API_ENDPOINT=http://<platform-host>:3100

# TFO Collector endpoint (different var name)
TELEMETRYFLOW_ENDPOINT=http://<platform-host>:3100`,
    "env",
  );
});

const createDockerCode = computed(() => {
  if (!createdKeys.value) return "";
  const {
    rawApiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = createdKeys.value;
  return codeBlock(
    `services:
  tfo-collector:
    image: telemetryflow/telemetryflow-collector:1.2.1
    command: ["--config=/etc/tfo-collector/tfo-collector.yaml"]
    container_name: telemetryflow_core_tfo_collector
    restart: unless-stopped
    ports:
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
      - "8889:8889"    # Prometheus metrics
      - "13133:13133"  # Health check
    environment:
      - TELEMETRYFLOW_ENDPOINT=http://host.docker.internal:3000
      - TELEMETRYFLOW_API_KEY_ID=${id}
      - TELEMETRYFLOW_API_KEY_SECRET=${sec}
      - TELEMETRYFLOW_COLLECTOR_ID=telemetryflow_core_tfo_collector
      - TELEMETRYFLOW_ENVIRONMENT=production
    volumes:
      - ./config/otel/tfo-collector.yaml:/etc/tfo-collector/tfo-collector.yaml:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:13133"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  tfo-agent:
    image: telemetryflow/telemetryflow-agent:${TFO_AGENT_VERSION}
    container_name: telemetryflow_core_tfo_agent
    hostname: tfo-agent
    restart: unless-stopped
    ports:
      - "9191:9191"    # Health & metrics
    environment:
      - TZ=UTC
      - TELEMETRYFLOW_ENDPOINT=http://host.docker.internal:3000/api/v2
      - TELEMETRYFLOW_OTLP_ENDPOINT=http://tfo-collector:4318
      - TELEMETRYFLOW_API_KEY_ID=${id}
      - TELEMETRYFLOW_API_KEY_SECRET=${sec}
      - TELEMETRYFLOW_AGENT_ID=telemetryflow_core_tfo_agent
      - TELEMETRYFLOW_AGENT_NAME=TFO Docker Agent
      - TELEMETRYFLOW_ENVIRONMENT=production
    volumes:
      - ./config/tfo-agent/tfo-agent.yaml:/etc/tfo-agent/tfo-agent.yaml:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://localhost:9191/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s`,
    "yaml",
  );
});

const createK8sCode = computed(() => {
  if (!createdKeys.value) return "";
  const {
    rawApiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = createdKeys.value;
  return codeBlock(
    `apiVersion: v1
kind: Secret
metadata:
  name: tfo-credentials
  namespace: telemetryflow
type: Opaque
stringData:
  TELEMETRYFLOW_API_KEY_ID: "${id}"
  TELEMETRYFLOW_API_KEY_SECRET: "${sec}"
  ENCRYPTION_KEY: "${enc}"
---
# In your Deployment spec.containers[]:
envFrom:
  - secretRef:
      name: tfo-credentials`,
    "yaml",
  );
});

const rotateEnvCode = computed(() => {
  if (!rotatedKeys.value) return "";
  const {
    apiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = rotatedKeys.value;
  return codeBlock(
    `# Key ID unchanged — update these two values only
TELEMETRYFLOW_API_KEY_ID=${id}
TELEMETRYFLOW_API_KEY_SECRET=${sec}
ENCRYPTION_KEY=${enc}`,
    "env",
  );
});

const rotateDockerCode = computed(() => {
  if (!rotatedKeys.value) return "";
  const {
    apiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = rotatedKeys.value;
  return codeBlock(
    `services:
  tfo-collector:
    image: telemetryflow/telemetryflow-collector:${TFO_COLLECTOR_VERSION}
    command: ["--config=/etc/tfo-collector/tfo-collector.yaml"]
    container_name: telemetryflow_core_tfo_collector
    restart: unless-stopped
    ports:
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
      - "8889:8889"    # Prometheus metrics
      - "13133:13133"  # Health check
    environment:
      - TELEMETRYFLOW_ENDPOINT=http://host.docker.internal:3000
      - TELEMETRYFLOW_API_KEY_ID=${id}
      - TELEMETRYFLOW_API_KEY_SECRET=${sec}
      - TELEMETRYFLOW_COLLECTOR_ID=telemetryflow_core_tfo_collector
      - TELEMETRYFLOW_ENVIRONMENT=production
    volumes:
      - ./config/otel/tfo-collector.yaml:/etc/tfo-collector/tfo-collector.yaml:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:13133"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  tfo-agent:
    image: telemetryflow/telemetryflow-agent:${TFO_AGENT_VERSION}
    container_name: telemetryflow_core_tfo_agent
    hostname: tfo-agent
    restart: unless-stopped
    ports:
      - "9191:9191"    # Health & metrics
    environment:
      - TZ=UTC
      - TELEMETRYFLOW_ENDPOINT=http://host.docker.internal:3000/api/v2
      - TELEMETRYFLOW_OTLP_ENDPOINT=http://tfo-collector:4318
      - TELEMETRYFLOW_API_KEY_ID=${id}
      - TELEMETRYFLOW_API_KEY_SECRET=${sec}
      - TELEMETRYFLOW_AGENT_ID=telemetryflow_core_tfo_agent
      - TELEMETRYFLOW_AGENT_NAME=TFO Docker Agent
      - TELEMETRYFLOW_ENVIRONMENT=production
    volumes:
      - ./config/tfo-agent/tfo-agent.yaml:/etc/tfo-agent/tfo-agent.yaml:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://localhost:9191/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s`,
    "yaml",
  );
});

const rotateK8sCode = computed(() => {
  if (!rotatedKeys.value) return "";
  const { rawApiKeySecret: sec, rawEncryptKey: enc } = rotatedKeys.value;
  return codeBlock(
    `kubectl patch secret tfo-credentials \\
  -n telemetryflow \\
  --type='json' \\
  -p='[
    {"op":"replace","path":"/stringData/TELEMETRYFLOW_API_KEY_SECRET",
     "value":"${sec}"},
    {"op":"replace","path":"/stringData/ENCRYPTION_KEY",
     "value":"${enc}"}
  ]'

# Restart pods to pick up new secret
kubectl rollout restart deployment/tfo-agent -n telemetryflow
kubectl rollout restart deployment/tfo-collector -n telemetryflow`,
    "bash",
  );
});

const createK8sManifestCode = computed(() => {
  if (!createdKeys.value) return "";
  const {
    rawApiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = createdKeys.value;
  return codeBlock(
    `apiVersion: v1
kind: Secret
metadata:
  name: tfo-credentials
  namespace: telemetryflow
type: Opaque
stringData:
  TELEMETRYFLOW_API_KEY_ID: "${id}"
  TELEMETRYFLOW_API_KEY_SECRET: "${sec}"
  ENCRYPTION_KEY: "${enc}"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tfo-agent
  namespace: telemetryflow
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tfo-agent
  template:
    metadata:
      labels:
        app: tfo-agent
    spec:
      containers:
        - name: tfo-agent
          image: telemetryflow/telemetryflow-agent:${TFO_AGENT_VERSION}
          envFrom:
            - secretRef:
                name: tfo-credentials
          env:
            - name: TELEMETRYFLOW_API_ENDPOINT
              value: "https://your-platform-host/api/v2"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tfo-collector
  namespace: telemetryflow
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tfo-collector
  template:
    metadata:
      labels:
        app: tfo-collector
    spec:
      containers:
        - name: tfo-collector
          image: telemetryflow/telemetryflow-collector:1.2.1
          envFrom:
            - secretRef:
                name: tfo-credentials
          env:
            - name: TELEMETRYFLOW_ENDPOINT
              value: "https://your-platform-host"`,
    "yaml",
  );
});

const createHelmRepoCode = helmRepoCode;

const createHelmAgentCode = computed(() => {
  if (!createdKeys.value) return "";
  const {
    rawApiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = createdKeys.value;
  return codeBlock(
    `HELM_CHART=telemetryflow/telemetryflow-agent

helm upgrade --install tfo-agent $HELM_CHART \\
  -n telemetryflow \\
  --create-namespace \\
  -f manifest/tfo-agent.values.yaml \\
  --set credentials.apiKeyId="${id}" \\
  --set credentials.apiKeySecret="${sec}" \\
  --set credentials.encryptionKey="${enc}" \\
  --set platform.endpoint="https://your-platform-host/api/v2"`,
    "bash",
  );
});

const createHelmCollectorCode = computed(() => {
  if (!createdKeys.value) return "";
  const {
    rawApiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = createdKeys.value;
  return codeBlock(
    `HELM_CHART=telemetryflow/telemetryflow-collector

helm upgrade --install tfo-collector $HELM_CHART \\
  -n telemetryflow \\
  --create-namespace \\
  -f manifest/tfo-collector.values.yaml \\
  --set credentials.apiKeyId="${id}" \\
  --set credentials.apiKeySecret="${sec}" \\
  --set credentials.encryptionKey="${enc}" \\
  --set platform.endpoint="https://your-platform-host"`,
    "bash",
  );
});

const createHelmValuesCode = computed(() => {
  if (!createdKeys.value) return "";
  const {
    rawApiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = createdKeys.value;
  return codeBlock(
    `# manifest/tfo-agent.values.yaml  (same structure for tfo-collector.values.yaml)
credentials:
  apiKeyId: "${id}"
  apiKeySecret: "${sec}"
  encryptionKey: "${enc}"

platform:
  endpoint: "https://your-platform-host"

image:
  tag: "1.2.0"   # use 1.2.1 for tfo-collector

replicaCount: 1`,
    "yaml",
  );
});

// imported from useApiKeyGuide: k8sApplyCode, k8sRotateApplyCode
const createK8sApplyCode = k8sApplyCode;

const rotateK8sManifestCode = computed(() => {
  if (!rotatedKeys.value) return "";
  const {
    apiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = rotatedKeys.value;
  return codeBlock(
    `# Apply updated Secret with new credentials
apiVersion: v1
kind: Secret
metadata:
  name: tfo-credentials
  namespace: telemetryflow
type: Opaque
stringData:
  TELEMETRYFLOW_API_KEY_ID: "${id}"
  TELEMETRYFLOW_API_KEY_SECRET: "${sec}"
  ENCRYPTION_KEY: "${enc}"`,
    "yaml",
  );
});

const rotateK8sApplyCode = k8sRotateApplyCode;

const rotateHelmAgentCode = computed(() => {
  if (!rotatedKeys.value) return "";
  const {
    apiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = rotatedKeys.value;
  return codeBlock(
    `HELM_CHART=telemetryflow/telemetryflow-agent

helm upgrade --install tfo-agent $HELM_CHART \\
  -n telemetryflow \\
  --reuse-values \\
  --set credentials.apiKeyId="${id}" \\
  --set credentials.apiKeySecret="${sec}" \\
  --set credentials.encryptionKey="${enc}"`,
    "bash",
  );
});

const rotateHelmCollectorCode = computed(() => {
  if (!rotatedKeys.value) return "";
  const {
    apiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = rotatedKeys.value;
  return codeBlock(
    `HELM_CHART=telemetryflow/telemetryflow-collector

helm upgrade --install tfo-collector $HELM_CHART \\
  -n telemetryflow \\
  --reuse-values \\
  --set credentials.apiKeyId="${id}" \\
  --set credentials.apiKeySecret="${sec}" \\
  --set credentials.encryptionKey="${enc}"`,
    "bash",
  );
});

const rotateHelmValuesCode = computed(() => {
  if (!rotatedKeys.value) return "";
  const {
    apiKeyId: id,
    rawApiKeySecret: sec,
    rawEncryptKey: enc,
  } = rotatedKeys.value;
  return codeBlock(
    `# Update credentials in manifest/tfo-agent.values.yaml
# and manifest/tfo-collector.values.yaml
credentials:
  apiKeyId: "${id}"
  apiKeySecret: "${sec}"
  encryptionKey: "${enc}"`,
    "yaml",
  );
});

async function handleRotate(key: ApiKey) {
  dialog.warning({
    title: "Rotate API Key",
    content: `Are you sure you want to rotate "${key.name}"? The current key will be invalidated immediately.`,
    positiveText: "Rotate",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      try {
        const result = await apiKeysApi.rotateApiKey(key.id);
        rotatedKeys.value = {
          apiKeyId: key.apiKeyId ?? key.keyPrefix,
          rawApiKeySecret: result.rawApiKeySecret,
          rawEncryptKey: result.rawEncryptKey,
        };
        resetGuide();
        showRotatedKeyModal.value = true;
        message.success("API key rotated successfully");
        fetchApiKeys();
      } catch (error) {
        message.error("Failed to rotate API key");
        console.error(error);
      }
    },
  });
}

async function handleActivate(key: ApiKey) {
  try {
    await apiKeysApi.activateApiKey(key.id);
    message.success("API key activated");
    fetchApiKeys();
  } catch (error) {
    message.error("Failed to activate API key");
    console.error(error);
  }
}

async function handleDeactivate(key: ApiKey) {
  try {
    await apiKeysApi.deactivateApiKey(key.id);
    message.success("API key deactivated");
    fetchApiKeys();
  } catch (error) {
    message.error("Failed to deactivate API key");
    console.error(error);
  }
}

async function handleRevoke(key: ApiKey) {
  try {
    await apiKeysApi.revokeApiKey(key.id);
    message.success("API key revoked");
    fetchApiKeys();
  } catch (error) {
    message.error("Failed to revoke API key");
    console.error(error);
  }
}

async function handleDelete(key: ApiKey) {
  try {
    await apiKeysApi.deleteApiKey(key.id);
    message.success("API key deleted permanently");
    fetchApiKeys();
  } catch (error) {
    message.error("Failed to delete API key");
    console.error(error);
  }
}

// ==================== EXPORT FUNCTIONS ====================

function exportCSV() {
  const data = apiKeys.value.map((k) => ({
    name: k.name,
    keyHint: formatApiKeyDisplay(k),
    keyType: API_KEY_TYPES[k.keyType]?.label,
    status: API_KEY_STATUS[getApiKeyStatus(k)]?.label,
    organization: getOrgName(k.organizationId),
    workspace: getWorkspaceName(k.workspaceId),
    rateLimit: `${k.rateLimit}/min`,
    usageCount: k.usageCount,
    lastUsedAt: k.lastUsedAt ? formatDateTime(k.lastUsedAt) : "Never",
    createdAt: formatDateTime(k.createdAt),
  }));

  const columns = [
    { key: "name", title: "Name" },
    { key: "keyHint", title: "Key Hint" },
    { key: "keyType", title: "Type" },
    { key: "status", title: "Status" },
    { key: "organization", title: "Organization" },
    { key: "workspace", title: "Workspace" },
    { key: "rateLimit", title: "Rate Limit" },
    { key: "usageCount", title: "Usage Count" },
    { key: "lastUsedAt", title: "Last Used" },
    { key: "createdAt", title: "Created" },
  ];

  exportToCSV(data, getExportFilename("api-keys"), columns);
  message.success("Exported to CSV successfully");
}

function exportJSON() {
  const data = apiKeys.value.map((k) => ({
    id: k.id,
    name: k.name,
    keyHint: formatApiKeyDisplay(k),
    keyType: k.keyType,
    status: getApiKeyStatus(k),
    organizationId: k.organizationId,
    workspaceId: k.workspaceId,
    permissions: k.permissions,
    scopes: k.scopes,
    rateLimit: k.rateLimit,
    usageCount: k.usageCount,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
    isActive: k.isActive,
  }));

  exportToJSON(data, getExportFilename("api-keys"));
  message.success("Exported to JSON successfully");
}

// Filtered API keys for grid view
const filteredApiKeys = computed(() => {
  if (!searchQuery.value) return apiKeys.value;
  const query = searchQuery.value.toLowerCase();
  return apiKeys.value.filter(
    (k) =>
      k.name.toLowerCase().includes(query) ||
      k.description?.toLowerCase().includes(query),
  );
});

// Action dropdown options for grid view
function getActionOptions(row: ApiKey) {
  const status = getApiKeyStatus(row);
  const isRevoked = status === "revoked";

  return [
    { label: "Detail", key: "detail", icon: "carbon:magnify" },
    { label: "Edit", key: "edit", disabled: isRevoked, icon: "carbon:edit" },
    {
      label: "Rotate Key",
      key: "rotate",
      disabled: isRevoked,
      icon: "carbon:renew",
    },
    {
      label: row.isActive ? "Deactivate" : "Activate",
      key: row.isActive ? "deactivate" : "activate",
      disabled: isRevoked,
      icon: row.isActive ? "carbon:pause" : "carbon:play",
    },
    { type: "divider" as const, key: "d1" },
    {
      label: "Revoke",
      key: "revoke",
      disabled: isRevoked,
      icon: "carbon:warning-alt",
    },
    {
      label: "Delete",
      key: "delete",
      disabled: !isRevoked,
      icon: "carbon:trash-can",
    },
  ];
}

function handleActionSelect(key: string, row: ApiKey) {
  switch (key) {
    case "detail":
      openDetailPanel(row);
      break;
    case "edit":
      openEditModal(row);
      break;
    case "rotate":
      handleRotate(row);
      break;
    case "activate":
      handleActivate(row);
      break;
    case "deactivate":
      handleDeactivate(row);
      break;
    case "revoke":
      dialog.warning({
        title: "Revoke API Key",
        content: `Permanently revoke "${row.name}"? The key will be disabled but kept in records.`,
        positiveText: "Revoke",
        negativeText: "Cancel",
        onPositiveClick: () => handleRevoke(row),
      });
      break;
    case "delete":
      dialog.error({
        title: "Delete API Key",
        content: `Permanently delete "${row.name}" from the database? This cannot be undone.`,
        positiveText: "Delete",
        negativeText: "Cancel",
        onPositiveClick: () => handleDelete(row),
      });
      break;
  }
}
</script>

<template>
  <div class="api-keys-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="carbon:password" class="title-icon" />
          API Keys
        </h1>
        <span class="page-subtitle">Manage API keys for programmatic access</span>
      </div>
      <div class="header-right">
        <NButton type="primary" @click="openCreateModal">
          <template #icon>
            <Icon icon="carbon:add" />
          </template>
          Create API Key
        </NButton>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stat-cards-container">
      <div class="stats-grid">
        <StatPanel
          v-for="(config, index) in statCards"
          :key="`stat-${index}`"
          v-bind="config"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:api" class="section-icon" />
          <span>API Key List</span>
          <NTag :bordered="false" size="small" type="info">
            {{ total }} API keys
          </NTag>
        </div>
        <div class="table-actions">
          <NInput
            v-model:value="searchQuery"
            placeholder="Search by name..."
            size="small"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix><Icon icon="carbon:search" /></template>
          </NInput>
          <NSelect
            v-model:value="filterActive"
            :options="activeOptions"
            placeholder="Status"
            size="small"
            style="width: 130px"
            @update:value="handleSearch"
          />
          <NSelect
            v-model:value="filterKeyType"
            :options="keyTypeOptions"
            placeholder="Key Type"
            size="small"
            style="width: 130px"
            @update:value="handleSearch"
          />
          <NButton size="small" ghost @click="handleResetFilters">
            <template #icon><Icon icon="carbon:reset" /></template>
            Reset
          </NButton>
          <n-button-group size="small">
            <n-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <template #icon>
                <Icon icon="carbon:grid" />
              </template>
              Grid
            </n-button>
            <n-button
              :type="viewMode === 'table' ? 'primary' : 'default'"
              @click="viewMode = 'table'"
            >
              <template #icon>
                <Icon icon="carbon:list" />
              </template>
              Table
            </n-button>
            <n-button
              :type="viewMode === 'graph' ? 'primary' : 'default'"
              @click="viewMode = 'graph'"
            >
              <template #icon>
                <Icon icon="carbon:network-4" />
              </template>
              Graph
            </n-button>
            <n-button secondary @click="exportCSV">
              <template #icon>
                <Icon icon="carbon:download" />
              </template>
              CSV
            </n-button>
            <n-button secondary @click="exportJSON">
              <template #icon>
                <Icon icon="carbon:code" />
              </template>
              JSON
            </n-button>
          </n-button-group>
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="grid-content">
        <n-spin :show="loading">
          <div class="cards-grid">
            <div
              v-for="apiKey in filteredApiKeys"
              :key="apiKey.id"
              class="dashboard-card"
              @click="openDetailPanel(apiKey)"
            >
              <div class="card-header">
                <div class="card-icon apikey-icon">
                  <Icon
                    :icon="
                      apiKey.keyType === 'service'
                        ? 'carbon:api'
                        : 'carbon:password'
                    "
                  />
                </div>
                <n-dropdown
                  trigger="click"
                  :options="
                    getActionOptions(apiKey).map((opt) =>
                      opt.type === 'divider'
                        ? { type: 'divider', key: opt.key }
                        : {
                          label: opt.label,
                          key: opt.key,
                          icon: () => h(Icon, { icon: opt.icon }),
                          disabled: opt.disabled,
                        },
                    )
                  "
                  @select="(key: string) => handleActionSelect(key, apiKey)"
                >
                  <n-button quaternary circle size="small" @click.stop>
                    <template #icon>
                      <Icon icon="carbon:overflow-menu-vertical" />
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ apiKey.name }}</h3>
                <p class="card-description">
                  {{ apiKey.description || formatApiKeyDisplay(apiKey) }}
                </p>
              </div>
              <div class="card-meta">
                <span class="usage-count">{{ apiKey.usageCount.toLocaleString() }} calls</span>
                <span class="rate-limit">{{
                  apiKey.rateLimit ? `${apiKey.rateLimit}/min` : "—"
                }}</span>
              </div>
              <div class="card-tags">
                <NTag
                  size="small"
                  :type="apiKey.keyType === 'service' ? 'warning' : 'info'"
                  :bordered="false"
                >
                  {{ API_KEY_TYPES[apiKey.keyType]?.label }}
                </NTag>
                <NTag
                  size="small"
                  :type="getStatusTagType(getApiKeyStatus(apiKey))"
                  :bordered="false"
                >
                  {{ API_KEY_STATUS[getApiKeyStatus(apiKey)]?.label }}
                </NTag>
                <NTag
                  size="small"
                  :bordered="false"
                  :style="`background: ${getOrgColor(apiKey.organizationId).bg}; color: ${getOrgColor(apiKey.organizationId).color};`"
                >
                  {{ getOrgName(apiKey.organizationId) }}
                </NTag>
              </div>
            </div>
          </div>
          <div
            v-if="filteredApiKeys.length === 0 && !loading"
            class="empty-state"
          >
            <Icon icon="carbon:password" class="empty-icon" />
            <p>No API keys found</p>
          </div>
        </n-spin>
      </div>

      <!-- Graph View -->
      <div v-else-if="viewMode === 'graph'" class="graph-content">
        <n-spin :show="loading">
          <ApiKeyNodeGraph
            :api-keys="filteredApiKeys"
            :regions="regions"
            :organizations="organizations"
            :workspaces="workspaces"
            :tenants="tenants"
          />
        </n-spin>
      </div>

      <!-- Table View -->
      <!-- datatableId: APK30001 -->
      <div v-else class="table-content">
        <NDataTable
          :columns="columns"
          :data="apiKeys"
          :loading="loading"
          :pagination="{
            page: page,
            pageSize: pageSize,
            itemCount: total,
            showSizePicker: true,
            pageSizes: [10, 20, 50, 100, 200, 500],
            onChange: handlePageChange,
            onUpdatePageSize: handlePageSizeChange,
          }"
          :scroll-x="1400"
          :max-height="'calc(100vh - 360px)'"
          :row-key="(row: ApiKey) => row.id"
          :bordered="false"
          striped
          size="small"
        />
      </div>
    </div>

    <!-- Create Modal -->
    <NModal
      v-model:show="showCreateModal"
      preset="card"
      title="Create API Key"
      :style="{ maxWidth: '860px', width: '95vw', maxHeight: '950px' }"
      :content-style="{
        overflowY: 'auto',
        maxHeight: 'calc(950px - 56px)',
        padding: '20px 24px',
      }"
      :mask-closable="!createdKeys"
      :closable="!createdKeys"
    >
      <!-- Form State -->
      <div v-if="!createdKeys">
        <div class="apikey-form-content">
          <!-- Left Side: Vertical Tabs -->
          <div class="form-tabs">
            <div
              v-for="tab in formTabs"
              :key="tab.value"
              class="form-tab-item"
              :class="{ active: activeCreateTab === tab.value }"
              @click="activeCreateTab = tab.value"
            >
              <Icon :icon="tab.icon" class="tab-icon" />
              <span class="tab-label">{{ tab.label }}</span>
            </div>
            <div class="tab-description">
              <p>{{ tabDescriptions[activeCreateTab] }}</p>
            </div>
          </div>

          <!-- Right Side: Form Content -->
          <div class="form-content">
            <div class="form-box">
              <NForm
                ref="createFormRef"
                :model="createForm"
                :rules="createRules"
                label-placement="top"
              >
                <!-- General Tab -->
                <template v-if="activeCreateTab === 'general'">
                  <NFormItem label="Name" path="name">
                    <NInput
                      v-model:value="createForm.name"
                      placeholder="My API Key"
                    />
                  </NFormItem>

                  <NFormItem label="Description" path="description">
                    <NInput
                      v-model:value="createForm.description"
                      type="textarea"
                      placeholder="Optional description"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                    />
                  </NFormItem>

                  <NFormItem label="Key Type" path="keyType">
                    <NSelect
                      v-model:value="createForm.keyType"
                      :options="
                        Object.entries(API_KEY_TYPES).map(([k, v]) => ({
                          label: v.label,
                          value: k,
                        }))
                      "
                    />
                  </NFormItem>

                  <NFormItem label="Rate Limit" path="rateLimit">
                    <NInputNumber
                      v-model:value="createForm.rateLimit"
                      :min="1"
                      :max="100000"
                      style="width: 200px"
                    >
                      <template #suffix>req/min</template>
                    </NInputNumber>
                  </NFormItem>
                </template>

                <!-- Permissions Tab -->
                <template v-if="activeCreateTab === 'permissions'">
                  <p class="section-hint">
                    Select the permissions this API key should have
                  </p>
                  <NCheckboxGroup v-model:value="createForm.permissions">
                    <div class="checkbox-list">
                      <NCheckbox
                        v-for="perm in API_KEY_PERMISSIONS"
                        :key="perm.value"
                        :value="perm.value"
                        class="checkbox-item"
                      >
                        <div class="checkbox-content">
                          <span class="checkbox-label">{{ perm.label }}</span>
                          <code class="checkbox-code">{{ perm.value }}</code>
                        </div>
                      </NCheckbox>
                    </div>
                  </NCheckboxGroup>
                </template>

                <!-- Scopes Tab -->
                <template v-if="activeCreateTab === 'scopes'">
                  <p class="section-hint">
                    Define which data domains this API key can access
                  </p>
                  <NCheckboxGroup v-model:value="createForm.scopes">
                    <div class="checkbox-list">
                      <NCheckbox
                        v-for="scope in API_KEY_SCOPES"
                        :key="scope.value"
                        :value="scope.value"
                        class="checkbox-item"
                      >
                        <div class="checkbox-content">
                          <span class="checkbox-label">{{ scope.label }}</span>
                          <code class="checkbox-code">{{ scope.value }}</code>
                        </div>
                      </NCheckbox>
                    </div>
                  </NCheckboxGroup>
                </template>
              </NForm>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <NButton type="primary" ghost @click="showCreateModal = false">
            <template #icon>
              <Icon icon="carbon:close" />
            </template>
            Cancel
          </NButton>
          <NButton
            type="primary"
            :disabled="!createForm.name.trim()"
            :loading="createLoading"
            @click="handleCreate"
          >
            <template #icon>
              <Icon icon="carbon:save" />
            </template>
            Create Key
          </NButton>
        </div>
      </div>

      <!-- Key Created State -->
      <div v-else>
        <div class="rotate-keys-alert">
          <Icon icon="carbon:warning-filled" class="rotate-keys-alert__icon" />
          <div class="rotate-keys-alert__body">
            <div class="rotate-keys-alert__title">Save Your New API Keys</div>
            <div class="rotate-keys-alert__content">
              This is the only time you will see these keys. Copy them now and
              store them securely.
            </div>
          </div>
        </div>

        <div class="key-display-card">
          <div class="key-display-card__header">
            API Key ID (TELEMETRYFLOW_API_KEY_ID)
          </div>
          <div class="key-display-card__content">
            <code class="key-display-card__value">{{
              createdKeys!.rawApiKeyId
            }}</code>
            <NButton
              size="small"
              quaternary
              @click="handleCopyKey(createdKeys!.rawApiKeyId, 'API Key ID')"
            >
              <template #icon>
                <Icon icon="carbon:copy" style="font-size: 11px" />
              </template>
            </NButton>
          </div>
        </div>

        <div class="key-display-card">
          <div class="key-display-card__header">
            API Key Secret (TELEMETRYFLOW_API_KEY_SECRET)
          </div>
          <div class="key-display-card__content">
            <code class="key-display-card__value">{{
              createdKeys!.rawApiKeySecret
            }}</code>
            <NButton
              size="small"
              quaternary
              @click="
                handleCopyKey(createdKeys!.rawApiKeySecret, 'API Key Secret')
              "
            >
              <template #icon>
                <Icon icon="carbon:copy" style="font-size: 11px" />
              </template>
            </NButton>
          </div>
        </div>

        <div class="key-display-card">
          <div class="key-display-card__header">
            Encryption Key (ENCRYPTION_KEY)
          </div>
          <div class="key-display-card__content">
            <code class="key-display-card__value">{{
              createdKeys!.rawEncryptKey
            }}</code>
            <NButton
              size="small"
              quaternary
              @click="
                handleCopyKey(createdKeys!.rawEncryptKey, 'Encryption Key')
              "
            >
              <template #icon>
                <Icon icon="carbon:copy" style="font-size: 11px" />
              </template>
            </NButton>
          </div>
        </div>

        <!-- Implementation Guide -->
        <NDivider style="margin: 20px 0 12px">
          <NText
            depth="3"
            style="
              font-size: 11px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            "
          >
            Quick Setup Guide
          </NText>
        </NDivider>

        <div class="guide-tabs-v">
          <div class="guide-tab-nav">
            <div
              v-for="t in guideTabs"
              :key="t.value"
              class="guide-tab-item"
              :class="{ active: implGuideTab === t.value }"
              @click="implGuideTab = t.value"
            >
              <Icon
                :icon="t.icon"
                class="guide-tab-icon"
                width="16"
                height="16"
              />
              <span>{{ t.label }}</span>
            </div>
          </div>
          <div class="guide-tab-body">
            <!-- Installation -->
            <template v-if="implGuideTab === 'install'">
              <div class="install-platform-row">
                <NText
                  depth="3"
                  style="
                    font-size: 12px;
                    white-space: nowrap;
                    line-height: 28px;
                  "
                >
                  Platform:
                </NText>
                <NSelect
                  v-model:value="implInstallPlatform"
                  :options="installPlatformOptions"
                  size="small"
                  style="width: 300px"
                />
              </div>
              <div class="install-block-header">TFO Agent v1.2.0</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            installCode(
                              implInstallPlatform,
                              'agent',
                              createdKeys!,
                            ),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    installCode(implInstallPlatform, 'agent', createdKeys!)
                  "
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            installCode(
                              implInstallPlatform,
                              'collector',
                              createdKeys!,
                            ),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    installCode(implInstallPlatform, 'collector', createdKeys!)
                  "
                />
              </div>
            </template>
            <!-- .env -->
            <template v-else-if="implGuideTab === 'env'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Add to <NText code style="font-size: 11px">.env</NText> — TFO
                Agent &amp; TFO Collector share the same key vars:
              </NText>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(createEnvCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createEnvCode" />
              </div>
            </template>
            <!-- Binary Run -->
            <template v-else-if="implGuideTab === 'binary'">
              <div class="install-platform-row">
                <NText
                  depth="3"
                  style="
                    font-size: 12px;
                    white-space: nowrap;
                    line-height: 28px;
                  "
                >
                  Platform:
                </NText>
                <NSelect
                  v-model:value="implInstallPlatform"
                  :options="installPlatformOptions"
                  size="small"
                  style="width: 300px"
                />
              </div>
              <div class="install-block-header">TFO Agent v1.2.0</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            binaryCode(
                              implInstallPlatform,
                              'agent',
                              createdKeys!,
                            ),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    binaryCode(implInstallPlatform, 'agent', createdKeys!)
                  "
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            binaryCode(
                              implInstallPlatform,
                              'collector',
                              createdKeys!,
                            ),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    binaryCode(implInstallPlatform, 'collector', createdKeys!)
                  "
                />
              </div>
            </template>
            <!-- Docker CLI -->
            <template v-else-if="implGuideTab === 'dockercli'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Run containers directly with
                <NText code style="font-size: 11px">docker run</NText>:
              </NText>
              <div class="install-block-header">TFO Agent v1.2.0</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(dockerCliCode('agent', createdKeys!)),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="dockerCliCode('agent', createdKeys!)"
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(dockerCliCode('collector', createdKeys!)),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="dockerCliCode('collector', createdKeys!)"
                />
              </div>
            </template>
            <!-- docker-compose -->
            <template v-else-if="implGuideTab === 'docker'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Add to your
                <NText code style="font-size: 11px">docker-compose.yml</NText>:
              </NText>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(createDockerCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createDockerCode" />
              </div>
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin: 10px 0 6px"
              >
                Or run directly with
                <NText code style="font-size: 11px">docker run</NText>:
              </NText>
              <div class="install-block-header">
                TFO Agent v{{ TFO_AGENT_VERSION }}
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(dockerCliCode('agent', createdKeys!)),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="dockerCliCode('agent', createdKeys!)"
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v{{ TFO_COLLECTOR_VERSION }}
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(dockerCliCode('collector', createdKeys!)),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="dockerCliCode('collector', createdKeys!)"
                />
              </div>
            </template>
            <!-- Kubernetes -->
            <template v-else-if="implGuideTab === 'k8s'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Create a <NText code style="font-size: 11px">Secret</NText> then
                reference with
                <NText code style="font-size: 11px">envFrom</NText> in your
                Deployment:
              </NText>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(createK8sCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createK8sCode" />
              </div>
            </template>
            <!-- Kubernetes Manifest -->
            <template v-else-if="implGuideTab === 'k8s-manifest'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Full manifest — Secret + Agent + Collector Deployments:
              </NText>
              <div class="install-block-header">
                manifest/tfo-deployment.yaml
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(rawOf(createK8sManifestCode))
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createK8sManifestCode" />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                kubectl apply
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(createK8sApplyCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createK8sApplyCode" />
              </div>
            </template>
            <!-- Helm -->
            <template v-else-if="implGuideTab === 'helm'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Install via Helm — credentials passed as
                <NText code style="font-size: 11px">--set</NText> flags or in
                <NText code style="font-size: 11px">values.yaml</NText>:
              </NText>
              <!-- Helm repo setup -->
              <div class="install-block-header">Add Helm Repo</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(createHelmRepoCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createHelmRepoCode" />
              </div>
              <!-- TFO Agent -->
              <div class="install-block-header" style="margin-top: 10px">
                TFO Agent v1.2.0
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(createHelmAgentCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createHelmAgentCode" />
              </div>
              <!-- TFO Collector -->
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(rawOf(createHelmCollectorCode))
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="createHelmCollectorCode"
                />
              </div>
              <!-- values.yaml -->
              <div class="install-block-header" style="margin-top: 10px">
                values.yaml
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(createHelmValuesCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="createHelmValuesCode" />
              </div>
            </template>
          </div>
        </div>

        <NDivider style="margin: 20px 0 12px" />
        <NSpace justify="end">
          <NButton type="primary" @click="closeCreateModal">
            I've Saved My Keys
          </NButton>
        </NSpace>
      </div>
    </NModal>

    <!-- Edit Modal -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      :style="{ maxWidth: '860px', width: '95vw', maxHeight: '950px' }"
      :content-style="{
        overflowY: 'auto',
        maxHeight: 'calc(950px - 116px)',
        padding: '20px 24px',
      }"
      :segmented="{ footer: 'soft' }"
    >
      <template #header>
        <div class="modal-header">
          <Icon icon="carbon:edit" class="modal-header-icon" />
          <div class="modal-header-text">
            <span class="modal-header-title">Edit API Key</span>
            <span v-if="editingKey" class="modal-header-subtitle">{{
              editingKey.name
            }}</span>
          </div>
        </div>
      </template>

      <div class="apikey-form-content">
        <!-- Left Side: Vertical Tabs -->
        <div class="form-tabs">
          <div
            v-for="tab in formTabs"
            :key="tab.value"
            class="form-tab-item"
            :class="{ active: activeEditTab === tab.value }"
            @click="activeEditTab = tab.value"
          >
            <Icon :icon="tab.icon" class="tab-icon" />
            <span class="tab-label">{{ tab.label }}</span>
          </div>
          <div class="tab-description">
            <p>{{ tabDescriptions[activeEditTab] }}</p>
          </div>
        </div>

        <!-- Right Side: Form Content -->
        <div class="form-content">
          <div class="form-box">
            <NForm ref="editFormRef" :model="editForm" label-placement="top">
              <!-- General Tab -->
              <template v-if="activeEditTab === 'general'">
                <NFormItem label="Name" path="name">
                  <NInput
                    v-model:value="editForm.name"
                    placeholder="My API Key"
                  />
                </NFormItem>

                <NFormItem label="Description" path="description">
                  <NInput
                    v-model:value="editForm.description"
                    type="textarea"
                    placeholder="Optional description"
                    :autosize="{ minRows: 2, maxRows: 4 }"
                  />
                </NFormItem>

                <NFormItem label="Rate Limit" path="rateLimit">
                  <NInputNumber
                    v-model:value="editForm.rateLimit"
                    :min="1"
                    :max="100000"
                    style="width: 200px"
                  >
                    <template #suffix>req/min</template>
                  </NInputNumber>
                </NFormItem>
              </template>

              <!-- Permissions Tab -->
              <template v-if="activeEditTab === 'permissions'">
                <p class="section-hint">
                  Select the permissions this API key should have
                </p>
                <NCheckboxGroup v-model:value="editForm.permissions">
                  <div class="checkbox-list">
                    <NCheckbox
                      v-for="perm in API_KEY_PERMISSIONS"
                      :key="perm.value"
                      :value="perm.value"
                      class="checkbox-item"
                    >
                      <div class="checkbox-content">
                        <span class="checkbox-label">{{ perm.label }}</span>
                        <code class="checkbox-code">{{ perm.value }}</code>
                      </div>
                    </NCheckbox>
                  </div>
                </NCheckboxGroup>
              </template>

              <!-- Scopes Tab -->
              <template v-if="activeEditTab === 'scopes'">
                <p class="section-hint">
                  Define which data domains this API key can access
                </p>
                <NCheckboxGroup v-model:value="editForm.scopes">
                  <div class="checkbox-list">
                    <NCheckbox
                      v-for="scope in API_KEY_SCOPES"
                      :key="scope.value"
                      :value="scope.value"
                      class="checkbox-item"
                    >
                      <div class="checkbox-content">
                        <span class="checkbox-label">{{ scope.label }}</span>
                        <code class="checkbox-code">{{ scope.value }}</code>
                      </div>
                    </NCheckbox>
                  </div>
                </NCheckboxGroup>
              </template>
            </NForm>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <NButton type="primary" ghost @click="showEditModal = false">
            <template #icon>
              <Icon icon="carbon:close" />
            </template>
            Cancel
          </NButton>
          <NButton type="primary" :loading="editLoading" @click="handleEdit">
            <template #icon>
              <Icon icon="carbon:save" />
            </template>
            Save Changes
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Rotated Key Modal -->
    <NModal
      v-model:show="showRotatedKeyModal"
      preset="card"
      title="API Keys Rotated"
      :style="{ maxWidth: '860px', width: '95vw', maxHeight: '950px' }"
      :content-style="{
        overflowY: 'auto',
        maxHeight: 'calc(950px - 116px)',
        padding: '20px 24px',
      }"
      :mask-closable="false"
      :closable="false"
    >
      <div class="rotate-keys-alert">
        <Icon icon="carbon:warning-filled" class="rotate-keys-alert__icon" />
        <div class="rotate-keys-alert__body">
          <div class="rotate-keys-alert__title">Save Your New API Keys</div>
          <div class="rotate-keys-alert__content">
            The old keys have been invalidated. Copy these new keys and update
            your applications.
          </div>
        </div>
      </div>

      <template v-if="rotatedKeys">
        <div class="key-display-card">
          <div class="key-display-card__header">
            API Key ID (TELEMETRYFLOW_API_KEY_ID)
          </div>
          <div class="key-display-card__content">
            <code class="key-display-card__value">{{
              rotatedKeys.apiKeyId
            }}</code>
            <NButton
              size="small"
              quaternary
              @click="handleCopyKey(rotatedKeys.apiKeyId, 'API Key ID')"
            >
              <template #icon>
                <Icon icon="carbon:copy" style="font-size: 11px" />
              </template>
            </NButton>
          </div>
        </div>

        <div class="key-display-card">
          <div class="key-display-card__header">
            API Key Secret (TELEMETRYFLOW_API_KEY_SECRET)
          </div>
          <div class="key-display-card__content">
            <code class="key-display-card__value">{{
              rotatedKeys.rawApiKeySecret
            }}</code>
            <NButton
              size="small"
              quaternary
              @click="
                handleCopyKey(rotatedKeys.rawApiKeySecret, 'API Key Secret')
              "
            >
              <template #icon>
                <Icon icon="carbon:copy" style="font-size: 11px" />
              </template>
            </NButton>
          </div>
        </div>

        <div class="key-display-card">
          <div class="key-display-card__header">
            Encryption Key (ENCRYPTION_KEY)
          </div>
          <div class="key-display-card__content">
            <code class="key-display-card__value">{{
              rotatedKeys.rawEncryptKey
            }}</code>
            <NButton
              size="small"
              quaternary
              @click="
                handleCopyKey(rotatedKeys.rawEncryptKey, 'Encryption Key')
              "
            >
              <template #icon>
                <Icon icon="carbon:copy" style="font-size: 11px" />
              </template>
            </NButton>
          </div>
        </div>
      </template>

      <!-- Implementation Guide (Rotation) -->
      <template v-if="rotatedKeys">
        <NDivider style="margin: 10px 0 8px">
          <NText
            depth="3"
            style="
              font-size: 10px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            "
          >
            Update Your Configuration
          </NText>
        </NDivider>

        <div class="guide-tabs-v">
          <div class="guide-tab-nav">
            <div
              v-for="t in rotateTabs"
              :key="t.value"
              class="guide-tab-item"
              :class="{ active: implGuideTab === t.value }"
              @click="implGuideTab = t.value"
            >
              <Icon
                :icon="t.icon"
                class="guide-tab-icon"
                width="16"
                height="16"
              />
              <span>{{ t.label }}</span>
            </div>
          </div>
          <div class="guide-tab-body">
            <!-- Installation -->
            <template v-if="implGuideTab === 'install'">
              <div class="install-platform-row">
                <NText
                  depth="3"
                  style="
                    font-size: 12px;
                    white-space: nowrap;
                    line-height: 28px;
                  "
                >
                  Platform:
                </NText>
                <NSelect
                  v-model:value="implInstallPlatform"
                  :options="installPlatformOptions"
                  size="small"
                  style="width: 300px"
                />
              </div>
              <div class="install-block-header">TFO Agent v1.2.0</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            installCode(implInstallPlatform, 'agent', {
                              rawApiKeyId: rotatedKeys.apiKeyId,
                              rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    installCode(implInstallPlatform, 'agent', {
                      rawApiKeyId: rotatedKeys.apiKeyId,
                      rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys.rawEncryptKey,
                    })
                  "
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            installCode(implInstallPlatform, 'collector', {
                              rawApiKeyId: rotatedKeys.apiKeyId,
                              rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    installCode(implInstallPlatform, 'collector', {
                      rawApiKeyId: rotatedKeys.apiKeyId,
                      rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys.rawEncryptKey,
                    })
                  "
                />
              </div>
            </template>
            <!-- .env -->
            <template v-else-if="implGuideTab === 'env'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Key ID unchanged — update Secret &amp; Encryption Key in
                <NText code style="font-size: 11px">.env</NText>:
              </NText>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(rotateEnvCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="rotateEnvCode" />
              </div>
            </template>
            <!-- Binary Run -->
            <template v-else-if="implGuideTab === 'binary'">
              <div class="install-platform-row">
                <NText
                  depth="3"
                  style="
                    font-size: 12px;
                    white-space: nowrap;
                    line-height: 28px;
                  "
                >
                  Platform:
                </NText>
                <NSelect
                  v-model:value="implInstallPlatform"
                  :options="installPlatformOptions"
                  size="small"
                  style="width: 300px"
                />
              </div>
              <div class="install-block-header">TFO Agent v1.2.0</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            binaryCode(implInstallPlatform, 'agent', {
                              rawApiKeyId: rotatedKeys.apiKeyId,
                              rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    binaryCode(implInstallPlatform, 'agent', {
                      rawApiKeyId: rotatedKeys.apiKeyId,
                      rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys.rawEncryptKey,
                    })
                  "
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            binaryCode(implInstallPlatform, 'collector', {
                              rawApiKeyId: rotatedKeys.apiKeyId,
                              rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    binaryCode(implInstallPlatform, 'collector', {
                      rawApiKeyId: rotatedKeys.apiKeyId,
                      rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys.rawEncryptKey,
                    })
                  "
                />
              </div>
            </template>
            <!-- Docker CLI -->
            <template v-else-if="implGuideTab === 'dockercli'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Run containers directly with
                <NText code style="font-size: 11px">docker run</NText>:
              </NText>
              <div class="install-block-header">TFO Agent v1.2.0</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            dockerCliCode('agent', {
                              rawApiKeyId: rotatedKeys.apiKeyId,
                              rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    dockerCliCode('agent', {
                      rawApiKeyId: rotatedKeys.apiKeyId,
                      rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys.rawEncryptKey,
                    })
                  "
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            dockerCliCode('collector', {
                              rawApiKeyId: rotatedKeys.apiKeyId,
                              rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    dockerCliCode('collector', {
                      rawApiKeyId: rotatedKeys.apiKeyId,
                      rawApiKeySecret: rotatedKeys.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys.rawEncryptKey,
                    })
                  "
                />
              </div>
            </template>
            <!-- docker-compose -->
            <template v-else-if="implGuideTab === 'docker'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Update environment values in
                <NText code style="font-size: 11px">docker-compose.yml</NText>:
              </NText>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(rotateDockerCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="rotateDockerCode" />
              </div>
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin: 10px 0 6px"
              >
                Or run directly with
                <NText code style="font-size: 11px">docker run</NText>:
              </NText>
              <div class="install-block-header">
                TFO Agent v{{ TFO_AGENT_VERSION }}
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            dockerCliCode('agent', {
                              rawApiKeyId: rotatedKeys!.apiKeyId,
                              rawApiKeySecret: rotatedKeys!.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys!.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    dockerCliCode('agent', {
                      rawApiKeyId: rotatedKeys!.apiKeyId,
                      rawApiKeySecret: rotatedKeys!.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys!.rawEncryptKey,
                    })
                  "
                />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v{{ TFO_COLLECTOR_VERSION }}
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(
                          rawOf(
                            dockerCliCode('collector', {
                              rawApiKeyId: rotatedKeys!.apiKeyId,
                              rawApiKeySecret: rotatedKeys!.rawApiKeySecret,
                              rawEncryptKey: rotatedKeys!.rawEncryptKey,
                            }),
                          ),
                        )
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="
                    dockerCliCode('collector', {
                      rawApiKeyId: rotatedKeys!.apiKeyId,
                      rawApiKeySecret: rotatedKeys!.rawApiKeySecret,
                      rawEncryptKey: rotatedKeys!.rawEncryptKey,
                    })
                  "
                />
              </div>
            </template>
            <!-- Kubernetes -->
            <template v-else-if="implGuideTab === 'k8s'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Patch Secret
                <NText code style="font-size: 11px">tfo-credentials</NText> then
                restart pods:
              </NText>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(rotateK8sCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="rotateK8sCode" />
              </div>
            </template>
            <!-- Kubernetes Manifest -->
            <template v-else-if="implGuideTab === 'k8s-manifest'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Update Secret manifest with rotated credentials:
              </NText>
              <div class="install-block-header">
                manifest/tfo-credentials.yaml
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(rawOf(rotateK8sManifestCode))
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="rotateK8sManifestCode" />
              </div>
              <div class="install-block-header" style="margin-top: 10px">
                kubectl apply &amp; restart
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(rotateK8sApplyCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="rotateK8sApplyCode" />
              </div>
            </template>
            <!-- Helm -->
            <template v-else-if="implGuideTab === 'helm'">
              <NText
                depth="3"
                style="font-size: 12px; display: block; margin-bottom: 6px"
              >
                Upgrade with rotated credentials using
                <NText code style="font-size: 11px">--reuse-values</NText>:
              </NText>
              <!-- TFO Agent -->
              <div class="install-block-header">TFO Agent v1.2.0</div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(rotateHelmAgentCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="rotateHelmAgentCode" />
              </div>
              <!-- TFO Collector -->
              <div class="install-block-header" style="margin-top: 10px">
                TFO Collector v1.2.1
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="
                        copyToClipboard(rawOf(rotateHelmCollectorCode))
                      "
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div
                  class="guide-code-block"
                  v-html="rotateHelmCollectorCode"
                />
              </div>
              <!-- values.yaml -->
              <div class="install-block-header" style="margin-top: 10px">
                values.yaml
              </div>
              <div class="gcb-outer">
                <NTooltip placement="top-end">
                  <template #trigger>
                    <NButton
                      class="gcb-copy-btn"
                      size="tiny"
                      quaternary
                      @click.stop="copyToClipboard(rawOf(rotateHelmValuesCode))"
                    >
                      <template #icon><Icon icon="carbon:copy" /></template>
                    </NButton>
                  </template>
                  Copy
                </NTooltip>
                <div class="guide-code-block" v-html="rotateHelmValuesCode" />
              </div>
            </template>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="tfo-modal-footer">
          <NButton
            type="primary"
            @click="
              showRotatedKeyModal = false;
              rotatedKeys = null;
            "
          >
            I've Saved My Keys
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Detail Panel -->
    <ApiKeyDetailPanel
      v-model:show="showDetailPanel"
      :api-key="selectedDetailApiKey"
      :organizations="organizations"
      :workspaces="workspaces"
      :tenants="tenants"
      :regions="regions"
      @edit="handleDetailEdit"
      @rotate="handleDetailRotate"
      @activate="handleDetailActivate"
      @deactivate="handleDetailDeactivate"
      @revoke="handleDetailRevoke"
    />

    <!-- Credentials Modal (focused, ephemeral) -->
    <ApiKeyCredentialsModal
      :visible="showCredentialsModal"
      :mode="credentialsModalMode"
      :credentials="pendingCredentials"
      @close="closeCredentialsModal"
    />
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

/* ==================== RESPONSIVE BREAKPOINTS ==================== */
/* Mobile: max-width 768px, Tablet: max-width 1024px */

.impl-code {
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 11.5px;
  line-height: 1.6;
  background: var(--code-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 14px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-color-2);
}

/* ==================== GUIDE VERTICAL TABS ==================== */
.guide-tabs-v {
  display: flex;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
  min-height: 200px;
}

.guide-tab-nav {
  display: flex;
  flex-direction: column;
  width: 128px;
  min-width: 128px;
  border-right: 1px solid var(--n-border-color);
  background: var(--n-action-color);
}

.guide-tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--n-text-color-3);
  border-bottom: 1px solid var(--n-border-color);
  transition: all 0.15s ease;
  user-select: none;

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: rgba(99, 102, 241, 0.06);
    color: var(--n-text-color);
  }
  &.active {
    background: rgba(99, 102, 241, 0.12);
    color: var(--n-primary-color);
    border-left: 3px solid var(--n-primary-color);
    padding-left: 9px;
  }

  .guide-tab-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    // Force the inner SVG to fill the fixed box regardless of native viewBox
    svg {
      width: 16px !important;
      height: 16px !important;
    }
  }
}

.guide-tab-body {
  flex: 1;
  min-width: 0;
  padding: 8px;
  overflow: visible; // scroll is owned by .guide-code-block, not this container
}

/* guide-code-block fully defined in non-scoped block — no overrides here */

.gcb-outer {
  position: relative;
  margin-bottom: 8px;

  .gcb-copy-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .gcb-copy-btn {
    opacity: 1;
  }
}

.install-platform-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.install-block-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  padding: 4px 6px;
  background: var(--n-action-color);
  border-left: 3px solid var(--n-primary-color);
  border-radius: 0 4px 4px 0;
}

.api-keys-view {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.section {
  @include k8s-theme-vars;
  background: var(--card-color);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--k8s-border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--k8s-border-color);
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 1rem;

  .section-icon {
    font-size: 20px;
    color: var(--primary-color);
  }
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .search-input {
    width: 200px;
  }
}

.filters-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 24px;
}

.key-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  // Name: single line with ellipsis
  > *:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // Description: wrap freely
  > *:not(:first-child) {
    white-space: normal;
    word-break: break-word;
    line-height: 1.4;
    overflow: visible;
  }
}

// Grid view styles
.grid-content {
  padding: 20px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1025px) and (max-width: 1440px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1441px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.dashboard-card {
  padding: 20px;
  background: var(--n-card-color);
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: var(--n-primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 10px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  :deep(svg) {
    width: 20px;
    height: 20px;
  }

  &.apikey-icon {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;

    :deep(svg) {
      color: white;
      fill: currentColor;
    }
  }
}

.card-content {
  min-height: 72px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--n-text-color);
  line-height: 1.4;
}

.card-description {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.625rem;
  line-height: 1.5;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  margin-bottom: 12px;
}

.usage-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.rate-limit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--n-text-color-3);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

// Graph view styles
.graph-content {
  padding: 16px 20px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

// Table content
.table-content {
  padding: 0;

  :deep(.n-data-table) {
    --n-th-color: transparent;
    --n-td-color: transparent;
    --n-th-text-color: var(--text-color-3);
    --n-border-color: var(--border-color);
  }

  :deep(.n-data-table-th) {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 12px 16px;
  }

  :deep(.n-data-table-td) {
    padding: 12px 16px;
    white-space: normal;
  }
}

/* ==================== TABLET STYLES (max-width: 1024px) ==================== */
@media (max-width: 1024px) {
  .api-keys-view {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .title-icon {
    font-size: 24px;
  }

  /* Stat cards handled by .stats-grid responsive styles */
}

/* ==================== MOBILE STYLES (max-width: 768px) ==================== */
@media (max-width: 768px) {
  .api-keys-view {
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

  .filters-card {
    margin-bottom: 12px;
  }

  /* Filter card responsive layout */
  .filters-card :deep(.n-space) {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }

  .filters-card :deep(.n-space > .n-space) {
    flex-wrap: wrap !important;
    gap: 8px !important;
  }

  .filters-card :deep(.n-input),
  .filters-card :deep(.n-select) {
    width: 100% !important;
    min-width: unset !important;
  }

  /* Total count text centered */
  .filters-card :deep(.n-text) {
    text-align: center;
    width: 100%;
  }

  /* Table card adjustments */
  .table-card :deep(.n-data-table-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-card :deep(.n-data-table-base-table) {
    min-width: 1000px;
  }
}

/* ==================== SMALL MOBILE (max-width: 480px) ==================== */
@media (max-width: 480px) {
  .api-keys-view {
    padding: 12px 8px;
  }

  .page-title {
    font-size: 18px;
  }

  .title-icon {
    font-size: 20px;
  }

  /* Stat cards handled by .stats-grid responsive styles */
}

/* ==================== VERTICAL TAB FORM LAYOUT ==================== */
.apikey-form-content {
  display: flex;
  gap: 16px;
  max-height: calc(60vh - 80px);
  overflow: hidden;
}

.form-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  max-width: 180px;
  border-right: 1px solid var(--n-border-color);
  padding-right: 16px;
}

.form-tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-3);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--primary-color);

    .tab-icon {
      color: var(--primary-color);
    }
  }

  .tab-icon {
    font-size: 18px;
    transition: color 0.2s ease;
  }

  .tab-label {
    white-space: nowrap;
  }
}

.tab-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);

  p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-color-3);
    line-height: 1.5;
  }
}

.form-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .form-box {
    min-width: 300px;
    background: var(--n-action-color);
    border: 1px solid var(--n-border-color);
    border-radius: 8px;
    padding: 16px;
  }

  :deep(.n-form-item) {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.n-form-item-label) {
    font-weight: 500;
    font-size: 13px;
    margin-bottom: 4px;
  }
}

.section-hint {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: var(--text-color-3);
}

.checkbox-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (max-width: 768px) {
  .checkbox-list {
    grid-template-columns: 1fr;
  }
}

.checkbox-item {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--n-color);
  border: 1px solid rgba(100, 116, 139, 0.3);
  transition: all 0.15s ease;

  :root.dark & {
    border-color: rgba(148, 163, 184, 0.25);
  }

  &:hover {
    background: rgba(99, 102, 241, 0.04);
    border-color: rgba(99, 102, 241, 0.3);
  }
}

.checkbox-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.checkbox-code {
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
  font-size: 0.75rem;
  color: var(--text-color-3);
  background: transparent;
  padding: 0;
}

/* ==================== MODAL HEADER & FOOTER ==================== */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-icon {
  font-size: 22px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.modal-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-header-title {
  font-size: 16px;
  font-weight: 600;
}

.modal-header-subtitle {
  font-size: 12px;
  color: var(--text-color-3);
  font-weight: 400;
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

/* ==================== MODAL RESPONSIVE STYLES ==================== */
:deep(.n-modal) {
  max-width: 95vw !important;
  margin: 16px auto;
}

@media (max-width: 768px) {
  .apikey-form-content {
    flex-direction: column;
    max-height: calc(70vh - 80px);
  }

  .form-tabs {
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 100%;
    min-width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--n-border-color);
    padding-right: 0;
    padding-bottom: 12px;
    gap: 8px;
  }

  .form-tab-item {
    padding: 8px 12px;
    flex: 1;
    justify-content: center;
    min-width: calc(33% - 6px);

    .tab-label {
      font-size: 12px;
    }

    .tab-icon {
      font-size: 16px;
    }
  }

  .tab-description {
    display: none;
  }

  .form-content {
    .form-box {
      padding: 12px;
    }
  }

  .modal-footer {
    flex-direction: column-reverse;

    :deep(.n-button) {
      width: 100%;
    }
  }

  :deep(.n-modal .n-form) {
    max-width: 100%;
  }

  /* Input number responsive */
  :deep(.n-modal .n-input-number) {
    width: 100% !important;
  }

  /* Key display card */
  :deep(.n-modal .n-card) {
    padding: 12px !important;
  }

  :deep(.n-modal .n-card .n-text[code]) {
    font-size: 12px !important;
    word-break: break-all;
  }
}
</style>

<style lang="scss">
@import "@/styles/tfo-line-number.scss";

.n-modal.n-card {
  .n-card__footer {
    padding-top: 0 !important;
  }
}

.rotate-keys-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  margin-bottom: 10px;
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.4);
  border-radius: 4px;

  &__icon {
    flex-shrink: 0;
    font-size: 16px;
    color: #f59e0b;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 11px;
    font-weight: 600;
    color: var(--n-text-color);
    line-height: 1.4;
  }

  &__content {
    font-size: 11px;
    color: var(--n-text-color-2);
    line-height: 1.4;
  }
}

.key-display-card {
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;

  &__header {
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--n-text-color);
    background: var(--n-color-modal);
    border-bottom: 1px solid var(--n-border-color);
    line-height: 1.4;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px 5px 12px;
    background: var(--n-color-embedded);
  }

  &__value {
    flex: 1;
    font-family:
      "SF Mono", Monaco, "Cascadia Code", Consolas, "Courier New", monospace;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
    word-break: break-all;
    color: #059669;
    background: none;
    border: none;
    padding: 0;

    :root.dark & {
      color: #34d399;
    }
  }
}

// ============================================================
// Guide Code Block — single-scroll container with sticky gutter
// Applied to v-html content so MUST be in non-scoped block
// ============================================================

.guide-code-block {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow-x: auto; // horizontal scroll — code wider than container
  overflow-y: auto; // vertical scroll — code taller than max-height
  max-height: 280px;
  font-family:
    "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New",
    monospace;
  font-size: 11px;
  line-height: 18px;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.1);
  }

  // Scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.35);
    border-radius: 4px;

    &:hover {
      background: rgba(100, 116, 139, 0.6);
    }
  }
}

.gcb-wrap {
  display: flex;
  min-width: max-content; // prevents flex from compressing content horizontally
  min-height: 100%; // fills scroll container height
}

.gcb-gutter {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  background: #f1f5f9;
  border-right: 1px solid #e2e8f0;
  user-select: none;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 1;

  :root.dark & {
    background: #182032;
    border-right-color: rgba(255, 255, 255, 0.1);
  }

  span {
    display: block;
    min-width: 32px;
    padding: 0 8px 0 6px;
    text-align: right;
    font-size: 10px;
    line-height: 18px;
    height: 18px;
    color: #94a3b8;
    white-space: nowrap;
  }
}

.gcb-code {
  flex: 1;
  margin: 0;
  padding: 10px 16px;
  background: #f8fafc;
  white-space: pre; // NO wrapping — horizontal scroll handled by parent
  overflow: visible;
  font-family:
    "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New",
    monospace;
  font-size: 11px;
  line-height: 18px;
  color: #334155;

  :root.dark & {
    background: #1e293b;
    color: #cbd5e1;
  }
}

// Bash syntax highlighting
.hl-comment {
  color: #94a3b8;
  font-style: italic;
}

.hl-keyword {
  color: #7c3aed;
  font-weight: 600;
}

.hl-flag {
  color: #0369a1;
}

.hl-string {
  color: #15803d;
}

.hl-envkey {
  color: #0369a1;
  font-weight: 500;
}

// YAML syntax highlighting
.hl-yamlkey {
  color: #0369a1;
  font-weight: 500;
}

.hl-yamldoc {
  color: #94a3b8;
  font-style: italic;
}

// Dark mode overrides
:root.dark {
  .hl-comment {
    color: #64748b;
  }

  .hl-keyword {
    color: #c4b5fd;
  }

  .hl-flag {
    color: #7dd3fc;
  }

  .hl-string {
    color: #86efac;
  }

  .hl-envkey {
    color: #7dd3fc;
  }

  .hl-yamlkey {
    color: #7dd3fc;
  }

  .hl-yamldoc {
    color: #475569;
  }
}
</style>
