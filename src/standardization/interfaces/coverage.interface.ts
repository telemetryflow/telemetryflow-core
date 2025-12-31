/**
 * Test coverage interfaces for standardization validation
 */

export interface TestCoverageAnalyzer {
  analyzeCoverage(modulePath: string): Promise<CoverageReport>;
  validateThresholds(coverage: CoverageReport): Promise<ThresholdValidation>;
  generateCoverageReport(coverage: CoverageReport): Promise<string>;
  identifyUncoveredCode(coverage: CoverageReport): Promise<UncoveredCode[]>;
}

export interface CoverageReport {
  overall: CoverageMetrics;
  byLayer: LayerCoverage;
  byFile: FileCoverageInfo[];
  uncoveredLines: UncoveredLine[];
  thresholds: CoverageThresholds;
  timestamp: Date;
  testRunInfo: TestRunInfo;
}

export interface CoverageMetrics {
  lines: CoveragePercentage;
  functions: CoveragePercentage;
  branches: CoveragePercentage;
  statements: CoveragePercentage;
}

export interface LayerCoverage {
  domain: CoverageMetrics;
  application: CoverageMetrics;
  infrastructure: CoverageMetrics;
  presentation: CoverageMetrics;
}

export interface CoveragePercentage {
  total: number;
  covered: number;
  percentage: number;
  threshold?: number;
  meetsThreshold: boolean;
}

export interface FileCoverageInfo {
  filePath: string;
  layer: 'domain' | 'application' | 'infrastructure' | 'presentation';
  coverage: CoverageMetrics;
  uncoveredLines: number[];
  complexity: number;
  testFiles: string[];
}

export interface UncoveredLine {
  filePath: string;
  lineNumber: number;
  content: string;
  type: 'statement' | 'branch' | 'function';
  complexity: number;
  priority: 'high' | 'medium' | 'low';
}

export interface UncoveredCode {
  filePath: string;
  layer: string;
  uncoveredLines: UncoveredLine[];
  suggestedTests: TestSuggestion[];
  priority: 'high' | 'medium' | 'low';
}

export interface TestSuggestion {
  type: 'unit' | 'integration' | 'e2e';
  description: string;
  testFilePath: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface CoverageThresholds {
  domain: CoverageMetrics;
  application: CoverageMetrics;
  infrastructure: CoverageMetrics;
  presentation: CoverageMetrics;
  overall: CoverageMetrics;
}

export interface ThresholdValidation {
  isValid: boolean;
  overallScore: number;
  layerResults: LayerThresholdResult[];
  violations: ThresholdViolation[];
  recommendations: CoverageRecommendation[];
}

export interface LayerThresholdResult {
  layer: 'domain' | 'application' | 'infrastructure' | 'presentation' | 'overall';
  meetsThreshold: boolean;
  score: number;
  coverage: CoverageMetrics;
  thresholds: CoverageMetrics;
  gaps: CoverageGap[];
}

export interface ThresholdViolation {
  layer: string;
  metric: 'lines' | 'functions' | 'branches' | 'statements';
  actual: number;
  required: number;
  gap: number;
  severity: 'critical' | 'major' | 'minor';
}

export interface CoverageGap {
  metric: 'lines' | 'functions' | 'branches' | 'statements';
  actual: number;
  required: number;
  gap: number;
  affectedFiles: string[];
}

export interface CoverageRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  suggestedActions: string[];
  affectedFiles: string[];
}

export interface TestRunInfo {
  testFramework: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  timestamp: Date;
}

export interface TestStructureValidator {
  validateTestStructure(testsPath: string): Promise<TestStructureValidation>;
  validateTestNaming(testFiles: string[]): Promise<TestNamingValidation>;
  validateTestPatterns(testFiles: string[]): Promise<TestPatternValidation>;
}

export interface TestStructureValidation {
  isValid: boolean;
  score: number;
  hasUnitTests: boolean;
  hasIntegrationTests: boolean;
  hasE2ETests: boolean;
  hasFixtures: boolean;
  hasMocks: boolean;
  directoryStructure: DirectoryStructureValidation;
  issues: TestStructureIssue[];
}

export interface DirectoryStructureValidation {
  hasTestDirectory: boolean;
  hasUnitDirectory: boolean;
  hasIntegrationDirectory: boolean;
  hasE2EDirectory: boolean;
  hasFixturesDirectory: boolean;
  hasMocksDirectory: boolean;
  extraDirectories: string[];
}

export interface TestNamingValidation {
  isValid: boolean;
  score: number;
  validNames: string[];
  invalidNames: TestNamingIssue[];
  conventions: TestNamingConvention[];
}

export interface TestNamingIssue {
  filePath: string;
  issue: string;
  suggestion: string;
  severity: 'error' | 'warning';
}

export interface TestNamingConvention {
  pattern: string;
  description: string;
  examples: string[];
  required: boolean;
}

export interface TestPatternValidation {
  isValid: boolean;
  score: number;
  patterns: TestPatternResult[];
  issues: TestPatternIssue[];
}

export interface TestPatternResult {
  pattern: string;
  description: string;
  found: boolean;
  examples: string[];
  score: number;
}

export interface TestPatternIssue {
  filePath: string;
  pattern: string;
  issue: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}

export interface TestStructureIssue {
  type: 'missing_directory' | 'missing_file' | 'invalid_structure' | 'naming_violation';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion?: string;
  autoFixable: boolean;
}