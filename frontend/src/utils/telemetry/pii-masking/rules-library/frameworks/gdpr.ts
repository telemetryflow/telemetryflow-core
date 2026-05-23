/**
 * GDPR – EU General Data Protection Regulation
 * Regulation (EU) 2016/679 — Effective 25 May 2018
 *
 * Templates cover:
 *   Art. 4(1) — personal data definition (email, phone, IP, IDs)
 *   Art. 9    — special category data (health, biometric, racial/ethnic origin)
 *   Recital 26 — pseudonymisation and anonymisation
 *   Recital 49 — legitimate interest for security processing
 */

import { TargetField, MatchType, MaskType, BuiltinPattern } from '@/types/data-masking'
import type { MaskingFrameworkCategory } from '../types'
import { MaskingFramework } from '../types'

export const GDPRCategory: MaskingFrameworkCategory = {
  metadata: {
    id: MaskingFramework.GDPR,
    name: 'GDPR',
    fullName: 'General Data Protection Regulation (EU)',
    description: 'EU regulation on data protection and privacy. Applies to any org processing EU/EEA resident data.',
    icon: 'carbon:earth-europe-africa',
    color: '#3b82f6',
    issuedBy: 'European Parliament',
    jurisdictions: ['European Union', 'EEA', 'UK (UK GDPR)'],
    templateCount: 3,
    referenceUrl: 'https://gdpr.eu/',
  },
  templates: [
    // ── Template 1: GDPR Baseline Personal Data ──────────────────────────────
    {
      id: 'tpl-gdpr-001',
      name: 'GDPR Baseline — Contact & Network Identifiers',
      description: 'Covers the most common GDPR Art. 4(1) personal data found in logs: email addresses, phone numbers, and IP addresses (which are personal data under GDPR Recital 49).',
      framework: MaskingFramework.GDPR,
      defaultEnabled: true,
      regulations: ['GDPR Art. 4(1)', 'GDPR Recital 49', 'GDPR Art. 25 (Data minimisation)'],
      referenceUrl: 'https://gdpr.eu/article-4-definitions/',
      rules: [
        {
          id: 'tpl-gdpr-001-r01',
          name: 'Redact email addresses',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.EMAIL,
          maskType: MaskType.REPLACE,
          replacement: '[EMAIL]',
        },
        {
          id: 'tpl-gdpr-001-r02',
          name: 'Redact phone numbers',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.PHONE,
          maskType: MaskType.REPLACE,
          replacement: '[PHONE]',
        },
        {
          id: 'tpl-gdpr-001-r03',
          name: 'Anonymize IP addresses (Recital 49)',
          description: 'IP addresses constitute personal data under GDPR. Replaced with fixed token at ingestion.',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.IP_ADDRESS,
          maskType: MaskType.REPLACE,
          replacement: '[IP_ANONYMIZED]',
        },
      ],
    },

    // ── Template 2: GDPR Financial Identifiers ───────────────────────────────
    {
      id: 'tpl-gdpr-002',
      name: 'GDPR Financial & Banking Identifiers',
      description: 'Hashes IBAN bank account numbers and redacts SWIFT/BIC codes and passport numbers. Required for financial services operating under GDPR.',
      framework: MaskingFramework.GDPR,
      defaultEnabled: true,
      regulations: ['GDPR Art. 4(1)', 'GDPR Art. 32 (Security of processing)', 'EBA Guidelines EBA/GL/2019/04'],
      referenceUrl: 'https://gdpr.eu/article-32-security-of-processing/',
      rules: [
        {
          id: 'tpl-gdpr-002-r01',
          name: 'Hash IBAN bank account numbers',
          description: 'SHA-256 hash of International Bank Account Numbers (ISO 13616). Allows reconciliation without storing the raw IBAN.',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}(?:[A-Z0-9]{0,16})',
          maskType: MaskType.HASH,
        },
        {
          id: 'tpl-gdpr-002-r02',
          name: 'Redact SWIFT/BIC codes',
          description: '8–11 character bank identifier codes per ISO 9362',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\\b',
          maskType: MaskType.REDACT,
          replacement: '[BIC]',
        },
        {
          id: 'tpl-gdpr-002-r03',
          name: 'Redact passport numbers',
          description: 'Context-aware: matches "passport:", "pass_no:" etc. followed by 7–9 alphanumeric chars',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:passport|pass[-_\\s]?(?:no|nr|num|number))\\s*[:\\-=]?\\s*[A-Z0-9]{7,9}',
          maskType: MaskType.REDACT,
          replacement: '[PASSPORT]',
        },
      ],
    },

    // ── Template 3: GDPR Special Category Data (Art. 9) ─────────────────────
    {
      id: 'tpl-gdpr-003',
      name: 'GDPR Special Category Data (Art. 9)',
      description: 'Covers GDPR Art. 9 "special category" data requiring heightened protection: national identification numbers, date of birth, and health-related identifiers in log context.',
      framework: MaskingFramework.GDPR,
      defaultEnabled: false,
      regulations: ['GDPR Art. 9 (Special category data)', 'GDPR Art. 5(1)(e) (Storage limitation)', 'GDPR Art. 17 (Right to erasure)'],
      referenceUrl: 'https://gdpr.eu/article-9-processing-special-categories/',
      rules: [
        {
          id: 'tpl-gdpr-003-r01',
          name: 'Redact date of birth',
          description: '"dob:", "date_of_birth:", or "birthdate:" followed by common date formats',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:dob|date[-_\\s]?of[-_\\s]?birth|birth[-_\\s]?date)\\s*[:\\-=]?\\s*(?:\\d{1,2}[/\\-.\\s]\\d{1,2}[/\\-.\\s]\\d{2,4}|\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2})',
          maskType: MaskType.REDACT,
          replacement: '[DOB]',
        },
        {
          id: 'tpl-gdpr-003-r02',
          name: 'Redact national identification numbers',
          description: 'Context-aware: detects "national_id:", "id_number:", "citizen_id:" patterns',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:national[-_\\s]?id|citizen[-_\\s]?id|id[-_\\s]?number|id[-_\\s]?no)\\s*[:\\-=]?\\s*[A-Z0-9\\-]{6,15}',
          maskType: MaskType.REDACT,
          replacement: '[NATIONAL_ID]',
        },
        {
          id: 'tpl-gdpr-003-r03',
          name: 'Hash Social Security / Tax IDs',
          description: 'SSN and national tax identification numbers — pseudonymized via SHA-256',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.SSN,
          maskType: MaskType.HASH,
        },
      ],
    },
  ],
}

export const GDPRTemplates = GDPRCategory.templates
