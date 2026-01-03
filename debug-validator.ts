import { FileStructureValidator } from './src/standardization/validators/structure/file-structure-validator';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

async function debugValidator() {
  const validator = new FileStructureValidator();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'debug-test-'));
  
  try {
    // Test the exact failing scenario: domain/aggregates, hasBarrelExport=false, fileCount=1
    console.log('=== Testing exact failing scenario ===');
    const modulePath = path.join(tempDir, 'barrel-test-module');
    const dirPath = path.join(modulePath, 'domain/aggregates');
    await fs.mkdir(dirPath, { recursive: true });

    // Create exactly one file using the same logic as the test
    const fileName = getProperFileNameForDirectory('domain/aggregates', 'TestFile1');
    console.log('Creating file:', fileName);
    const filePath = path.join(dirPath, fileName);
    await fs.writeFile(filePath, 'export class TestFile1 {}\n');

    // Do NOT create barrel export (hasBarrelExport = false)

    const result = await validator.validate({
      modulePath,
      enforceBarrelExports: true,
      validateNamingConventions: false,
      checkRequiredDirectories: false
    });

    console.log('Barrel export issues found:', result.issues.length);
    result.issues.forEach(issue => {
      console.log('Issue:', issue.id, issue.message, issue.location, issue.rule);
    });

    // List files in the directory to confirm
    const files = await fs.readdir(dirPath);
    console.log('Files in directory:', files);
    
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
    
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

debugValidator().catch(console.error);