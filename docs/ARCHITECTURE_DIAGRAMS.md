# TelemetryFlow Core - Architecture Diagrams

Quick visual reference for system architecture and data flows.

## System Overview

**Purpose**: High-level view of TelemetryFlow Core and its external interactions.

**Key Components**:
- **Users**: Regular users with role-based access (Viewer, Developer, Administrator)
- **Administrators**: Super administrators managing the entire platform
- **TelemetryFlow Core**: The main IAM and audit system
- **Monitoring**: External observability stack (Prometheus/Grafana)
- **External Systems**: Third-party integrations via REST API

**Interactions**:
- Users and admins access the system via HTTPS REST API
- Core exports metrics to Prometheus for monitoring
- Core can integrate with external systems through its API

```mermaid
C4Context
    title System Context - TelemetryFlow Core

    Person(user, "User", "System user with role-based access")
    Person(admin, "Administrator", "System administrator")

    System(core, "TelemetryFlow Core", "IAM & Audit System")

    System_Ext(monitoring, "Monitoring", "Prometheus/Grafana")
    System_Ext(external, "External Systems", "Third-party integrations")

    Rel(user, core, "Uses", "HTTPS/REST")
    Rel(admin, core, "Manages", "HTTPS/REST")
    Rel(core, monitoring, "Exports metrics", "Prometheus")
    Rel(core, external, "Integrates", "API")
```

## Container Diagram

**Purpose**: Shows the major containers (applications/services) and their relationships.

**Key Containers**:
- **API Application**: NestJS REST API with JWT authentication
- **IAM Module**: Identity and Access Management (users, roles, permissions)
- **Audit Module**: Audit logging service for tracking all actions
- **PostgreSQL**: Stores IAM data (users, roles, organizations, etc.)
- **ClickHouse**: Stores audit logs for compliance and analysis
- **OTEL Collector**: Collects and processes telemetry data (traces, metrics)

**Data Flow**:
1. User sends HTTPS requests to API
2. API uses IAM module for authentication/authorization
3. API logs all actions to Audit module
4. IAM reads/writes to PostgreSQL
5. Audit writes to ClickHouse
6. API sends traces to OTEL Collector

```mermaid
C4Container
    title Container Diagram - TelemetryFlow Core

    Person(user, "User")

    Container(api, "API Application", "NestJS", "REST API with JWT auth")
    Container(iam, "IAM Module", "TypeScript", "Identity & Access Management")
    Container(audit, "Audit Module", "TypeScript", "Audit logging service")

    ContainerDb(postgres, "PostgreSQL", "PostgreSQL 16", "IAM data storage")
    ContainerDb(clickhouse, "ClickHouse", "ClickHouse", "Audit log storage")
    Container(otel, "OTEL Collector", "OpenTelemetry", "Telemetry collection")

    Rel(user, api, "Uses", "HTTPS")
    Rel(api, iam, "Uses")
    Rel(api, audit, "Logs to")
    Rel(iam, postgres, "Reads/Writes", "SQL")
    Rel(audit, clickhouse, "Writes", "HTTP")
    Rel(api, otel, "Sends traces", "OTLP")
```

## Component Diagram - IAM Module

**Purpose**: Detailed view of IAM module internal components using DDD and CQRS patterns.

**Architecture Layers**:
1. **Presentation Layer**: Controllers handle HTTP requests
2. **Application Layer**: Command/Query buses implement CQRS pattern
3. **Domain Layer**: Aggregates contain business logic
4. **Infrastructure Layer**: Repositories handle data persistence

**Key Components**:
- **Controllers**: User, Role, Permission REST endpoints
- **Command Bus**: Handles write operations (Create, Update, Delete)
- **Query Bus**: Handles read operations (Get, List, Search)
- **Aggregates**: User, Role, Permission domain models with business rules
- **Repositories**: Data access layer using TypeORM

**Flow**:
1. Controller receives HTTP request
2. Routes to Command Bus (write) or Query Bus (read)
3. Command Bus invokes Aggregate for business logic
4. Query Bus reads directly from Repository
5. Aggregate persists changes via Repository

