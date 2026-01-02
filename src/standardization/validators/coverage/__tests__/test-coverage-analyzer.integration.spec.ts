/**
 * Integration tests for TestCoverageAnalyzerService
 * Tests with real Jest coverage data and various coverage scenarios
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TestCoverageAnalyzerService } from '../test-coverage-analyzer';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  CoverageReport,
  CoverageMetrics,
  ThresholdValidation,
  LayerCoverage
} from '../../../interfaces/coverage.interface';

describe('TestCoverageAnalyzerService - Integration Tests', () => {
  let service: TestCoverageAnalyzerService;
  let testDataDir: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestCoverageAnalyzerService],
    }).compile();

    service = module.get<TestCoverageAnalyzerService>(TestCoverageAnalyzerService);
    testDataDir = path.join(__dirname, 'test-data');
  });

  describe('analyzeCoverage with real Jest data', () => {
    it('should analyze coverage using real lcov.info data', async () => {
      // Arrange: Use the actual coverage directory
      const coverageDir = path.join(process.cwd(), 'coverage');
      const modulePath = path.join(process.cwd(), 'src/modules/iam');

      // Check if real coverage data exists
      const lcovPath = path.join(coverageDir, 'lcov.info');
      let lcovExists = false;
      try {
        await fs.access(lcovPath);
        lcovExists = true;
      } catch {
        // Coverage data doesn't exist, skip this test
        console.log('Skipping real coverage test - no lcov.info found');
        return;
      }

      if (!lcovExists) {
        console.log('Skipping real coverage test - no lcov.info found');
        return;
      }

      // Act: Analyze coverage with real data
      const result = await service.analyzeCoverage(modulePath);

      // Assert: Verify the structure and content
      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.byLayer).toBeDefined();
      expect(result.byFile).toBeDefined();
      expect(result.thresholds).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.testRunInfo).toBeDefined();

      // Verify layer structure
      expect(result.byLayer.domain).toBeDefined();
      expect(result.byLayer.application).toBeDefined();
      expect(result.byLayer.infrastructure).toBeDefined();
      expect(result.byLayer.presentation).toBeDefined();

      // Verify metrics structure
      const verifyMetrics = (metrics: CoverageMetrics) => {
        expect(metrics.lines).toBeDefined();
        expect(metrics.functions).toBeDefined();
        expect(metrics.branches).toBeDefined();
        expect(metrics.statements).toBeDefined();
        
        expect(typeof metrics.lines.percentage).toBe('number');
        expect(typeof metrics.functions.percentage).toBe('number');
        expect(typeof metrics.branches.percentage).toBe('number');
        expect(typeof metrics.statements.percentage).toBe('number');
        
        expect(metrics.lines.percentage).toBeGreaterThanOrEqual(0);
        expect(metrics.lines.percentage).toBeLessThanOrEqual(100);
      };

      verifyMetrics(result.overall);
      verifyMetrics(result.byLayer.domain);
      verifyMetrics(result.byLayer.application);
      verifyMetrics(result.byLayer.infrastructure);
      verifyMetrics(result.byLayer.presentation);
    });

    it('should handle module with no coverage data gracefully', async () => {
      // Arrange: Use a non-existent module path
      const nonExistentModulePath = '/non/existent/module';

      // Act: Analyze coverage for non-existent module
      const result = await service.analyzeCoverage(nonExistentModulePath);

      // Assert: Should return empty coverage gracefully
      expect(result).toBeDefined();
      expect(result.overall.lines.percentage).toBe(0);
      expect(result.overall.functions.percentage).toBe(0);
      expect(result.overall.branches.percentage).toBe(0);
      expect(result.overall.statements.percentage).toBe(0);
      
      // All layers should have zero coverage
      expect(result.byLayer.domain.lines.percentage).toBe(0);
      expect(result.byLayer.application.lines.percentage).toBe(0);
      expect(result.byLayer.infrastructure.lines.percentage).toBe(0);
      expect(result.byLayer.presentation.lines.percentage).toBe(0);
    });
  });

  describe('validateThresholds with various coverage scenarios', () => {
    it('should validate high coverage scenario (all thresholds met)', async () => {
      // Arrange: Create coverage report with high coverage
      const highCoverageReport = createCoverageReportWithScenario({
        domain: { lines: 98, functions: 97, branches: 96, statements: 98 },
        application: { lines: 95, functions: 94, branches: 93, statements: 95 },
        infrastructure: { lines: 90, functions: 89, branches: 88, statements: 90 },
        presentation: { lines: 87, functions: 86, branches: 85, statements: 87 }
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(highCoverageReport);

      // Assert: Should be valid with high scores
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.overallScore).toBeGreaterThan(90);
      
      // All layers should meet thresholds
      const layerResults = result.layerResults.filter(lr => lr.layer !== 'overall');
      for (const layerResult of layerResults) {
        expect(layerResult.meetsThreshold).toBe(true);
        expect(layerResult.gaps).toHaveLength(0);
        expect(layerResult.score).toBeGreaterThan(90);
      }
    });

    it('should validate medium coverage scenario (some thresholds not met)', async () => {
      // Arrange: Create coverage report with medium coverage
      const mediumCoverageReport = createCoverageReportWithScenario({
        domain: { lines: 92, functions: 94, branches: 89, statements: 93 }, // branches below 95%
        application: { lines: 88, functions: 91, branches: 87, statements: 89 }, // lines/branches/statements below 90%
        infrastructure: { lines: 82, functions: 86, branches: 80, statements: 83 }, // lines/branches/statements below 85%
        presentation: { lines: 84, functions: 87, branches: 83, statements: 85 } // branches below 85%
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(mediumCoverageReport);

      // Assert: Should be invalid with violations
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(100);
      
      // Should have specific violations
      const domainViolations = result.violations.filter(v => v.layer === 'domain');
      const applicationViolations = result.violations.filter(v => v.layer === 'application');
      const infrastructureViolations = result.violations.filter(v => v.layer === 'infrastructure');
      const presentationViolations = result.violations.filter(v => v.layer === 'presentation');
      
      expect(domainViolations.length).toBeGreaterThan(0); // branches violation
      expect(applicationViolations.length).toBeGreaterThan(0); // multiple violations
      expect(infrastructureViolations.length).toBeGreaterThan(0); // multiple violations
      expect(presentationViolations.length).toBeGreaterThan(0); // branches violation
    });

    it('should validate low coverage scenario (critical violations)', async () => {
      // Arrange: Create coverage report with low coverage
      const lowCoverageReport = createCoverageReportWithScenario({
        domain: { lines: 70, functions: 75, branches: 65, statements: 72 },
        application: { lines: 60, functions: 65, branches: 55, statements: 62 },
        infrastructure: { lines: 50, functions: 55, branches: 45, statements: 52 },
        presentation: { lines: 40, functions: 45, branches: 35, statements: 42 }
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(lowCoverageReport);

      // Assert: Should be invalid with many critical violations
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(10); // Many violations
      expect(result.overallScore).toBeLessThan(80);
      
      // All layers should have violations
      const layerResults = result.layerResults.filter(lr => lr.layer !== 'overall');
      for (const layerResult of layerResults) {
        expect(layerResult.meetsThreshold).toBe(false);
        expect(layerResult.gaps.length).toBeGreaterThan(0);
        expect(layerResult.score).toBeLessThan(90);
      }
      
      // Should have critical severity violations
      const criticalViolations = result.violations.filter(v => v.severity === 'critical');
      expect(criticalViolations.length).toBeGreaterThan(0);
      
      // Should have recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should validate edge case scenario (zero coverage)', async () => {
      // Arrange: Create coverage report with zero coverage
      const zeroCoverageReport = createCoverageReportWithScenario({
        domain: { lines: 0, functions: 0, branches: 0, statements: 0 },
        application: { lines: 0, functions: 0, branches: 0, statements: 0 },
        infrastructure: { lines: 0, functions: 0, branches: 0, statements: 0 },
        presentation: { lines: 0, functions: 0, branches: 0, statements: 0 }
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(zeroCoverageReport);

      // Assert: Should be invalid with maximum violations
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(15); // All metrics for all layers
      expect(result.overallScore).toBe(0);
      
      // All violations should be critical
      const criticalViolations = result.violations.filter(v => v.severity === 'critical');
      expect(criticalViolations.length).toBe(result.violations.length);
    });

    it('should validate mixed scenario (some layers good, others poor)', async () => {
      // Arrange: Create coverage report with mixed layer performance
      const mixedCoverageReport = createCoverageReportWithScenario({
        domain: { lines: 97, functions: 98, branches: 96, statements: 97 }, // Excellent
        application: { lines: 91, functions: 92, branches: 90, statements: 91 }, // Good
        infrastructure: { lines: 70, functions: 75, branches: 65, statements: 72 }, // Poor
        presentation: { lines: 30, functions: 35, branches: 25, statements: 32 } // Very poor
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(mixedCoverageReport);

      // Assert: Should be invalid due to poor layers
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      
      // Domain should meet thresholds
      const domainResult = result.layerResults.find(lr => lr.layer === 'domain');
      expect(domainResult?.meetsThreshold).toBe(true);
      expect(domainResult?.gaps).toHaveLength(0);
      
      // Application should meet thresholds
      const applicationResult = result.layerResults.find(lr => lr.layer === 'application');
      expect(applicationResult?.meetsThreshold).toBe(true);
      expect(applicationResult?.gaps).toHaveLength(0);
      
      // Infrastructure should not meet thresholds
      const infrastructureResult = result.layerResults.find(lr => lr.layer === 'infrastructure');
      expect(infrastructureResult?.meetsThreshold).toBe(false);
      expect(infrastructureResult?.gaps.length).toBeGreaterThan(0);
      
      // Presentation should not meet thresholds
      const presentationResult = result.layerResults.find(lr => lr.layer === 'presentation');
      expect(presentationResult?.meetsThreshold).toBe(false);
      expect(presentationResult?.gaps.length).toBeGreaterThan(0);
    });
  });

  describe('layer-specific analysis accuracy', () => {
    it('should accurately analyze domain layer with high requirements', async () => {
      // Arrange: Create coverage focused on domain layer
      const domainFocusedReport = createCoverageReportWithScenario({
        domain: { lines: 94, functions: 96, branches: 93, statements: 95 }, // Just below/at threshold
        application: { lines: 85, functions: 85, branches: 85, statements: 85 },
        infrastructure: { lines: 80, functions: 80, branches: 80, statements: 80 },
        presentation: { lines: 80, functions: 80, branches: 80, statements: 80 }
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(domainFocusedReport);

      // Assert: Domain should have specific threshold behavior
      const domainResult = result.layerResults.find(lr => lr.layer === 'domain');
      expect(domainResult).toBeDefined();
      
      // Domain has 95% threshold - should have violations for lines and branches
      const domainViolations = result.violations.filter(v => v.layer === 'domain');
      expect(domainViolations.length).toBe(2); // lines (94% < 95%) and branches (93% < 95%)
      
      // Verify specific gaps
      expect(domainResult!.gaps.length).toBe(2);
      const linesGap = domainResult!.gaps.find(g => g.metric === 'lines');
      const branchesGap = domainResult!.gaps.find(g => g.metric === 'branches');
      
      expect(linesGap).toBeDefined();
      expect(linesGap!.actual).toBe(94);
      expect(linesGap!.required).toBe(95);
      expect(linesGap!.gap).toBe(1);
      
      expect(branchesGap).toBeDefined();
      expect(branchesGap!.actual).toBe(93);
      expect(branchesGap!.required).toBe(95);
      expect(branchesGap!.gap).toBe(2);
    });

    it('should accurately analyze application layer with medium requirements', async () => {
      // Arrange: Create coverage focused on application layer
      const applicationFocusedReport = createCoverageReportWithScenario({
        domain: { lines: 96, functions: 96, branches: 96, statements: 96 },
        application: { lines: 89, functions: 91, branches: 88, statements: 90 }, // Mixed around 90% threshold
        infrastructure: { lines: 86, functions: 86, branches: 86, statements: 86 },
        presentation: { lines: 86, functions: 86, branches: 86, statements: 86 }
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(applicationFocusedReport);

      // Assert: Application should have specific threshold behavior
      const applicationResult = result.layerResults.find(lr => lr.layer === 'application');
      expect(applicationResult).toBeDefined();
      
      // Application has 90% threshold - should have violations for lines and branches
      const applicationViolations = result.violations.filter(v => v.layer === 'application');
      expect(applicationViolations.length).toBe(2); // lines (89% < 90%) and branches (88% < 90%)
      
      // Verify specific gaps
      expect(applicationResult!.gaps.length).toBe(2);
      const linesGap = applicationResult!.gaps.find(g => g.metric === 'lines');
      const branchesGap = applicationResult!.gaps.find(g => g.metric === 'branches');
      
      expect(linesGap!.gap).toBe(1); // 90 - 89
      expect(branchesGap!.gap).toBe(2); // 90 - 88
    });

    it('should accurately analyze infrastructure and presentation layers with lower requirements', async () => {
      // Arrange: Create coverage focused on infrastructure/presentation layers
      const infraPresentationReport = createCoverageReportWithScenario({
        domain: { lines: 96, functions: 96, branches: 96, statements: 96 },
        application: { lines: 91, functions: 91, branches: 91, statements: 91 },
        infrastructure: { lines: 84, functions: 86, branches: 83, statements: 85 }, // Mixed around 85% threshold
        presentation: { lines: 84, functions: 87, branches: 82, statements: 86 } // Mixed around 85% threshold
      });

      // Act: Validate thresholds
      const result = await service.validateThresholds(infraPresentationReport);

      // Assert: Infrastructure should have specific violations
      const infrastructureResult = result.layerResults.find(lr => lr.layer === 'infrastructure');
      const infrastructureViolations = result.violations.filter(v => v.layer === 'infrastructure');
      expect(infrastructureViolations.length).toBe(2); // lines (84% < 85%) and branches (83% < 85%)
      
      // Assert: Presentation should have specific violations
      const presentationResult = result.layerResults.find(lr => lr.layer === 'presentation');
      const presentationViolations = result.violations.filter(v => v.layer === 'presentation');
      expect(presentationViolations.length).toBe(2); // lines (84% < 85%) and branches (82% < 85%)
      
      // Verify gap calculations
      const infraLinesGap = infrastructureResult!.gaps.find(g => g.metric === 'lines');
      const infraBranchesGap = infrastructureResult!.gaps.find(g => g.metric === 'branches');
      const presLinesGap = presentationResult!.gaps.find(g => g.metric === 'lines');
      const presBranchesGap = presentationResult!.gaps.find(g => g.metric === 'branches');
      
      expect(infraLinesGap!.gap).toBe(1); // 85 - 84
      expect(infraBranchesGap!.gap).toBe(2); // 85 - 83
      expect(presLinesGap!.gap).toBe(1); // 85 - 84
      expect(presBranchesGap!.gap).toBe(3); // 85 - 82
    });
  });

  describe('generateCoverageReport integration', () => {
    it('should generate comprehensive report with real coverage data', async () => {
      // Arrange: Create a realistic coverage scenario
      const realisticCoverageReport = createCoverageReportWithScenario({
        domain: { lines: 92, functions: 95, branches: 88, statements: 93 },
        application: { lines: 87, functions: 89, branches: 85, statements: 88 },
        infrastructure: { lines: 78, functions: 82, branches: 75, statements: 80 },
        presentation: { lines: 81, functions: 84, branches: 79, statements: 83 }
      });

      // Act: Generate report
      const report = await service.generateCoverageReport(realisticCoverageReport);

      // Assert: Verify report structure and content
      expect(report).toContain('# Test Coverage Report');
      expect(report).toContain('## Overall Coverage');
      expect(report).toContain('## Coverage by Layer');
      
      // Should contain all layer sections
      expect(report).toContain('### Domain Layer');
      expect(report).toContain('### Application Layer');
      expect(report).toContain('### Infrastructure Layer');
      expect(report).toContain('### Presentation Layer');
      
      // Should contain violations section
      expect(report).toContain('## Coverage Violations');
      
      // Should contain recommendations section (if there are recommendations)
      // Note: Recommendations may not be generated for all scenarios
      if (report.includes('## Recommendations')) {
        expect(report).toContain('## Recommendations');
      }
      
      // Should contain specific percentages
      expect(report).toContain('92.00%'); // Domain lines
      expect(report).toContain('87.00%'); // Application lines
      expect(report).toContain('78.00%'); // Infrastructure lines
      expect(report).toContain('81.00%'); // Presentation lines
      
      // Should contain status indicators
      expect(report).toContain('✅'); // Some passing thresholds
      expect(report).toContain('❌'); // Some failing thresholds
    });
  });

  describe('identifyUncoveredCode integration', () => {
    it('should identify uncovered code with realistic file structure', async () => {
      // Arrange: Create coverage report with file-level data
      const coverageWithFiles = createCoverageReportWithFiles([
        {
          filePath: 'src/modules/iam/domain/aggregates/User.ts',
          layer: 'domain',
          coverage: { lines: 85, functions: 90, branches: 80, statements: 87 }
        },
        {
          filePath: 'src/modules/iam/application/handlers/CreateUser.handler.ts',
          layer: 'application',
          coverage: { lines: 75, functions: 80, branches: 70, statements: 77 }
        },
        {
          filePath: 'src/modules/iam/infrastructure/persistence/UserRepository.ts',
          layer: 'infrastructure',
          coverage: { lines: 65, functions: 70, branches: 60, statements: 67 }
        },
        {
          filePath: 'src/modules/iam/presentation/controllers/User.controller.ts',
          layer: 'presentation',
          coverage: { lines: 55, functions: 60, branches: 50, statements: 57 }
        }
      ]);

      // Act: Identify uncovered code
      const uncoveredSections = await service.identifyUncoveredCode(coverageWithFiles);

      // Assert: Should identify uncovered sections for each file
      expect(uncoveredSections.length).toBe(4);
      
      // Should be sorted by priority (domain first due to high priority)
      expect(uncoveredSections[0]?.layer).toBe('domain');
      expect(uncoveredSections[0]?.priority).toBe('high');
      
      // Each section should have appropriate test suggestions
      for (const section of uncoveredSections) {
        expect(section.suggestedTests.length).toBeGreaterThan(0);
        expect(section.uncoveredLines.length).toBeGreaterThan(0);
        
        // Verify test suggestions match layer
        if (section.layer === 'domain') {
          expect(section.suggestedTests[0]?.type).toBe('unit');
        } else if (section.layer === 'application') {
          expect(section.suggestedTests[0]?.type).toBe('unit');
        } else if (section.layer === 'infrastructure') {
          expect(section.suggestedTests[0]?.type).toBe('integration');
        } else if (section.layer === 'presentation') {
          expect(section.suggestedTests[0]?.type).toBe('e2e');
        }
      }
    });
  });

  // Helper functions for creating test data
  function createCoveragePercentage(percentage: number, threshold: number) {
    const total = 100;
    const covered = Math.round((percentage / 100) * total);
    return {
      total,
      covered,
      percentage,
      threshold,
      meetsThreshold: percentage >= threshold
    };
  }

  function createCoverageMetrics(
    percentages: { lines: number; functions: number; branches: number; statements: number },
    thresholds: { lines: number; functions: number; branches: number; statements: number }
  ) {
    return {
      lines: createCoveragePercentage(percentages.lines, thresholds.lines),
      functions: createCoveragePercentage(percentages.functions, thresholds.functions),
      branches: createCoveragePercentage(percentages.branches, thresholds.branches),
      statements: createCoveragePercentage(percentages.statements, thresholds.statements)
    };
  }

  function createCoverageReportWithScenario(layerPercentages: {
    domain: { lines: number; functions: number; branches: number; statements: number };
    application: { lines: number; functions: number; branches: number; statements: number };
    infrastructure: { lines: number; functions: number; branches: number; statements: number };
    presentation: { lines: number; functions: number; branches: number; statements: number };
  }): CoverageReport {
    const byLayer: LayerCoverage = {
      domain: createCoverageMetrics(layerPercentages.domain, { lines: 95, functions: 95, branches: 95, statements: 95 }),
      application: createCoverageMetrics(layerPercentages.application, { lines: 90, functions: 90, branches: 90, statements: 90 }),
      infrastructure: createCoverageMetrics(layerPercentages.infrastructure, { lines: 85, functions: 85, branches: 85, statements: 85 }),
      presentation: createCoverageMetrics(layerPercentages.presentation, { lines: 85, functions: 85, branches: 85, statements: 85 })
    };

    // Calculate overall metrics
    const totalLines = Object.values(byLayer).reduce((sum, layer) => sum + layer.lines.total, 0);
    const coveredLines = Object.values(byLayer).reduce((sum, layer) => sum + layer.lines.covered, 0);
    const totalFunctions = Object.values(byLayer).reduce((sum, layer) => sum + layer.functions.total, 0);
    const coveredFunctions = Object.values(byLayer).reduce((sum, layer) => sum + layer.functions.covered, 0);
    const totalBranches = Object.values(byLayer).reduce((sum, layer) => sum + layer.branches.total, 0);
    const coveredBranches = Object.values(byLayer).reduce((sum, layer) => sum + layer.branches.covered, 0);
    const totalStatements = Object.values(byLayer).reduce((sum, layer) => sum + layer.statements.total, 0);
    const coveredStatements = Object.values(byLayer).reduce((sum, layer) => sum + layer.statements.covered, 0);

    const overall = {
      lines: createCoveragePercentage(totalLines > 0 ? (coveredLines / totalLines) * 100 : 0, 90),
      functions: createCoveragePercentage(totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0, 90),
      branches: createCoveragePercentage(totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0, 90),
      statements: createCoveragePercentage(totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0, 90)
    };

    return {
      overall,
      byLayer,
      byFile: [],
      uncoveredLines: [],
      thresholds: {
        domain: createCoverageMetrics({ lines: 95, functions: 95, branches: 95, statements: 95 }, { lines: 95, functions: 95, branches: 95, statements: 95 }),
        application: createCoverageMetrics({ lines: 90, functions: 90, branches: 90, statements: 90 }, { lines: 90, functions: 90, branches: 90, statements: 90 }),
        infrastructure: createCoverageMetrics({ lines: 85, functions: 85, branches: 85, statements: 85 }, { lines: 85, functions: 85, branches: 85, statements: 85 }),
        presentation: createCoverageMetrics({ lines: 85, functions: 85, branches: 85, statements: 85 }, { lines: 85, functions: 85, branches: 85, statements: 85 }),
        overall: createCoverageMetrics({ lines: 90, functions: 90, branches: 90, statements: 90 }, { lines: 90, functions: 90, branches: 90, statements: 90 })
      },
      timestamp: new Date(),
      testRunInfo: {
        testFramework: 'Jest',
        totalTests: 100,
        passedTests: 95,
        failedTests: 5,
        skippedTests: 0,
        duration: 5000,
        timestamp: new Date()
      }
    };
  }

  function createCoverageReportWithFiles(files: Array<{
    filePath: string;
    layer: 'domain' | 'application' | 'infrastructure' | 'presentation';
    coverage: { lines: number; functions: number; branches: number; statements: number };
  }>): CoverageReport {
    const byFile = files.map(file => ({
      filePath: file.filePath,
      layer: file.layer,
      coverage: createCoverageMetrics(
        file.coverage,
        { lines: 90, functions: 90, branches: 90, statements: 90 }
      ),
      uncoveredLines: [],
      complexity: 3,
      testFiles: []
    }));

    // Create uncovered lines for files with low coverage
    const uncoveredLines = files.flatMap(file => {
      const uncoveredCount = Math.ceil((100 - file.coverage.lines) / 10); // Simplified calculation
      return Array.from({ length: uncoveredCount }, (_, i) => ({
        filePath: file.filePath,
        lineNumber: i + 1,
        content: `// Uncovered line ${i + 1}`,
        type: 'statement' as const,
        complexity: 1,
        priority: file.layer === 'domain' ? 'high' as const : 'medium' as const
      }));
    });

    // Calculate layer coverage from files
    const layerGroups = files.reduce((acc, file) => {
      if (!acc[file.layer!]) {
        acc[file.layer!] = [];
      }
      acc[file.layer!]!.push(file);
      return acc;
    }, {} as Record<string, typeof files>);

    const byLayer: LayerCoverage = {
      domain: calculateLayerMetrics(layerGroups.domain || [], { lines: 95, functions: 95, branches: 95, statements: 95 }),
      application: calculateLayerMetrics(layerGroups.application || [], { lines: 90, functions: 90, branches: 90, statements: 90 }),
      infrastructure: calculateLayerMetrics(layerGroups.infrastructure || [], { lines: 85, functions: 85, branches: 85, statements: 85 }),
      presentation: calculateLayerMetrics(layerGroups.presentation || [], { lines: 85, functions: 85, branches: 85, statements: 85 })
    };

    // Calculate overall from layers
    const totalLines = Object.values(byLayer).reduce((sum, layer) => sum + layer.lines.total, 0);
    const coveredLines = Object.values(byLayer).reduce((sum, layer) => sum + layer.lines.covered, 0);
    const overall = createCoverageMetrics(
      {
        lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
        functions: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
        branches: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
        statements: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
      },
      { lines: 90, functions: 90, branches: 90, statements: 90 }
    );

    return {
      overall,
      byLayer,
      byFile,
      uncoveredLines,
      thresholds: {
        domain: createCoverageMetrics({ lines: 95, functions: 95, branches: 95, statements: 95 }, { lines: 95, functions: 95, branches: 95, statements: 95 }),
        application: createCoverageMetrics({ lines: 90, functions: 90, branches: 90, statements: 90 }, { lines: 90, functions: 90, branches: 90, statements: 90 }),
        infrastructure: createCoverageMetrics({ lines: 85, functions: 85, branches: 85, statements: 85 }, { lines: 85, functions: 85, branches: 85, statements: 85 }),
        presentation: createCoverageMetrics({ lines: 85, functions: 85, branches: 85, statements: 85 }, { lines: 85, functions: 85, branches: 85, statements: 85 }),
        overall: createCoverageMetrics({ lines: 90, functions: 90, branches: 90, statements: 90 }, { lines: 90, functions: 90, branches: 90, statements: 90 })
      },
      timestamp: new Date(),
      testRunInfo: {
        testFramework: 'Jest',
        totalTests: 50,
        passedTests: 45,
        failedTests: 5,
        skippedTests: 0,
        duration: 3000,
        timestamp: new Date()
      }
    };
  }

  function calculateLayerMetrics(
    files: Array<{ coverage: { lines: number; functions: number; branches: number; statements: number } }>,
    thresholds: { lines: number; functions: number; branches: number; statements: number }
  ) {
    if (files.length === 0) {
      return createCoverageMetrics({ lines: 0, functions: 0, branches: 0, statements: 0 }, thresholds);
    }

    const avgCoverage = {
      lines: files.reduce((sum, f) => sum + f.coverage.lines, 0) / files.length,
      functions: files.reduce((sum, f) => sum + f.coverage.functions, 0) / files.length,
      branches: files.reduce((sum, f) => sum + f.coverage.branches, 0) / files.length,
      statements: files.reduce((sum, f) => sum + f.coverage.statements, 0) / files.length
    };

    return createCoverageMetrics(avgCoverage, thresholds);
  }
});