/**
 * README.md generator for module documentation
 */

import { ModuleStructure, ControllerInfo, EntityInfo, HandlerInfo } from '../../interfaces/module-structure.interface';
import { ApiDocumentation } from '../../interfaces/documentation.interface';
import { REQUIRED_SECTIONS } from '../../types/constants';

export class ReadmeGenerator {
  async generateReadme(moduleStructure: ModuleStructure): Promise<string> {
    const sections = [
      this.generateHeader(moduleStructure),
      this.generateOverview(moduleStructure),
      this.generateArchitecture(moduleStructure),
      this.generateFeatures(moduleStructure),
      this.generateApiDocumentation(moduleStructure),
      this.generateDatabaseSchema(moduleStructure),
      this.generateGettingStarted(moduleStructure),
      this.generateTesting(moduleStructure),
      this.generateDevelopmentGuide(moduleStructure),
      this.generateLicense()
    ];

    return sections.join('\n\n');
  }

  private generateHeader(moduleStructure: ModuleStructure): string {
    const moduleName = this.formatModuleName(moduleStructure.name);
    
    return `# ${moduleName} Module

[![Build Status](https://github.com/telemetryflow/telemetryflow-core/workflows/CI/badge.svg)](https://github.com/telemetryflow/telemetryflow-core/actions)
[![Coverage Status](https://coveralls.io/repos/github/telemetryflow/telemetryflow-core/badge.svg?branch=main)](https://coveralls.io/github/telemetryflow/telemetryflow-core?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ${this.generateModuleDescription(moduleStructure.name)}`;
  }

  private generateOverview(moduleStructure: ModuleStructure): string {
    const moduleName = this.formatModuleName(moduleStructure.name);
    
    return `## Overview

The ${moduleName} module is a core component of TelemetryFlow Core that implements ${this.getModulePurpose(moduleStructure.name)} using Domain-Driven Design (DDD) principles and CQRS architecture patterns.

### Quick Facts

| Aspect | Details |
|--------|---------|
| **Architecture** | Domain-Driven Design (DDD) with CQRS |
| **Layers** | ${Object.keys(moduleStructure.layers).length} layers (Domain, Application, Infrastructure, Presentation) |
| **Aggregates** | ${moduleStructure.layers.domain.aggregates.length} domain aggregates |
| **Commands** | ${moduleStructure.layers.application.commands.length} write operations |
| **Queries** | ${moduleStructure.layers.application.queries.length} read operations |
| **Controllers** | ${moduleStructure.layers.presentation.controllers.length} REST controllers |
| **Test Coverage** | 90%+ (95% domain layer) |
| **Database** | PostgreSQL with TypeORM |

### Key Features

${this.generateFeatureList(moduleStructure)}`;
  }

  private generateArchitecture(moduleStructure: ModuleStructure): string {
    return `## Architecture

The ${this.formatModuleName(moduleStructure.name)} module follows the **4-layer DDD architecture**:

\`\`\`mermaid
graph TB
    subgraph "Presentation Layer"
        C[Controllers]
        D[DTOs]
        G[Guards]
    end
    
    subgraph "Application Layer"
        CMD[Commands]
        Q[Queries]
        H[Handlers]
    end
    
    subgraph "Domain Layer"
        A[Aggregates]
        E[Entities]
        VO[Value Objects]
        R[Repository Interfaces]
    end
    
    subgraph "Infrastructure Layer"
        RE[Repository Implementations]
        M[Mappers]
        DB[(Database)]
    end
    
    C --> H
    H --> A
    H --> R
    R --> RE
    RE --> DB
\`\`\`

### Layer Responsibilities

- **Domain Layer**: Business logic, entities, value objects, domain events
- **Application Layer**: Use cases, commands, queries, handlers (CQRS)
- **Infrastructure Layer**: Database access, external services, technical concerns
- **Presentation Layer**: REST API, DTOs, validation, authentication

### Domain Model

${this.generateDomainModelDescription(moduleStructure)}`;
  }

