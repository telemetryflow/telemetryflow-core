const { FileStructureValidator } = require('./src/standardization/validators/structure/file-structure-validator');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

async function debugValidator() {
  const validator = new FileStructureValidator();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'debug-test-'));
  
  try {
    // Test naming convention issue
    const modulePath = path.join(tempDir, 'test-module');
    const dirPath = path.join(modulePath, 'domain/aggregates');
    await fs.mkdir(dirPath, { recursive: true });
    
    // Create a file with invalid naming
    const filePath = path.join(dirPath, '123invalid.ts');
    await fs.writeFile(filePath, 'export class TestClass {}\n');
    
    const result = await validator.validate({
      modulePath,
      enforceBarrelExports: false,
      validateNamingConventions: true,
      checkRequiredDirectories: false
    });
    
    console.log('Issues found:', result.issues.length);
    result.issues.forEach(issue => {
      console.log('Issue:', issue.id, issue.message, issue.location);
    });
    
    // Test barrel export issue
    const modulePath2 = path.join(tempDir, 'test-module2');
    const dirPath2 = path.join(modulePath2, 'domain/aggregates');
    await fs.mkdir(dirPath2, { recursive: true });
    
    // Create a TypeScript file
    const filePath2 = path.join(dirPath2, 'TestFile.ts');
    await fs.writeFile(filePath2, 'export class TestFile {}\n');
    
    const result2 = await validator.validate({
      modulePath: modulePath2,
      enforceBarrelExports: true,
      validateNamingConventions: false,
      checkRequiredDirectories: false
    });
    
    console.log('\nBarrel export issues found:', result2.issues.length);
    result2.issues.forEach(issue => {
      console.log('Issue:', issue.id, issue.message, issue.location);
    });
    
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

debugValidator().catch(console.error);