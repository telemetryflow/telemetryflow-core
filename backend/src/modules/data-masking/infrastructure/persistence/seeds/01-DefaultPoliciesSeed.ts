/**
 * Data Masking Seed: Default Template Policies
 * Order: 01
 * mockOnly: true — demo/template data only
 *
 * Seeds 9 PII masking policies aligned with global compliance frameworks:
 *   1. Email & Phone Masking         — redact PII from log bodies
 *   2. Financial Data Protection     — hash credit card & SSN
 *   3. Secrets & Credentials         — redact tokens, API keys, AWS keys
 *   4. URL Credentials Scrubber      — strip embedded credentials from URLs
 *   5. GDPR – EU Personal Data       — IBAN, national IDs, DOB, passport (Art. 4, 9)
 *   6. HIPAA – Healthcare PII        — MRN, NPI, member IDs, DOB (45 CFR §164)
 *   7. PCI-DSS – Payment Card Data   — CVV, expiry, routing/account numbers (PCI-DSS v4)
 *   8. SOC 2 / ISO 27001 – SaaS Keys — GitHub, Slack, Stripe, Azure, GCP tokens
 *   9. CCPA – CA Consumer Privacy    — driver's license, VIN, biometrics (Cal. Civ. §1798)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

interface RuleTemplate {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  targetField: string;
  matchType: string;
  builtinPattern?: string;
  customPattern?: string;
  maskType: string;
  replacement?: string;
  truncateLength?: number;
}

interface PolicyTemplate {
  name: string;
  description: string;
  enabled: boolean;
  rules: RuleTemplate[];
}

// Rules use simple sequential IDs — they will be replaced by frontend UUIDs on edit
const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    name: "Email & Phone Masking",
    description:
      "Automatically redacts email addresses and phone numbers from log message bodies to prevent accidental PII exposure in log streams.",
    enabled: true,
    rules: [
      {
        id: "rule-email-01",
        name: "Redact email addresses",
        enabled: true,
        priority: 10,
        targetField: "body",
        matchType: "builtin",
        builtinPattern: "EMAIL",
        maskType: "REDACT",
        replacement: "[EMAIL]",
      },
      {
        id: "rule-phone-01",
        name: "Redact phone numbers",
        enabled: true,
        priority: 20,
        targetField: "body",
        matchType: "builtin",
        builtinPattern: "PHONE",
        maskType: "REDACT",
        replacement: "[PHONE]",
      },
    ],
  },
  {
    name: "Financial Data Protection",
    description:
      "Hashes credit card numbers and SSNs found in log bodies using SHA-256. Hashed values can still be correlated across events without exposing raw PII.",
    enabled: true,
    rules: [
      {
        id: "rule-cc-01",
        name: "Hash credit card numbers",
        enabled: true,
        priority: 10,
        targetField: "body",
        matchType: "builtin",
        builtinPattern: "CREDIT_CARD",
        maskType: "HASH",
      },
      {
        id: "rule-ssn-01",
        name: "Hash Social Security Numbers",
        enabled: true,
        priority: 20,
        targetField: "body",
        matchType: "builtin",
        builtinPattern: "SSN",
        maskType: "HASH",
      },
    ],
  },
  {
    name: "Secrets & Credentials Masking",
    description:
      "Redacts JWT tokens, generic API keys, AWS access keys, and PEM private key blocks from all telemetry fields to prevent secret leakage via observability pipelines.",
    enabled: true,
    rules: [
      {
        id: "rule-jwt-01",
        name: "Redact JWT tokens",
        enabled: true,
        priority: 10,
        targetField: "all",
        matchType: "builtin",
        builtinPattern: "JWT_TOKEN",
        maskType: "REDACT",
        replacement: "[JWT_REDACTED]",
      },
      {
        id: "rule-apikey-01",
        name: "Redact generic API keys",
        enabled: true,
        priority: 20,
        targetField: "all",
        matchType: "builtin",
        builtinPattern: "API_KEY_GENERIC",
        maskType: "REDACT",
        replacement: "[API_KEY]",
      },
      {
        id: "rule-aws-01",
        name: "Redact AWS access keys",
        enabled: true,
        priority: 30,
        targetField: "all",
        matchType: "builtin",
        builtinPattern: "AWS_ACCESS_KEY",
        maskType: "REDACT",
        replacement: "[AWS_KEY]",
      },
      {
        id: "rule-privkey-01",
        name: "Redact PEM private key material",
        enabled: true,
        priority: 40,
        targetField: "body",
        matchType: "builtin",
        builtinPattern: "PRIVATE_KEY",
        maskType: "REDACT",
        replacement: "[PRIVATE_KEY]",
      },
    ],
  },
  {
    name: "URL Credentials Scrubber",
    description:
      "Strips embedded credentials (user:password@host) from connection string URLs in resource attributes. Enable this policy when applications log database or service URLs.",
    enabled: false,
    rules: [
      {
        id: "rule-urlcreds-01",
        name: "Remove URL embedded credentials",
        enabled: true,
        priority: 10,
        targetField: "resource_attributes",
        matchType: "builtin",
        builtinPattern: "URL_CREDENTIALS",
        maskType: "REDACT",
        replacement: "[CREDS_REMOVED]",
      },
    ],
  },

  // ── GDPR – EU General Data Protection Regulation ──────────────────────────
  {
    name: "GDPR – EU Personal Data Protection",
    description:
      "Masks EU personal identifiers required under GDPR Art. 4 & 9: IBAN bank accounts, passport numbers, date of birth, SWIFT/BIC codes, and IP addresses (GDPR Recital 49). Enables data minimisation at ingestion time.",
    enabled: true,
    rules: [
      {
        id: "rule-gdpr-01",
        name: "Hash IBAN bank account numbers",
        description: "SHA-256 hash of International Bank Account Numbers (ISO 13616)",
        enabled: true,
        priority: 10,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}(?:[A-Z0-9]{0,16})",
        maskType: "HASH",
      },
      {
        id: "rule-gdpr-02",
        name: "Redact passport numbers",
        description: "Context-aware: passport keyword followed by 7–9 alphanumeric chars",
        enabled: true,
        priority: 20,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "(?:passport|pass[-_\\s]?(?:no|nr|num|number))\\s*[:\\-=]?\\s*[A-Z0-9]{7,9}",
        maskType: "REDACT",
        replacement: "[PASSPORT]",
      },
      {
        id: "rule-gdpr-03",
        name: "Redact date of birth",
        description:
          "Detects DOB context: dob:, date_of_birth:, birthdate: + common date formats",
        enabled: true,
        priority: 30,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "(?:dob|date[-_\\s]?of[-_\\s]?birth|birth[-_\\s]?date)\\s*[:\\-=]?\\s*(?:\\d{1,2}[/\\-.\\s]\\d{1,2}[/\\-.\\s]\\d{2,4}|\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2})",
        maskType: "REDACT",
        replacement: "[DOB]",
      },
      {
        id: "rule-gdpr-04",
        name: "Redact SWIFT/BIC codes",
        description: "8–11 char bank identifier codes per ISO 9362",
        enabled: true,
        priority: 40,
        targetField: "all",
        matchType: "regex",
        customPattern: "\\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\\b",
        maskType: "REDACT",
        replacement: "[BIC]",
      },
      {
        id: "rule-gdpr-05",
        name: "Anonymize IP addresses (GDPR Recital 49)",
        description: "IP addresses are personal data under GDPR — replaced at ingestion",
        enabled: true,
        priority: 50,
        targetField: "all",
        matchType: "builtin",
        builtinPattern: "IP_ADDRESS",
        maskType: "REPLACE",
        replacement: "[IP_ANONYMIZED]",
      },
    ],
  },

  // ── HIPAA – Health Insurance Portability and Accountability Act ───────────
  {
    name: "HIPAA – Healthcare Data Compliance",
    description:
      "Covers HIPAA Safe Harbor identifiers (45 CFR §164.514): Medical Record Numbers, National Provider Identifiers, health insurance member IDs, DEA numbers, and date of birth. Enable for healthcare workloads.",
    enabled: false,
    rules: [
      {
        id: "rule-hipaa-01",
        name: "Redact Medical Record Numbers (MRN)",
        enabled: true,
        priority: 10,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:MRN|medical[-_\\s]?record(?:[-_\\s]?(?:no|num|id|number))?)\\s*[:\\-=]?\\s*[A-Z0-9]{5,15}\\b",
        maskType: "REDACT",
        replacement: "[MRN]",
      },
      {
        id: "rule-hipaa-02",
        name: "Redact National Provider Identifiers (NPI)",
        description: "CMS-issued 10-digit unique US healthcare provider ID",
        enabled: true,
        priority: 20,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:NPI|national[-_\\s]?provider(?:[-_\\s]?(?:id|identifier|no|num))?)\\s*[:\\-=]?\\s*\\d{10}\\b",
        maskType: "REDACT",
        replacement: "[NPI]",
      },
      {
        id: "rule-hipaa-03",
        name: "Redact health insurance member IDs",
        enabled: true,
        priority: 30,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:member[-_\\s]?id|insurance[-_\\s]?(?:id|no|num)|policy[-_\\s]?(?:no|num|id))\\s*[:\\-=]?\\s*[A-Z0-9\\-]{8,15}\\b",
        maskType: "REDACT",
        replacement: "[MEMBER_ID]",
      },
      {
        id: "rule-hipaa-04",
        name: "Redact DEA registration numbers",
        description: "US DEA practitioner IDs — 2 letters + 7 digits",
        enabled: true,
        priority: 40,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:DEA(?:[-_\\s]?(?:no|num|number))?)\\s*[:\\-=]?\\s*[A-Z]{2}[0-9]{7}\\b",
        maskType: "REDACT",
        replacement: "[DEA]",
      },
      {
        id: "rule-hipaa-05",
        name: "Redact date of birth (PHI identifier #3)",
        enabled: true,
        priority: 50,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "(?:dob|date[-_\\s]?of[-_\\s]?birth|birth[-_\\s]?date|patient[-_\\s]?dob)\\s*[:\\-=]?\\s*(?:\\d{1,2}[/\\-.\\s]\\d{1,2}[/\\-.\\s]\\d{2,4}|\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2})",
        maskType: "REDACT",
        replacement: "[DOB]",
      },
    ],
  },

  // ── PCI-DSS v4.0 – Payment Card Industry Data Security Standard ───────────
  {
    name: "PCI-DSS – Payment Card Data Security",
    description:
      "Protects cardholder data (CHD) and sensitive authentication data (SAD) per PCI-DSS v4.0 Req. 3.3: CVV/CVC codes must never be stored after authorization. Also hashes ABA routing numbers and bank account numbers.",
    enabled: true,
    rules: [
      {
        id: "rule-pci-01",
        name: "Redact CVV/CVC security codes",
        description:
          "PCI-DSS Req. 3.3.2 prohibits storing SAD. Matches labelled security code patterns.",
        enabled: true,
        priority: 10,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:cvv|cvc|cvv2|cvc2|cid|security[-_\\s]?code|card[-_\\s]?security)\\s*[:\\-=]?\\s*[0-9]{3,4}\\b",
        maskType: "REDACT",
        replacement: "[CVV]",
      },
      {
        id: "rule-pci-02",
        name: "Redact card expiry dates",
        description:
          "PCI-DSS Req. 3.3 — card expiry is CHD and must be protected",
        enabled: true,
        priority: 20,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "(?:exp(?:ir(?:y|ation)?)?[-_\\s]?(?:date)?|valid[-_\\s]?(?:thru|through|until)|card[-_\\s]?exp)\\s*[:\\-=]?\\s*(?:0[1-9]|1[0-2])\\s*[/\\-]\\s*(?:[0-9]{2,4})",
        maskType: "REDACT",
        replacement: "[EXPIRY]",
      },
      {
        id: "rule-pci-03",
        name: "Hash ABA bank routing numbers",
        description: "US ABA routing numbers are 9 digits — SHA-256 hashed for tracing",
        enabled: true,
        priority: 30,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:routing|aba|transit|routing[-_\\s]?(?:no|num|number))\\s*[:\\-=]?\\s*[0-9]{9}\\b",
        maskType: "HASH",
      },
      {
        id: "rule-pci-04",
        name: "Hash bank account numbers",
        description: "Labelled bank account numbers (8–17 digits) — pseudonymized",
        enabled: true,
        priority: 40,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:bank[-_\\s]?acct|bank[-_\\s]?account|account[-_\\s]?(?:no|num|number)|acct[-_\\s]?(?:no|num))\\s*[:\\-=]?\\s*[0-9]{8,17}\\b",
        maskType: "HASH",
      },
    ],
  },

  // ── SOC 2 / ISO 27001 – SaaS Platform Secrets ────────────────────────────
  {
    name: "SOC 2 / ISO 27001 – SaaS Platform Secrets",
    description:
      "Redacts third-party SaaS API tokens per SOC 2 CC6.1 and ISO 27001 A.9.4: GitHub PATs, Slack tokens, Stripe keys, SendGrid keys, Twilio SIDs, and GCP service account private key material.",
    enabled: true,
    rules: [
      {
        id: "rule-soc-01",
        name: "Redact GitHub personal access tokens",
        description:
          "Matches GitHub PAT prefixes: ghp_, gho_, ghu_, ghs_, ghr_, github_pat_",
        enabled: true,
        priority: 10,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\\b|github_pat_[A-Za-z0-9_]{82}",
        maskType: "REDACT",
        replacement: "[GITHUB_TOKEN]",
      },
      {
        id: "rule-soc-02",
        name: "Redact Slack API tokens",
        description:
          "xoxb- (bot), xoxa- (app), xoxp- (user), xoxs- (service) tokens",
        enabled: true,
        priority: 20,
        targetField: "all",
        matchType: "regex",
        customPattern: "xox[baprs]-[0-9A-Za-z\\-]{16,}",
        maskType: "REDACT",
        replacement: "[SLACK_TOKEN]",
      },
      {
        id: "rule-soc-03",
        name: "Redact Stripe API keys",
        description: "Stripe live/test secret, publishable, and restricted keys",
        enabled: true,
        priority: 30,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "\\b(?:sk_live|sk_test|pk_live|pk_test|rk_live|rk_test)_[A-Za-z0-9]{24,}\\b",
        maskType: "REDACT",
        replacement: "[STRIPE_KEY]",
      },
      {
        id: "rule-soc-04",
        name: "Redact SendGrid API keys",
        description: "SendGrid keys: SG.<22chars>.<43chars>",
        enabled: true,
        priority: 40,
        targetField: "all",
        matchType: "regex",
        customPattern: "SG\\.[A-Za-z0-9_\\-]{22,}\\.[A-Za-z0-9_\\-]{43,}",
        maskType: "REDACT",
        replacement: "[SENDGRID_KEY]",
      },
      {
        id: "rule-soc-05",
        name: "Redact Twilio Account SIDs",
        description: "Twilio Account SIDs: AC + 32 lowercase hex chars",
        enabled: true,
        priority: 50,
        targetField: "all",
        matchType: "regex",
        customPattern: "\\bAC[a-f0-9]{32}\\b",
        maskType: "REDACT",
        replacement: "[TWILIO_SID]",
      },
      {
        id: "rule-soc-06",
        name: "Redact GCP service account private keys",
        description:
          "Detects private_key fields in GCP SA JSON blobs emitted to logs",
        enabled: true,
        priority: 60,
        targetField: "body",
        matchType: "regex",
        customPattern: '"private_key"\\s*:\\s*"-----BEGIN[^"]*"',
        maskType: "REDACT",
        replacement: '"private_key":"[GCP_KEY_REDACTED]"',
      },
    ],
  },

  // ── CCPA – California Consumer Privacy Act (CPRA) ─────────────────────────
  {
    name: "CCPA – California Consumer Privacy Act",
    description:
      "Protects California consumer personal information under Cal. Civ. Code §1798.140: driver's licence numbers, Vehicle Identification Numbers (VIN), and biometric identifier references. Enable for California-resident user workloads.",
    enabled: false,
    rules: [
      {
        id: "rule-ccpa-01",
        name: "Redact California driver's licence numbers",
        description: "CA DL format: 1 uppercase letter + 7 digits. Context-aware detection.",
        enabled: true,
        priority: 10,
        targetField: "all",
        matchType: "regex",
        customPattern:
          "(?:dl|driv(?:er)?s?[-_\\s]?lic(?:ense)?)\\s*[:\\-=]?\\s*[A-Z][0-9]{7}\\b",
        maskType: "REDACT",
        replacement: "[DL]",
      },
      {
        id: "rule-ccpa-02",
        name: "Redact Vehicle Identification Numbers (VIN)",
        description:
          "17-char ISO 3779 VIN — personal information under CCPA §1798.140",
        enabled: true,
        priority: 20,
        targetField: "all",
        matchType: "regex",
        customPattern: "\\b[A-HJ-NPR-Z0-9]{17}\\b",
        maskType: "REDACT",
        replacement: "[VIN]",
      },
      {
        id: "rule-ccpa-03",
        name: "Redact biometric data references",
        description:
          "Base64-encoded biometric payloads labelled with fingerprint/facial/iris keywords",
        enabled: true,
        priority: 30,
        targetField: "body",
        matchType: "regex",
        customPattern:
          "(?:biometric|fingerprint|facial[-_\\s]?recognition|retina|iris[-_\\s]?scan)\\s*[:\\-=]?\\s*[A-Za-z0-9+/=]{20,}",
        maskType: "REDACT",
        replacement: "[BIOMETRIC]",
      },
    ],
  },
];

export class DefaultDataMaskingPoliciesSeed extends BaseSeed {
  name = "DefaultDataMaskingPoliciesSeed";
  moduleName = "data-masking";
  order = 1;
  dependencies = [];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding default PII masking policy templates...");

    // Resolve the first available organization
    const orgRows = await dataSource.query(
      `SELECT id, name FROM organizations ORDER BY created_at ASC LIMIT 1`,
    );

    if (!orgRows.length) {
      this.logError(
        "No organization found — skipping data-masking seed (run IAM seeds first)",
      );
      return;
    }

    const org = orgRows[0] as { id: string; name: string };
    const SYSTEM_USER = "system-seed";
    let inserted = 0;

    for (const template of POLICY_TEMPLATES) {
      const exists = await this.recordExists(
        dataSource,
        "data_masking_policies",
        {
          organization_id: org.id,
          name: template.name,
        },
      );

      if (exists) {
        this.logSkip(`Policy exists: ${template.name}`);
        continue;
      }

      await dataSource.query(
        `INSERT INTO data_masking_policies
           (id, organization_id, workspace_id, name, description, is_enabled, rules,
            created_by, updated_by, created_at, updated_at)
         VALUES
           (gen_random_uuid(), $1, NULL, $2, $3, $4, $5::jsonb, $6, NULL, NOW(), NOW())`,
        [
          org.id,
          template.name,
          template.description,
          template.enabled,
          JSON.stringify(template.rules),
          SYSTEM_USER,
        ],
      );

      this.logSuccess(`Created template policy: ${template.name}`);
      inserted++;
    }

    this.log(
      `Data masking seed complete: ${inserted} created, ${POLICY_TEMPLATES.length - inserted} skipped`,
    );
  }
}