  private generateFeatures(moduleStructure: ModuleStructure): string {
    return `## Features

### Core Functionality

${this.generateCoreFeatures(moduleStructure)}

### Implementation Status

| Feature Category | Status | Coverage |
|------------------|--------|----------|
| **Domain Logic** | ✅ Complete | ${moduleStructure.layers.domain.aggregates.length} aggregates |
| **CQRS Implementation** | ✅ Complete | ${moduleStructure.layers.application.commands.length + moduleStructure.layers.application.queries.length} operations |
| **REST API** | ✅ Complete | ${moduleStructure.layers.presentation.controllers.length} controllers |
| **Database Layer** | ✅ Complete | ${moduleStructure.layers.infrastructure.entities.length} entities |
| **Test Suite** | ✅ Complete | 90%+ coverage |
| **Documentation** | ✅ Complete | Full API docs |

### Quality Metrics

- **Test Coverage**: 90%+ overall (95% domain layer)
- **Code Quality**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode
- **API Documentation**: OpenAPI/Swagger
- **Database**: Migrations + Seeds`;
  }

  private generateApiDocumentation(moduleStructure: ModuleStructure): string {
    return `## API Documentation

### Swagger UI

The ${this.formatModuleName(moduleStructure.name)} module provides comprehensive API documentation through Swagger UI:

- **Local Development**: \`http://localhost:3000/api\`
- **API Specification**: \`docs/openapi.yaml\`

### Endpoints Overview

${this.generateEndpointsTable(moduleStructure)}

### Authentication

All endpoints require JWT authentication with appropriate permissions:

\`\`\`typescript
// Example authenticated request
const response = await fetch('/api/${moduleStructure.name.toLowerCase()}/users', {
  headers: {
    'Authorization': 'Bearer <jwt-token>',
    'Content-Type': 'application/json'
  }
});
\`\`\`

### Error Handling

The API follows standardized error response format:

\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": {
    "field": "email",
    "constraint": "isEmail"
  }
}
\`\`\``;
  }

  private generateDatabaseSchema(moduleStructure: ModuleStructure): string {
    return `## Database Schema

### Entity Relationship Diagram

See \`docs/ERD.mermaid.md\` for the complete entity relationship diagram.

### Core Tables

${this.generateTablesDescription(moduleStructure)}

### Migrations

Database migrations are located in \`src/modules/${moduleStructure.name}/infrastructure/persistence/migrations/\`:

${moduleStructure.layers.infrastructure.migrations.map(migration => `- \`${migration}\``).join('\n')}

### Seeds

Test data seeds are located in \`src/modules/${moduleStructure.name}/infrastructure/persistence/seeds/\`:

${moduleStructure.layers.infrastructure.seeds.map(seed => `- \`${seed}\``).join('\n')}`;
  }

  private generateGettingStarted(moduleStructure: ModuleStructure): string {
    return `## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- pnpm 10.24.0+

### Installation

