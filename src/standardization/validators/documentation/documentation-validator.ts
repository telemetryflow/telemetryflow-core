/**
 * Main documentation validator that orchestrates all documentation checks
 */

import { BaseValidator } from '../base-validator';
import { ValidationResult, ValidationRequirement } from '../../interfaces/validation.interface';
import { DocumentationValidator as IDocumentationValidator, ReadmeValidation, ApiDocsValidation, DiagramValidation } from '../../interfaces/documentation.interface';
import { IssueSeverity, IssueCategory } from '../../interfaces/validation.interface';
import { ReadmeValidator } from './readme-validator';
import { ApiDocsValidator } from './api-docs-validator';
import { DiagramValidator } from './diagram-validator';
import { QUALITY_THRESHOLDS, REQUIRED_SECTIONS } from '../../types/constants';

export interface DocumentationValidationTarget {
  modulePath: string;
  moduleName: string;
}

export class DocumentationValidatorImpl extends BaseValidator implements IDocumentationValidator {
  private readmeValidator: ReadmeValidator;
  private apiDocsValidator: ApiDocsValidator;
  private diagramValidator: DiagramValidator;

  constructor() {
    super();
    this.readmeValidator = new ReadmeValidator();
    this.apiDocsValidator = new ApiDocsValidator();
    this.diagramValidator = new DiagramValidator();
  }

  async validate(target: DocumentationValidationTarget): Promise<ValidationResult> {
    this.reset();

    const { modulePath, moduleName } = target;

    try {
      // Validate README.md
      const readmeValidation = await this.validateReadme(`${modulePath}/README.md`);
      this.processReadmeValidation(readmeValidation);

      // Validate API documentation
      const apiDocsValidation = await this.validateApiDocs(`${modulePath}/docs`);
      this.processApiDocsValidation(apiDocsValidation);

      // Validate diagrams
      const diagramValidation = await this.validateDiagrams(`${modulePath}/docs`);
      this.processDiagramValidation(diagramValidation);

      const isValid = this.issues.filter(issue => issue.severity === IssueSeverity.ERROR).length === 0;

      return this.createResult(isValid, {
        moduleName,
        readmeValidation,
        apiDocsValidation,
        diagramValidation,
        totalIssues: this.issues.length,
        criticalIssues: this.issues.filter(issue => issue.severity === IssueSeverity.ERROR).length
      });

    } catch (error) {
      this.addIssue(
        'doc-validation-error',
        `Documentation validation failed: ${error}`,
        IssueSeverity.ERROR,
        IssueCategory.DOCUMENTATION,
        'documentation-validation',
        modulePath
      );

      return this.createResult(false, { error: String(error) });
    }
  }

  async validateReadme(readmePath: string): Promise<ReadmeValidation> {
    return await this.readmeValidator.validateReadme(readmePath);
  }

  async validateApiDocs(docsPath: string): Promise<ApiDocsValidation> {
    return await this.apiDocsValidator.validateApiDocs(docsPath);
  }

  async validateDiagrams(diagramsPath: string): Promise<DiagramValidation> {
    return await this.diagramValidator.validateDiagrams(diagramsPath);
  }

  async generateDocumentation(moduleStructure: any): Promise<any> {
    const { DocumentationGenerator } = await import('../../generators/documentation');
    const generator = new DocumentationGenerator();
    
    // Extract data from module structure for generators
    const controllers = this.extractControllerInfo(moduleStructure);
    const entities = this.extractEntityInfo(moduleStructure);
    const handlers = this.extractHandlerInfo(moduleStructure);
    
    return await generator.generateCompleteDocumentation(
      moduleStructure,
      controllers,
      entities,
      handlers
    );
  }

  private extractControllerInfo(moduleStructure: any): any[] {
    // Extract controller information from module structure
    // This would analyze actual controller files in a real implementation
    return [];
  }

  private extractEntityInfo(moduleStructure: any): any[] {
    // Extract entity information from module structure
    // This would analyze actual entity files in a real implementation
    return [];
  }

  private extractHandlerInfo(moduleStructure: any): any[] {
    // Extract handler information from module structure
    // This would analyze actual handler files in a real implementation
    return [];
  }

  getRequirements(): ValidationRequirement[] {
    return [
      {
        id: 'readme-exists',
        name: 'README.md exists',
        description: 'Module must have a README.md file',
        category: IssueCategory.DOCUMENTATION,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'readme-length',
        name: 'README.md minimum length',
        description: `README.md must have at least ${QUALITY_THRESHOLDS.DOCUMENTATION.MIN_README_LENGTH} lines`,
        category: IssueCategory.DOCUMENTATION,
        severity: IssueSeverity.ERROR,
        autoFixable: false
      },
      {
        id: 'readme-sections',
        name: 'README.md required sections',
        description: `README.md must contain all required sections: ${REQUIRED_SECTIONS.README.join(', ')}`,
        category: IssueCategory.DOCUMENTATION,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'api-docs-exist',
        name: 'API documentation exists',
        description: 'Module must have API documentation in docs/ directory',
        category: IssueCategory.DOCUMENTATION,
        severity: IssueSeverity.ERROR,
        autoFixable: true
      },
      {
        id: 'openapi-spec',
        name: 'OpenAPI specification',
        description: 'Module must have a valid OpenAPI specification',
        category: IssueCategory.DOCUMENTATION,
        severity: IssueSeverity.ERROR,
        autoFixable: false
      },
      {
        id: 'diagrams-exist',
        name: 'Architecture diagrams exist',
        description: 'Module must have ERD and DFD diagrams',
        category: IssueCategory.DOCUMENTATION,
        severity: IssueSeverity.WARNING,
        autoFixable: true
      }
    ];
  }

  private processReadmeValidation(validation: ReadmeValidation): void {
    if (!validation.isValid) {
      validation.issues.forEach(issue => {
        this.addIssue(
          `readme-${issue.id}`,
          issue.message,
          issue.severity as IssueSeverity,
          IssueCategory.DOCUMENTATION,
          'readme-validation',
          issue.location,
          issue.autoFixable
        );
      });
    }

    // Add fixes for auto-fixable issues
    validation.issues
      .filter(issue => issue.autoFixable)
      .forEach(issue => {
        this.addFix(
          `readme-${issue.id}`,
          issue.suggestion || 'Auto-fix available',
          'update_content',
          { type: 'readme', issue: issue.type }
        );
      });
  }

  private processApiDocsValidation(validation: ApiDocsValidation): void {
    if (!validation.isValid) {
      validation.issues.forEach(issue => {
        this.addIssue(
          `api-docs-${issue.id}`,
          issue.message,
          issue.severity as IssueSeverity,
          IssueCategory.DOCUMENTATION,
          'api-docs-validation',
          issue.location,
          issue.autoFixable
        );
      });
    }
  }

  private processDiagramValidation(validation: DiagramValidation): void {
    if (!validation.isValid) {
      validation.issues.forEach(issue => {
        this.addIssue(
          `diagram-${issue.id}`,
          issue.message,
          issue.severity as IssueSeverity,
          IssueCategory.DOCUMENTATION,
          'diagram-validation',
          issue.location,
          issue.autoFixable
        );
      });
    }
  }
}