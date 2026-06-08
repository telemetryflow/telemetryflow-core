# Module Standardization Guide

This document outlines the standardization requirements for TelemetryFlow Core modules, ensuring consistency, quality, and maintainability across the codebase.

## Standardization Principles

Based on the TelemetryFlow Platform's 100-core module as the reference standard, all modules must achieve:

1. **Complete DDD/CQRS Architecture** - Proper layering and separation of concerns
2. **Comprehensive Documentation** - README, ERD, API specs, testing guides
3. **90%+ Test Coverage** - Unit, integration, e2e, and BDD tests
4. **Proper Database Patterns** - Migrations, seeds, naming conventions
5. **Industry-Standard Naming** - Consistent file and class naming
6. **Full Automation** - Test generators, coverage enforcement

## Module Quality Gates

Before marking a module as "complete", it MUST pass all these gates:

### Gate 1: Documentation (100% Complete)

#### Root README.md (500+ lines)
- [ ] Overview section with quick facts table
- [ ] Architecture diagram (DDD 4-layer structure)
- [ ] Features checklist with status indicators
- [ ] API documentation section (Swagger UI, endpoints)
- [ ] Database schema section (ERD, core tables)
- [ ] Getting started guide (prerequisites, installation)
- [ ] Testing section (structure, commands, coverage)
- [ ] Development guide (organization, features, migrations)
- [ ] License & support section

#### Documentation Structure
```
docs/
├── README.md                    # Main documentation entry
├── INDEX.md                     # Complete navigation index
├── ERD.mermaid.md               # Entity Relationship Diagram
├── DFD.mermaid.md               # Data Flow Diagrams
├── TESTING.md                   # Testing strategy & guide
├── TEST_PATTERNS.md             # Test patterns & templates
├── openapi.yaml                 # OpenAPI/Swagger specification
└── api/                         # API documentation
    ├── endpoints.md             # All endpoints with examples
    └── authentication.md        # Auth & permission requirements
```

### Gate 2: Test Coverage (≥90%)

#### Coverage Requirements by Layer
- **Domain layer**: ≥95% (business logic is critical)
- **Application layer**: ≥90% (use cases and handlers)
- **Infrastructure layer**: ≥85% (database and external integrations)
- **Presentation layer**: ≥85% (controllers and DTOs)
- **Overall module**: ≥90%

#### Test Structure
```
tests/
├── unit/                        # Unit tests
│   ├── domain/
│   │   ├── aggregates/          # Test all aggregates
│   │   ├── value-objects/       # Test all VOs
│   │   └── services/            # Test domain services
│   ├── application/
│   │   └── handlers/            # Test all handlers
│   └── README.md
├── integration/                 # Integration tests
│   ├── repositories/            # Test all repositories
│   └── README.md
├── e2e/                         # End-to-end tests
│   ├── controllers/             # Test all controllers
│   └── README.md
├── fixtures/                    # Test data
│   ├── users.fixture.ts
│   ├── roles.fixture.ts
│   └── index.ts
├── mocks/                       # Mock implementations
│   ├── repository.mock.ts
│   ├── event-bus.mock.ts
│   └── index.ts
└── postman/                     # BDD tests
    ├── {module}-api.postman_collection.json
    ├── {module}-bdd-tests.postman_collection.json
    └── README.md
```

### Gate 3: DDD Structure (100% Compliant)

#### Domain Layer Requirements
```
domain/
├── aggregates/                  # Business entities
│   ├── {Entity}.ts              # PascalCase, extends AggregateRoot
│   └── index.ts                 # Barrel exports
├── entities/                    # Domain entities
│   ├── {Entity}.ts              # PascalCase, plain classes
│   └── index.ts
├── value-objects/               # Immutable concepts
│   ├── {Name}.ts                # PascalCase, extends ValueObject
│   └── index.ts
├── events/                      # Domain events
│   ├── {Entity}{Action}.event.ts  # e.g., UserCreated.event.ts
│   └── index.ts
├── repositories/                # Repository interfaces
│   ├── I{Entity}Repository.ts   # Interface with I prefix
│   └── index.ts
├── services/                    # Domain services (if needed)
│   └── index.ts
└── index.ts                     # Module exports
```

#### Application Layer Requirements
```
application/
├── commands/                    # Write operations
│   ├── {Action}{Entity}.command.ts  # e.g., CreateUser.command.ts
│   └── index.ts
├── queries/                     # Read operations
│   ├── {Action}{Entity}.query.ts    # e.g., GetUser.query.ts
│   └── index.ts
├── handlers/                    # CQRS handlers
│   ├── {Action}{Entity}.handler.ts  # e.g., CreateUser.handler.ts
│   └── index.ts
├── dto/                         # Application DTOs
│   ├── {Entity}Response.dto.ts
│   └── index.ts
└── index.ts
```

