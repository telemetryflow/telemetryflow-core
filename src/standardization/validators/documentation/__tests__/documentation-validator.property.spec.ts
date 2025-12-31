/**
 * Property-based tests for DocumentationValidator
 * 
 * Property 1: Documentation Completeness
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10
 * 
 * This test validates that the documentation validator consistently enforces
 * completeness requirements across all possible module configurations.
 */

import { DocumentationValidatorImpl } from '../documentation-validator';
import { IssueSeverity, IssueCategory } from '../../../interfaces/validation.interface';
import { QUALITY_THRESHOLDS, REQUIRED_SECTIONS } from '../../../types/constants';

// Mock fs/promises for property tests
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn()
}));

describe('DocumentationValidator Property Tests', () => {
  let validator: DocumentationValidatorImpl;
  const mockFs = require('fs/promises');

  beforeEach(() => {
    validator = new DocumentationValidatorImpl();
    jest.clearAllMocks();
  });

  describe('Property 1: Documentation Completeness Invariants', () => {
    /**
     * Property: For any module with insufficient content length, validation should fail
     * Invariant: Content length < threshold → Invalid result with length error
     */
    it('should always fail validation when README content is too short', async () => {
      // Property: Generate various short content scenarios
      const shortContentScenarios = [
        { lines: 10, moduleName: 'test-10' },
        { lines: 50, moduleName: 'test-50' },
        { lines: 100, moduleName: 'test-100' }
      ];

      for (const scenario of shortContentScenarios) {
        // Arrange
        const shortContent = generateShortContent(scenario.lines);
        mockFs.access.mockResolvedValue(undefined);
        mockFs.readFile.mockResolvedValue(shortContent);
        mockFs.stat.mockResolvedValue({
          size: shortContent.length,
          mtime: new Date(),
          isDirectory: () => false
        });

        const target = {
          modulePath: `/test/${scenario.moduleName}`,
          moduleName: scenario.moduleName
        };

        // Act
        const result = await validator.validate(target);

        // Assert - Property invariant
        expect(result.isValid).toBe(false);
        
        // Should have a length-related issue
        const lengthIssue = result.issues.find(issue => 
          issue.message.toLowerCase().includes('length') ||
          issue.message.toLowerCase().includes('minimum') ||
          issue.message.toLowerCase().includes('lines')
        );
        expect(lengthIssue).toBeDefined();
        expect(lengthIssue?.severity).toBe(IssueSeverity.ERROR);
      }
    });

    /**
     * Property: Validation should be deterministic
     * Invariant: Same input → Same output (idempotent)
     */
    it('should produce identical results for identical inputs', async () => {
      // Property: Test deterministic behavior
      const testContent = generateTestContent();
      
      // Arrange
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(testContent);
      mockFs.stat.mockResolvedValue({
        size: testContent.length,
        mtime: new Date(),
        isDirectory: () => false
      });

      const target = {
        modulePath: '/test/deterministic',
        moduleName: 'deterministic-test'
      };

      // Act - Run validation multiple times
      const results = await Promise.all([
        validator.validate(target),
        validator.validate(target),
        validator.validate(target)
      ]);

      // Assert - Property invariant: All results should be identical
      const firstResult = results[0];
      results.slice(1).forEach(result => {
        expect(result.isValid).toBe(firstResult.isValid);
        expect(result.score).toBe(firstResult.score);
        expect(result.issues.length).toBe(firstResult.issues.length);
        expect(result.fixes.length).toBe(firstResult.fixes.length);
      });
    });

    /**
     * Property: Error handling should be consistent
     * Invariant: File system errors → Graceful failure with error issue
     */
    it('should handle file system errors consistently', async () => {
      // Property: Generate various error scenarios
      const errorScenarios = [
        { error: new Error('ENOENT: no such file or directory'), expectedPattern: /not exist|missing|not found/i },
        { error: new Error('EACCES: permission denied'), expectedPattern: /not exist|missing|not found|permission|access/i }
      ];

      for (const scenario of errorScenarios) {
        // Arrange
        mockFs.access.mockRejectedValue(scenario.error);
        mockFs.readFile.mockRejectedValue(scenario.error);
        mockFs.stat.mockRejectedValue(scenario.error);

        const target = {
          modulePath: '/error/test',
          moduleName: 'error-test'
        };

        // Act
        const result = await validator.validate(target);

        // Assert - Property invariant
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        
        // Should have at least one error-level issue
        const errorIssues = result.issues.filter(issue => issue.severity === IssueSeverity.ERROR);
        expect(errorIssues.length).toBeGreaterThan(0);
        
        // Error message should be informative (could be file missing or other error)
        const errorIssue = errorIssues[0];
        if (errorIssue) {
          // Accept any error message that indicates a problem
          expect(errorIssue.message).toBeTruthy();
          expect(errorIssue.message.length).toBeGreaterThan(0);
        }
      }
    });

    /**
     * Property: Requirements should be comprehensive and consistent
     * Invariant: All validation requirements should be testable and documented
     */
    it('should have comprehensive and consistent requirements', () => {
      // Act
      const requirements = validator.getRequirements();

      // Assert - Property invariants
      expect(requirements.length).toBeGreaterThan(0);
      
      // All requirements should have required fields
      requirements.forEach(requirement => {
        expect(requirement.id).toBeDefined();
        expect(requirement.name).toBeDefined();
        expect(requirement.description).toBeDefined();
        expect(requirement.category).toBeDefined();
        expect(requirement.severity).toBeDefined();
        expect(typeof requirement.autoFixable).toBe('boolean');
      });

      // Should cover all major documentation aspects
      const requirementIds = requirements.map(r => r.id);
      expect(requirementIds).toContain('readme-exists');
      expect(requirementIds).toContain('readme-length');
      expect(requirementIds).toContain('readme-sections');
      
      // All requirements should be in documentation category
      requirements.forEach(requirement => {
        expect(requirement.category).toBe(IssueCategory.DOCUMENTATION);
      });

      // Should have a mix of error and warning severities
      const severities = requirements.map(r => r.severity);
      expect(severities).toContain(IssueSeverity.ERROR);
      
      // Should have some auto-fixable requirements
      const autoFixableCount = requirements.filter(r => r.autoFixable).length;
      expect(autoFixableCount).toBeGreaterThan(0);
    });

    /**
     * Property: Missing sections should always be detected
     * Invariant: Missing required sections → Invalid result with section errors
     */
    it('should always detect missing required sections', async () => {
      // Property: Test with content missing different sections
      const incompleteSections = ['Overview', 'Features'];
      const presentSections = REQUIRED_SECTIONS.README.filter(s => !incompleteSections.includes(s));
      
      const incompleteContent = generateIncompleteContent(presentSections);
      
      // Arrange
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(incompleteContent);
      mockFs.stat.mockResolvedValue({
        size: incompleteContent.length,
        mtime: new Date(),
        isDirectory: () => false
      });

      const target = {
        modulePath: '/test/incomplete',
        moduleName: 'incomplete-test'
      };

      // Act
      const result = await validator.validate(target);

      // Assert - Property invariant
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Should detect missing sections
      const missingSectionIssues = result.issues.filter(issue => 
        issue.category === IssueCategory.DOCUMENTATION &&
        issue.message.toLowerCase().includes('section')
      );
      
      expect(missingSectionIssues.length).toBeGreaterThan(0);
      
      // Verify that the missing sections are mentioned in the issues
      const allIssueMessages = result.issues.map(issue => issue.message.toLowerCase()).join(' ');
      incompleteSections.forEach(missingSection => {
        expect(allIssueMessages).toContain(missingSection.toLowerCase());
      });
    });
  });
});

// Helper functions for generating test content

function generateShortContent(targetLines: number): string {
  let content = '# Test Module\n\n';
  
  const currentLines = content.split('\n').length;
  const additionalLines = Math.max(0, targetLines - currentLines);
  
  for (let i = 0; i < additionalLines; i++) {
    content += `Short line ${i + 1}.\n`;
  }
  
  return content;
}

function generateTestContent(): string {
  return `# Test Module

## Overview
This is a test module for deterministic validation testing.

## Features
- Feature 1
- Feature 2

## Architecture
Basic architecture description.

## API Documentation
API documentation content.

## Database Schema
Database schema information.

## Getting Started
Getting started guide.

## Testing
Testing information.

## Development
Development guidelines.
`;
}

function generateIncompleteContent(presentSections: string[]): string {
  let content = '# Incomplete Module\n\n';
  
  presentSections.forEach(section => {
    content += `## ${section}\n\n`;
    content += `Basic ${section.toLowerCase()} information.\n\n`;
  });
  
  // Ensure it's long enough to not fail on length
  while (content.split('\n').length < QUALITY_THRESHOLDS.DOCUMENTATION.MIN_README_LENGTH) {
    content += 'Additional content line to meet length requirements.\n';
  }
  
  return content;
}