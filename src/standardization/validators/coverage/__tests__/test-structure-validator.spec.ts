/**
 * Unit tests for TestStructureValidatorService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TestStructureValidatorService } from '../test-structure-validator';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('TestStructureValidatorService', () => {
  let service: TestStructureValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestStructureValidatorService],
    }).compile();

    service = module.get<TestStructureValidatorService>(TestStructureValidatorService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateTestStructure', () => {
    it('should validate complete test structure', async () => {
      // Arrange
      const testsPath = '/test/module/__tests__';
      
      // Mock directory structure exists
      mockFs.stat.mockImplementation((path: any) => {
        const pathStr = path.toString();
        if (pathStr.includes('__tests__') || 
            pathStr.includes('unit') || 
            pathStr.includes('integration') ||
            pathStr.includes('e2e') ||
            pathStr.includes('fixtures') ||
            pathStr.includes('mocks')) {
          return Promise.resolve({ isDirectory: () => true } as any);
        }
        return Promise.reject(new Error('Directory not found'));
      });

      // Mock readdir for test directories
      mockFs.readdir.mockResolvedValue([
        { name: 'unit', isDirectory: () => true },
        { name: 'integration', isDirectory: () => true },
        { name: 'e2e', isDirectory: () => true },
        { name: 'fixtures', isDirectory: () => true },
        { name: 'mocks', isDirectory: () => true }
      ] as any);

      // Mock glob to return test files
      mockFs.readdir.mockImplementation((dirPath: any) => {
        const pathStr = dirPath.toString();
        if (pathStr.includes('unit')) {
          return Promise.resolve([
            { name: 'User.spec.ts', isFile: () => true, isDirectory: () => false }
          ] as any);
        } else if (pathStr.includes('integration')) {
          return Promise.resolve([
            { name: 'UserRepository.integration.spec.ts', isFile: () => true, isDirectory: () => false }
          ] as any);
        } else if (pathStr.includes('e2e')) {
          return Promise.resolve([
            { name: 'User.controller.e2e.spec.ts', isFile: () => true, isDirectory: () => false }
          ] as any);
        }
        return Promise.resolve([
          { name: 'unit', isDirectory: () => true, isFile: () => false },
          { name: 'integration', isDirectory: () => true, isFile: () => false },
          { name: 'e2e', isDirectory: () => true, isFile: () => false },
          { name: 'fixtures', isDirectory: () => true, isFile: () => false },
          { name: 'mocks', isDirectory: () => true, isFile: () => false }
        ] as any);
      });

      // Act
      const result = await service.validateTestStructure(testsPath);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.hasUnitTests).toBe(true);
      expect(result.hasIntegrationTests).toBe(true);
      expect(result.hasE2ETests).toBe(true);
      expect(result.hasFixtures).toBe(true);
      expect(result.hasMocks).toBe(true);
      expect(result.directoryStructure.hasTestDirectory).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });

    it('should handle missing test directory', async () => {
      // Arrange
      const testsPath = '/test/module/__tests__';
      
      // Mock directory doesn't exist
      mockFs.stat.mockRejectedValue(new Error('Directory not found'));

      // Act
      const result = await service.validateTestStructure(testsPath);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.hasUnitTests).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('missing_directory');
      expect(result.issues[0].severity).toBe('error');
    });

    it('should identify missing required directories', async () => {
      // Arrange
      const testsPath = '/test/module/__tests__';
      
      // Mock main directory exists but subdirectories don't
      mockFs.stat.mockImplementation((path: any) => {
        const pathStr = path.toString();
        if (pathStr === testsPath) {
          return Promise.resolve({ isDirectory: () => true } as any);
        }
        return Promise.reject(new Error('Directory not found'));
      });

      mockFs.readdir.mockResolvedValue([]);
      // Mock empty directories for test types

      // Act
      const result = await service.validateTestStructure(testsPath);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      const missingDirIssues = result.issues.filter(issue => issue.type === 'missing_directory');
      expect(missingDirIssues.length).toBeGreaterThan(0);
      expect(missingDirIssues.some(issue => issue.message.includes('unit'))).toBe(true);
    });
  });

  describe('validateTestNaming', () => {
    it('should validate correct test file names', async () => {
      // Arrange
      const testFiles = [
        '/test/User.spec.ts',
        '/test/UserRepository.integration.spec.ts',
        '/test/User.controller.e2e.spec.ts',
        '/test/user.fixture.ts',
        '/test/repository.mock.ts'
      ];

      // Act
      const result = await service.validateTestNaming(testFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.validNames).toHaveLength(5);
      expect(result.invalidNames).toHaveLength(0);
    });

    it('should identify invalid test file names', async () => {
      // Arrange
      const testFiles = [
        '/test/User.test.ts', // Should be .spec.ts
        '/test/UserRepository.spec.ts', // Missing .integration
        '/test/User.controller.spec.ts', // Missing .e2e
        '/test/InvalidName.ts' // Missing test suffix
      ];

      // Act
      const result = await service.validateTestNaming(testFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.invalidNames.length).toBeGreaterThan(0);
      
      const testIssue = result.invalidNames.find(issue => 
        issue.filePath.includes('User.test.ts')
      );
      expect(testIssue).toBeDefined();
      expect(testIssue?.suggestion).toContain('.spec.ts');
    });

    it('should handle empty test files array', async () => {
      // Arrange
      const testFiles: string[] = [];

      // Act
      const result = await service.validateTestNaming(testFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.validNames).toHaveLength(0);
      expect(result.invalidNames).toHaveLength(0);
    });
  });

  describe('validateTestPatterns', () => {
    it('should validate test patterns in files', async () => {
      // Arrange
      const testFiles = ['/test/User.spec.ts'];
      const mockTestContent = `
        describe('User', () => {
          beforeEach(() => {
            // setup
          });

          it('should create user', async () => {
            expect(user).toBeDefined();
            await service.createUser();
          });
        });
      `;

      mockFs.readFile.mockResolvedValue(mockTestContent);

      // Act
      const result = await service.validateTestPatterns(testFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.patterns.length).toBeGreaterThan(0);
      
      const describePattern = result.patterns.find(p => p.pattern === 'describe-blocks');
      expect(describePattern?.found).toBe(true);
      
      const itPattern = result.patterns.find(p => p.pattern === 'it-blocks');
      expect(itPattern?.found).toBe(true);
      
      const expectPattern = result.patterns.find(p => p.pattern === 'expect-assertions');
      expect(expectPattern?.found).toBe(true);
    });

    it('should identify missing test patterns', async () => {
      // Arrange
      const testFiles = ['/test/User.spec.ts'];
      const mockTestContent = `
        // Poor test structure - missing describe blocks
        test('should work', () => {
          // no expectations
        });
      `;

      mockFs.readFile.mockResolvedValue(mockTestContent);

      // Act
      const result = await service.validateTestPatterns(testFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
      
      const missingDescribe = result.issues.find(issue => 
        issue.pattern === 'describe-blocks'
      );
      expect(missingDescribe).toBeDefined();
      expect(missingDescribe?.severity).toBe('warning');
    });

    it('should handle file read errors gracefully', async () => {
      // Arrange
      const testFiles = ['/test/User.spec.ts'];
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      // Act
      const result = await service.validateTestPatterns(testFiles);

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBe(0);
      expect(result.patterns.every(p => p.score === 0)).toBe(true);
    });
  });
});