/**
 * Unit tests for ERD generator
 */

import { ERDGenerator } from '../erd-generator';
import { EntityInfo, RelationshipInfo } from '../../../interfaces/module-structure.interface';

describe('ERDGenerator', () => {
  let generator: ERDGenerator;
  let mockEntities: EntityInfo[];

  beforeEach(() => {
    generator = new ERDGenerator();
    mockEntities = createMockEntities();
  });

  describe('generateERD', () => {
    it('should generate ERD with all required sections', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('# Entity Relationship Diagram');
      expect(erd).toContain('## Overview');
      expect(erd).toContain('## Entity Relationship Diagram');
      expect(erd).toContain('## Entity Descriptions');
      expect(erd).toContain('## Relationship Details');
      expect(erd).toContain('## Database Constraints');
      expect(erd).toContain('## Indexes');
    });

    it('should include correct entity count in overview', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('consists of 3 main entities');
    });

    it('should generate proper Mermaid ERD syntax', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('```mermaid');
      expect(erd).toContain('erDiagram');
      expect(erd).toContain('USER {');
      expect(erd).toContain('ROLE {');
      expect(erd).toContain('PERMISSION {');
      expect(erd).toContain('```');
    });

    it('should include entity properties with correct types', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('uuid id NOT NULL');
      expect(erd).toContain('varchar email NOT NULL');
      expect(erd).toContain('boolean isActive NOT NULL');
      expect(erd).toContain('timestamp createdAt NOT NULL');
    });

    it('should generate relationship symbols correctly', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('USER }o--||');  // many-to-one relationship
      expect(erd).toContain('ROLE ||--o{');  // one-to-many relationship
    });

    it('should include entity descriptions table', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('### User');
      expect(erd).toContain('**Purpose**: Core entity representing user data');
      expect(erd).toContain('| Property | Type | Nullable | Description |');
      expect(erd).toContain('| id | uuid | No | Unique identifier |');
      expect(erd).toContain('| email | string | No | User email address |');
    });

    it('should include relationship details table', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('| Source Entity | Target Entity | Relationship Type | Property | Description |');
      expect(erd).toContain('| User | Role | many-to-one | roleId |');
    });

    it('should generate database constraints section', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('### Primary Keys');
      expect(erd).toContain('- **User**: `id` (uuid)');
      expect(erd).toContain('### Foreign Keys');
      expect(erd).toContain('- **User.roleId** → **Role.id**');
      expect(erd).toContain('### Unique Constraints');
      expect(erd).toContain('- **User**: `email`');
      expect(erd).toContain('### Not Null Constraints');
    });

    it('should generate recommended indexes', async () => {
      // Act
      const erd = await generator.generateERD(mockEntities);

      // Assert
      expect(erd).toContain('### User');
      expect(erd).toContain('- **Primary Key**: `user_pkey` on `id`');
      expect(erd).toContain('- **Foreign Key**: `idx_user_roleId` on `roleId`');
      expect(erd).toContain('- **Unique**: `idx_user_email_unique` on `email`');
      expect(erd).toContain('- **Query**: `idx_user_createdAt` on `createdAt`');
    });

    it('should handle entities with no relationships', async () => {
      // Arrange
      const entitiesWithNoRelationships: EntityInfo[] = [
        {
          name: 'Setting.entity.ts',
          path: '/entities/Setting.entity.ts',
          size: 300,
          exists: true,
          lastModified: new Date(),
          className: 'SettingEntity',
          properties: [
            { name: 'id', type: 'uuid', isOptional: false, isArray: false, decorators: [] },
            { name: 'key', type: 'string', isOptional: false, isArray: false, decorators: [] },
            { name: 'value', type: 'string', isOptional: false, isArray: false, decorators: [] }
          ],
          relationships: []
        }
      ];

      // Act
      const erd = await generator.generateERD(entitiesWithNoRelationships);

      // Assert
      expect(erd).toContain('SETTING {');
      expect(erd).toContain('No relationships defined between entities');
    });

    it('should handle different relationship types', async () => {
      // Arrange
      const entitiesWithVariousRelationships: EntityInfo[] = [
        {
          name: 'User.entity.ts',
          path: '/entities/User.entity.ts',
          size: 500,
          exists: true,
          lastModified: new Date(),
          className: 'UserEntity',
          properties: [
            { name: 'id', type: 'uuid', isOptional: false, isArray: false, decorators: [] }
          ],
          relationships: [
            { type: 'oneToOne', targetEntity: 'Profile', propertyName: 'profile', isOptional: false },
            { type: 'oneToMany', targetEntity: 'Post', propertyName: 'posts', isOptional: false },
            { type: 'manyToOne', targetEntity: 'Organization', propertyName: 'organization', isOptional: false },
            { type: 'manyToMany', targetEntity: 'Group', propertyName: 'groups', isOptional: false }
          ]
        }
      ];

      // Act
      const erd = await generator.generateERD(entitiesWithVariousRelationships);

      // Assert
      expect(erd).toContain('USER ||--|| PROFILE');  // one-to-one
      expect(erd).toContain('USER ||--o{ POST');     // one-to-many
      expect(erd).toContain('USER }o--|| ORGANIZATION'); // many-to-one
      expect(erd).toContain('USER }o--o{ GROUP');    // many-to-many
    });

    it('should map TypeScript types to database types correctly', async () => {
      // Arrange
      const entityWithVariousTypes: EntityInfo[] = [
        {
          name: 'TestEntity.entity.ts',
          path: '/entities/TestEntity.entity.ts',
          size: 400,
          exists: true,
          lastModified: new Date(),
          className: 'TestEntity',
          properties: [
            { name: 'stringField', type: 'string', isOptional: false, isArray: false, decorators: [] },
            { name: 'numberField', type: 'number', isOptional: false, isArray: false, decorators: [] },
            { name: 'booleanField', type: 'boolean', isOptional: false, isArray: false, decorators: [] },
            { name: 'dateField', type: 'Date', isOptional: false, isArray: false, decorators: [] },
            { name: 'uuidField', type: 'uuid', isOptional: false, isArray: false, decorators: [] },
            { name: 'textField', type: 'text', isOptional: false, isArray: false, decorators: [] },
            { name: 'jsonField', type: 'json', isOptional: false, isArray: false, decorators: [] }
          ],
          relationships: []
        }
      ];

      // Act
      const erd = await generator.generateERD(entityWithVariousTypes);

      // Assert
      expect(erd).toContain('varchar stringField NOT NULL');
      expect(erd).toContain('int numberField NOT NULL');
      expect(erd).toContain('boolean booleanField NOT NULL');
      expect(erd).toContain('timestamp dateField NOT NULL');
      expect(erd).toContain('uuid uuidField NOT NULL');
      expect(erd).toContain('text textField NOT NULL');
      expect(erd).toContain('json jsonField NOT NULL');
    });

    it('should handle nullable properties correctly', async () => {
      // Arrange
      const entityWithNullableProperties: EntityInfo[] = [
        {
          name: 'NullableEntity.entity.ts',
          path: '/entities/NullableEntity.entity.ts',
          size: 300,
          exists: true,
          lastModified: new Date(),
          className: 'NullableEntity',
          properties: [
            { name: 'requiredField', type: 'string', isOptional: false, isArray: false, decorators: [] },
            { name: 'optionalField', type: 'string', isOptional: true, isArray: false, decorators: [] }
          ],
          relationships: []
        }
      ];

      // Act
      const erd = await generator.generateERD(entityWithNullableProperties);

      // Assert
      expect(erd).toContain('varchar requiredField NOT NULL');
      expect(erd).toContain('varchar optionalField');
      expect(erd).not.toContain('varchar optionalField NOT NULL');
    });
  });

  describe('edge cases', () => {
    it('should handle empty entities array', async () => {
      // Act
      const erd = await generator.generateERD([]);

      // Assert
      expect(erd).toContain('# Entity Relationship Diagram');
      expect(erd).toContain('consists of 0 main entities');
      expect(erd).toContain('```mermaid');
      expect(erd).toContain('erDiagram');
    });

    it('should handle entities with no properties', async () => {
      // Arrange
      const entitiesWithNoProperties: EntityInfo[] = [
        {
          name: 'EmptyEntity.entity.ts',
          path: '/entities/EmptyEntity.entity.ts',
          size: 100,
          exists: true,
          lastModified: new Date(),
          className: 'EmptyEntity',
          properties: [],
          relationships: []
        }
      ];

      // Act
      const erd = await generator.generateERD(entitiesWithNoProperties);

      // Assert
      expect(erd).toContain('EMPTYENTITY {');
      expect(erd).toContain('### EmptyEntity');
    });

    it('should handle complex entity names with special characters', async () => {
      // Arrange
      const entitiesWithComplexNames: EntityInfo[] = [
        {
          name: 'User-Profile_V2.entity.ts',
          path: '/entities/User-Profile_V2.entity.ts',
          size: 300,
          exists: true,
          lastModified: new Date(),
          className: 'UserProfileV2Entity',
          properties: [
            { name: 'id', type: 'uuid', isOptional: false, isArray: false, decorators: [] }
          ],
          relationships: []
        }
      ];

      // Act
      const erd = await generator.generateERD(entitiesWithComplexNames);

      // Assert
      expect(erd).toContain('USER-PROFILE_V2 {');
      expect(erd).toContain('### User-Profile_V2');
    });
  });

  function createMockEntities(): EntityInfo[] {
    return [
      {
        name: 'User.entity.ts',
        path: '/infrastructure/persistence/entities/User.entity.ts',
        size: 800,
        exists: true,
        lastModified: new Date(),
        className: 'UserEntity',
        properties: [
          { name: 'id', type: 'uuid', isOptional: false, isArray: false, decorators: [] },
          { name: 'email', type: 'string', isOptional: false, isArray: false, decorators: [] },
          { name: 'isActive', type: 'boolean', isOptional: false, isArray: false, decorators: [] },
          { name: 'createdAt', type: 'Date', isOptional: false, isArray: false, decorators: [] },
          { name: 'updatedAt', type: 'Date', isOptional: true, isArray: false, decorators: [] },
          { name: 'roleId', type: 'uuid', isOptional: false, isArray: false, decorators: [] }
        ],
        relationships: [
          { type: 'manyToOne', targetEntity: 'Role', propertyName: 'roleId', isOptional: false }
        ]
      },
      {
        name: 'Role.entity.ts',
        path: '/infrastructure/persistence/entities/Role.entity.ts',
        size: 600,
        exists: true,
        lastModified: new Date(),
        className: 'RoleEntity',
        properties: [
          { name: 'id', type: 'uuid', isOptional: false, isArray: false, decorators: [] },
          { name: 'name', type: 'string', isOptional: false, isArray: false, decorators: [] },
          { name: 'description', type: 'text', isOptional: true, isArray: false, decorators: [] },
          { name: 'tier', type: 'number', isOptional: false, isArray: false, decorators: [] }
        ],
        relationships: [
          { type: 'oneToMany', targetEntity: 'User', propertyName: 'users', isOptional: false },
          { type: 'manyToMany', targetEntity: 'Permission', propertyName: 'permissions', isOptional: false }
        ]
      },
      {
        name: 'Permission.entity.ts',
        path: '/infrastructure/persistence/entities/Permission.entity.ts',
        size: 400,
        exists: true,
        lastModified: new Date(),
        className: 'PermissionEntity',
        properties: [
          { name: 'id', type: 'uuid', isOptional: false, isArray: false, decorators: [] },
          { name: 'name', type: 'string', isOptional: false, isArray: false, decorators: [] },
          { name: 'resource', type: 'string', isOptional: false, isArray: false, decorators: [] },
          { name: 'action', type: 'string', isOptional: false, isArray: false, decorators: [] }
        ],
        relationships: [
          { type: 'manyToMany', targetEntity: 'Role', propertyName: 'roles', isOptional: false }
        ]
      }
    ];
  }
});