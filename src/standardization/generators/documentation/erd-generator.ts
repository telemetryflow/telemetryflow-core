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
      erd += `    ${entity.name.toUpperCase()} {\n`;
      
      for (const property of entity.properties) {
        const type = this.mapTypeToMermaid(property.type);
        const nullable = property.isOptional ? '' : ' NOT NULL';
        erd += `        ${type} ${property.name}${nullable}\n`;
      }
      
      erd += '    }\n\n';
    }

    // Generate relationships
    for (const entity of entities) {
      for (const relationship of entity.relationships) {
        const relationshipSymbol = this.getRelationshipSymbol(relationship.type);
        erd += `    ${entity.name.toUpperCase()} ${relationshipSymbol} ${relationship.targetEntity.toUpperCase()} : "${relationship.propertyName}"\n`;
      }
    }

    return erd;
  }

  private generateEntityDescriptions(entities: EntityInfo[]): string {
    let descriptions = '';

    for (const entity of entities) {
      descriptions += `### ${entity.name}\n\n`;
      descriptions += `**Purpose**: Core entity representing ${entity.name.toLowerCase()} data\n\n`;
      descriptions += `**Properties**:\n\n`;
      descriptions += '| Property | Type | Nullable | Description |\n';
      descriptions += '|----------|------|----------|-------------|\n';
      
      for (const property of entity.properties) {
        const nullable = property.isOptional ? 'Yes' : 'No';
        descriptions += `| ${property.name} | ${property.type} | ${nullable} | ${property.name} property |\n`;
      }
      
      descriptions += '\n';
      
      if (entity.relationships.length > 0) {
        descriptions += `**Relationships**:\n\n`;
        for (const relationship of entity.relationships) {
          descriptions += `- **${relationship.propertyName}**: ${relationship.type} relationship with ${relationship.targetEntity}\n`;
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
      details += `| ${source} | ${relationship.targetEntity} | ${relationship.type} | ${relationship.propertyName} | ${this.getRelationshipDescription(relationship)} |\n`;
    }

    details += '\n';

    return details;
  }

  private generateConstraints(entities: EntityInfo[]): string {
    let constraints = '';

    constraints += '### Primary Keys\n\n';
    for (const entity of entities) {
      const pkProperty = entity.properties.find(p => p.name === 'id' || p.name.endsWith('Id'));
      if (pkProperty) {
        constraints += `- **${entity.name}**: \`${pkProperty.name}\` (${pkProperty.type})\n`;
      }
    }

    constraints += '\n### Foreign Keys\n\n';
    for (const entity of entities) {
      for (const relationship of entity.relationships) {
        if (relationship.type === 'manyToOne' || relationship.type === 'oneToOne') {
          constraints += `- **${entity.name}.${relationship.propertyName}** → **${relationship.targetEntity}.id**\n`;
        }
      }
    }

    constraints += '\n### Unique Constraints\n\n';
    for (const entity of entities) {
      const uniqueProperties = entity.properties.filter(p => 
        p.name === 'email' || p.name === 'slug' || p.name.includes('unique')
      );
      
      if (uniqueProperties.length > 0) {
        constraints += `- **${entity.name}**: `;
        constraints += uniqueProperties.map(p => `\`${p.name}\``).join(', ');
        constraints += '\n';
      }
    }

    constraints += '\n### Not Null Constraints\n\n';
    for (const entity of entities) {
      const requiredProperties = entity.properties.filter(p => !p.isOptional);
      
      if (requiredProperties.length > 0) {
        constraints += `- **${entity.name}**: `;
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
      indexes += `### ${entity.name}\n\n`;
      
      // Primary key index (automatic)
      indexes += `- **Primary Key**: \`${entity.name.toLowerCase()}_pkey\` on \`id\`\n`;
      
      // Foreign key indexes
      for (const relationship of entity.relationships) {
        if (relationship.type === 'manyToOne' || relationship.type === 'oneToOne') {
          indexes += `- **Foreign Key**: \`idx_${entity.name.toLowerCase()}_${relationship.propertyName}\` on \`${relationship.propertyName}\`\n`;
        }
      }
      
      // Unique indexes
      const uniqueProperties = entity.properties.filter(p => 
        p.name === 'email' || p.name === 'slug' || p.name.includes('unique')
      );
      
      for (const property of uniqueProperties) {
        indexes += `- **Unique**: \`idx_${entity.name.toLowerCase()}_${property.name}_unique\` on \`${property.name}\`\n`;
      }
      
      // Common query indexes
      const commonQueryProperties = entity.properties.filter(p => 
        p.name === 'createdAt' || p.name === 'updatedAt' || p.name === 'isActive' || p.name === 'status'
      );
      
      for (const property of commonQueryProperties) {
        indexes += `- **Query**: \`idx_${entity.name.toLowerCase()}_${property.name}\` on \`${property.name}\`\n`;
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
}