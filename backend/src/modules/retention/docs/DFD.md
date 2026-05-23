# Retention Module - Data Flow Diagram

## Overview

This DFD illustrates the data flow for retention policy management and enforcement in the TelemetryFlow Platform.

## Level 0 - Context Diagram

```mermaid
flowchart TB
    Admin[Administrator]
    Scheduler[Scheduler Service]

    subgraph RetentionModule[Retention Module]
        RM[Retention Management]
    end

    subgraph DataStores[Data Stores]
        PG[(PostgreSQL)]
        CH[(ClickHouse)]
        S3[(S3/Archive)]
    end

    Admin -->|Manage Policies| RM
    Admin -->|View Statistics| RM
    Admin -->|Trigger Enforcement| RM

    Scheduler -->|Scheduled Enforcement| RM

    RM -->|Store Policies| PG
    RM -->|Delete Old Data| CH
    RM -->|Delete Alert History| PG
    RM -->|Archive Data| S3

    RM -->|Policy Status| Admin
    RM -->|Statistics| Admin
    RM -->|Enforcement Results| Admin
```

## Level 1 - Main Processes

```mermaid
flowchart TB
    subgraph Inputs
        Admin[Administrator]
        Scheduler[Scheduler]
        API[API Gateway]
    end

    subgraph "1.0 Policy Management"
        PM1[1.1 Create Policy]
        PM2[1.2 Update Policy]
        PM3[1.3 Delete Policy]
        PM4[1.4 List Policies]
    end

    subgraph "2.0 Statistics"
        ST1[2.1 Collect Stats]
        ST2[2.2 Generate Report]
    end

    subgraph "3.0 Enforcement"
        EN1[3.1 Select Policies]
        EN2[3.2 Calculate Cutoff]
        EN3[3.3 Archive Data]
        EN4[3.4 Delete Data]
        EN5[3.5 Update Status]
    end

    subgraph Storage
        PG[(PostgreSQL)]
        CH[(ClickHouse)]
        S3[(S3 Archive)]
    end

    Admin --> API
    API --> PM1 & PM2 & PM3 & PM4
    API --> ST1
    API --> EN1

    Scheduler --> EN1

    PM1 & PM2 & PM3 --> PG
    PM4 --> PG

    ST1 --> CH & PG
    ST1 --> ST2

    EN1 --> PG
    EN1 --> EN2
    EN2 --> EN3
    EN3 --> S3
    EN3 --> EN4
    EN4 --> CH & PG
    EN4 --> EN5
    EN5 --> PG
```

## Level 2 - Detailed Processes

### 2.1 Policy Management Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Controller
    participant CommandBus
    participant Handler
    participant Repository
    participant EventBus
    participant Database

    Admin->>Controller: POST /policies
    Controller->>CommandBus: CreatePolicyCommand
    CommandBus->>Handler: execute()
    Handler->>Handler: Validate input
    Handler->>Repository: existsByNameAndOrg()
    Repository->>Database: SELECT
    Database-->>Repository: result
    Repository-->>Handler: exists: boolean

    alt Policy exists
        Handler-->>Controller: ConflictException
        Controller-->>Admin: 409 Conflict
    else Policy doesn't exist
        Handler->>Handler: Create RetentionPolicy aggregate
        Handler->>Handler: Validate policy
        Handler->>Repository: save(policy)
        Repository->>Database: INSERT
        Handler->>EventBus: publish(PolicyCreatedEvent)
        Handler-->>Controller: policyId
        Controller-->>Admin: 201 Created
    end
```

### 2.2 Enforcement Flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant Service as EnforcementService
    participant Repository
    participant ClickHouse
    participant PostgreSQL
    participant S3

    Scheduler->>Service: enforceRetention()
    Service->>Repository: findActivePolicies()
    Repository->>PostgreSQL: SELECT policies
    PostgreSQL-->>Repository: policies[]
    Repository-->>Service: policies[]

    loop For each policy
        Service->>Service: Calculate cutoff date

        alt Archive enabled
            Service->>ClickHouse: SELECT data older than cutoff
            ClickHouse-->>Service: data to archive
            Service->>S3: Upload archived data
            S3-->>Service: upload success
        end

        alt Logs/Metrics/Traces/Exemplars
            Service->>ClickHouse: DELETE WHERE timestamp < cutoff
            ClickHouse-->>Service: rows deleted
        else Alerts
            Service->>PostgreSQL: DELETE WHERE fired_at < cutoff
            PostgreSQL-->>Service: rows deleted
        end

        Service->>Repository: markEnforced(policy)
        Repository->>PostgreSQL: UPDATE last_enforced_at
    end

    Service-->>Scheduler: EnforcementResult[]
```

### 2.3 Statistics Collection Flow

```mermaid
flowchart LR
    subgraph "Statistics Collection"
        A[Request Stats] --> B{Data Type?}
        B -->|logs| C1[Query ClickHouse logs]
        B -->|metrics| C2[Query ClickHouse metrics]
        B -->|traces| C3[Query ClickHouse traces]
        B -->|alerts| C4[Query PostgreSQL alerts]
        B -->|exemplars| C5[Query ClickHouse exemplars]

        C1 & C2 & C3 & C4 & C5 --> D[Aggregate Results]
        D --> E[Get Active Policy]
        E --> F[Calculate Records to Delete]
        F --> G[Return Statistics]
    end
```

## Data Stores

| Store | Purpose | Data |
|-------|---------|------|
| PostgreSQL | Policy storage | retention_policies, alert_instances |
| ClickHouse | Telemetry storage | logs, metrics, traces, exemplars |
| S3/Archive | Long-term storage | Archived telemetry data |

## Scheduled Processes

```mermaid
gantt
    title Retention Scheduler Timeline
    dateFormat HH:mm
    axisFormat %H:%M

    section Daily
    Retention Enforcement :02:00, 1h

    section Hourly
    Quick Check :00:00, 5m
    Quick Check :01:00, 5m
    Quick Check :02:00, 5m

    section Weekly
    Weekly Report :crit, 03:00, 30m
```

## Error Handling

```mermaid
flowchart TB
    A[Enforcement Start] --> B{Get Policies}
    B -->|Error| C[Log Error & Continue]
    B -->|Success| D{For Each Policy}

    D --> E{Delete Data}
    E -->|Timeout| F[Log Timeout & Continue]
    E -->|Error| G[Log Error & Continue]
    E -->|Success| H[Update Policy Status]

    H --> I{More Policies?}
    I -->|Yes| D
    I -->|No| J[Return Results]

    C --> J
    F --> I
    G --> I
```
