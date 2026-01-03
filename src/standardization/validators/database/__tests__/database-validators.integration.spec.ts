/**
 * Database Validators Integration Tests
 * Tests the validators against real IAM module database files
 */

import { DatabasePatternValidator, DatabasePatternValidationTarget } from '../database-pattern-validator';
import { DatabaseQualityValidator, DatabaseQualityValidationTarget } from '../database-quality-validator';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Database Validators Integration', () => {
  let patternValidator: DatabasePatternValidator;
  let qualityValidator: DatabaseQualityValidator;

  beforeEach(() => {
    patternValidator = new DatabasePatternValidator();
    qualityValidator = new DatabaseQualityValidator();
  });

  describe('Real IAM Module Files', () => {
    it('should validate existing migration files', async () => {
      // Arrange
      const migrationDir = path.join(__dirname, '../../../../../src/database/postgres/migrations');
      
      let migrationFiles: string[] = [];
      try {
        migrationFiles = await fs.readdir(migrationDir);
      } catch (error) {
        // Skip test if migration directory doesn't exist
        console.log('Migration directory not found, skipping test');
        return;
      }

      const migrationPaths = migrationFiles
        .filter(file => file.endsWith('.ts'))
        .map(file => path.join(migrationDir, file));

      if (migrationPaths.length === 0) {
        console.log('No migration files found, skipping test');
        return;
      }

      const target: DatabasePatternValidationTarget = {
        modulePath: migrationDir,
        migrationPaths,
        seedPaths: []
      };

      // Act
      const result = await patternValidator.validate(target);

      // Assert
      expect(result).toBeDefined();
      expect(result.metadata.migrationsChecked).toBeGreaterThan(0);
      
      // Log any issues for review (not failing the test)
      if (result.issues.length > 0) {
        console.log('Migration pattern issues found:', result.issues.map(i => i.message));
      }
    });

    it('should validate existing seed files', async () => {
      // Arrange
      const seedDir = path.join(__dirname, '../../../../../src/database/postgres/seeds');
      
      let seedFiles: string[] = [];
      try {
        seedFiles = await fs.readdir(seedDir);
      } catch (error) {
        // Skip test if seed directory doesn't exist
        console.log('Seed directory not found, skipping test');
        return;
      }

      const seedPaths = seedFiles
        .filter(file => file.endsWith('.ts'))
        .map(file => path.join(seedDir, file));

      if (seedPaths.length === 0) {
        console.log('No seed files found, skipping test');
        return;
      }

      const target: DatabasePatternValidationTarget = {
        modulePath: seedDir,
        migrationPaths: [],
        seedPaths
      };

      // Act
      const result = await patternValidator.validate(target);

      // Assert
      expect(result).toBeDefined();
      expect(result.metadata.seedsChecked).toBeGreaterThan(0);
      
      // Log any issues for review (not failing the test)
      if (result.issues.length > 0) {
        console.log('Seed pattern issues found:', result.issues.map(i => i.message));
      }
    });

    it('should validate IAM entity files', async () => {
      // Arrange
      const entityDir = path.join(__dirname, '../../../../../src/modules/iam/infrastructure/persistence/entities');
      
      let entityFiles: string[] = [];
      try {
        entityFiles = await fs.readdir(entityDir);
      } catch (error) {
        // Skip test if entity directory doesn't exist
        console.log('Entity directory not found, skipping test');
        return;
      }

      const entityPaths = entityFiles
        .filter(file => file.endsWith('.entity.ts'))
        .map(file => path.join(entityDir, file));

      if (entityPaths.length === 0) {
        console.log('No entity files found, skipping test');
        return;
      }

      const target: DatabaseQualityValidationTarget = {
        modulePath: entityDir,
        migrationPaths: [],
        seedPaths: [],
        entityPaths
      };

      // Act
      const result = await qualityValidator.validate(target);

      // Assert
      expect(result).toBeDefined();
      expect(result.metadata.entitiesChecked).toBeGreaterThan(0);
      
      // Log any issues for review (not failing the test)
      if (result.issues.length > 0) {
        console.log('Entity quality issues found:', result.issues.map(i => i.message));
      }
    });
  });

  describe('Validator Requirements', () => {
    it('should have comprehensive requirements coverage', () => {
      // Act
      const patternRequirements = patternValidator.getRequirements();
      const qualityRequirements = qualityValidator.getRequirements();

      // Assert
      expect(patternRequirements.length).toBeGreaterThanOrEqual(10);
      expect(qualityRequirements.length).toBeGreaterThanOrEqual(9);

      // Check that all database categories are covered
      const allRequirements = [...patternRequirements, ...qualityRequirements];
      const ruleIds = allRequirements.map(r => r.id);
      
      expect(ruleIds).toContain('migration-naming');
      expect(ruleIds).toContain('migration-up-method');
      expect(ruleIds).toContain('migration-down-method');
      expect(ruleIds).toContain('migration-foreign-keys');
      expect(ruleIds).toContain('seed-naming');
      expect(ruleIds).toContain('seed-idempotency');
      expect(ruleIds).toContain('entity-decorators');
    });
  });
});