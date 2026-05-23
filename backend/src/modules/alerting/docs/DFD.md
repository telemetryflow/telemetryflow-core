# Data Flow Diagram (DFD) - Alerting Module

## Overview

The Alerting Module implements alert rule evaluation, instance management, and notifications.

## Data Flow Diagram

```mermaid
flowchart TB
    subgraph External["External Systems"]
        Metrics["Metrics API<br/>Prometheus"]
        Notifiers["Notification Services<br/>Slack, Email, PagerDuty"]
        Client["Frontend Client"]
    end

    subgraph AlertingModule["Alerting Module"]
        subgraph Evaluation["Alert Evaluation"]
            Scheduler["Evaluation Scheduler<br/>Cron-based"]
            Evaluator["Rule Evaluator<br/>PromQL Engine"]
            StateManager["State Manager<br/>Pending → Firing → Resolved"]
        end

        subgraph Notification["Notification Layer"]
            Router["Notification Router"]
            EmailSender["Email Sender"]
            SlackSender["Slack Sender"]
            WebhookSender["Webhook Sender"]
        end

        subgraph Controllers["Presentation Layer"]
            RulesController["Alert Rules Controller"]
            InstancesController["Alert Instances Controller"]
            ChannelsController["Notification Channels Controller"]
        end
    end

    subgraph DataStores["Data Stores"]
        PostgreSQL[("PostgreSQL<br/>Rules, Instances, Channels")]
    end

    %% Evaluation Flow
    Scheduler -->|Trigger| Evaluator
    Evaluator -->|Query| Metrics
    Metrics -.->|Results| Evaluator
    Evaluator -->|Update State| StateManager
    StateManager -->|Persist| PostgreSQL
    StateManager -->|Notify| Router

    %% Notification Flow
    Router --> EmailSender
    Router --> SlackSender
    Router --> WebhookSender
    EmailSender --> Notifiers
    SlackSender --> Notifiers
    WebhookSender --> Notifiers

    %% API Flow
    Client --> RulesController
    Client --> InstancesController
    Client --> ChannelsController
    RulesController --> PostgreSQL
    InstancesController --> PostgreSQL
    ChannelsController --> PostgreSQL

    style AlertingModule fill:#e1f5ff
    style Evaluation fill:#ffe1f5
    style Notification fill:#fff4e1
```

## Alert State Machine

```mermaid
stateDiagram-v2
    [*] --> Inactive: Rule created
    Inactive --> Pending: evaluate (condition true)
    Pending --> Firing: for duration (threshold met)
    Pending --> Inactive: condition false
    Firing --> Resolved: condition false
    Resolved --> Inactive: auto-reset

    note right of Pending
        Waiting for duration
        threshold to be met
    end note

    note right of Firing
        Notifications sent
        to configured channels
    end note

    note right of Resolved
        Recovery notification
        sent on transition
    end note
```

## Key Components

### Rule Evaluator

- Executes PromQL queries against metrics
- Compares results against thresholds
- Manages pending → firing transitions

### State Manager

- Tracks alert instance states
- Handles duration-based firing
- Records state transitions

### Notification Router

- Routes alerts to configured channels
- Handles grouping and throttling
- Manages notification retries

---

**License**: Apache-2.0
**Module Status**: Production-ready