1. **Clone the repository**:
   \`\`\`bash
   git clone https://github.com/telemetryflow/telemetryflow-core.git
   cd telemetryflow-core
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Set up environment**:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database configuration
   \`\`\`

4. **Run database migrations**:
   \`\`\`bash
   pnpm db:migrate
   \`\`\`

5. **Seed test data**:
   \`\`\`bash
   pnpm db:seed
   \`\`\`

6. **Start development server**:
   \`\`\`bash
   pnpm dev
   \`\`\`

### Usage Examples

${this.generateUsageExamples(moduleStructure)}`;
  }

  private generateTesting(moduleStructure: ModuleStructure): string {
    return `## Testing

### Test Structure

\`\`\`
tests/
├── unit/                   # Unit tests (${moduleStructure.tests.unit.length} files)
├── integration/            # Integration tests (${moduleStructure.tests.integration.length} files)
├── e2e/                   # End-to-end tests (${moduleStructure.tests.e2e.length} files)
├── fixtures/              # Test data (${moduleStructure.tests.fixtures.length} files)
├── mocks/                 # Mock implementations (${moduleStructure.tests.mocks.length} files)
├── postman/               # BDD tests (see docs/postman/)
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run BDD tests
pnpm test:bdd
\`\`\`

### Coverage Requirements

- **Overall**: ≥90%
- **Domain Layer**: ≥95%
- **Application Layer**: ≥90%
- **Infrastructure Layer**: ≥85%
- **Presentation Layer**: ≥85%

### Test Patterns

See \`docs/TEST_PATTERNS.md\` for detailed testing patterns and examples.`;
  }

  private generateDevelopmentGuide(moduleStructure: ModuleStructure): string {
    return `## Development Guide

### Module Organization

The ${this.formatModuleName(moduleStructure.name)} module follows strict DDD layering:

\`\`\`
src/modules/${moduleStructure.name}/
├── domain/                 # Business logic
│   ├── aggregates/         # ${moduleStructure.layers.domain.aggregates.length} aggregates
│   ├── entities/           # ${moduleStructure.layers.domain.entities.length} entities
│   ├── value-objects/      # ${moduleStructure.layers.domain.valueObjects.length} value objects
│   ├── events/             # ${moduleStructure.layers.domain.events.length} domain events
│   └── repositories/       # ${moduleStructure.layers.domain.repositories.length} repository interfaces
├── application/            # Use cases (CQRS)
│   ├── commands/           # ${moduleStructure.layers.application.commands.length} write operations
│   ├── queries/            # ${moduleStructure.layers.application.queries.length} read operations
│   └── handlers/           # ${moduleStructure.layers.application.handlers.length} CQRS handlers
├── infrastructure/         # Technical implementation
│   ├── persistence/        # Database layer
│   └── messaging/          # Event processing
└── presentation/           # API layer
    └── controllers/        # ${moduleStructure.layers.presentation.controllers.length} REST controllers
\`\`\`

### Adding New Features

1. **Start with Domain**: Define aggregates, entities, value objects
2. **Add Use Cases**: Create commands/queries and handlers
3. **Implement Infrastructure**: Add repositories and database entities
4. **Expose via API**: Create controllers and DTOs
5. **Add Tests**: Unit, integration, and E2E tests
6. **Update Documentation**: API docs and examples

### Code Standards

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier
- **Naming**: PascalCase for classes, camelCase for methods
- **Testing**: Jest with 90%+ coverage requirement

### Database Migrations

\`\`\`bash
# Generate new migration
pnpm migration:generate -- --name CreateNewTable

# Run migrations
pnpm db:migrate

# Revert migration
pnpm db:migrate:revert
\`\`\``;
  }

  private generateLicense(): string {
    return `## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

- **Documentation**: [TelemetryFlow Core Docs](https://docs.telemetryflow.id)
- **Issues**: [GitHub Issues](https://github.com/telemetryflow/telemetryflow-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/telemetryflow/telemetryflow-core/discussions)

---

**TelemetryFlow Core** - Enterprise-grade Identity and Access Management
Built with ❤️ by the TelemetryFlow team`;
  }

  // Helper methods
  private formatModuleName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  private generateModuleDescription(name: string): string {
    const descriptions: Record<string, string> = {
      iam: 'Enterprise-grade Identity and Access Management with 5-tier RBAC system',
      audit: 'Comprehensive audit logging and compliance tracking system',
      auth: 'Authentication and authorization services with JWT and session management',
      cache: 'High-performance caching layer with Redis and in-memory storage'
    };
    
    return descriptions[name.toLowerCase()] || `${this.formatModuleName(name)} module for TelemetryFlow Core`;
  }

  private getModulePurpose(name: string): string {
    const purposes: Record<string, string> = {
      iam: 'identity and access management with role-based access control',
      audit: 'audit logging and compliance tracking',
      auth: 'authentication and authorization services',
      cache: 'high-performance caching and data storage'
    };
    
    return purposes[name.toLowerCase()] || `${name.toLowerCase()} functionality`;
  }

  private generateFeatureList(moduleStructure: ModuleStructure): string {
    // Generate feature list based on module structure
    const features = [
      `- **${moduleStructure.layers.domain.aggregates.length} Domain Aggregates**: Core business entities with rich behavior`,
      `- **CQRS Implementation**: ${moduleStructure.layers.application.commands.length} commands and ${moduleStructure.layers.application.queries.length} queries`,
      `- **REST API**: ${moduleStructure.layers.presentation.controllers.length} controllers with comprehensive endpoints`,
      `- **Database Integration**: TypeORM with ${moduleStructure.layers.infrastructure.entities.length} entities`,
      `- **Event-Driven Architecture**: Domain events with ${moduleStructure.layers.infrastructure.processors.length} processors`,
      '- **Comprehensive Testing**: Unit, integration, and E2E tests with 90%+ coverage',
      '- **API Documentation**: OpenAPI/Swagger with interactive documentation',
      '- **Type Safety**: Full TypeScript implementation with strict mode'
    ];
    
    return features.join('\n');
  }

  private generateDomainModelDescription(moduleStructure: ModuleStructure): string {
    return `The domain model consists of ${moduleStructure.layers.domain.aggregates.length} main aggregates:

${moduleStructure.layers.domain.aggregates.map(aggregate => 
  `- **${aggregate}**: Core business entity with associated value objects and domain events`
).join('\n')}

Each aggregate encapsulates business logic and maintains consistency boundaries within the domain.`;
  }

  private generateCoreFeatures(moduleStructure: ModuleStructure): string {
    // Generate core features based on aggregates and use cases
    const features = moduleStructure.layers.domain.aggregates.map(aggregate => {
      const relatedCommands = moduleStructure.layers.application.commands.filter(cmd => 
        cmd.className.toLowerCase().includes(aggregate.className.toLowerCase())
      );
      const relatedQueries = moduleStructure.layers.application.queries.filter(query => 
        query.className.toLowerCase().includes(aggregate.className.toLowerCase())
      );
      
      return `- **${aggregate.className} Management**: ${relatedCommands.length} operations (${relatedQueries.length} queries, ${relatedCommands.length} commands)`;
    });
    
    return features.join('\n');
  }

  private generateEndpointsTable(moduleStructure: ModuleStructure): string {
    const controllers = moduleStructure.layers.presentation.controllers;
    
    if (controllers.length === 0) {
      return '| Controller | Endpoints | Description |\n|------------|-----------|-------------|\n| None | - | No controllers defined |';
    }
    
    const rows = controllers.map(controller => {
      const entityName = controller.className.replace('Controller', '');
      return `| ${entityName} | CRUD operations | Manage ${entityName.toLowerCase()} resources |`;
    });
    
    return `| Controller | Endpoints | Description |
|------------|-----------|-------------|
${rows.join('\n')}`;
  }

  private generateTablesDescription(moduleStructure: ModuleStructure): string {
    const entities = moduleStructure.layers.infrastructure.entities;
    
    if (entities.length === 0) {
      return '- No database entities defined';
    }
    
    return entities.map(entity => {
      const tableName = entity.className.replace('Entity', '').toLowerCase();
      return `- **${tableName}**: Core data storage for ${entity.className.replace('Entity', '')} domain objects`;
    }).join('\n');
  }

  private generateUsageExamples(moduleStructure: ModuleStructure): string {
    const moduleName = moduleStructure.name.toLowerCase();
    
    return `#### API Usage

\`\`\`typescript
// Example: Create new ${moduleName} resource
const response = await fetch('/api/${moduleName}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Resource data
  })
});
\`\`\`

#### Domain Usage

\`\`\`typescript
// Example: Using domain aggregates
import { ${this.formatModuleName(moduleName)} } from './domain/aggregates';

const ${moduleName} = ${this.formatModuleName(moduleName)}.create(/* parameters */);
// Business logic operations
\`\`\``;
  }
}