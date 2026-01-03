/**
 * Database Pattern Validator Tests
 */

import { DatabasePatternValidator, DatabasePatternValidationTarget } from '../database-pattern-validator';
import { IssueSeverity, IssueCategory } from '../../../interfaces/validation.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('DatabasePatternValidator', () => {
  let validator: DatabasePatternValidator;
  let tempDir: string;

  beforeEach(() => {
    validator = new DatabasePatternValidator();
    tempDir = path.join(__dirname, 'temp');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Migration File Validation', () => {
    it('should validate correct migration file naming', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, '1704240000001-CreateUsersTable.ts');
      const migrationContent = `
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1704240000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`CREATE TABLE users (id uuid PRIMARY KEY)\`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`DROP TABLE users\`);
  }
}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect incorrect migration file naming', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, 'create-users-table.ts');
      const migrationContent = `export class CreateUsersTable {}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const namingIssue = result.issues.find(issue => issue.rule === 'migration-naming');
      expect(namingIssue).toBeDefined();
      expect(namingIssue?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should detect missing up() method', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, '1704240000001-CreateUsersTable.ts');
      const migrationContent = `
export class CreateUsersTable1704240000001 {
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`DROP TABLE users\`);
  }
}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const upMethodIssue = result.issues.find(issue => issue.rule === 'migration-up-method');
      expect(upMethodIssue).toBeDefined();
      expect(upMethodIssue?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should detect missing down() method', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, '1704240000001-CreateUsersTable.ts');
      const migrationContent = `
export class CreateUsersTable1704240000001 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`CREATE TABLE users (id uuid PRIMARY KEY)\`);
  }
}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const downMethodIssue = result.issues.find(issue => issue.rule === 'migration-down-method');
      expect(downMethodIssue).toBeDefined();
      expect(downMethodIssue?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should detect hardcoded database names', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, '1704240000001-CreateUsersTable.ts');
      const migrationContent = `
export class CreateUsersTable1704240000001 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`CREATE DATABASE telemetryflow_db\`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`DROP DATABASE telemetryflow_db\`);
  }
}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const hardcodedIssue = result.issues.find(issue => issue.rule === 'migration-hardcoded-values');
      expect(hardcodedIssue).toBeDefined();
      expect(hardcodedIssue?.severity).toBe(IssueSeverity.ERROR);
    });
  });

  describe('Seed File Validation', () => {
    it('should validate correct seed file naming', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const seedPath = path.join(tempDir, '1704240000001-seed-iam-users.ts');
      const seedContent = `
export async function seedIAMUsers(dataSource: DataSource): Promise<void> {
  try {
    const userRepo = dataSource.getRepository(UserEntity);
    const existing = await userRepo.findOne({ where: { email: 'test@example.com' } });
    if (!existing) {
      console.log('Creating user...');
    }
  } catch (error) {
    console.error('Seed failed:', error);
  }
}`;
      await fs.writeFile(seedPath, seedContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [seedPath]
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect incorrect seed file naming', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const seedPath = path.join(tempDir, 'seed-users.ts');
      const seedContent = `export function seedUsers() {}`;
      await fs.writeFile(seedPath, seedContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [seedPath]
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const namingIssue = result.issues.find(issue => issue.rule === 'seed-naming');
      expect(namingIssue).toBeDefined();
      expect(namingIssue?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should detect missing error handling in seeds', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const seedPath = path.join(tempDir, '1704240000001-seed-iam-users.ts');
      const seedContent = `
export async function seedIAMUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(UserEntity);
  await userRepo.save({ email: 'test@example.com' });
}`;
      await fs.writeFile(seedPath, seedContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [seedPath]
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true); // Warning, not error
      const errorHandlingIssue = result.issues.find(issue => issue.rule === 'seed-error-handling');
      expect(errorHandlingIssue).toBeDefined();
      expect(errorHandlingIssue?.severity).toBe(IssueSeverity.WARNING);
    });

    it('should detect missing idempotency in seeds', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const seedPath = path.join(tempDir, '1704240000001-seed-iam-users.ts');
      const seedContent = `
export async function seedIAMUsers(dataSource: DataSource): Promise<void> {
  try {
    const userRepo = dataSource.getRepository(UserEntity);
    await userRepo.save({ email: 'test@example.com' });
  } catch (error) {
    console.error('Error:', error);
  }
}`;
      await fs.writeFile(seedPath, seedContent);

      const target: DatabasePatternValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [seedPath]
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true); // Warning, not error
      const idempotencyIssue = result.issues.find(issue => issue.rule === 'seed-idempotency');
      expect(idempotencyIssue).toBeDefined();
      expect(idempotencyIssue?.severity).toBe(IssueSeverity.WARNING);
    });
  });

  describe('Requirements', () => {
    it('should return all validation requirements', () => {
      // Act
      const requirements = validator.getRequirements();

      // Assert
      expect(requirements).toHaveLength(10);
      expect(requirements.map(r => r.id)).toContain('migration-naming');
      expect(requirements.map(r => r.id)).toContain('migration-up-method');
      expect(requirements.map(r => r.id)).toContain('migration-down-method');
      expect(requirements.map(r => r.id)).toContain('seed-naming');
      expect(requirements.map(r => r.id)).toContain('seed-idempotency');
    });
  });
});