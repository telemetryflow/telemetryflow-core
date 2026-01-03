/**
 * Database Pattern Validator
 * 
 * Validates database patterns including:
 * - Migration file naming conventions
 * - Seed file naming conventions
 * - Migration structure (up/down methods)
 * - Environment variable usage
 */

import { BaseValidator } from '../base-validator';
import { ValidationResult, ValidationRequirement, IssueSeverity, IssueCategory } from '../../interfaces/validation.interface';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface DatabasePatternValidationTarget {
  modulePath: string;
  migrationPaths: string[];
  seedPaths: string[];
}

export class DatabasePatternValidator extends BaseValidator {
  private readonly migrationNamePattern = /^\d{13}-[A-Z][a-zA-Z0-9]*\.ts$/;
  private readonly seedNamePattern = /^\d{13}-seed-[a-z-]+-[a-z-]+\.ts$/;

  async validate(target: DatabasePatternValidationTarget): Promise<ValidationResult> {
    this.reset();

    try {
      // Validate migration files
      await this.validateMigrationFiles(target.migrationPaths);
      
      // Validate seed files
      await this.validateSeedFiles(target.seedPaths);

      const isValid = this.issues.filter(issue => issue.severity === IssueSeverity.ERROR).length === 0;
      
      return this.createResult(isValid, {
        migrationsChecked: target.migrationPaths.length,
        seedsChecked: target.seedPaths.length,
        totalIssues: this.issues.length
      });
    } catch (error) {
      this.addIssue(
        'validation-error',
        `Database pattern validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'validation-execution',
        target.modulePath
      );
      
      return this.createResult(false, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async validateMigrationFiles(migrationPaths: string[]): Promise<void> {
    for (const migrationPath of migrationPaths) {
      await this.validateMigrationFile(migrationPath);
    }
  }

  private async validateMigrationFile(migrationPath: string): Promise<void> {
    const fileName = path.basename(migrationPath);
    
    // Check file naming convention
    if (!this.migrationNamePattern.test(fileName)) {
      this.addIssue(
        `migration-naming-${fileName}`,
        `Migration file "${fileName}" does not follow naming convention: timestamp-Description.ts`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'migration-naming',
        migrationPath,
        true
      );
      
      this.addFix(
        `migration-naming-${fileName}`,
        `Rename migration file to follow timestamp-Description.ts pattern`,
        'rename-migration-file',
        { filePath: migrationPath, currentName: fileName }
      );
    }

    // Check file content
    if (await this.fileExists(migrationPath)) {
      const content = await this.readFile(migrationPath);
      await this.validateMigrationContent(content, migrationPath, fileName);
    } else {
      this.addIssue(
        `migration-missing-${fileName}`,
        `Migration file "${fileName}" does not exist`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'migration-existence',
        migrationPath
      );
    }
  }

  private async validateMigrationContent(content: string, filePath: string, fileName: string): Promise<void> {
    // Check for up() method
    if (!content.includes('async up(queryRunner: QueryRunner)') && !content.includes('public async up(queryRunner: QueryRunner)')) {
      this.addIssue(
        `migration-up-method-${fileName}`,
        `Migration "${fileName}" is missing up() method`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'migration-up-method',
        filePath,
        true
      );
    }

    // Check for down() method
    if (!content.includes('async down(queryRunner: QueryRunner)') && !content.includes('public async down(queryRunner: QueryRunner)')) {
      this.addIssue(
        `migration-down-method-${fileName}`,
        `Migration "${fileName}" is missing down() method`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'migration-down-method',
        filePath,
        true
      );
    }

    // Check for hardcoded database names
    const hardcodedDbPatterns = [
      /CREATE DATABASE\s+["`']?[a-zA-Z_][a-zA-Z0-9_]*["`']?/gi,
      /USE\s+["`']?[a-zA-Z_][a-zA-Z0-9_]*["`']?/gi,
      /telemetryflow_db/gi,
      /postgres_db/gi
    ];

    for (const pattern of hardcodedDbPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue(
          `migration-hardcoded-db-${fileName}`,
          `Migration "${fileName}" contains hardcoded database names: ${matches.join(', ')}`,
          IssueSeverity.ERROR,
          IssueCategory.DATABASE,
          'migration-hardcoded-values',
          filePath
        );
      }
    }

    // Check for environment variable usage patterns
    const envVarPatterns = [
      /process\.env\./g,
      /\$\{[A-Z_]+\}/g
    ];

    let hasEnvVars = false;
    for (const pattern of envVarPatterns) {
      if (pattern.test(content)) {
        hasEnvVars = true;
        break;
      }
    }

    // If migration creates connections or references external resources, it should use env vars
    const needsEnvVars = content.includes('CONNECTION') || content.includes('HOST') || content.includes('PORT');
    if (needsEnvVars && !hasEnvVars) {
      this.addIssue(
        `migration-env-vars-${fileName}`,
        `Migration "${fileName}" should use environment variables for configuration`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'migration-env-vars',
        filePath
      );
    }
  }

  private async validateSeedFiles(seedPaths: string[]): Promise<void> {
    for (const seedPath of seedPaths) {
      await this.validateSeedFile(seedPath);
    }
  }

  private async validateSeedFile(seedPath: string): Promise<void> {
    const fileName = path.basename(seedPath);
    
    // Check file naming convention
    if (!this.seedNamePattern.test(fileName)) {
      this.addIssue(
        `seed-naming-${fileName}`,
        `Seed file "${fileName}" does not follow naming convention: timestamp-seed-module-entity.ts`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'seed-naming',
        seedPath,
        true
      );
      
      this.addFix(
        `seed-naming-${fileName}`,
        `Rename seed file to follow timestamp-seed-module-entity.ts pattern`,
        'rename-seed-file',
        { filePath: seedPath, currentName: fileName }
      );
    }

    // Check file content
    if (await this.fileExists(seedPath)) {
      const content = await this.readFile(seedPath);
      await this.validateSeedContent(content, seedPath, fileName);
    } else {
      this.addIssue(
        `seed-missing-${fileName}`,
        `Seed file "${fileName}" does not exist`,
        IssueSeverity.ERROR,
        IssueCategory.DATABASE,
        'seed-existence',
        seedPath
      );
    }
  }

  private async validateSeedContent(content: string, filePath: string, fileName: string): Promise<void> {
    // Check for hardcoded database names
    const hardcodedDbPatterns = [
      /telemetryflow_db/gi,
      /postgres_db/gi,
      /'localhost'/gi,
      /'127\.0\.0\.1'/gi
    ];

    for (const pattern of hardcodedDbPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue(
          `seed-hardcoded-values-${fileName}`,
          `Seed file "${fileName}" contains hardcoded values: ${matches.join(', ')}`,
          IssueSeverity.ERROR,
          IssueCategory.DATABASE,
          'seed-hardcoded-values',
          filePath
        );
      }
    }

    // Check for error handling
    if (!content.includes('try') && !content.includes('catch')) {
      this.addIssue(
        `seed-error-handling-${fileName}`,
        `Seed file "${fileName}" should include error handling (try/catch)`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'seed-error-handling',
        filePath,
        true
      );
    }

    // Check for idempotency patterns
    const idempotencyPatterns = [
      /findOne.*where/gi,
      /findOneBy/gi,
      /IF NOT EXISTS/gi,
      /ON CONFLICT/gi,
      /UPSERT/gi
    ];

    let hasIdempotency = false;
    for (const pattern of idempotencyPatterns) {
      if (pattern.test(content)) {
        hasIdempotency = true;
        break;
      }
    }

    if (!hasIdempotency) {
      this.addIssue(
        `seed-idempotency-${fileName}`,
        `Seed file "${fileName}" should implement idempotency checks`,
        IssueSeverity.WARNING,
        IssueCategory.DATABASE,
        'seed-idempotency',
        filePath,
        true
      );
    }

    // Check for logging
    if (!content.includes('console.log') && !content.includes('logger')) {
      this.addIssue(
        `seed-logging-${fileName}`,
        `Seed file "${fileName}" should include logging for operations`,
        IssueSeverity.INFO,
        IssueCategory.DATABASE,
        'seed-logging',
        filePath,
        true
      );
    }
  }

  getRequirements(): ValidationRequirement[] {
    return [
      {
        id: 'migration-naming',
        name: 'Migration File Naming',
        description: 'Migration files must follow timestamp-Description.ts pattern',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'migration-up-method',
        name: 'Migration Up Method',
        description: 'Migration files must include up() method',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'migration-down-method',
        name: 'Migration Down Method',
        description: 'Migration files must include down() method',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'migration-hardcoded-values',
        name: 'No Hardcoded Database Names',
        description: 'Migration files must not contain hardcoded database names',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: false
      },
      {
        id: 'migration-env-vars',
        name: 'Environment Variable Usage',
        description: 'Migration files should use environment variables for configuration',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: false
      },
      {
        id: 'seed-naming',
        name: 'Seed File Naming',
        description: 'Seed files must follow timestamp-seed-module-entity.ts pattern',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'seed-hardcoded-values',
        name: 'No Hardcoded Values in Seeds',
        description: 'Seed files must not contain hardcoded database values',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.ERROR,
        autoFixable: false
      },
      {
        id: 'seed-error-handling',
        name: 'Seed Error Handling',
        description: 'Seed files should include proper error handling',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'seed-idempotency',
        name: 'Seed Idempotency',
        description: 'Seed files should implement idempotency checks',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'seed-logging',
        name: 'Seed Logging',
        description: 'Seed files should include logging for operations',
        category: IssueCategory.DATABASE,
        severity: IssueSeverity.INFO,
        autoFixable: true
      }
    ];
  }

  async applyFix(fix: any): Promise<void> {
    switch (fix.action) {
      case 'rename-migration-file':
        await this.renameMigrationFile(fix.parameters);
        break;
      case 'rename-seed-file':
        await this.renameSeedFile(fix.parameters);
        break;
      default:
        throw new Error(`Unknown fix action: ${fix.action}`);
    }
  }

  private async renameMigrationFile(params: { filePath: string; currentName: string }): Promise<void> {
    // Extract timestamp from current name or generate new one
    const timestampMatch = params.currentName.match(/^(\d{13})/);
    const timestamp = timestampMatch ? timestampMatch[1] : Date.now().toString();
    
    // Extract description or use default
    const descMatch = params.currentName.match(/^(?:\d{13}-)?(.+)\.ts$/);
    const description = descMatch?.[1] ?? 'Migration';
    
    // Ensure description is PascalCase
    const pascalDescription = description.charAt(0).toUpperCase() + description.slice(1);
    
    const newName = `${timestamp}-${pascalDescription}.ts`;
    const newPath = path.join(path.dirname(params.filePath), newName);
    
    await fs.rename(params.filePath, newPath);
  }

  private async renameSeedFile(params: { filePath: string; currentName: string }): Promise<void> {
    // Extract timestamp from current name or generate new one
    const timestampMatch = params.currentName.match(/^(\d{13})/);
    const timestamp = timestampMatch ? timestampMatch[1] : Date.now().toString();
    
    // Try to extract module and entity from current name
    const parts = params.currentName.replace(/^(?:\d{13}-)?(?:seed-)?/, '').replace(/\.ts$/, '').split('-');
    const module = parts[0] || 'module';
    const entity = parts[1] || 'entity';
    
    const newName = `${timestamp}-seed-${module}-${entity}.ts`;
    const newPath = path.join(path.dirname(params.filePath), newName);
    
    await fs.rename(params.filePath, newPath);
  }
}