#### Infrastructure Layer Requirements
```
infrastructure/
├── persistence/
│   ├── entities/                # TypeORM entities
│   │   ├── {Entity}.entity.ts   # PascalCase with .entity.ts suffix
│   │   └── index.ts
│   ├── repositories/            # Repository implementations
│   │   ├── {Entity}Repository.ts  # PascalCase, implements interface
│   │   └── index.ts
│   ├── mappers/                 # Domain ↔ Entity mappers
│   │   ├── {Entity}Mapper.ts
│   │   └── index.ts
│   ├── migrations/              # Database migrations
│   │   ├── {timestamp}-{Description}.ts
│   │   └── index.ts
│   ├── seeds/                   # Seed data
│   │   ├── {timestamp}-seed-{module}-{entity}.ts
│   │   └── index.ts
│   └── index.ts
├── messaging/                   # Event processors
│   └── index.ts
└── index.ts
```

#### Presentation Layer Requirements
```
presentation/
├── controllers/                 # REST controllers
│   ├── {Entity}.controller.ts   # PascalCase, singular
│   └── index.ts
├── dto/                         # Request/Response DTOs
│   ├── Create{Entity}Request.dto.ts
│   ├── {Entity}Response.dto.ts
│   └── index.ts
├── guards/                      # Route guards (if module-specific)
│   └── index.ts
├── decorators/                  # Custom decorators (if needed)
│   └── index.ts
└── index.ts
```

### Gate 4: Database Patterns (100% Compliant)

#### Migration Requirements
- [ ] Follow naming: `{timestamp}-{Description}.ts`
- [ ] Include both `up()` and `down()` methods
- [ ] Use environment variables (NO hardcoded database names)
- [ ] Include proper foreign key constraints
- [ ] Add indexes for performance
- [ ] Include soft delete columns if applicable

#### Seed Requirements
- [ ] Follow naming: `{timestamp}-seed-{module}-{entity}.ts`
- [ ] Include error handling and logging
- [ ] Implement idempotency (check before seeding)
- [ ] Use environment variables
- [ ] Include comprehensive test data

#### Entity Requirements
- [ ] Use `.entity.ts` suffix (NOT `Entity.ts`)
- [ ] Include proper TypeORM decorators
- [ ] Define relationships correctly
- [ ] Include soft delete if applicable
- [ ] Add created_at/updated_at timestamps

### Gate 5: API Standards (100% Compliant)

#### Controller Requirements
- [ ] Use Swagger decorators: `@ApiOperation`, `@ApiResponse`, `@ApiTags`
- [ ] Include validation: `@Body`, `@Param`, `@Query` with ValidationPipe
- [ ] Use permission guards: `@RequirePermissions`
- [ ] Follow REST conventions
- [ ] Include proper error handling

#### DTO Requirements
- [ ] Use class-validator decorators: `@IsString`, `@IsEmail`, etc.
- [ ] Include Swagger decorators: `@ApiProperty`
- [ ] Separate request and response DTOs
- [ ] Include transformation decorators if needed

### Gate 6: Build & Quality (0 Errors)
- [ ] `pnpm build` succeeds with 0 errors
- [ ] `pnpm lint` succeeds with 0 errors
- [ ] `pnpm test` succeeds with 0 failures
- [ ] All tests pass with ≥90% coverage

## Module Checklist Template

Use this checklist for each module:

### Module: `{module-name}`

#### Documentation ✅
- [ ] README.md (500+ lines) with all required sections
- [ ] docs/INDEX.md with complete navigation
- [ ] docs/ERD.mermaid.md with entity diagrams
- [ ] docs/DFD.mermaid.md with data flow diagrams
- [ ] docs/TESTING.md with testing strategy
- [ ] docs/openapi.yaml with complete API spec

#### Domain Layer ✅
- [ ] All aggregates follow pattern and extend AggregateRoot
- [ ] All value objects extend ValueObject base class
- [ ] All events follow naming convention and extend DomainEvent
- [ ] All repository interfaces use I prefix
- [ ] Domain services implement business logic only
- [ ] No infrastructure dependencies in domain layer

#### Application Layer ✅
- [ ] All commands follow naming pattern
- [ ] All queries follow naming pattern
- [ ] All handlers use @CommandHandler/@QueryHandler decorators
- [ ] Handlers use dependency injection properly
- [ ] DTOs include proper validation and documentation

