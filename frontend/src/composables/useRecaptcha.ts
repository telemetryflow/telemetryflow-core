/**
 * reCAPTCHA v3 Composable
 * Dynamically loads Google reCAPTCHA script and provides token generation.
 * No external npm package required — uses the global grecaptcha API directly.
 */

import { ref } from "vue";

const RECAPTCHA_SITE_KEY = import.meta.env.TELEMETRYFLOW_RECAPTCHA_SITE_KEY || "";
const SCRIPT_ID = "recaptcha-v3-script";

/** Whether reCAPTCHA is configured (site key present) */
export const recaptchaEnabled = !!RECAPTCHA_SITE_KEY;

/** Track script loading state */
const scriptLoaded = ref(false);
const scriptLoading = ref(false);
let loadPromise: Promise<void> | null = null;

/**
 * Load the reCAPTCHA v3 script tag into the document head.
 * Idempotent — calling multiple times reuses the same promise.
 */
function loadRecaptchaScript(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve();

  scriptLoading.value = true;

  loadPromise = new Promise<void>((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      scriptLoaded.value = true;
      scriptLoading.value = false;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded.value = true;
      scriptLoading.value = false;
      resolve();
    };

    script.onerror = () => {
      scriptLoading.value = false;
      loadPromise = null;
      reject(new Error("Failed to load reCAPTCHA script"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Vue composable for reCAPTCHA v3 integration.
 *
 * Usage:
 * ```ts
 * const { executeRecaptcha, isReady, isEnabled, loadScript } = useRecaptcha();
 * onMounted(() => loadScript());
 * const token = await executeRecaptcha("subscribe");
 * ```
 */
export function useRecaptcha() {
  const isReady = ref(scriptLoaded.value);
  const isEnabled = recaptchaEnabled;

  async function loadScript(): Promise<void> {
    if (!isEnabled) return;
    await loadRecaptchaScript();
    isReady.value = true;
  }

  /**
   * Execute reCAPTCHA and return a token for the given action.
   * Returns empty string if reCAPTCHA is not configured (graceful degradation).
   */
  async function executeRecaptcha(action: string): Promise<string> {
    if (!isEnabled) return "";

    if (!scriptLoaded.value) {
      await loadRecaptchaScript();
    }

    return new Promise<string>((resolve, reject) => {
      const w = window as any;
      if (!w.grecaptcha) {
        reject(new Error("reCAPTCHA not available"));
        return;
      }

      w.grecaptcha.ready(() => {
        w.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then((token: string) => resolve(token))
          .catch((err: any) => reject(err));
      });
    });
  }

  return {
    isEnabled,
    isReady,
    loadScript,
    executeRecaptcha,
  };
}
