/**
 * CCPA – California Consumer Privacy Act (as amended by CPRA)
 * Cal. Civ. Code §1798.100 et seq. — Effective January 1, 2020
 * CPRA amendments effective January 1, 2023
 *
 * §1798.140(o)(1) defines "personal information" broadly to include:
 *   - Identifiers: real name, alias, postal address, IP, email, SSN, DL, passport
 *   - Characteristics of protected classifications
 *   - Biometric information
 *   - Unique personal identifiers (device IDs, cookies, beacons)
 */

import { TargetField, MatchType, MaskType, BuiltinPattern } from '@/types/data-masking'
import type { MaskingFrameworkCategory } from '../types'
import { MaskingFramework } from '../types'

export const CCPACategory: MaskingFrameworkCategory = {
  metadata: {
    id: MaskingFramework.CCPA,
    name: 'CCPA',
    fullName: 'California Consumer Privacy Act (CPRA)',
    description: 'California state privacy law protecting consumer personal information. Applies to businesses meeting annual revenue/data-volume thresholds that process CA resident data.',
    icon: 'carbon:location',
    color: '#ef4444',
    issuedBy: 'State of California',
    jurisdictions: ['California, USA'],
    templateCount: 2,
    referenceUrl: 'https://oag.ca.gov/privacy/ccpa',
  },
  templates: [
    // ── Template 1: CCPA Physical & Document Identifiers ─────────────────────
    {
      id: 'tpl-ccpa-001',
      name: 'CCPA Physical & Document Identifiers',
      description: 'Covers California driver\'s license numbers, Vehicle Identification Numbers (VIN), and US passport numbers — all classified as personal information under CCPA §1798.140(o)(1)(A).',
      framework: MaskingFramework.CCPA,
      defaultEnabled: false,
      regulations: [
        'CCPA §1798.140(o)(1)(A) — Personal identifiers',
        'CPRA §1798.100 — Consumer rights',
        'California Vehicle Code §1801 — VIN privacy',
      ],
      referenceUrl: 'https://oag.ca.gov/privacy/ccpa',
      rules: [
        {
          id: 'tpl-ccpa-001-r01',
          name: 'Redact California driver\'s license numbers',
          description: 'CA DL format: 1 uppercase letter + 7 digits (e.g., D1234567). Context-aware detection.',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:dl|driv(?:er)?s?[-_\\s]?lic(?:ense)?)\\s*[:\\-=]?\\s*[A-Z][0-9]{7}\\b',
          maskType: MaskType.REDACT,
          replacement: '[DL]',
        },
        {
          id: 'tpl-ccpa-001-r02',
          name: 'Redact Vehicle Identification Numbers (VIN)',
          description: '17-character ISO 3779 VIN — unique vehicle identifier qualifying as personal information under CCPA',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b[A-HJ-NPR-Z0-9]{17}\\b',
          maskType: MaskType.REDACT,
          replacement: '[VIN]',
        },
        {
          id: 'tpl-ccpa-001-r03',
          name: 'Redact passport numbers',
          description: 'US and international passport numbers in labelled context',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:passport|pass[-_\\s]?(?:no|nr|num|number))\\s*[:\\-=]?\\s*[A-Z0-9]{7,9}',
          maskType: MaskType.REDACT,
          replacement: '[PASSPORT]',
        },
        {
          id: 'tpl-ccpa-001-r04',
          name: 'Hash Social Security Numbers',
          description: 'SSN is an enumerated CCPA §1798.140(o)(1)(A) personal identifier',
          enabled: true,
          priority: 40,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.SSN,
          maskType: MaskType.HASH,
        },
      ],
    },

    // ── Template 2: CCPA Digital & Biometric Identifiers ─────────────────────
    {
      id: 'tpl-ccpa-002',
      name: 'CCPA Digital & Biometric Identifiers',
      description: 'Covers digital identifiers and biometric data under CCPA §1798.140(o)(1): email addresses, IP addresses, and biometric information such as fingerprint and facial recognition data encoded in log payloads.',
      framework: MaskingFramework.CCPA,
      defaultEnabled: false,
      regulations: [
        'CCPA §1798.140(b) — Biometric information definition',
        'CCPA §1798.140(o)(1)(B) — Commercial information',
        'CCPA §1798.140(o)(1)(F) — Internet activity',
        'CPRA §1798.121 — Sensitive personal information',
      ],
      referenceUrl: 'https://oag.ca.gov/privacy/ccpa',
      rules: [
        {
          id: 'tpl-ccpa-002-r01',
          name: 'Redact email addresses',
          description: 'Email is an enumerated CCPA §1798.140(o)(1)(A) identifier',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.EMAIL,
          maskType: MaskType.REPLACE,
          replacement: '[EMAIL]',
        },
        {
          id: 'tpl-ccpa-002-r02',
          name: 'Anonymize IP addresses',
          description: 'IP is a unique identifier under CCPA §1798.140(o)(1)(A) and internet activity under §1798.140(o)(1)(F)',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.IP_ADDRESS,
          maskType: MaskType.REPLACE,
          replacement: '[IP_ANONYMIZED]',
        },
        {
          id: 'tpl-ccpa-002-r03',
          name: 'Redact biometric data references',
          description: 'Detects base64-encoded biometric payloads labelled with fingerprint/facial/iris keywords. CPRA §1798.121 classifies biometrics as Sensitive Personal Information.',
          enabled: true,
          priority: 30,
          targetField: TargetField.BODY,
          matchType: MatchType.REGEX,
          customPattern: '(?:biometric|fingerprint|facial[-_\\s]?recognition|retina|iris[-_\\s]?scan)\\s*[:\\-=]?\\s*[A-Za-z0-9+/=]{20,}',
          maskType: MaskType.REDACT,
          replacement: '[BIOMETRIC]',
        },
      ],
    },
  ],
}

export const CCPATemplates = CCPACategory.templates
