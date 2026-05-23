/**
 * Subscription Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for subscription and billing analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const SUBSCRIPTION_MOCK_DATA: MockQA[] = [
  {
    question: "What's my current subscription plan?",
    answer: `## Current Subscription Details

### Plan Overview
| Field | Value |
|-------|-------|
| Plan | Enterprise |
| Organization | DevOpsCorner Inc. |
| Billing Cycle | Annual (prepaid) |
| Start Date | January 15, 2024 |
| Renewal Date | January 15, 2025 |
| Status | ✅ Active |

### Plan Quotas
| Resource | Included | Current Usage | % Used |
|----------|----------|--------------|--------|
| Metrics | 60,000/min | 45,678/min | 76.1% |
| Logs | 25,000/min | 12,345/min | 49.4% |
| Traces | 10,000/min | 3,456/min | 34.6% |
| Storage | 500 GB | 234 GB | 46.8% |
| Users | Unlimited | 48 | — |
| API Keys | 50 | 12 | 24% |
| Dashboards | Unlimited | 34 | — |
| Alert Rules | 500 | 89 | 17.8% |
| Retention | 365 days max | 90 days (config) | — |

### Enterprise Features
| Feature | Status |
|---------|--------|
| SSO (SAML/OIDC) | ✅ Enabled |
| Custom Retention | ✅ Enabled |
| Multi-Region | ✅ Enabled (3 regions) |
| Priority Support | ✅ Active |
| SLA Guarantee | 99.99% uptime |
| Data Export API | ✅ Enabled |
| Custom Branding | ✅ Enabled |
| Audit Logs | ✅ 365 days |

### Billing Summary
| Item | Amount |
|------|--------|
| Annual Base | $29,988 ($2,499/mo) |
| Overage (current month) | $0 |
| Total Paid YTD | $29,988 |`,
  },
  {
    question: "Compare available subscription plans",
    answer: `## Subscription Plan Comparison

### Plan Tiers
| Feature | Starter | Professional | Enterprise | Custom |
|---------|---------|-------------|-----------|--------|
| **Price** | $49/mo | $499/mo | $2,499/mo | Contact |
| **Metrics** | 5K/min | 50K/min | 100K/min | Custom |
| **Logs** | 2K/min | 20K/min | 50K/min | Custom |
| **Traces** | 500/min | 5K/min | 20K/min | Custom |
| **Storage** | 10 GB | 200 GB | 1 TB | Custom |
| **Users** | 5 | 25 | Unlimited | Unlimited |
| **Retention** | 7 days | 30 days | 365 days | Custom |
| **Dashboards** | 5 | 50 | Unlimited | Unlimited |
| **Alert Rules** | 10 | 100 | 500 | Custom |
| **Regions** | 1 | 1 | 3 | Custom |
| **Support** | Community | Email (24h) | Priority (4h) | Dedicated |

### Feature Matrix
| Feature | Starter | Professional | Enterprise |
|---------|:-------:|:-----------:|:---------:|
| Metrics & Logs | ✅ | ✅ | ✅ |
| Traces & Exemplars | ❌ | ✅ | ✅ |
| Correlations | ❌ | ✅ | ✅ |
| Kubernetes | ❌ | ✅ | ✅ |
| Service Map | ❌ | ✅ | ✅ |
| Network Map | ❌ | ❌ | ✅ |
| SSO/SAML | ❌ | ❌ | ✅ |
| Custom Retention | ❌ | ❌ | ✅ |
| Multi-Region | ❌ | ❌ | ✅ |
| AI Insights (BYOLLM) | ❌ | ✅ | ✅ |
| API Access | Basic | Full | Full |
| Audit Logs | 7 days | 30 days | 365 days |

### Annual Discount
| Plan | Monthly | Annual | Savings |
|------|---------|--------|---------|
| Starter | $49 | $470/yr | 20% |
| Professional | $499 | $4,790/yr | 20% |
| Enterprise | $2,499 | $23,988/yr | 20% |`,
  },
  {
    question: "How much am I spending on overages?",
    answer: `## Overage Analysis

### Current Month Overage Status
| Resource | Quota | Usage | Overage | Cost |
|----------|-------|-------|---------|------|
| Metrics | 60K/min | 45,678/min | None | $0 |
| Logs | 25K/min | 12,345/min | None | $0 |
| Traces | 10K/min | 3,456/min | None | $0 |
| Storage | 500 GB | 234 GB | None | $0 |
| **Total Overage** | | | | **$0** |

### Historical Overage (Last 6 Months)
| Month | Metric Overage | Storage Overage | Total |
|-------|---------------|----------------|-------|
| Current | $0 | $0 | $0 |
| Last month | $45 | $0 | $45 |
| 2 months ago | $0 | $0 | $0 |
| 3 months ago | $123 | $12 | $135 |
| 4 months ago | $0 | $0 | $0 |
| 5 months ago | $89 | $0 | $89 |
| **Total** | **$257** | **$12** | **$269** |

### Overage Rates
| Resource | Unit | Rate |
|----------|------|------|
| Metrics | per 1K/min over quota | $0.10/hour |
| Logs | per 1K/min over quota | $0.15/hour |
| Traces | per 1K/min over quota | $0.20/hour |
| Storage | per GB over quota | $0.50/month |

### Overage Prevention
| Strategy | Estimated Savings | Implementation |
|----------|------------------|----------------|
| Metric cardinality reduction | Avoid $45-$123/mo spikes | Drop unused labels |
| Log sampling for debug level | Reduce log volume 40% | Enable in collector |
| Upgrade to higher quota | Eliminate overage risk | Plan upgrade |

### Recommendation
Your 6-month overage total is **$269**. At this rate, upgrading metrics quota by 20K/min ($200/mo add-on) would be more cost-effective if overage months increase.`,
  },
  {
    question: "Show me the billing history and invoices",
    answer: `## Billing History

### Recent Invoices
| Invoice # | Date | Period | Amount | Status |
|-----------|------|--------|--------|--------|
| INV-2024-012 | Feb 1 | January 2024 | $2,544 | ✅ Paid |
| INV-2024-011 | Jan 1 | December 2023 | $2,499 | ✅ Paid |
| INV-2024-010 | Dec 1 | November 2023 | $2,634 | ✅ Paid |
| INV-2024-009 | Nov 1 | October 2023 | $2,499 | ✅ Paid |
| INV-2024-008 | Oct 1 | September 2023 | $2,588 | ✅ Paid |
| INV-2024-007 | Sep 1 | August 2023 | $2,499 | ✅ Paid |

### Invoice Breakdown (January 2024)
| Item | Quantity | Unit Price | Amount |
|------|----------|-----------|--------|
| Enterprise Plan (monthly) | 1 | $2,499.00 | $2,499.00 |
| Metrics overage | 450 units | $0.10 | $45.00 |
| Storage overage | 0 GB | $0.50 | $0.00 |
| **Total** | | | **$2,544.00** |

### Payment Method
| Field | Value |
|-------|-------|
| Method | Credit Card (Visa) |
| Card | •••• •••• •••• 4242 |
| Expiry | 12/2025 |
| Billing Email | billing@devopscorner.com |
| Auto-pay | ✅ Enabled |

### Annual Summary
| Year | Total Billed | Overages | Credits | Net |
|------|-------------|----------|---------|-----|
| 2024 (YTD) | $5,043 | $45 | $0 | $5,043 |
| 2023 | $29,256 | $768 | -$200 | $29,824 |

### Download Invoice
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/billing/invoices/INV-2024-012/download" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o invoice-2024-012.pdf
\`\`\``,
  },
  {
    question: "How do I upgrade or downgrade my plan?",
    answer: `## Plan Change Guide

### Upgrade Process
\`\`\`bash
# Preview upgrade impact
curl "https://api.telemetryflow.id/api/v2/subscription/preview-change" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "targetPlan": "enterprise", "billingCycle": "annual" }'

# Confirm upgrade
curl -X POST "https://api.telemetryflow.id/api/v2/subscription/change" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "targetPlan": "enterprise",
    "billingCycle": "annual",
    "effectiveDate": "immediate"
  }'
\`\`\`

### Upgrade Impact
| Item | Before | After | Change |
|------|--------|-------|--------|
| Plan | Professional | Enterprise | Upgrade |
| Price | $499/mo | $2,499/mo | +$2,000 |
| Metrics | 50K/min | 100K/min | +100% |
| Storage | 200 GB | 1 TB | +400% |
| Users | 25 | Unlimited | Unlimited |
| SSO | ❌ | ✅ | New |
| Multi-Region | ❌ | ✅ | New |
| Prorated Credit | | | -$256 |

### Downgrade Rules
| Rule | Detail |
|------|--------|
| Effective | End of current billing period |
| Data retention | Reduced to new plan limits |
| Feature access | Removed at downgrade date |
| Users over limit | Must reduce before downgrade |
| Advance notice | 30 days recommended |

### Add-On Options (No Plan Change Required)
| Add-On | Price | Description |
|--------|-------|-------------|
| Extra 10K metrics/min | $100/mo | Increase metrics quota |
| Extra 100 GB storage | $40/mo | Increase storage |
| Extra 10 users | $50/mo | Additional user seats |
| Premium Support | $500/mo | 1-hour response SLA |
| Additional Region | $200/mo | Deploy in extra region |

### Current Promotional Offers
| Offer | Discount | Valid Until |
|-------|----------|------------|
| Annual prepay | 20% off | Always available |
| Startup program | 50% off (1 year) | Application required |
| Non-profit | 30% off | Verification required |`,
  },
  {
    question: "What usage trends affect my billing?",
    answer: `## Usage Trend Analysis

### 90-Day Usage Trends
| Resource | 90d Ago | 60d Ago | 30d Ago | Current | Growth |
|----------|---------|---------|---------|---------|--------|
| Metrics/min | 35,200 | 38,900 | 42,100 | 45,678 | +30% |
| Logs/min | 8,900 | 9,800 | 11,200 | 12,345 | +39% |
| Traces/min | 2,100 | 2,600 | 3,000 | 3,456 | +65% |
| Storage (GB) | 178 | 198 | 218 | 234 | +31% |

### Quota Exhaustion Forecast
| Resource | Current % | Growth Rate | Exceed Quota |
|----------|-----------|-------------|-------------|
| Metrics | 76.1% | +8%/mo | ~3 months |
| Logs | 49.4% | +10%/mo | ~5 months |
| Traces | 34.6% | +15%/mo | ~5 months |
| Storage | 46.8% | +7%/mo | ~8 months |

### Cost Projection
| Month | Base | Projected Overage | Total |
|-------|------|-------------------|-------|
| Current | $2,499 | $0 | $2,499 |
| +1 month | $2,499 | $0 | $2,499 |
| +2 months | $2,499 | $45-$90 | ~$2,560 |
| +3 months | $2,499 | $150-$250 | ~$2,699 |
| +6 months | $2,499 | $400-$600 | ~$2,999 |

### Top Growth Drivers
| Driver | Impact | Cause |
|--------|--------|-------|
| New microservices (+3) | +8K metrics/min | Architecture expansion |
| Debug logging enabled | +2K logs/min | Development cycle |
| Distributed tracing rollout | +800 traces/min | Observability initiative |
| Kubernetes scaling | +5 GB storage/week | Node autoscaling |

### Optimization vs Upgrade Analysis
| Option | Monthly Cost | Covers Growth For |
|--------|-------------|-------------------|
| Optimize (reduce cardinality) | $0 (effort only) | ~2 months |
| Add-on: +20K metrics | $200/mo | ~4 months |
| Upgrade plan tier | +$500/mo | ~12 months |
| **Recommended** | **Optimize first, then add-on** | |`,
  },
];

export const SUBSCRIPTION_CONVERSATION_TITLES: string[] = [
  "Current plan and quota review",
  "Plan comparison analysis",
  "Overage cost investigation",
  "Billing history review",
  "Usage trend forecasting",
  "Usage vs plan quota analysis",
  "Overage cost breakdown",
  "Plan upgrade recommendation",
  "Billing cycle and invoice review",
  "Feature availability per plan tier",
];