```mermaid
C4Component
    title Component Diagram - IAM Module

    Container(api, "API Layer", "Controllers")

    Component(userCtrl, "User Controller", "REST", "User management")
    Component(roleCtrl, "Role Controller", "REST", "Role management")
    Component(permCtrl, "Permission Controller", "REST", "Permission management")

    Component(cmdBus, "Command Bus", "CQRS", "Command handling")
    Component(queryBus, "Query Bus", "CQRS", "Query handling")

    Component(userAgg, "User Aggregate", "Domain", "User business logic")
    Component(roleAgg, "Role Aggregate", "Domain", "Role business logic")
    Component(permAgg, "Permission Aggregate", "Domain", "Permission logic")

    ComponentDb(repo, "Repositories", "Infrastructure", "Data access")

    Rel(api, userCtrl, "Routes to")
    Rel(api, roleCtrl, "Routes to")
    Rel(api, permCtrl, "Routes to")

    Rel(userCtrl, cmdBus, "Executes")
    Rel(userCtrl, queryBus, "Queries")

    Rel(cmdBus, userAgg, "Invokes")
    Rel(cmdBus, roleAgg, "Invokes")
    Rel(queryBus, repo, "Reads from")

    Rel(userAgg, repo, "Persists via")
    Rel(roleAgg, repo, "Persists via")
```

## Deployment Diagram

**Purpose**: Shows physical deployment architecture using Docker Compose.

**Network Configuration**:
- **Network**: `telemetryflow_core_net` (Bridge network)
- **Subnet**: 172.151.151.0/24
- **Static IPs**: Each service has a fixed IP for reliable communication

**Services**:
- **Backend** (172.151.151.10:3000): NestJS application
- **PostgreSQL** (172.151.151.20:5432): IAM database
- **ClickHouse** (172.151.151.40:8123): Audit log database
- **OTEL Collector** (172.151.151.30:4317): Telemetry collection
- **Prometheus** (172.151.151.50:9090): Metrics storage

**Access**:
- Client connects to Backend on port 3000
- Backend communicates with databases and OTEL internally
- All services isolated in Docker network

```mermaid
C4Deployment
    title Deployment Diagram - Docker Compose

    Deployment_Node(docker, "Docker Host", "Docker Engine") {
        Deployment_Node(network, "telemetryflow_core_net", "Bridge Network") {
            Container(backend, "Backend", "NestJS", "172.151.151.10:3000")
            ContainerDb(postgres, "PostgreSQL", "PostgreSQL 16", "172.151.151.20:5432")
            ContainerDb(clickhouse, "ClickHouse", "ClickHouse", "172.151.151.40:8123")
            Container(otel, "OTEL Collector", "OpenTelemetry", "172.151.151.30:4317")
            Container(prometheus, "Prometheus", "Metrics", "172.151.151.50:9090")
        }
    }

    Deployment_Node(client, "Client", "Browser/API Client") {
        Container(browser, "Web Browser", "Chrome/Firefox")
    }

    Rel(browser, backend, "HTTPS", "Port 3000")
    Rel(backend, postgres, "SQL", "Port 5432")
    Rel(backend, clickhouse, "HTTP", "Port 8123")
    Rel(backend, otel, "OTLP", "Port 4317")
```

## Request Flow - User Creation

**Purpose**: Detailed sequence of creating a new user, showing CQRS and event-driven architecture.

**Steps**:
1. **Request**: Admin sends POST /users with user data
2. **Routing**: API routes to UserController
3. **Command**: Controller creates CreateUserCommand and sends to CommandBus
4. **Handling**: CommandHandler receives and processes command
5. **Domain Logic**: UserAggregate validates data and hashes password
6. **Persistence**: Repository saves user to PostgreSQL
7. **Audit**: AuditService logs action to ClickHouse
8. **Event**: UserCreatedEvent published to EventBus
9. **Response**: Returns userId to client with 201 Created

