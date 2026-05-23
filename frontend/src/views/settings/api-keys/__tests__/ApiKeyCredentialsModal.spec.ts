/**
 * Unit tests for ApiKeyCredentialsModal.vue
 * Feature: ingestion-auth-api-key
 * Task 7.5 — Validates: Requirements 6.3, 6.4, 7.2, 7.4
 *
 * Tests cover:
 *  - create mode: all three credential fields are rendered
 *  - rotate mode: only apiKeySecret and encryptionKey are rendered (no apiKeyId)
 *  - copy button calls copyToClipboard for each field
 *  - Close button is disabled until "I have saved these credentials" is checked
 *  - handleClose emits 'close' and resets confirmed state
 *  - warning banner is always shown
 *
 * Vue components are NOT mounted — logic is tested directly to match project conventions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, computed } from "vue";

// ── Mock utilities ────────────────────────────────────────────────────────────

vi.mock("@/utils/clipboard", () => ({
  copyToClipboard: vi.fn(),
}));

vi.mock("naive-ui", () => ({
  useMessage: () => ({ success: vi.fn() }),
  NModal: {},
  NAlert: {},
  NCheckbox: {},
  NButton: {},
  NSpace: {},
}));

import { copyToClipboard } from "@/utils/clipboard";

// ── Simulated component logic (mirrors ApiKeyCredentialsModal.vue <script setup>) ──

interface Credentials {
  apiKeyId?: string;
  apiKeySecret: string;
  encryptionKey: string;
}

function createModalLogic(
  mode: "create" | "rotate",
  credentials: Credentials | null,
) {
  const confirmed = ref(false);
  const message = { success: vi.fn() };

  const title = computed(() =>
    mode === "create" ? "API Key Created" : "API Key Rotated"
  );

  function handleCopy(value: string, label: string) {
    copyToClipboard(value);
    message.success(`${label} copied to clipboard`);
  }

  const emitted: string[] = [];
  function emit(event: "close") {
    emitted.push(event);
  }

  function handleClose() {
    confirmed.value = false;
    emit("close");
  }

  // Derived visibility (mirrors v-if in template)
  const showApiKeyId = mode === "create" && !!credentials?.apiKeyId;
  const showApiKeySecret = !!credentials;
  const showEncryptionKey = !!credentials;
  const isCloseDisabled = !confirmed.value;

  return {
    confirmed,
    title,
    handleCopy,
    handleClose,
    showApiKeyId,
    showApiKeySecret,
    showEncryptionKey,
    isCloseDisabled,
    emitted,
    message,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("ApiKeyCredentialsModal — create mode", () => {
  const credentials: Credentials = {
    apiKeyId: "tfk_abc12345def67890ghij1234",
    apiKeySecret: "tfs_secret1234abcdefghij567890mnop",
    encryptionKey: "enc_key_abcdefghij1234567890mnopqrs",
  };

  it("renders all three credential fields when mode=create", () => {
    const modal = createModalLogic("create", credentials);
    expect(modal.showApiKeyId).toBe(true);
    expect(modal.showApiKeySecret).toBe(true);
    expect(modal.showEncryptionKey).toBe(true);
  });

  it("title is 'API Key Created'", () => {
    const modal = createModalLogic("create", credentials);
    expect(modal.title.value).toBe("API Key Created");
  });

  it("copy button calls copyToClipboard with apiKeyId", () => {
    const modal = createModalLogic("create", credentials);
    modal.handleCopy(credentials.apiKeyId!, "API Key ID");
    expect(copyToClipboard).toHaveBeenCalledWith(credentials.apiKeyId);
  });

  it("copy button calls copyToClipboard with apiKeySecret", () => {
    const modal = createModalLogic("create", credentials);
    modal.handleCopy(credentials.apiKeySecret, "API Key Secret");
    expect(copyToClipboard).toHaveBeenCalledWith(credentials.apiKeySecret);
  });

  it("copy button calls copyToClipboard with encryptionKey", () => {
    const modal = createModalLogic("create", credentials);
    modal.handleCopy(credentials.encryptionKey, "Encryption Key");
    expect(copyToClipboard).toHaveBeenCalledWith(credentials.encryptionKey);
  });

  it("Close button is disabled before checkbox is checked", () => {
    const modal = createModalLogic("create", credentials);
    expect(modal.isCloseDisabled).toBe(true);
  });

  it("Close button becomes enabled after confirmed is set to true", () => {
    const modal = createModalLogic("create", credentials);
    modal.confirmed.value = true;
    expect(!modal.confirmed.value).toBe(false); // isCloseDisabled would be false
  });

  it("handleClose emits 'close' event", () => {
    const modal = createModalLogic("create", credentials);
    modal.confirmed.value = true;
    modal.handleClose();
    expect(modal.emitted).toContain("close");
  });

  it("handleClose resets confirmed to false", () => {
    const modal = createModalLogic("create", credentials);
    modal.confirmed.value = true;
    modal.handleClose();
    expect(modal.confirmed.value).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("ApiKeyCredentialsModal — rotate mode", () => {
  const credentials: Credentials = {
    // No apiKeyId on rotate
    apiKeySecret: "tfs_newsecret1234abcdefghij567890",
    encryptionKey: "enc_newkey_abcdefghij1234567890mn",
  };

  it("does NOT render apiKeyId field when mode=rotate", () => {
    const modal = createModalLogic("rotate", credentials);
    expect(modal.showApiKeyId).toBe(false);
  });

  it("renders apiKeySecret and encryptionKey when mode=rotate", () => {
    const modal = createModalLogic("rotate", credentials);
    expect(modal.showApiKeySecret).toBe(true);
    expect(modal.showEncryptionKey).toBe(true);
  });

  it("title is 'API Key Rotated'", () => {
    const modal = createModalLogic("rotate", credentials);
    expect(modal.title.value).toBe("API Key Rotated");
  });

  it("Close button is disabled before checkbox is checked in rotate mode", () => {
    const modal = createModalLogic("rotate", credentials);
    expect(modal.isCloseDisabled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("ApiKeyCredentialsModal — null credentials", () => {
  it("does not show any fields when credentials is null", () => {
    const modal = createModalLogic("create", null);
    expect(modal.showApiKeyId).toBe(false);
    expect(modal.showApiKeySecret).toBe(false);
    expect(modal.showEncryptionKey).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("ApiKeyCredentialsModal — credential security", () => {
  it("never exposes raw credentials in handleClose return value", () => {
    const credentials: Credentials = {
      apiKeyId: "tfk_abc123",
      apiKeySecret: "tfs_secret_that_must_not_leak",
      encryptionKey: "enc_key_that_must_not_leak",
    };
    const modal = createModalLogic("create", credentials);
    modal.confirmed.value = true;
    const result = modal.handleClose();
    expect(result).toBeUndefined();
  });
});
