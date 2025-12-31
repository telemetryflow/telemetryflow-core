/**
 * Enums for standardization system
 */

export enum StandardizationModule {
  IAM = 'iam',
  AUDIT = 'audit',
  AUTH = 'auth',
  CACHE = 'cache'
}

export enum QualityGate {
  DOCUMENTATION = 'documentation',
  TEST_COVERAGE = 'test_coverage',
  FILE_STRUCTURE = 'file_structure',
  DATABASE_PATTERNS = 'database_patterns',
  API_STANDARDS = 'api_standards',
  BUILD_QUALITY = 'build_quality'
}

export enum DDDLayer {
  DOMAIN = 'domain',
  APPLICATION = 'application',
  INFRASTRUCTURE = 'infrastructure',
  PRESENTATION = 'presentation'
}

export enum FileType {
  AGGREGATE = 'aggregate',
  ENTITY = 'entity',
  VALUE_OBJECT = 'value_object',
  DOMAIN_EVENT = 'domain_event',
  REPOSITORY_INTERFACE = 'repository_interface',
  DOMAIN_SERVICE = 'domain_service',
  COMMAND = 'command',
  QUERY = 'query',
  HANDLER = 'handler',
  DTO = 'dto',
  REPOSITORY_IMPLEMENTATION = 'repository_implementation',
  MAPPER = 'mapper',
  MIGRATION = 'migration',
  SEED = 'seed',
  PROCESSOR = 'processor',
  CONTROLLER = 'controller',
  GUARD = 'guard',
  DECORATOR = 'decorator'
}

export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PROPERTY_BASED = 'property_based'
}

export enum DocumentationType {
  README = 'readme',
  API_DOCS = 'api_docs',
  ERD = 'erd',
  DFD = 'dfd',
  ARCHITECTURE = 'architecture',
  TESTING_GUIDE = 'testing_guide'
}

export enum ValidationSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  INFO = 'info'
}

export enum FixType {
  AUTOMATED = 'automated',
  MANUAL = 'manual',
  INTERACTIVE = 'interactive'
}

export enum ReportFormat {
  JSON = 'json',
  HTML = 'html',
  TEXT = 'text',
  MARKDOWN = 'markdown',
  PDF = 'pdf'
}