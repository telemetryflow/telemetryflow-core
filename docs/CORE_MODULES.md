# TelemetryFlow Core - Modules Documentation

## Overview

TelemetryFlow Core consists of two primary modules: **IAM (Identity and Access Management)** and **Audit**. These modules work together to provide secure identity management with comprehensive audit logging.

## Architecture Overview

```mermaid
graph TB
    subgraph "TelemetryFlow Core"
        subgraph "Presentation Layer"
            API[REST API Controllers]
            Swagger[Swagger/OpenAPI]
        end

        subgraph "Application Layer"
            Commands[Commands<br/>33 Operations]
            Queries[Queries<br/>18 Operations]
            Handlers[CQRS Handlers<br/>51 Total]
        end

        subgraph "Domain Layer"
            IAM[IAM Module<br/>8 Aggregates]
            Audit[Audit Module<br/>Event Logging]
            Events[Domain Events<br/>25+ Events]
        end

        subgraph "Infrastructure Layer"
            PG[(PostgreSQL<br/>IAM Data)]
            CH[(ClickHouse<br/>Audit Logs)]
            OTEL[OpenTelemetry<br/>Tracing]
            PROM[Prometheus<br/>Metrics]
        end
    end

    API --> Commands
    API --> Queries
    Commands --> Handlers
    Queries --> Handlers
    Handlers --> IAM
    Handlers --> Audit
    IAM --> Events
    IAM --> PG
    Audit --> CH
    API --> OTEL
```

## Module Interaction Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Handler
    participant IAM
    participant Audit
    participant PostgreSQL
    participant ClickHouse

    Client->>Controller: HTTP Request
    Controller->>Handler: Execute Command
    Handler->>IAM: Business Logic
    IAM->>PostgreSQL: Save Data
    PostgreSQL-->>IAM: Success
    IAM->>Audit: Log Event
    Audit->>ClickHouse: Store Audit Log
    ClickHouse-->>Audit: Confirmed
    Audit-->>IAM: Logged
    IAM-->>Handler: Result
    Handler-->>Controller: Response
    Controller-->>Client: HTTP Response
