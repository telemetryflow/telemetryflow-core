/**
 * Quality gate interfaces for module standardization
 */

import { ValidationResult, ValidationRequirement } from './validation.interface';

export interface QualityGateResult {
  gateName: string;
  status: QualityStatus;
  score: number;
  requirements: RequirementResult[];
  issues: QualityIssue[];
  fixes: QualityFix[];
  executionTime: number;
  timestamp: Date;
}

export interface QualityGateResults {
  overall: QualityStatus;
  overallScore: number;
  gates: {
    documentation: QualityGateResult;
    testCoverage: QualityGateResult;
    fileStructure: QualityGateResult;
    databasePatterns: QualityGateResult;
    apiStandards: QualityGateResult;
    buildQuality: QualityGateResult;
  };
  recommendations: Recommendation[];
  automatedFixes: AutomatedFix[];
  executionTime: number;
  timestamp: Date;
}

export interface RequirementResult {
  requirement: ValidationRequirement;
  status: QualityStatus;
  score: number;
  message?: string;
  evidence?: string[];
}

export interface QualityIssue {
  id: string;
  gateName: string;
  severity: 'critical' | 'major' | 'minor';
  message: string;
  location?: string;
  rule: string;
  autoFixable: boolean;
}

export interface QualityFix {
  issueId: string;
  description: string;
  action: string;
  parameters?: Record<string, any>;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionItems: string[];
}

export interface AutomatedFix {
  id: string;
  description: string;
  affectedFiles: string[];
  riskLevel: 'low' | 'medium' | 'high';
  canExecute: boolean;
}

export enum QualityStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  NOT_CHECKED = 'not_checked'
}

export interface QualityGateValidator {
  validate(module: any): Promise<QualityGateResult>;
  getRequirements(): ValidationRequirement[];
  generateReport(result: QualityGateResult): Promise<string>;
}

export interface QualityGateOrchestrator {
  runAllGates(modulePath: string): Promise<QualityGateResults>;
  runGate(gateName: string, modulePath: string): Promise<QualityGateResult>;
  generateComprehensiveReport(results: QualityGateResults): Promise<string>;
  applyAutomatedFixes(fixes: AutomatedFix[]): Promise<void>;
}