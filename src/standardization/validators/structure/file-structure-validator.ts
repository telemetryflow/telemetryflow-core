/**
 * File Structure Validator
 * 
 * Validates module file structure against DDD patterns and naming conventions.
 * Checks for required barrel export files (index.ts) and proper file organization.
 */

import { BaseValidator } from '../base-validator';
import { ValidationResult, ValidationRequirement, IssueSeverity, IssueCategory } from '../../interfaces/validation.interface';
import { ModuleStructure, FileInfo } from '../../interfaces/module-structure.interface';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface FileStructureValidationOptions {
  modulePath: string;
  enforceBarrelExports: boolean;
  validateNamingConventions: boolean;
  checkRequiredDirectories: boolean;
}

export interface StructureIssue {
  type: 'missing_directory' | 'missing_barrel_export' | 'naming_violation' | 'incorrect_suffix';
  path: string;
  expected?: string;
  actual?: string;
}

export class FileStructureValidator extends BaseValidator {
  private readonly requiredDirectories = [
    'domain',
    'domain/aggregates',
    'domain/entities', 
    'domain/value-objects',
    'domain/events',
    'domain/repositories',
    'domain/services',
    'application',
    'application/commands',
    'application/queries', 
    'application/handlers',
    'application/dto',
    'infrastructure',
    'infrastructure/persistence',
    'infrastructure/persistence/entities',
    'infrastructure/persistence/repositories',
    'infrastructure/persistence/mappers',
    'infrastructure/persistence/migrations',
    'infrastructure/persistence/seeds',
    'infrastructure/messaging',
    'infrastructure/processors',
    'presentation',
    'presentation/controllers',
    'presentation/dto',
    'presentation/guards',
    'presentation/decorators'
  ];

  private readonly fileNamingRules = {
    // Domain layer
    'domain/aggregates': { pattern: /^[A-Z][a-zA-Z0-9]*\.ts$/, suffix: '.ts' },
    'domain/entities': { pattern: /^[A-Z][a-zA-Z0-9]*\.ts$/, suffix: '.ts' },
    'domain/value-objects': { pattern: /^[A-Z][a-zA-Z0-9]*\.ts$/, suffix: '.ts' },
    'domain/events': { pattern: /^[A-Z][a-zA-Z0-9]*\.event\.ts$/, suffix: '.event.ts' },
    'domain/repositories': { pattern: /^I[A-Z][a-zA-Z0-9]*Repository\.ts$/, suffix: 'Repository.ts' },
    'domain/services': { pattern: /^[A-Z][a-zA-Z0-9]*Service\.ts$/, suffix: 'Service.ts' },
    
    // Application layer
    'application/commands': { pattern: /^[A-Z][a-zA-Z0-9]*\.command\.ts$/, suffix: '.command.ts' },
    'application/queries': { pattern: /^[A-Z][a-zA-Z0-9]*\.query\.ts$/, suffix: '.query.ts' },
    'application/handlers': { pattern: /^[A-Z][a-zA-Z0-9]*\.handler\.ts$/, suffix: '.handler.ts' },
    'application/dto': { pattern: /^[A-Z][a-zA-Z0-9]*\.dto\.ts$/, suffix: '.dto.ts' },
    
    // Infrastructure layer
    'infrastructure/persistence/entities': { pattern: /^[A-Z][a-zA-Z0-9]*\.entity\.ts$/, suffix: '.entity.ts' },
    'infrastructure/persistence/repositories': { pattern: /^[A-Z][a-zA-Z0-9]*Repository\.ts$/, suffix: 'Repository.ts' },
    'infrastructure/persistence/mappers': { pattern: /^[A-Z][a-zA-Z0-9]*Mapper\.ts$/, suffix: 'Mapper.ts' },
    'infrastructure/persistence/migrations': { pattern: /^\d{13}-[A-Z][a-zA-Z0-9]*\.ts$/, suffix: '.ts' },
    'infrastructure/persistence/seeds': { pattern: /^\d{13}-seed-[a-z-]+-[a-z-]+\.ts$/, suffix: '.ts' },
    'infrastructure/messaging': { pattern: /^[A-Z][a-zA-Z0-9]*EventProcessor\.ts$/, suffix: 'EventProcessor.ts' },
    'infrastructure/processors': { pattern: /^[a-z-]+\.processor\.ts$/, suffix: '.processor.ts' },
    
    // Presentation layer
    'presentation/controllers': { pattern: /^[A-Z][a-zA-Z0-9]*\.controller\.ts$/, suffix: '.controller.ts' },
    'presentation/dto': { pattern: /^[A-Z][a-zA-Z0-9]*\.dto\.ts$/, suffix: '.dto.ts' },
    'presentation/guards': { pattern: /^[A-Z][a-zA-Z0-9]*\.guard\.ts$/, suffix: '.guard.ts' },
    'presentation/decorators': { pattern: /^[A-Z][a-zA-Z0-9]*\.decorator\.ts$/, suffix: '.decorator.ts' }
  };