**Key Patterns**:
- **CQRS**: Separate command handling from queries
- **DDD**: Business logic in UserAggregate
- **Event-Driven**: UserCreatedEvent for async processing
- **Audit Trail**: All actions logged to ClickHouse

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant API
    participant Controller
    participant CommandBus
    participant Handler
    participant UserAggregate
    participant Repository
    participant PostgreSQL
    participant AuditService
    participant ClickHouse
    participant EventBus

    Admin->>API: POST /users
    API->>Controller: createUser(dto)
    Controller->>CommandBus: execute(CreateUserCommand)
    CommandBus->>Handler: handle(command)
    Handler->>UserAggregate: create(email, password, ...)
    UserAggregate->>UserAggregate: validate()
    UserAggregate->>UserAggregate: hashPassword()
    UserAggregate->>Repository: save(user)
    Repository->>PostgreSQL: INSERT INTO users
    PostgreSQL-->>Repository: Success
    Repository-->>Handler: user
    Handler->>AuditService: logData('create_user', SUCCESS)
    AuditService->>ClickHouse: INSERT INTO audit_logs
    ClickHouse-->>AuditService: Confirmed
    Handler->>EventBus: publish(UserCreatedEvent)
    EventBus-->>Handler: Published
    Handler-->>Controller: userId
    Controller-->>API: 201 Created
    API-->>Admin: { userId: "..." }
```

## Permission Check Flow

**Purpose**: Shows how the system validates user permissions for every API request.

**Security Layers**:
1. **Authentication**: Validates JWT token
2. **User Extraction**: Extracts user info from token
3. **Cache Check**: Checks if permissions are cached (performance optimization)
4. **Database Query**: Loads permissions from database if not cached
5. **Permission Check**: Verifies user has required permission
6. **Execution**: Executes operation if authorized
7. **Audit Logging**: Logs all attempts (success and failure)

**Outcomes**:
- **401 Unauthorized**: Invalid or missing JWT token (AUTH FAILURE)
- **403 Forbidden**: Valid token but insufficient permissions (AUTHZ DENIED)
- **200 OK**: Authorized and executed successfully (DATA SUCCESS)

**Performance**:
- Permissions cached after first load
- Reduces database queries
- Fast permission checks

```mermaid
flowchart TD
    Start([API Request]) --> JWT{JWT Valid?}
    JWT -->|No| Audit1[Log: AUTH FAILURE]
    JWT -->|Yes| Extract[Extract User]
    Extract --> Cache{Cache Hit?}
    Cache -->|Yes| Check[Check Permission]
    Cache -->|No| DB[Query Database]
    DB --> Store[Store in Cache]
    Store --> Check
    Check --> Has{Has Permission?}
    Has -->|No| Audit2[Log: AUTHZ DENIED]
    Has -->|Yes| Execute[Execute Operation]
    Execute --> Audit3[Log: DATA SUCCESS]

    Audit1 --> Return1[401 Unauthorized]
    Audit2 --> Return2[403 Forbidden]
    Audit3 --> Return3[200 OK]

    style Audit1 fill:#ff6b6b
    style Audit2 fill:#ffa500
    style Audit3 fill:#51cf66
