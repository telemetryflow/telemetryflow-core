/**
 * Property 11: Frontend validation error display
 * Validates: Requirements 3.6, 11.4
 *
 * For any validation error response, the frontend should display errors
 * inline next to the corresponding form fields.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import fc from "fast-check";

// ─── Minimal stubs ────────────────────────────────────────────────────────────
const NInput = {
  name: "NInput",
  props: ["value", "disabled", "status", "ariaDescribedby"],
  emits: ["update:value", "input"],
  template: `<input :value="value" @input="$emit('update:value', $event.target.value)" />`,
};
const NButton = {
  name: "NButton",
  props: ["loading", "disabled"],
  emits: ["click"],
  template: `<button :disabled="disabled" @click="$emit('click')"><slot /></button>`,
};
const NAlert = {
  name: "NAlert",
  props: ["type"],
  template: `<div role="alert"><slot /><slot name="header" /></div>`,
};
const NCheckbox = {
  name: "NCheckbox",
  props: ["checked"],
  template: `<input type="checkbox" :checked="checked" />`,
};
const NSpin = { name: "NSpin", template: `<span />` };
const IconStub = { name: "Icon", props: ["icon"], template: `<span />` };

vi.mock("@/store", () => ({
  useAuthStore: () => ({
    isLoading: false,
    loginError: null,
    isMfaRequired: false,
    mfaSession: null,
    clearError: vi.fn(),
    login: vi.fn().mockResolvedValue(false),
  }),
  useAppStore: () => ({ isDarkMode: false }),
}));

vi.mock("@/config", () => ({
  config: { useMock: false },
  ssoConfig: {
    google: false,
    microsoft: false,
    apple: false,
    slack: false,
    cognito: false,
  },
  whiteLabelConfig: {
    brandName: "TelemetryFlow",
    brandTagline: "Observability Platform",
  },
  authInputOverrides: {},
}));

vi.mock("@/config/whitelabel", () => ({
  whiteLabelConfig: {
    brandName: "TelemetryFlow",
    brandTagline: "Observability Platform",
  },
  getLogo: () => "/logo.svg",
}));

vi.mock("@/api/auth", () => ({
  DEFAULT_USERS: {
    administrator: {
      email: "admin@test.com",
      password: "pass",
      tier: 2,
      description: "Admin",
    },
    demo: {
      email: "demo@test.com",
      password: "pass",
      tier: 5,
      description: "Demo",
    },
  },
}));

vi.mock("@/api/sso", () => ({ ssoApi: { initiateSSO: vi.fn() } }));
vi.mock("@/assets/favicon-dark.svg", () => ({ default: "/favicon.svg" }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}));

// ─── Helper: mount login view with injected field errors ──────────────────────
let _LoginView: any = null;

async function getLoginView() {
  if (!_LoginView) {
    const mod = await import("../login.vue");
    _LoginView = mod.default;
  }
  return _LoginView;
}

async function mountLoginWithErrors(errors: {
  identifier?: string;
  password?: string;
}) {
  const LoginView = await getLoginView();

  const wrapper = mount(LoginView, {
    global: {
      stubs: {
        "n-input": NInput,
        "n-button": NButton,
        "n-alert": NAlert,
        "n-checkbox": NCheckbox,
        "n-spin": NSpin,
        Icon: IconStub,
        RouterLink: { template: `<a><slot /></a>` },
      },
    },
  });

  // Inject field errors directly into the component's reactive state
  const vm = wrapper.vm as unknown as {
    fieldErrors: { identifier?: string; password?: string };
  };
  vm.fieldErrors = { ...errors };
  await wrapper.vm.$nextTick();

  return wrapper;
}

describe("Property 11: Frontend validation error display (login.vue)", () => {
  beforeEach(() => {
    _LoginView = null;
    setActivePinia(createPinia());
  });

  it("displays arbitrary identifier error strings inline with role=alert", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 120 })
          .filter((s) => s.trim().length > 0),
        async (errorMsg) => {
          const wrapper = await mountLoginWithErrors({ identifier: errorMsg });

          const errorEl = wrapper.find("#identifier-error");
          expect(errorEl.exists()).toBe(true);
          expect(errorEl.attributes("role")).toBe("alert");
          expect(errorEl.text().trim()).toContain(errorMsg.trim());
          wrapper.unmount();
        },
      ),
      { numRuns: 20 },
    );
  }, 60_000);

  it("displays arbitrary password error strings inline with role=alert", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 120 })
          .filter((s) => s.trim().length > 0),
        async (errorMsg) => {
          const wrapper = await mountLoginWithErrors({ password: errorMsg });

          const errorEl = wrapper.find("#password-error");
          expect(errorEl.exists()).toBe(true);
          expect(errorEl.attributes("role")).toBe("alert");
          expect(errorEl.text().trim()).toContain(errorMsg.trim());
          wrapper.unmount();
        },
      ),
      { numRuns: 20 },
    );
  }, 60_000);

  it("displays both identifier and password errors simultaneously", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifierError: fc
            .string({ minLength: 1, maxLength: 80 })
            .filter((s) => s.trim().length > 0),
          passwordError: fc
            .string({ minLength: 1, maxLength: 80 })
            .filter((s) => s.trim().length > 0),
        }),
        async ({ identifierError, passwordError }) => {
          const wrapper = await mountLoginWithErrors({
            identifier: identifierError,
            password: passwordError,
          });

          const idErr = wrapper.find("#identifier-error");
          const pwErr = wrapper.find("#password-error");

          expect(idErr.exists()).toBe(true);
          expect(pwErr.exists()).toBe(true);
          expect(idErr.text().trim()).toContain(identifierError.trim());
          expect(pwErr.text().trim()).toContain(passwordError.trim());
          wrapper.unmount();
        },
      ),
      { numRuns: 20 },
    );
  }, 60_000);

  it("renders no error elements when fieldErrors is empty", async () => {
    const wrapper = await mountLoginWithErrors({});

    expect(wrapper.find("#identifier-error").exists()).toBe(false);
    expect(wrapper.find("#password-error").exists()).toBe(false);
  });

  it("does not render error elements for empty string errors", async () => {
    const wrapper = await mountLoginWithErrors({
      identifier: "",
      password: "",
    });

    expect(wrapper.find("#identifier-error").exists()).toBe(false);
    expect(wrapper.find("#password-error").exists()).toBe(false);
  });
});
