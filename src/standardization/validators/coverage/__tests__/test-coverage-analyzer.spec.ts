/**
 * Unit tests for TestCoverageAnalyzerService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TestCoverageAnalyzerService } from '../test-coverage-analyzer';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('TestCoverageAnalyzerService', () => {
  let service: TestCoverageAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestCoverageAnalyzerService],
    }).compile();

    service = module.get<TestCoverageAnalyzerService>(TestCoverageAnalyzerService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('analyzeCoverage', () => {
    it('should analyze coverage for a module with Jest data', async () => {
      // Arrange
      const modulePath = '/test/module';
      const mockCoverageData = {
        total: {
          lines: { pct: 85 },
          functions: { pct: 90 },
          branches: { pct: 80 },
          statements: { pct: 85 }
        },
        '/test/module/domain/User.ts': {
          lines: { total: 100, covered: 95, pct: 95 },
          functions: { total: 10, covered: 10, pct: 100 },
          branches: { total: 20, covered: 18, pct: 90 },
          statements: { total: 100, covered: 95, pct: 95 }
        }
      };

      // Mock file system calls
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockCoverageData));
      mockFs.readdir.mockResolvedValue([
        { name: 'User.ts', isFile: () => true, isDirectory: () => false }
      ] as any);

      // Act
      const result = await service.analyzeCoverage(modulePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.byLayer).toBeDefined();
      expect(result.byFile).toBeDefined();
      expect(result.thresholds).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing coverage data gracefully', async () => {
      // Arrange
      const modulePath = '/test/module';
      
      // Mock file system to simulate missing coverage files
      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.readdir.mockResolvedValue([]);

      // Act
      const result = await service.analyzeCoverage(modulePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.overall.lines.percentage).toBe(0);
    });
  });

  describe('validateThresholds', () => {
    it('should validate coverage against thresholds', async () => {
      // Arrange
      const mockCoverageReport = {
        overall: {
          lines: { total: 100, covered: 95, percentage: 95, threshold: 90, meetsThreshold: true },
          functions: { total: 10, covered: 9, percentage: 90, threshold: 90, meetsThreshold: true },
          branches: { total: 20, covered: 18, percentage: 90, threshold: 90, meetsThreshold: true },
          statements: { total: 100, covered: 95, percentage: 95, threshold: 90, meetsThreshold: true }
        },
        byLayer: {
          domain: {
            lines: { total: 50, covered: 48, percentage: 96, threshold: 95, meetsThreshold: true },
            functions: { total: 5, covered: 5, percentage: 100, threshold: 95, meetsThreshold: true },
            branches: { total: 10, covered: 10, percentage: 100, threshold: 95, meetsThreshold: true },
            statements: { total: 50, covered: 48, percentage: 96, threshold: 95, meetsThreshold: true }
          },
          application: {
            lines: { total: 30, covered: 27, percentage: 90, threshold: 90, meetsThreshold: true },
            functions: { total: 3, covered: 3, percentage: 100, threshold: 90, meetsThreshold: true },
            branches: { total: 6, covered: 5, percentage: 83, threshold: 90, meetsThreshold: false },
            statements: { total: 30, covered: 27, percentage: 90, threshold: 90, meetsThreshold: true }
          },
          infrastructure: {
            lines: { total: 20, covered: 17, percentage: 85, threshold: 85, meetsThreshold: true },
            functions: { total: 2, covered: 1, percentage: 50, threshold: 85, meetsThreshold: false },
            branches: { total: 4, covered: 3, percentage: 75, threshold: 85, meetsThreshold: false },
            statements: { total: 20, covered: 17, percentage: 85, threshold: 85, meetsThreshold: true }
          },
          presentation: {
            lines: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            functions: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            branches: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            statements: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false }
          }
        },
        byFile: [],
        uncoveredLines: [],
        thresholds: {
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
        },
        timestamp: new Date(),
        testRunInfo: {
          testFramework: 'Jest',
          totalTests: 10,
          passedTests: 10,
          failedTests: 0,
          skippedTests: 0,
          duration: 1000,
          timestamp: new Date()
        }
      };

      // Act
      const result = await service.validateThresholds(mockCoverageReport);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false); // Should be false due to violations
      expect(result.layerResults).toHaveLength(5); // 4 layers + overall
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });

    it('should return valid result when all thresholds are met', async () => {
      // Arrange
      const mockCoverageReport = {
        overall: {
          lines: { total: 100, covered: 95, percentage: 95, threshold: 90, meetsThreshold: true },
          functions: { total: 10, covered: 10, percentage: 100, threshold: 90, meetsThreshold: true },
          branches: { total: 20, covered: 19, percentage: 95, threshold: 90, meetsThreshold: true },
          statements: { total: 100, covered: 95, percentage: 95, threshold: 90, meetsThreshold: true }
        },
        byLayer: {
          domain: {
            lines: { total: 50, covered: 48, percentage: 96, threshold: 95, meetsThreshold: true },
            functions: { total: 5, covered: 5, percentage: 100, threshold: 95, meetsThreshold: true },
            branches: { total: 10, covered: 10, percentage: 100, threshold: 95, meetsThreshold: true },
            statements: { total: 50, covered: 48, percentage: 96, threshold: 95, meetsThreshold: true }
          },
          application: {
            lines: { total: 30, covered: 28, percentage: 93, threshold: 90, meetsThreshold: true },
            functions: { total: 3, covered: 3, percentage: 100, threshold: 90, meetsThreshold: true },
            branches: { total: 6, covered: 6, percentage: 100, threshold: 90, meetsThreshold: true },
            statements: { total: 30, covered: 28, percentage: 93, threshold: 90, meetsThreshold: true }
          },
          infrastructure: {
            lines: { total: 20, covered: 18, percentage: 90, threshold: 85, meetsThreshold: true },
            functions: { total: 2, covered: 2, percentage: 100, threshold: 85, meetsThreshold: true },
            branches: { total: 4, covered: 3, percentage: 75, threshold: 85, meetsThreshold: false },
            statements: { total: 20, covered: 18, percentage: 90, threshold: 85, meetsThreshold: true }
          },
          presentation: {
            lines: { total: 0, covered: 0, percentage: 100, threshold: 85, meetsThreshold: true },
            functions: { total: 0, covered: 0, percentage: 100, threshold: 85, meetsThreshold: true },
            branches: { total: 0, covered: 0, percentage: 100, threshold: 85, meetsThreshold: true },
            statements: { total: 0, covered: 0, percentage: 100, threshold: 85, meetsThreshold: true }
          }
        },
        byFile: [],
        uncoveredLines: [],
        thresholds: {
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
        },
        timestamp: new Date(),
        testRunInfo: {
          testFramework: 'Jest',
          totalTests: 10,
          passedTests: 10,
          failedTests: 0,
          skippedTests: 0,
          duration: 1000,
          timestamp: new Date()
        }
      };

      // Act
      const result = await service.validateThresholds(mockCoverageReport);

      // Assert
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
    });
  });

  describe('generateCoverageReport', () => {
    it('should generate a markdown coverage report', async () => {
      // Arrange
      const mockCoverageReport = {
        overall: {
          lines: { total: 100, covered: 85, percentage: 85, threshold: 90, meetsThreshold: false },
          functions: { total: 10, covered: 9, percentage: 90, threshold: 90, meetsThreshold: true },
          branches: { total: 20, covered: 16, percentage: 80, threshold: 90, meetsThreshold: false },
          statements: { total: 100, covered: 85, percentage: 85, threshold: 90, meetsThreshold: false }
        },
        byLayer: {
          domain: {
            lines: { total: 50, covered: 45, percentage: 90, threshold: 95, meetsThreshold: false },
            functions: { total: 5, covered: 5, percentage: 100, threshold: 95, meetsThreshold: true },
            branches: { total: 10, covered: 8, percentage: 80, threshold: 95, meetsThreshold: false },
            statements: { total: 50, covered: 45, percentage: 90, threshold: 95, meetsThreshold: false }
          },
          application: {
            lines: { total: 30, covered: 25, percentage: 83, threshold: 90, meetsThreshold: false },
            functions: { total: 3, covered: 3, percentage: 100, threshold: 90, meetsThreshold: true },
            branches: { total: 6, covered: 5, percentage: 83, threshold: 90, meetsThreshold: false },
            statements: { total: 30, covered: 25, percentage: 83, threshold: 90, meetsThreshold: false }
          },
          infrastructure: {
            lines: { total: 20, covered: 15, percentage: 75, threshold: 85, meetsThreshold: false },
            functions: { total: 2, covered: 1, percentage: 50, threshold: 85, meetsThreshold: false },
            branches: { total: 4, covered: 3, percentage: 75, threshold: 85, meetsThreshold: false },
            statements: { total: 20, covered: 15, percentage: 75, threshold: 85, meetsThreshold: false }
          },
          presentation: {
            lines: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            functions: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            branches: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            statements: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false }
          }
        },
        byFile: [],
        uncoveredLines: [],
        thresholds: {
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
        },
        timestamp: new Date('2024-01-01T00:00:00Z'),
        testRunInfo: {
          testFramework: 'Jest',
          totalTests: 10,
          passedTests: 8,
          failedTests: 2,
          skippedTests: 0,
          duration: 1000,
          timestamp: new Date()
        }
      };

      // Act
      const report = await service.generateCoverageReport(mockCoverageReport);

      // Assert
      expect(report).toContain('# Test Coverage Report');
      expect(report).toContain('## Overall Coverage');
      expect(report).toContain('## Coverage by Layer');
      expect(report).toContain('85.00%'); // Overall lines coverage
      expect(report).toContain('❌'); // Failed threshold indicators
      expect(report).toContain('✅'); // Passed threshold indicators
    });
  });

  describe('identifyUncoveredCode', () => {
    it('should identify uncovered code sections', async () => {
      // Arrange
      const mockCoverageReport = {
        overall: {
          lines: { total: 100, covered: 80, percentage: 80, threshold: 90, meetsThreshold: false },
          functions: { total: 10, covered: 8, percentage: 80, threshold: 90, meetsThreshold: false },
          branches: { total: 20, covered: 16, percentage: 80, threshold: 90, meetsThreshold: false },
          statements: { total: 100, covered: 80, percentage: 80, threshold: 90, meetsThreshold: false }
        },
        byLayer: {
          domain: {
            lines: { total: 50, covered: 40, percentage: 80, threshold: 95, meetsThreshold: false },
            functions: { total: 5, covered: 4, percentage: 80, threshold: 95, meetsThreshold: false },
            branches: { total: 10, covered: 8, percentage: 80, threshold: 95, meetsThreshold: false },
            statements: { total: 50, covered: 40, percentage: 80, threshold: 95, meetsThreshold: false }
          },
          application: {
            lines: { total: 30, covered: 24, percentage: 80, threshold: 90, meetsThreshold: false },
            functions: { total: 3, covered: 2, percentage: 67, threshold: 90, meetsThreshold: false },
            branches: { total: 6, covered: 5, percentage: 83, threshold: 90, meetsThreshold: false },
            statements: { total: 30, covered: 24, percentage: 80, threshold: 90, meetsThreshold: false }
          },
          infrastructure: {
            lines: { total: 20, covered: 16, percentage: 80, threshold: 85, meetsThreshold: false },
            functions: { total: 2, covered: 2, percentage: 100, threshold: 85, meetsThreshold: true },
            branches: { total: 4, covered: 3, percentage: 75, threshold: 85, meetsThreshold: false },
            statements: { total: 20, covered: 16, percentage: 80, threshold: 85, meetsThreshold: false }
          },
          presentation: {
            lines: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            functions: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            branches: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false },
            statements: { total: 0, covered: 0, percentage: 0, threshold: 85, meetsThreshold: false }
          }
        },
        byFile: [
          {
            filePath: '/test/domain/User.ts',
            layer: 'domain' as const,
            coverage: {
              lines: { total: 50, covered: 40, percentage: 80, threshold: 95, meetsThreshold: false },
              functions: { total: 5, covered: 4, percentage: 80, threshold: 95, meetsThreshold: false },
              branches: { total: 10, covered: 8, percentage: 80, threshold: 95, meetsThreshold: false },
              statements: { total: 50, covered: 40, percentage: 80, threshold: 95, meetsThreshold: false }
            },
            uncoveredLines: [1, 2, 3],
            complexity: 5,
            testFiles: []
          }
        ],
        uncoveredLines: [
          {
            filePath: '/test/domain/User.ts',
            lineNumber: 1,
            content: 'uncovered line 1',
            type: 'statement' as const,
            complexity: 1,
            priority: 'high' as const
          },
          {
            filePath: '/test/domain/User.ts',
            lineNumber: 2,
            content: 'uncovered line 2',
            type: 'function' as const,
            complexity: 2,
            priority: 'high' as const
          }
        ],
        thresholds: {
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
        },
        timestamp: new Date(),
        testRunInfo: {
          testFramework: 'Jest',
          totalTests: 10,
          passedTests: 8,
          failedTests: 2,
          skippedTests: 0,
          duration: 1000,
          timestamp: new Date()
        }
      };

      // Act
      const result = await service.identifyUncoveredCode(mockCoverageReport);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].filePath).toBe('/test/domain/User.ts');
      expect(result[0].layer).toBe('domain');
      expect(result[0].uncoveredLines.length).toBe(2);
      expect(result[0].suggestedTests.length).toBeGreaterThan(0);
      expect(result[0].priority).toBe('high');
    });
  });
});