# Notification Module - Entity Relationship Diagram

## Overview

The Notification module is a stateless service that handles outbound communications. It does not persist data directly but interacts with other modules for sending notifications.

## Component Relationship Diagram

```mermaid
erDiagram
    EmailService ||--|| IEmailProvider : "uses"
    EmailService ||--o{ EmailTemplate : "renders"
    IEmailProvider ||--|| SMTPEmailProvider : "implements"

    EmailService {
        string templateDir
        string appName
        string appUrl
        Map templates
    }

    EmailTemplate {
        string name PK
        string content
        string subject
        array variables
    }

    IEmailProvider {
        method send
        method verify
    }

    SMTPEmailProvider {
        string host
        number port
        string user
        string pass
        string from
    }

    EmailMessage {
        string to
        string subject
        string html
        string text
        string from
        string replyTo
        array attachments
    }

    EmailResult {
        boolean success
        string messageId
        string error
    }

    EmailService ||--o{ EmailMessage : "sends"
    IEmailProvider ||--o{ EmailResult : "returns"
```

## Template Types Enum

```mermaid
classDiagram
    class EmailTemplateType {
        <<enumeration>>
        REGISTRATION_VERIFICATION
        WELCOME
        PASSWORD_RESET
        PASSWORD_CHANGED
        NEW_LOGIN_LOCATION
        SECURITY_ALERT
        EMAIL_OTP
    }
```

## Template Variables

```mermaid
classDiagram
    class RegistrationVerificationVariables {
        +string firstName
        +string verificationLink
        +number expirationHours
    }

    class WelcomeVariables {
        +string firstName
        +string loginLink
    }

    class PasswordResetVariables {
        +string firstName
        +string resetLink
        +number expirationMinutes
    }

    class PasswordChangedVariables {
        +string firstName
        +string changedAt
        +string ipAddress
        +string browserInfo
    }

    class NewLoginLocationVariables {
        +string firstName
        +string deviceInfo
        +string location
        +string time
        +string ipAddress
    }

    class SecurityAlertVariables {
        +string firstName
        +string reason
        +string actionRequired
        +string supportLink
    }

    class EmailOTPVariables {
        +string firstName
        +string otpCode
        +number expirationMinutes
    }

    class TemplateVariables {
        <<union>>
    }

    TemplateVariables <|-- RegistrationVerificationVariables
    TemplateVariables <|-- WelcomeVariables
    TemplateVariables <|-- PasswordResetVariables
    TemplateVariables <|-- PasswordChangedVariables
    TemplateVariables <|-- NewLoginLocationVariables
    TemplateVariables <|-- SecurityAlertVariables
    TemplateVariables <|-- EmailOTPVariables
```

## Provider Interface

```mermaid
classDiagram
    class IEmailProvider {
        <<interface>>
        +send(message: EmailMessage) Promise~EmailResult~
        +verify() Promise~boolean~
    }

    class SMTPEmailProvider {
        -transporter: Transporter
        -from: string
        +send(message: EmailMessage) Promise~EmailResult~
        +verify() Promise~boolean~
    }

    IEmailProvider <|.. SMTPEmailProvider
```

## Module Dependencies

```mermaid
flowchart TB
    subgraph NotificationModule
        ES[EmailService]
        SMTP[SMTPEmailProvider]
        Templates[Email Templates]
    end

    subgraph AuthModule
        Auth[Auth Service]
        EmailVerif[Email Verification]
        PwdReset[Password Reset]
    end

    subgraph ConfigModule
        Config[ConfigService]
    end

    Auth --> ES
    EmailVerif --> ES
    PwdReset --> ES
    ES --> SMTP
    ES --> Templates
    ES --> Config
    SMTP --> Config
```

## Template File Structure

```mermaid
flowchart LR
    subgraph Templates
        T1[registration-verification.hbs]
        T2[welcome.hbs]
        T3[password-reset.hbs]
        T4[password-changed.hbs]
        T5[new-login-location.hbs]
        T6[security-alert.hbs]
        T7[email-otp.hbs]
    end

    subgraph Handlebars
        HB[Handlebars Engine]
        H1[currentYear helper]
        H2[appName helper]
        H3[appUrl helper]
        H4[formatDate helper]
    end

    T1 --> HB
    T2 --> HB
    T3 --> HB
    T4 --> HB
    T5 --> HB
    T6 --> HB
    T7 --> HB

    H1 --> HB
    H2 --> HB
    H3 --> HB
    H4 --> HB
```

## Email Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Request received
    Created --> Rendered: Template compiled
    Rendered --> Queued: Message prepared
    Queued --> Sending: Provider send()
    Sending --> Sent: Success
    Sending --> Failed: Error
    Sent --> Delivered: SMTP accepted
    Delivered --> [*]
    Failed --> Retry: Retry logic
    Retry --> Queued
    Retry --> [*]: Max retries
```
