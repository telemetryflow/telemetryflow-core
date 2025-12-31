/**
 * Error classes for standardization system
 */

export class StandardizationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'StandardizationError';
  }
}

export class ValidationError extends StandardizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class FileStructureError extends StandardizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FILE_STRUCTURE_ERROR', details);
    this.name = 'FileStructureError';
  }
}

export class CoverageError extends StandardizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'COVERAGE_ERROR', details);
    this.name = 'CoverageError';
  }
}

export class DocumentationError extends StandardizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'DOCUMENTATION_ERROR', details);
    this.name = 'DocumentationError';
  }
}

export class BuildQualityError extends StandardizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'BUILD_QUALITY_ERROR', details);
    this.name = 'BuildQualityError';
  }
}

export class ConfigurationError extends StandardizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class CLIError extends StandardizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CLI_ERROR', details);
    this.name = 'CLIError';
  }
}