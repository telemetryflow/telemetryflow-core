/**
 * Database Quality Validator Tests
 */

import { DatabaseQualityValidator, DatabaseQualityValidationTarget } from '../database-quality-validator';
import { IssueSeverity, IssueCategory } from '../../../interfaces/validation.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('DatabaseQualityValidator', () => {
  let validator: DatabaseQualityValidator;
  let tempDir: string;

  beforeEach(() => {
    validator = new DatabaseQualityValidator();
    tempDir = path.join(__dirname, 'temp');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Migration Quality Validation', () => {
    it('should detect missing foreign key constraints', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, '1704240000001-CreateUsersTable.ts');
      const migrationContent = `
export class CreateUsersTable1704240000001 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        role_id uuid NOT NULL
      )
    \`);
  }
}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: [],
        entityPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const fkIssue = result.issues.find(issue => issue.rule === 'migration-foreign-keys');
      expect(fkIssue).toBeDefined();
      expect(fkIssue?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should detect missing performance indexes', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, '1704240000001-CreateUsersTable.ts');
      const migrationContent = `
export class CreateUsersTable1704240000001 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        email varchar(255) NOT NULL,
        organization_id uuid NOT NULL
      )
    \`);
  }
}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: [],
        entityPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true); // Warning, not error
      const indexIssue = result.issues.find(issue => issue.rule === 'migration-performance-indexes');
      expect(indexIssue).toBeDefined();
      expect(indexIssue?.severity).toBe(IssueSeverity.WARNING);
    });

    it('should recommend soft delete for user tables', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const migrationPath = path.join(tempDir, '1704240000001-CreateUsersTable.ts');
      const migrationContent = `
export class CreateUsersTable1704240000001 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        email varchar(255) NOT NULL
      )
    \`);
  }
}`;
      await fs.writeFile(migrationPath, migrationContent);

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [migrationPath],
        seedPaths: [],
        entityPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true); // Warning, not error
      const softDeleteIssue = result.issues.find(issue => issue.rule === 'migration-soft-delete');
      expect(softDeleteIssue).toBeDefined();
      expect(softDeleteIssue?.severity).toBe(IssueSeverity.WARNING);
    });
  });

  describe('Seed Quality Validation', () => {
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

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [seedPath],
        entityPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false); // Error for missing idempotency
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

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [seedPath],
        entityPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const idempotencyIssue = result.issues.find(issue => issue.rule === 'seed-idempotency');
      expect(idempotencyIssue).toBeDefined();
      expect(idempotencyIssue?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should validate proper seed with idempotency', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const seedPath = path.join(tempDir, '1704240000001-seed-iam-users.ts');
      const seedContent = `
export async function seedIAMUsers(dataSource: DataSource): Promise<void> {
  try {
    console.log('Starting seed...');
    const userRepo = dataSource.getRepository(UserEntity);
    const existing = await userRepo.findOne({ where: { email: 'test@example.com' } });
    if (!existing) {
      await userRepo.save({ email: 'test@example.com' });
    }
    console.log('Seed completed');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`;
      await fs.writeFile(seedPath, seedContent);

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [seedPath],
        entityPaths: []
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Entity Quality Validation', () => {
    it('should detect missing entity decorators', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const entityPath = path.join(tempDir, 'User.entity.ts');
      const entityContent = `
export class UserEntity {
  id: string;
  email: string;
}`;
      await fs.writeFile(entityPath, entityContent);

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [],
        entityPaths: [entityPath]
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(false);
      const decoratorIssue = result.issues.find(issue => issue.rule === 'entity-decorators');
      expect(decoratorIssue).toBeDefined();
      expect(decoratorIssue?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should detect missing timestamp columns', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const entityPath = path.join(tempDir, 'User.entity.ts');
      const entityContent = `
@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;
}`;
      await fs.writeFile(entityPath, entityContent);

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [],
        entityPaths: [entityPath]
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true); // Warning, not error
      const timestampIssue = result.issues.find(issue => issue.rule === 'entity-timestamps');
      expect(timestampIssue).toBeDefined();
      expect(timestampIssue?.severity).toBe(IssueSeverity.WARNING);
    });

    it('should recommend soft delete for user entities', async () => {
      // Arrange
      await fs.mkdir(tempDir, { recursive: true });
      const entityPath = path.join(tempDir, 'User.entity.ts');
      const entityContent = `
@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`;
      await fs.writeFile(entityPath, entityContent);

      const target: DatabaseQualityValidationTarget = {
        modulePath: tempDir,
        migrationPaths: [],
        seedPaths: [],
        entityPaths: [entityPath]
      };

      // Act
      const result = await validator.validate(target);

      // Assert
      expect(result.isValid).toBe(true); // Warning, not error
      const softDeleteIssue = result.issues.find(issue => issue.rule === 'entity-soft-delete');
      expect(softDeleteIssue).toBeDefined();
      expect(softDeleteIssue?.severity).toBe(IssueSeverity.WARNING);
    });
  });

  describe('Requirements', () => {
    it('should return all validation requirements', () => {
      // Act
      const requirements = validator.getRequirements();

      // Assert
      expect(requirements).toHaveLength(9);
      expect(requirements.map(r => r.id)).toContain('migration-foreign-keys');
      expect(requirements.map(r => r.id)).toContain('migration-performance-indexes');
      expect(requirements.map(r => r.id)).toContain('seed-idempotency');
      expect(requirements.map(r => r.id)).toContain('entity-decorators');
    });
  });
});