```

---

## IAM Module

### Overview

The IAM module provides complete identity and access management with a 5-tier RBAC system, multi-tenancy support, and hierarchical organization structure.

### Domain Model

```mermaid
erDiagram
    TENANT ||--o{ ORGANIZATION : contains
    ORGANIZATION ||--o{ WORKSPACE : contains
    ORGANIZATION ||--o{ USER : belongs_to
    USER ||--o{ USER_ROLE : has
    USER ||--o{ USER_PERMISSION : has
    USER ||--o{ GROUP : member_of
    ROLE ||--o{ USER_ROLE : assigned_to
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : granted_to
    PERMISSION ||--o{ USER_PERMISSION : granted_to
    GROUP ||--o{ USER : contains
    REGION ||--o{ TENANT : located_in

    TENANT {
        uuid id PK
        string name
        string slug
        uuid region_id FK
        boolean active
    }

    ORGANIZATION {
        uuid id PK
        string name
        string slug
        uuid tenant_id FK
        boolean active
    }

    WORKSPACE {
        uuid id PK
        string name
        string slug
        uuid organization_id FK
        boolean active
    }

    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        uuid organization_id FK
        boolean active
    }

    ROLE {
        uuid id PK
        string name UK
        string description
        int tier
        boolean system_role
    }

    PERMISSION {
        uuid id PK
        string name UK
        string resource
        string action
    }
```

### 5-Tier RBAC System

```mermaid
graph TD
    SA[Super Administrator<br/>Tier 1<br/>Global Access]
    A[Administrator<br/>Tier 2<br/>Organization Scoped]
    D[Developer<br/>Tier 3<br/>Create/Read/Update]
    V[Viewer<br/>Tier 4<br/>Read Only]
    DM[Demo<br/>Tier 5<br/>Demo Org Only]

    SA -->|Manages| A
    A -->|Manages| D
    D -->|Limited by| V
    V -->|Restricted| DM

    style SA fill:#ff6b6b
    style A fill:#ffa500
    style D fill:#4ecdc4
    style V fill:#95e1d3
    style DM fill:#c7ceea
```

### CQRS Pattern

```mermaid
graph LR
    subgraph "Write Side - Commands"
        C1[CreateUser]
        C2[UpdateUser]
        C3[DeleteUser]
        C4[AssignRole]
        C5[RevokeRole]
        C6[33 Commands]
    end

    subgraph "Command Handlers"
        H1[Command Handler]
        H2[Validation]
        H3[Business Logic]
        H4[Event Publishing]
    end

    subgraph "Read Side - Queries"
        Q1[GetUser]
        Q2[ListUsers]
        Q3[GetUserRoles]
        Q4[GetUserPermissions]
        Q5[18 Queries]
    end

    subgraph "Query Handlers"
        QH1[Query Handler]
        QH2[Data Retrieval]
        QH3[DTO Mapping]
    end

    C1 --> H1
    C2 --> H1
    C3 --> H1
    H1 --> H2
    H2 --> H3
    H3 --> H4

    Q1 --> QH1
    Q2 --> QH1
    Q3 --> QH1
    QH1 --> QH2
    QH2 --> QH3
```

### Domain Events

```mermaid
graph TB
    subgraph "User Events"
        UE1[UserCreated]
        UE2[UserUpdated]
        UE3[UserDeleted]
        UE4[UserActivated]
    end

    subgraph "Role Events"
        RE1[RoleAssigned]
        RE2[RoleRevoked]
        RE3[RoleCreated]
        RE4[RoleUpdated]
    end

    subgraph "Permission Events"
        PE1[PermissionAssigned]
        PE2[PermissionRevoked]
        PE3[PermissionCreated]
    end

    subgraph "Organization Events"
        OE1[OrganizationCreated]
        OE2[OrganizationUpdated]
        OE3[TenantCreated]
    end

    subgraph "Event Processor"
        EP[IAM Event Processor]
    end

    UE1 --> EP
    UE2 --> EP
    RE1 --> EP
    RE2 --> EP
    PE1 --> EP
    OE1 --> EP

    EP --> Audit[Audit Module]
```

### IAM Operations

```mermaid
mindmap
  root((IAM Module))
    User Management
      Create User
      Update User
      Delete User
      Activate User
      Change Password
      List Users
      Get User
    Role Management
      Create Role
      Update Role
      Delete Role
      Assign Role
      Revoke Role
      List Roles
      Get Role Users
    Permission Management
      Create Permission
      Update Permission
      Delete Permission
      Assign Permission
      Revoke Permission
      List Permissions
      Get User Permissions
    Organization
      Create Organization
      Update Organization
      Delete Organization
      List Organizations
    Tenant
      Create Tenant
      Update Tenant
      Delete Tenant
      List Tenants
    Workspace
      Create Workspace
      Update Workspace
      Delete Workspace
      List Workspaces
    Group
      Create Group
      Add User to Group
      Remove User from Group
      List Groups
```

---

## Audit Module

### Overview

The Audit module provides comprehensive security and compliance logging using ClickHouse for high-volume data storage.

### Audit Flow

```mermaid
sequenceDiagram
    participant Operation
    participant AuditService
    participant Logger
    participant ClickHouse

    Operation->>AuditService: log(event)
    AuditService->>AuditService: Validate Event
    AuditService->>Logger: Log to Winston
    AuditService->>ClickHouse: Store Audit Log

    alt Success
        ClickHouse-->>AuditService: Confirmed
        AuditService-->>Operation: Success
    else Failure
        ClickHouse-->>AuditService: Error
        AuditService->>Logger: Log Error
        AuditService-->>Operation: Continue (Non-blocking)
    end
```

### Event Types

```mermaid
graph TD
    subgraph "Audit Event Types"
        AUTH[AUTH<br/>Authentication]
        AUTHZ[AUTHZ<br/>Authorization]
        DATA[DATA<br/>Data Operations]
        SYSTEM[SYSTEM<br/>System Events]
    end

    subgraph "AUTH Events"
        A1[Login]
        A2[Logout]
        A3[Password Change]
        A4[User Activation]
    end

    subgraph "AUTHZ Events"
        AZ1[Role Assignment]
        AZ2[Permission Grant]
        AZ3[Access Denied]
        AZ4[Permission Check]
    end

    subgraph "DATA Events"
        D1[Create]
        D2[Update]
        D3[Delete]
        D4[Read Sensitive]
    end

    subgraph "SYSTEM Events"
        S1[Startup]
        S2[Shutdown]
        S3[Config Change]
        S4[Error]
    end

    AUTH --> A1
    AUTH --> A2
    AUTH --> A3
    AUTH --> A4

    AUTHZ --> AZ1
    AUTHZ --> AZ2
    AUTHZ --> AZ3
    AUTHZ --> AZ4

    DATA --> D1
    DATA --> D2
    DATA --> D3
    DATA --> D4

    SYSTEM --> S1
    SYSTEM --> S2
    SYSTEM --> S3
    SYSTEM --> S4
```

### Event Results

```mermaid
stateDiagram-v2
    [*] --> Operation
    Operation --> SUCCESS: Operation Completed
    Operation --> FAILURE: Technical Error
    Operation --> DENIED: Authorization Failed

    SUCCESS --> [*]: Log Success
    FAILURE --> [*]: Log Error
    DENIED --> [*]: Log Denial

    note right of SUCCESS
        Operation completed successfully
        User achieved intended action
    end note

    note right of FAILURE
        Technical error occurred
        System/database issue
    end note

    note right of DENIED
        Authorization failed
        Insufficient permissions
    end note
```

### ClickHouse Schema

```mermaid
erDiagram
    AUDIT_LOGS {
        uuid id PK
        datetime64 timestamp
        string user_id
        string user_email
        enum event_type
        string action
        string resource
        enum result
        string error_message
        string ip_address
        string user_agent
        string metadata
        string tenant_id
        string organization_id
        string workspace_id
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

    AUDIT_LOGS ||--o{ AUDIT_LOGS_STATS : aggregates
    AUDIT_LOGS ||--o{ AUDIT_LOGS_USER_ACTIVITY : aggregates
```

### Data Retention

```mermaid
gantt
    title Audit Log Retention (90 Days)
    dateFormat YYYY-MM-DD
    section Data Lifecycle
    Active Data (0-30 days)     :active, 2025-11-01, 30d
    Recent Data (31-60 days)    :2025-11-31, 30d
    Old Data (61-90 days)       :2026-01-02, 30d
    Auto-Delete (>90 days)      :crit, 2026-04-01, 1d
```

---

## IAM-Audit Integration

### Integration Points

```mermaid
graph TB
    subgraph "IAM Operations"
        U[User Operations<br/>5 points]
        R[Role Operations<br/>7 points]
        P[Permission Operations<br/>6 points]
        O[Organization Operations<br/>3 points]
        T[Tenant Operations<br/>3 points]
        W[Workspace Operations<br/>3 points]
        G[Group Operations<br/>5 points]
    end

    subgraph "Audit Logging"
        AS[Audit Service]
        CH[(ClickHouse)]
    end

    subgraph "Access Control"
        Guards[Guards<br/>2 points]
        Controllers[Controllers<br/>14 points]
    end

    U --> AS
    R --> AS
    P --> AS
    O --> AS
    T --> AS
    W --> AS
    G --> AS
    Guards --> AS
    Controllers --> AS
    AS --> CH

    style AS fill:#4ecdc4
    style CH fill:#ffa500
```

### Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant Controller
    participant Handler
    participant IAM Domain
    participant Audit Service
    participant ClickHouse
    participant Logger

    User->>Controller: API Request
    Controller->>Handler: Execute Command

    alt Success Path
        Handler->>IAM Domain: Business Logic
        IAM Domain->>Handler: Success
        Handler->>Audit Service: Log Success
        Audit Service->>ClickHouse: Store Log
        Audit Service->>Logger: Log to Winston
        Handler->>Controller: Result
        Controller->>User: 200 OK
    else Failure Path
        Handler->>IAM Domain: Business Logic
        IAM Domain->>Handler: Error
        Handler->>Audit Service: Log Failure
        Audit Service->>ClickHouse: Store Log
        Audit Service->>Logger: Log Error
        Handler->>Controller: Error
        Controller->>User: 4xx/5xx Error
    end
```

### Event Distribution

```mermaid
pie title Audit Events by Type
    "DATA Events" : 38
    "AUTHZ Events" : 10
    "AUTH Events" : 3
    "SYSTEM Events" : 0
```

---

## Data Flow

### Write Operation Flow

```mermaid
flowchart TD
    Start([API Request]) --> Validate{Validate Input}
    Validate -->|Invalid| Error1[Return 400]
    Validate -->|Valid| Auth{Authenticate}
    Auth -->|Failed| Error2[Return 401]
    Auth -->|Success| Authz{Authorize}
    Authz -->|Denied| Audit1[Log DENIED]
    Authz -->|Allowed| Execute[Execute Command]
    Execute -->|Success| Audit2[Log SUCCESS]
    Execute -->|Failure| Audit3[Log FAILURE]
    Audit1 --> Error3[Return 403]
    Audit2 --> Success[Return 200]
    Audit3 --> Error4[Return 500]

    Audit1 --> CH[(ClickHouse)]
    Audit2 --> CH
    Audit3 --> CH

    style Audit1 fill:#ff6b6b
    style Audit2 fill:#51cf66
    style Audit3 fill:#ffa500
```

### Read Operation Flow

```mermaid
flowchart TD
    Start([API Request]) --> Auth{Authenticate}
    Auth -->|Failed| Error1[Return 401]
    Auth -->|Success| Authz{Authorize}
    Authz -->|Denied| Audit1[Log DENIED]
    Authz -->|Allowed| Query[Execute Query]
    Query --> Transform[Transform to DTO]
    Transform --> Audit2[Log SUCCESS]
    Audit1 --> Error2[Return 403]
    Audit2 --> Success[Return 200]

    Audit1 --> CH[(ClickHouse)]
    Audit2 --> CH
```

---

## Deployment Architecture

### Docker Compose Setup

```mermaid
graph TB
    subgraph "Docker Network: 172.151.0.0/16"
        subgraph "Backend Service"
            BE[NestJS Backend<br/>172.151.151.10:3000]
        end

        subgraph "Data Layer"
            PG[(PostgreSQL<br/>172.151.151.20:5432<br/>IAM Data)]
            CH[(ClickHouse<br/>172.151.151.40:8123<br/>Audit Logs)]
        end

        subgraph "Observability"
            OTEL[OTEL Collector<br/>172.151.151.30:4317/4318]
        end
    end

    subgraph "External Access"
        Client[Client]
        Swagger[Swagger UI]
    end

    Client -->|HTTP :3000| BE
    Swagger -->|HTTP :3000/api| BE
    BE -->|SQL| PG
    BE -->|HTTP| CH
    BE -->|OTLP| OTEL

    style BE fill:#4ecdc4
    style PG fill:#336791
    style CH fill:#ffa500
    style OTEL fill:#f5a623
```

### Service Dependencies

```mermaid
graph LR
    Backend[Backend Service]
    PG[(PostgreSQL)]
    CH[(ClickHouse)]
    OTEL[OTEL Collector]

    Backend -->|depends_on| PG
    Backend -->|depends_on| CH
    Backend -->|depends_on| OTEL

    PG -->|health_check| Ready1[Ready]
    CH -->|health_check| Ready2[Ready]
    OTEL -->|service_started| Ready3[Started]

    Ready1 --> Start[Backend Starts]
    Ready2 --> Start
    Ready3 --> Start
```

---

## Performance & Scalability

### ClickHouse Partitioning

```mermaid
gantt
    title Monthly Partitioning Strategy
    dateFormat YYYY-MM
    section 2025
    January Partition   :2025-11, 30d
    February Partition  :2025-02, 28d
    March Partition     :2025-03, 31d
    April Partition     :2025-04, 30d
    section Auto-Cleanup
    TTL Cleanup         :crit, 2025-04, 1d
```

### Query Performance

```mermaid
graph LR
    subgraph "Query Optimization"
        Q[Query Request]
        I1[Index: user_id]
        I2[Index: event_type]
        I3[Index: result]
        I4[Index: tenant_id]
        MV1[Materialized View:<br/>Stats]
        MV2[Materialized View:<br/>User Activity]
    end

    Q --> I1
    Q --> I2
    Q --> I3
    Q --> I4
    Q --> MV1
    Q --> MV2

    I1 --> Fast[Fast Query<br/><10ms]
    I2 --> Fast
    MV1 --> Fast
    MV2 --> Fast
```

---

## Security Model

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant JWT Guard
    participant User Service
    participant Audit

    Client->>API: Login Request
    API->>User Service: Validate Credentials

    alt Valid Credentials
        User Service-->>API: User Data
        API->>JWT Guard: Generate Token
        JWT Guard-->>API: JWT Token
        API->>Audit: Log SUCCESS
        API-->>Client: 200 + Token
    else Invalid Credentials
        User Service-->>API: Invalid
        API->>Audit: Log FAILURE
        API-->>Client: 401 Unauthorized
    end
```

### Authorization Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant JWT Guard
    participant Role Guard
    participant Permission Service
    participant Audit

    Client->>API: Protected Request + Token
    API->>JWT Guard: Verify Token

    alt Valid Token
        JWT Guard-->>API: User Data
        API->>Role Guard: Check Permissions
        Role Guard->>Permission Service: Get User Permissions
        Permission Service-->>Role Guard: Permissions List

        alt Has Permission
            Role Guard-->>API: Authorized
            API->>Audit: Log SUCCESS
            API-->>Client: 200 + Data
        else No Permission
            Role Guard-->>API: Denied
            API->>Audit: Log DENIED
            API-->>Client: 403 Forbidden
        end
    else Invalid Token
        JWT Guard-->>API: Invalid
        API->>Audit: Log FAILURE
        API-->>Client: 401 Unauthorized
    end
```

---

## Monitoring & Observability

### Metrics Collection

```mermaid
graph TB
    subgraph "Application"
        BE[Backend Service]
    end

    subgraph "Metrics Sources"
        CH_M[ClickHouse Metrics<br/>:9363/metrics]
        OTEL_M[OTEL Metrics<br/>:8889/metrics]
        BE_M[Backend Health<br/>:3000/health]
    end

    subgraph "Monitoring Stack"
        Prom[Prometheus<br/>Scraper]
        Graf[Grafana<br/>Dashboards]
    end

    BE --> BE_M
    CH_M --> Prom
    OTEL_M --> Prom
    BE_M --> Prom
    Prom --> Graf
```

### Health Checks

```mermaid
stateDiagram-v2
    [*] --> Checking
    Checking --> Healthy: All Services Up
    Checking --> Degraded: Some Services Down
    Checking --> Unhealthy: Critical Services Down

    Healthy --> Checking: Periodic Check
    Degraded --> Checking: Periodic Check
    Unhealthy --> Checking: Periodic Check

    note right of Healthy
        PostgreSQL: ✓
        ClickHouse: ✓
        OTEL: ✓
        Prometheus: ✓
    end note

    note right of Degraded
        PostgreSQL: ✓
        ClickHouse: ✗
        OTEL: ✓
        Prometheus: ✓
    end note

    note right of Unhealthy
        PostgreSQL: ✗
        ClickHouse: ✗
        OTEL: ✗
        Prometheus: ✗
    end note
```

---

## Summary

### Module Statistics

| Metric | IAM Module | Audit Module | Total |
|--------|-----------|--------------|-------|
| **Aggregates** | 8 | 1 | 9 |
| **Commands** | 33 | 0 | 33 |
| **Queries** | 18 | 0 | 18 |
| **Handlers** | 51 | 0 | 51 |
| **Controllers** | 9 | 0 | 9 |
| **Domain Events** | 25+ | 0 | 25+ |
| **Integration Points** | 51 | - | 51 |
| **Database Tables** | 13 | 1 | 14 |

### Technology Stack

```mermaid
mindmap
  root((TelemetryFlow Core))
    Backend
      NestJS 11
      TypeScript 5.9
      Node.js 18+
    Databases
      PostgreSQL 16
      ClickHouse Latest
    Architecture
      DDD
      CQRS
      Event-Driven
    Observability
      OpenTelemetry
      Winston Logger
      Swagger/OpenAPI
    Security
      JWT
      Argon2
      5-Tier RBAC
```

---

## References

- [IAM Module Documentation](../src/modules/iam/README.md)
- [Audit Module Documentation](../src/modules/audit/README.md)
- [IAM-Audit Integration](./IAM_AUDIT_INTEGRATION.md)
- [Docker Setup](../DOCKER_SETUP.md)
- [5-Tier RBAC System](./5-TIER-RBAC.md)
