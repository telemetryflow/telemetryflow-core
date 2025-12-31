/**
 * Diagram validator for module documentation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DiagramValidation, DiagramIssue } from '../../interfaces/documentation.interface';

export class DiagramValidator {
  async validateDiagrams(diagramsPath: string): Promise<DiagramValidation> {
    const issues: DiagramIssue[] = [];
    let exists = false;

    try {
      const stats = await fs.stat(diagramsPath);
      exists = stats.isDirectory();
    } catch (error) {
      issues.push({
        id: 'diagrams-directory-missing',
        type: 'missing_directory',
        message: 'docs/ directory does not exist for diagrams',
        severity: 'warning',
        location: diagramsPath,
        autoFixable: true,
        suggestion: 'Create docs/ directory with diagram files'
      });
    }

    if (exists) {
      await this.validateERD(diagramsPath, issues);
      await this.validateDFD(diagramsPath, issues);
      await this.validateArchitectureDiagrams(diagramsPath, issues);
    }

    return {
      isValid: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      metadata: {
        exists,
        diagramsFound: exists ? await this.listDiagramFiles(diagramsPath) : [],
        lastModified: exists ? await this.getLastModified(diagramsPath) : null
      }
    };
  }

  private async validateERD(diagramsPath: string, issues: DiagramIssue[]): Promise<void> {
    const erdPath = path.join(diagramsPath, 'ERD.mermaid.md');
    
    try {
      const content = await fs.readFile(erdPath, 'utf-8');
      
      // Check for mermaid syntax
      if (!content.includes('```mermaid') && !content.includes('```erDiagram')) {
        issues.push({
          id: 'erd-no-mermaid',
          type: 'invalid_format',
          message: 'ERD.mermaid.md does not contain mermaid diagram syntax',
          severity: 'error',
          location: erdPath,
          autoFixable: false,
          suggestion: 'Add mermaid erDiagram syntax to visualize entity relationships'
        });
      }

      // Check for entity definitions
      const hasEntities = content.includes('||') || content.includes('entity') || content.includes('{');
      if (!hasEntities) {
        issues.push({
          id: 'erd-no-entities',
          type: 'missing_content',
          message: 'ERD diagram does not define any entities',
          severity: 'error',
          location: erdPath,
          autoFixable: false,
          suggestion: 'Define entities and their relationships in the ERD'
        });
      }

      // Check content length
      if (content.length < 200) {
        issues.push({
          id: 'erd-too-short',
          type: 'insufficient_content',
          message: 'ERD diagram appears to be incomplete (less than 200 characters)',
          severity: 'warning',
          location: erdPath,
          autoFixable: false,
          suggestion: 'Expand ERD with complete entity relationship documentation'
        });
      }

    } catch (error) {
      issues.push({
        id: 'erd-missing',
        type: 'missing_file',
        message: 'ERD.mermaid.md file does not exist',
        severity: 'warning',
        location: erdPath,
        autoFixable: true,
        suggestion: 'Create ERD.mermaid.md with entity relationship diagram'
      });
    }
  }

  private async validateDFD(diagramsPath: string, issues: DiagramIssue[]): Promise<void> {
    const dfdPath = path.join(diagramsPath, 'DFD.mermaid.md');
    
    try {
      const content = await fs.readFile(dfdPath, 'utf-8');
      
      // Check for mermaid syntax
      if (!content.includes('```mermaid') && !content.includes('```flowchart') && !content.includes('```graph')) {
        issues.push({
          id: 'dfd-no-mermaid',
          type: 'invalid_format',
          message: 'DFD.mermaid.md does not contain mermaid diagram syntax',
          severity: 'error',
          location: dfdPath,
          autoFixable: false,
          suggestion: 'Add mermaid flowchart syntax to visualize data flow'
        });
      }

      // Check for flow elements
      const hasFlow = content.includes('-->') || content.includes('->') || content.includes('flowchart');
      if (!hasFlow) {
        issues.push({
          id: 'dfd-no-flow',
          type: 'missing_content',
          message: 'DFD diagram does not show any data flow',
          severity: 'error',
          location: dfdPath,
          autoFixable: false,
          suggestion: 'Define data flow between components in the DFD'
        });
      }

      // Check content length
      if (content.length < 200) {
        issues.push({
          id: 'dfd-too-short',
          type: 'insufficient_content',
          message: 'DFD diagram appears to be incomplete (less than 200 characters)',
          severity: 'warning',
          location: dfdPath,
          autoFixable: false,
          suggestion: 'Expand DFD with complete data flow documentation'
        });
      }

    } catch (error) {
      issues.push({
        id: 'dfd-missing',
        type: 'missing_file',
        message: 'DFD.mermaid.md file does not exist',
        severity: 'warning',
        location: dfdPath,
        autoFixable: true,
        suggestion: 'Create DFD.mermaid.md with data flow diagram'
      });
    }
  }

  private async validateArchitectureDiagrams(diagramsPath: string, issues: DiagramIssue[]): Promise<void> {
    // Check for additional architecture diagrams
    const architectureFiles = [
      'ARCHITECTURE_DIAGRAMS.md',
      'architecture.md',
      'system-architecture.md'
    ];

    let hasArchitectureDoc = false;
    for (const file of architectureFiles) {
      const filePath = path.join(diagramsPath, file);
      try {
        await fs.access(filePath);
        hasArchitectureDoc = true;
        
        // Validate architecture document content
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.length < 300) {
          issues.push({
            id: 'architecture-doc-short',
            type: 'insufficient_content',
            message: `${file} appears to be incomplete (less than 300 characters)`,
            severity: 'warning',
            location: filePath,
            autoFixable: false,
            suggestion: 'Expand architecture documentation with detailed diagrams and explanations'
          });
        }
        break;
      } catch {
        // File doesn't exist, continue checking
      }
    }

    if (!hasArchitectureDoc) {
      issues.push({
        id: 'no-architecture-doc',
        type: 'missing_file',
        message: 'No architecture documentation found',
        severity: 'info',
        location: diagramsPath,
        autoFixable: true,
        suggestion: 'Create architecture documentation with system diagrams'
      });
    }
  }

  private async listDiagramFiles(diagramsPath: string): Promise<string[]> {
    try {
      const files: string[] = [];
      const entries = await fs.readdir(diagramsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && (
          entry.name.includes('diagram') ||
          entry.name.includes('ERD') ||
          entry.name.includes('DFD') ||
          entry.name.includes('architecture') ||
          entry.name.includes('mermaid')
        )) {
          files.push(entry.name);
        }
      }
      
      return files;
    } catch {
      return [];
    }
  }

  private async getLastModified(diagramsPath: string): Promise<Date | null> {
    try {
      const stats = await fs.stat(diagramsPath);
      return stats.mtime;
    } catch {
      return null;
    }
  }
}