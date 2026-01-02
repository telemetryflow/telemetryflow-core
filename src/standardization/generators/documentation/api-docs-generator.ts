/**
 * API documentation generator for module documentation
 */

import { ControllerInfo } from '../../interfaces/module-structure.interface';
import { ApiDocumentation, EndpointInfo, ParameterInfo, ResponseInfo } from '../../interfaces/documentation.interface';

export class ApiDocsGenerator {
  async generateApiDocs(controllers: ControllerInfo[]): Promise<ApiDocumentation> {
    // Convert module-structure controllers to documentation format
    const documentationControllers = this.convertToDocumentationFormat(controllers);
    
    return {
      openapi: await this.generateOpenApiSpec(documentationControllers),
      endpoints: await this.generateEndpointsDoc(documentationControllers),
      authentication: await this.generateAuthenticationDoc(documentationControllers),
      examples: await this.generateExamplesDoc(documentationControllers)
    };
  }

  private convertToDocumentationFormat(controllers: ControllerInfo[]): Array<{name: string, endpoints: EndpointInfo[]}> {
    return controllers.map(controller => ({
      name: controller.className,
      endpoints: controller.endpoints.map(endpoint => ({
        method: endpoint.method,
        path: endpoint.path,
        description: `${endpoint.method} ${endpoint.path}`,
        permissions: endpoint.guards.filter(guard => guard.includes('Permission')),
        parameters: [],
        responses: [
          { status: 200, description: 'Success' },
          { status: 400, description: 'Bad Request' },
          { status: 401, description: 'Unauthorized' },
          { status: 403, description: 'Forbidden' }
        ]
      }))
    }));
  }

