/**
 * PCI-DSS – Payment Card Industry Data Security Standard v4.0
 * Issued by the PCI Security Standards Council
 *
 * Covers Cardholder Data (CHD) and Sensitive Authentication Data (SAD).
 * Requirement 3: Protect stored account data.
 * Requirement 3.3: SAD must never be stored after authorization.
 */

import { TargetField, MatchType, MaskType, BuiltinPattern } from '@/types/data-masking'
import type { MaskingFrameworkCategory } from '../types'
import { MaskingFramework } from '../types'

export const PCIDSSCategory: MaskingFrameworkCategory = {
  metadata: {
    id: MaskingFramework.PCI_DSS,
    name: 'PCI-DSS',
    fullName: 'Payment Card Industry Data Security Standard v4.0',
    description: 'Security standard for entities that store, process, or transmit payment card data.',
    icon: 'carbon:wallet',
    color: '#f59e0b',
    issuedBy: 'PCI Security Standards Council',
    jurisdictions: ['Global'],
    templateCount: 2,
    referenceUrl: 'https://www.pcisecuritystandards.org/',
  },
  templates: [
    // ── Template 1: PCI-DSS Cardholder Data (CHD) ────────────────────────────
    {
      id: 'tpl-pci-001',
      name: 'PCI-DSS CHD & Sensitive Authentication Data',
      description: 'Protects Cardholder Data (CHD) and Sensitive Authentication Data (SAD) per PCI-DSS v4.0 Req. 3.3: hashes PANs, redacts CVV/CVC codes, and redacts card expiry dates.',
      framework: MaskingFramework.PCI_DSS,
      defaultEnabled: true,
      regulations: [
        'PCI-DSS v4.0 Req. 3.3 — Protect stored SAD',
        'PCI-DSS v4.0 Req. 3.4 — Render PAN unreadable',
        'PCI-DSS v4.0 Req. 3.5 — Protect CHD',
      ],
      referenceUrl: 'https://www.pcisecuritystandards.org/document_library/',
      rules: [
        {
          id: 'tpl-pci-001-r01',
          name: 'Hash Primary Account Numbers (PAN)',
          description: 'PCI-DSS Req. 3.4: PAN must be rendered unreadable anywhere it is stored. SHA-256 hash.',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.CREDIT_CARD,
          maskType: MaskType.HASH,
        },
        {
          id: 'tpl-pci-001-r02',
          name: 'Redact CVV/CVC/CVV2 security codes',
          description: 'PCI-DSS Req. 3.3.2: SAD must not be retained after authorization. CVV/CVC is SAD.',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:cvv|cvc|cvv2|cvc2|cid|security[-_\\s]?code|card[-_\\s]?security)\\s*[:\\-=]?\\s*[0-9]{3,4}\\b',
          maskType: MaskType.REDACT,
          replacement: '[CVV]',
        },
        {
          id: 'tpl-pci-001-r03',
          name: 'Redact card expiry dates',
          description: 'Expiry date is CHD — must be protected per PCI-DSS Req. 3.3',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '(?:exp(?:ir(?:y|ation)?)?[-_\\s]?(?:date)?|valid[-_\\s]?(?:thru|through|until)|card[-_\\s]?exp)\\s*[:\\-=]?\\s*(?:0[1-9]|1[0-2])\\s*[/\\-]\\s*(?:[0-9]{2,4})',
          maskType: MaskType.REDACT,
          replacement: '[EXPIRY]',
        },
        {
          id: 'tpl-pci-001-r04',
          name: 'Redact URL embedded card credentials',
          description: 'Payment gateway URLs may embed card credentials — strip them at ingestion',
          enabled: true,
          priority: 40,
          targetField: TargetField.ALL,
          matchType: MatchType.BUILTIN,
          builtinPattern: BuiltinPattern.URL_CREDENTIALS,
          maskType: MaskType.REDACT,
          replacement: '[CREDS_REMOVED]',
        },
      ],
    },

    // ── Template 2: PCI-DSS Banking Transaction Data ─────────────────────────
    {
      id: 'tpl-pci-002',
      name: 'PCI-DSS Banking & Transaction Identifiers',
      description: 'Protects banking transaction data: hashes ABA routing numbers and bank account numbers, and redacts SWIFT/BIC codes that appear in payment gateway log streams.',
      framework: MaskingFramework.PCI_DSS,
      defaultEnabled: false,
      regulations: [
        'PCI-DSS v4.0 Req. 3.4 — Account data protection',
        'PCI-DSS v4.0 Req. 4.2.1 — Secure transmission of CHD',
        'NACHA Operating Rules — ACH routing',
      ],
      referenceUrl: 'https://www.pcisecuritystandards.org/',
      rules: [
        {
          id: 'tpl-pci-002-r01',
          name: 'Hash ABA bank routing numbers',
          description: 'US ABA/ACH routing numbers are 9 digits — hashed for transaction tracing without exposure',
          enabled: true,
          priority: 10,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:routing|aba|transit|routing[-_\\s]?(?:no|num|number))\\s*[:\\-=]?\\s*[0-9]{9}\\b',
          maskType: MaskType.HASH,
        },
        {
          id: 'tpl-pci-002-r02',
          name: 'Hash bank account numbers',
          description: 'Labelled bank account numbers (8–17 digits) — pseudonymized via SHA-256',
          enabled: true,
          priority: 20,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b(?:bank[-_\\s]?acct|bank[-_\\s]?account|account[-_\\s]?(?:no|num|number)|acct[-_\\s]?(?:no|num))\\s*[:\\-=]?\\s*[0-9]{8,17}\\b',
          maskType: MaskType.HASH,
        },
        {
          id: 'tpl-pci-002-r03',
          name: 'Redact SWIFT/BIC codes',
          description: 'International wire transfer bank identifiers per ISO 9362',
          enabled: true,
          priority: 30,
          targetField: TargetField.ALL,
          matchType: MatchType.REGEX,
          customPattern: '\\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\\b',
          maskType: MaskType.REDACT,
          replacement: '[BIC]',
        },
      ],
    },
  ],
}

export const PCIDSSTemplates = PCIDSSCategory.templates
