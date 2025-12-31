/**
 * CLI interfaces for standardization tools
 */

import { QualityGateResults } from './quality-gate.interface';
import { CoverageReport } from './coverage.interface';
import { ValidationResult } from './validation.interface';

export interface StandardizationCLI {
  validateModule(moduleName: string, options?: ValidationOptions): Promise<ValidationResult>;
  generateDocs(moduleName: string, options?: DocumentationOptions): Promise<void>;
  checkCoverage(moduleName: string, options?: CoverageOptions): Promise<CoverageReport>;
  fixStructure(moduleName: string, options?: FixOptions): Promise<StructureFixes>;
  runQualityGates(moduleName: string, options?: QualityGateOptions): Promise<QualityGateResults>;
}

export interface ValidationOptions {
  gates?: string[];
  autoFix?: boolean;
  verbose?: boolean;
  outputFormat?: 'json' | 'text' | 'html';
  outputFile?: string;
  failOnError?: boolean;
}

export interface DocumentationOptions {
  sections?: string[];
  format?: 'markdown' | 'html' | 'pdf';
  outputDir?: string;
  includeExamples?: boolean;
  includeDiagrams?: boolean;
  template?: string;
}

export interface CoverageOptions {
  layers?: string[];
  format?: 'json' | 'text' | 'html' | 'lcov';
  outputFile?: string;
  threshold?: number;
  failOnThreshold?: boolean;
}

export interface FixOptions {
  dryRun?: boolean;
  backup?: boolean;
  categories?: string[];
  interactive?: boolean;
  force?: boolean;
}

export interface QualityGateOptions {
  gates?: string[];
  parallel?: boolean;
  continueOnFailure?: boolean;
  outputFormat?: 'json' | 'text' | 'html';
  outputFile?: string;
  generateReport?: boolean;
}

export interface StructureFixes {
  applied: StructureFix[];
  skipped: StructureFix[];
  failed: StructureFix[];
  summary: FixSummary;
}

export interface StructureFix {
  id: string;
  description: string;
  type: 'create' | 'update' | 'delete' | 'rename';
  filePath: string;
  status: 'applied' | 'skipped' | 'failed';
  error?: string;
  backup?: string;
}

export interface FixSummary {
  totalFixes: number;
  appliedFixes: number;
  skippedFixes: number;
  failedFixes: number;
  filesModified: number;
  backupsCreated: number;
}

export interface CLICommand {
  name: string;
  description: string;
  options: CLIOption[];
  examples: CLIExample[];
  execute(args: string[], options: Record<string, any>): Promise<void>;
}

export interface CLIOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  defaultValue?: any;
  choices?: string[];
}

export interface CLIExample {
  command: string;
  description: string;
  output?: string;
}

export interface CLIOutput {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
  executionTime: number;
}

export interface ProgressReporter {
  start(total: number, message?: string): void;
  update(current: number, message?: string): void;
  increment(message?: string): void;
  complete(message?: string): void;
  fail(error: string): void;
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  verbose(message: string, ...args: any[]): void;
}

export interface ConfigManager {
  load(configPath?: string): Promise<StandardizationConfig>;
  save(config: StandardizationConfig, configPath?: string): Promise<void>;
  validate(config: StandardizationConfig): ValidationResult;
  merge(configs: StandardizationConfig[]): StandardizationConfig;
}

export interface StandardizationConfig {
  version: string;
  modules: ModuleConfig[];
  qualityGates: QualityGateConfig[];
  thresholds: ThresholdConfig;
  templates: TemplateConfig[];
  plugins: PluginConfig[];
}

export interface ModuleConfig {
  name: string;
  path: string;
  enabled: boolean;
  excludePatterns?: string[];
  customRules?: CustomRule[];
}

export interface QualityGateConfig {
  name: string;
  enabled: boolean;
  weight: number;
  thresholds: Record<string, number>;
  rules: RuleConfig[];
}

export interface ThresholdConfig {
  coverage: {
    overall: number;
    domain: number;
    application: number;
    infrastructure: number;
    presentation: number;
  };
  quality: {
    documentation: number;
    fileStructure: number;
    apiStandards: number;
    buildQuality: number;
  };
}

export interface TemplateConfig {
  name: string;
  type: 'readme' | 'api-docs' | 'diagram';
  path: string;
  variables: Record<string, any>;
}

export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  autoFixable: boolean;
}

export interface RuleConfig {
  id: string;
  enabled: boolean;
  severity?: 'error' | 'warning' | 'info';
  options?: Record<string, any>;
}