```

## Data Model - Complete

**Purpose**: Complete entity-relationship diagram for PostgreSQL IAM database.

**Core Entities**:
- **REGION**: Geographic regions (e.g., US-East, EU-West)
- **TENANT**: Top-level tenant organizations
- **ORGANIZATION**: Business units within tenants
- **WORKSPACE**: Project workspaces within organizations
- **USER**: System users with authentication
- **ROLE**: Predefined roles (5-tier RBAC)
- **PERMISSION**: Granular permissions (22+ IAM permissions)
- **GROUP**: User groups for organization

**Relationships**:
- **Hierarchy**: Region → Tenant → Organization → Workspace
- **User Assignment**: User belongs to Organization
- **Role Assignment**: User has multiple Roles (many-to-many via USER_ROLE)
- **Permission Assignment**:
  - Roles have Permissions (many-to-many via ROLE_PERMISSION)
  - Users can have direct Permissions (many-to-many via USER_PERMISSION)
- **Group Membership**: Users can belong to multiple Groups

**Key Features**:
- UUID primary keys for all entities
- Timestamps for audit trail (created_at, updated_at)
- Soft deletes (deleted_at)
- Unique constraints on emails, slugs, codes
- Foreign key relationships for data integrity

```mermaid
erDiagram
    REGION ||--o{ TENANT : "located_in"
    TENANT ||--o{ ORGANIZATION : "contains"
    ORGANIZATION ||--o{ WORKSPACE : "contains"
    ORGANIZATION ||--o{ USER : "belongs_to"
    USER ||--o{ USER_ROLE : "has"
    USER ||--o{ USER_PERMISSION : "has"
    USER }o--o{ GROUP : "member_of"
    ROLE ||--o{ USER_ROLE : "assigned_to"
    ROLE }o--o{ PERMISSION : "has"
    PERMISSION ||--o{ USER_PERMISSION : "granted_to"

    REGION {
        uuid id PK
        string name
        string code
        boolean active
    }

    TENANT {
        uuid id PK
        string name
        string slug
        uuid region_id FK
        boolean active
        timestamp created_at
    }

    ORGANIZATION {
        uuid id PK
        string name
        string slug
        uuid tenant_id FK
        boolean active
        timestamp created_at
    }

    WORKSPACE {
        uuid id PK
        string name
        string slug
        uuid organization_id FK
        boolean active
        timestamp created_at
    }

    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        uuid organization_id FK
        boolean active
        timestamp last_login
        timestamp created_at
    }

    ROLE {
        uuid id PK
        string name UK
        string description
        int tier
        boolean system_role
        timestamp created_at
    }

    PERMISSION {
        uuid id PK
        string name UK
        string resource
        string action
        string description
        timestamp created_at
    }

    GROUP {
        uuid id PK
        string name
        string description
        uuid organization_id FK
        timestamp created_at
    }

    USER_ROLE {
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
    }

    USER_PERMISSION {
        uuid user_id FK
        uuid permission_id FK
        timestamp assigned_at
    }
```

## Audit Log Schema

**Purpose**: ClickHouse schema for audit logging and compliance.

**Main Table: AUDIT_LOGS**
- **Event Tracking**: Records all user actions (AUTH, AUTHZ, DATA, SYSTEM)
- **User Context**: Captures user ID, email, name for accountability
- **Action Details**: Event type, action, resource, result
- **Request Metadata**: IP address, user agent, session ID
- **Performance**: Duration in milliseconds
- **Multi-tenancy**: Organization, workspace, tenant IDs
- **Error Tracking**: Error messages for failed operations

**Materialized Views** (Pre-aggregated for performance):
- **AUDIT_LOGS_STATS**: Daily statistics by event type and result
- **AUDIT_LOGS_USER_ACTIVITY**: Daily user activity counts by event type

**Data Types**:
- `datetime64(3)`: Millisecond precision timestamps
- `enum`: Efficient storage for event_type and result
- `string`: Flexible JSON metadata storage
- `uint32/uint64`: Numeric counters

**Retention**: 90 days (configurable via TTL)

```mermaid
erDiagram
    AUDIT_LOGS {
        uuid id PK
        datetime64 timestamp
        string user_id
        string user_email
        string user_first_name
        string user_last_name
        enum event_type "AUTH|AUTHZ|DATA|SYSTEM"
        string action
        string resource
        enum result "SUCCESS|FAILURE|DENIED"
        string error_message
        string ip_address
        string user_agent
        string metadata "JSON"
        string tenant_id
        string workspace_id
        string organization_id
        string session_id
        uint32 duration_ms
        datetime64 created_at
    }

    AUDIT_LOGS_STATS {
        date date
        enum event_type
        enum result
        uint64 count
    }

    AUDIT_LOGS_USER_ACTIVITY {
        date date
        string user_id
        enum event_type
        uint64 count
    }

    AUDIT_LOGS ||--o{ AUDIT_LOGS_STATS : "aggregates_to"
    AUDIT_LOGS ||--o{ AUDIT_LOGS_USER_ACTIVITY : "aggregates_to"
```

## State Machines

### User Lifecycle

**Purpose**: Shows possible states and transitions for a user account.

**States**:
- **Created**: User account created but not yet activated
  - Cannot login
  - Awaiting activation
- **Active**: User is active and can login
  - Full access based on assigned roles
  - Can perform operations
- **Inactive**: User is deactivated but data preserved
  - Cannot login
  - Can be reactivated
- **Deleted**: User is permanently deleted
  - Terminal state
  - Data may be archived

**Transitions**:
- `Create User` → Created
- `Activate` → Active (from Created or Inactive)
- `Deactivate` → Inactive (from Created or Active)
- `Delete` → Deleted (from Active or Inactive)

**Use Cases**:
- Onboarding: Created → Active
- Suspension: Active → Inactive
- Reactivation: Inactive → Active
- Offboarding: Active/Inactive → Deleted

```mermaid
stateDiagram-v2
    [*] --> Created: Create User
    Created --> Active: Activate
    Created --> Inactive: Deactivate
    Active --> Inactive: Deactivate
    Inactive --> Active: Activate
    Active --> Deleted: Delete
    Inactive --> Deleted: Delete
    Deleted --> [*]

    note right of Created
        User created but not activated
        Cannot login
    end note

    note right of Active
        User can login
        Full access based on roles
    end note

    note right of Inactive
        User cannot login
        Data preserved
    end note
```

### Role Assignment

**Purpose**: Shows how roles are assigned and managed for users.

**States**:
- **NoRole**: User has no roles assigned
  - No permissions
  - Cannot access protected resources
- **HasRole**: User has one or more roles
  - Permissions inherited from roles
  - Can access resources based on permissions

**Transitions**:
- `User Created` → NoRole (initial state)
- `Assign Role` → HasRole (from NoRole)
- `Assign Additional Role` → HasRole (accumulate roles)
- `Revoke All Roles` → NoRole (remove all roles)
- `User Deleted` → Terminal state (from any state)

**Key Points**:
- Users can have multiple roles simultaneously
- Permissions are cumulative (union of all role permissions)
- Revoking all roles removes all inherited permissions
- Direct user permissions persist even without roles

```mermaid
stateDiagram-v2
    [*] --> NoRole: User Created
    NoRole --> HasRole: Assign Role
    HasRole --> HasRole: Assign Additional Role
    HasRole --> NoRole: Revoke All Roles
    HasRole --> [*]: User Deleted
    NoRole --> [*]: User Deleted

    note right of NoRole
        User has no roles
        No permissions
    end note

    note right of HasRole
        User has one or more roles
        Permissions inherited
    end note
```

## Network Topology

**Purpose**: Shows network architecture and service communication within Docker.

**Network Design**:
- **Subnet**: 172.151.0.0/16 (65,536 addresses)
- **Network Type**: Bridge network (isolated from host)
- **Static IPs**: Each service has fixed IP for reliable DNS-free communication

**Tiers**:
1. **Application Tier**: Backend API (172.151.151.10)
2. **Data Tier**: PostgreSQL (172.151.151.20), ClickHouse (172.151.151.40)
3. **Observability Tier**: OTEL (172.151.151.30), Prometheus (172.151.151.50)

**Communication**:
- **External → Backend**: Client connects via port 3000 (mapped to host)
- **Backend → PostgreSQL**: Internal communication on port 5432
- **Backend → ClickHouse**: Internal communication on port 8123
- **Backend → OTEL**: Internal communication on port 4317

**Security**:
- Services isolated in Docker network
- Only Backend port exposed to host
- Database ports not exposed externally

```mermaid
graph TB
    subgraph "External"
        Client[Client<br/>Browser/API]
    end

    subgraph "Docker Network: 172.151.0.0/16"
        subgraph "Application Tier"
            BE[Backend<br/>172.151.151.10<br/>Port 3000]
        end

        subgraph "Data Tier"
            PG[(PostgreSQL<br/>172.151.151.20<br/>Port 5432)]
            CH[(ClickHouse<br/>172.151.151.40<br/>Port 8123/9000)]
        end

        subgraph "Observability Tier"
            OTEL[OTEL Collector<br/>172.151.151.30<br/>Port 4317/4318]
            PROM[Prometheus<br/>172.151.151.50<br/>Port 9090]
        end
    end

    Client -->|:3000| BE
    BE -->|:5432| PG
    BE -->|:8123| CH
    BE -->|:4317| OTEL

    style BE fill:#4ecdc4
    style PG fill:#336791
    style CH fill:#ffa500
    style OTEL fill:#f5a623
```

## Technology Stack

**Purpose**: Complete technology stack and dependencies.

**Frontend**:
- **Swagger UI**: Interactive API documentation (OpenAPI 3.0 spec)

**Backend**:
- **NestJS 11**: Progressive Node.js framework
- **TypeScript 5.9**: Type-safe JavaScript
- **Node.js 18+**: JavaScript runtime

**Data Layer**:
- **PostgreSQL 16**: Relational database for IAM data
- **ClickHouse**: Columnar database for audit logs

**Architecture Patterns**:
- **DDD**: Domain-Driven Design for business logic
- **CQRS**: Command Query Responsibility Segregation
- **Event-Driven**: Domain events for async processing

**Security**:
- **JWT Auth**: JSON Web Tokens for authentication
- **Argon2**: Password hashing algorithm
- **5-Tier RBAC**: Role-Based Access Control system

**Observability**:
- **OpenTelemetry**: Distributed tracing and metrics
- **Winston**: Structured logging
- **Health Checks**: Liveness and readiness probes

**Dependencies**:
- All components integrated through NestJS
- Modular architecture for maintainability
- Production-ready with enterprise features

```mermaid
graph LR
    subgraph "Frontend"
        Swagger[Swagger UI<br/>OpenAPI 3.0]
    end

    subgraph "Backend"
        NestJS[NestJS 11<br/>TypeScript 5.9]
        Node[Node.js 18+]
    end

    subgraph "Data Layer"
        PG[PostgreSQL 16<br/>IAM Data]
        CH[ClickHouse<br/>Audit Logs]
    end

    subgraph "Architecture"
        DDD[Domain-Driven Design]
        CQRS[CQRS Pattern]
        Events[Event-Driven]
    end

    subgraph "Security"
        JWT[JWT Auth]
        Argon2[Argon2 Hashing]
        RBAC[5-Tier RBAC]
    end

    subgraph "Observability"
        OTEL[OpenTelemetry]
        Winston[Winston Logger]
        Health[Health Checks]
    end

    Swagger --> NestJS
    NestJS --> Node
    NestJS --> PG
    NestJS --> CH
    NestJS --> DDD
    NestJS --> CQRS
    NestJS --> Events
    NestJS --> JWT
    NestJS --> Argon2
    NestJS --> RBAC
    NestJS --> OTEL
    NestJS --> Winston
    NestJS --> Health
```

## Scaling Strategy

**Purpose**: Shows current single-instance deployment and future horizontal scaling plan.

**Current Architecture** (Single Instance):
- **Backend**: Single NestJS instance
- **PostgreSQL**: Single database instance
- **ClickHouse**: Single database instance
- **Limitations**:
  - Single point of failure
  - Limited throughput
  - Vertical scaling only

**Future Architecture** (Horizontal Scaling):
- **Load Balancer**: Distributes traffic across backend instances
- **Backend Instances**: Multiple NestJS instances (N instances)
- **Redis Cache**: Shared cache for session and permission data
- **PostgreSQL**: Primary-replica setup for read scaling
- **ClickHouse**: Cluster for distributed queries
- **Benefits**:
  - High availability
  - Horizontal scalability
  - Better performance
  - Fault tolerance

**Scaling Path**:
1. Add Redis for caching (reduce database load)
2. Add load balancer (enable multiple backends)
3. Scale backend horizontally (add more instances)
4. Add PostgreSQL replicas (scale reads)
5. Cluster ClickHouse (scale audit logs)

```mermaid
graph TB
    subgraph "Current - Single Instance"
        BE1[Backend Instance]
        PG1[(PostgreSQL)]
        CH1[(ClickHouse)]
    end

    subgraph "Future - Horizontal Scaling"
        LB[Load Balancer]
        BE2[Backend Instance 1]
        BE3[Backend Instance 2]
        BE4[Backend Instance N]
        PG2[(PostgreSQL<br/>Primary)]
        PG3[(PostgreSQL<br/>Replica)]
        CH2[(ClickHouse<br/>Cluster)]
        Redis[(Redis<br/>Cache)]
    end

    BE1 --> PG1
    BE1 --> CH1

    LB --> BE2
    LB --> BE3
    LB --> BE4
    BE2 --> Redis
    BE3 --> Redis
    BE4 --> Redis
    BE2 --> PG2
    BE3 --> PG2
    BE4 --> PG2
    PG2 --> PG3
    BE2 --> CH2
    BE3 --> CH2
    BE4 --> CH2
```

## Monitoring Dashboard

**Purpose**: Shows observability stack and monitoring data flow.

**Metrics Sources**:
- **Backend**: Health endpoint at `/health`
  - Application metrics
  - Request/response times
  - Error rates
- **ClickHouse**: Prometheus metrics at `:9363/metrics`
  - Query performance
  - Storage metrics
  - Table statistics
- **OTEL Collector**: Metrics at `:8889/metrics`
  - Trace statistics
  - Pipeline metrics
  - Export status

**Collection**:
- **Prometheus**: Scrapes metrics from all sources
  - 15-second scrape interval
  - Time-series storage
  - Query language (PromQL)

**Visualization**:
- **Grafana**: Dashboards for metrics visualization
  - Real-time monitoring
  - Historical analysis
  - Alerting capabilities

**Dashboards**:
1. **System Health**: Overall system status, uptime, resource usage
2. **API Performance**: Request rates, latency, error rates
3. **Audit Statistics**: Audit log counts, event types, user activity
4. **User Activity**: Active users, login patterns, permission usage

**Benefits**:
- Real-time visibility
- Performance monitoring
- Proactive alerting
- Historical analysis

```mermaid
graph TB
    subgraph "Metrics Sources"
        BE[Backend<br/>/health]
        CH[ClickHouse<br/>:9363/metrics]
        OTEL[OTEL<br/>:8889/metrics]
    end

    subgraph "Collection"
        Prom[Prometheus]
    end

    subgraph "Visualization"
        Graf[Grafana]
    end

    subgraph "Dashboards"
        D1[System Health]
        D2[API Performance]
        D3[Audit Statistics]
        D4[User Activity]
    end

    BE --> Prom
    CH --> Prom
    OTEL --> Prom
    Prom --> Graf
    Graf --> D1
    Graf --> D2
    Graf --> D3
    Graf --> D4
```

---

## Quick Reference

### Service Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Backend | 3000 | HTTP | REST API |
| PostgreSQL | 5432 | TCP | Database |
| ClickHouse HTTP | 8123 | HTTP | Queries |
| ClickHouse Native | 9000 | TCP | Native Protocol |
| ClickHouse Metrics | 9363 | HTTP | Prometheus |
| OTEL gRPC | 4317 | gRPC | Telemetry |
| OTEL HTTP | 4318 | HTTP | Telemetry |
| OTEL Metrics | 8889 | HTTP | Prometheus |

### IP Addresses

| Service | IP Address |
|---------|-----------|
| Backend | 172.151.151.10 |
| PostgreSQL | 172.151.151.20 |
| OTEL Collector | 172.151.151.30 |
| ClickHouse | 172.151.151.40 |

### Key Metrics

| Metric | Value |
|--------|-------|
| Aggregates | 9 |
| Commands | 33 |
| Queries | 18 |
| Handlers | 51 |
| Controllers | 9 |
| Domain Events | 25+ |
| Integration Points | 51 |
| Database Tables | 14 |

---

## References

- [Core Modules Documentation](./CORE_MODULES.md)
- [IAM Module](../src/modules/iam/README.md)
- [Audit Module](../src/modules/audit/README.md)
- [Docker Setup](./DOCKER_SETUP.md)
