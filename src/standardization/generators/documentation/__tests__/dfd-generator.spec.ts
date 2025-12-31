/**
 * Unit tests for DFD generator
 */

import { DFDGenerator } from '../dfd-generator';
import { HandlerInfo } from '../../../interfaces/documentation.interface';

describe('DFDGenerator', () => {
  let generator: DFDGenerator;
  let mockHandlers: HandlerInfo[];

  beforeEach(() => {
    generator = new DFDGenerator();
    mockHandlers = createMockHandlers();
  });

  describe('generateDFD', () => {
    it('should generate DFD with all required sections', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('# Data Flow Diagram');
      expect(dfd).toContain('## Overview');
      expect(dfd).toContain('## Data Flow Diagram');
      expect(dfd).toContain('## Handler Details');
      expect(dfd).toContain('## Data Flow Patterns');
      expect(dfd).toContain('## Event Flow');
    });

    it('should include correct handler count in overview', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('consists of 4 handlers');
    });

    it('should generate proper Mermaid flowchart syntax', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('```mermaid');
      expect(dfd).toContain('flowchart TD');
      expect(dfd).toContain('Client[Client Application]');
      expect(dfd).toContain('Controller[REST Controller]');
      expect(dfd).toContain('CommandBus[Command Bus]');
      expect(dfd).toContain('QueryBus[Query Bus]');
      expect(dfd).toContain('Database[(Database)]');
    });

    it('should include command flow in diagram', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('%% Command Flow');
      expect(dfd).toContain('Client -->|HTTP Request| Controller');
      expect(dfd).toContain('Controller -->|Command| CommandBus');
      expect(dfd).toContain('CommandBus -->|Execute| CreateUserHandler');
      expect(dfd).toContain('CreateUserHandler -->|Write| Database');
    });

    it('should include query flow in diagram', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('%% Query Flow');
      expect(dfd).toContain('Controller -->|Query| QueryBus');
      expect(dfd).toContain('QueryBus -->|Execute| GetUserHandler');
      expect(dfd).toContain('GetUserHandler -->|Read| Database');
      expect(dfd).toContain('GetUserHandler -->|Response| Controller');
    });

    it('should include event publishing for command handlers', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('CreateUserHandler -->|Publish| EventBus');
      expect(dfd).toContain('EventBus -->|UserCreatedEvent| UserCreatedEvent');
    });

    it('should include handler dependencies', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('CreateUserHandler -->|Write| Database');
      expect(dfd).toContain('GetUserHandler -->|Read| Database');
    });

    it('should generate handler details tables', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('### Command Handlers (Write Operations)');
      expect(dfd).toContain('| Handler | Events Published | Description |');
      expect(dfd).toContain('| CreateUserHandler | UserCreatedEvent | Handles createuser command operations |');
      
      expect(dfd).toContain('### Query Handlers (Read Operations)');
      expect(dfd).toContain('| Handler | Return Type | Description |');
      expect(dfd).toContain('| GetUserHandler | DTO | Retrieves getuser data |');
    });

    it('should include CQRS pattern explanation', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('### CQRS Pattern');
      expect(dfd).toContain('Command Query Responsibility Segregation');
      expect(dfd).toContain('- **Commands**: Modify state and publish domain events');
      expect(dfd).toContain('- **Queries**: Read data without side effects');
      expect(dfd).toContain('- **Handlers**: Process commands and queries independently');
    });

    it('should include command flow pattern steps', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('### Command Flow Pattern');
      expect(dfd).toContain('1. **Client Request**: HTTP request to REST controller');
      expect(dfd).toContain('2. **Command Creation**: Controller creates command object');
      expect(dfd).toContain('3. **Command Dispatch**: Command sent to command bus');
      expect(dfd).toContain('4. **Handler Execution**: Command handler processes business logic');
      expect(dfd).toContain('5. **Domain Events**: Handler publishes domain events');
      expect(dfd).toContain('6. **Persistence**: Changes saved to database');
      expect(dfd).toContain('7. **Response**: Success/error response to client');
    });

    it('should include query flow pattern steps', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('### Query Flow Pattern');
      expect(dfd).toContain('1. **Client Request**: HTTP request to REST controller');
      expect(dfd).toContain('2. **Query Creation**: Controller creates query object');
      expect(dfd).toContain('3. **Query Dispatch**: Query sent to query bus');
      expect(dfd).toContain('4. **Handler Execution**: Query handler retrieves data');
      expect(dfd).toContain('5. **Data Transformation**: Raw data converted to DTOs');
      expect(dfd).toContain('6. **Response**: Data returned to client');
    });

    it('should list events published by handlers', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('Events published by this module:');
      expect(dfd).toContain('- **UserCreatedEvent**: Triggered when a new entity is created');
      expect(dfd).toContain('- **UserUpdatedEvent**: Triggered when an entity is modified');
    });

    it('should generate event flow section', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('### Event Publishers');
      expect(dfd).toContain('| Event | Published By | Trigger Condition |');
      expect(dfd).toContain('| UserCreatedEvent | CreateUserHandler | After successful entity creation |');
      expect(dfd).toContain('| UserUpdatedEvent | UpdateUserHandler | After successful entity modification |');
    });

    it('should include event processing sequence diagram', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('### Event Processing Flow');
      expect(dfd).toContain('```mermaid');
      expect(dfd).toContain('sequenceDiagram');
      expect(dfd).toContain('participant C as Client');
      expect(dfd).toContain('participant H as Handler');
      expect(dfd).toContain('participant E as Event Bus');
      expect(dfd).toContain('C->>H: Execute Command');
      expect(dfd).toContain('H->>E: Publish Domain Event');
    });

    it('should handle handlers with no events', async () => {
      // Arrange
      const handlersWithNoEvents: HandlerInfo[] = [
        {
          name: 'GetUserHandler',
          path: '/handlers/GetUser.handler.ts',
          type: 'query',
          events: []
        }
      ];

      // Act
      const dfd = await generator.generateDFD(handlersWithNoEvents);

      // Assert
      expect(dfd).toContain('No domain events are currently published by this module');
      expect(dfd).toContain('No domain events are published by this module');
    });

    it('should handle empty handlers array', async () => {
      // Act
      const dfd = await generator.generateDFD([]);

      // Assert
      expect(dfd).toContain('consists of 0 handlers');
      expect(dfd).toContain('```mermaid');
      expect(dfd).toContain('flowchart TD');
    });

    it('should apply correct CSS classes for styling', async () => {
      // Act
      const dfd = await generator.generateDFD(mockHandlers);

      // Assert
      expect(dfd).toContain('%% Styling');
      expect(dfd).toContain('classDef commandHandler fill:#e1f5fe');
      expect(dfd).toContain('classDef queryHandler fill:#f3e5f5');
      expect(dfd).toContain('classDef external fill:#fff3e0');
      expect(dfd).toContain('classDef storage fill:#e8f5e8');
      expect(dfd).toContain('class CreateUserHandler commandHandler');
      expect(dfd).toContain('class GetUserHandler queryHandler');
    });

    it('should determine correct return types for query handlers', async () => {
      // Arrange
      const queryHandlersWithDifferentTypes: HandlerInfo[] = [
        {
          name: 'ListUsersHandler',
          path: '/handlers/ListUsers.handler.ts',
          size: 400,
          exists: true,
          lastModified: new Date(),
          className: 'ListUsersHandler',
          handlerType: 'query',
          targetClass: 'ListUsersQuery',
          dependencies: []
        },
        {
          name: 'CountUsersHandler',
          path: '/handlers/CountUsers.handler.ts',
          size: 300,
          exists: true,
          lastModified: new Date(),
          className: 'CountUsersHandler',
          handlerType: 'query',
          targetClass: 'CountUsersQuery',
          dependencies: []
        },
        {
          name: 'UserExistsHandler',
          path: '/handlers/UserExists.handler.ts',
          size: 250,
          exists: true,
          lastModified: new Date(),
          className: 'UserExistsHandler',
          handlerType: 'query',
          targetClass: 'UserExistsQuery',
          dependencies: []
        }
      ];

      // Act
      const dfd = await generator.generateDFD(queryHandlersWithDifferentTypes);

      // Assert
      expect(dfd).toContain('| ListUsersHandler | None | Array<DTO> |');
      expect(dfd).toContain('| CountUsersHandler | None | number |');
      expect(dfd).toContain('| UserExistsHandler | None | boolean |');
    });
  });

  describe('edge cases', () => {
    it('should handle handlers with complex names', async () => {
      // Arrange
      const handlersWithComplexNames: HandlerInfo[] = [
        {
          name: 'Create-User_V2.handler.ts',
          path: '/handlers/Create-User_V2.handler.ts',
          type: 'command',
          events: ['UserV2CreatedEvent']
        }
      ];

      // Act
      const dfd = await generator.generateDFD(handlersWithComplexNames);

      // Assert
      expect(dfd).toContain('CreateUserV2Handler');
      expect(dfd).toContain('UserV2CreatedEvent');
    });

    it('should handle handlers with multiple dependencies', async () => {
      // Arrange
      const handlersWithMultipleDeps: HandlerInfo[] = [
        {
          name: 'ComplexHandler',
          path: '/handlers/Complex.handler.ts',
          type: 'command',
          events: []
        }
      ];

      // Act
      const dfd = await generator.generateDFD(handlersWithMultipleDeps);

      // Assert
      expect(dfd).toContain('| ComplexHandler | None |');
      expect(dfd).toContain('ComplexHandler -->|Write| Database');
    });

    it('should handle handlers with multiple events', async () => {
      // Arrange
      const handlersWithMultipleEvents: HandlerInfo[] = [
        {
          name: 'MultiEventHandler',
          path: '/handlers/MultiEvent.handler.ts',
          type: 'command',
          events: ['Event1', 'Event2', 'Event3']
        }
      ];

      // Act
      const dfd = await generator.generateDFD(handlersWithMultipleEvents);

      // Assert
      expect(dfd).toContain('| MultiEventHandler | Event1, Event2, Event3 |');
      expect(dfd).toContain('EventBus -->|Event1| Event1');
      expect(dfd).toContain('EventBus -->|Event2| Event2');
      expect(dfd).toContain('EventBus -->|Event3| Event3');
    });
  });

  function createMockHandlers(): HandlerInfo[] {
    return [
      {
        name: 'CreateUserHandler',
        path: '/application/handlers/CreateUser.handler.ts',
        type: 'command',
        events: ['UserCreatedEvent']
      },
      {
        name: 'UpdateUserHandler',
        path: '/application/handlers/UpdateUser.handler.ts',
        type: 'command',
        events: ['UserUpdatedEvent']
      },
      {
        name: 'GetUserHandler',
        path: '/application/handlers/GetUser.handler.ts',
        type: 'query',
        events: []
      },
      {
        name: 'ListUsersHandler',
        path: '/application/handlers/ListUsers.handler.ts',
        type: 'query',
        events: []
      }
    ];
  }
});