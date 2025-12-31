/**
 * Constants for module standardization system
 */

export const QUALITY_THRESHOLDS = {
  DOCUMENTATION: {
    MIN_README_LENGTH: 500,
    MIN_API_DOCS_SCORE: 80,
    MIN_DIAGRAM_COVERAGE: 90
  },
  TESTING: {
    MIN_COVERAGE: 90,
    MIN_UNIT_TESTS: 10,
    MIN_INTEGRATION_TESTS: 5,
    MIN_E2E_TESTS: 3
  },
  STRUCTURE: {
    MAX_CYCLOMATIC_COMPLEXITY: 10,
    MAX_FILE_LENGTH: 500,
    MAX_FUNCTION_LENGTH: 50
  }
};

export const REQUIRED_SECTIONS = {
  README: [
    'Overview',
    'Features',
    'Architecture',
    'API Documentation',
    'Database Schema',
    'Getting Started',
    'Testing',
    'Development'
  ],
  API_DOCS: [
    'endpoints.md',
    'authentication.md',
    'openapi.yaml'
  ],
  DIAGRAMS: [
    'ERD.mermaid.md',
    'DFD.mermaid.md'
  ]
};

export const FILE_PATTERNS = {
  DOMAIN: {
    AGGREGATES: '**/*.ts',
    VALUE_OBJECTS: '**/*.ts',
    EVENTS: '**/*.event.ts',
    REPOSITORIES: '**/I*Repository.ts',
    SERVICES: '**/*Service.ts'
  },
  APPLICATION: {
    COMMANDS: '**/*.command.ts',
    QUERIES: '**/*.query.ts',
    HANDLERS: '**/*.handler.ts',
    DTOS: '**/*.dto.ts'
  },
  INFRASTRUCTURE: {
    ENTITIES: '**/*.entity.ts',
    REPOSITORIES: '**/*Repository.ts',
    MAPPERS: '**/*Mapper.ts',
    MIGRATIONS: '**/migrations/**/*.ts',
    SEEDS: '**/seeds/**/*.ts'
  },
  PRESENTATION: {
    CONTROLLERS: '**/*.controller.ts',
    DTOS: '**/*.dto.ts',
    GUARDS: '**/*Guard.ts',
    DECORATORS: '**/*Decorator.ts'
  },
  TESTS: {
    UNIT: '**/*.spec.ts',
    INTEGRATION: '**/*.integration.spec.ts',
    E2E: '**/*.e2e.spec.ts',
    POSTMAN: '**/*.postman_collection.json'
  }
};

export const VALIDATION_RULES = {
  NAMING: {
    PASCAL_CASE: /^[A-Z][a-zA-Z0-9]*$/,
    CAMEL_CASE: /^[a-z][a-zA-Z0-9]*$/,
    KEBAB_CASE: /^[a-z][a-z0-9-]*$/,
    SNAKE_CASE: /^[a-z][a-z0-9_]*$/
  },
  FILE_EXTENSIONS: {
    TYPESCRIPT: '.ts',
    MARKDOWN: '.md',
    YAML: '.yaml',
    JSON: '.json'
  }
};