# TelemetryFlow Core - Architecture Diagrams

Quick visual reference for system architecture and data flows.

## System Overview

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
- [Docker Setup](../DOCKER_SETUP.md)
