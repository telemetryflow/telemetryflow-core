/**
 * Database Quality Validator
 * 
 * Validates database quality patterns including:
 * - Foreign key constraints in migrations
 * - Performance indexes on frequently queried columns
 * - Soft delete implementation
 * - Seed idempotency and error handling
 */

import { BaseValidator } from '../base-validator';
import { ValidationResult, ValidationRequirement, IssueSeverity, IssueCategory } from '../../interfaces/validation.interface';
import * as path from 'path';

export interface DatabaseQualityValidationTarget {
  modulePath: string;
  migrationPaths: string[];
  seedPaths: string[];
  entityPaths: string[];
}

export class DatabaseQualityValidator extends BaseValidator {
  private readonly commonQueryColumns = [
    'id', 'email', 'code', 'name', 'slug', 'status', 'is_active', 'isActive',
    'created_at', 'createdAt', 'updated_at', 'updatedAt', 'deleted_at', 'deletedAt',
    'organization_id', 'tenant_id', 'workspace_id', 'user_id', 'role_id'
  ];

  async validate(target: DatabaseQualityValidationTarget): Promise<ValidationResult> {
    this.reset();

    try {
      // Validate migration quality
      await this.validateMigrationQuality(target.migrationPaths);

      // Validate seed quality
      await this.validateSeedQuality(target.seedPaths);

      // Validate entity patterns
      await this.validateEntityPatterns(target.entityPaths);

      const isValid = this.issues.filter(issue => issue.severity === IssueSeverity.ERROR).length === 0;

      return this.createResult(isValid, {
        migrationsChecked: target.migrationPaths.length,
        seedsChecked: target.seedPaths.length,
        entitiesChecked: target.entityPaths.length,
        totalIssues: this.issues.length
      });
    } catch (error) {
      this.addIssue(
        'validation-error',
        `Database quality validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'validation-execution',
        target.modulePath
      );

      return this.createResult(false, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async validateMigrationQuality(migrationPaths: string[]): Promise<void> {
    for (const migrationPath of migrationPaths) {
      await this.validateMigrationFile(migrationPath);
    }
  }

  private async validateMigrationFile(migrationPath: string): Promise<void> {
    const fileName = path.basename(migrationPath);

    if (!(await this.fileExists(migrationPath))) {
      return;
    }

    const content = await this.readFile(migrationPath);

    // Check for foreign key constraints
    await this.validateForeignKeyConstraints(content, migrationPath, fileName);

    // Check for performance indexes
    await this.validatePerformanceIndexes(content, migrationPath, fileName);

    // Check for soft delete implementation
    await this.validateSoftDeleteImplementation(content, migrationPath, fileName);
  }

  private async validateForeignKeyConstraints(content: string, filePath: string, fileName: string): Promise<void> {
    // Look for table creation with foreign key columns
    const tableCreationRegex = /CREATE TABLE[^(]*\([^)]*\)/gis;
    const foreignKeyColumnRegex = /(\w+_id)\s+uuid/gi;
    const constraintRegex = /CONSTRAINT\s+["`']?FK_\w+["`']?\s+FOREIGN KEY/gi;
    const referencesRegex = /REFERENCES\s+["`']?\w+["`']?\s*\(["`']?\w+["`']?\)/gi;

    const tableMatches = content.match(tableCreationRegex);
    if (tableMatches) {
      for (const tableMatch of tableMatches) {
        const foreignKeyColumns = [...tableMatch.matchAll(foreignKeyColumnRegex)];
        const constraints = [...tableMatch.matchAll(constraintRegex)];
        const references = [...tableMatch.matchAll(referencesRegex)];

        // Check if foreign key columns have corresponding constraints
        if (foreignKeyColumns.length > 0 && constraints.length === 0 && references.length === 0) {
          this.addIssue(
            `migration-missing-fk-${fileName}`,
            `Migration "${fileName}" has foreign key columns but missing FOREIGN KEY constraints`,
            IssueSeverity.ERROR,
            IssueCategory.DATABASE,
            'migration-foreign-keys',
            filePath,
            true
          );

          this.addFix(
            `migration-missing-fk-${fileName}`,
            'Add FOREIGN KEY constraints for foreign key columns',
            'add-foreign-key-constraints',
            { filePath, foreignKeyColumns: foreignKeyColumns.map(m => m[1]) }
          );
        }

        // Check for proper constraint naming
        if (constraints.length > 0) {
          for (const constraint of constraints) {
            if (!constraint[0].includes('FK_')) {
              this.addIssue(
                `migration-fk-naming-${fileName}`,
                `Migration "${fileName}" should use FK_ prefix for foreign key constraint names`,
                IssueSeverity.WARNING,
                IssueCategory.DATABASE,
                'migration-constraint-naming',
                filePath,
                true
              );
            }
          }
        }
      }
    }
  }