  private async generateOpenApiSpec(controllers: Array<{name: string, endpoints: EndpointInfo[]}>): Promise<string> {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'TelemetryFlow Core API',
        description: 'Enterprise-grade Identity and Access Management API',
        version: '1.0.0',
        contact: {
          name: 'TelemetryFlow Team',
          url: 'https://telemetryflow.id',
          email: 'support@telemetryflow.id'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        },
        {
          url: 'https://api.telemetryflow.id',
          description: 'Production server'
        }
      ],
      paths: this.generatePaths(controllers),
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: this.generateSchemas(controllers)
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    };

    return `# OpenAPI Specification

\`\`\`yaml
${this.yamlStringify(spec)}
\`\`\``;
  }

  private async generateEndpointsDoc(controllers: Array<{name: string, endpoints: EndpointInfo[]}>): Promise<string> {
    let doc = `# API Endpoints

This document provides detailed information about all available API endpoints.

## Base URL

- **Development**: \`http://localhost:3000/api\`
- **Production**: \`https://api.telemetryflow.id\`

## Authentication

All endpoints require JWT authentication unless otherwise specified.

\`\`\`http
Authorization: Bearer <jwt-token>
Content-Type: application/json
\`\`\`

`;

    for (const controller of controllers) {
      doc += this.generateControllerSection(controller);
    }

    doc += this.generateErrorHandlingSection();
    doc += this.generateRateLimitingSection();

    return doc;
  }

  private async generateAuthenticationDoc(controllers: Array<{name: string, endpoints: EndpointInfo[]}>): Promise<string> {
    const allPermissions = this.extractAllPermissions(controllers);

    return `# Authentication & Authorization

## Overview

TelemetryFlow Core uses JWT (JSON Web Tokens) for authentication and a 5-tier Role-Based Access Control (RBAC) system for authorization.

## Authentication Flow

### 1. Login

\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "roles": ["developer"]
  }
}
\`\`\`

### 2. Using the Token

Include the JWT token in the Authorization header for all API requests:

\`\`\`http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## RBAC System

### Role Hierarchy

| Role | Tier | Permissions | Description |
|------|------|-------------|-------------|
| **Super Administrator** | 1 | All (60+) | Global platform management |
| **Administrator** | 2 | 55+ (92%) | Organization-scoped management |
| **Developer** | 3 | 40+ (67%) | Create/Read/Update (no delete) |
| **Viewer** | 4 | 17 (28%) | Read-only access |
| **Demo** | 5 | 40+ (67%) | Developer access in demo environment |

### Permission Format

Permissions follow the \`resource:action\` format:

${this.generatePermissionsList(allPermissions)}

### Permission Checks

Endpoints are protected using the \`@RequirePermissions\` decorator:

\`\`\`typescript
@RequirePermissions('users:create', 'organizations:read')
async createUser() {
  // Only users with both permissions can access
}
\`\`\`

## Error Responses

### 401 Unauthorized
\`\`\`json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden",
  "requiredPermissions": ["users:create"]
}
\`\`\`

## Token Refresh

Tokens expire after 24 hours. Use the refresh endpoint to get a new token:

\`\`\`http
POST /api/auth/refresh
Authorization: Bearer <current-token>
\`\`\`

## Demo Environment

Demo users are restricted to the demo organization and have automatic data cleanup every 6 hours.
`;
  }

  private async generateExamplesDoc(controllers: Array<{name: string, endpoints: EndpointInfo[]}>): Promise<string> {
    let doc = `# API Examples

This document provides practical examples for using the TelemetryFlow Core API.

## Getting Started

### 1. Authentication

First, obtain an access token:

\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "developer.telemetryflow@telemetryflow.id",
    "password": "Developer@123456"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}
\`\`\`

### 2. Using the Token

Use the token in subsequent requests:

\`\`\`bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
\`\`\`

`;

    for (const controller of controllers) {
      doc += this.generateControllerExamples(controller);
    }

    doc += this.generateAdvancedExamples();

    return doc;
  }

  private generatePaths(controllers: Array<{name: string, endpoints: EndpointInfo[]}>): Record<string, any> {
    const paths: Record<string, any> = {};

    for (const controller of controllers) {
      for (const endpoint of controller.endpoints) {
        const pathKey = endpoint.path;
        if (!paths[pathKey]) {
          paths[pathKey] = {};
        }

        paths[pathKey][endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          tags: [controller.name.replace('Controller', '')],
          security: endpoint.permissions && endpoint.permissions.length > 0 ? [{ bearerAuth: [] }] : [],
          parameters: endpoint.parameters ? endpoint.parameters.map(param => ({
            name: param.name,
            in: param.type === 'path' ? 'path' : 'query',
            required: param.required,
            description: param.description,
            schema: { type: 'string' }
          })) : [],
          responses: endpoint.responses ? endpoint.responses.reduce((acc, response) => {
            acc[response.status] = {
              description: response.description,
              content: response.schema ? {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${response.schema}` }
                }
              } : undefined
            };
            return acc;
          }, {} as Record<string, any>) : {
            '200': {
              description: 'Success'
            }
          }
        };
      }
    }

    return paths;
  }

  private generateSchemas(controllers: Array<{name: string, endpoints: EndpointInfo[]}>): Record<string, any> {
    // Generate basic schemas - in a real implementation, this would analyze DTOs
    return {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          organizationId: { type: 'string', format: 'uuid' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'number' },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      }
    };
  }

  private generateControllerSection(controller: {name: string, endpoints: EndpointInfo[]}): string {
    const controllerName = controller.name.replace('Controller', '');
    let section = `## ${controllerName}\n\n`;

    for (const endpoint of controller.endpoints) {
      section += `### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
      section += `${endpoint.description}\n\n`;

      if (endpoint.permissions && endpoint.permissions.length > 0) {
        section += `**Required Permissions:** \`${endpoint.permissions.join('`, `')}\`\n\n`;
      }

      if (endpoint.parameters && endpoint.parameters.length > 0) {
        section += `**Parameters:**\n`;
        for (const param of endpoint.parameters) {
          section += `- \`${param.name}\` (${param.type}${param.required ? ', required' : ''}): ${param.description}\n`;
        }
        section += '\n';
      }

      section += `**Responses:**\n`;
      for (const response of endpoint.responses || []) {
        section += `- \`${response.status}\`: ${response.description}\n`;
      }
      section += '\n';
    }

    return section;
  }

  private generateControllerExamples(controller: {name: string, endpoints: EndpointInfo[]}): string {
    const controllerName = controller.name.replace('Controller', '');
    let section = `## ${controllerName} Examples\n\n`;

    for (const endpoint of controller.endpoints) {
      section += `### ${endpoint.description}\n\n`;
      section += this.generateCurlExample(endpoint);
      section += this.generateJavaScriptExample(endpoint);
      section += '\n';
    }

    return section;
  }

  private generateCurlExample(endpoint: EndpointInfo): string {
    let curl = `\`\`\`bash
curl -X ${endpoint.method.toUpperCase()} http://localhost:3000${endpoint.path}`;

    if (endpoint.permissions && endpoint.permissions.length > 0) {
      curl += ` \\
  -H "Authorization: Bearer $TOKEN"`;
    }

    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) {
      curl += ` \\
  -H "Content-Type: application/json" \\
  -d '{
    "example": "data"
  }'`;
    }

    curl += `
\`\`\`

`;

    return curl;
  }

  private generateJavaScriptExample(endpoint: EndpointInfo): string {
    let js = `\`\`\`javascript
const response = await fetch('http://localhost:3000${endpoint.path}', {
  method: '${endpoint.method.toUpperCase()}',
  headers: {`;

    if (endpoint.permissions && endpoint.permissions.length > 0) {
      js += `
    'Authorization': 'Bearer ' + token,`;
    }

    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) {
      js += `
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    example: 'data'
  })`;
    } else {
      js += `
  }`;
    }

    js += `
});

const data = await response.json();
console.log(data);
\`\`\`

`;

    return js;
  }

  private generateErrorHandlingSection(): string {
    return `## Error Handling

All endpoints return standardized error responses:

### 400 Bad Request
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
\`\`\`

### 404 Not Found
\`\`\`json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
\`\`\`

`;
  }

  private generateRateLimitingSection(): string {
    return `## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **Demo users**: 100 requests per hour

Rate limit headers are included in responses:

\`\`\`http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
\`\`\`

`;
  }

  private generateAdvancedExamples(): string {
    return `## Advanced Examples

### Bulk Operations

\`\`\`bash
# Create multiple users
curl -X POST http://localhost:3000/api/users/bulk \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "users": [
      {"email": "user1@example.com"},
      {"email": "user2@example.com"}
    ]
  }'
\`\`\`

### Filtering and Pagination

\`\`\`bash
# Get users with filtering
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&filter=active" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Error Handling in JavaScript

\`\`\`javascript
try {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const user = await response.json();
  console.log('User created:', user);
} catch (error) {
  console.error('Error creating user:', error.message);
}
\`\`\`

`;
  }

  private extractAllPermissions(controllers: Array<{name: string, endpoints: EndpointInfo[]}>): string[] {
    const permissions = new Set<string>();
    
    for (const controller of controllers) {
      for (const endpoint of controller.endpoints) {
        if (endpoint.permissions) {
          endpoint.permissions.forEach(permission => permissions.add(permission));
        }
      }
    }
    
    return Array.from(permissions).sort();
  }

  private generatePermissionsList(permissions: string[]): string {
    if (permissions.length === 0) {
      return '- No specific permissions documented';
    }

    return permissions.map(permission => `- \`${permission}\``).join('\n');
  }

  private yamlStringify(obj: any): string {
    // Simple YAML stringification - in a real implementation, use a proper YAML library
    return JSON.stringify(obj, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/\{/g, '')
      .replace(/\}/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');
  }
}