  async validate(options: FileStructureValidationOptions): Promise<ValidationResult> {
    this.reset();

    try {
      // Check if module path exists
      const moduleExists = await this.fileExists(options.modulePath);
      if (!moduleExists) {
        this.addIssue(
          'module-not-found',
          `Module directory not found: ${options.modulePath}`,
          IssueSeverity.ERROR,
          IssueCategory.STRUCTURE,
          'module-exists'
        );
        return this.createResult(false);
      }

      // Validate directory structure
      if (options.checkRequiredDirectories) {
        await this.validateDirectoryStructure(options.modulePath);
      }

      // Validate naming conventions
      if (options.validateNamingConventions) {
        await this.validateNamingConventions(options.modulePath);
      }

      // Validate barrel exports
      if (options.enforceBarrelExports) {
        await this.validateBarrelExports(options.modulePath);
      }

      const isValid = this.issues.filter(issue => issue.severity === IssueSeverity.ERROR).length === 0;
      return this.createResult(isValid, {
        checkedDirectories: this.requiredDirectories.length,
        totalIssues: this.issues.length,
        autoFixableIssues: this.issues.filter(issue => issue.autoFixable).length
      });

    } catch (error) {
      this.addIssue(
        'validation-error',
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        IssueSeverity.ERROR,
        IssueCategory.STRUCTURE,
        'validation-process'
      );
      return this.createResult(false);
    }
  }

  private async validateDirectoryStructure(modulePath: string): Promise<void> {
    for (const requiredDir of this.requiredDirectories) {
      const dirPath = path.join(modulePath, requiredDir);
      const exists = await this.directoryExists(dirPath);
      
      if (!exists) {
        this.addIssue(
          `missing-directory-${requiredDir.replace(/\//g, '-')}`,
          `Required directory missing: ${requiredDir}`,
          IssueSeverity.ERROR,
          IssueCategory.STRUCTURE,
          'required-directories',
          dirPath,
          true // Auto-fixable
        );

        // Add fix for creating missing directory
        this.addFix(
          `missing-directory-${requiredDir.replace(/\//g, '-')}`,
          `Create missing directory: ${requiredDir}`,
          'create-directory',
          { path: dirPath }
        );
      }
    }
  }

  private async validateNamingConventions(modulePath: string): Promise<void> {
    for (const [relativePath, rules] of Object.entries(this.fileNamingRules)) {
      const dirPath = path.join(modulePath, relativePath);
      
      if (await this.directoryExists(dirPath)) {
        const files = await this.getFilesInDirectory(dirPath);
        
        for (const file of files) {
          // Skip index.ts files and non-TypeScript files
          if (file === 'index.ts' || !file.endsWith('.ts')) {
            continue;
          }

          const isValidName = rules.pattern.test(file);
          
          if (!isValidName) {
            const issueId = `naming-violation-${relativePath.replace(/\//g, '-')}-${file}`;
            this.addIssue(
              issueId,
              `File naming violation in ${relativePath}: ${file} does not match pattern ${rules.pattern}`,
              IssueSeverity.WARNING,
              IssueCategory.STRUCTURE,
              'naming-conventions',
              path.join(dirPath, file),
              true // Auto-fixable for some cases
            );

            // Try to suggest a corrected name
            const suggestedName = this.suggestCorrectName(file, rules);
            if (suggestedName && suggestedName !== file) {
              this.addFix(
                issueId,
                `Rename ${file} to ${suggestedName}`,
                'rename-file',
                {
                  oldPath: path.join(dirPath, file),
                  newPath: path.join(dirPath, suggestedName)
                }
              );
            }
          }
        }
      }
    }
  }

