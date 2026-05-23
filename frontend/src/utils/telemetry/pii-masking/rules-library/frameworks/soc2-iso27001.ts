/**
 * SOC 2 Type II & ISO/IEC 27001:2022
 *
 * SOC 2 Trust Services Criteria CC6 — Logical and Physical Access Controls
 *   CC6.1: The entity implements logical access security software, infrastructure,
 *          and architectures to protect against security events.
 *
 * ISO 27001 Annex A:
 *   A.9.4 — System and application access control
 *   A.9.2.4 — Management of secret authentication information of users
 *
 * Templates focus on preventing cloud/SaaS API token leakage through observability pipelines.
 */

import { TargetField, MatchType, MaskType, BuiltinPattern } from '@/types/data-masking'
import type { MaskingFrameworkCategory } from '../types'
import { MaskingFramework } from '../types'

export const SOC2ISO27001Category: MaskingFrameworkCategory = {
  metadata: {
    id: MaskingFramework.SOC2_ISO27001,
    name: 'SOC 2 / ISO 27001',
    fullName: 'SOC 2 Type II & ISO/IEC 27001:2022',
    description: 'Cloud and SaaS secrets management for CC6.1 (Logical Access) and ISO 27001 A.9.4.',
    icon: 'carbon:security-services',
    color: '#8b5cf6',
    issuedBy: 'AICPA / ISO',
    jurisdictions: ['Global'],
    templateCount: 3,
    referenceUrl: 'https://www.aicpa.org/soc',
  },
  templates: [
    // ── Template 1: Cloud Platform Tokens ────────────────────────────────────
    {
      id: 'tpl-soc-001',
      name: 'Cloud Platform API Tokens',
      description: 'Redacts SaaS platform tokens that commonly appear in application logs: GitHub personal access tokens, Slack workspace tokens, and GitLab personal access tokens.',
      framework: MaskingFramework.SOC2_ISO27001,
      defaultEnabled: true,
      regulations: [
        'SOC 2 CC6.1 — Logical access security',
        'ISO 27001 A.9.4.3 — Password management system',
        'ISO 27001 A.9.2.4 — Secret authentication information management',
      ],
      referenceUrl: 'https://www.aicpa.org/soc',
      rules: [
        {
          id: 'tpl-soc-001-r01',
          name: 'Redact GitHub personal access tokens',
          description: 'Matches GitHub PAT prefixes: ghp_ (classic), gho_, ghu_, ghs_, ghr_, and Fine-Grained github_pat_',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\\b|github_pat_[A-Za-z0-9_]{82}',
          maskType: MaskType.REDACT,
          replacement: '[GITHUB_TOKEN]',
        },
        {
          id: 'tpl-soc-001-r02',
          name: 'Redact Slack API tokens',
          description: 'xoxb- (bot), xoxa- (app), xoxp- (user), xoxs- (service), xoxr- (refresh)',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: 'xox[baprs]-[0-9A-Za-z\\-]{16,}',
          maskType: MaskType.REDACT,
          replacement: '[SLACK_TOKEN]',
        },
        {
          id: 'tpl-soc-001-r03',
          name: 'Redact GitLab personal access tokens',
          description: 'GitLab PATs follow the glpat- prefix format',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: 'glpat-[A-Za-z0-9_\\-]{20}',
          maskType: MaskType.REDACT,
          replacement: '[GITLAB_TOKEN]',
        },
        {
          id: 'tpl-soc-001-r04',
          name: 'Redact JWT bearer tokens',
          enabled: true,
          priority: 40,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.JWT_TOKEN,
          maskType: MaskType.REDACT,
          replacement: '[JWT_REDACTED]',
        },
      ],
    },

    // ── Template 2: Payment & Messaging SaaS Keys ────────────────────────────
    {
      id: 'tpl-soc-002',
      name: 'Payment & Messaging SaaS API Keys',
      description: 'Redacts secret keys for payment processors and messaging platforms: Stripe (live/test), SendGrid, and Twilio Account SIDs.',
      framework: MaskingFramework.SOC2_ISO27001,
      defaultEnabled: true,
      regulations: [
        'SOC 2 CC6.1 — Logical access security',
        'ISO 27001 A.9.4.2 — Secure log-on procedures',
        'PCI-DSS v4.0 Req. 8.3 — Strong authentication for users',
      ],
      rules: [
        {
          id: 'tpl-soc-002-r01',
          name: 'Redact Stripe API keys',
          description: 'Matches Stripe live/test secret (sk_), publishable (pk_), and restricted (rk_) keys',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:sk_live|sk_test|pk_live|pk_test|rk_live|rk_test)_[A-Za-z0-9]{24,}\\b',
          maskType: MaskType.REDACT,
          replacement: '[STRIPE_KEY]',
        },
        {
          id: 'tpl-soc-002-r02',
          name: 'Redact SendGrid API keys',
          description: 'SendGrid API keys follow the format SG.<22chars>.<43chars>',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: 'SG\\.[A-Za-z0-9_\\-]{22,}\\.[A-Za-z0-9_\\-]{43,}',
          maskType: MaskType.REDACT,
          replacement: '[SENDGRID_KEY]',
        },
        {
          id: 'tpl-soc-002-r03',
          name: 'Redact Twilio Account SIDs',
          description: 'Twilio Account SIDs start with AC followed by 32 lowercase hex chars',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\bAC[a-f0-9]{32}\\b',
          maskType: MaskType.REDACT,
          replacement: '[TWILIO_SID]',
        },
      ],
    },

    // ── Template 3: Infrastructure & Cloud Provider Credentials ──────────────
    {
      id: 'tpl-soc-003',
      name: 'Infrastructure & Cloud Provider Credentials',
      description: 'Redacts cloud infrastructure credentials: AWS IAM access keys, GCP service account private keys embedded in JSON log output, Azure SAS tokens, and PEM private key material.',
      framework: MaskingFramework.SOC2_ISO27001,
      defaultEnabled: true,
      regulations: [
        'SOC 2 CC6.1 — Logical access security',
        'ISO 27001 A.12.4 — Logging and monitoring',
        'CIS Controls v8 — Control 5.2 (Use unique passwords)',
        'NIST SP 800-53 IA-5 — Authenticator management',
      ],
      rules: [
        {
          id: 'tpl-soc-003-r01',
          name: 'Redact AWS IAM access key IDs',
          description: 'AWS access key IDs starting with AKIA, ASIA, AROA, AIDA prefixes',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.AWS_ACCESS_KEY,
          maskType: MaskType.REDACT,
          replacement: '[AWS_KEY]',
        },
        {
          id: 'tpl-soc-003-r02',
          name: 'Redact GCP service account private keys',
          description: 'Detects private_key fields in GCP service account JSON blobs that appear in logs',
          enabled: true,
          priority: 20,
          targetField: TargetField.BODY,
          matchType: MatchType.REGEX,
          customPattern: '"private_key"\\s*:\\s*"-----BEGIN[^"]*"',
          maskType: MaskType.REDACT,
          replacement: '"private_key":"[GCP_KEY_REDACTED]"',
        },
        {
          id: 'tpl-soc-003-r03',
          name: 'Redact Azure SAS tokens',
          description: 'Azure Shared Access Signature token patterns in log output',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:SharedAccessSignature\\s+|sig=)[A-Za-z0-9%+/=]{20,}',
          maskType: MaskType.REDACT,
          replacement: '[AZURE_SAS]',
        },
        {
          id: 'tpl-soc-003-r04',
          name: 'Redact PEM private key blocks',
          description: 'RSA, EC, DSA, and OpenSSH private key material in log body',
          enabled: true,
          priority: 40,
          targetField: TargetField.BODY,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.PRIVATE_KEY,
          maskType: MaskType.REDACT,
          replacement: '[PRIVATE_KEY]',
        },
      ],
    },
  ],
}

export const SOC2ISO27001Templates = SOC2ISO27001Category.templates
