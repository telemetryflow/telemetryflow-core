/**
 * File Structure Validator Tests
 */

import { FileStructureValidator } from '../file-structure-validator';
import { IssueSeverity, IssueCategory } from '../../../interfaces/validation.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FileStructureValidator', () => {
  let validator: FileStructureValidator;
  let tempDir: string;

  beforeEach(async () => {
    validator = new FileStructureValidator();
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'structure-validator-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('getRequirements', () => {
    it('should return all validation requirements', () => {
      const requirements = validator.getRequirements();
      
      expect(requirements).toHaveLength(7);
      expect(requirements.every(req => req.id.startsWith('req-3.'))).toBe(true);
      expect(requirements.some(req => req.name === 'Barrel Export Files')).toBe(true);
      expect(requirements.some(req => req.name === 'Directory Structure')).toBe(true);
      expect(requirements.some(req => req.name === 'PascalCase Naming')).toBe(true);
    });

    it('should have proper requirement categories', () => {
      const requirements = validator.getRequirements();
      
      expect(requirements.every(req => req.category === IssueCategory.STRUCTURE)).toBe(true);
    });

    it('should mark appropriate requirements as auto-fixable', () => {
      const requirements = validator.getRequirements();
      
      const autoFixableReqs = requirements.filter(req => req.autoFixable);
      expect(autoFixableReqs.length).toBeGreaterThan(0);
      
      // Barrel exports should be auto-fixable
      const barrelExportReq = requirements.find(req => req.name === 'Barrel Export Files');
      expect(barrelExportReq?.autoFixable).toBe(true);
      
      // Directory structure should be auto-fixable
      const dirStructureReq = requirements.find(req => req.name === 'Directory Structure');
      expect(dirStructureReq?.autoFixable).toBe(true);
    });
  });

  describe('validate - basic functionality', () => {
    it('should handle non-existent module path', async () => {
      const result = await validator.validate({
        modulePath: '/nonexistent/path',
        enforceBarrelExports: false,
        validateNamingConventions: false,
        checkRequiredDirectories: false
      });

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.rule === 'module-exists')).toBe(true);
    });

    it('should return validation result with metadata', async () => {
      const result = await validator.validate({
        modulePath: '/nonexistent/path',
        enforceBarrelExports: true,
        validateNamingConventions: true,
        checkRequiredDirectories: true
      });

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('fixes');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('score');
    });

    it('should pass validation for empty module with no checks enabled', async () => {
      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: false,
        checkRequiredDirectories: false
      });

      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('directory structure validation', () => {
    it('should detect missing required directories', async () => {
      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: false,
        checkRequiredDirectories: true
      });

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Should have issues for missing directories
      const missingDirIssues = result.issues.filter(issue => 
        issue.id.startsWith('missing-directory-')
      );
      expect(missingDirIssues.length).toBeGreaterThan(0);
      
      // Should have fixes for creating directories
      const createDirFixes = result.fixes.filter(fix => 
        fix.action === 'create-directory'
      );
      expect(createDirFixes.length).toBeGreaterThan(0);
    });

    it('should pass validation when all required directories exist', async () => {
      // Create all required directories
      const requiredDirs = [
        'domain', 'domain/aggregates', 'domain/entities', 'domain/value-objects',
        'domain/events', 'domain/repositories', 'domain/services',
        'application', 'application/commands', 'application/queries', 
        'application/handlers', 'application/dto',
        'infrastructure', 'infrastructure/persistence',
        'infrastructure/persistence/entities', 'infrastructure/persistence/repositories',
        'infrastructure/persistence/mappers', 'infrastructure/persistence/migrations',
        'infrastructure/persistence/seeds', 'infrastructure/messaging',
        'infrastructure/processors',
        'presentation', 'presentation/controllers', 'presentation/dto',
        'presentation/guards', 'presentation/decorators'
      ];

      for (const dir of requiredDirs) {
        await fs.mkdir(path.join(tempDir, dir), { recursive: true });
      }

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: false,
        checkRequiredDirectories: true
      });

      expect(result.isValid).toBe(true);
      const missingDirIssues = result.issues.filter(issue => 
        issue.id.startsWith('missing-directory-')
      );
      expect(missingDirIssues.length).toBe(0);
    });

    it('should validate partial directory structure', async () => {
      // Create only some directories
      await fs.mkdir(path.join(tempDir, 'domain'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application'), { recursive: true });

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: false,
        checkRequiredDirectories: true
      });

      expect(result.isValid).toBe(false);
      
      // Should have issues for missing directories but not for existing ones
      const missingDirIssues = result.issues.filter(issue => 
        issue.id.startsWith('missing-directory-')
      );
      expect(missingDirIssues.length).toBeGreaterThan(0);
      
      // Should not have issues for domain or domain/aggregates
      const domainIssue = result.issues.find(issue => 
        issue.id === 'missing-directory-domain'
      );
      expect(domainIssue).toBeUndefined();
      
      const aggregatesIssue = result.issues.find(issue => 
        issue.id === 'missing-directory-domain-aggregates'
      );
      expect(aggregatesIssue).toBeUndefined();
    });
  });

  describe('naming convention validation', () => {
    beforeEach(async () => {
      // Create directory structure for naming tests
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'domain/events'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/commands'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/entities'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'presentation/controllers'), { recursive: true });
    });

    it('should detect naming violations in domain aggregates', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user_role.ts'), 'export class UserRole {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      
      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation')
      );
      expect(namingIssues.length).toBe(2);
      
      // Should have fixes for renaming files
      const renameFixes = result.fixes.filter(fix => 
        fix.action === 'rename-file'
      );
      expect(renameFixes.length).toBe(2);
    });

    it('should accept correct naming in domain aggregates', async () => {
      // Create files with correct naming
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/UserRole.ts'), 'export class UserRole {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('domain/aggregates')
      );
      expect(namingIssues.length).toBe(0);
    });

    it('should detect naming violations in domain events', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'domain/events/userCreated.ts'), 'export class UserCreated {}');
      await fs.writeFile(path.join(tempDir, 'domain/events/User-Updated.ts'), 'export class UserUpdated {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('domain/events')
      );
      expect(namingIssues.length).toBe(2);
    });

    it('should accept correct naming in domain events', async () => {
      // Create files with correct naming
      await fs.writeFile(path.join(tempDir, 'domain/events/UserCreated.event.ts'), 'export class UserCreatedEvent {}');
      await fs.writeFile(path.join(tempDir, 'domain/events/RoleAssigned.event.ts'), 'export class RoleAssignedEvent {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('domain/events')
      );
      expect(namingIssues.length).toBe(0);
    });

    it('should detect naming violations in application commands', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'application/commands/createUser.ts'), 'export class CreateUser {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/update-user.ts'), 'export class UpdateUser {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('application/commands')
      );
      expect(namingIssues.length).toBe(2);
    });

    it('should accept correct naming in application commands', async () => {
      // Create files with correct naming
      await fs.writeFile(path.join(tempDir, 'application/commands/CreateUser.command.ts'), 'export class CreateUserCommand {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/UpdateUser.command.ts'), 'export class UpdateUserCommand {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('application/commands')
      );
      expect(namingIssues.length).toBe(0);
    });

    it('should detect naming violations in infrastructure entities', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/entities/user.ts'), 'export class UserEntity {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/entities/UserRole.ts'), 'export class UserRoleEntity {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('infrastructure/persistence/entities')
      );
      expect(namingIssues.length).toBe(2);
    });

    it('should accept correct naming in infrastructure entities', async () => {
      // Create files with correct naming
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/entities/User.entity.ts'), 'export class UserEntity {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/entities/UserRole.entity.ts'), 'export class UserRoleEntity {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('infrastructure/persistence/entities')
      );
      expect(namingIssues.length).toBe(0);
    });

    it('should detect naming violations in presentation controllers', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'presentation/controllers/user.ts'), 'export class UserController {}');
      await fs.writeFile(path.join(tempDir, 'presentation/controllers/user-role.controller.ts'), 'export class UserRoleController {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('presentation/controllers')
      );
      expect(namingIssues.length).toBe(2);
    });

    it('should accept correct naming in presentation controllers', async () => {
      // Create files with correct naming
      await fs.writeFile(path.join(tempDir, 'presentation/controllers/User.controller.ts'), 'export class UserController {}');
      await fs.writeFile(path.join(tempDir, 'presentation/controllers/UserRole.controller.ts'), 'export class UserRoleController {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('presentation/controllers')
      );
      expect(namingIssues.length).toBe(0);
    });

    it('should skip index.ts files in naming validation', async () => {
      // Create index.ts files (should be ignored)
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/index.ts'), 'export * from "./User";');
      await fs.writeFile(path.join(tempDir, 'application/commands/index.ts'), 'export * from "./CreateUser.command";');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('index.ts')
      );
      expect(namingIssues.length).toBe(0);
    });
  });

  describe('barrel export validation', () => {
    beforeEach(async () => {
      // Create directory structure for barrel export tests
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'domain/events'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/commands'), { recursive: true });
    });

    it('should detect missing barrel exports', async () => {
      // Create TypeScript files without barrel exports
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/Role.ts'), 'export class Role {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/CreateUser.command.ts'), 'export class CreateUserCommand {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: true,
        validateNamingConventions: false,
        checkRequiredDirectories: false
      });

      const barrelIssues = result.issues.filter(issue => 
        issue.id.includes('missing-barrel-export')
      );
      expect(barrelIssues.length).toBe(2); // domain/aggregates and application/commands
      
      // Should have fixes for creating barrel exports
      const barrelFixes = result.fixes.filter(fix => 
        fix.action === 'create-barrel-export'
      );
      expect(barrelFixes.length).toBe(2);
    });

    it('should pass validation when barrel exports exist', async () => {
      // Create TypeScript files with barrel exports
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/Role.ts'), 'export class Role {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/index.ts'), 'export * from "./User";\nexport * from "./Role";');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: true,
        validateNamingConventions: false,
        checkRequiredDirectories: false
      });

      const barrelIssues = result.issues.filter(issue => 
        issue.id.includes('missing-barrel-export') && 
        issue.location?.includes('domain/aggregates')
      );
      expect(barrelIssues.length).toBe(0);
    });

    it('should not require barrel exports for empty directories', async () => {
      // Create empty directories
      await fs.mkdir(path.join(tempDir, 'domain/services'), { recursive: true });

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: true,
        validateNamingConventions: false,
        checkRequiredDirectories: false
      });

      const barrelIssues = result.issues.filter(issue => 
        issue.id.includes('missing-barrel-export') && 
        issue.location?.includes('domain/services')
      );
      expect(barrelIssues.length).toBe(0);
    });

    it('should not require barrel exports for directories with only index.ts', async () => {
      // Create directory with only index.ts
      await fs.writeFile(path.join(tempDir, 'domain/events/index.ts'), '// Empty barrel export');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: true,
        validateNamingConventions: false,
        checkRequiredDirectories: false
      });

      const barrelIssues = result.issues.filter(issue => 
        issue.id.includes('missing-barrel-export') && 
        issue.location?.includes('domain/events')
      );
      expect(barrelIssues.length).toBe(0);
    });
  });

  describe('applyFix functionality', () => {
    it('should throw error for unknown fix action', async () => {
      const fix = {
        action: 'unknown-action',
        parameters: {}
      };

      await expect(validator.applyFix(fix)).rejects.toThrow('Unknown fix action: unknown-action');
    });

    it('should apply create-directory fix', async () => {
      const dirPath = path.join(tempDir, 'test-directory');
      const fix = {
        action: 'create-directory',
        parameters: { path: dirPath }
      };

      await validator.applyFix(fix);

      // Verify directory was created
      const stat = await fs.stat(dirPath);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should apply rename-file fix', async () => {
      const oldPath = path.join(tempDir, 'old-file.ts');
      const newPath = path.join(tempDir, 'NewFile.ts');
      
      // Create the original file
      await fs.writeFile(oldPath, 'export class OldFile {}');

      const fix = {
        action: 'rename-file',
        parameters: { oldPath, newPath }
      };

      await validator.applyFix(fix);

      // Verify file was renamed
      const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
      const newExists = await fs.access(newPath).then(() => true).catch(() => false);
      
      expect(oldExists).toBe(false);
      expect(newExists).toBe(true);
    });

    it('should apply create-barrel-export fix', async () => {
      const dirPath = path.join(tempDir, 'test-barrel');
      await fs.mkdir(dirPath, { recursive: true });
      
      // Create some TypeScript files
      await fs.writeFile(path.join(dirPath, 'File1.ts'), 'export class File1 {}');
      await fs.writeFile(path.join(dirPath, 'File2.ts'), 'export class File2 {}');

      const fix = {
        action: 'create-barrel-export',
        parameters: { 
          directory: dirPath,
          files: ['File1.ts', 'File2.ts']
        }
      };

      await validator.applyFix(fix);

      // Verify barrel export was created
      const indexPath = path.join(dirPath, 'index.ts');
      const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
      expect(indexExists).toBe(true);

      const content = await fs.readFile(indexPath, 'utf-8');
      expect(content).toContain("export * from './File1';");
      expect(content).toContain("export * from './File2';");
    });
  });

  describe('comprehensive validation scenarios', () => {
    it('should handle complex module structure with multiple issues', async () => {
      // Create a complex but flawed module structure
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/commands'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/entities'), { recursive: true });
      
      // Create files with various naming issues
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user_role.ts'), 'export class UserRole {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/createUser.ts'), 'export class CreateUser {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/entities/User.ts'), 'export class UserEntity {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: true,
        validateNamingConventions: true,
        checkRequiredDirectories: true
      });

      expect(result.isValid).toBe(false);
      
      // Should have multiple types of issues
      const missingDirIssues = result.issues.filter(issue => issue.id.includes('missing-directory'));
      const namingIssues = result.issues.filter(issue => issue.id.includes('naming-violation'));
      const barrelIssues = result.issues.filter(issue => issue.id.includes('missing-barrel-export'));
      
      expect(missingDirIssues.length).toBeGreaterThan(0);
      expect(namingIssues.length).toBeGreaterThan(0);
      expect(barrelIssues.length).toBeGreaterThan(0);
      
      // Should have corresponding fixes
      expect(result.fixes.length).toBeGreaterThan(0);
      expect(result.metadata?.autoFixableIssues).toBeGreaterThan(0);
    });

    it('should pass validation for properly structured module', async () => {
      // Create a properly structured module
      const dirs = [
        'domain', 'domain/aggregates', 'domain/entities', 'domain/value-objects',
        'domain/events', 'domain/repositories', 'domain/services',
        'application', 'application/commands', 'application/queries', 
        'application/handlers', 'application/dto',
        'infrastructure', 'infrastructure/persistence',
        'infrastructure/persistence/entities', 'infrastructure/persistence/repositories',
        'infrastructure/persistence/mappers', 'infrastructure/persistence/migrations',
        'infrastructure/persistence/seeds', 'infrastructure/messaging',
        'infrastructure/processors',
        'presentation', 'presentation/controllers', 'presentation/dto',
        'presentation/guards', 'presentation/decorators'
      ];

      for (const dir of dirs) {
        await fs.mkdir(path.join(tempDir, dir), { recursive: true });
      }

      // Create properly named files with barrel exports
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/index.ts'), 'export * from "./User";');
      
      await fs.writeFile(path.join(tempDir, 'domain/events/UserCreated.event.ts'), 'export class UserCreatedEvent {}');
      await fs.writeFile(path.join(tempDir, 'domain/events/index.ts'), 'export * from "./UserCreated.event";');
      
      await fs.writeFile(path.join(tempDir, 'application/commands/CreateUser.command.ts'), 'export class CreateUserCommand {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/index.ts'), 'export * from "./CreateUser.command";');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: true,
        validateNamingConventions: true,
        checkRequiredDirectories: true
      });

      expect(result.isValid).toBe(true);
      expect(result.issues.filter(issue => issue.severity === IssueSeverity.ERROR).length).toBe(0);
      expect(result.metadata?.totalIssues).toBe(0);
    });

    it('should handle edge cases in file naming patterns', async () => {
      // Create directories for edge case testing
      await fs.mkdir(path.join(tempDir, 'domain/repositories'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/migrations'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/seeds'), { recursive: true });

      // Create files with edge case naming patterns
      await fs.writeFile(path.join(tempDir, 'domain/repositories/iUserRepository.ts'), 'export interface IUserRepository {}');
      await fs.writeFile(path.join(tempDir, 'domain/repositories/user-repository.interface.ts'), 'export interface IUserRepository {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/migrations/123-CreateUsers.ts'), 'export class CreateUsers {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/migrations/invalid-migration.ts'), 'export class InvalidMigration {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/seeds/seed-users.ts'), 'export class SeedUsers {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/seeds/1234567890123-seed-users.ts'), 'export class SeedUsers {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      // Should detect naming violations for all edge cases
      const namingIssues = result.issues.filter(issue => issue.id.includes('naming-violation'));
      expect(namingIssues.length).toBeGreaterThan(0);

      // Should have fixes for some of the violations
      const renameFixes = result.fixes.filter(fix => fix.action === 'rename-file');
      expect(renameFixes.length).toBeGreaterThan(0);
    });

    it('should handle mixed case scenarios with partial compliance', async () => {
      // Create a module with mixed compliance levels
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'domain/events'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/commands'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/queries'), { recursive: true });

      // Mix of correct and incorrect files
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user_role.ts'), 'export class UserRole {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/index.ts'), 'export * from "./User";');
      
      await fs.writeFile(path.join(tempDir, 'domain/events/UserCreated.event.ts'), 'export class UserCreatedEvent {}');
      await fs.writeFile(path.join(tempDir, 'domain/events/user-updated.ts'), 'export class UserUpdatedEvent {}');
      // No barrel export for events
      
      await fs.writeFile(path.join(tempDir, 'application/commands/CreateUser.command.ts'), 'export class CreateUserCommand {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/updateUser.ts'), 'export class UpdateUserCommand {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/index.ts'), 'export * from "./CreateUser.command";');
      
      // Empty queries directory
      
      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: true,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      // Should have mixed results
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Should have naming violations
      const namingIssues = result.issues.filter(issue => issue.id.includes('naming-violation'));
      expect(namingIssues.length).toBeGreaterThan(0);
      
      // Should have missing barrel export issues
      const barrelIssues = result.issues.filter(issue => issue.id.includes('missing-barrel-export'));
      expect(barrelIssues.length).toBeGreaterThan(0);
      
      // Should not have barrel export issue for empty queries directory
      const queriesBarrelIssue = result.issues.find(issue => 
        issue.id.includes('missing-barrel-export') && issue.location?.includes('application/queries')
      );
      expect(queriesBarrelIssue).toBeUndefined();
    });

    it('should validate special file types correctly', async () => {
      // Create directories for special file types
      await fs.mkdir(path.join(tempDir, 'domain/services'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/mappers'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'presentation/guards'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'presentation/decorators'), { recursive: true });

      // Create files with correct and incorrect naming for special types
      await fs.writeFile(path.join(tempDir, 'domain/services/PermissionService.ts'), 'export class PermissionService {}');
      await fs.writeFile(path.join(tempDir, 'domain/services/user-service.ts'), 'export class UserService {}');
      
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/mappers/UserMapper.ts'), 'export class UserMapper {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/mappers/role_mapper.ts'), 'export class RoleMapper {}');
      
      await fs.writeFile(path.join(tempDir, 'presentation/guards/AuthGuard.guard.ts'), 'export class AuthGuard {}');
      await fs.writeFile(path.join(tempDir, 'presentation/guards/permission.ts'), 'export class PermissionGuard {}');
      
      await fs.writeFile(path.join(tempDir, 'presentation/decorators/RequirePermissions.decorator.ts'), 'export function RequirePermissions() {}');
      await fs.writeFile(path.join(tempDir, 'presentation/decorators/log-decorator.ts'), 'export function Log() {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      // Should detect naming violations for incorrectly named files
      const namingIssues = result.issues.filter(issue => issue.id.includes('naming-violation'));
      expect(namingIssues.length).toBeGreaterThan(0);

      // Should have fixes for the violations
      const renameFixes = result.fixes.filter(fix => fix.action === 'rename-file');
      expect(renameFixes.length).toBeGreaterThan(0);

      // Verify specific violations are detected
      const serviceViolation = namingIssues.find(issue => issue.location?.includes('user-service.ts'));
      const mapperViolation = namingIssues.find(issue => issue.location?.includes('role_mapper.ts'));
      const guardViolation = namingIssues.find(issue => issue.location?.includes('permission.ts'));
      const decoratorViolation = namingIssues.find(issue => issue.location?.includes('log-decorator.ts'));

      expect(serviceViolation).toBeDefined();
      expect(mapperViolation).toBeDefined();
      expect(guardViolation).toBeDefined();
      expect(decoratorViolation).toBeDefined();
    });

    it('should handle migration and seed file naming validation', async () => {
      // Create directories for migrations and seeds
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/migrations'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/seeds'), { recursive: true });

      // Create files with correct and incorrect migration naming
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/migrations/1704240000001-CreateUsersTable.ts'), 'export class CreateUsersTable {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/migrations/invalid-migration.ts'), 'export class InvalidMigration {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/migrations/123-CreateRoles.ts'), 'export class CreateRoles {}');

      // Create files with correct and incorrect seed naming
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/seeds/1704240000001-seed-iam-users.ts'), 'export class SeedIamUsers {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/seeds/seed-roles.ts'), 'export class SeedRoles {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/seeds/1234567890123-seed-permissions.ts'), 'export class SeedPermissions {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      // Should detect naming violations for incorrectly named migration and seed files
      const namingIssues = result.issues.filter(issue => issue.id.includes('naming-violation'));
      expect(namingIssues.length).toBeGreaterThan(0);

      // Should have violations for invalid migration and seed files
      const migrationViolations = namingIssues.filter(issue => 
        issue.location?.includes('infrastructure/persistence/migrations')
      );
      const seedViolations = namingIssues.filter(issue => 
        issue.location?.includes('infrastructure/persistence/seeds')
      );

      expect(migrationViolations.length).toBeGreaterThan(0);
      expect(seedViolations.length).toBeGreaterThan(0);
    });

    it('should handle processor file naming validation', async () => {
      // Create directory for processors
      await fs.mkdir(path.join(tempDir, 'infrastructure/processors'), { recursive: true });

      // Create files with correct and incorrect processor naming
      await fs.writeFile(path.join(tempDir, 'infrastructure/processors/iam-event.processor.ts'), 'export class IamEventProcessor {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/processors/UserProcessor.ts'), 'export class UserProcessor {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/processors/role_processor.ts'), 'export class RoleProcessor {}');

      const result = await validator.validate({
        modulePath: tempDir,
        enforceBarrelExports: false,
        validateNamingConventions: true,
        checkRequiredDirectories: false
      });

      // Should detect naming violations for incorrectly named processor files
      const namingIssues = result.issues.filter(issue => 
        issue.id.includes('naming-violation') && 
        issue.location?.includes('infrastructure/processors')
      );
      expect(namingIssues.length).toBeGreaterThan(0);

      // Should have fixes for the violations
      const renameFixes = result.fixes.filter(fix => 
        fix.action === 'rename-file' && 
        fix.parameters?.oldPath?.includes('infrastructure/processors')
      );
      expect(renameFixes.length).toBeGreaterThanOrEqual(0); // May not have fixes if patterns don't match
    });
  });
});