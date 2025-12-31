/**
 * API documentation validator for module documentation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ApiDocsValidation, ApiDocsIssue } from '../../interfaces/documentation.interface';

export class ApiDocsValidator {
  async validateApiDocs(docsPath: string): Promise<ApiDocsValidation> {
    const issues: ApiDocsIssue[] = [];
    let exists = false;

    try {
      const stats = await fs.stat(docsPath);
      exists = stats.isDirectory();
    } catch (error) {
      issues.push({
        id: 'docs-directory-missing',
        type: 'missing_directory',
        message: 'docs/ directory does not exist',
        severity: 'error',
        location: docsPath,
        autoFixable: true,
        suggestion: 'Create docs/ directory with API documentation structure'
      });
    }

    if (exists) {
      await this.validateRequiredFiles(docsPath, issues);
      await this.validateOpenApiSpec(docsPath, issues);
      await this.validateEndpointsDoc(docsPath, issues);
      await this.validateAuthDoc(docsPath, issues);
    }

    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));

    return {
      isValid: errorCount === 0,
      issues,
      score,
      metadata: {
        exists,
        filesFound: exists ? await this.listDocFiles(docsPath) : [],
        lastModified: exists ? await this.getLastModified(docsPath) : null
      }
    };
  }

  private async validateRequiredFiles(docsPath: string, issues: ApiDocsIssue[]): Promise<void> {
    const requiredFiles = [
      'INDEX.md',
      'openapi.yaml',
      'api/endpoints.md',
      'api/authentication.md'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(docsPath, file);
      try {
        await fs.access(filePath);
      } catch {
        issues.push({
          id: `missing-${file.replace(/[/.]/g, '-')}`,
          type: 'missing_file',
          message: `Required documentation file missing: ${file}`,
          severity: 'error',
          location: filePath,
          autoFixable: true,
          suggestion: `Create ${file} with appropriate content`
        });
      }
    }
  }

  private async validateOpenApiSpec(docsPath: string, issues: ApiDocsIssue[]): Promise<void> {
    const openApiPath = path.join(docsPath, 'openapi.yaml');
    
    try {
      const content = await fs.readFile(openApiPath, 'utf-8');
      
      if (!content.includes('openapi:') && !content.includes('swagger:')) {
        issues.push({
          id: 'invalid-openapi-format',
          type: 'invalid_format',
          message: 'openapi.yaml does not appear to be a valid OpenAPI specification',
          severity: 'error',
          location: openApiPath,
          autoFixable: false,
          suggestion: 'Ensure openapi.yaml follows OpenAPI 3.0+ specification format'
        });
      }

      const requiredSections = ['info:', 'paths:', 'components:'];
      for (const section of requiredSections) {
        if (!content.includes(section)) {
          issues.push({
            id: `missing-openapi-${section.replace(':', '')}`,
            type: 'missing_section',
            message: `OpenAPI specification missing required section: ${section}`,
            severity: 'error',
            location: openApiPath,
            autoFixable: false,
            suggestion: `Add ${section} section to OpenAPI specification`
          });
        }
      }

      if (content.length < 500) {
        issues.push({
          id: 'openapi-too-short',
          type: 'insufficient_content',
          message: 'OpenAPI specification appears to be incomplete (less than 500 characters)',
          severity: 'warning',
          location: openApiPath,
          autoFixable: false,
          suggestion: 'Expand OpenAPI specification with complete API documentation'
        });
      }

    } catch (error) {
      // File doesn't exist - already handled in validateRequiredFiles
    }
  }

  private async validateEndpointsDoc(docsPath: string, issues: ApiDocsIssue[]): Promise<void> {
    const endpointsPath = path.join(docsPath, 'api', 'endpoints.md');
    
    try {
      const content = await fs.readFile(endpointsPath, 'utf-8');
      
      const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const foundMethods = httpMethods.filter(method => content.includes(method));
      
      if (foundMethods.length === 0) {
        issues.push({
          id: 'no-http-methods',
          type: 'missing_content',
          message: 'endpoints.md does not document any HTTP methods',
          severity: 'error',
          location: endpointsPath,
          autoFixable: false,
          suggestion: 'Document all API endpoints with their HTTP methods'
        });
      }

      const hasExamples = content.includes('```') && (
        content.toLowerCase().includes('request') || 
        content.toLowerCase().includes('response') ||
        content.toLowerCase().includes('example')
      );
      
      if (!hasExamples) {
        issues.push({
          id: 'no-api-examples',
          type: 'missing_examples',
          message: 'endpoints.md should include request/response examples',
          severity: 'warning',
          location: endpointsPath,
          autoFixable: false,
          suggestion: 'Add code examples showing request and response formats'
        });
      }

    } catch (error) {
      // File doesn't exist - already handled in validateRequiredFiles
    }
  }

  private async validateAuthDoc(docsPath: string, issues: ApiDocsIssue[]): Promise<void> {
    const authPath = path.join(docsPath, 'api', 'authentication.md');
    
    try {
      const content = await fs.readFile(authPath, 'utf-8');
      
      const authKeywords = ['jwt', 'token', 'bearer', 'authentication', 'authorization'];
      const hasAuthContent = authKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
      
      if (!hasAuthContent) {
        issues.push({
          id: 'no-auth-content',
          type: 'missing_content',
          message: 'authentication.md does not contain authentication information',
          severity: 'error',
          location: authPath,
          autoFixable: false,
          suggestion: 'Document authentication methods, token usage, and permission requirements'
        });
      }

      if (!content.toLowerCase().includes('permission') && !content.toLowerCase().includes('role')) {
        issues.push({
          id: 'no-permission-docs',
          type: 'missing_content',
          message: 'authentication.md should document permissions and roles',
          severity: 'warning',
          location: authPath,
          autoFixable: false,
          suggestion: 'Add documentation for RBAC system and permission requirements'
        });
      }

    } catch (error) {
      // File doesn't exist - already handled in validateRequiredFiles
    }
  }

  private async listDocFiles(docsPath: string): Promise<string[]> {
    try {
      const files: string[] = [];
      
      async function walkDir(dir: string, relativePath = ''): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            await walkDir(fullPath, relPath);
          } else {
            files.push(relPath);
          }
        }
      }
      
      await walkDir(docsPath);
      return files;
    } catch {
      return [];
    }
  }

  private async getLastModified(docsPath: string): Promise<Date | null> {
    try {
      const stats = await fs.stat(docsPath);
      return stats.mtime;
    } catch {
      return null;
    }
  }
}