  private async validatePerformanceIndexes(content: string, filePath: string, fileName: string): Promise<void> {
    // Check for CREATE INDEX statements
    const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX[^;]+;/gi;
    const indexes = content.match(indexRegex) || [];

    // Check for common query columns that should have indexes
    const missingIndexes: string[] = [];

    for (const column of this.commonQueryColumns) {
      const columnRegex = new RegExp(`["\`']?${column}["\`']?\\s+(?:uuid|varchar|text|integer|bigint)`, 'gi');
      const indexRegex = new RegExp(`INDEX[^;]*["\`']?${column}["\`']?`, 'gi');

      if (columnRegex.test(content) && !indexRegex.test(content)) {
        // Skip id columns as they are usually primary keys
        if (column !== 'id') {
          missingIndexes.push(column);
        }
      }
    }

    if (missingIndexes.length > 0) {
      this.addIssue(
        `migration-missing-indexes-${fileName}`,
        `Migration "${fileName}" is missing performance indexes for columns: ${missingIndexes.join(', ')}`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'migration-performance-indexes',
        filePath,
        true
      );

      this.addFix(
        `migration-missing-indexes-${fileName}`,
        'Add performance indexes for frequently queried columns',
        'add-performance-indexes',
        { filePath, columns: missingIndexes }
      );
    }

    // Check for proper index naming
    for (const index of indexes) {
      if (!index.includes('IDX_')) {
        this.addIssue(
          `migration-index-naming-${fileName}`,
          `Migration "${fileName}" should use IDX_ prefix for index names`,
          IssueSeverity.WARNING,
          IssueCategory.DATABASE,
          'migration-index-naming',
          filePath,
          true
        );
      }
    }
  }

  private async validateSoftDeleteImplementation(content: string, filePath: string, fileName: string): Promise<void> {
    // Check if table has soft delete columns
    const softDeletePatterns = [
      /deleted_at\s+timestamp/gi,
      /deletedAt\s+timestamp/gi,
      /is_deleted\s+boolean/gi,
      /isDeleted\s+boolean/gi
    ];

    let hasSoftDelete = false;
    for (const pattern of softDeletePatterns) {
      if (pattern.test(content)) {
        hasSoftDelete = true;
        break;
      }
    }

    // If creating user-related tables, recommend soft delete
    const userRelatedTables = ['users', 'roles', 'permissions', 'organizations', 'tenants'];
    const isUserRelatedTable = userRelatedTables.some(table =>
      content.toLowerCase().includes(`create table`) && content.toLowerCase().includes(table)
    );

    if (isUserRelatedTable && !hasSoftDelete) {
      this.addIssue(
        `migration-soft-delete-${fileName}`,
        `Migration "${fileName}" creates user-related tables but doesn't implement soft delete`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'migration-soft-delete',
        filePath,
        true
      );

      this.addFix(
        `migration-soft-delete-${fileName}`,
        'Add soft delete columns (deleted_at timestamp)',
        'add-soft-delete-columns',
        { filePath }
      );
    }
  }

  private async validateSeedQuality(seedPaths: string[]): Promise<void> {
    for (const seedPath of seedPaths) {
      await this.validateSeedFile(seedPath);
    }
  }

  private async validateSeedFile(seedPath: string): Promise<void> {
    const fileName = path.basename(seedPath);

    if (!(await this.fileExists(seedPath))) {
      return;
    }

    const content = await this.readFile(seedPath);

    // Check for comprehensive error handling
    await this.validateSeedErrorHandling(content, seedPath, fileName);

    // Check for idempotency implementation
    await this.validateSeedIdempotency(content, seedPath, fileName);

    // Check for proper logging
    await this.validateSeedLogging(content, seedPath, fileName);
  }

