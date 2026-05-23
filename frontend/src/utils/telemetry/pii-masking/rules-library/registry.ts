/**
 * PII Masking Rules Library — Registry
 * Central lookup for all compliance framework templates.
 */

import type { MaskingPolicyTemplate, MaskingFrameworkCategory, FrameworkMetadata } from './types'
import { MaskingFramework, FrameworkDisplayConfigs } from './types'

import { GeneralPIICategory }    from './frameworks/general'
import { GDPRCategory }          from './frameworks/gdpr'
import { HIPAACategory }         from './frameworks/hipaa'
import { PCIDSSCategory }        from './frameworks/pci-dss'
import { SOC2ISO27001Category }  from './frameworks/soc2-iso27001'
import { CCPACategory }          from './frameworks/ccpa'

// ─── All categories ────────────────────────────────────────────────────────────

const AllCategories: MaskingFrameworkCategory[] = [
  GeneralPIICategory,
  GDPRCategory,
  HIPAACategory,
  PCIDSSCategory,
  SOC2ISO27001Category,
  CCPACategory,
]

// ─── Registry functions ────────────────────────────────────────────────────────

export function getAllFrameworks(): MaskingFrameworkCategory[] {
  return AllCategories
}

export function getFramework(id: MaskingFramework): MaskingFrameworkCategory | undefined {
  return AllCategories.find((c) => c.metadata.id === id)
}

export function getAllTemplates(): MaskingPolicyTemplate[] {
  return AllCategories.flatMap((c) => c.templates)
}

export function getTemplatesByFramework(id: MaskingFramework): MaskingPolicyTemplate[] {
  return getFramework(id)?.templates ?? []
}

export function getTemplateById(id: string): MaskingPolicyTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id)
}

export function searchTemplates(query: string): MaskingPolicyTemplate[] {
  const q = query.toLowerCase()
  return getAllTemplates().filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.regulations.some((r) => r.toLowerCase().includes(q)),
  )
}

export function getAllFrameworkMetadata(): FrameworkMetadata[] {
  return FrameworkDisplayConfigs
}

export function getTotalTemplateCount(): number {
  return getAllTemplates().length
}

/**
 * Groups frameworks by applicability tier for sidebar display
 */
export function getFrameworksGrouped(): Record<string, MaskingFrameworkCategory[]> {
  return {
    'Universal': AllCategories.filter((c) =>
      [MaskingFramework.GENERAL, MaskingFramework.SOC2_ISO27001].includes(c.metadata.id),
    ),
    'Regional / Jurisdictional': AllCategories.filter((c) =>
      [MaskingFramework.GDPR, MaskingFramework.CCPA].includes(c.metadata.id),
    ),
    'Industry Specific': AllCategories.filter((c) =>
      [MaskingFramework.HIPAA, MaskingFramework.PCI_DSS].includes(c.metadata.id),
    ),
  }
}
