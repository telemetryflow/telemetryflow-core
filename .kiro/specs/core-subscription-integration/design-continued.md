# Design Document (Continued)

## Correctness Properties

See [properties.md](./properties.md) for the complete list of 49 correctness properties.

## Error Handling

### Error Categories

#### 1. API Errors

**Handling Strategy:**

- Display backend error message to user
- Log full error details to console
- Provide retry action for transient errors
- Show field-specific errors for validation failures

**Implementation:**

```typescript
try {
  await subscriptionApi.changePlan(newPlanType);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error - show field-specific messages
    showValidationErrors(error.response.data.errors);
  } else if (error.response?.status >= 500) {
    // Server error - show retry option
    showErrorWithRetry(error.response.data.message);
  } else {
    // Other API error
    showError(error.response?.data?.message || "An error occurred");
  }
  console.error("Plan change failed:", error);
}
```

#### 2. Network Errors

**Handling Strategy:**

- Display user-friendly network error message
- Show cached data with staleness indicator
- Implement exponential backoff retry
- Provide manual retry action

**Implementation:**

```typescript
try {
  await subscriptionApi.fetchSubscription();
} catch (error) {
  if (error.code === "ECONNABORTED" || error.message === "Network Error") {
    showNetworkError(
      "Unable to connect. Please check your internet connection.",
    );
    displayCachedData();
    scheduleRetryWithBackoff();
  }
}
```

#### 3. Validation Errors

**Handling Strategy:**

- Highlight invalid fields
- Display inline error messages
- Prevent form submission until resolved
- Clear errors on field change

**Implementation:**

```typescript
const validationErrors = ref<Record<string, string>>({});

const validatePlanChange = () => {
  validationErrors.value = {};

  if (!selectedPlan.value) {
    validationErrors.value.plan = "Please select a plan";
  }

  if (requiresPayment && !hasPaymentMethod.value) {
    validationErrors.value.payment = "Payment method required";
  }

  return Object.keys(validationErrors.value).length === 0;
};
```

#### 4. Payment Errors

**Handling Strategy:**

- Display Stripe error message
- Provide guidance for common issues
- Offer payment method update option
- Log payment errors for support

**Implementation:**

```typescript
try {
  await stripe.confirmCardPayment(clientSecret);
} catch (error) {
  const guidance = getPaymentErrorGuidance(error.code);
  showPaymentError(error.message, guidance);
  offerPaymentMethodUpdate();
}
```

### Error Recovery Patterns

#### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

#### Optimistic Updates with Rollback

```typescript
async function changePlanOptimistically(newPlanType: string) {
  const previousState = { ...subscription.value };

  // Optimistic update
  subscription.value.planType = newPlanType;
  subscription.value.status = "active";

  try {
    const updated = await subscriptionApi.updatePlan(newPlanType);
    subscription.value = updated;
  } catch (error) {
    // Rollback on failure
    subscription.value = previousState;
    showError("Failed to change plan. Please try again.");
    throw error;
  }
}
```

#### Offline Mode with Cache

```typescript
async function fetchSubscriptionWithCache() {
  try {
    const data = await subscriptionApi.getSubscription();
    localStorage.setItem("subscription_cache", JSON.stringify(data));
    localStorage.setItem("subscription_cache_time", Date.now().toString());
    return data;
  } catch (error) {
    const cached = localStorage.getItem("subscription_cache");
    const cacheTime = localStorage.getItem("subscription_cache_time");

    if (cached) {
      showStaleDataWarning(cacheTime);
      return JSON.parse(cached);
    }

    throw error;
  }
}
```

## Testing Strategy

### Dual Testing Approach

The subscription integration requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**

- Specific examples of subscription operations
- Edge cases (trial ending, limit reached, payment failure)
- Integration points between components
- Error conditions and recovery

**Property-Based Tests:**

- Universal properties across all inputs
- Data transformation correctness
- State management consistency
- API client behavior

### Unit Testing

#### Component Tests