  private async validateSeedErrorHandling(content: string, filePath: string, fileName: string): Promise<void> {
    const errorHandlingPatterns = [
      /try\s*{[\s\S]*}\s*catch/gi,
      /\.catch\(/gi,
      /throw new Error/gi,
      /console\.error/gi,
      /logger\.error/gi
    ];

    let hasErrorHandling = false;
    for (const pattern of errorHandlingPatterns) {
      if (pattern.test(content)) {
        hasErrorHandling = true;
        break;
      }
    }

    if (!hasErrorHandling) {
      this.addIssue(
        `seed-error-handling-${fileName}`,
        `Seed file "${fileName}" lacks comprehensive error handling`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'seed-error-handling',
        filePath,
        true
      );

      this.addFix(
        `seed-error-handling-${fileName}`,
        'Add try/catch blocks and error logging',
        'add-seed-error-handling',
        { filePath }
      );
    }
  }

  private async validateSeedIdempotency(content: string, filePath: string, fileName: string): Promise<void> {
    const idempotencyPatterns = [
      /findOne(?:By)?\s*\(/gi,
      /findOneBy\s*\(/gi,
      /WHERE\s+NOT\s+EXISTS/gi,
      /ON\s+CONFLICT\s+DO\s+NOTHING/gi,
      /IF\s+NOT\s+EXISTS/gi,
      /UPSERT/gi,
      /INSERT\s+IGNORE/gi
    ];

    let hasIdempotency = false;
    for (const pattern of idempotencyPatterns) {
      if (pattern.test(content)) {
        hasIdempotency = true;
        break;
      }
    }

    // Check for INSERT statements without idempotency
    const insertPatterns = [
      /\.save\(/gi,
      /\.insert\(/gi,
      /INSERT\s+INTO/gi
    ];

    let hasInserts = false;
    for (const pattern of insertPatterns) {
      if (pattern.test(content)) {
        hasInserts = true;
        break;
      }
    }

    if (hasInserts && !hasIdempotency) {
      this.addIssue(
        `seed-idempotency-${fileName}`,
        `Seed file "${fileName}" has INSERT operations but lacks idempotency checks`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'seed-idempotency',
        filePath,
        true
      );

      this.addFix(
        `seed-idempotency-${fileName}`,
        'Add idempotency checks before INSERT operations',
        'add-seed-idempotency',
        { filePath }
      );
    }
  }

  private async validateSeedLogging(content: string, filePath: string, fileName: string): Promise<void> {
    const loggingPatterns = [
      /console\.log/gi,
      /logger\./gi,
      /Logger\(/gi
    ];

    let hasLogging = false;
    for (const pattern of loggingPatterns) {
      if (pattern.test(content)) {
        hasLogging = true;
        break;
      }
    }

    if (!hasLogging) {
      this.addIssue(
        `seed-logging-${fileName}`,
        `Seed file "${fileName}" should include logging for seed operations`,
        IssueSeverity.INFO,
        IssueCategory.DATABASE,
        'seed-logging',
        filePath,
        true
      );

      this.addFix(
        `seed-logging-${fileName}`,
        'Add console.log or logger statements for seed operations',
        'add-seed-logging',
        { filePath }
      );
    }
  }

  private async validateEntityPatterns(entityPaths: string[]): Promise<void> {
    for (const entityPath of entityPaths) {
      await this.validateEntityFile(entityPath);
    }
  }

  private async validateEntityFile(entityPath: string): Promise<void> {
    const fileName = path.basename(entityPath);

    if (!(await this.fileExists(entityPath))) {
      return;
    }

    const content = await this.readFile(entityPath);

    // Check for proper entity decorators
    await this.validateEntityDecorators(content, entityPath, fileName);

    // Check for timestamp columns
    await this.validateTimestampColumns(content, entityPath, fileName);

    // Check for soft delete implementation
    await this.validateEntitySoftDelete(content, entityPath, fileName);
  }

  private async validateEntityDecorators(content: string, filePath: string, fileName: string): Promise<void> {
    // Check for @Entity decorator
    if (!content.includes('@Entity')) {
      this.addIssue(
        `entity-decorator-${fileName}`,
        `Entity file "${fileName}" is missing @Entity decorator`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'entity-decorators',
        filePath,
        true
      );
    }

    // Check for primary key
    if (!content.includes('@PrimaryGeneratedColumn') && !content.includes('@PrimaryColumn')) {
      this.addIssue(
        `entity-primary-key-${fileName}`,
        `Entity file "${fileName}" is missing primary key decorator`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'entity-primary-key',
        filePath,
        true
      );
    }

    // Check for column decorators
    const columnRegex = /\s+(\w+):\s*\w+;/g;
    const columns = [...content.matchAll(columnRegex)];
    const decoratedColumns = content.match(/@Column/g) || [];

    if (columns.length > decoratedColumns.length + 1) { // +1 for primary key
      this.addIssue(
        `entity-column-decorators-${fileName}`,
        `Entity file "${fileName}" has columns without @Column decorators`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'entity-column-decorators',
        filePath,
        true
      );
    }
  }

  private async validateTimestampColumns(content: string, filePath: string, fileName: string): Promise<void> {
    const timestampPatterns = [
      /created_at|createdAt/gi,
      /updated_at|updatedAt/gi
    ];

    let hasTimestamps = false;
    for (const pattern of timestampPatterns) {
      if (pattern.test(content)) {
        hasTimestamps = true;
        break;
      }
    }

    if (!hasTimestamps) {
      this.addIssue(
        `entity-timestamps-${fileName}`,
        `Entity file "${fileName}" should include timestamp columns (created_at, updated_at)`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'entity-timestamps',
        filePath,
        true
      );

      this.addFix(
        `entity-timestamps-${fileName}`,
        'Add timestamp columns with appropriate decorators',
        'add-entity-timestamps',
        { filePath }
      );
    }
  }

  private async validateEntitySoftDelete(content: string, filePath: string, fileName: string): Promise<void> {
    // Check for soft delete columns in entities
    const softDeletePatterns = [
      /deleted_at|deletedAt/gi,
      /is_deleted|isDeleted/gi,
      /@DeleteDateColumn/gi
    ];

    let hasSoftDelete = false;
    for (const pattern of softDeletePatterns) {
      if (pattern.test(content)) {
        hasSoftDelete = true;
        break;
      }
    }

    // Recommend soft delete for user-related entities
    const userRelatedEntities = ['User', 'Role', 'Permission', 'Organization', 'Tenant'];
    const isUserRelatedEntity = userRelatedEntities.some(entity =>
      fileName.includes(entity) || content.includes(`class ${entity}`)
    );

    if (isUserRelatedEntity && !hasSoftDelete) {
      this.addIssue(
        `entity-soft-delete-${fileName}`,
        `Entity file "${fileName}" should implement soft delete for user-related data`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'entity-soft-delete',
        filePath,
        true
      );

      this.addFix(
        `entity-soft-delete-${fileName}`,
        'Add @DeleteDateColumn() for soft delete functionality',
        'add-entity-soft-delete',
        { filePath }
      );
    }
  }

  getRequirements(): ValidationRequirement[] {
    return [
      {
        id: 'migration-foreign-keys',
        name: 'Foreign Key Constraints',
        description: 'Migration files must include proper foreign key constraints',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'migration-performance-indexes',
        name: 'Performance Indexes',
        description: 'Migration files should include indexes for frequently queried columns',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'migration-soft-delete',
        name: 'Soft Delete Implementation',
        description: 'User-related tables should implement soft delete',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'seed-error-handling',
        name: 'Seed Error Handling',
        description: 'Seed files must include comprehensive error handling',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'seed-idempotency',
        name: 'Seed Idempotency',
        description: 'Seed files must implement idempotency checks',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'seed-logging',
        name: 'Seed Logging',
        description: 'Seed files should include logging for operations',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.INFO,
        autoFixable: true
      },
      {
        id: 'entity-decorators',
        name: 'Entity Decorators',
        description: 'Entity files must include proper TypeORM decorators',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'entity-timestamps',
        name: 'Entity Timestamps',
        description: 'Entity files should include timestamp columns',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'entity-soft-delete',
        name: 'Entity Soft Delete',
        description: 'User-related entities should implement soft delete',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      }
    ];
  }

  async applyFix(fix: any): Promise<void> {
    switch (fix.action) {
      case 'add-foreign-key-constraints':
        await this.addForeignKeyConstraints(fix.parameters);
        break;
      case 'add-performance-indexes':
        await this.addPerformanceIndexes(fix.parameters);
        break;
      case 'add-soft-delete-columns':
        await this.addSoftDeleteColumns(fix.parameters);
        break;
      case 'add-seed-error-handling':
        await this.addSeedErrorHandling(fix.parameters);
        break;
      case 'add-seed-idempotency':
        await this.addSeedIdempotency(fix.parameters);
        break;
      case 'add-seed-logging':
        await this.addSeedLogging(fix.parameters);
        break;
      case 'add-entity-timestamps':
        await this.addEntityTimestamps(fix.parameters);
        break;
      case 'add-entity-soft-delete':
        await this.addEntitySoftDelete(fix.parameters);
        break;
      default:
        throw new Error(`Unknown fix action: ${fix.action}`);
    }
  }

  private async addForeignKeyConstraints(params: { filePath: string; foreignKeyColumns: string[] }): Promise<void> {
    const content = await this.readFile(params.filePath);
    let updatedContent = content;

    for (const column of params.foreignKeyColumns) {
      const tableName = column.replace('_id', 's'); // user_id -> users
      const constraintName = `FK_${path.basename(params.filePath, '.ts')}_${column}`;

      const constraint = `        CONSTRAINT "${constraintName}" FOREIGN KEY ("${column}") REFERENCES "${tableName}"("id")`;

      // Add constraint before the closing parenthesis of CREATE TABLE
      updatedContent = updatedContent.replace(
        /(\s+)\);/,
        `,\n${constraint}\n$1);`
      );
    }

    await this.writeFile(params.filePath, updatedContent);
  }

  private async addPerformanceIndexes(params: { filePath: string; columns: string[] }): Promise<void> {
    const content = await this.readFile(params.filePath);
    const tableName = this.extractTableName(content);

    let indexStatements = '';
    for (const column of params.columns) {
      const indexName = `IDX_${tableName}_${column}`;
      indexStatements += `    await queryRunner.query(\`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}"("${column}")\`);\n`;
    }

    // Add indexes after table creation
    const updatedContent = content.replace(
      /(await queryRunner\.query\(`CREATE TABLE[^`]+`\);)/,
      `$1\n    \n${indexStatements}`
    );

    await this.writeFile(params.filePath, updatedContent);
  }

  private async addSoftDeleteColumns(params: { filePath: string }): Promise<void> {
    const content = await this.readFile(params.filePath);

    const softDeleteColumn = '        "deleted_at" timestamp NULL';

    // Add soft delete column before closing parenthesis
    const updatedContent = content.replace(
      /(\s+)\);/,
      `,\n${softDeleteColumn}\n$1);`
    );

    await this.writeFile(params.filePath, updatedContent);
  }

  private async addSeedErrorHandling(params: { filePath: string }): Promise<void> {
    const content = await this.readFile(params.filePath);

    // Wrap the main function content in try/catch
    const updatedContent = content.replace(
      /(export async function \w+\([^)]+\): Promise<void> \{)/,
      `$1\n  try {`
    ).replace(
      /(\n\s*console\.log\([^)]+\);\s*\n\s*\})\s*$/,
      `$1\n  } catch (error) {\n    console.error('Seed operation failed:', error);\n    throw error;\n  }\n}`
    );

    await this.writeFile(params.filePath, updatedContent);
  }

  private async addSeedIdempotency(params: { filePath: string }): Promise<void> {
    const content = await this.readFile(params.filePath);

    // Add idempotency check template
    const idempotencyCheck = `
  // Check if data already exists
  const existingCount = await dataSource.query('SELECT COUNT(*) as count FROM table_name');
  if (parseInt(existingCount[0].count) > 0) {
    console.log('   ⚠️  Data already exists, skipping seed');
    return;
  }`;

    const updatedContent = content.replace(
      /(export async function \w+\([^)]+\): Promise<void> \{)/,
      `$1${idempotencyCheck}`
    );

    await this.writeFile(params.filePath, updatedContent);
  }

  private async addSeedLogging(params: { filePath: string }): Promise<void> {
    const content = await this.readFile(params.filePath);

    // Add logging statements
    const startLog = `  console.log('🌱 Starting seed operation...');`;
    const endLog = `  console.log('   ✅ Seed operation completed successfully');`;

    let updatedContent = content.replace(
      /(export async function \w+\([^)]+\): Promise<void> \{)/,
      `$1\n${startLog}`
    );

    // Add end log before the last closing brace
    updatedContent = updatedContent.replace(
      /(\n\s*\})\s*$/,
      `\n${endLog}$1`
    );

    await this.writeFile(params.filePath, updatedContent);
  }

  private async addEntityTimestamps(params: { filePath: string }): Promise<void> {
    const content = await this.readFile(params.filePath);

    const timestampColumns = `
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;`;

    // Add timestamp columns before the last closing brace
    const updatedContent = content.replace(
      /(\n\s*\})\s*$/,
      `${timestampColumns}$1`
    );

    await this.writeFile(params.filePath, updatedContent);
  }

  private async addEntitySoftDelete(params: { filePath: string }): Promise<void> {
    const content = await this.readFile(params.filePath);

    const softDeleteColumn = `
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;`;

    // Add soft delete column before the last closing brace
    const updatedContent = content.replace(
      /(\n\s*\})\s*$/,
      `${softDeleteColumn}$1`
    );

    await this.writeFile(params.filePath, updatedContent);
  }

  private extractTableName(migrationContent: string): string {
    const match = migrationContent.match(/CREATE TABLE[^"]*"([^"]+)"/i);
    return match?.[1] ?? 'unknown_table';
  }
}