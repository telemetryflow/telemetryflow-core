/**
 * Base validator class with common functionality
 */

import { ValidationResult, ValidationIssue, ValidationFix, Validator, ValidationRequirement } from '../interfaces/validation.interface';
import { IssueSeverity, IssueCategory } from '../interfaces/validation.interface';

export abstract class BaseValidator implements Validator {
  protected issues: ValidationIssue[] = [];
  protected fixes: ValidationFix[] = [];

  abstract validate(target: any): Promise<ValidationResult>;
  abstract getRequirements(): ValidationRequirement[];

  protected addIssue(
    id: string,
    message: string,
    severity: IssueSeverity,
    category: IssueCategory,
    rule: string,
    location?: string,
    autoFixable: boolean = false
  ): void {
    this.issues.push({
      id,
      severity,
      message,
      location: location || '',
      rule,
      category,
      autoFixable
    });
  }

  protected addFix(
    issueId: string,
    description: string,
    action: any,
    parameters?: Record<string, any>
  ): void {
    this.fixes.push({
      issueId,
      description,
      action,
      parameters: parameters || {}
    });
  }

  protected calculateScore(): number {
    if (this.issues.length === 0) return 100;

    const weights = {
      [IssueSeverity.ERROR]: 10,
      [IssueSeverity.WARNING]: 5,
      [IssueSeverity.INFO]: 1
    };

    const totalDeductions = this.issues.reduce((sum, issue) => {
      return sum + weights[issue.severity];
    }, 0);

    return Math.max(0, 100 - totalDeductions);
  }

  protected createResult(isValid: boolean, metadata?: Record<string, any>): ValidationResult {
    return {
      isValid,
      score: this.calculateScore(),
      issues: [...this.issues],
      fixes: [...this.fixes],
      metadata: metadata || {}
    };
  }

  protected reset(): void {
    this.issues = [];
    this.fixes = [];
  }

  canAutoFix(issue: ValidationIssue): boolean {
    return issue.autoFixable;
  }

  async applyFix(fix: ValidationFix): Promise<void> {
    // Base implementation - to be overridden by specific validators
    throw new Error(`Fix application not implemented for action: ${fix.action}`);
  }

  protected async fileExists(filePath: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  protected async readFile(filePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  protected async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  protected countLines(content: string): number {
    return content.split('\n').length;
  }

  protected countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  protected extractSections(markdownContent: string): { name: string; content: string; level: number }[] {
    const sections: { name: string; content: string; level: number }[] = [];
    const lines = markdownContent.split('\n');
    
    let currentSection: { name: string; content: string; level: number } | null = null;
    
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch && headerMatch[1] && headerMatch[2]) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        const level = headerMatch[1].length;
        const name = headerMatch[2].trim();
        currentSection = { name, content: '', level };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    
    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }
}