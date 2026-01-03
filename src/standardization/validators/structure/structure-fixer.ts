/**
 * Structure Fixer
 * 
 * Provides automated fixes for file structure issues including:
 * - Creating barrel export files (index.ts)
 * - Renaming files to follow naming conventions
 * - Creating missing directory structures
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface StructureFixOptions {
  modulePath: string;
  createMissingDirectories: boolean;
  generateBarrelExports: boolean;
  fixNamingViolations: boolean;
  dryRun: boolean;
}

export interface FixResult {
  success: boolean;
  message: string;
  changes: StructureChange[];
  errors: string[];
}

export interface StructureChange {
  type: 'create_directory' | 'create_file' | 'rename_file' | 'update_file';
  path: string;
  oldPath?: string;
  content?: string;
  description: string;
}

export class StructureFixer {
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

  private readonly barrelExportDirectories = [
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

  async fixStructure(options: StructureFixOptions): Promise<FixResult> {
    const changes: StructureChange[] = [];
    const errors: string[] = [];

    try {
      // Check if module path exists
      const moduleExists = await this.directoryExists(options.modulePath);
      if (!moduleExists) {
        return {
          success: false,
          message: `Module directory not found: ${options.modulePath}`,
          changes: [],
          errors: [`Module directory not found: ${options.modulePath}`]
        };
      }

      // Create missing directories
      if (options.createMissingDirectories) {
        const directoryChanges = await this.createMissingDirectories(options.modulePath, options.dryRun);
        changes.push(...directoryChanges);
      }

      // Generate barrel exports
      if (options.generateBarrelExports) {
        const barrelChanges = await this.generateBarrelExports(options.modulePath, options.dryRun);
        changes.push(...barrelChanges);
      }

      // Fix naming violations
      if (options.fixNamingViolations) {
        const namingChanges = await this.fixNamingViolations(options.modulePath, options.dryRun);
        changes.push(...namingChanges);
      }

      return {
        success: true,
        message: `Structure fixes completed. ${changes.length} changes made.`,
        changes,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      return {
        success: false,
        message: `Structure fixing failed: ${errorMessage}`,
        changes,
        errors
      };
    }
  }

  private async createMissingDirectories(modulePath: string, dryRun: boolean): Promise<StructureChange[]> {
    const changes: StructureChange[] = [];

    for (const requiredDir of this.requiredDirectories) {
      const dirPath = path.join(modulePath, requiredDir);
      const exists = await this.directoryExists(dirPath);
      
      if (!exists) {
        if (!dryRun) {
          await fs.mkdir(dirPath, { recursive: true });
        }
        
        changes.push({
          type: 'create_directory',
          path: dirPath,
          description: `Created missing directory: ${requiredDir}`
        });
      }
    }

    return changes;
  }

  async generateBarrelExports(modulePath: string, dryRun: boolean): Promise<StructureChange[]> {
    const changes: StructureChange[] = [];

    for (const dir of this.barrelExportDirectories) {
      const dirPath = path.join(modulePath, dir);
      
      if (await this.directoryExists(dirPath)) {
        const files = await this.getTypeScriptFiles(dirPath);
        const hasTypeScriptFiles = files.length > 0;
        
        if (hasTypeScriptFiles) {
          const indexPath = path.join(dirPath, 'index.ts');
          const hasIndex = await this.fileExists(indexPath);
          
          if (!hasIndex) {
            const content = this.generateBarrelExportContent(files);
            
            if (!dryRun) {
              await fs.writeFile(indexPath, content, 'utf-8');
            }
            
            changes.push({
              type: 'create_file',
              path: indexPath,
              content,
              description: `Created barrel export for ${dir} (${files.length} exports)`
            });
          } else {
            // Update existing barrel export if needed
            const existingContent = await fs.readFile(indexPath, 'utf-8');
            const newContent = this.generateBarrelExportContent(files);
            
            if (existingContent.trim() !== newContent.trim()) {
              if (!dryRun) {
                await fs.writeFile(indexPath, newContent, 'utf-8');
              }
              
              changes.push({
                type: 'update_file',
                path: indexPath,
                content: newContent,
                description: `Updated barrel export for ${dir} (${files.length} exports)`
              });
            }
          }
        }
      }
    }

    return changes;
  }

  private async fixNamingViolations(modulePath: string, dryRun: boolean): Promise<StructureChange[]> {
    const changes: StructureChange[] = [];

    const namingRules = {
      'domain/aggregates': /^[A-Z][a-zA-Z0-9]*\.ts$/,
      'domain/entities': /^[A-Z][a-zA-Z0-9]*\.ts$/,
      'domain/value-objects': /^[A-Z][a-zA-Z0-9]*\.ts$/,
      'domain/events': /^[A-Z][a-zA-Z0-9]*\.event\.ts$/,
      'domain/repositories': /^I[A-Z][a-zA-Z0-9]*Repository\.ts$/,
      'domain/services': /^[A-Z][a-zA-Z0-9]*Service\.ts$/,
      'application/commands': /^[A-Z][a-zA-Z0-9]*\.command\.ts$/,
      'application/queries': /^[A-Z][a-zA-Z0-9]*\.query\.ts$/,
      'application/handlers': /^[A-Z][a-zA-Z0-9]*\.handler\.ts$/,
      'application/dto': /^[A-Z][a-zA-Z0-9]*\.dto\.ts$/,
      'infrastructure/persistence/entities': /^[A-Z][a-zA-Z0-9]*\.entity\.ts$/,
      'infrastructure/persistence/repositories': /^[A-Z][a-zA-Z0-9]*Repository\.ts$/,
      'infrastructure/persistence/mappers': /^[A-Z][a-zA-Z0-9]*Mapper\.ts$/,
      'presentation/controllers': /^[A-Z][a-zA-Z0-9]*\.controller\.ts$/,
      'presentation/dto': /^[A-Z][a-zA-Z0-9]*\.dto\.ts$/,
      'presentation/guards': /^[A-Z][a-zA-Z0-9]*\.guard\.ts$/,
      'presentation/decorators': /^[A-Z][a-zA-Z0-9]*\.decorator\.ts$/
    };

    for (const [relativePath, pattern] of Object.entries(namingRules)) {
      const dirPath = path.join(modulePath, relativePath);
      
      if (await this.directoryExists(dirPath)) {
        const files = await this.getTypeScriptFiles(dirPath);
        
        for (const file of files) {
          if (!pattern.test(file)) {
            const correctedName = this.suggestCorrectName(file, pattern);
            
            if (correctedName && correctedName !== file) {
              const oldPath = path.join(dirPath, file);
              const newPath = path.join(dirPath, correctedName);
              
              // Check if target file already exists
              const targetExists = await this.fileExists(newPath);
              if (!targetExists) {
                if (!dryRun) {
                  await fs.rename(oldPath, newPath);
                }
                
                changes.push({
                  type: 'rename_file',
                  path: newPath,
                  oldPath,
                  description: `Renamed ${file} to ${correctedName} to follow naming conventions`
                });
              }
            }
          }
        }
      }
    }

    return changes;
  }

  private generateBarrelExportContent(files: string[]): string {
    const exports = files
      .map(file => {
        const nameWithoutExt = file.replace(/\.ts$/, '');
        return `export * from './${nameWithoutExt}';`;
      })
      .sort()
      .join('\n');
    
    return exports + '\n';
  }

  private async getTypeScriptFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts')
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  private suggestCorrectName(fileName: string, pattern: RegExp): string | null {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.ts$/, '');
    
    // Try to fix common issues based on the pattern
    let correctedName = nameWithoutExt;
    
    // Handle different file types
    if (pattern.source.includes('\\.event\\.')) {
      // Event files
      const baseName = correctedName.replace(/\.?event$/i, '');
      correctedName = this.toPascalCase(baseName) + '.event';
    } else if (pattern.source.includes('\\.command\\.')) {
      // Command files
      const baseName = correctedName.replace(/\.?command$/i, '');
      correctedName = this.toPascalCase(baseName) + '.command';
    } else if (pattern.source.includes('\\.query\\.')) {
      // Query files
      const baseName = correctedName.replace(/\.?query$/i, '');
      correctedName = this.toPascalCase(baseName) + '.query';
    } else if (pattern.source.includes('\\.handler\\.')) {
      // Handler files
      const baseName = correctedName.replace(/\.?handler$/i, '');
      correctedName = this.toPascalCase(baseName) + '.handler';
    } else if (pattern.source.includes('\\.dto\\.')) {
      // DTO files
      const baseName = correctedName.replace(/\.?dto$/i, '');
      correctedName = this.toPascalCase(baseName) + '.dto';
    } else if (pattern.source.includes('\\.entity\\.')) {
      // Entity files
      const baseName = correctedName.replace(/\.?entity$/i, '');
      correctedName = this.toPascalCase(baseName) + '.entity';
    } else if (pattern.source.includes('\\.controller\\.')) {
      // Controller files
      const baseName = correctedName.replace(/\.?controller$/i, '');
      correctedName = this.toPascalCase(baseName) + '.controller';
    } else if (pattern.source.includes('\\.guard\\.')) {
      // Guard files
      const baseName = correctedName.replace(/\.?guard$/i, '');
      correctedName = this.toPascalCase(baseName) + '.guard';
    } else if (pattern.source.includes('\\.decorator\\.')) {
      // Decorator files
      const baseName = correctedName.replace(/\.?decorator$/i, '');
      correctedName = this.toPascalCase(baseName) + '.decorator';
    } else if (pattern.source.includes('Repository')) {
      // Repository files
      if (pattern.source.startsWith('\\^I')) {
        // Interface repository
        const baseName = correctedName.replace(/Repository$/i, '').replace(/^I/i, '');
        correctedName = 'I' + this.toPascalCase(baseName) + 'Repository';
      } else {
        // Implementation repository
        const baseName = correctedName.replace(/Repository$/i, '');
        correctedName = this.toPascalCase(baseName) + 'Repository';
      }
    } else if (pattern.source.includes('Service')) {
      // Service files
      const baseName = correctedName.replace(/Service$/i, '');
      correctedName = this.toPascalCase(baseName) + 'Service';
    } else if (pattern.source.includes('Mapper')) {
      // Mapper files
      const baseName = correctedName.replace(/Mapper$/i, '');
      correctedName = this.toPascalCase(baseName) + 'Mapper';
    } else {
      // Simple PascalCase files (aggregates, entities, value objects)
      correctedName = this.toPascalCase(correctedName);
    }
    
    const newFileName = correctedName + '.ts';
    
    // Check if the corrected name matches the pattern
    if (pattern.test(newFileName)) {
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

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate missing directory structure for a module
   */
  async generateMissingDirectoryStructure(modulePath: string): Promise<StructureChange[]> {
    try {
      return await this.createMissingDirectories(modulePath, false);
    } catch (error) {
      // Return empty array if module path doesn't exist
      return [];
    }
  }

  /**
   * Create barrel export for a specific directory
   */
  async createBarrelExportForDirectory(dirPath: string): Promise<StructureChange | null> {
    const files = await this.getTypeScriptFiles(dirPath);
    
    if (files.length === 0) {
      return null;
    }

    const indexPath = path.join(dirPath, 'index.ts');
    const content = this.generateBarrelExportContent(files);
    
    await fs.writeFile(indexPath, content, 'utf-8');
    
    return {
      type: 'create_file',
      path: indexPath,
      content,
      description: `Created barrel export with ${files.length} exports`
    };
  }

  /**
   * Rename file to follow naming conventions
   */
  async renameFileToConvention(filePath: string, targetPattern: RegExp): Promise<StructureChange | null> {
    try {
      const fileName = path.basename(filePath);
      const dirPath = path.dirname(filePath);
      
      const correctedName = this.suggestCorrectName(fileName, targetPattern);
      
      if (!correctedName || correctedName === fileName) {
        return null;
      }

      const newPath = path.join(dirPath, correctedName);
      
      // Check if target file already exists
      const targetExists = await this.fileExists(newPath);
      if (targetExists) {
        return null;
      }

      // Check if source file exists
      const sourceExists = await this.fileExists(filePath);
      if (!sourceExists) {
        return null;
      }

      await fs.rename(filePath, newPath);
      
      return {
        type: 'rename_file',
        path: newPath,
        oldPath: filePath,
        description: `Renamed ${fileName} to ${correctedName} to follow naming conventions`
      };
    } catch (error) {
      // Return null if operation fails
      return null;
    }
  }
}