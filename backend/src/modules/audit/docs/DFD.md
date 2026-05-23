# Audit Module - Data Flow Diagram

## Level 0: Context Diagram

```mermaid
flowchart TB
    subgraph External
        User[User/Admin]
        Apps[Application Services]
        Compliance[Compliance System]
    end

    subgraph AuditSystem[Audit System]
        AS[Audit Module]
    end

    subgraph Storage
        CH[(ClickHouse)]
    end

    User -->|Query logs| AS
    Apps -->|Log events| AS
    AS -->|Store logs| CH
    AS -->|Export logs| Compliance
    CH -->|Query results| AS
    AS -->|Audit data| User
```

## Level 1: Main Processes

```mermaid
flowchart TB
    subgraph Inputs
        I1[HTTP Request]
        I2[Application Event]
        I3[Query Request]
    end

    subgraph "Audit Module"
        P1[Interceptor]
        P2[Audit Service]
        P3[Query Handler]
        P4[Statistics Calculator]
        P5[Export Handler]
    end

    subgraph Storage
        CH[(ClickHouse)]
        MV1[Stats View]
        MV2[User Activity View]
        MV3[Org Activity View]
    end

    subgraph Outputs
        O1[Audit Log]
        O2[Query Results]
        O3[Statistics]
        O4[Export File]
    end

    I1 --> P1
    P1 --> P2
    I2 --> P2
    P2 --> CH
    CH --> MV1
    CH --> MV2
    CH --> MV3

    I3 --> P3
    CH --> P3
    P3 --> O2

    MV1 --> P4
    MV2 --> P4
    MV3 --> P4
    P4 --> O3

    CH --> P5
    P5 --> O4

    P2 --> O1
```

## Level 2: Detailed Process Flows

### 2.1 Request Interception Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant AuditInterceptor
    participant AuditService
    participant ClickHouse

    Client->>Controller: HTTP Request
    Controller->>AuditInterceptor: intercept()
    AuditInterceptor->>AuditInterceptor: Extract request metadata

    alt Request Succeeds
        Controller-->>AuditInterceptor: Response
        AuditInterceptor->>AuditService: logData(SUCCESS)
    else Request Fails
        Controller-->>AuditInterceptor: Error
        AuditInterceptor->>AuditService: logData(FAILURE)
    end

    AuditService->>ClickHouse: INSERT audit_logs
    ClickHouse-->>AuditService: OK
    AuditInterceptor-->>Client: Response/Error
```

### 2.2 Authentication Audit Flow

```mermaid
sequenceDiagram
    participant User
    participant AuthService
    participant AuditService
    participant ClickHouse

    User->>AuthService: Login Request
    AuthService->>AuthService: Validate credentials

    alt Login Success
        AuthService->>AuditService: logAuth("LOGIN", SUCCESS)
        AuditService->>ClickHouse: INSERT (AUTH, SUCCESS)
        AuthService-->>User: JWT Token
    else Invalid Credentials
        AuthService->>AuditService: logAuth("LOGIN", FAILURE)
        AuditService->>ClickHouse: INSERT (AUTH, FAILURE)
        AuthService-->>User: 401 Unauthorized
    end
```

### 2.3 Authorization Audit Flow

```mermaid
sequenceDiagram
    participant User
    participant PermissionsGuard
    participant AuditService
    participant ClickHouse

    User->>PermissionsGuard: Access Resource
    PermissionsGuard->>PermissionsGuard: Check permissions

    alt Access Granted
        PermissionsGuard->>AuditService: logAuthz("ACCESS", SUCCESS)
        AuditService->>ClickHouse: INSERT (AUTHZ, SUCCESS)
        PermissionsGuard-->>User: Allow access
    else Access Denied
        PermissionsGuard->>AuditService: logAuthz("ACCESS", DENIED)
        AuditService->>ClickHouse: INSERT (AUTHZ, DENIED)
        PermissionsGuard-->>User: 403 Forbidden
    end
```

### 2.4 Data Operation Audit Flow

```mermaid
sequenceDiagram
    participant Service
    participant Repository
    participant AuditService
    participant ClickHouse

    Service->>Repository: Create/Update/Delete

    alt Operation Success
        Repository-->>Service: Result
        Service->>AuditService: logData(action, SUCCESS)
        AuditService->>ClickHouse: INSERT (DATA, SUCCESS)
    else Operation Failed
        Repository-->>Service: Error
        Service->>AuditService: logData(action, FAILURE)
        AuditService->>ClickHouse: INSERT (DATA, FAILURE)
    end
```

### 2.5 Query Flow

```mermaid
sequenceDiagram
    participant Admin
    participant AuditController
    participant AuditService
    participant ClickHouse

    Admin->>AuditController: GET /audit/logs
    AuditController->>AuditService: query(options)
    AuditService->>ClickHouse: SELECT * FROM audit_logs
    ClickHouse-->>AuditService: Results
    AuditService-->>AuditController: Audit logs
    AuditController-->>Admin: JSON Response
```

### 2.6 Statistics Flow

```mermaid
sequenceDiagram
    participant Admin
    participant AuditController
    participant AuditService
    participant ClickHouse
    participant StatsView[audit_logs_stats]

    Admin->>AuditController: GET /audit/logs/statistics
    AuditController->>AuditService: getStatistics()
    AuditService->>ClickHouse: Query materialized view
    ClickHouse->>StatsView: Read aggregates
    StatsView-->>ClickHouse: Aggregated data
    ClickHouse-->>AuditService: Statistics
    AuditService-->>AuditController: Stats object
    AuditController-->>Admin: JSON Response
```

### 2.7 Export Flow

```mermaid
sequenceDiagram
    participant Compliance
    participant AuditController
    participant AuditService
    participant ClickHouse

    Compliance->>AuditController: GET /audit/logs/export
    AuditController->>AuditService: export(format)
    AuditService->>ClickHouse: SELECT with high limit
    ClickHouse-->>AuditService: All matching logs
    AuditService->>AuditService: Format data
    AuditService-->>AuditController: Formatted export
    AuditController-->>Compliance: Export file
```

## Event Type Processing

```mermaid
flowchart TB
    subgraph Events
        E1[Authentication Event]
        E2[Authorization Event]
        E3[Data Event]
        E4[System Event]
    end

    subgraph Processing
        P1[logAuth]
        P2[logAuthz]
        P3[logData]
        P4[logSystem]
        PM[log - main method]
    end

    subgraph Storage
        CH[(ClickHouse)]
    end

    E1 --> P1
    E2 --> P2
    E3 --> P3
    E4 --> P4

    P1 --> PM
    P2 --> PM
    P3 --> PM
    P4 --> PM

    PM --> CH
```

## Data Store Details

| Store | Type | Purpose |
|-------|------|---------|
| audit_logs | ClickHouse Table | Primary audit log storage |
| audit_logs_stats | Materialized View | Pre-aggregated statistics |
| audit_logs_user_activity | Materialized View | Per-user activity tracking |
| audit_logs_org_activity | Materialized View | Per-organization tracking |

## Security Considerations

```mermaid
flowchart TB
    subgraph Input Validation
        V1[Sanitize user input]
        V2[Validate event types]
        V3[Check authorization]
    end

    subgraph Data Protection
        D1[No PII in logs]
        D2[Hash sensitive data]
        D3[TTL enforcement]
    end

    subgraph Access Control
        A1[Admin-only endpoints]
        A2[Tenant isolation]
        A3[Rate limiting]
    end

    V1 --> D1
    V2 --> D2
    V3 --> D3

    D1 --> A1
    D2 --> A2
    D3 --> A3
```
