/**
 * PII Masking Rules Library — Types
 *
 * Defines the structure for compliance-framework policy templates
 * displayed in the "Rules Library" tab of the PII Data Masking view.
 */

import type { MaskingRule } from '@/types/data-masking'

// ─── Framework enum ────────────────────────────────────────────────────────────

export enum MaskingFramework {
  GENERAL       = 'general',
  GDPR          = 'gdpr',
  HIPAA         = 'hipaa',
  PCI_DSS       = 'pci-dss',
  SOC2_ISO27001 = 'soc2-iso27001',
  CCPA          = 'ccpa',
}

// ─── Template types ────────────────────────────────────────────────────────────

/**
 * A single masking policy template with pre-configured rules.
 * Users can "Use Template" to create a new policy pre-filled with these rules.
 */
export interface MaskingPolicyTemplate {
  id: string
  name: string
  description: string
  framework: MaskingFramework
  /** Default enabled state when policy is created from this template */
  defaultEnabled: boolean
  /** Pre-configured masking rules — IDs are placeholders, replaced on save */
  rules: MaskingRule[]
  /** Regulation articles or sections this template addresses */
  regulations: string[]
  /** Reference documentation URL */
  referenceUrl?: string
}

/**
 * Metadata for a compliance framework category
 */
export interface FrameworkMetadata {
  id: MaskingFramework
  name: string
  fullName: string
  description: string
  icon: string
  color: string
  /** Regulatory body or standard issuer */
  issuedBy: string
  /** Jurisdictions where this framework applies */
  jurisdictions: string[]
  templateCount: number
  referenceUrl?: string
}

/**
 * A complete framework category definition
 */
export interface MaskingFrameworkCategory {
  metadata: FrameworkMetadata
  templates: MaskingPolicyTemplate[]
}

// ─── Display configs ───────────────────────────────────────────────────────────

export const FrameworkDisplayConfigs: FrameworkMetadata[] = [
  {
    id: MaskingFramework.GENERAL,
    name: 'General PII',
    fullName: 'General PII Baseline',
    description: 'Universal privacy rules for email, phone, SSN, IP, and credentials — applicable to any environment',
    icon: 'carbon:security',
    color: '#6366f1',
    issuedBy: 'Industry Best Practice',
    jurisdictions: ['Global'],
    templateCount: 3,
  },
  {
    id: MaskingFramework.GDPR,
    name: 'GDPR',
    fullName: 'General Data Protection Regulation (EU)',
    description: 'EU regulation on data protection and privacy (Regulation 2016/679). Applies to any organisation processing EU resident data.',
    icon: 'carbon:earth-europe-africa',
    color: '#3b82f6',
    issuedBy: 'European Parliament',
    jurisdictions: ['European Union', 'EEA', 'UK (UK GDPR)'],
    templateCount: 3,
    referenceUrl: 'https://gdpr.eu/',
  },
  {
    id: MaskingFramework.HIPAA,
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act (US)',
    description: 'US federal law protecting the privacy of protected health information (PHI). Required for covered entities and business associates.',
    icon: 'carbon:health-cross',
    color: '#10b981',
    issuedBy: 'US Department of Health & Human Services',
    jurisdictions: ['United States'],
    templateCount: 2,
    referenceUrl: 'https://www.hhs.gov/hipaa/',
  },
  {
    id: MaskingFramework.PCI_DSS,
    name: 'PCI-DSS',
    fullName: 'Payment Card Industry Data Security Standard v4.0',
    description: 'Security standard for organisations that handle cardholder data (CHD). Applies to any entity that stores, processes, or transmits payment card data.',
    icon: 'carbon:wallet',
    color: '#f59e0b',
    issuedBy: 'PCI Security Standards Council',
    jurisdictions: ['Global'],
    templateCount: 2,
    referenceUrl: 'https://www.pcisecuritystandards.org/',
  },
  {
    id: MaskingFramework.SOC2_ISO27001,
    name: 'SOC 2 / ISO 27001',
    fullName: 'SOC 2 Type II & ISO/IEC 27001:2022',
    description: 'Cloud and SaaS infrastructure secrets management. SOC 2 CC6.1 (Logical Access) and ISO 27001 A.9.4 require preventing unauthorised access to systems via leaked credentials.',
    icon: 'carbon:security-services',
    color: '#8b5cf6',
    issuedBy: 'AICPA / ISO',
    jurisdictions: ['Global'],
    templateCount: 3,
    referenceUrl: 'https://www.aicpa.org/soc',
  },
  {
    id: MaskingFramework.CCPA,
    name: 'CCPA',
    fullName: 'California Consumer Privacy Act (CPRA)',
    description: 'California state law giving consumers rights over personal information. Applies to businesses meeting size thresholds that collect California resident data.',
    icon: 'carbon:location',
    color: '#ef4444',
    issuedBy: 'State of California',
    jurisdictions: ['California, USA'],
    templateCount: 2,
    referenceUrl: 'https://oag.ca.gov/privacy/ccpa',
  },
]
