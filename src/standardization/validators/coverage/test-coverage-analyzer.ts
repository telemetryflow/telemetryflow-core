/**
 * Test Coverage Analyzer
 * Implements coverage data parser for Jest output and coverage threshold validation
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TestCoverageAnalyzer,
  CoverageReport,
  CoverageMetrics,
  LayerCoverage,
  FileCoverageInfo,
  UncoveredLine,
  UncoveredCode,
  ThresholdValidation,
  LayerThresholdResult,
  ThresholdViolation,
  CoverageRecommendation,
  TestRunInfo,
  CoverageThresholds,
  CoveragePercentage,
  TestSuggestion,
  CoverageGap
} from '../../interfaces/coverage.interface';

@Injectable()
export class TestCoverageAnalyzerService implements TestCoverageAnalyzer {
  private readonly logger = new Logger(TestCoverageAnalyzerService.name);

  // Coverage thresholds as defined in requirements
  private readonly DEFAULT_THRESHOLDS: CoverageThresholds = {
    domain: {
      lines: { total: 0, covered: 0, percentage: 95, threshold: 95, meetsThreshold: false },
      functions: { total: 0, covered: 0, percentage: 95, threshold: 95, meetsThreshold: false },
      branches: { total: 0, covered: 0, percentage: 95, threshold: 95, meetsThreshold: false },
      statements: { total: 0, covered: 0, percentage: 95, threshold: 95, meetsThreshold: false }
    },
    application: {
      lines: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false },
      functions: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false },
      branches: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false },
      statements: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false }
    },
    infrastructure: {
      lines: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false },
      functions: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false },
      branches: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false },
      statements: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false }
    },
    presentation: {
      lines: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false },
      functions: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false },
      branches: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false },
      statements: { total: 0, covered: 0, percentage: 85, threshold: 85, meetsThreshold: false }
    },
    overall: {
      lines: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false },
      functions: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false },
      branches: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false },
      statements: { total: 0, covered: 0, percentage: 90, threshold: 90, meetsThreshold: false }
    }
  };

  /**
   * Analyze test coverage for a module
   */
  async analyzeCoverage(modulePath: string): Promise<CoverageReport> {
    this.logger.log(`Analyzing coverage for module: ${modulePath}`);

    try {
      // Parse Jest coverage data
      const jestCoverageData = await this.parseJestCoverageData(modulePath);
      
      // Analyze by layer
      const layerCoverage = await this.analyzeByLayer(modulePath, jestCoverageData);
      
      // Calculate overall metrics
      const overallMetrics = this.calculateOverallMetrics(layerCoverage);
      
      // Get file-level coverage
      const fileCoverage = await this.getFileCoverageInfo(modulePath, jestCoverageData);
      
      // Identify uncovered lines
      const uncoveredLines = await this.identifyUncoveredLines(fileCoverage);
      
      // Get test run info
      const testRunInfo = await this.getTestRunInfo(modulePath);

      const report: CoverageReport = {
        overall: overallMetrics,
        byLayer: layerCoverage,
        byFile: fileCoverage,
        uncoveredLines,
        thresholds: this.DEFAULT_THRESHOLDS,
        timestamp: new Date(),
        testRunInfo
      };

      this.logger.log(`Coverage analysis completed. Overall: ${overallMetrics.lines.percentage}%`);
      return report;

    } catch (error) {
      this.logger.error(`Failed to analyze coverage: ${error.message}`, error.stack);
      throw new Error(`Coverage analysis failed: ${error.message}`);
    }
  }

  /**
   * Validate coverage against thresholds
   */
  async validateThresholds(coverage: CoverageReport): Promise<ThresholdValidation> {
    this.logger.log('Validating coverage thresholds');

    const layerResults: LayerThresholdResult[] = [];
    const violations: ThresholdViolation[] = [];

    // Validate each layer
    for (const [layerName, layerCoverage] of Object.entries(coverage.byLayer)) {
      const thresholds = coverage.thresholds[layerName as keyof LayerCoverage];
      const result = this.validateLayerThresholds(layerName, layerCoverage, thresholds);
      layerResults.push(result);

      // Collect violations
      violations.push(...result.gaps.map(gap => ({
        layer: layerName,
        metric: gap.metric,
        actual: gap.actual,
        required: gap.required,
        gap: gap.gap,
        severity: this.determineSeverity(gap.gap, gap.required)
      })));
    }

    // Validate overall coverage
    const overallResult = this.validateLayerThresholds('overall', coverage.overall, coverage.thresholds.overall);
    layerResults.push(overallResult);

    const isValid = layerResults.every(result => result.meetsThreshold);
    const overallScore = this.calculateOverallScore(layerResults);
    const recommendations = await this.generateRecommendations(coverage, violations);

    return {
      isValid,
      overallScore,
      layerResults,
      violations,
      recommendations
    };
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport(coverage: CoverageReport): Promise<string> {
    const validation = await this.validateThresholds(coverage);
    
    let report = '# Test Coverage Report\n\n';
    report += `Generated: ${coverage.timestamp.toISOString()}\n\n`;
    
    // Overall summary
    report += '## Overall Coverage\n\n';
    report += `| Metric | Coverage | Threshold | Status |\n`;
    report += `|--------|----------|-----------|--------|\n`;
    report += `| Lines | ${coverage.overall.lines.percentage.toFixed(2)}% | ${coverage.thresholds.overall.lines.threshold}% | ${coverage.overall.lines.meetsThreshold ? '✅' : '❌'} |\n`;
    report += `| Functions | ${coverage.overall.functions.percentage.toFixed(2)}% | ${coverage.thresholds.overall.functions.threshold}% | ${coverage.overall.functions.meetsThreshold ? '✅' : '❌'} |\n`;
    report += `| Branches | ${coverage.overall.branches.percentage.toFixed(2)}% | ${coverage.thresholds.overall.branches.threshold}% | ${coverage.overall.branches.meetsThreshold ? '✅' : '❌'} |\n`;
    report += `| Statements | ${coverage.overall.statements.percentage.toFixed(2)}% | ${coverage.thresholds.overall.statements.threshold}% | ${coverage.overall.statements.meetsThreshold ? '✅' : '❌'} |\n\n`;

    // Layer-by-layer breakdown
    report += '## Coverage by Layer\n\n';
    for (const [layerName, layerCoverage] of Object.entries(coverage.byLayer)) {
      const threshold = coverage.thresholds[layerName as keyof LayerCoverage];
      report += `### ${layerName.charAt(0).toUpperCase() + layerName.slice(1)} Layer\n\n`;
      report += `| Metric | Coverage | Threshold | Status |\n`;
      report += `|--------|----------|-----------|--------|\n`;
      report += `| Lines | ${layerCoverage.lines.percentage.toFixed(2)}% | ${threshold.lines.threshold}% | ${layerCoverage.lines.meetsThreshold ? '✅' : '❌'} |\n`;
      report += `| Functions | ${layerCoverage.functions.percentage.toFixed(2)}% | ${threshold.functions.threshold}% | ${layerCoverage.functions.meetsThreshold ? '✅' : '❌'} |\n`;
      report += `| Branches | ${layerCoverage.branches.percentage.toFixed(2)}% | ${threshold.branches.threshold}% | ${layerCoverage.branches.meetsThreshold ? '✅' : '❌'} |\n`;
      report += `| Statements | ${layerCoverage.statements.percentage.toFixed(2)}% | ${threshold.statements.threshold}% | ${layerCoverage.statements.meetsThreshold ? '✅' : '❌'} |\n\n`;
    }

    // Violations
    if (validation.violations.length > 0) {
      report += '## Coverage Violations\n\n';
      for (const violation of validation.violations) {
        report += `- **${violation.layer}** ${violation.metric}: ${violation.actual.toFixed(2)}% (required: ${violation.required}%, gap: ${violation.gap.toFixed(2)}%)\n`;
      }
      report += '\n';
    }

    // Recommendations
    if (validation.recommendations.length > 0) {
      report += '## Recommendations\n\n';
      for (const rec of validation.recommendations) {
        report += `### ${rec.title}\n\n`;
        report += `${rec.description}\n\n`;
        report += `**Priority:** ${rec.priority}\n`;
        report += `**Estimated Impact:** ${rec.estimatedImpact}%\n\n`;
        if (rec.suggestedActions.length > 0) {
          report += '**Suggested Actions:**\n';
          for (const action of rec.suggestedActions) {
            report += `- ${action}\n`;
          }
          report += '\n';
        }
      }
    }

    return report;
  }

  /**
   * Identify uncovered code sections
   */
  async identifyUncoveredCode(coverage: CoverageReport): Promise<UncoveredCode[]> {
    const uncoveredSections: UncoveredCode[] = [];

    // Group uncovered lines by file and layer
    const fileGroups = new Map<string, UncoveredLine[]>();
    for (const line of coverage.uncoveredLines) {
      if (!fileGroups.has(line.filePath)) {
        fileGroups.set(line.filePath, []);
      }
      fileGroups.get(line.filePath)!.push(line);
    }

    // Create uncovered code sections
    const filePathsArray = Array.from(fileGroups.keys());
    for (const filePath of filePathsArray) {
      const lines = fileGroups.get(filePath)!;
      const fileInfo = coverage.byFile.find(f => f.filePath === filePath);
      if (!fileInfo) continue;

      const suggestions = await this.generateTestSuggestions(filePath, lines, fileInfo.layer);
      const priority = this.calculatePriority(lines);

      uncoveredSections.push({
        filePath,
        layer: fileInfo.layer,
        uncoveredLines: lines,
        suggestedTests: suggestions,
        priority
      });
    }

    return uncoveredSections.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Parse Jest coverage data from lcov.info or coverage-summary.json
   */
  private async parseJestCoverageData(modulePath: string): Promise<any> {
    const coverageDir = path.join(process.cwd(), 'coverage');
    
    try {
      // Try to read coverage-summary.json first
      const summaryPath = path.join(coverageDir, 'coverage-summary.json');
      const summaryExists = await fs.access(summaryPath).then(() => true).catch(() => false);
      
      if (summaryExists) {
        const summaryContent = await fs.readFile(summaryPath, 'utf-8');
        return JSON.parse(summaryContent);
      }

      // Fallback to lcov.info parsing
      const lcovPath = path.join(coverageDir, 'lcov.info');
      const lcovExists = await fs.access(lcovPath).then(() => true).catch(() => false);
      
      if (lcovExists) {
        const lcovContent = await fs.readFile(lcovPath, 'utf-8');
        return this.parseLcovData(lcovContent);
      }

      // If no coverage data found, return empty structure
      this.logger.warn('No coverage data found, returning empty coverage');
      return { total: { lines: { pct: 0 }, functions: { pct: 0 }, branches: { pct: 0 }, statements: { pct: 0 } } };

    } catch (error) {
      this.logger.error(`Failed to parse coverage data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse LCOV format data
   */
  private parseLcovData(lcovContent: string): any {
    const files: any = {};
    const lines = lcovContent.split('\n');
    let currentFile = '';

    for (const line of lines) {
      if (line.startsWith('SF:')) {
        currentFile = line.substring(3);
        files[currentFile] = {
          lines: { total: 0, covered: 0, pct: 0 },
          functions: { total: 0, covered: 0, pct: 0 },
          branches: { total: 0, covered: 0, pct: 0 },
          statements: { total: 0, covered: 0, pct: 0 }
        };
      } else if (line.startsWith('LF:')) {
        files[currentFile].lines.total = parseInt(line.substring(3));
      } else if (line.startsWith('LH:')) {
        files[currentFile].lines.covered = parseInt(line.substring(3));
        files[currentFile].lines.pct = files[currentFile].lines.total > 0 
          ? (files[currentFile].lines.covered / files[currentFile].lines.total) * 100 
          : 0;
      } else if (line.startsWith('BRF:')) {
        files[currentFile].branches.total = parseInt(line.substring(4));
      } else if (line.startsWith('BRH:')) {
        files[currentFile].branches.covered = parseInt(line.substring(4));
        files[currentFile].branches.pct = files[currentFile].branches.total > 0 
          ? (files[currentFile].branches.covered / files[currentFile].branches.total) * 100 
          : 0;
      } else if (line.startsWith('FNF:')) {
        files[currentFile].functions.total = parseInt(line.substring(4));
      } else if (line.startsWith('FNH:')) {
        files[currentFile].functions.covered = parseInt(line.substring(4));
        files[currentFile].functions.pct = files[currentFile].functions.total > 0 
          ? (files[currentFile].functions.covered / files[currentFile].functions.total) * 100 
          : 0;
      }
    }

    // Calculate statements as same as lines for LCOV
    Object.keys(files).forEach(file => {
      files[file].statements = { ...files[file].lines };
    });

    return files;
  }

  /**
   * Analyze coverage by DDD layer
   */
  private async analyzeByLayer(modulePath: string, coverageData: any): Promise<LayerCoverage> {
    const layers = {
      domain: await this.getLayerCoverage(modulePath, 'domain', coverageData),
      application: await this.getLayerCoverage(modulePath, 'application', coverageData),
      infrastructure: await this.getLayerCoverage(modulePath, 'infrastructure', coverageData),
      presentation: await this.getLayerCoverage(modulePath, 'presentation', coverageData)
    };

    return layers;
  }

  /**
   * Get coverage metrics for a specific layer
   */
  private async getLayerCoverage(modulePath: string, layer: string, coverageData: any): Promise<CoverageMetrics> {
    const layerPath = path.join(modulePath, layer);
    const layerFiles = await this.getLayerFiles(layerPath);
    
    let totalLines = 0, coveredLines = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalStatements = 0, coveredStatements = 0;

    for (const file of layerFiles) {
      const relativePath = path.relative(process.cwd(), file);
      const fileData = coverageData[relativePath] || coverageData[file];
      
      if (fileData) {
        totalLines += fileData.lines?.total || 0;
        coveredLines += fileData.lines?.covered || 0;
        totalFunctions += fileData.functions?.total || 0;
        coveredFunctions += fileData.functions?.covered || 0;
        totalBranches += fileData.branches?.total || 0;
        coveredBranches += fileData.branches?.covered || 0;
        totalStatements += fileData.statements?.total || 0;
        coveredStatements += fileData.statements?.covered || 0;
      }
    }

    const thresholds = this.DEFAULT_THRESHOLDS[layer as keyof CoverageThresholds];

    return {
      lines: this.createCoveragePercentage(totalLines, coveredLines, thresholds.lines.threshold!),
      functions: this.createCoveragePercentage(totalFunctions, coveredFunctions, thresholds.functions.threshold!),
      branches: this.createCoveragePercentage(totalBranches, coveredBranches, thresholds.branches.threshold!),
      statements: this.createCoveragePercentage(totalStatements, coveredStatements, thresholds.statements.threshold!)
    };
  }

  /**
   * Get all TypeScript files in a layer
   */
  private async getLayerFiles(layerPath: string): Promise<string[]> {
    try {
      const files: string[] = [];
      await this.walkDirectory(layerPath, files);
      return files.filter(file => 
        file.endsWith('.ts') && 
        !file.endsWith('.spec.ts') && 
        !file.endsWith('.test.ts') && 
        !file.endsWith('.d.ts')
      );
    } catch (error) {
      this.logger.warn(`Could not find files in layer ${layerPath}: ${error.message}`);
      return [];
    }
  }

  /**
   * Recursively walk directory to find files
   */
  private async walkDirectory(dirPath: string, files: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.walkDirectory(fullPath, files);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  /**
   * Create coverage percentage object
   */
  private createCoveragePercentage(total: number, covered: number, threshold: number): CoveragePercentage {
    const percentage = total > 0 ? (covered / total) * 100 : 0;
    return {
      total,
      covered,
      percentage,
      threshold,
      meetsThreshold: percentage >= threshold
    };
  }

  /**
   * Calculate overall metrics from layer coverage
   */
  private calculateOverallMetrics(layerCoverage: LayerCoverage): CoverageMetrics {
    const layers = Object.values(layerCoverage);
    
    const totalLines = layers.reduce((sum, layer) => sum + layer.lines.total, 0);
    const coveredLines = layers.reduce((sum, layer) => sum + layer.lines.covered, 0);
    const totalFunctions = layers.reduce((sum, layer) => sum + layer.functions.total, 0);
    const coveredFunctions = layers.reduce((sum, layer) => sum + layer.functions.covered, 0);
    const totalBranches = layers.reduce((sum, layer) => sum + layer.branches.total, 0);
    const coveredBranches = layers.reduce((sum, layer) => sum + layer.branches.covered, 0);
    const totalStatements = layers.reduce((sum, layer) => sum + layer.statements.total, 0);
    const coveredStatements = layers.reduce((sum, layer) => sum + layer.statements.covered, 0);

    return {
      lines: this.createCoveragePercentage(totalLines, coveredLines, 90),
      functions: this.createCoveragePercentage(totalFunctions, coveredFunctions, 90),
      branches: this.createCoveragePercentage(totalBranches, coveredBranches, 90),
      statements: this.createCoveragePercentage(totalStatements, coveredStatements, 90)
    };
  }

  /**
   * Get file-level coverage information
   */
  private async getFileCoverageInfo(modulePath: string, coverageData: any): Promise<FileCoverageInfo[]> {
    const fileInfos: FileCoverageInfo[] = [];
    
    for (const [filePath, data] of Object.entries(coverageData)) {
      if (typeof data !== 'object' || !data) continue;
      
      const fileData = data as any; // Type assertion for coverage data
      const layer = this.determineLayer(filePath);
      if (!layer) continue;

      const testFiles = await this.findTestFiles(filePath);
      
      fileInfos.push({
        filePath,
        layer,
        coverage: {
          lines: this.createCoveragePercentage(fileData.lines?.total || 0, fileData.lines?.covered || 0, 90),
          functions: this.createCoveragePercentage(fileData.functions?.total || 0, fileData.functions?.covered || 0, 90),
          branches: this.createCoveragePercentage(fileData.branches?.total || 0, fileData.branches?.covered || 0, 90),
          statements: this.createCoveragePercentage(fileData.statements?.total || 0, fileData.statements?.covered || 0, 90)
        },
        uncoveredLines: [], // Will be populated by identifyUncoveredLines
        complexity: 1, // Simplified complexity calculation
        testFiles
      });
    }

    return fileInfos;
  }

  /**
   * Determine which DDD layer a file belongs to
   */
  private determineLayer(filePath: string): 'domain' | 'application' | 'infrastructure' | 'presentation' | null {
    if (filePath.includes('/domain/')) return 'domain';
    if (filePath.includes('/application/')) return 'application';
    if (filePath.includes('/infrastructure/')) return 'infrastructure';
    if (filePath.includes('/presentation/')) return 'presentation';
    return null;
  }

  /**
   * Find test files for a given source file
   */
  private async findTestFiles(filePath: string): Promise<string[]> {
    const baseName = path.basename(filePath, '.ts');
    const dirName = path.dirname(filePath);
    
    const testPatterns = [
      path.join(dirName, `${baseName}.spec.ts`),
      path.join(dirName, `${baseName}.test.ts`),
      path.join(dirName, '__tests__', `${baseName}.spec.ts`),
      path.join(dirName, '__tests__', `${baseName}.test.ts`)
    ];

    const testFiles: string[] = [];
    for (const pattern of testPatterns) {
      try {
        await fs.access(pattern);
        testFiles.push(pattern);
      } catch {
        // File doesn't exist, continue
      }
    }

    return testFiles;
  }

  /**
   * Identify uncovered lines from coverage data
   */
  private async identifyUncoveredLines(fileCoverage: FileCoverageInfo[]): Promise<UncoveredLine[]> {
    const uncoveredLines: UncoveredLine[] = [];

    for (const fileInfo of fileCoverage) {
      // This is a simplified implementation
      // In a real scenario, you'd parse detailed coverage data to get actual uncovered lines
      if (fileInfo.coverage.lines.percentage < 100) {
        const estimatedUncoveredCount = Math.ceil(
          fileInfo.coverage.lines.total * (1 - fileInfo.coverage.lines.percentage / 100)
        );

        for (let i = 0; i < estimatedUncoveredCount; i++) {
          uncoveredLines.push({
            filePath: fileInfo.filePath,
            lineNumber: i + 1, // Simplified line numbering
            content: '// Uncovered line',
            type: 'statement',
            complexity: 1,
            priority: fileInfo.layer === 'domain' ? 'high' : 'medium'
          });
        }
      }
    }

    return uncoveredLines;
  }

  /**
   * Get test run information
   */
  private async getTestRunInfo(modulePath: string): Promise<TestRunInfo> {
    // This would typically parse Jest test results
    // For now, return a default structure
    return {
      testFramework: 'Jest',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      timestamp: new Date()
    };
  }

  /**
   * Validate layer thresholds
   */
  private validateLayerThresholds(
    layerName: string, 
    coverage: CoverageMetrics, 
    thresholds: CoverageMetrics
  ): LayerThresholdResult {
    const gaps: CoverageGap[] = [];
    
    // Check each metric
    const metrics: (keyof CoverageMetrics)[] = ['lines', 'functions', 'branches', 'statements'];
    for (const metric of metrics) {
      const actual = coverage[metric].percentage;
      const required = thresholds[metric].threshold || 0;
      
      if (actual < required) {
        gaps.push({
          metric,
          actual,
          required,
          gap: required - actual,
          affectedFiles: [] // Would be populated with actual file analysis
        });
      }
    }

    const meetsThreshold = gaps.length === 0;
    const score = this.calculateLayerScore(coverage, thresholds);

    return {
      layer: layerName as any,
      meetsThreshold,
      score,
      coverage,
      thresholds,
      gaps
    };
  }

  /**
   * Calculate layer score
   */
  private calculateLayerScore(coverage: CoverageMetrics, thresholds: CoverageMetrics): number {
    const metrics: (keyof CoverageMetrics)[] = ['lines', 'functions', 'branches', 'statements'];
    let totalScore = 0;

    for (const metric of metrics) {
      const actual = coverage[metric].percentage;
      const threshold = thresholds[metric].threshold || 0;
      const score = Math.min(100, (actual / threshold) * 100);
      totalScore += score;
    }

    return totalScore / metrics.length;
  }

  /**
   * Determine violation severity
   */
  private determineSeverity(gap: number, required: number): 'critical' | 'major' | 'minor' {
    const gapPercentage = (gap / required) * 100;
    
    if (gapPercentage > 20) return 'critical';
    if (gapPercentage > 10) return 'major';
    return 'minor';
  }

  /**
   * Calculate overall score from layer results
   */
  private calculateOverallScore(layerResults: LayerThresholdResult[]): number {
    if (layerResults.length === 0) return 0;
    
    const totalScore = layerResults.reduce((sum, result) => sum + result.score, 0);
    return totalScore / layerResults.length;
  }

  /**
   * Generate coverage recommendations
   */
  private async generateRecommendations(
    coverage: CoverageReport, 
    violations: ThresholdViolation[]
  ): Promise<CoverageRecommendation[]> {
    const recommendations: CoverageRecommendation[] = [];

    // Group violations by layer
    const violationsByLayer = violations.reduce((acc, violation) => {
      if (!acc[violation.layer]) acc[violation.layer] = [];
      acc[violation.layer].push(violation);
      return acc;
    }, {} as Record<string, ThresholdViolation[]>);

    for (const [layer, layerViolations] of Object.entries(violationsByLayer)) {
      const criticalViolations = layerViolations.filter(v => v.severity === 'critical');
      
      if (criticalViolations.length > 0) {
        recommendations.push({
          id: `${layer}-critical-coverage`,
          title: `Critical Coverage Gap in ${layer} Layer`,
          description: `The ${layer} layer has critical coverage gaps that need immediate attention.`,
          priority: 'high',
          estimatedImpact: Math.max(...criticalViolations.map(v => v.gap)),
          suggestedActions: [
            `Add unit tests for uncovered ${layer} components`,
            `Focus on high-complexity functions first`,
            `Review and improve existing test quality`
          ],
          affectedFiles: [] // Would be populated with actual file analysis
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate test suggestions for uncovered code
   */
  private async generateTestSuggestions(
    filePath: string, 
    uncoveredLines: UncoveredLine[], 
    layer: string
  ): Promise<TestSuggestion[]> {
    const suggestions: TestSuggestion[] = [];
    
    const baseName = path.basename(filePath, '.ts');
    const testFileName = `${baseName}.spec.ts`;
    
    if (layer === 'domain') {
      suggestions.push({
        type: 'unit',
        description: `Add unit tests for ${baseName} domain logic`,
        testFilePath: path.join(path.dirname(filePath), '__tests__', testFileName),
        estimatedEffort: uncoveredLines.length > 10 ? 'high' : 'medium'
      });
    } else if (layer === 'application') {
      suggestions.push({
        type: 'unit',
        description: `Add unit tests for ${baseName} handlers`,
        testFilePath: path.join(path.dirname(filePath), '__tests__', testFileName),
        estimatedEffort: 'medium'
      });
    } else if (layer === 'infrastructure') {
      suggestions.push({
        type: 'integration',
        description: `Add integration tests for ${baseName}`,
        testFilePath: path.join(path.dirname(filePath), '__tests__', `${baseName}.integration.spec.ts`),
        estimatedEffort: 'high'
      });
    } else if (layer === 'presentation') {
      suggestions.push({
        type: 'e2e',
        description: `Add e2e tests for ${baseName} endpoints`,
        testFilePath: path.join(path.dirname(filePath), '__tests__', `${baseName}.e2e.spec.ts`),
        estimatedEffort: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Calculate priority for uncovered code
   */
  private calculatePriority(uncoveredLines: UncoveredLine[]): 'high' | 'medium' | 'low' {
    const highPriorityCount = uncoveredLines.filter(line => line.priority === 'high').length;
    const totalLines = uncoveredLines.length;
    
    if (highPriorityCount > totalLines * 0.5) return 'high';
    if (highPriorityCount > 0) return 'medium';
    return 'low';
  }
}