  private async validateBarrelExports(modulePath: string): Promise<void> {
    const directoriesToCheck = [
      'domain/aggregates',
      'domain/entities',
      'domain/value-objects', 
      'domain/events',
      'domain/repositories',
      'domain/services',
      'application/commands',
      'application/queries',
      'application/handlers',
      'application/dto',
      'infrastructure/persistence/entities',
      'infrastructure/persistence/repositories',
      'infrastructure/persistence/mappers',
      'infrastructure/messaging',
      'infrastructure/processors',
      'presentation/controllers',
      'presentation/dto',
      'presentation/guards',
      'presentation/decorators'
    ];

    for (const dir of directoriesToCheck) {
      const dirPath = path.join(modulePath, dir);
      
      if (await this.directoryExists(dirPath)) {
        const files = await this.getFilesInDirectory(dirPath);
        const hasTypeScriptFiles = files.some(file => file.endsWith('.ts') && file !== 'index.ts');
        
        if (hasTypeScriptFiles) {
          const indexPath = path.join(dirPath, 'index.ts');
          const hasIndex = await this.fileExists(indexPath);
          
          if (!hasIndex) {
            const issueId = `missing-barrel-export-${dir.replace(/\//g, '-')}`;
            this.addIssue(
              issueId,
              `Missing barrel export file (index.ts) in ${dir}`,
              IssueSeverity.WARNING,
              IssueCategory.STRUCTURE,
              'barrel-exports',
              indexPath,
              true // Auto-fixable
            );

            // Add fix for creating barrel export
            this.addFix(
              issueId,
              `Create barrel export file for ${dir}`,
              'create-barrel-export',
              {
                directory: dirPath,
                files: files.filter(file => file.endsWith('.ts') && file !== 'index.ts')
              }
            );
          }
        }
      }
    }
  }

  private suggestCorrectName(fileName: string, rules: { pattern: RegExp; suffix: string }): string | null {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.ts$/, '');
    
    // Try to fix common issues
    let correctedName = nameWithoutExt;
    
    // Ensure PascalCase for the base name
    if (rules.suffix === '.ts' || rules.suffix.includes('Repository') || rules.suffix.includes('Service') || rules.suffix.includes('Mapper')) {
      // For simple files, aggregates, repositories, services, mappers
      correctedName = this.toPascalCase(correctedName);
    } else if (rules.suffix.includes('.')) {
      // For files with specific suffixes like .command.ts, .event.ts
      const suffixPart = rules.suffix.replace('.ts', '');
      const baseName = correctedName.replace(new RegExp(`${suffixPart}$`, 'i'), '');
      correctedName = this.toPascalCase(baseName) + suffixPart;
    }
    
    const newFileName = correctedName + '.ts';
    
    // Check if the corrected name matches the pattern
    if (rules.pattern.test(newFileName)) {
      return newFileName;
    }
    
    return null;
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^(.)/, (_, char) => char.toUpperCase());
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async getFilesInDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  getRequirements(): ValidationRequirement[] {
    return [
      {
        id: 'req-3.1',
        name: 'Barrel Export Files',
        description: 'All directories with TypeScript files must have index.ts barrel export files',
        category: IssueCategory.STRUCTURE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'req-3.2',
        name: 'Directory Structure',
        description: 'Module must follow DDD directory structure with required directories',
        category: IssueCategory.STRUCTURE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'req-3.3',
        name: 'PascalCase Naming',
        description: 'All TypeScript files must follow PascalCase naming convention',
        category: IssueCategory.STRUCTURE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'req-3.4',
        name: 'File Suffixes',
        description: 'Files must use proper suffixes (.entity.ts, .handler.ts, .controller.ts, etc.)',
        category: IssueCategory.STRUCTURE,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      },
      {
        id: 'req-3.5',
        name: 'Test Directory Structure',
        description: 'Test files must be organized in standardized test/ directory structure',
        category: IssueCategory.STRUCTURE,
        severity: IssueSeverity.WARNING,
        autoFixable: false
      },
      {
        id: 'req-3.9',
        name: 'DDD Layer Structure',
        description: 'Module must follow domain/application/infrastructure/presentation layer structure',
        category: IssueCategory.STRUCTURE,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'req-3.10',
        name: 'TypeScript Path Mapping',
        description: 'Module must have proper TypeScript path mapping for clean imports',
        category: IssueCategory.STRUCTURE,
        severity: IssueSeverity.INFO,
        autoFixable: false
      }
    ];
  }

  async applyFix(fix: any): Promise<void> {
    switch (fix.action) {
      case 'create-directory':
        await this.createDirectory(fix.parameters.path);
        break;
      case 'rename-file':
        await this.renameFile(fix.parameters.oldPath, fix.parameters.newPath);
        break;
      case 'create-barrel-export':
        await this.createBarrelExport(fix.parameters.directory, fix.parameters.files);
        break;
      default:
        throw new Error(`Unknown fix action: ${fix.action}`);
    }
  }

  private async createDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  private async renameFile(oldPath: string, newPath: string): Promise<void> {
    await fs.rename(oldPath, newPath);
  }

  private async createBarrelExport(directory: string, files: string[]): Promise<void> {
    const indexPath = path.join(directory, 'index.ts');
    
    // Generate export statements
    const exports = files
      .filter(file => file.endsWith('.ts'))
      .map(file => {
        const nameWithoutExt = file.replace(/\.ts$/, '');
        return `export * from './${nameWithoutExt}';`;
      })
      .sort()
      .join('\n');
    
    const content = exports + '\n';
    await this.writeFile(indexPath, content);
  }
}