/**
 * Tests for DocumentationValidator
 */

import { DocumentationValidatorImpl } from '../documentation-validator';
import { IssueSeverity } from '../../../interfaces/validation.interface';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
  mkdir: jest.fn()
}));

describe('DocumentationValidator', () => {
  let validator: DocumentationValidatorImpl;
  const mockFs = require('fs/promises');

  beforeEach(() => {
    validator = new DocumentationValidatorImpl();
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should fail validation when README.md is missing', async () => {
      // Arrange
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const target = {
        modulePath: '/test/module',
        moduleName: 'test-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe(IssueSeverity.ERROR);
      expect(result.issues[0].message).toContain('README.md file is missing');
    });

    it('should pass validation with complete documentation', async () => {
      // Arrange
      const mockReadmeContent = `
# Test Module

## Overview
This is a comprehensive test module with all required sections.

## Architecture
The module follows DDD patterns with clear separation of concerns.

## Features
- Feature 1: Complete implementation
- Feature 2: Comprehensive testing
- Feature 3: Full documentation

## API Documentation
Complete API documentation with examples.

## Database Schema
Detailed database schema with relationships.

## Getting Started
Step-by-step guide to get started.

## Testing
Comprehensive testing strategy and examples.

## Development Guide
Guidelines for developers contributing to this module.

## License
MIT License for open source usage.

\`\`\`typescript
// Example code
const example = new TestModule();
\`\`\`
      `.repeat(10); // Make it long enough

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(mockReadmeContent);
      mockFs.stat.mockResolvedValue({
        size: mockReadmeContent.length,
        mtime: new Date()
      });

      const target = {
        modulePath: '/test/module',
        moduleName: 'test-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.metadata?.moduleName).toBe('test-module');
    });

    it('should identify missing required sections', async () => {
      // Arrange
      const incompleteReadme = `
# Test Module

## Overview
Basic overview only.
      `;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(incompleteReadme);
      mockFs.stat.mockResolvedValue({
        size: incompleteReadme.length,
        mtime: new Date()
      });

      const target = {
        modulePath: '/test/module',
        moduleName: 'test-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      const missingSectionIssues = result.issues.filter(issue => 
        issue.message.includes('section') && issue.message.includes('missing')
      );
      expect(missingSectionIssues.length).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      mockFs.access.mockRejectedValue(new Error('Permission denied'));

      const target = {
        modulePath: '/invalid/path',
        moduleName: 'invalid-module'
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe(IssueSeverity.ERROR);
    });
  });

  describe('getRequirements', () => {
    it('should return all documentation requirements', () => {
      // Act
      const requirements = validator.getRequirements();

      // Assert
      expect(requirements).toHaveLength(6);
      expect(requirements.map(r => r.id)).toContain('readme-exists');
      expect(requirements.map(r => r.id)).toContain('readme-length');
      expect(requirements.map(r => r.id)).toContain('readme-sections');
      expect(requirements.map(r => r.id)).toContain('api-docs-exist');
      expect(requirements.map(r => r.id)).toContain('openapi-spec');
      expect(requirements.map(r => r.id)).toContain('diagrams-exist');
    });
  });
});