/**
 * Property-based tests for Database Pattern Validators
 * Feature: iam-module-standardization, Property 4: Database Pattern Compliance
 */

import { DatabasePatternValidator, DatabasePatternValidationTarget } from '../database-pattern-validator';
import { DatabaseQualityValidator, DatabaseQualityValidationTarget } from '../database-quality-validator';
import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Database Pattern Validators - Property Tests', () => {
  let patternValidator: DatabasePatternValidator;
  let qualityValidator: DatabaseQualityValidator;
  let tempDir: string;

  beforeEach(async () => {
    patternValidator = new DatabasePatternValidator();
    qualityValidator = new DatabaseQualityValidator();
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'database-pattern-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Property 4: Database Pattern Compliance
   * For any database migration or seed file, it should follow the established naming patterns 
   * and include proper error handling
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
   */
  describe('Property 4: Database Pattern Compliance', () => {
    it('should validate that properly named migration files pass validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid migration file data
          fc.record({
            timestamp: fc.integer({ min: 1704240000000, max: 1999999999999 }), // Valid timestamp range
            description: fc.string({ minLength: 3, maxLength: 50 }).filter(s => 
              /^[A-Z][a-zA-Z0-9]*$/.test(s) // PascalCase description
            ),
            hasUpMethod: fc.boolean(),
            hasDownMethod: fc.boolean(),
            hasHardcodedValues: fc.boolean(),
            hasEnvVars: fc.boolean()
          }),
          async ({ timestamp, description, hasUpMethod, hasDownMethod, hasHardcodedValues, hasEnvVars }) => {
            // Arrange: Create a migration file with the specified properties
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migration-test-'));
            const migrationDir = path.join(testTempDir, 'migrations');
            await fs.mkdir(migrationDir, { recursive: true });

            try {
              const fileName = `${timestamp}-${description}.ts`;
              const filePath = path.join(migrationDir, fileName);
              
              const migrationContent = createMigrationContent({
                className: `${description}${timestamp}`,
                hasUpMethod,
                hasDownMethod,
                hasHardcodedValues,
                hasEnvVars
              });

              await fs.writeFile(filePath, migrationContent);

              const target: DatabasePatternValidationTarget = {
                modulePath: testTempDir,
                migrationPaths: [filePath],
                seedPaths: []
              };

              // Act: Validate the migration file
              const result = await patternValidator.validate(target);

              // Assert: Validation result should be consistent with file properties
              expect(result).toHaveProperty('isValid');
              expect(result).toHaveProperty('issues');
              expect(Array.isArray(result.issues)).toBe(true);

              // Check naming convention validation
              const namingIssues = result.issues.filter(issue => issue.rule === 'migration-naming');
              expect(namingIssues.length).toBe(0); // Should pass naming validation

              // Check method validation
              const upMethodIssues = result.issues.filter(issue => issue.rule === 'migration-up-method');
              const downMethodIssues = result.issues.filter(issue => issue.rule === 'migration-down-method');
              
              if (hasUpMethod) {
                expect(upMethodIssues.length).toBe(0);
              } else {
                expect(upMethodIssues.length).toBeGreaterThan(0);
              }

              if (hasDownMethod) {
                expect(downMethodIssues.length).toBe(0);
              } else {
                expect(downMethodIssues.length).toBeGreaterThan(0);
              }

              // Check hardcoded values validation
              const hardcodedIssues = result.issues.filter(issue => issue.rule === 'migration-hardcoded-values');
              if (hasHardcodedValues) {
                expect(hardcodedIssues.length).toBeGreaterThan(0);
              } else {
                expect(hardcodedIssues.length).toBe(0);
              }

              // Overall validity should depend on critical issues
              const errorIssues = result.issues.filter(issue => issue.severity === 'error');
              const expectedValid = hasUpMethod && hasDownMethod && !hasHardcodedValues;
              expect(result.isValid).toBe(expectedValid);

            } finally {
              // Clean up test-specific temporary directory
              try {
                await fs.rm(testTempDir, { recursive: true, force: true });
              } catch (error) {
                // Ignore cleanup errors
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that properly named seed files pass validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid seed file data
          fc.record({
            timestamp: fc.integer({ min: 1704240000000, max: 1999999999999 }),
            module: fc.string({ minLength: 3, maxLength: 20 }).filter(s => 
              /^[a-z][a-z-]*$/.test(s) // Only lowercase letters and hyphens, no numbers
            ),
            entity: fc.string({ minLength: 3, maxLength: 20 }).filter(s => 
              /^[a-z][a-z-]*$/.test(s) // Only lowercase letters and hyphens, no numbers
            ),
            hasErrorHandling: fc.boolean(),
            hasIdempotency: fc.boolean(),
            hasLogging: fc.boolean(),
            hasHardcodedValues: fc.boolean()
          }),
          async ({ timestamp, module, entity, hasErrorHandling, hasIdempotency, hasLogging, hasHardcodedValues }) => {
            // Arrange: Create a seed file with the specified properties
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'seed-test-'));
            const seedDir = path.join(testTempDir, 'seeds');
            await fs.mkdir(seedDir, { recursive: true });

            try {
              const fileName = `${timestamp}-seed-${module}-${entity}.ts`;
              const filePath = path.join(seedDir, fileName);
              
              const seedContent = createSeedContent({
                functionName: `seed${module.charAt(0).toUpperCase() + module.slice(1)}${entity.charAt(0).toUpperCase() + entity.slice(1)}`,
                hasErrorHandling,
                hasIdempotency,
                hasLogging,
                hasHardcodedValues
              });

              await fs.writeFile(filePath, seedContent);

              const target: DatabasePatternValidationTarget = {
                modulePath: testTempDir,
                migrationPaths: [],
                seedPaths: [filePath]
              };

              // Act: Validate the seed file
              const result = await patternValidator.validate(target);

              // Assert: Validation result should be consistent with file properties
              expect(result).toHaveProperty('isValid');
              expect(result).toHaveProperty('issues');
              expect(Array.isArray(result.issues)).toBe(true);

              // Check naming convention validation
              const namingIssues = result.issues.filter(issue => issue.rule === 'seed-naming');
              expect(namingIssues.length).toBe(0); // Should pass naming validation

              // Check error handling validation
              const errorHandlingIssues = result.issues.filter(issue => issue.rule === 'seed-error-handling');
              if (hasErrorHandling) {
                expect(errorHandlingIssues.length).toBe(0);
              } else {
                expect(errorHandlingIssues.length).toBeGreaterThan(0);
              }

              // Check idempotency validation
              const idempotencyIssues = result.issues.filter(issue => issue.rule === 'seed-idempotency');
              if (hasIdempotency) {
                expect(idempotencyIssues.length).toBe(0);
              } else {
                expect(idempotencyIssues.length).toBeGreaterThan(0);
              }

              // Check logging validation
              const loggingIssues = result.issues.filter(issue => issue.rule === 'seed-logging');
              if (hasLogging) {
                expect(loggingIssues.length).toBe(0);
              } else {
                expect(loggingIssues.length).toBeGreaterThan(0);
              }

              // Check hardcoded values validation
              const hardcodedIssues = result.issues.filter(issue => issue.rule === 'seed-hardcoded-values');
              if (hasHardcodedValues) {
                expect(hardcodedIssues.length).toBeGreaterThan(0);
              } else {
                expect(hardcodedIssues.length).toBe(0);
              }

              // Overall validity should depend on critical issues (hardcoded values are errors)
              const errorIssues = result.issues.filter(issue => issue.severity === 'error');
              const expectedValid = !hasHardcodedValues;
              expect(result.isValid).toBe(expectedValid);

            } finally {
              // Clean up test-specific temporary directory
              try {
                await fs.rm(testTempDir, { recursive: true, force: true });
              } catch (error) {
                // Ignore cleanup errors
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that invalid file naming patterns are detected', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid file naming scenarios
          fc.record({
            fileType: fc.constantFrom('migration', 'seed'),
            invalidNaming: fc.constantFrom(
              'no-timestamp.ts',
              'invalid_underscore.ts',
              '123-no-description.ts',
              'timestamp-lowercase-description.ts',
              'seed-missing-module.ts',
              'seed-module-missing-entity.ts'
            )
          }),
          async ({ fileType, invalidNaming }) => {
            // Arrange: Create a file with invalid naming
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'invalid-naming-test-'));
            const fileDir = path.join(testTempDir, fileType === 'migration' ? 'migrations' : 'seeds');
            await fs.mkdir(fileDir, { recursive: true });

            try {
              const filePath = path.join(fileDir, invalidNaming);
              const content = fileType === 'migration' 
                ? createBasicMigrationContent()
                : createBasicSeedContent();
              
              await fs.writeFile(filePath, content);

              const target: DatabasePatternValidationTarget = {
                modulePath: testTempDir,
                migrationPaths: fileType === 'migration' ? [filePath] : [],
                seedPaths: fileType === 'seed' ? [filePath] : []
              };

              // Act: Validate the file
              const result = await patternValidator.validate(target);

              // Assert: Invalid naming should be detected
              const namingRule = fileType === 'migration' ? 'migration-naming' : 'seed-naming';
              const namingIssues = result.issues.filter(issue => issue.rule === namingRule);
              
              expect(namingIssues.length).toBeGreaterThan(0);
              expect(result.isValid).toBe(false);

              // Naming issues should be auto-fixable
              for (const issue of namingIssues) {
                expect(issue.autoFixable).toBe(true);
                expect(issue.severity).toBe('error');
              }

            } finally {
              // Clean up test-specific temporary directory
              try {
                await fs.rm(testTempDir, { recursive: true, force: true });
              } catch (error) {
                // Ignore cleanup errors
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that database quality patterns are enforced', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate database quality scenarios
          fc.record({
            hasForeignKeys: fc.boolean(),
            hasIndexes: fc.boolean(),
            hasSoftDelete: fc.boolean(),
            isUserRelatedTable: fc.boolean(),
            entityType: fc.constantFrom('User', 'Role', 'Permission', 'Organization', 'Tenant')
          }),
          async ({ hasForeignKeys, hasIndexes, hasSoftDelete, isUserRelatedTable, entityType }) => {
            // Arrange: Create migration and entity files with specified quality patterns
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quality-test-'));
            const migrationDir = path.join(testTempDir, 'migrations');
            const entityDir = path.join(testTempDir, 'entities');
            await fs.mkdir(migrationDir, { recursive: true });
            await fs.mkdir(entityDir, { recursive: true });

            try {
              // Create migration file
              const migrationPath = path.join(migrationDir, '1704240000001-CreateTestTable.ts');
              const tableName = entityType.toLowerCase() + 's'; // users, roles, permissions, etc.
              const migrationContent = createQualityMigrationContent({
                tableName,
                hasForeignKeys,
                hasIndexes,
                hasSoftDelete,
                isUserRelatedTable: true // All our test entities are user-related
              });
              await fs.writeFile(migrationPath, migrationContent);

              // Create entity file
              const entityPath = path.join(entityDir, `${entityType}.entity.ts`);
              const entityContent = createQualityEntityContent({
                entityName: entityType,
                hasSoftDelete,
                hasTimestamps: true,
                isUserRelated: true // All our test entities are user-related
              });
              await fs.writeFile(entityPath, entityContent);

              const target: DatabaseQualityValidationTarget = {
                modulePath: testTempDir,
                migrationPaths: [migrationPath],
                seedPaths: [],
                entityPaths: [entityPath]
              };

              // Act: Validate database quality
              const result = await qualityValidator.validate(target);

              // Assert: Quality validation should be consistent with patterns
              expect(result).toHaveProperty('isValid');
              expect(result).toHaveProperty('issues');
              expect(Array.isArray(result.issues)).toBe(true);

              // Check foreign key validation
              const fkIssues = result.issues.filter(issue => issue.rule === 'migration-foreign-keys');
              if (!hasForeignKeys && migrationContent.includes('_id uuid')) {
                expect(fkIssues.length).toBeGreaterThan(0);
              }

              // Check index validation
              const indexIssues = result.issues.filter(issue => issue.rule === 'migration-performance-indexes');
              if (!hasIndexes && (migrationContent.includes('email') || migrationContent.includes('name'))) {
                expect(indexIssues.length).toBeGreaterThan(0);
              }

              // Check soft delete validation for user-related tables
              const softDeleteIssues = result.issues.filter(issue => 
                issue.rule === 'migration-soft-delete' || issue.rule === 'entity-soft-delete'
              );
              // All our test entities are user-related, so should have soft delete issues if not implemented
              if (!hasSoftDelete) {
                expect(softDeleteIssues.length).toBeGreaterThan(0);
              }

              // All quality issues should be auto-fixable or provide clear guidance
              for (const issue of result.issues) {
                expect(issue).toHaveProperty('autoFixable');
                expect(issue).toHaveProperty('severity');
                expect(['error', 'warning', 'info']).toContain(issue.severity);
              }

            } finally {
              // Clean up test-specific temporary directory
              try {
                await fs.rm(testTempDir, { recursive: true, force: true });
              } catch (error) {
                // Ignore cleanup errors
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that validation results are consistent across multiple runs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a fixed scenario to test consistency
          fc.record({
            migrationCount: fc.integer({ min: 1, max: 3 }),
            seedCount: fc.integer({ min: 1, max: 3 }),
            hasValidNaming: fc.boolean(),
            hasRequiredMethods: fc.boolean()
          }),
          async ({ migrationCount, seedCount, hasValidNaming, hasRequiredMethods }) => {
            // Arrange: Create consistent test data
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'consistency-test-'));
            const migrationDir = path.join(testTempDir, 'migrations');
            const seedDir = path.join(testTempDir, 'seeds');
            await fs.mkdir(migrationDir, { recursive: true });
            await fs.mkdir(seedDir, { recursive: true });

            try {
              const migrationPaths: string[] = [];
              const seedPaths: string[] = [];

              // Create migration files
              for (let i = 0; i < migrationCount; i++) {
                const timestamp = 1704240000000 + i;
                const fileName = hasValidNaming 
                  ? `${timestamp}-CreateTable${i + 1}.ts`
                  : `invalid-migration-${i + 1}.ts`;
                
                const filePath = path.join(migrationDir, fileName);
                const content = createMigrationContent({
                  className: `CreateTable${i + 1}${timestamp}`,
                  hasUpMethod: hasRequiredMethods,
                  hasDownMethod: hasRequiredMethods,
                  hasHardcodedValues: false,
                  hasEnvVars: true
                });
                
                await fs.writeFile(filePath, content);
                migrationPaths.push(filePath);
              }

              // Create seed files
              for (let i = 0; i < seedCount; i++) {
                const timestamp = 1704240000000 + i;
                const fileName = hasValidNaming 
                  ? `${timestamp}-seed-test-module-entity.ts`  // Use valid kebab-case without numbers
                  : `invalid-seed-${i + 1}.ts`;
                
                const filePath = path.join(seedDir, fileName);
                const content = createSeedContent({
                  functionName: `seedTestModuleEntity`,  // Remove numbers from function name too
                  hasErrorHandling: hasRequiredMethods,
                  hasIdempotency: hasRequiredMethods,
                  hasLogging: hasRequiredMethods,
                  hasHardcodedValues: false
                });
                
                await fs.writeFile(filePath, content);
                seedPaths.push(filePath);
              }

              const target: DatabasePatternValidationTarget = {
                modulePath: testTempDir,
                migrationPaths,
                seedPaths
              };

              // Act: Validate multiple times
              const result1 = await patternValidator.validate(target);
              const result2 = await patternValidator.validate(target);

              // Assert: Results should be identical
              expect(result1.isValid).toBe(result2.isValid);
              expect(result1.issues.length).toBe(result2.issues.length);
              
              // Issue types should be consistent
              const issueRules1 = result1.issues.map(issue => issue.rule).sort();
              const issueRules2 = result2.issues.map(issue => issue.rule).sort();
              expect(issueRules1).toEqual(issueRules2);

              // Validation should be deterministic based on input properties
              if (hasValidNaming && hasRequiredMethods) {
                // Should have no ERROR level issues, but may have warnings
                const errorIssues = result1.issues.filter(issue => issue.severity === 'error');
                expect(errorIssues.length).toBe(0);
                expect(result1.isValid).toBe(true);
              } else {
                expect(result1.isValid).toBe(false);
                expect(result1.issues.length).toBeGreaterThan(0);
              }

            } finally {
              // Clean up test-specific temporary directory
              try {
                await fs.rm(testTempDir, { recursive: true, force: true });
              } catch (error) {
                // Ignore cleanup errors
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Helper functions for creating test content
  function createMigrationContent(options: {
    className: string;
    hasUpMethod: boolean;
    hasDownMethod: boolean;
    hasHardcodedValues: boolean;
    hasEnvVars: boolean;
  }): string {
    const { className, hasUpMethod, hasDownMethod, hasHardcodedValues, hasEnvVars } = options;
    
    let content = `import { MigrationInterface, QueryRunner } from 'typeorm';\n\n`;
    content += `export class ${className} implements MigrationInterface {\n`;
    
    if (hasUpMethod) {
      content += `  public async up(queryRunner: QueryRunner): Promise<void> {\n`;
      if (hasHardcodedValues) {
        content += `    await queryRunner.query(\`CREATE DATABASE telemetryflow_db\`);\n`;
      } else {
        content += `    await queryRunner.query(\`CREATE TABLE users (id uuid PRIMARY KEY)\`);\n`;
      }
      if (hasEnvVars) {
        content += `    const dbName = process.env.DATABASE_NAME || 'default';\n`;
      }
      content += `  }\n\n`;
    } else if (hasHardcodedValues) {
      // Add hardcoded values even without proper up method for testing
      content += `  // Migration with hardcoded values\n`;
      content += `  // CREATE DATABASE telemetryflow_db\n`;
    }
    
    if (hasDownMethod) {
      content += `  public async down(queryRunner: QueryRunner): Promise<void> {\n`;
      if (hasHardcodedValues) {
        content += `    await queryRunner.query(\`DROP DATABASE telemetryflow_db\`);\n`;
      } else {
        content += `    await queryRunner.query(\`DROP TABLE users\`);\n`;
      }
      content += `  }\n`;
    }
    
    content += `}\n`;
    return content;
  }

  function createSeedContent(options: {
    functionName: string;
    hasErrorHandling: boolean;
    hasIdempotency: boolean;
    hasLogging: boolean;
    hasHardcodedValues: boolean;
  }): string {
    const { functionName, hasErrorHandling, hasIdempotency, hasLogging, hasHardcodedValues } = options;
    
    let content = `import { DataSource } from 'typeorm';\n\n`;
    content += `export async function ${functionName}(dataSource: DataSource): Promise<void> {\n`;
    
    if (hasErrorHandling) {
      content += `  try {\n`;
    }
    
    if (hasLogging) {
      content += `    console.log('Starting seed operation...');\n`;
    }
    
    if (hasIdempotency) {
      // Use patterns that the validator actually recognizes
      content += `    const userRepo = dataSource.getRepository('User');\n`;
      content += `    const existing = await userRepo.findOne({ where: { email: 'test@example.com' } });\n`;
      content += `    if (existing) return;\n`;
    } else {
      content += `    const userRepo = dataSource.getRepository('User');\n`;
    }
    
    if (hasHardcodedValues) {
      content += `    await userRepo.save({ email: 'test@localhost', host: 'localhost' });\n`;
    } else {
      content += `    await userRepo.save({ email: process.env.DEFAULT_EMAIL || 'test@example.com' });\n`;
    }
    
    if (hasLogging) {
      content += `    console.log('Seed operation completed');\n`;
    }
    
    if (hasErrorHandling) {
      content += `  } catch (error) {\n`;
      content += `    console.error('Seed failed:', error);\n`;
      content += `    throw error;\n`;
      content += `  }\n`;
    }
    
    content += `}\n`;
    return content;
  }

  function createBasicMigrationContent(): string {
    return `export class BasicMigration {\n  // Basic migration\n}\n`;
  }

  function createBasicSeedContent(): string {
    return `export function basicSeed() {\n  // Basic seed\n}\n`;
  }

  function createQualityMigrationContent(options: {
    tableName: string;
    hasForeignKeys: boolean;
    hasIndexes: boolean;
    hasSoftDelete: boolean;
    isUserRelatedTable: boolean;
  }): string {
    const { tableName, hasForeignKeys, hasIndexes, hasSoftDelete, isUserRelatedTable } = options;
    
    let content = `import { MigrationInterface, QueryRunner } from 'typeorm';\n\n`;
    content += `export class CreateTestTable1704240000001 implements MigrationInterface {\n`;
    content += `  public async up(queryRunner: QueryRunner): Promise<void> {\n`;
    content += `    await queryRunner.query(\`CREATE TABLE "${tableName}" (\n`;
    content += `      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    content += `      "name" varchar(255) NOT NULL,\n`;
    content += `      "email" varchar(255) UNIQUE,\n`;
    
    if (hasForeignKeys) {
      content += `      "organization_id" uuid,\n`;
    } else {
      content += `      "organization_id" uuid,\n`; // Has foreign key column but no constraint
    }
    
    if (hasSoftDelete) {
      content += `      "deleted_at" timestamp NULL,\n`;
    }
    
    content += `      "created_at" timestamp DEFAULT NOW(),\n`;
    content += `      "updated_at" timestamp DEFAULT NOW()\n`;
    
    if (hasForeignKeys) {
      content += `,\n      CONSTRAINT "FK_${tableName}_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")\n`;
    }
    
    content += `    )\`);\n`;
    
    if (hasIndexes) {
      content += `    await queryRunner.query(\`CREATE INDEX "IDX_${tableName}_email" ON "${tableName}"("email")\`);\n`;
      content += `    await queryRunner.query(\`CREATE INDEX "IDX_${tableName}_name" ON "${tableName}"("name")\`);\n`;
    }
    
    content += `  }\n\n`;
    content += `  public async down(queryRunner: QueryRunner): Promise<void> {\n`;
    content += `    await queryRunner.query(\`DROP TABLE "${tableName}"\`);\n`;
    content += `  }\n`;
    content += `}\n`;
    
    return content;
  }

  function createQualityEntityContent(options: {
    entityName: string;
    hasSoftDelete: boolean;
    hasTimestamps: boolean;
    isUserRelated: boolean;
  }): string {
    const { entityName, hasSoftDelete, hasTimestamps, isUserRelated } = options;
    
    let content = `import { Entity, PrimaryGeneratedColumn, Column`;
    if (hasTimestamps) {
      content += `, CreateDateColumn, UpdateDateColumn`;
    }
    if (hasSoftDelete) {
      content += `, DeleteDateColumn`;
    }
    content += ` } from 'typeorm';\n\n`;
    
    content += `@Entity('${entityName.toLowerCase()}s')\n`;
    content += `export class ${entityName}Entity {\n`;
    content += `  @PrimaryGeneratedColumn('uuid')\n`;
    content += `  id: string;\n\n`;
    
    content += `  @Column({ length: 255 })\n`;
    content += `  name: string;\n\n`;
    
    if (isUserRelated) {
      content += `  @Column({ unique: true })\n`;
      content += `  email: string;\n\n`;
    }
    
    if (hasTimestamps) {
      content += `  @CreateDateColumn({ name: 'created_at' })\n`;
      content += `  createdAt: Date;\n\n`;
      content += `  @UpdateDateColumn({ name: 'updated_at' })\n`;
      content += `  updatedAt: Date;\n\n`;
    }
    
    if (hasSoftDelete) {
      content += `  @DeleteDateColumn({ name: 'deleted_at' })\n`;
      content += `  deletedAt?: Date;\n`;
    }
    
    content += `}\n`;
    return content;
  }
});