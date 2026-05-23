/**
 * White Label Configuration
 * Customize branding, logo, and copyright information
 */
import defaultLogoLight from "@/assets/tfo-logo-light.svg";
import defaultLogoDark from "@/assets/tfo-logo-dark.svg";
import defaultLogoIcon from "@/assets/favicon.svg";
import { rt } from "./runtime";

export interface WhiteLabelConfig {
  // Brand Information
  brandName: string;
  brandTagline: string;

  // Domain (used for placeholder URLs and example emails)
  domain: string;

  // GitHub/Source URL
  githubUrl: string;

  // Logo Configuration
  logo: {
    light: string; // Path to light theme logo
    dark: string; // Path to dark theme logo
    icon: string; // Path to icon/favicon
    width?: string; // Optional logo width
    height?: string; // Optional logo height
  };

  // Copyright & Footer
  copyright: {
    companyName: string;
    year: number | string; // Can be "2024" or "2020-2024"
    text?: string; // Custom copyright text (overrides default)
    showPoweredBy: boolean; // Show "Powered by <companyName>"
  };

  // Links
  links: {
    website?: string;
    documentation?: string;
    support?: string;
    privacy?: string;
    terms?: string;
  };

  // Theme Colors (optional - override default theme)
  theme?: {
    primaryColor?: string;
    accentColor?: string;
  };
}

// Default TelemetryFlow branding
const defaultConfig: WhiteLabelConfig = {
  brandName: "TelemetryFlow Observability",
  brandTagline: "Community Enterprise Observability Platform (CEOP)",
  domain: "telemetryflow.id",
  githubUrl: "https://github.com/telemetryflow/overview",

  logo: {
    light: defaultLogoLight,
    dark: defaultLogoDark,
    icon: defaultLogoIcon,
    width: "180px",
    height: "auto",
  },

  copyright: {
    companyName: "TelemetryFlow",
    year: "2024",
    showPoweredBy: false,
  },

  links: {
    website: "https://telemetryflow.id",
    documentation: "https://docs.telemetryflow.id",
    support: "https://support.telemetryflow.id",
  },
};

/**
 * Resolve logo path: use env var only if it's an external URL or absolute public path.
 * Source paths like "src/assets/..." won't work in production builds,
 * so fall back to the Vite-imported default.
 */
function resolveLogoPath(
  envValue: string | undefined,
  fallback: string,
): string {
  if (!envValue) return fallback;
  // External URLs or absolute public paths work in production
  if (envValue.startsWith("http") || envValue.startsWith("/assets/"))
    return envValue;
  // Source paths (e.g. "src/assets/...") only work in dev — use imported fallback
  return fallback;
}

// Load white label config from environment variables (runtime → build-time → defaults)
export const whiteLabelConfig: WhiteLabelConfig = {
  brandName: rt("TELEMETRYFLOW_BRAND_NAME", defaultConfig.brandName),
  brandTagline: rt("TELEMETRYFLOW_BRAND_TAGLINE", defaultConfig.brandTagline),
  domain: rt("TELEMETRYFLOW_DOMAIN", defaultConfig.domain),
  githubUrl: rt("TELEMETRYFLOW_GITHUB_URL", defaultConfig.githubUrl),

  logo: {
    light: resolveLogoPath(
      rt("TELEMETRYFLOW_LOGO_LIGHT"),
      defaultConfig.logo.light,
    ),
    dark: resolveLogoPath(
      rt("TELEMETRYFLOW_LOGO_DARK"),
      defaultConfig.logo.dark,
    ),
    icon: resolveLogoPath(
      rt("TELEMETRYFLOW_LOGO_ICON"),
      defaultConfig.logo.icon,
    ),
    width: rt("TELEMETRYFLOW_LOGO_WIDTH", defaultConfig.logo.width!),
    height: rt("TELEMETRYFLOW_LOGO_HEIGHT", defaultConfig.logo.height!),
  },

  copyright: {
    companyName: rt(
      "TELEMETRYFLOW_COPYRIGHT_COMPANY",
      defaultConfig.copyright.companyName,
    ),
    year: rt(
      "TELEMETRYFLOW_COPYRIGHT_YEAR",
      String(defaultConfig.copyright.year),
    ),
    text: rt("TELEMETRYFLOW_COPYRIGHT_TEXT"),
    showPoweredBy:
      rt("TELEMETRYFLOW_SHOW_POWERED_BY", "false") === "true" ||
      defaultConfig.copyright.showPoweredBy,
  },

  links: {
    website: rt("TELEMETRYFLOW_LINK_WEBSITE", defaultConfig.links.website!),
    documentation: rt(
      "TELEMETRYFLOW_LINK_DOCS",
      defaultConfig.links.documentation!,
    ),
    support: rt("TELEMETRYFLOW_LINK_SUPPORT", defaultConfig.links.support!),
    privacy: rt("TELEMETRYFLOW_LINK_PRIVACY"),
    terms: rt("TELEMETRYFLOW_LINK_TERMS"),
  },

  theme: {
    primaryColor: rt("TELEMETRYFLOW_THEME_PRIMARY_COLOR"),
    accentColor: rt("TELEMETRYFLOW_THEME_ACCENT_COLOR"),
  },
};

// Derived brand defaults for use across the app
export const brandDefaults = {
  get companyName() {
    return whiteLabelConfig.copyright.companyName;
  },
  get botName() {
    return `${whiteLabelConfig.copyright.companyName} Bot`;
  },
  get alertTitle() {
    return `${whiteLabelConfig.copyright.companyName} Alert`;
  },
  get poweredBy() {
    return `Powered by ${whiteLabelConfig.copyright.companyName}`;
  },
  get domain() {
    return whiteLabelConfig.domain;
  },
  get queryLanguageName() {
    return `${whiteLabelConfig.copyright.companyName} Query Language`;
  },
  get alertingLabel() {
    return `${whiteLabelConfig.copyright.companyName} Alerting`;
  },
  exampleEmail(prefix: string) {
    return `${prefix}@${whiteLabelConfig.domain}`;
  },
  exampleUrl(subdomain: string, path = "") {
    return `https://${subdomain}.${whiteLabelConfig.domain}${path}`;
  },
};

// Helper function to get copyright text
export function getCopyrightText(): string {
  const { copyright } = whiteLabelConfig;

  if (copyright.text) {
    return copyright.text;
  }

  const yearText =
    typeof copyright.year === "string" && copyright.year.includes("-")
      ? copyright.year
      : `${copyright.year}`;

  let text = `© ${yearText} ${copyright.companyName}. All rights reserved.`;

  if (copyright.showPoweredBy) {
    text += ` | Powered by ${copyright.companyName}`;
  }

  return text;
}

// Helper function to get logo based on theme
export function getLogo(isDark: boolean): string {
  return isDark ? whiteLabelConfig.logo.dark : whiteLabelConfig.logo.light;
}

export default whiteLabelConfig;
