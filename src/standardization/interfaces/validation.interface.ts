/**
 * Validation system interfaces
 */

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  fixes: ValidationFix[];
  metadata: any;
  score?: number;
}

export interface ValidationIssue {
  id: string;
  message: string;
  severity: IssueSeverity;
  category: IssueCategory;
  rule: string;
  location: string;
  autoFixable: boolean;
}

export interface ValidationFix {
  issueId: string;
  description: string;
  action: string;
  parameters: any;
}

export interface ValidationRequirement {
  id: string;
  name: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  autoFixable: boolean;
}

export interface Validator {
  validate(target: any): Promise<ValidationResult>;
  getRequirements(): ValidationRequirement[];
}

export enum IssueSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum IssueCategory {
  DOCUMENTATION = 'documentation',
  STRUCTURE = 'structure',
  TESTING = 'testing',
  DATABASE = 'database',
  API = 'api',
  QUALITY = 'quality'
}