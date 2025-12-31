# TelemetryFlow Core - Module Standardization System

A comprehensive quality gates and automation system that ensures TelemetryFlow Core modules meet all standardization requirements defined in the Kiro steering guidelines.

## Overview

The Module Standardization System provides automated validation, documentation generation, test coverage enforcement, and continuous improvement processes for all TelemetryFlow Core modules.

## Features

- **Quality Gate Validation**: Automated checks for documentation, test coverage, file structure, database patterns, API standards, and build quality
- **Documentation Generation**: Automated README, API docs, ERD, and DFD generation
- **Test Coverage Analysis**: Layer-specific coverage validation with detailed reporting
- **File Structure Validation**: DDD compliance checking and automated fixes
- **CLI Tools**: Command-line interface for all standardization operations
- **Continuous Improvement**: Metrics tracking and improvement recommendations

## Architecture

The system follows a layered architecture with clear separation of concerns:

```
src/standardization/
├── interfaces/          # Core interfaces and contracts
├── types/              # Enums, constants, and error types
├── validators/         # Quality gate validators (to be implemented)
├── generators/         # Documentation and report generators (to be implemented)
├── cli/               # Command-line interface tools (to be implemented)
└── utils/             # Utility functions and helpers (to be implemented)
```

## Quality Gates

### 1. Documentation Gate
- README.md completeness (500+ lines)
- API documentation coverage
- Diagram generation (ERD, DFD)
- Technical documentation quality

### 2. Test Coverage Gate
- Domain layer: ≥95% coverage
- Application layer: ≥90% coverage
- Infrastructure layer: ≥85% coverage
- Presentation layer: ≥85% coverage
- Overall: ≥90% coverage

### 3. File Structure Gate
- DDD layer compliance
- Naming convention adherence
- Barrel export completeness
- Directory organization

### 4. Database Patterns Gate
- Migration naming and structure
- Seed file compliance
- Environment variable usage
- Foreign key constraints

### 5. API Standards Gate
- Swagger documentation
- Validation decorators
- Permission guards
- Error handling

### 6. Build Quality Gate
- Build success validation
- Lint compliance
- Test execution
- Circular dependency detection

## Usage

### CLI Commands (Planned)

```bash
# Validate a module
pnpm standardization validate iam

# Generate documentation
pnpm standardization generate-docs iam

# Check test coverage
pnpm standardization check-coverage iam

# Fix file structure issues
pnpm standardization fix-structure iam

# Run all quality gates
pnpm standardization run-quality-gates iam

# Generate comprehensive report
pnpm standardization generate-report iam
```

### Programmatic Usage (Planned)

```typescript
import { StandardizationCLI, QualityGateOrchestrator } from '@telemetryflow/standardization';

const cli = new StandardizationCLI();
const orchestrator = new QualityGateOrchestrator();

// Validate module
const result = await cli.validateModule('iam');

// Run quality gates
const gateResults = await orchestrator.runAllGates('src/modules/iam');

// Generate documentation
await cli.generateDocs('iam', { includeDiagrams: true });
```

## Configuration

The system uses a configuration file for customization:

```json
{
  "version": "1.0.0",
  "modules": [
    {
      "name": "iam",
      "path": "src/modules/iam",
      "enabled": true
    }
  ],
  "qualityGates": [
    {
      "name": "documentation",
      "enabled": true,
      "weight": 20,
      "thresholds": {
        "minReadmeLength": 500,
        "minSectionCount": 8
      }
    }
  ],
  "thresholds": {
    "coverage": {
      "overall": 90,
      "domain": 95,
      "application": 90,
      "infrastructure": 85,
      "presentation": 85
    }
  }
}
```

## Development Status

This is the initial infrastructure setup. The following components are planned for implementation:

- [ ] Validators for each quality gate
- [ ] Documentation generators
- [ ] Test coverage analyzers
- [ ] File structure validators and fixers
- [ ] CLI tools and commands
- [ ] Report generators
- [ ] Configuration management
- [ ] Continuous improvement tracking

## Integration with TelemetryFlow Core

The standardization system is designed to integrate seamlessly with the existing TelemetryFlow Core development workflow:

1. **Pre-commit Hooks**: Validate changes before commit
2. **CI/CD Pipeline**: Run quality gates in continuous integration
3. **Development Tools**: IDE integration for real-time feedback
4. **Reporting**: Generate standardization reports for team review

## Contributing

When contributing to the standardization system:

1. Follow the established interfaces and patterns
2. Add comprehensive tests for new validators
3. Update documentation for new features
4. Ensure all quality gates pass for the standardization system itself

## License

MIT License - see LICENSE file for details.