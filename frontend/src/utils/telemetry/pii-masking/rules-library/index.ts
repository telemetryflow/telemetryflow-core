/**
 * PII Masking Rules Library
 * Compliance-framework policy templates for the "Rules Library" tab.
 */

// Types
export * from './types'

// Framework categories
export { GeneralPIICategory, GeneralPIITemplates }     from './frameworks/general'
export { GDPRCategory, GDPRTemplates }                 from './frameworks/gdpr'
export { HIPAACategory, HIPAATemplates }               from './frameworks/hipaa'
export { PCIDSSCategory, PCIDSSTemplates }             from './frameworks/pci-dss'
export { SOC2ISO27001Category, SOC2ISO27001Templates } from './frameworks/soc2-iso27001'
export { CCPACategory, CCPATemplates }                 from './frameworks/ccpa'

// Registry
export {
  getAllFrameworks,
  getFramework,
  getAllTemplates,
  getTemplatesByFramework,
  getTemplateById,
  searchTemplates,
  getAllFrameworkMetadata,
  getTotalTemplateCount,
  getFrameworksGrouped,
} from './registry'
