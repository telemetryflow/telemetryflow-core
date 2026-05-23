# Alerting Module - Entity Relationship Diagram

## Overview

This ERD represents the Alerting module entities for alert rules, instances, and notifications.

## Entity Relationship Diagram

```mermaid
erDiagram
    AlertRule ||--o{ AlertInstance : "triggers"
    AlertRule ||--o{ AlertRuleNotificationChannel : "uses"
    NotificationChannel ||--o{ AlertRuleNotificationChannel : "receives"
    AlertInstance ||--o{ AlertHistory : "logs"
    AlertInstance ||--o| AlertSilence : "silenced by"

    AlertRule {
        uuid id PK
        varchar name
        text description
        text query
        varchar duration
        varchar severity "critical|warning|info"
        jsonb labels
        jsonb annotations
        boolean is_enabled
        integer evaluation_interval
        uuid organization_id FK
        uuid workspace_id FK
        timestamp created_at
        timestamp updated_at
    }

    AlertInstance {
        uuid id PK
        uuid rule_id FK
        varchar state "pending|firing|resolved"
        jsonb labels
        jsonb annotations
        timestamp started_at
        timestamp resolved_at
        timestamp last_evaluated_at
        float64 value
        uuid organization_id FK
    }

    NotificationChannel {
        uuid id PK
        varchar name
        varchar type "email|slack|webhook|pagerduty"
        jsonb config
        boolean is_enabled
        uuid organization_id FK
        timestamp created_at
        timestamp updated_at
    }

    AlertRuleNotificationChannel {
        uuid id PK
        uuid rule_id FK
        uuid channel_id FK
        timestamp created_at
    }

    AlertSilence {
        uuid id PK
        jsonb matchers
        varchar comment
        timestamp starts_at
        timestamp ends_at
        varchar created_by
        uuid organization_id FK
    }

    AlertHistory {
        uuid id PK
        uuid instance_id FK
        varchar state
        jsonb labels
        float64 value
        timestamp timestamp
    }
```

## Key Constraints

- AlertRule.name: Unique per organization
- NotificationChannel.name: Unique per organization
- AlertRuleNotificationChannel: Unique (rule_id, channel_id)

## Indexes

- AlertRule: (organization_id, is_enabled)
- AlertInstance: (organization_id, state)
- AlertInstance: (rule_id, state)
- AlertHistory: (instance_id, timestamp)
