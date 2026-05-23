/**
 * General PII Baseline — Framework Templates
 * Universal rules applicable to any environment, regardless of jurisdiction.
 */

import { TargetField, MatchType, MaskType, BuiltinPattern } from '@/types/data-masking'
import type { MaskingFrameworkCategory } from '../types'
import { MaskingFramework } from '../types'

export const GeneralPIICategory: MaskingFrameworkCategory = {
  metadata: {
    id: MaskingFramework.GENERAL,
    name: 'General PII',
    fullName: 'General PII Baseline',
    description: 'Universal privacy rules for email, phone, SSN, IP, and credentials',
    icon: 'carbon:security',
    color: '#6366f1',
    issuedBy: 'Industry Best Practice',
    jurisdictions: ['Global'],
    templateCount: 3,
  },
  templates: [
    // ── Template 1: Contact Data ─────────────────────────────────────────────
    {
      id: 'tpl-gen-001',
      name: 'Contact Data Masking',
      description: 'Redacts email addresses and phone numbers from all telemetry fields. The first-line defence for any PII programme.',
      framework: MaskingFramework.GENERAL,
      defaultEnabled: true,
      regulations: ['GDPR Art. 4(1)', 'CCPA §1798.140(o)', 'PIPEDA'],
      referenceUrl: 'https://gdpr.eu/article-4-definitions/',
      rules: [
        {
          id: 'tpl-gen-001-r01',
          name: 'Redact email addresses',
          description: 'Matches RFC-5322 email addresses in all telemetry fields',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.EMAIL,
          maskType: MaskType.REPLACE,
          replacement: '[EMAIL]',
        },
        {
          id: 'tpl-gen-001-r02',
          name: 'Redact phone numbers',
          description: 'Matches North-American and international formatted phone numbers',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.PHONE,
          maskType: MaskType.REPLACE,
          replacement: '[PHONE]',
        },
      ],
    },

    // ── Template 2: Identity Documents ──────────────────────────────────────
    {
      id: 'tpl-gen-002',
      name: 'Identity Document & IP Masking',
      description: 'Redacts US Social Security Numbers and anonymizes IP addresses — both are considered personal identifiers across all major privacy frameworks.',
      framework: MaskingFramework.GENERAL,
      defaultEnabled: true,
      regulations: ['GDPR Recital 49', 'CCPA §1798.140', 'HIPAA §164.514(b)(2)(i)'],
      rules: [
        {
          id: 'tpl-gen-002-r01',
          name: 'Hash Social Security Numbers',
          description: 'SHA-256 hash allows cross-event correlation without storing raw SSN',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.SSN,
          maskType: MaskType.HASH,
        },
        {
          id: 'tpl-gen-002-r02',
          name: 'Anonymize IP addresses',
          description: 'Replaces IPv4 addresses — IPs are personal data under GDPR',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.IP_ADDRESS,
          maskType: MaskType.REPLACE,
          replacement: '[IP_ANONYMIZED]',
        },
      ],
    },

    // ── Template 3: API Credentials ──────────────────────────────────────────
    {
      id: 'tpl-gen-003',
      name: 'API Credentials & Token Protection',
      description: 'Redacts JWT tokens, generic API key patterns, AWS access key IDs, and PEM private key material. Prevents secret leakage through observability pipelines.',
      framework: MaskingFramework.GENERAL,
      defaultEnabled: true,
      regulations: ['SOC 2 CC6.1', 'ISO 27001 A.9.4', 'NIST SP 800-53 IA-5'],
      rules: [
        {
          id: 'tpl-gen-003-r01',
          name: 'Redact JWT tokens',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.JWT_TOKEN,
          maskType: MaskType.REDACT,
          replacement: '[JWT_REDACTED]',
        },
        {
          id: 'tpl-gen-003-r02',
          name: 'Redact generic API keys and secrets',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.API_KEY_GENERIC,
          maskType: MaskType.REDACT,
          replacement: '[API_KEY]',
        },
        {
          id: 'tpl-gen-003-r03',
          name: 'Redact AWS IAM access key IDs',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.AWS_ACCESS_KEY,
          maskType: MaskType.REDACT,
          replacement: '[AWS_KEY]',
        },
        {
          id: 'tpl-gen-003-r04',
          name: 'Redact PEM private key material',
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

export const GeneralPIITemplates = GeneralPIICategory.templates
