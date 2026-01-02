/**
 * Documentation validation interfaces
 */

export interface DocumentationValidator {
  validateReadme(readmePath: string): Promise<ReadmeValidation>;
  validateApiDocs(docsPath: string): Promise<ApiDocsValidation>;
  validateDiagrams(diagramsPath: string): Promise<DiagramValidation>;
  generateDocumentation(moduleStructure: any): Promise<any>;
}

export interface ReadmeValidation {
  isValid: boolean;
  issues: ReadmeIssue[];
  metadata: {
    exists: boolean;
    lineCount: number;
    wordCount: number;
    sectionsFound: string[];
    lastModified: Date | null;
  };
}

export interface ReadmeIssue {
  id: string;
  type: 'missing_file' | 'insufficient_content' | 'missing_sections' | 'missing_examples';
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: string;
  autoFixable: boolean;
  suggestion: string;
}

export interface ApiDocsValidation {
  isValid: boolean;
  issues: ApiDocsIssue[];
  score: number;
  metadata: {
    exists: boolean;
    filesFound: string[];
    lastModified: Date | null;
  };
}

export interface ApiDocsIssue {
  id: string;
  type: 'missing_directory' | 'missing_file' | 'invalid_format' | 'missing_section' | 'insufficient_content' | 'missing_content' | 'missing_examples';
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: string;
  autoFixable: boolean;
  suggestion: string;
}

export interface DiagramValidation {
  isValid: boolean;
  issues: DiagramIssue[];
  metadata: {
    exists: boolean;
    diagramsFound: string[];
    lastModified: Date | null;
  };
}

export interface DiagramIssue {
  id: string;
  type: 'missing_directory' | 'missing_file' | 'invalid_format' | 'missing_content' | 'insufficient_content';
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: string;
  autoFixable: boolean;
  suggestion: string;
}

export interface DocumentationGenerator {
  generateReadme(moduleStructure: any): Promise<string>;
  generateApiDocs(controllers: any[]): Promise<ApiDocumentation>;
  generateERD(entities: any[]): Promise<string>;
  generateDFD(handlers: any[]): Promise<string>;
}

export interface ApiDocumentation {
  openapi: string;
  endpoints: string;
  authentication: string;
  examples: string;
}

// Additional interfaces for generators
export interface DocumentationIssue {
  id: string;
  type: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: string;
  autoFixable: boolean;
  suggestion: string;
}

export interface OpenApiValidation {
  isValid: boolean;
  issues: DocumentationIssue[];
  score: number;
}

export interface EndpointDocValidation {
  isValid: boolean;
  issues: DocumentationIssue[];
  score: number;
}

// Module structure interfaces
export interface ModuleStructure {
  name: string;
  domain: DomainStructure;
  application: ApplicationStructure;
  infrastructure: InfrastructureStructure;
  presentation: PresentationStructure;
  tests: TestStructure;
}

export interface DomainStructure {
  aggregates: AggregateInfo[];
  entities: EntityInfo[];
  valueObjects: ValueObjectInfo[];
  events: EventInfo[];
  repositories: RepositoryInfo[];
  services: ServiceInfo[];
}

export interface ApplicationStructure {
  commands: CommandInfo[];
  queries: QueryInfo[];
  handlers: HandlerInfo[];
  dto: DtoInfo[];
}

export interface InfrastructureStructure {
  entities: EntityInfo[];
  repositories: RepositoryInfo[];
  mappers: MapperInfo[];
  migrations: MigrationInfo[];
  seeds: SeedInfo[];
}

export interface PresentationStructure {
  controllers: ControllerInfo[];
  dto: DtoInfo[];
  guards: GuardInfo[];
  decorators: DecoratorInfo[];
}

export interface TestStructure {
  unit: TestFileInfo[];
  integration: TestFileInfo[];
  e2e: TestFileInfo[];
  postman: PostmanCollectionInfo[];
}

// Entity and component info interfaces
export interface AggregateInfo {
  name: string;
  path: string;
}

export interface EntityInfo {
  name: string;
  path: string;
  properties: PropertyInfo[];
  relationships: RelationshipInfo[];
}

export interface PropertyInfo {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
}

export interface RelationshipInfo {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  target: string;
  property: string;
}

export interface ValueObjectInfo {
  name: string;
  path: string;
}

export interface EventInfo {
  name: string;
  path: string;
}

export interface RepositoryInfo {
  name: string;
  path: string;
}

export interface ServiceInfo {
  name: string;
  path: string;
}

export interface CommandInfo {
  name: string;
  path: string;
}

export interface QueryInfo {
  name: string;
  path: string;
}

export interface HandlerInfo {
  name: string;
  path: string;
  className: string;
  handlerType: 'command' | 'query';
  targetClass: string;
  dependencies: string[];
  type?: 'command' | 'query'; // Legacy compatibility
  events?: string[]; // Legacy compatibility
}

export interface DtoInfo {
  name: string;
  path: string;
}

export interface MapperInfo {
  name: string;
  path: string;
}

export interface MigrationInfo {
  name: string;
  path: string;
}

export interface SeedInfo {
  name: string;
  path: string;
}

export interface ControllerInfo {
  name: string;
  path: string;
  endpoints: EndpointInfo[];
}

export interface EndpointInfo {
  method: string;
  path: string;
  handlerMethod?: string;
  description?: string;
  permissions?: string[];
  parameters?: ParameterInfo[];
  responses?: ResponseInfo[];
  requestDto?: string;
  responseDto?: string;
  guards?: string[];
  decorators?: string[];
}

export interface ParameterInfo {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ResponseInfo {
  status: number;
  description: string;
  schema?: any;
}

export interface GuardInfo {
  name: string;
  path: string;
}

export interface DecoratorInfo {
  name: string;
  path: string;
}

export interface TestFileInfo {
  name: string;
  path: string;
}

export interface PostmanCollectionInfo {
  name: string;
  path: string;
}