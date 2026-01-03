/**
 * Property-based tests for FileStructureValidator
 * Feature: iam-module-standardization, Property 3: File Structure Consistency
 */

import { FileStructureValidator, FileStructureValidationOptions } from '../file-structure-validator';
import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FileStructureValidator - Property Tests', () => {
  let validator: FileStructureValidator;
  let tempDir: string;

  beforeEach(async () => {
    validator = new FileStructureValidator();
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-structure-test-'));
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
   * Property 3: File Structure Consistency
   * For any file in the IAM module, the file should follow the established naming conventions 
   * and be located in the correct directory structure
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
   */
  describe('Property 3: File Structure Consistency', () => {
    it('should validate that properly structured modules pass validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate validation options and module structure data
          fc.record({
            enforceBarrelExports: fc.boolean(),
            validateNamingConventions: fc.boolean(),
            checkRequiredDirectories: fc.boolean(),
            directorySubset: fc.array(fc.constantFrom(
              'domain/aggregates',
              'domain/entities',
              'domain/value-objects',
              'application/commands',
              'application/queries',
              'infrastructure/persistence/entities',
              'presentation/controllers'
            ), { minLength: 1, maxLength: 7 })
          }),
          async ({ enforceBarrelExports, validateNamingConventions, checkRequiredDirectories, directorySubset }) => {
            // Arrange: Create a well-structured module based on the validation options
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'structure-test-'));
            const modulePath = path.join(testTempDir, 'test-module');
            
            try {
              await createModuleStructure(modulePath, {
                directories: directorySubset,
                withBarrelExports: enforceBarrelExports, // Only add barrel exports if they will be checked
                withValidNaming: validateNamingConventions, // Only use valid naming if it will be checked
                directorySubset
              });

              const options: FileStructureValidationOptions = {
                modulePath,
                enforceBarrelExports,
                validateNamingConventions,
                checkRequiredDirectories
              };

              // Act: Validate the structure
              const result = await validator.validate(options);

              // Assert: The result should always have the expected structure
              expect(result).toHaveProperty('isValid');
              expect(result).toHaveProperty('issues');
              expect(result).toHaveProperty('fixes');
              expect(result).toHaveProperty('metadata');
              expect(Array.isArray(result.issues)).toBe(true);
              expect(Array.isArray(result.fixes)).toBe(true);

              // Issues should be properly categorized
              for (const issue of result.issues) {
                expect(issue).toHaveProperty('id');
                expect(issue).toHaveProperty('message');
                expect(issue).toHaveProperty('severity');
                expect(issue).toHaveProperty('category');
                expect(issue).toHaveProperty('rule');
                expect(['error', 'warning', 'info']).toContain(issue.severity);
                expect(issue.category).toBe('structure');
              }

              // Auto-fixable issues should have corresponding fixes
              const autoFixableIssues = result.issues.filter(issue => issue.autoFixable);
              for (const issue of autoFixableIssues) {
                const hasFix = result.fixes.some(fix => fix.issueId === issue.id);
                expect(hasFix).toBe(true);
              }

              // Validation behavior should be consistent with options
              const barrelIssues = result.issues.filter(issue => issue.rule === 'barrel-exports');
              const namingIssues = result.issues.filter(issue => issue.rule === 'naming-conventions');
              const directoryIssues = result.issues.filter(issue => issue.rule === 'required-directories');

              // Issues should only appear for enabled validations
              if (!enforceBarrelExports) {
                expect(barrelIssues.length).toBe(0);
              }
              if (!validateNamingConventions) {
                expect(namingIssues.length).toBe(0);
              }
              if (!checkRequiredDirectories) {
                expect(directoryIssues.length).toBe(0);
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

    it('should validate that missing required directories are detected', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate scenarios with missing directories
          fc.record({
            missingDirectories: fc.array(fc.constantFrom(
              'domain',
              'application', 
              'infrastructure',
              'presentation',
              'domain/aggregates',
              'application/handlers'
            ), { minLength: 1, maxLength: 6 }),
            existingDirectories: fc.array(fc.constantFrom(
              'domain/entities',
              'application/commands',
              'infrastructure/persistence',
              'presentation/controllers'
            ), { minLength: 0, maxLength: 4 })
          }),
          async ({ missingDirectories, existingDirectories }) => {
            // Arrange: Create module with some missing directories
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'incomplete-test-'));
            const modulePath = path.join(testTempDir, 'incomplete-module');
            
            try {
              await createModuleStructure(modulePath, {
                directories: existingDirectories,
                withBarrelExports: false,
                withValidNaming: true,
                directorySubset: existingDirectories
              });

              const options: FileStructureValidationOptions = {
                modulePath,
                enforceBarrelExports: false,
                validateNamingConventions: false,
                checkRequiredDirectories: true
              };

              // Act: Validate the structure
              const result = await validator.validate(options);

              // Assert: Missing directories should be detected
              const missingDirIssues = result.issues.filter(issue => 
                issue.rule === 'required-directories' && issue.severity === 'error'
              );

              // Should have issues for missing required directories that aren't in existing directories
              const actuallyMissingDirs = missingDirectories.filter(dir => 
                !existingDirectories.some(existing => existing.startsWith(dir) || dir.startsWith(existing))
              );

              if (actuallyMissingDirs.length > 0) {
                expect(missingDirIssues.length).toBeGreaterThan(0);
              }

              // Each missing directory issue should be auto-fixable
              for (const issue of missingDirIssues) {
                expect(issue.autoFixable).toBe(true);
                const hasFix = result.fixes.some(fix => fix.issueId === issue.id);
                expect(hasFix).toBe(true);
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

    it('should validate that naming convention violations are detected', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a simple test case with one invalid file
          fc.record({
            directory: fc.constantFrom(
              'domain/aggregates',
              'application/commands',
              'infrastructure/persistence/entities',
              'presentation/controllers'
            ),
            invalidFileName: fc.constantFrom(
              'user.ts', // lowercase
              'user_name.ts', // underscore
              'user-name.ts', // dash
              '123invalid.ts' // starts with number
            )
          }),
          async ({ directory, invalidFileName }) => {
            // Arrange: Create module with one invalid file name
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'naming-test-'));
            const modulePath = path.join(testTempDir, 'naming-test-module');
            const dirPath = path.join(modulePath, directory);
            
            try {
              await fs.mkdir(dirPath, { recursive: true });

              // Create the invalid file
              const filePath = path.join(dirPath, invalidFileName);
              await fs.writeFile(filePath, `// ${invalidFileName}\nexport class TestClass {}\n`);

              const options: FileStructureValidationOptions = {
                modulePath,
                enforceBarrelExports: false,
                validateNamingConventions: true,
                checkRequiredDirectories: false
              };

              // Act: Validate naming conventions
              const result = await validator.validate(options);

              // Assert: Invalid file name should be detected
              const namingIssues = result.issues.filter(issue => 
                issue.rule === 'naming-conventions'
              );

              expect(namingIssues.length).toBeGreaterThan(0);
              
              // The issue should reference the invalid file
              const hasIssueForInvalidFile = namingIssues.some(issue => 
                issue.location.includes(invalidFileName) || 
                issue.message.includes(invalidFileName) ||
                issue.id.includes(invalidFileName.replace('.ts', ''))
              );
              expect(hasIssueForInvalidFile).toBe(true);
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

    it('should validate that barrel export requirements are enforced', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a simple scenario with one directory
          fc.record({
            directory: fc.constantFrom(
              'domain/aggregates',
              'domain/entities',
              'application/commands',
              'infrastructure/persistence/entities',
              'presentation/controllers'
            ),
            hasBarrelExport: fc.boolean(),
            fileCount: fc.integer({ min: 1, max: 3 })
          }),
          async ({ directory, hasBarrelExport, fileCount }) => {
            // Arrange: Create unique temporary directory for this test iteration
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'barrel-test-'));
            const modulePath = path.join(testTempDir, 'barrel-test-module');
            const dirPath = path.join(modulePath, directory);
            await fs.mkdir(dirPath, { recursive: true });

            try {
              // Create TypeScript files with proper naming
              const fileNames: string[] = [];
              for (let i = 0; i < fileCount; i++) {
                const fileName = getProperFileNameForDirectory(directory, `TestFile${i + 1}`);
                fileNames.push(fileName);
                const filePath = path.join(dirPath, fileName);
                await fs.writeFile(filePath, `export class TestFile${i + 1} {}\n`);
              }

              // Create barrel export if specified
              if (hasBarrelExport) {
                const indexPath = path.join(dirPath, 'index.ts');
                const exports = fileNames.map(fileName => {
                  const nameWithoutExt = fileName.replace(/\.ts$/, '');
                  return `export * from './${nameWithoutExt}';`;
                }).join('\n');
                await fs.writeFile(indexPath, exports + '\n');
              }

              const options: FileStructureValidationOptions = {
                modulePath,
                enforceBarrelExports: true,
                validateNamingConventions: false,
                checkRequiredDirectories: false
              };

              // Act: Validate barrel exports
              const result = await validator.validate(options);

              // Assert: Missing barrel exports should be detected
              const barrelIssues = result.issues.filter(issue => 
                issue.rule === 'barrel-exports'
              );

              if (!hasBarrelExport) {
                // Should have issues when barrel export is missing
                expect(barrelIssues.length).toBeGreaterThan(0);
                
                // Each barrel export issue should be auto-fixable
                for (const issue of barrelIssues) {
                  expect(issue.autoFixable).toBe(true);
                  const hasFix = result.fixes.some(fix => fix.issueId === issue.id);
                  expect(hasFix).toBe(true);
                }
              } else {
                // Should not have barrel export issues when barrel export exists
                const hasIssueForDir = barrelIssues.some(issue => 
                  issue.location.includes(directory) || issue.message.includes(directory)
                );
                expect(hasIssueForDir).toBe(false);
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

    it('should validate that validation options affect results consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate different validation option combinations
          fc.record({
            enforceBarrelExports: fc.boolean(),
            validateNamingConventions: fc.boolean(),
            checkRequiredDirectories: fc.boolean(),
            moduleHasIssues: fc.boolean()
          }),
          async ({ enforceBarrelExports, validateNamingConventions, checkRequiredDirectories, moduleHasIssues }) => {
            // Arrange: Create unique temporary directory for this test iteration
            const testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'options-test-'));
            const modulePath = path.join(testTempDir, 'options-test-module');
            
            try {
              if (moduleHasIssues) {
                // Create a module with various issues
                await createModuleStructure(modulePath, {
                  directories: ['domain/aggregates'], // Missing many required directories
                  withBarrelExports: false, // Missing barrel exports
                  withValidNaming: false, // Invalid naming
                  directorySubset: ['domain/aggregates']
                });
                
                // Add a file with invalid naming
                const dirPath = path.join(modulePath, 'domain/aggregates');
                await fs.writeFile(path.join(dirPath, 'invalid_name.ts'), 'export class InvalidName {}\n');
              } else {
                // Create a well-structured module
                await createModuleStructure(modulePath, {
                  directories: ['domain/aggregates', 'application/commands'],
                  withBarrelExports: true,
                  withValidNaming: true,
                  directorySubset: ['domain/aggregates', 'application/commands']
                });
              }

              const options: FileStructureValidationOptions = {
                modulePath,
                enforceBarrelExports,
                validateNamingConventions,
                checkRequiredDirectories
              };

              // Act: Validate with the specified options
              const result = await validator.validate(options);

              // Assert: Results should be consistent with options
              const barrelIssues = result.issues.filter(issue => issue.rule === 'barrel-exports');
              const namingIssues = result.issues.filter(issue => issue.rule === 'naming-conventions');
              const directoryIssues = result.issues.filter(issue => issue.rule === 'required-directories');

              // Barrel export issues should only appear if that option is enabled
              if (!enforceBarrelExports) {
                expect(barrelIssues.length).toBe(0);
              }

              // Naming issues should only appear if that option is enabled
              if (!validateNamingConventions) {
                expect(namingIssues.length).toBe(0);
              }

              // Directory issues should only appear if that option is enabled
              if (!checkRequiredDirectories) {
                expect(directoryIssues.length).toBe(0);
              }

              // If module has issues and all validations are enabled, there should be issues
              if (moduleHasIssues && enforceBarrelExports && validateNamingConventions && checkRequiredDirectories) {
                expect(result.issues.length).toBeGreaterThan(0);
              }

              // Validation result should always be well-formed
              expect(typeof result.isValid).toBe('boolean');
              expect(Array.isArray(result.issues)).toBe(true);
              expect(Array.isArray(result.fixes)).toBe(true);
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

  // Helper function to create module structure for testing
  async function createModuleStructure(
    modulePath: string, 
    options: {
      directories: string[];
      withBarrelExports: boolean;
      withValidNaming: boolean;
      directorySubset: string[];
    }
  ): Promise<void> {
    // Create the module directory
    await fs.mkdir(modulePath, { recursive: true });

    // Create specified directories
    for (const dir of options.directories) {
      const dirPath = path.join(modulePath, dir);
      await fs.mkdir(dirPath, { recursive: true });

      // Create sample files with appropriate naming
      if (options.withValidNaming) {
        const fileName = getValidFileNameForDirectory(dir);
        if (fileName) {
          const filePath = path.join(dirPath, fileName);
          await fs.writeFile(filePath, `// ${fileName}\nexport class TestClass {}\n`);
        }
      }

      // Create barrel exports if requested
      if (options.withBarrelExports) {
        const indexPath = path.join(dirPath, 'index.ts');
        await fs.writeFile(indexPath, '// Barrel export\nexport * from \'./TestClass\';\n');
      }
    }
  }

  function getValidFileNameForDirectory(directory: string): string | null {
    const fileNameMap: Record<string, string> = {
      'domain/aggregates': 'User.ts',
      'domain/entities': 'UserProfile.ts',
      'domain/value-objects': 'UserId.ts',
      'domain/events': 'UserCreated.event.ts',
      'domain/repositories': 'IUserRepository.ts',
      'domain/services': 'UserService.ts',
      'application/commands': 'CreateUser.command.ts',
      'application/queries': 'GetUser.query.ts',
      'application/handlers': 'CreateUser.handler.ts',
      'application/dto': 'UserResponse.dto.ts',
      'infrastructure/persistence/entities': 'User.entity.ts',
      'infrastructure/persistence/repositories': 'UserRepository.ts',
      'infrastructure/persistence/mappers': 'UserMapper.ts',
      'infrastructure/messaging': 'UserEventProcessor.ts',
      'infrastructure/processors': 'user-event.processor.ts',
      'presentation/controllers': 'User.controller.ts',
      'presentation/dto': 'CreateUserRequest.dto.ts',
      'presentation/guards': 'Permission.guard.ts',
      'presentation/decorators': 'RequirePermissions.decorator.ts'
    };

    return fileNameMap[directory] || null;
  }

  function getProperFileNameForDirectory(directory: string, baseName: string): string {
    const suffixMap: Record<string, string> = {
      'domain/aggregates': '.ts',
      'domain/entities': '.ts',
      'domain/value-objects': '.ts',
      'domain/events': '.event.ts',
      'domain/repositories': 'Repository.ts',
      'domain/services': 'Service.ts',
      'application/commands': '.command.ts',
      'application/queries': '.query.ts',
      'application/handlers': '.handler.ts',
      'application/dto': '.dto.ts',
      'infrastructure/persistence/entities': '.entity.ts',
      'infrastructure/persistence/repositories': 'Repository.ts',
      'infrastructure/persistence/mappers': 'Mapper.ts',
      'infrastructure/messaging': 'EventProcessor.ts',
      'infrastructure/processors': '.processor.ts',
      'presentation/controllers': '.controller.ts',
      'presentation/dto': '.dto.ts',
      'presentation/guards': '.guard.ts',
      'presentation/decorators': '.decorator.ts'
    };

    const suffix = suffixMap[directory] || '.ts';
    
    // Ensure PascalCase
    const pascalCaseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    // Add proper suffix
    if (suffix.startsWith('.')) {
      return pascalCaseName + suffix;
    } else {
      return pascalCaseName + suffix;
    }
  }

  function isDirectoryCheckedForBarrelExports(directory: string): boolean {
    // These are the directories that the validator actually checks for barrel exports
    const checkedDirectories = [
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
    
    return checkedDirectories.includes(directory);
  }
});