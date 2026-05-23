# Alerting Module

**Version**: 1.0.0
**Type**: Self-Contained DDD Module
**Status**: Production Ready

---

## Module Overview

Complete Alerting & Notification module with:

- Alert rule management
- Alert instance tracking
- Notification channels (Email, Slack, Webhook, PagerDuty)
- Alert silencing and inhibition
- Alert history and analytics

---

## Database Schema

### PostgreSQL Tables

- `alert_rules` - Alert rule definitions
- `alert_instances` - Active/resolved alerts
- `notification_channels` - Notification destinations
- `alert_silences` - Alert silencing rules
- `alert_history` - Historical alert data

---

## API Endpoints

### Alert Rules

| Method | Endpoint                | Description       |
| ------ | ----------------------- | ----------------- |
| POST   | `/alert-rules`          | Create alert rule |
| GET    | `/alert-rules`          | List alert rules  |
| GET    | `/alert-rules/:id`      | Get alert rule    |
| PUT    | `/alert-rules/:id`      | Update alert rule |
| DELETE | `/alert-rules/:id`      | Delete alert rule |
| POST   | `/alert-rules/:id/test` | Test alert rule   |

### Alert Instances

| Method | Endpoint                           | Description          |
| ------ | ---------------------------------- | -------------------- |
| GET    | `/alert-instances`                 | List alert instances |
| GET    | `/alert-instances/:id`             | Get alert instance   |
| POST   | `/alert-instances/:id/acknowledge` | Acknowledge alert    |
| POST   | `/alert-instances/:id/resolve`     | Resolve alert        |
| POST   | `/alert-instances/:id/silence`     | Silence alert        |

### Notification Channels

| Method | Endpoint                          | Description    |
| ------ | --------------------------------- | -------------- |
| POST   | `/notification-channels`          | Create channel |
| GET    | `/notification-channels`          | List channels  |
| PUT    | `/notification-channels/:id`      | Update channel |
| DELETE | `/notification-channels/:id`      | Delete channel |
| POST   | `/notification-channels/:id/test` | Test channel   |

---

## Alert Rule Structure

```json
{
  "name": "High CPU Usage",
  "query": "avg(rate(node_cpu_seconds_total{mode!=\"idle\"}[5m])) > 0.8",
  "duration": "5m",
  "severity": "critical",
  "labels": { "team": "infrastructure" },
  "annotations": {
    "summary": "CPU usage is above 80%",
    "runbook_url": "https://..."
  },
  "notificationChannels": ["slack-infra", "pagerduty"]
}
```

---

## Notification Channel Types

| Type        | Description           |
| ----------- | --------------------- |
| `email`     | Email notifications   |
| `slack`     | Slack webhooks        |
| `webhook`   | Generic webhooks      |
| `pagerduty` | PagerDuty integration |
| `opsgenie`  | OpsGenie integration  |
| `telegram`  | Telegram bot          |

---

**Documentation**: See `docs/api/openapi.yaml`
