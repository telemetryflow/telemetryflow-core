/**
 * README.md validator for module documentation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ReadmeValidation, ReadmeIssue } from '../../interfaces/documentation.interface';
import { QUALITY_THRESHOLDS, REQUIRED_SECTIONS } from '../../types/constants';

export class ReadmeValidator {
  async validateReadme(readmePath: string): Promise<ReadmeValidation> {
    const issues: ReadmeIssue[] = [];
    let content = '';
    let exists = false;

    try {
      content = await fs.readFile(readmePath, 'utf-8');
      exists = true;
    } catch (error) {
      issues.push({
        id: 'readme-missing',
        type: 'missing_file',
        message: 'README.md file does not exist',
        severity: 'error',
        location: readmePath,
        autoFixable: true,
        suggestion: 'Create README.md file with required sections'
      });
    }

    if (exists) {
      // Check minimum length
      const lines = content.split('\n');
      if (lines.length < QUALITY_THRESHOLDS.DOCUMENTATION.MIN_README_LENGTH) {
        issues.push({
          id: 'readme-too-short',
          type: 'insufficient_content',
          message: `README.md has ${lines.length} lines, minimum required is ${QUALITY_THRESHOLDS.DOCUMENTATION.MIN_README_LENGTH}`,
          severity: 'error',
          location: readmePath,
          autoFixable: true,
          suggestion: 'Expand README.md content to meet minimum length requirement'
        });
      }

      // Check required sections
      const missingSections = this.checkRequiredSections(content);
      if (missingSections.length > 0) {
        issues.push({
          id: 'readme-missing-sections',
          type: 'missing_sections',
          message: `README.md is missing required sections: ${missingSections.join(', ')}`,
          severity: 'error',
          location: readmePath,
          autoFixable: true,
          suggestion: `Add the following sections: ${missingSections.join(', ')}`
        });
      }

      // Check section content quality
      const contentIssues = this.validateSectionContent(content);
      issues.push(...contentIssues);
    }

    return {
      isValid: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      metadata: {
        exists,
        lineCount: content.split('\n').length,
        wordCount: content.split(/\s+/).length,
        sectionsFound: this.extractSections(content),
        lastModified: exists ? await this.getLastModified(readmePath) : null
      }
    };
  }

  private checkRequiredSections(content: string): string[] {
    const foundSections = this.extractSections(content);
    const foundSectionNames = foundSections.map(s => s.toLowerCase());
    
    return REQUIRED_SECTIONS.README.filter(required => 
      !foundSectionNames.some(found => 
        found.includes(required.toLowerCase()) || 
        required.toLowerCase().includes(found)
      )
    );
  }

  private extractSections(content: string): string[] {
    const headerRegex = /^#+\s+(.+)$/gm;
    const sections: string[] = [];
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
      if (match[1]) {
        sections.push(match[1].trim());
      }
    }

    return sections;
  }

  private validateSectionContent(content: string): ReadmeIssue[] {
    const issues: ReadmeIssue[] = [];
    const sections = this.parseSectionsWithContent(content);

    // Check overview section
    const overview = sections.find(s => 
      s.title.toLowerCase().includes('overview') || 
      s.title.toLowerCase().includes('introduction')
    );
    if (overview && overview.content.length < 200) {
      issues.push({
        id: 'overview-too-short',
        type: 'insufficient_content',
        message: 'Overview section should be at least 200 characters',
        severity: 'warning',
        location: 'Overview section',
        autoFixable: false,
        suggestion: 'Expand the overview section with more detailed description'
      });
    }

    // Check for code examples
    const codeBlockCount = (content.match(/```/g) || []).length / 2;
    if (codeBlockCount < 3) {
      issues.push({
        id: 'insufficient-examples',
        type: 'missing_examples',
        message: 'README should include at least 3 code examples',
        severity: 'warning',
        location: 'Code examples',
        autoFixable: false,
        suggestion: 'Add more code examples to illustrate usage'
      });
    }

    return issues;
  }

  private parseSectionsWithContent(content: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = [];
    const lines = content.split('\n');
    let currentSection: {title: string, content: string} | null = null;

    for (const line of lines) {
      const headerMatch = line.match(/^#+\s+(.+)$/);
      if (headerMatch && headerMatch[1]) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: headerMatch[1].trim(),
          content: ''
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private async getLastModified(filePath: string): Promise<Date | null> {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime;
    } catch {
      return null;
    }
  }
}