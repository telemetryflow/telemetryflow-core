/**
 * Structure Validation Integration Tests
 * 
 * Tests the file structure validator and fixer with the actual IAM module
 */

import { FileStructureValidator } from '../file-structure-validator';
import { StructureFixer } from '../structure-fixer';
import * as path from 'path';

describe('Structure Validation Integration', () => {
  let validator: FileStructureValidator;
  let fixer: StructureFixer;
  const iamModulePath = path.resolve(__dirname, '../../../../modules/iam');

  beforeEach(() => {
    validator = new FileStructureValidator();
    fixer = new StructureFixer();
  });

  describe('IAM Module Structure Validation', () => {
    it('should validate IAM module structure', async () => {
      const result = await validator.validate({
        modulePath: iamModulePath,
        enforceBarrelExports: true,
        validateNamingConventions: true,
        checkRequiredDirectories: true
      });

      // The result should have some structure
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('fixes');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('score');

      // Log results for debugging
      console.log('IAM Module Validation Results:');
      console.log(`- Valid: ${result.isValid}`);
      console.log(`- Score: ${result.score}`);
      console.log(`- Issues: ${result.issues.length}`);
      console.log(`- Fixes: ${result.fixes.length}`);

      if (result.issues.length > 0) {
        console.log('Issues found:');
        result.issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue.severity}: ${issue.message}`);
        });
      }
    });

    it('should analyze structure fixes for IAM module', async () => {
      const result = await fixer.fixStructure({
        modulePath: iamModulePath,
        createMissingDirectories: true,
        generateBarrelExports: true,
        fixNamingViolations: false, // Don't actually rename files in tests
        dryRun: true // Don't make actual changes
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('changes');
      expect(result).toHaveProperty('errors');

      console.log('IAM Module Structure Fix Analysis:');
      console.log(`- Success: ${result.success}`);
      console.log(`- Changes needed: ${result.changes.length}`);
      console.log(`- Errors: ${result.errors.length}`);

      if (result.changes.length > 0) {
        console.log('Potential changes:');
        result.changes.forEach((change, index) => {
          console.log(`  ${index + 1}. ${change.type}: ${change.description}`);
        });
      }
    });
  });

  describe('Validator Requirements', () => {
    it('should have comprehensive requirements coverage', () => {
      const requirements = validator.getRequirements();
      
      // Should cover all the requirements from the spec
      const requiredIds = ['req-3.1', 'req-3.2', 'req-3.3', 'req-3.4', 'req-3.5', 'req-3.9', 'req-3.10'];
      
      requiredIds.forEach(id => {
        const requirement = requirements.find(req => req.id === id);
        expect(requirement).toBeDefined();
      });
    });
  });
});