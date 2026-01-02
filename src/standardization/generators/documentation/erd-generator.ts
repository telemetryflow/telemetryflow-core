/**
 * Entity Relationship Diagram (ERD) generator
 */

import { EntityInfo, RelationshipInfo } from '../../interfaces/module-structure.interface';

export class ERDGenerator {
  async generateERD(entities: EntityInfo[]): Promise<string> {
    return `# Entity Relationship Diagram

This document contains the Entity Relationship Diagram (ERD) for the module's database schema.

## Overview

The database schema consists of ${entities.length} main entities with their relationships and constraints.

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
${this.generateMermaidERD(entities)}
\`\`\`

## Entity Descriptions

${this.generateEntityDescriptions(entities)}

## Relationship Details

${this.generateRelationshipDetails(entities)}

## Database Constraints

${this.generateConstraints(entities)}

## Indexes

${this.generateIndexes(entities)}
`;
  }

  private generateMermaidERD(entities: EntityInfo[]): string {
    let erd = '';

    // Generate entity definitions
    for (const entity of entities) {
      const entityName = this.formatMermaidEntityName(entity.name);
      erd += `    ${entityName} {\n`;
      
      for (const property of entity.properties) {
        const type = this.mapTypeToMermaid(property.type);
        const nullable = property.isOptional ? '' : ' NOT NULL';
        erd += `        ${type} ${property.name}${nullable}\n`;
      }
      
      erd += '    }\n\n';
    }

    // Generate relationships
    for (const entity of entities) {
      const entityName = this.formatMermaidEntityName(entity.name);
      for (const relationship of entity.relationships) {
        const relationshipSymbol = this.getRelationshipSymbol(relationship.type);
        const targetName = this.formatMermaidEntityName(relationship.targetEntity);
        erd += `    ${entityName} ${relationshipSymbol} ${targetName} : "${relationship.propertyName}"\n`;
      }
    }

    return erd;
  }

  private generateEntityDescriptions(entities: EntityInfo[]): string {
    let descriptions = '';

    for (const entity of entities) {
      const entityName = this.formatEntityName(entity.name);
      descriptions += `### ${entityName}\n\n`;
      descriptions += `**Purpose**: Core entity representing ${entityName.toLowerCase()} data\n\n`;
      descriptions += `**Properties**:\n\n`;
      descriptions += '| Property | Type | Nullable | Description |\n';
      descriptions += '|----------|------|----------|-------------|\n';
      
      for (const property of entity.properties) {
        const nullable = property.isOptional ? 'Yes' : 'No';
        const description = this.getPropertyDescription(property.name, property.type);
        descriptions += `| ${property.name} | ${property.type} | ${nullable} | ${description} |\n`;
      }
      
      descriptions += '\n';
      
      if (entity.relationships.length > 0) {
        descriptions += `**Relationships**:\n\n`;
        for (const relationship of entity.relationships) {
          const targetName = this.formatEntityName(relationship.targetEntity);
          descriptions += `- **${relationship.propertyName}**: ${relationship.type} relationship with ${targetName}\n`;
        }
        descriptions += '\n';
      }
    }

    return descriptions;
  }

  private generateRelationshipDetails(entities: EntityInfo[]): string {
    let details = '';
    const allRelationships: Array<{source: string, relationship: RelationshipInfo}> = [];

    // Collect all relationships
    for (const entity of entities) {
      for (const relationship of entity.relationships) {
        allRelationships.push({ source: entity.name, relationship });
      }
    }

    if (allRelationships.length === 0) {
      return 'No relationships defined between entities.\n\n';
    }

    details += '| Source Entity | Target Entity | Relationship Type | Property | Description |\n';
    details += '|---------------|---------------|-------------------|----------|-------------|\n';

    for (const { source, relationship } of allRelationships) {
      const sourceName = this.formatEntityName(source);
      const targetName = this.formatEntityName(relationship.targetEntity);
      const relationshipType = this.formatRelationshipType(relationship.type);
      details += `| ${sourceName} | ${targetName} | ${relationshipType} | ${relationship.propertyName} | ${this.getRelationshipDescription(relationship)} |\n`;
    }

    details += '\n';

    return details;
  }

