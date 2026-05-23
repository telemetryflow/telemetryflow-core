import { createPinia } from "pinia";

const pinia = createPinia();

export default pinia;

export { useAppStore } from "./app";
export { useAuthStore } from "./auth";
export { useLLMStore } from "./llm";
export { useDataMaskingStore } from "./data-masking";
export { useUptimeStore } from "./uptime";
export { useAlertsStore } from "./alerts";
