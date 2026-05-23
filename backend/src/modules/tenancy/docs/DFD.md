# Tenancy Module - Data Flow Diagram

## Level 0 - Context Diagram

```mermaid
flowchart LR
    Client[API Client] -->|HTTP Request| TM[Tenancy Module]
    TM -->|HTTP Response| Client
    TM -->|Read/Write| DB[(PostgreSQL Database)]
    Auth[Auth Module] -->|JWT Validation| TM
    TM -->|Domain Events| ES[Event System]
```

## Level 1 - Module Data Flow

```mermaid
flowchart TB
    subgraph Client["API Client"]
        REQ[HTTP Request]
        RES[HTTP Response]
    end

    subgraph Guards["Authentication & Authorization"]
        JWT[JwtAuthGuard]
        PERM[PermissionsGuard]
    end

    subgraph Controllers["Presentation Layer"]
        RC[RegionsController]
        OC[OrganizationsController]
        WC[WorkspacesController]
        TC[TenantsController]
    end

    subgraph Repositories["Domain Repositories"]
        RR[RegionRepository]
        OR[OrganizationRepository]
        WR[WorkspaceRepository]
        TR[TenantRepository]
    end

    subgraph Database["Data Store"]
        DB[(PostgreSQL)]
    end

    REQ --> JWT --> PERM
    PERM --> RC & OC & WC & TC

    RC --> RR
    OC --> OR
    WC --> WR
    TC --> TR

    RR & OR & WR & TR --> DB
    RC & OC & WC & TC --> RES
```

## Level 2 - CRUD Operation Flow

### Create Flow

```mermaid
flowchart TD
    A[Client POST Request] --> B[JWT Authentication]
    B --> C[Permission Check]
    C --> D[DTO Validation]
    D --> E{Code Exists?}
    E -->|Yes| F[409 Conflict]
    E -->|No| G[Create Domain Aggregate]
    G --> H[Emit Domain Event]
    H --> I[Save to Database]
    I --> J[Return Response DTO]
```

### Read Flow

```mermaid
flowchart TD
    A[Client GET Request] --> B[JWT Authentication]
    B --> C[Permission Check]
    C --> D{Single or List?}
    D -->|List| E[Find All from Repository]
    D -->|Single| F[Find by ID from Repository]
    F --> G{Found?}
    G -->|No| H[404 Not Found]
    G -->|Yes| I[Map to Response DTO]
    E --> I
    I --> J[Return Response]
```

### Update Flow

```mermaid
flowchart TD
    A[Client PATCH Request] --> B[JWT Authentication]
    B --> C[Permission Check]
    C --> D[Find by ID]
    D --> E{Found?}
    E -->|No| F[404 Not Found]
    E -->|Yes| G[Update Domain Aggregate]
    G --> H[Save to Database]
    H --> I[Return Updated Response DTO]
```

### Delete Flow

```mermaid
flowchart TD
    A[Client DELETE Request] --> B[JWT Authentication]
    B --> C[Permission Check]
    C --> D[Find by ID]
    D --> E{Found?}
    E -->|No| F[404 Not Found]
    E -->|Yes| G[Soft Delete in Database]
    G --> H[Return 204 No Content]
```

## Activation/Deactivation Flow

```mermaid
flowchart TD
    A[Client PATCH /:id/activate or deactivate] --> B[JWT Authentication]
    B --> C[Permission Check]
    C --> D[Find by ID]
    D --> E{Found?}
    E -->|No| F[404 Not Found]
    E -->|Yes| G[Update isActive Flag]
    G --> H[Save to Database]
    H --> I[Return Updated Response DTO]
```

## Data Flow Between Entities

```mermaid
flowchart LR
    subgraph Hierarchy
        R[Region] -->|regionId| O[Organization]
        O -->|organizationId| W[Workspace]
        W -->|workspaceId| T[Tenant]
    end

    subgraph Queries
        Q1[GET /regions] --> R
        Q2[GET /organizations?regionId=] --> O
        Q3[GET /workspaces?organizationId=] --> W
        Q4[GET /tenants?workspaceId=] --> T
    end
```