  private generateConstraints(entities: EntityInfo[]): string {
    let constraints = '';

    constraints += '### Primary Keys\n\n';
    for (const entity of entities) {
      const entityName = this.formatEntityName(entity.name);
      const pkProperty = entity.properties.find(p => p.name === 'id' || p.name.endsWith('Id'));
      if (pkProperty) {
        constraints += `- **${entityName}**: \`${pkProperty.name}\` (${pkProperty.type})\n`;
      }
    }

    constraints += '\n### Foreign Keys\n\n';
    for (const entity of entities) {
      const entityName = this.formatEntityName(entity.name);
      for (const relationship of entity.relationships) {
        if (relationship.type === 'manyToOne' || relationship.type === 'oneToOne') {
          const targetName = this.formatEntityName(relationship.targetEntity);
          constraints += `- **${entityName}.${relationship.propertyName}** → **${targetName}.id**\n`;
        }
      }
    }

    constraints += '\n### Unique Constraints\n\n';
    for (const entity of entities) {
      const entityName = this.formatEntityName(entity.name);
      const uniqueProperties = entity.properties.filter(p => 
        p.name === 'email' || p.name === 'slug' || p.name.includes('unique')
      );
      
      if (uniqueProperties.length > 0) {
        constraints += `- **${entityName}**: `;
        constraints += uniqueProperties.map(p => `\`${p.name}\``).join(', ');
        constraints += '\n';
      }
    }

    constraints += '\n### Not Null Constraints\n\n';
    for (const entity of entities) {
      const entityName = this.formatEntityName(entity.name);
      const requiredProperties = entity.properties.filter(p => !p.isOptional);
      
      if (requiredProperties.length > 0) {
        constraints += `- **${entityName}**: `;
        constraints += requiredProperties.map(p => `\`${p.name}\``).join(', ');
        constraints += '\n';
      }
    }

    return constraints + '\n';
  }

  private generateIndexes(entities: EntityInfo[]): string {
    let indexes = '';

    indexes += 'Recommended indexes for optimal query performance:\n\n';

    for (const entity of entities) {
      const entityName = this.formatEntityName(entity.name);
      const tableName = entityName.toLowerCase();
      indexes += `### ${entityName}\n\n`;
      
      // Primary key index (automatic)
      indexes += `- **Primary Key**: \`${tableName}_pkey\` on \`id\`\n`;
      
      // Foreign key indexes
      for (const relationship of entity.relationships) {
        if (relationship.type === 'manyToOne' || relationship.type === 'oneToOne') {
          indexes += `- **Foreign Key**: \`idx_${tableName}_${relationship.propertyName}\` on \`${relationship.propertyName}\`\n`;
        }
      }
      
      // Unique indexes
      const uniqueProperties = entity.properties.filter(p => 
        p.name === 'email' || p.name === 'slug' || p.name.includes('unique')
      );
      
      for (const property of uniqueProperties) {
        indexes += `- **Unique**: \`idx_${tableName}_${property.name}_unique\` on \`${property.name}\`\n`;
      }
      
      // Common query indexes
      const commonQueryProperties = entity.properties.filter(p => 
        p.name === 'createdAt' || p.name === 'updatedAt' || p.name === 'isActive' || p.name === 'status'
      );
      
      for (const property of commonQueryProperties) {
        indexes += `- **Query**: \`idx_${tableName}_${property.name}\` on \`${property.name}\`\n`;
      }
      
      indexes += '\n';
    }

    return indexes;
  }

  private mapTypeToMermaid(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'varchar',
      'number': 'int',
      'boolean': 'boolean',
      'Date': 'timestamp',
      'uuid': 'uuid',
      'text': 'text',
      'json': 'json'
    };

    return typeMap[type] || type;
  }

  private getRelationshipSymbol(type: string): string {
    const symbolMap: Record<string, string> = {
      'oneToOne': '||--||',
      'oneToMany': '||--o{',
      'manyToOne': '}o--||',
      'manyToMany': '}o--o{'
    };

    return symbolMap[type] || '||--||';
  }

  private getRelationshipDescription(relationship: RelationshipInfo): string {
    const descriptions: Record<string, string> = {
      'oneToOne': 'Each record has exactly one related record',
      'oneToMany': 'Each record can have multiple related records',
      'manyToOne': 'Multiple records can relate to one record',
      'manyToMany': 'Records can have multiple relationships with multiple records'
    };

    return descriptions[relationship.type] || 'Relationship between entities';
  }

  private formatEntityName(name: string): string {
    // Remove .entity.ts suffix and convert to PascalCase
    return name.replace(/\.entity\.ts$/i, '');
  }

  private formatMermaidEntityName(name: string): string {
    // Remove .entity.ts suffix and convert to uppercase for Mermaid
    return name.replace(/\.entity\.ts$/i, '').toUpperCase();
  }

  private formatRelationshipType(type: string): string {
    // Convert camelCase to kebab-case
    return type.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  private getPropertyDescription(name: string, type: string): string {
    // Generate meaningful descriptions for common property names
    const descriptions: Record<string, string> = {
      'id': 'Unique identifier',
      'email': 'User email address',
      'name': 'Display name',
      'title': 'Title or heading',
      'description': 'Detailed description',
      'isActive': 'Active status flag',
      'isEnabled': 'Enabled status flag',
      'createdAt': 'Creation timestamp',
      'updatedAt': 'Last update timestamp',
      'deletedAt': 'Soft deletion timestamp',
      'userId': 'Reference to user',
      'roleId': 'Reference to role',
      'organizationId': 'Reference to organization',
      'tenantId': 'Reference to tenant'
    };

    return descriptions[name] || `${name} property`;
  }
}