```typescript
// components/__tests__/PlanCard.spec.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import PlanCard from "../PlanCard.vue";

describe("PlanCard", () => {
  it("displays all plan information", () => {
    const plan = {
      id: "1",
      name: "Professional",
      type: "professional",
      description: "For growing teams",
      features: [
        { name: "Logs", code: "log_ingestion_gb", limit: 100, unit: "GB" },
      ],
      pricing: [{ billingCycle: "monthly", amount: 19900, currency: "USD" }],
      isActive: true,
      trialDays: 14,
    };

    const wrapper = mount(PlanCard, {
      props: { plan, billingCycle: "monthly" },
    });

    expect(wrapper.text()).toContain("Professional");
    expect(wrapper.text()).toContain("For growing teams");
    expect(wrapper.text()).toContain("$199");
    expect(wrapper.text()).toContain("100 GB");
  });

  it("emits select event when button clicked", async () => {
    const plan = createMockPlan();
    const wrapper = mount(PlanCard, {
      props: { plan, billingCycle: "monthly" },
    });

    await wrapper.find("button").trigger("click");

    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")[0]).toEqual([plan]);
  });

  it("disables button for current plan", () => {
    const plan = createMockPlan();
    const wrapper = mount(PlanCard, {
      props: { plan, currentPlan: plan, billingCycle: "monthly" },
    });

    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
  });
});
```

#### Composable Tests

```typescript
// composables/__tests__/useSubscription.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSubscription } from "../useSubscription";
import { setActivePinia, createPinia } from "pinia";

describe("useSubscription", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("fetches subscription on mount", async () => {
    const { subscription, fetchSubscription } = useSubscription();

    await fetchSubscription();

    expect(subscription.value).toBeDefined();
    expect(subscription.value.planType).toBe("professional");
  });

  it("computes isActive correctly", () => {
    const { subscription, isActive } = useSubscription();

    subscription.value = { status: "active" };
    expect(isActive.value).toBe(true);

    subscription.value = { status: "canceled" };
    expect(isActive.value).toBe(false);
  });

  it("handles plan change errors", async () => {
    const { changePlan, error } = useSubscription();

    vi.spyOn(subscriptionApi, "updatePlan").mockRejectedValue(
      new Error("Payment required"),
    );

    await expect(changePlan("enterprise")).rejects.toThrow();
    expect(error.value).toBeDefined();
  });
});
```

#### Store Tests

```typescript
// store/__tests__/subscription.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSubscriptionStore } from "../subscription";

describe("Subscription Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("initializes with empty state", () => {
    const store = useSubscriptionStore();

    expect(store.subscription).toBeNull();
    expect(store.plans).toEqual([]);
    expect(store.usage).toBeNull();
  });

  it("updates subscription state after fetch", async () => {
    const store = useSubscriptionStore();

    await store.fetchSubscription();

    expect(store.subscription).toBeDefined();
    expect(store.currentPlan).toBeDefined();
  });

  it("calculates usage percentages correctly", () => {
    const store = useSubscriptionStore();

    store.usage = {
      metrics: { log_ingestion_gb: 80 },
    };
    store.currentPlan = {
      features: [{ code: "log_ingestion_gb", limit: 100 }],
    };

    expect(store.usagePercentages.log_ingestion_gb).toBe(80);
  });

  it("identifies warning metrics", () => {
    const store = useSubscriptionStore();

    store.usage = {
      metrics: { log_ingestion_gb: 85, metric_data_points: 50 },
    };
    store.currentPlan = {
      features: [
        { code: "log_ingestion_gb", limit: 100 },
        { code: "metric_data_points", limit: 100 },
      ],
    };

    expect(store.warningMetrics).toContain("log_ingestion_gb");
    expect(store.warningMetrics).not.toContain("metric_data_points");
  });
});
```

### Property-Based Testing

#### Configuration

Use `fast-check` library for property-based testing in TypeScript:

```bash
pnpm add -D fast-check
```

Configure each property test to run minimum 100 iterations:

```typescript
import * as fc from 'fast-check';

fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
);
```

#### Property Test Examples

```typescript
// __tests__/properties/api-client.property.spec.ts
import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { subscriptionApi } from "@/api/subscription";

/**
 * Feature: frontend-backend-subscription-integration
 * Property 1: API Client Endpoint Correctness
 *
 * For any subscription operation, the API client should call the correct
 * backend endpoint with the correct HTTP method and parameters.
 */
describe("Property 1: API Client Endpoint Correctness", () => {
  it("calls correct endpoints for all operations", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "getPlans",
          "getSubscription",
          "updatePlan",
          "cancelSubscription",
          "getUsage",
          "getInvoices",
        ),
        async (operation) => {
          const spy = vi.spyOn(axios, "request");

          const expectedEndpoints = {
            getPlans: { method: "GET", url: "/api/v2/subscription/plans" },
            getSubscription: { method: "GET", url: "/api/v2/subscription" },
            updatePlan: { method: "PUT", url: "/api/v2/subscription/plan" },
            cancelSubscription: {
              method: "POST",
              url: "/api/v2/subscription/cancel",
            },
            getUsage: { method: "GET", url: "/api/v2/subscription/usage" },
            getInvoices: {
              method: "GET",
              url: "/api/v2/subscription/invoices",
            },
          };

          await subscriptionApi[operation]();

          const expected = expectedEndpoints[operation];
          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              method: expected.method,
              url: expected.url,
            }),
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

```typescript
// __tests__/properties/usage-percentage.property.spec.ts
/**
 * Feature: frontend-backend-subscription-integration
 * Property 5: Usage Percentage Calculation
 *
 * For any usage metric with a defined limit, the displayed percentage
 * should equal (current usage / limit) * 100.
 */
