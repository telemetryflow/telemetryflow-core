# Notification Module - Data Flow Diagram

## Level 0: Context Diagram

```mermaid
flowchart TB
    subgraph External
        User[User/Recipient]
        AuthMod[Auth Module]
        AdminMod[Admin Module]
    end

    subgraph NotificationSystem[Notification System]
        NS[Notification Module]
    end

    subgraph External Services
        SMTP[SMTP Server]
    end

    AuthMod -->|Send notification request| NS
    AdminMod -->|Send notification request| NS
    NS -->|Email message| SMTP
    SMTP -->|Delivery| User
    NS -->|Result status| AuthMod
    NS -->|Result status| AdminMod
```

## Level 1: Main Processes

```mermaid
flowchart TB
    subgraph Inputs
        I1[Template Request]
        I2[Raw Email Request]
        I3[Connection Check]
    end

    subgraph "Notification Module"
        P1[Email Service]
        P2[Template Engine]
        P3[Provider Selector]
        P4[SMTP Provider]
    end

    subgraph Outputs
        O1[Email Result]
        O2[Connection Status]
    end

    subgraph External
        SMTP[SMTP Server]
    end

    I1 --> P1
    I2 --> P1
    P1 --> P2
    P2 --> P1
    P1 --> P3
    P3 --> P4
    P4 --> SMTP
    SMTP --> P4
    P4 --> O1

    I3 --> P4
    P4 --> O2
```

## Level 2: Detailed Process Flows

### 2.1 Registration Verification Email Flow

```mermaid
sequenceDiagram
    participant Auth as Auth Service
    participant Email as Email Service
    participant Template as Template Engine
    participant Provider as SMTP Provider
    participant SMTP as SMTP Server
    participant User

    Auth->>Email: sendVerificationEmail(to, firstName, token)
    Email->>Email: Build verification link
    Email->>Template: renderTemplate(REGISTRATION_VERIFICATION, vars)
    Template->>Template: Load registration-verification.hbs
    Template->>Template: Apply Handlebars helpers
    Template-->>Email: HTML content
    Email->>Email: getSubject(REGISTRATION_VERIFICATION)
    Email->>Provider: send({to, subject, html})
    Provider->>SMTP: Send email
    SMTP-->>Provider: Message ID
    Provider-->>Email: EmailResult(success, messageId)
    Email-->>Auth: EmailResult
    SMTP-->>User: Verification email
```

### 2.2 Password Reset Email Flow

```mermaid
sequenceDiagram
    participant Auth as Auth Service
    participant Email as Email Service
    participant Template as Template Engine
    participant Provider as SMTP Provider
    participant SMTP as SMTP Server

    Auth->>Email: sendPasswordResetEmail(to, firstName, token)
    Email->>Email: Build reset link
    Email->>Template: renderTemplate(PASSWORD_RESET, vars)
    Template-->>Email: HTML content
    Email->>Provider: send({to, subject, html})
    Provider->>SMTP: Send email
    SMTP-->>Provider: Success
    Provider-->>Email: EmailResult
    Email-->>Auth: EmailResult
```

### 2.3 Security Alert Email Flow

```mermaid
sequenceDiagram
    participant Auth as Auth Service
    participant Email as Email Service
    participant Template as Template Engine
    participant Provider as SMTP Provider

    Auth->>Auth: Detect security event
    Auth->>Email: sendNewLoginLocationEmail(to, firstName, device, location, ip)
    Email->>Template: renderTemplate(NEW_LOGIN_LOCATION, vars)
    Template-->>Email: HTML content
    Email->>Provider: send(message)
    Provider-->>Email: EmailResult
    Email-->>Auth: EmailResult
```

### 2.4 Email OTP Flow

```mermaid
sequenceDiagram
    participant MFA as MFA Service
    participant Email as Email Service
    participant Template as Template Engine
    participant Provider as SMTP Provider
    participant User

    MFA->>MFA: Generate OTP code
    MFA->>Email: sendEmailOTP(to, firstName, otpCode)
    Email->>Template: renderTemplate(EMAIL_OTP, vars)
    Template-->>Email: HTML content
    Email->>Provider: send(message)
    Provider-->>Email: EmailResult
    Email-->>MFA: EmailResult
    Note over User: User receives OTP within 10 min
```

### 2.5 Template Loading Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Email as Email Service
    participant FS as File System
    participant HB as Handlebars

    App->>Email: onModuleInit()
    Email->>Email: loadTemplates()

    loop For each template
        Email->>FS: readFileSync(templatePath)
        FS-->>Email: Template content
        Email->>HB: compile(content)
        HB-->>Email: TemplateDelegate
        Email->>Email: templates.set(name, delegate)
    end

    Email->>Email: registerHelpers()
    Email->>HB: registerHelper('currentYear', fn)
    Email->>HB: registerHelper('appName', fn)
    Email->>HB: registerHelper('appUrl', fn)
    Email->>HB: registerHelper('formatDate', fn)
```

### 2.6 Connection Verification Flow

```mermaid
sequenceDiagram
    participant Health as Health Check
    participant Email as Email Service
    participant Provider as SMTP Provider
    participant SMTP as SMTP Server

    Health->>Email: verifyConnection()
    Email->>Provider: verify()
    Provider->>SMTP: EHLO/HELO

    alt Connection OK
        SMTP-->>Provider: 250 OK
        Provider-->>Email: true
        Email-->>Health: true
    else Connection Failed
        SMTP-->>Provider: Error/Timeout
        Provider-->>Email: false
        Email-->>Health: false
    end
```

## Error Handling Flow

```mermaid
flowchart TB
    subgraph Request
        R[Send Email Request]
    end

    subgraph Validation
        V1{Template exists?}
        V2{Provider available?}
        V3{Valid recipient?}
    end

    subgraph Processing
        P1[Render Template]
        P2[Send via Provider]
    end

    subgraph Results
        S[Success Result]
        E1[Template Error]
        E2[Provider Error]
        E3[Send Error]
    end

    R --> V1
    V1 -->|No| E1
    V1 -->|Yes| V2
    V2 -->|No| E2
    V2 -->|Yes| V3
    V3 -->|No| E3
    V3 -->|Yes| P1
    P1 --> P2
    P2 -->|Success| S
    P2 -->|Failure| E3
```

## Template Processing Flow

```mermaid
flowchart LR
    subgraph Input
        V[Template Variables]
        T[Template Type]
    end

    subgraph Processing
        L[Load Template]
        M[Merge Variables]
        H[Apply Helpers]
        R[Render HTML]
    end

    subgraph Output
        HTML[Email HTML]
        SUBJ[Email Subject]
    end

    V --> M
    T --> L
    L --> M
    M --> H
    H --> R
    R --> HTML
    T --> SUBJ
```

## Data Store Details

| Component     | Type        | Purpose                   |
| ------------- | ----------- | ------------------------- |
| Templates     | File System | HBS template files        |
| templates Map | Memory      | Compiled template cache   |
| ConfigService | NestJS      | Environment configuration |

## Provider Extension Points

```mermaid
flowchart TB
    subgraph Interface
        IP[IEmailProvider]
    end

    subgraph Current
        SMTP[SMTPEmailProvider]
    end

    subgraph Future
        SG[SendGridProvider]
        AWS[AmazonSESProvider]
        MJ[MailjetProvider]
    end

    IP --> SMTP
    IP -.-> SG
    IP -.-> AWS
    IP -.-> MJ

    style SG stroke-dasharray: 5 5
    style AWS stroke-dasharray: 5 5
    style MJ stroke-dasharray: 5 5
```
