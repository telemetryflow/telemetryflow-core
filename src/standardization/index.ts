/**
 * TelemetryFlow Core - Module Standardization System
 * 
 * This system provides comprehensive quality gates and automation tools
 * to ensure modules meet all standardization requirements.
 */

// Core interfaces
export * from './interfaces/validation.interface';
export * from './interfaces/quality-gate.interface';
export * from './interfaces/module-structure.interface';
export * from './interfaces/coverage.interface';
export * from './interfaces/cli.interface';

// Documentation interfaces (avoid conflicts)
export type { 
  DocumentationValidator as IDocumentationValidator,
  ReadmeValidation,
  ApiDocsValidation,
  DiagramValidation,
  ApiDocumentation
} from './interfaces/documentation.interface';

// Types and enums
export * from './types';

// Validators
export * from './validators';

// Generators
export * from './generators';

// CLI tools (to be implemented)
// export * from './cli';

// Utils (to be implemented)
// export * from './utils';