describe("Property 5: Usage Percentage Calculation", () => {
  it("calculates usage percentage correctly for all metrics", () => {
    fc.assert(
      fc.property(
        fc.record({
          current: fc.nat(10000),
          limit: fc.integer({ min: 1, max: 10000 }),
        }),
        ({ current, limit }) => {
          const percentage = (current / limit) * 100;
          const calculated = calculateUsagePercentage(current, limit);

          expect(calculated).toBeCloseTo(percentage, 2);
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

```typescript
// __tests__/properties/state-sync.property.spec.ts
/**
 * Feature: frontend-backend-subscription-integration
 * Property 12: State Synchronization After Actions
 *
 * For any subscription action, when the action completes successfully,
 * the subscription state should be updated to reflect the new state.
 */
describe("Property 12: State Synchronization After Actions", () => {
  it("synchronizes state after all subscription actions", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "changePlan",
          "cancel",
          "reactivate",
          "pause",
          "resume",
        ),
        fc.record({
          planType: fc.constantFrom(
            "free",
            "starter",
            "professional",
            "enterprise",
          ),
          status: fc.constantFrom("active", "trialing", "canceled", "paused"),
        }),
        async (action, initialState) => {
          const store = useSubscriptionStore();
          store.subscription = initialState;

          const previousState = { ...store.subscription };
          await store[action]();

          // State should have changed
          expect(store.subscription).not.toEqual(previousState);

          // State should match backend response
          const backend = await subscriptionApi.getSubscription();
          expect(store.subscription).toEqual(backend);
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

```typescript
// __tests__/properties/error-handling.property.spec.ts
/**
 * Feature: frontend-backend-subscription-integration
 * Property 13: Error Display and Recovery
 *
 * For any failed API operation, the system should display an error message
 * and provide retry actions for transient errors.
 */
describe("Property 13: Error Display and Recovery", () => {
  it("handles all error types correctly", () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.integer({ min: 400, max: 599 }),
          message: fc.string(),
          isTransient: fc.boolean(),
        }),
        async (errorConfig) => {
          const error = new Error(errorConfig.message);
          error.response = { status: errorConfig.status };

          vi.spyOn(subscriptionApi, "getSubscription").mockRejectedValue(error);

          const { fetchSubscription, error: storeError } = useSubscription();
          await expect(fetchSubscription()).rejects.toThrow();

          // Error should be stored
          expect(storeError.value).toBeDefined();

          // Retry action should be available for transient errors
          if (errorConfig.isTransient) {
            expect(hasRetryAction()).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

### Test Coverage Requirements

- **Overall Coverage**: ≥90%
- **Components**: ≥85%
- **Composables**: ≥90%
- **Store**: ≥90%
- **API Client**: ≥90%
- **Utilities**: ≥95%

### Test Organization

```
frontend/src/
├── components/
│   └── subscription/
│       ├── __tests__/
│       │   ├── PlanCard.spec.ts
│       │   ├── UsageDisplay.spec.ts
│       │   └── FeatureGate.spec.ts
│       └── *.vue
├── composables/
│   ├── __tests__/
│   │   ├── useSubscription.spec.ts
│   │   ├── useUsage.spec.ts
│   │   └── useFeatureGate.spec.ts
│   └── *.ts
├── store/
│   ├── __tests__/
│   │   └── subscription.spec.ts
│   └── subscription.ts
└── __tests__/
    └── properties/
        ├── api-client.property.spec.ts
        ├── data-display.property.spec.ts
        ├── usage-calculation.property.spec.ts
        ├── state-sync.property.spec.ts
        ├── error-handling.property.spec.ts
        └── feature-gate.property.spec.ts
```

## Implementation Notes

### Performance Considerations

1. **Data Caching**: Cache subscription and plan data for 5 minutes to reduce API calls
2. **Lazy Loading**: Lazy load analytics charts and invoice details
3. **Virtual Scrolling**: Use virtual scrolling for large invoice lists
4. **Debouncing**: Debounce usage limit checks to prevent excessive API calls
5. **Memoization**: Memoize computed properties for usage percentages and feature availability

### Security Considerations

1. **Payment Data**: Never store payment card data in frontend state or localStorage
2. **API Keys**: Use environment variables for Stripe publishable key
3. **CSRF Protection**: Include CSRF tokens in all mutation requests
4. **XSS Prevention**: Sanitize all user-generated content before display
5. **Secure Storage**: Encrypt sensitive data in localStorage if necessary

### Accessibility Considerations

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and roles
3. **Color Contrast**: Ensure sufficient contrast for usage indicators
4. **Focus Management**: Manage focus for modals and dialogs
5. **Error Announcements**: Announce errors to screen readers

### Browser Compatibility

- **Target Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Polyfills**: None required (modern browser features only)
- **Stripe Elements**: Requires modern browser with ES6 support
- **WebSocket**: Fallback to polling if WebSocket unavailable

## Deployment Considerations

### Environment Variables

```env
# Frontend (.env.production)
TELEMETRYFLOW_API_URL=https://api.telemetryflow.com
TELEMETRYFLOW_WS_URL=wss://api.telemetryflow.com
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          subscription: [
            "./src/views/subscription",
            "./src/components/subscription",
            "./src/store/subscription",
          ],
          stripe: ["@stripe/stripe-js"],
        },
      },
    },
  },
});
```

### Monitoring and Analytics

1. **Error Tracking**: Send errors to error tracking service (Sentry, etc.)
2. **Usage Analytics**: Track subscription actions and conversions
3. **Performance Monitoring**: Monitor API response times and render performance
4. **User Behavior**: Track plan comparison views and upgrade funnel

## Future Enhancements

1. **Multi-Currency Support**: Support multiple currencies for international customers
2. **Custom Plans**: Allow enterprise customers to create custom plans
3. **Usage Forecasting**: Predict future usage based on historical trends
4. **Cost Optimization**: Suggest plan changes based on usage patterns
5. **Team Management**: Add team member management within subscriptions
6. **API Rate Limiting**: Display API rate limit usage and warnings
7. **Subscription Gifting**: Allow users to gift subscriptions
8. **Referral Program**: Implement referral tracking and rewards
