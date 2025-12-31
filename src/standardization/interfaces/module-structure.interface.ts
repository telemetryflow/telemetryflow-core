/**
 * Module structure interfaces for standardization analysis
 */

export interface ModuleStructure {
  name: string;
  path: string;
  layers: ModuleLayers;
  documentation: DocumentationStructure;
  tests: TestStructure;
  configuration: ModuleConfiguration;
  metadata: ModuleMetadata;
}

export interface ModuleLayers {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
  presentation: PresentationLayer;
}

export interface DomainLayer {
  aggregates: AggregateInfo[];
  entities: EntityInfo[];
  valueObjects: ValueObjectInfo[];
  events: DomainEventInfo[];
  repositories: RepositoryInterfaceInfo[];
  services: DomainServiceInfo[];
}

export interface ApplicationLayer {
  commands: CommandInfo[];
  queries: QueryInfo[];
  handlers: HandlerInfo[];
  dtos: DTOInfo[];
}

export interface InfrastructureLayer {
  entities: EntityInfo[];
  repositories: RepositoryImplementationInfo[];
  mappers: MapperInfo[];
  migrations: MigrationInfo[];
  seeds: SeedInfo[];
  processors: ProcessorInfo[];
}

export interface PresentationLayer {
  controllers: ControllerInfo[];
  dtos: DTOInfo[];
  guards: GuardInfo[];
  decorators: DecoratorInfo[];
}

export interface DocumentationStructure {
  readme: FileInfo;
  apiDocs: FileInfo[];
  diagrams: DiagramInfo[];
  guides: FileInfo[];
}

export interface TestStructure {
  unit: TestFileInfo[];
  integration: TestFileInfo[];
  e2e: TestFileInfo[];
  fixtures: FileInfo[];
  mocks: FileInfo[];
  coverage: CoverageInfo;
}

export interface ModuleConfiguration {
  moduleFile: FileInfo;
  packageJson?: FileInfo;
  tsConfig?: FileInfo;
  dependencies: string[];
  exports: string[];
}

export interface ModuleMetadata {
  version: string;
  description: string;
  author: string;
  license: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Component information interfaces
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  exists: boolean;
  lastModified: Date;
  content?: string;
}

export interface AggregateInfo extends FileInfo {
  className: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
  events: string[];
}

export interface EntityInfo extends FileInfo {
  className: string;
  properties: PropertyInfo[];
  relationships: RelationshipInfo[];
}

export interface ValueObjectInfo extends FileInfo {
  className: string;
  valueType: string;
  validation: ValidationInfo[];
}

export interface DomainEventInfo extends FileInfo {
  className: string;
  eventType: string;
  properties: PropertyInfo[];
}

export interface RepositoryInterfaceInfo extends FileInfo {
  interfaceName: string;
  methods: MethodInfo[];
  entityType: string;
}

export interface DomainServiceInfo extends FileInfo {
  className: string;
  methods: MethodInfo[];
  dependencies: string[];
}

export interface CommandInfo extends FileInfo {
  className: string;
  properties: PropertyInfo[];
  handlerClass?: string;
}

export interface QueryInfo extends FileInfo {
  className: string;
  properties: PropertyInfo[];
  handlerClass?: string;
  returnType: string;
}

export interface HandlerInfo extends FileInfo {
  className: string;
  handlerType: 'command' | 'query';
  targetClass: string;
  dependencies: string[];
}

export interface DTOInfo extends FileInfo {
  className: string;
  type: 'request' | 'response';
  properties: PropertyInfo[];
  validations: ValidationInfo[];
}

export interface RepositoryImplementationInfo extends FileInfo {
  className: string;
  interfaceName: string;
  entityType: string;
  methods: MethodInfo[];
}

export interface MapperInfo extends FileInfo {
  className: string;
  sourceType: string;
  targetType: string;
  methods: MethodInfo[];
}

export interface MigrationInfo extends FileInfo {
  timestamp: string;
  description: string;
  hasUp: boolean;
  hasDown: boolean;
  tables: string[];
}

export interface SeedInfo extends FileInfo {
  timestamp: string;
  module: string;
  entity: string;
  isIdempotent: boolean;
}

export interface ProcessorInfo extends FileInfo {
  className: string;
  eventTypes: string[];
  methods: MethodInfo[];
}

export interface ControllerInfo extends FileInfo {
  className: string;
  basePath: string;
  endpoints: EndpointInfo[];
  guards: string[];
  decorators: string[];
}

export interface GuardInfo extends FileInfo {
  className: string;
  guardType: string;
  dependencies: string[];
}

export interface DecoratorInfo extends FileInfo {
  decoratorName: string;
  parameters: PropertyInfo[];
  usage: string[];
}

export interface TestFileInfo extends FileInfo {
  testType: 'unit' | 'integration' | 'e2e';
  targetFile: string;
  testCases: TestCaseInfo[];
  coverage?: CoverageInfo;
}

export interface DiagramInfo extends FileInfo {
  diagramType: 'erd' | 'dfd' | 'architecture' | 'sequence';
  format: 'mermaid' | 'plantuml' | 'svg' | 'png';
}

// Supporting interfaces
export interface MethodInfo {
  name: string;
  parameters: PropertyInfo[];
  returnType: string;
  isAsync: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface PropertyInfo {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  defaultValue?: any;
  decorators: string[];
}

export interface RelationshipInfo {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  targetEntity: string;
  propertyName: string;
  isOptional: boolean;
}

export interface ValidationInfo {
  rule: string;
  parameters?: Record<string, any>;
  message?: string;
}

export interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handlerMethod: string;
  requestDto?: string;
  responseDto?: string;
  guards: string[];
  decorators: string[];
}

export interface TestCaseInfo {
  name: string;
  type: 'describe' | 'it' | 'test';
  isAsync: boolean;
  hasExpectations: boolean;
}

export interface CoverageInfo {
  lines: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  statements: CoverageMetric;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}