#### Infrastructure Layer ✅
- [ ] All entities use .entity.ts suffix
- [ ] All repositories implement domain interfaces
- [ ] All mappers handle domain ↔ entity conversion
- [ ] All migrations follow naming and include up/down methods
- [ ] All seeds follow naming and include error handling
- [ ] No hardcoded database names

#### Presentation Layer ✅
- [ ] All controllers use proper Swagger decorators
- [ ] All endpoints include permission checks
- [ ] All DTOs include validation decorators
- [ ] Error handling follows global patterns
- [ ] API follows REST conventions

#### Testing ✅
- [ ] Unit tests for all aggregates (≥95% coverage)
- [ ] Unit tests for all value objects (≥95% coverage)
- [ ] Unit tests for all handlers (≥90% coverage)
- [ ] Integration tests for all repositories (≥85% coverage)
- [ ] E2E tests for all controllers (≥85% coverage)
- [ ] Postman collection with all endpoints
- [ ] BDD test scenarios for business workflows
- [ ] Test fixtures for all entities
- [ ] Mock implementations for external dependencies

#### Database ✅
- [ ] All tables follow snake_case naming
- [ ] All foreign keys properly defined
- [ ] All indexes created for performance
- [ ] Soft delete implemented where needed
- [ ] Migrations can be rolled back
- [ ] Seeds create comprehensive test data

#### Quality Gates ✅
- [ ] Build passes without errors
- [ ] Linting passes without errors
- [ ] All tests pass
- [ ] Coverage meets requirements (≥90%)
- [ ] No circular dependencies
- [ ] No hardcoded values

## Automated Validation

### Coverage Enforcement

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "src/modules/*/domain/**": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running module standardization checks..."

# Check for required files
MODULES=$(find src/modules -maxdepth 1 -type d -name "*" | grep -v "__")

for MODULE in $MODULES; do
  MODULE_NAME=$(basename $MODULE)
  
  # Check for required documentation
  if [ ! -f "$MODULE/README.md" ]; then
    echo "❌ Missing README.md in $MODULE_NAME"
    exit 1
  fi
  
  if [ ! -f "$MODULE/docs/INDEX.md" ]; then
    echo "❌ Missing docs/INDEX.md in $MODULE_NAME"
    exit 1
  fi
  
  # Check for required structure
  if [ ! -d "$MODULE/domain" ]; then
    echo "❌ Missing domain/ directory in $MODULE_NAME"
    exit 1
  fi
  
  if [ ! -d "$MODULE/application" ]; then
    echo "❌ Missing application/ directory in $MODULE_NAME"
    exit 1
  fi
  
  if [ ! -d "$MODULE/infrastructure" ]; then
    echo "❌ Missing infrastructure/ directory in $MODULE_NAME"
    exit 1
  fi
  
  if [ ! -d "$MODULE/presentation" ]; then
    echo "❌ Missing presentation/ directory in $MODULE_NAME"
    exit 1
  fi
done

# Run tests with coverage
npm test -- --coverage --passWithNoTests

# Check coverage threshold
if [ $? -ne 0 ]; then
  echo "❌ Tests failed or coverage below threshold"
  exit 1
fi

echo "✅ All module standardization checks passed"
```

### Documentation Generator

```typescript
// scripts/generate-module-docs.ts
import { generateModuleReadme } from './generators/readme-generator';
import { generateERD } from './generators/erd-generator';
import { generateOpenAPI } from './generators/openapi-generator';

async function generateModuleDocs(moduleName: string) {
  console.log(`📚 Generating documentation for ${moduleName}...`);
  
  // Generate README.md
  await generateModuleReadme(moduleName);
  
  // Generate ERD from database schema
  await generateERD(moduleName);
  
  // Generate OpenAPI spec from controllers
  await generateOpenAPI(moduleName);
  
  console.log(`✅ Documentation generated for ${moduleName}`);
}

// Usage: npm run generate:docs -- --module iam
```

## Success Criteria

A module is considered "standardized" when:

1. **All 6 quality gates pass** without exceptions
2. **Documentation is complete** and follows templates
3. **Test coverage is ≥90%** across all layers
4. **Build and lint pass** without errors
5. **Database patterns are compliant** with conventions
6. **API follows REST standards** with proper documentation

## Continuous Improvement

### Monthly Reviews
- Review module standardization status
- Update templates based on lessons learned
- Identify common issues and create automated checks
- Update documentation standards as needed

### Quarterly Assessments
- Audit all modules against latest standards
- Update tooling and generators
- Review and update quality thresholds
- Plan standardization improvements

This standardization guide ensures that all TelemetryFlow Core modules maintain the same high quality, consistency, and maintainability standards established by the reference implementation.