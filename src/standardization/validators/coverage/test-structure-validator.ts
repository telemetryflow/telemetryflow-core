/**
 * Test Structure Validator
 * Validates test directory organization, required test files, and naming conventions
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TestStructureValidator,
  TestStructureValidation,
  TestNamingValidation,
  TestPatternValidation,
  DirectoryStructureValidation,
  TestStructureIssue,
  TestNamingIssue,
  TestNamingConvention,
  TestPatternResult,
  TestPatternIssue
} from '../../interfaces/coverage.interface';

@Injectable()
export class TestStructureValidatorService implements TestStructureValidator {
  private readonly logger = new Logger(TestStructureValidatorService.name);

  // Required test directory structure
  private readonly REQUIRED_TEST_DIRECTORIES = [
    'unit',
    'integration', 
    'e2e',
    'fixtures',
    'mocks'
  ];

  // Test naming conventions
  private readonly NAMING_CONVENTIONS: TestNamingConvention[] = [
    {
      pattern: '**/*.spec.ts',
      description: 'Unit test files should end with .spec.ts',
      examples: ['User.spec.ts', 'CreateUser.handler.spec.ts'],
      required: true
    },
    {
      pattern: '**/*.integration.spec.ts',
      description: 'Integration test files should end with .integration.spec.ts',
      examples: ['UserRepository.integration.spec.ts'],
      required: true
    },
    {
      pattern: '**/*.e2e.spec.ts',
      description: 'E2E test files should end with .e2e.spec.ts',
      examples: ['User.controller.e2e.spec.ts'],
      required: true
    },
    {
      pattern: '**/*.fixture.ts',
      description: 'Test fixture files should end with .fixture.ts',
      examples: ['user.fixture.ts', 'role.fixture.ts'],
      required: false
    },
    {
      pattern: '**/*.mock.ts',
      description: 'Mock files should end with .mock.ts',
      examples: ['repository.mock.ts', 'service.mock.ts'],
      required: false
    }
  ];

  // Test patterns to validate
  private readonly TEST_PATTERNS = [
    {
      name: 'describe-blocks',
      pattern: /describe\s*\(\s*['"`].*['"`]\s*,\s*\(\s*\)\s*=>\s*\{/,
      description: 'Tests should use describe blocks for organization'
    },
    {
      name: 'it-blocks',
      pattern: /it\s*\(\s*['"`].*['"`]\s*,\s*.*\s*=>\s*\{/,
      description: 'Tests should use it blocks for individual test cases'
    },
    {
      name: 'beforeEach-setup',
      pattern: /beforeEach\s*\(\s*.*\s*=>\s*\{/,
      description: 'Tests should use beforeEach for setup when needed'
    },
    {
      name: 'expect-assertions',
      pattern: /expect\s*\(/,
      description: 'Tests should contain expect assertions'
    },
    {
      name: 'async-await',
      pattern: /async\s+.*\s*=>\s*\{[\s\S]*await\s+/,
      description: 'Async tests should use async/await pattern'
    }
  ];

  /**
   * Validate overall test structure for a module
   */
  async validateTestStructure(testsPath: string): Promise<TestStructureValidation> {
    this.logger.log(`Validating test structure at: ${testsPath}`);

    try {
      // Check if tests directory exists
      const testsExist = await this.directoryExists(testsPath);
      if (!testsExist) {
        return {
          isValid: false,
          score: 0,
          hasUnitTests: false,
          hasIntegrationTests: false,
          hasE2ETests: false,
          hasFixtures: false,
          hasMocks: false,
          directoryStructure: await this.validateDirectoryStructure(testsPath),
          issues: [{
            type: 'missing_directory',
            severity: 'error',
            message: `Tests directory not found: ${testsPath}`,
            location: testsPath,
            suggestion: 'Create tests directory with proper structure',
            autoFixable: true
          }]
        };
      }

      // Validate directory structure
      const directoryStructure = await this.validateDirectoryStructure(testsPath);
      
      // Check for different test types
      const hasUnitTests = await this.hasTestType(testsPath, 'unit');
      const hasIntegrationTests = await this.hasTestType(testsPath, 'integration');
      const hasE2ETests = await this.hasTestType(testsPath, 'e2e');
      const hasFixtures = await this.hasTestType(testsPath, 'fixtures');
      const hasMocks = await this.hasTestType(testsPath, 'mocks');

      // Collect issues
      const issues = await this.collectStructureIssues(testsPath, directoryStructure);

      // Calculate score
      const score = this.calculateStructureScore({
        hasUnitTests,
        hasIntegrationTests,
        hasE2ETests,
        hasFixtures,
        hasMocks,
        directoryStructure,
        issueCount: issues.length
      });

      const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

      return {
        isValid,
        score,
        hasUnitTests,
        hasIntegrationTests,
        hasE2ETests,
        hasFixtures,
        hasMocks,
        directoryStructure,
        issues
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to validate test structure: ${errorMessage}`, errorStack);
      throw new Error(`Test structure validation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate test file naming conventions
   */
  async validateTestNaming(testFiles: string[]): Promise<TestNamingValidation> {
    this.logger.log(`Validating naming for ${testFiles.length} test files`);

    const validNames: string[] = [];
    const invalidNames: TestNamingIssue[] = [];

    for (const filePath of testFiles) {
      const fileName = path.basename(filePath);
      const isValid = this.validateFileName(fileName);

      if (isValid) {
        validNames.push(filePath);
      } else {
        const issue = this.createNamingIssue(filePath, fileName);
        invalidNames.push(issue);
      }
    }

    const score = testFiles.length > 0 ? (validNames.length / testFiles.length) * 100 : 100;
    const isValid = invalidNames.filter(issue => issue.severity === 'error').length === 0;

    return {
      isValid,
      score,
      validNames,
      invalidNames,
      conventions: this.NAMING_CONVENTIONS
    };
  }

  /**
   * Validate test patterns and best practices
   */
  async validateTestPatterns(testFiles: string[]): Promise<TestPatternValidation> {
    this.logger.log(`Validating patterns for ${testFiles.length} test files`);

    const patterns: TestPatternResult[] = [];
    const issues: TestPatternIssue[] = [];

    for (const pattern of this.TEST_PATTERNS) {
      let foundCount = 0;
      let totalFiles = 0;

      for (const filePath of testFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          totalFiles++;

          if (pattern.pattern.test(content)) {
            foundCount++;
          } else {
            // Create issue for missing pattern
            issues.push({
              filePath,
              pattern: pattern.name,
              issue: `Missing ${pattern.description.toLowerCase()}`,
              suggestion: `Add ${pattern.name} to improve test structure`,
              severity: 'warning'
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Could not read test file ${filePath}: ${errorMessage}`);
        }
      }

      const score = totalFiles > 0 ? (foundCount / totalFiles) * 100 : 0;
      patterns.push({
        pattern: pattern.name,
        description: pattern.description,
        found: foundCount > 0,
        examples: [], // Would be populated with actual examples found
        score
      });
    }

    const overallScore = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.score, 0) / patterns.length 
      : 0;

    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

    return {
      isValid,
      score: overallScore,
      patterns,
      issues
    };
  }

  /**
   * Validate directory structure
   */
  private async validateDirectoryStructure(testsPath: string): Promise<DirectoryStructureValidation> {
    const hasTestDirectory = await this.directoryExists(testsPath);
    
    if (!hasTestDirectory) {
      return {
        hasTestDirectory: false,
        hasUnitDirectory: false,
        hasIntegrationDirectory: false,
        hasE2EDirectory: false,
        hasFixturesDirectory: false,
        hasMocksDirectory: false,
        extraDirectories: []
      };
    }

    const hasUnitDirectory = await this.directoryExists(path.join(testsPath, 'unit'));
    const hasIntegrationDirectory = await this.directoryExists(path.join(testsPath, 'integration'));
    const hasE2EDirectory = await this.directoryExists(path.join(testsPath, 'e2e'));
    const hasFixturesDirectory = await this.directoryExists(path.join(testsPath, 'fixtures'));
    const hasMocksDirectory = await this.directoryExists(path.join(testsPath, 'mocks'));

    // Find extra directories
    const extraDirectories = await this.findExtraDirectories(testsPath);

    return {
      hasTestDirectory,
      hasUnitDirectory,
      hasIntegrationDirectory,
      hasE2EDirectory,
      hasFixturesDirectory,
      hasMocksDirectory,
      extraDirectories
    };
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if module has specific test type
   */
  private async hasTestType(testsPath: string, testType: string): Promise<boolean> {
    const testTypePath = path.join(testsPath, testType);
    const exists = await this.directoryExists(testTypePath);
    
    if (!exists) return false;

    // Check if directory has test files
    const files = await this.findTestFiles(testTypePath);
    return files.length > 0;
  }

  /**
   * Find test files in a directory
   */
  private async findTestFiles(dirPath: string): Promise<string[]> {
    try {
      const files: string[] = [];
      await this.walkDirectory(dirPath, files, 5); // Limit depth for test directories
      return files.filter(file => /\.(spec|test)\.ts$/.test(file));
    } catch {
      return [];
    }
  }

  /**
   * Recursively walk directory to find files
   */
  private async walkDirectory(dirPath: string, files: string[], maxDepth: number = 10, currentDepth: number = 0): Promise<void> {
    // Prevent infinite recursion and excessive memory usage
    if (currentDepth >= maxDepth) {
      this.logger.warn(`Maximum directory depth (${maxDepth}) reached for: ${dirPath}`);
      return;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden files and directories to prevent issues
        if (entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.walkDirectory(fullPath, files, maxDepth, currentDepth + 1);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read - log but don't throw
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.debug(`Could not read directory ${dirPath}: ${errorMessage}`);
    }
  }

  /**
   * Find extra directories that shouldn't be in tests
   */
  private async findExtraDirectories(testsPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(testsPath, { withFileTypes: true });
      const directories = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      return directories.filter(dir => !this.REQUIRED_TEST_DIRECTORIES.includes(dir));
    } catch {
      return [];
    }
  }

  /**
   * Collect structure issues
   */
  private async collectStructureIssues(
    testsPath: string, 
    directoryStructure: DirectoryStructureValidation
  ): Promise<TestStructureIssue[]> {
    const issues: TestStructureIssue[] = [];

    // Check for missing required directories
    if (!directoryStructure.hasUnitDirectory) {
      issues.push({
        type: 'missing_directory',
        severity: 'error',
        message: 'Missing unit tests directory',
        location: path.join(testsPath, 'unit'),
        suggestion: 'Create unit/ directory for unit tests',
        autoFixable: true
      });
    }

    if (!directoryStructure.hasIntegrationDirectory) {
      issues.push({
        type: 'missing_directory',
        severity: 'warning',
        message: 'Missing integration tests directory',
        location: path.join(testsPath, 'integration'),
        suggestion: 'Create integration/ directory for integration tests',
        autoFixable: true
      });
    }

    if (!directoryStructure.hasE2EDirectory) {
      issues.push({
        type: 'missing_directory',
        severity: 'warning',
        message: 'Missing e2e tests directory',
        location: path.join(testsPath, 'e2e'),
        suggestion: 'Create e2e/ directory for end-to-end tests',
        autoFixable: true
      });
    }

    if (!directoryStructure.hasFixturesDirectory) {
      issues.push({
        type: 'missing_directory',
        severity: 'info',
        message: 'Missing fixtures directory',
        location: path.join(testsPath, 'fixtures'),
        suggestion: 'Create fixtures/ directory for test data',
        autoFixable: true
      });
    }

    if (!directoryStructure.hasMocksDirectory) {
      issues.push({
        type: 'missing_directory',
        severity: 'info',
        message: 'Missing mocks directory',
        location: path.join(testsPath, 'mocks'),
        suggestion: 'Create mocks/ directory for mock implementations',
        autoFixable: true
      });
    }

    // Check for extra directories
    for (const extraDir of directoryStructure.extraDirectories) {
      issues.push({
        type: 'invalid_structure',
        severity: 'warning',
        message: `Unexpected directory in tests: ${extraDir}`,
        location: path.join(testsPath, extraDir),
        suggestion: 'Remove or move to appropriate location',
        autoFixable: false
      });
    }

    // Check for required test files for aggregates and handlers
    await this.checkRequiredTestFiles(testsPath, issues);

    return issues;
  }

  /**
   * Check for required test files for all aggregates and handlers
   */
  private async checkRequiredTestFiles(testsPath: string, issues: TestStructureIssue[]): Promise<void> {
    const modulePath = path.dirname(testsPath);
    
    // Check domain aggregates
    await this.checkDomainTestFiles(modulePath, testsPath, issues);
    
    // Check application handlers
    await this.checkApplicationTestFiles(modulePath, testsPath, issues);
    
    // Check infrastructure repositories
    await this.checkInfrastructureTestFiles(modulePath, testsPath, issues);
    
    // Check presentation controllers
    await this.checkPresentationTestFiles(modulePath, testsPath, issues);
  }

  /**
   * Check domain layer test files
   */
  private async checkDomainTestFiles(
    modulePath: string, 
    testsPath: string, 
    issues: TestStructureIssue[]
  ): Promise<void> {
    const domainPath = path.join(modulePath, 'domain');
    
    // Check aggregates
    const aggregatesPath = path.join(domainPath, 'aggregates');
    if (await this.directoryExists(aggregatesPath)) {
      const aggregateFiles = await this.findTypeScriptFiles(aggregatesPath);
      
      for (const aggregateFile of aggregateFiles) {
        if (path.basename(aggregateFile) === 'index.ts') continue;
        
        const baseName = path.basename(aggregateFile, '.ts');
        const expectedTestFile = path.join(testsPath, 'unit', 'domain', 'aggregates', `${baseName}.spec.ts`);
        
        if (!await this.fileExists(expectedTestFile)) {
          issues.push({
            type: 'missing_file',
            severity: 'error',
            message: `Missing unit test for aggregate: ${baseName}`,
            location: expectedTestFile,
            suggestion: `Create unit test file: ${expectedTestFile}`,
            autoFixable: false
          });
        }
      }
    }

    // Check value objects
    const valueObjectsPath = path.join(domainPath, 'value-objects');
    if (await this.directoryExists(valueObjectsPath)) {
      const valueObjectFiles = await this.findTypeScriptFiles(valueObjectsPath);
      
      for (const voFile of valueObjectFiles) {
        if (path.basename(voFile) === 'index.ts') continue;
        
        const baseName = path.basename(voFile, '.ts');
        const expectedTestFile = path.join(testsPath, 'unit', 'domain', 'value-objects', `${baseName}.spec.ts`);
        
        if (!await this.fileExists(expectedTestFile)) {
          issues.push({
            type: 'missing_file',
            severity: 'warning',
            message: `Missing unit test for value object: ${baseName}`,
            location: expectedTestFile,
            suggestion: `Create unit test file: ${expectedTestFile}`,
            autoFixable: false
          });
        }
      }
    }
  }

  /**
   * Check application layer test files
   */
  private async checkApplicationTestFiles(
    modulePath: string, 
    testsPath: string, 
    issues: TestStructureIssue[]
  ): Promise<void> {
    const applicationPath = path.join(modulePath, 'application');
    
    // Check handlers
    const handlersPath = path.join(applicationPath, 'handlers');
    if (await this.directoryExists(handlersPath)) {
      const handlerFiles = await this.findHandlerFiles(handlersPath);
      
      for (const handlerFile of handlerFiles) {
        const baseName = path.basename(handlerFile, '.ts');
        const expectedTestFile = path.join(testsPath, 'unit', 'application', 'handlers', `${baseName}.spec.ts`);
        
        if (!await this.fileExists(expectedTestFile)) {
          issues.push({
            type: 'missing_file',
            severity: 'error',
            message: `Missing unit test for handler: ${baseName}`,
            location: expectedTestFile,
            suggestion: `Create unit test file: ${expectedTestFile}`,
            autoFixable: false
          });
        }
      }
    }
  }

  /**
   * Check infrastructure layer test files
   */
  private async checkInfrastructureTestFiles(
    modulePath: string, 
    testsPath: string, 
    issues: TestStructureIssue[]
  ): Promise<void> {
    const infrastructurePath = path.join(modulePath, 'infrastructure');
    
    // Check repositories
    const repositoriesPath = path.join(infrastructurePath, 'persistence', 'repositories');
    if (await this.directoryExists(repositoriesPath)) {
      const repositoryFiles = await this.findRepositoryFiles(repositoriesPath);
      
      for (const repoFile of repositoryFiles) {
        const baseName = path.basename(repoFile, '.ts');
        const expectedTestFile = path.join(testsPath, 'integration', 'infrastructure', 'repositories', `${baseName}.integration.spec.ts`);
        
        if (!await this.fileExists(expectedTestFile)) {
          issues.push({
            type: 'missing_file',
            severity: 'warning',
            message: `Missing integration test for repository: ${baseName}`,
            location: expectedTestFile,
            suggestion: `Create integration test file: ${expectedTestFile}`,
            autoFixable: false
          });
        }
      }
    }
  }

  /**
   * Check presentation layer test files
   */
  private async checkPresentationTestFiles(
    modulePath: string, 
    testsPath: string, 
    issues: TestStructureIssue[]
  ): Promise<void> {
    const presentationPath = path.join(modulePath, 'presentation');
    
    // Check controllers
    const controllersPath = path.join(presentationPath, 'controllers');
    if (await this.directoryExists(controllersPath)) {
      const controllerFiles = await this.findControllerFiles(controllersPath);
      
      for (const controllerFile of controllerFiles) {
        const baseName = path.basename(controllerFile, '.ts');
        const expectedTestFile = path.join(testsPath, 'e2e', 'presentation', 'controllers', `${baseName}.e2e.spec.ts`);
        
        if (!await this.fileExists(expectedTestFile)) {
          issues.push({
            type: 'missing_file',
            severity: 'warning',
            message: `Missing e2e test for controller: ${baseName}`,
            location: expectedTestFile,
            suggestion: `Create e2e test file: ${expectedTestFile}`,
            autoFixable: false
          });
        }
      }
    }
  }

  /**
   * Find TypeScript files in a directory
   */
  private async findTypeScriptFiles(dirPath: string): Promise<string[]> {
    try {
      const files: string[] = [];
      await this.walkDirectory(dirPath, files, 5); // Limit depth for source directories
      return files.filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.test.ts'));
    } catch {
      return [];
    }
  }

  /**
   * Find handler files
   */
  private async findHandlerFiles(dirPath: string): Promise<string[]> {
    const files = await this.findTypeScriptFiles(dirPath);
    return files.filter(file => file.endsWith('.handler.ts'));
  }

  /**
   * Find repository files
   */
  private async findRepositoryFiles(dirPath: string): Promise<string[]> {
    const files = await this.findTypeScriptFiles(dirPath);
    return files.filter(file => file.endsWith('Repository.ts'));
  }

  /**
   * Find controller files
   */
  private async findControllerFiles(dirPath: string): Promise<string[]> {
    const files = await this.findTypeScriptFiles(dirPath);
    return files.filter(file => file.endsWith('.controller.ts'));
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate structure score
   */
  private calculateStructureScore(metrics: {
    hasUnitTests: boolean;
    hasIntegrationTests: boolean;
    hasE2ETests: boolean;
    hasFixtures: boolean;
    hasMocks: boolean;
    directoryStructure: DirectoryStructureValidation;
    issueCount: number;
  }): number {
    let score = 0;
    
    // Required components (60 points)
    if (metrics.hasUnitTests) score += 25;
    if (metrics.hasIntegrationTests) score += 20;
    if (metrics.hasE2ETests) score += 15;
    
    // Optional components (20 points)
    if (metrics.hasFixtures) score += 10;
    if (metrics.hasMocks) score += 10;
    
    // Directory structure (20 points)
    if (metrics.directoryStructure.hasTestDirectory) score += 5;
    if (metrics.directoryStructure.hasUnitDirectory) score += 5;
    if (metrics.directoryStructure.hasIntegrationDirectory) score += 5;
    if (metrics.directoryStructure.hasE2EDirectory) score += 5;
    
    // Penalty for issues
    const issuePenalty = Math.min(20, metrics.issueCount * 2);
    score = Math.max(0, score - issuePenalty);
    
    return score;
  }

  /**
   * Validate file name against conventions
   */
  private validateFileName(fileName: string): boolean {
    // Specific checks for obvious violations
    
    // 1. .test.ts should be .spec.ts
    if (fileName.endsWith('.test.ts')) {
      return false;
    }
    
    // 2. Files without any test suffix are invalid (but allow .ts files that match patterns)
    const hasTestSuffix = fileName.includes('.spec.') || 
                         fileName.includes('.fixture.') || 
                         fileName.includes('.mock.') ||
                         fileName.endsWith('.spec.ts');
    
    if (!fileName.endsWith('.ts') || !hasTestSuffix) {
      return false;
    }

    // 3. Semantic validation based on file name patterns
    const lowerFileName = fileName.toLowerCase();
    
    // Repository files should have .integration. (but allow if they already do)
    if (lowerFileName.includes('repository') && 
        !lowerFileName.includes('.integration.') && 
        !lowerFileName.includes('.mock.')) {
      return false;
    }
    
    // Controller files should have .e2e. (but allow if they already do)
    if (lowerFileName.includes('controller') && 
        !lowerFileName.includes('.e2e.') && 
        !lowerFileName.includes('.mock.')) {
      return false;
    }

    // 4. Check against naming conventions
    for (const convention of this.NAMING_CONVENTIONS) {
      const pattern = convention.pattern.replace('**/', '').replace('*', '.*');
      const regex = new RegExp(pattern);
      if (regex.test(fileName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create naming issue for invalid file name
   */
  private createNamingIssue(filePath: string, fileName: string): TestNamingIssue {
    let suggestion = 'Follow naming convention: ';
    let severity: 'error' | 'warning' = 'warning';
    
    if (fileName.includes('.test.')) {
      suggestion += 'Use .spec.ts instead of .test.ts';
      severity = 'error'; // This is a critical naming violation
    } else if (!fileName.includes('.spec.') && !fileName.includes('.test.') && 
               !fileName.includes('.fixture.') && !fileName.includes('.mock.')) {
      suggestion += 'Add appropriate test suffix (.spec.ts, .fixture.ts, .mock.ts)';
      severity = 'error'; // Missing test suffix is critical
    } else if (fileName.toLowerCase().includes('repository') && !fileName.includes('.integration.')) {
      suggestion += 'Repository tests should use .integration.spec.ts';
      severity = 'error'; // Semantic naming violation
    } else if (fileName.toLowerCase().includes('controller') && !fileName.includes('.e2e.')) {
      suggestion += 'Controller tests should use .e2e.spec.ts';
      severity = 'error'; // Semantic naming violation
    } else {
      suggestion += 'Check naming convention requirements';
      severity = 'warning'; // Other issues are warnings
    }

    return {
      filePath,
      issue: `Invalid test file naming: ${fileName}`,
      suggestion,
      severity
    };
  }
}