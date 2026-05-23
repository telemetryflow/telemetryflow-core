/**
 * HIPAA – Health Insurance Portability and Accountability Act
 * 45 CFR Parts 160 and 164 (Privacy Rule & Security Rule)
 *
 * Safe Harbor method: 18 PHI identifiers that must be removed/de-identified.
 * Templates cover the identifiers most commonly appearing in service logs.
 */

import { TargetField, MatchType, MaskType, BuiltinPattern } from '@/types/data-masking'
import type { MaskingFrameworkCategory } from '../types'
import { MaskingFramework } from '../types'

export const HIPAACategory: MaskingFrameworkCategory = {
  metadata: {
    id: MaskingFramework.HIPAA,
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act (US)',
    description: 'Protects protected health information (PHI). Required for covered entities and business associates.',
    icon: 'carbon:health-cross',
    color: '#10b981',
    issuedBy: 'US Department of Health & Human Services',
    jurisdictions: ['United States'],
    templateCount: 2,
    referenceUrl: 'https://www.hhs.gov/hipaa/',
  },
  templates: [
    // ── Template 1: HIPAA Safe Harbor — Core PHI ─────────────────────────────
    {
      id: 'tpl-hipaa-001',
      name: 'HIPAA Safe Harbor — Core PHI Identifiers',
      description: 'Covers the most frequently logged HIPAA Safe Harbor identifiers (45 CFR §164.514(b)(2)): names, dates, geographic data, contact details, SSN, and account numbers. Enable for any healthcare or health-adjacent workload.',
      framework: MaskingFramework.HIPAA,
      defaultEnabled: false,
      regulations: [
        'HIPAA 45 CFR §164.514(b)(2) — Safe Harbor method',
        'HIPAA 45 CFR §164.502(d) — De-identification',
        'HITECH Act §13400',
      ],
      referenceUrl: 'https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/',
      rules: [
        {
          id: 'tpl-hipaa-001-r01',
          name: 'Redact Medical Record Numbers (MRN)',
          description: 'PHI identifier #4 — Medical record numbers in labelled context',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:MRN|medical[-_\\s]?record(?:[-_\\s]?(?:no|num|id|number))?)\\s*[:\\-=]?\\s*[A-Z0-9]{5,15}\\b',
          maskType: MaskType.REDACT,
          replacement: '[MRN]',
        },
        {
          id: 'tpl-hipaa-001-r02',
          name: 'Redact health plan beneficiary numbers',
          description: 'PHI identifier #5 — Health insurance member IDs and policy numbers',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:member[-_\\s]?id|beneficiary[-_\\s]?(?:id|no|num)|insurance[-_\\s]?(?:id|no|num)|policy[-_\\s]?(?:no|num|id))\\s*[:\\-=]?\\s*[A-Z0-9\\-]{8,15}\\b',
          maskType: MaskType.REDACT,
          replacement: '[MEMBER_ID]',
        },
        {
          id: 'tpl-hipaa-001-r03',
          name: 'Redact date of birth (PHI #3)',
          description: 'All dates except year are PHI under Safe Harbor. Detects labelled DOB patterns.',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:dob|date[-_\\s]?of[-_\\s]?birth|birth[-_\\s]?date|patient[-_\\s]?dob)\\s*[:\\-=]?\\s*(?:\\d{1,2}[/\\-.\\s]\\d{1,2}[/\\-.\\s]\\d{2,4}|\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2})',
          maskType: MaskType.REDACT,
          replacement: '[DOB]',
        },
        {
          id: 'tpl-hipaa-001-r04',
          name: 'Redact email addresses (PHI #7)',
          description: 'Email addresses are PHI identifier #7 under HIPAA Safe Harbor',
          enabled: true,
          priority: 40,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.EMAIL,
          maskType: MaskType.REPLACE,
          replacement: '[EMAIL]',
        },
        {
          id: 'tpl-hipaa-001-r05',
          name: 'Redact phone numbers (PHI #2)',
          description: 'Telephone numbers are PHI identifier #2 under HIPAA Safe Harbor',
          enabled: true,
          priority: 50,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.PHONE,
          maskType: MaskType.REPLACE,
          replacement: '[PHONE]',
        },
        {
          id: 'tpl-hipaa-001-r06',
          name: 'Hash Social Security Numbers (PHI #9)',
          description: 'SSNs are PHI identifier #9. SHA-256 hash preserves auditability.',
          enabled: true,
          priority: 60,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.SSN,
          maskType: MaskType.HASH,
        },
        {
          id: 'tpl-hipaa-001-r07',
          name: 'Anonymize IP addresses (PHI #15)',
          description: 'IP addresses are PHI identifier #15 under HIPAA Safe Harbor',
          enabled: true,
          priority: 70,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.IP_ADDRESS,
          maskType: MaskType.REPLACE,
          replacement: '[IP_ANONYMIZED]',
        },
      ],
    },

    // ── Template 2: HIPAA Provider Identifiers ───────────────────────────────
    {
      id: 'tpl-hipaa-002',
      name: 'HIPAA Provider & Practitioner Identifiers',
      description: 'Redacts healthcare provider identifiers that uniquely identify practitioners and can be used to re-identify patient data: National Provider Identifiers (NPI) and DEA registration numbers.',
      framework: MaskingFramework.HIPAA,
      defaultEnabled: false,
      regulations: [
        'HIPAA 45 CFR §164.514(b)(2)(i) — Provider identifiers',
        'HIPAA 45 CFR §164.530(c) — Administrative requirements',
        '21 CFR §1301.13 — DEA registrant numbers',
      ],
      referenceUrl: 'https://www.hhs.gov/hipaa/',
      rules: [
        {
          id: 'tpl-hipaa-002-r01',
          name: 'Redact National Provider Identifiers (NPI)',
          description: 'CMS-issued 10-digit unique ID for US healthcare providers',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:NPI|national[-_\\s]?provider(?:[-_\\s]?(?:id|identifier|no|num))?)\\s*[:\\-=]?\\s*\\d{10}\\b',
          maskType: MaskType.REDACT,
          replacement: '[NPI]',
        },
        {
          id: 'tpl-hipaa-002-r02',
          name: 'Redact DEA registration numbers',
          description: 'Drug Enforcement Agency practitioner IDs — 2 letters + 7 digits',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:DEA(?:[-_\\s]?(?:no|num|number))?)\\s*[:\\-=]?\\s*[A-Z]{2}[0-9]{7}\\b',
          maskType: MaskType.REDACT,
          replacement: '[DEA]',
        },
        {
          id: 'tpl-hipaa-002-r03',
          name: 'Redact Medical Record Numbers (MRN)',
          description: 'PHI identifier #4 — facility-specific patient record numbers',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:MRN|medical[-_\\s]?record(?:[-_\\s]?(?:no|num|id|number))?)\\s*[:\\-=]?\\s*[A-Z0-9]{5,15}\\b',
          maskType: MaskType.REDACT,
          replacement: '[MRN]',
        },
      ],
    },
  ],
}

export const HIPAATemplates = HIPAACategory.templates
