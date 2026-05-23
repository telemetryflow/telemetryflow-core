/**
 * TFO-Viz Main Entry Point
 */

import { createApp } from "vue";
import pinia from "@/store";
import router from "@/router";
import { registerPermissionDirectives } from "@/directives";
import { config, whiteLabelConfig } from "@/config";
import App from "./App.vue";

// dayjs UTC + timezone plugin (global setup — must be before any dayjs usage)
import "@/plugins/dayjs";

// UnoCSS
import "virtual:uno.css";

// Global Kubernetes styles (CSS custom properties for theme switching)
import "@/styles/tfo-variables.scss";

// Global responsive styles for cards, tables, and headers
import "@/styles/responsive-global.scss";

// Global auth page styles (login, register, mfa, verify-email, etc.)
import "@/styles/tfo-auth.scss";

// Global line-numbered editor and JSON viewer styles
import "@/styles/tfo-line-number.scss";

// Global events section styles (for Kubernetes events and other event displays)
import "@/styles/tfo-events.scss";

// Global trace visualization styles (waterfall, flamegraph, node graph, service map, network map)
import "@/styles/tfo-trace-visualizations.scss";

// Global modal design system (header/footer dividers, vertical tab layout)
import "@/styles/tfo-modal.scss";

// Create app
const app = createApp(App);

// Install plugins
app.use(pinia);
app.use(router);

// Register custom directives
registerPermissionDirectives(app);

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error("[TFO-Viz Error]", err);
  console.error("Component:", vm);
  console.error("Info:", info);
};

// Mount app
app.mount("#app");

// Set page title and meta from whitelabel config
document.title = config.appTitle;
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) {
  metaDesc.setAttribute("content", `${whiteLabelConfig.brandName} - ${whiteLabelConfig.brandTagline}`);
}

// Log app info
console.log(
  `%c ${config.appCode} %c ${whiteLabelConfig.brandTagline} `,
  "background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;",
  "background: #1e293b; color: white; padding: 4px 8px; border-radius: 0 4px 4px 0;",
);
