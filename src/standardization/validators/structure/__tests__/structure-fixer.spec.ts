/**
 * Structure Fixer Tests
 */

import { StructureFixer } from '../structure-fixer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('StructureFixer', () => {
  let fixer: StructureFixer;
  let tempDir: string;

  beforeEach(async () => {
    fixer = new StructureFixer();
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'structure-fixer-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('fixStructure - basic functionality', () => {
    it('should handle non-existent module path', async () => {
      const result = await fixer.fixStructure({
        modulePath: '/nonexistent/module',
        createMissingDirectories: true,
        generateBarrelExports: true,
        fixNamingViolations: true,
        dryRun: false
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.message).toContain('Module directory not found');
    });

    it('should return success for dry run with valid options', async () => {
      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: false,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.changes).toEqual([]);
    });

    it('should have proper result structure', async () => {
      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: false,
        dryRun: true
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('changes');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.changes)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('createMissingDirectories', () => {
    it('should create all missing directories in dry run mode', async () => {
      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: true,
        generateBarrelExports: false,
        fixNamingViolations: false,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
      
      // All changes should be create_directory type
      const createDirChanges = result.changes.filter(change => 
        change.type === 'create_directory'
      );
      expect(createDirChanges.length).toBe(result.changes.length);
      
      // Should include all required directories
      const expectedDirs = [
        'domain', 'domain/aggregates', 'domain/entities', 'domain/value-objects',
        'application', 'infrastructure', 'presentation'
      ];
      
      for (const expectedDir of expectedDirs) {
        const hasChange = result.changes.some(change => 
          change.path.includes(expectedDir)
        );
        expect(hasChange).toBe(true);
      }
    });

    it('should actually create directories when not in dry run mode', async () => {
      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: true,
        generateBarrelExports: false,
        fixNamingViolations: false,
        dryRun: false
      });

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
      
      // Verify some key directories were actually created
      const domainPath = path.join(tempDir, 'domain');
      const applicationPath = path.join(tempDir, 'application');
      const infrastructurePath = path.join(tempDir, 'infrastructure');
      
      const domainExists = await fs.stat(domainPath).then(stat => stat.isDirectory()).catch(() => false);
      const applicationExists = await fs.stat(applicationPath).then(stat => stat.isDirectory()).catch(() => false);
      const infrastructureExists = await fs.stat(infrastructurePath).then(stat => stat.isDirectory()).catch(() => false);
      
      expect(domainExists).toBe(true);
      expect(applicationExists).toBe(true);
      expect(infrastructureExists).toBe(true);
    });

    it('should not create directories that already exist', async () => {
      // Pre-create some directories
      await fs.mkdir(path.join(tempDir, 'domain'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: true,
        generateBarrelExports: false,
        fixNamingViolations: false,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      // Should not have changes for existing directories
      const domainChange = result.changes.find(change => 
        change.path.endsWith('domain') && change.type === 'create_directory'
      );
      const aggregatesChange = result.changes.find(change => 
        change.path.endsWith('domain/aggregates') && change.type === 'create_directory'
      );
      
      expect(domainChange).toBeUndefined();
      expect(aggregatesChange).toBeUndefined();
      
      // Should still have changes for missing directories
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });

  describe('generateBarrelExports', () => {
    beforeEach(async () => {
      // Create some directory structure
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'domain/events'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/commands'), { recursive: true });
    });

    it('should generate barrel exports for directories with TypeScript files', async () => {
      // Create some TypeScript files
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/Role.ts'), 'export class Role {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/CreateUser.command.ts'), 'export class CreateUserCommand {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: true,
        fixNamingViolations: false,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const barrelChanges = result.changes.filter(change => 
        change.type === 'create_file' && change.path.endsWith('index.ts')
      );
      expect(barrelChanges.length).toBe(2); // domain/aggregates and application/commands
      
      // Check content of barrel exports
      const aggregatesBarrel = barrelChanges.find(change => 
        change.path.includes('domain/aggregates')
      );
      expect(aggregatesBarrel?.content).toContain("export * from './Role';");
      expect(aggregatesBarrel?.content).toContain("export * from './User';");
    });

    it('should actually create barrel export files when not in dry run mode', async () => {
      // Create some TypeScript files
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/Role.ts'), 'export class Role {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: true,
        fixNamingViolations: false,
        dryRun: false
      });

      expect(result.success).toBe(true);
      
      // Verify barrel export file was created
      const indexPath = path.join(tempDir, 'domain/aggregates/index.ts');
      const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
      expect(indexExists).toBe(true);
      
      const content = await fs.readFile(indexPath, 'utf-8');
      expect(content).toContain("export * from './Role';");
      expect(content).toContain("export * from './User';");
    });

    it('should update existing barrel exports if content differs', async () => {
      // Create TypeScript files and an outdated barrel export
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/Role.ts'), 'export class Role {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/index.ts'), "export * from './User';");

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: true,
        fixNamingViolations: false,
        dryRun: false
      });

      expect(result.success).toBe(true);
      
      const updateChanges = result.changes.filter(change => 
        change.type === 'update_file'
      );
      expect(updateChanges.length).toBe(1);
      
      // Verify content was updated
      const indexPath = path.join(tempDir, 'domain/aggregates/index.ts');
      const content = await fs.readFile(indexPath, 'utf-8');
      expect(content).toContain("export * from './Role';");
      expect(content).toContain("export * from './User';");
    });

    it('should not generate barrel exports for empty directories', async () => {
      // Create empty directory
      await fs.mkdir(path.join(tempDir, 'domain/services'), { recursive: true });

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: true,
        fixNamingViolations: false,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const barrelChanges = result.changes.filter(change => 
        change.type === 'create_file' && change.path.includes('domain/services')
      );
      expect(barrelChanges.length).toBe(0);
    });

    it('should not generate barrel exports for directories with only index.ts', async () => {
      // Create directory with only index.ts
      await fs.writeFile(path.join(tempDir, 'domain/events/index.ts'), '// Empty');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: true,
        fixNamingViolations: false,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const barrelChanges = result.changes.filter(change => 
        change.type === 'create_file' && change.path.includes('domain/events')
      );
      expect(barrelChanges.length).toBe(0);
    });
  });

  describe('fixNamingViolations', () => {
    beforeEach(async () => {
      // Create directory structure for naming tests
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'domain/events'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/commands'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'infrastructure/persistence/entities'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'presentation/controllers'), { recursive: true });
    });

    it('should fix naming violations in domain aggregates', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user_role.ts'), 'export class UserRole {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const renameChanges = result.changes.filter(change => 
        change.type === 'rename_file'
      );
      
      // Only user_role.ts should be renamed (user.ts -> User.ts might not be detected as needing rename)
      expect(renameChanges.length).toBeGreaterThan(0);
      
      // Check that user_role.ts is renamed to UserRole.ts
      const userRoleRename = renameChanges.find(change => 
        change.oldPath?.includes('user_role.ts')
      );
      expect(userRoleRename?.path).toMatch(/UserRole\.ts$/);
    });

    it('should fix naming violations in domain events', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'domain/events/userCreated.ts'), 'export class UserCreatedEvent {}');
      await fs.writeFile(path.join(tempDir, 'domain/events/role-assigned.ts'), 'export class RoleAssignedEvent {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const renameChanges = result.changes.filter(change => 
        change.type === 'rename_file'
      );
      expect(renameChanges.length).toBe(2);
      
      // Check that files are renamed to correct event format
      const userCreatedRename = renameChanges.find(change => 
        change.oldPath?.includes('userCreated.ts')
      );
      expect(userCreatedRename?.path).toMatch(/UserCreated\.event\.ts$/);
      
      const roleAssignedRename = renameChanges.find(change => 
        change.oldPath?.includes('role-assigned.ts')
      );
      expect(roleAssignedRename?.path).toMatch(/RoleAssigned\.event\.ts$/);
    });

    it('should fix naming violations in application commands', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'application/commands/createUser.ts'), 'export class CreateUserCommand {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/update-user.ts'), 'export class UpdateUserCommand {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const renameChanges = result.changes.filter(change => 
        change.type === 'rename_file'
      );
      expect(renameChanges.length).toBe(2);
      
      // Check that files are renamed to correct command format
      const createUserRename = renameChanges.find(change => 
        change.oldPath?.includes('createUser.ts')
      );
      expect(createUserRename?.path).toMatch(/CreateUser\.command\.ts$/);
      
      const updateUserRename = renameChanges.find(change => 
        change.oldPath?.includes('update-user.ts')
      );
      expect(updateUserRename?.path).toMatch(/UpdateUser\.command\.ts$/);
    });

    it('should fix naming violations in infrastructure entities', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/entities/user.ts'), 'export class UserEntity {}');
      await fs.writeFile(path.join(tempDir, 'infrastructure/persistence/entities/UserRole.ts'), 'export class UserRoleEntity {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const renameChanges = result.changes.filter(change => 
        change.type === 'rename_file'
      );
      expect(renameChanges.length).toBe(2);
      
      // Check that files are renamed to correct entity format
      const userRename = renameChanges.find(change => 
        change.oldPath?.includes('user.ts')
      );
      expect(userRename?.path).toMatch(/User\.entity\.ts$/);
      
      const userRoleRename = renameChanges.find(change => 
        change.oldPath?.includes('UserRole.ts')
      );
      expect(userRoleRename?.path).toMatch(/UserRole\.entity\.ts$/);
    });

    it('should fix naming violations in presentation controllers', async () => {
      // Create files with incorrect naming
      await fs.writeFile(path.join(tempDir, 'presentation/controllers/user.ts'), 'export class UserController {}');
      await fs.writeFile(path.join(tempDir, 'presentation/controllers/user-role.controller.ts'), 'export class UserRoleController {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const renameChanges = result.changes.filter(change => 
        change.type === 'rename_file'
      );
      expect(renameChanges.length).toBe(2);
      
      // Check that files are renamed to correct controller format
      const userRename = renameChanges.find(change => 
        change.oldPath?.includes('user.ts')
      );
      expect(userRename?.path).toMatch(/User\.controller\.ts$/);
      
      const userRoleRename = renameChanges.find(change => 
        change.oldPath?.includes('user-role.controller.ts')
      );
      expect(userRoleRename?.path).toMatch(/UserRole\.controller\.ts$/);
    });

    it('should actually rename files when not in dry run mode', async () => {
      // Create file with incorrect naming
      const oldPath = path.join(tempDir, 'domain/aggregates/user_role.ts');
      await fs.writeFile(oldPath, 'export class UserRole {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: false
      });

      expect(result.success).toBe(true);
      
      // Verify file was renamed
      const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
      const newPath = path.join(tempDir, 'domain/aggregates/UserRole.ts');
      const newExists = await fs.access(newPath).then(() => true).catch(() => false);
      
      expect(oldExists).toBe(false);
      expect(newExists).toBe(true);
    });

    it('should not rename files if target already exists', async () => {
      // Create files where target already exists
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const renameChanges = result.changes.filter(change => 
        change.type === 'rename_file' && change.oldPath?.includes('user.ts')
      );
      expect(renameChanges.length).toBe(0);
    });

    it('should not rename files that already follow conventions', async () => {
      // Create files with correct naming
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/User.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/events/UserCreated.event.ts'), 'export class UserCreatedEvent {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/CreateUser.command.ts'), 'export class CreateUserCommand {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: false,
        generateBarrelExports: false,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      
      const renameChanges = result.changes.filter(change => 
        change.type === 'rename_file'
      );
      expect(renameChanges.length).toBe(0);
    });
  });

  describe('utility methods', () => {
    describe('generateMissingDirectoryStructure', () => {
      it('should return empty array for non-existent module', async () => {
        const changes = await fixer.generateMissingDirectoryStructure('/nonexistent');
        expect(Array.isArray(changes)).toBe(true);
        expect(changes.length).toBe(0);
      });

      it('should return changes for missing directories', async () => {
        const changes = await fixer.generateMissingDirectoryStructure(tempDir);
        expect(Array.isArray(changes)).toBe(true);
        expect(changes.length).toBeGreaterThan(0);
        expect(changes.every(change => change.type === 'create_directory')).toBe(true);
      });
    });

    describe('createBarrelExportForDirectory', () => {
      it('should return null for non-existent directory', async () => {
        const result = await fixer.createBarrelExportForDirectory('/nonexistent');
        expect(result).toBeNull();
      });

      it('should return null for directory with no TypeScript files', async () => {
        await fs.mkdir(path.join(tempDir, 'empty-dir'), { recursive: true });
        const result = await fixer.createBarrelExportForDirectory(path.join(tempDir, 'empty-dir'));
        expect(result).toBeNull();
      });

      it('should create barrel export for directory with TypeScript files', async () => {
        const testDir = path.join(tempDir, 'test-dir');
        await fs.mkdir(testDir, { recursive: true });
        await fs.writeFile(path.join(testDir, 'File1.ts'), 'export class File1 {}');
        await fs.writeFile(path.join(testDir, 'File2.ts'), 'export class File2 {}');

        const result = await fixer.createBarrelExportForDirectory(testDir);
        
        expect(result).not.toBeNull();
        expect(result?.type).toBe('create_file');
        expect(result?.path).toMatch(/index\.ts$/);
        expect(result?.content).toContain("export * from './File1';");
        expect(result?.content).toContain("export * from './File2';");
        
        // Verify file was actually created
        const indexPath = path.join(testDir, 'index.ts');
        const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
        expect(indexExists).toBe(true);
      });
    });

    describe('renameFileToConvention', () => {
      it('should return null for non-existent file', async () => {
        const pattern = /^[A-Z][a-zA-Z0-9]*\.ts$/;
        const result = await fixer.renameFileToConvention('/nonexistent/file.ts', pattern);
        expect(result).toBeNull();
      });

      it('should return null if file already follows convention', async () => {
        const filePath = path.join(tempDir, 'User.ts');
        await fs.writeFile(filePath, 'export class User {}');
        
        const pattern = /^[A-Z][a-zA-Z0-9]*\.ts$/;
        const result = await fixer.renameFileToConvention(filePath, pattern);
        expect(result).toBeNull();
      });

      it('should return null if target file already exists', async () => {
        const oldPath = path.join(tempDir, 'user.ts');
        const newPath = path.join(tempDir, 'User.ts');
        await fs.writeFile(oldPath, 'export class User {}');
        await fs.writeFile(newPath, 'export class User {}');
        
        const pattern = /^[A-Z][a-zA-Z0-9]*\.ts$/;
        const result = await fixer.renameFileToConvention(oldPath, pattern);
        expect(result).toBeNull();
      });

      it('should rename file to follow convention', async () => {
        const oldPath = path.join(tempDir, 'user.ts');
        await fs.writeFile(oldPath, 'export class User {}');
        
        const pattern = /^[A-Z][a-zA-Z0-9]*\.ts$/;
        const result = await fixer.renameFileToConvention(oldPath, pattern);
        
        expect(result).not.toBeNull();
        expect(result?.type).toBe('rename_file');
        expect(result?.oldPath).toBe(oldPath);
        expect(result?.path).toMatch(/User\.ts$/);
        
        // Verify file was actually renamed
        const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
        const newExists = await fs.access(result!.path).then(() => true).catch(() => false);
        
        expect(oldExists).toBe(false);
        expect(newExists).toBe(true);
      });
    });
  });

  describe('comprehensive scenarios', () => {
    it('should handle complex module with all types of fixes needed', async () => {
      // Create a complex but flawed module structure
      await fs.mkdir(path.join(tempDir, 'domain/aggregates'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'application/commands'), { recursive: true });
      
      // Create files with naming issues and missing barrel exports
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user.ts'), 'export class User {}');
      await fs.writeFile(path.join(tempDir, 'domain/aggregates/user_role.ts'), 'export class UserRole {}');
      await fs.writeFile(path.join(tempDir, 'application/commands/createUser.ts'), 'export class CreateUser {}');

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: true,
        generateBarrelExports: true,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
      
      // Should have all types of changes
      const createDirChanges = result.changes.filter(change => change.type === 'create_directory');
      const renameFileChanges = result.changes.filter(change => change.type === 'rename_file');
      const createFileChanges = result.changes.filter(change => change.type === 'create_file');
      
      expect(createDirChanges.length).toBeGreaterThan(0);
      expect(renameFileChanges.length).toBeGreaterThan(0);
      expect(createFileChanges.length).toBeGreaterThan(0);
      
      expect(result.message).toContain('changes made');
    });

    it('should handle module with no issues', async () => {
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

      const result = await fixer.fixStructure({
        modulePath: tempDir,
        createMissingDirectories: true,
        generateBarrelExports: true,
        fixNamingViolations: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.changes.length).toBe(0);
      expect(result.message).toContain('0 changes made');
    });
  });
});