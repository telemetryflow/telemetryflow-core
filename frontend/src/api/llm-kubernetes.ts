/**
 * Kubernetes Context Mock Data for LLM AI Insights
 * Contains 30 realistic Q&A pairs for Kubernetes monitoring and analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const KUBERNETES_MOCK_DATA: MockQA[] = [
  {
    question:
      "Why are pods in the payment-service deployment constantly restarting?",
    answer: `## Pod Restart Analysis: payment-service

### Current Status
| Metric | Value |
|--------|-------|
| Restart Count (1h) | 47 restarts |
| Affected Pods | 3/3 replicas |
| Last Restart | 2 minutes ago |
| Exit Code | 137 (OOMKilled) |

### Root Cause: Memory Exhaustion

The pods are being **OOMKilled** due to memory limit violations:

\`\`\`yaml
# Current limits
resources:
  limits:
    memory: "256Mi"  # Too low
  requests:
    memory: "128Mi"
\`\`\`

**Memory Usage Pattern:**
- Average: 312Mi
- Peak: 489Mi
- Limit: 256Mi

### Recommendations

1. **Increase memory limits:**
\`\`\`yaml
resources:
  limits:
    memory: "512Mi"
  requests:
    memory: "256Mi"
\`\`\`

2. **Investigate memory leak** in payment processing module
3. **Add memory profiling** to identify allocation hotspots
4. **Consider HPA** based on memory utilization`,
  },
  {
    question:
      "Show me the health status of all nodes in the production cluster",
    answer: `## Production Cluster Node Health

### Node Overview
| Node | Status | CPU | Memory | Pods | Conditions |
|------|--------|-----|--------|------|------------|
| node-prod-01 | Ready | 67% | 72% | 45/110 | Healthy |
| node-prod-02 | Ready | 54% | 68% | 52/110 | Healthy |
| node-prod-03 | Ready | 89% | 85% | 61/110 | ⚠️ Pressure |
| node-prod-04 | Ready | 43% | 51% | 38/110 | Healthy |
| node-prod-05 | NotReady | - | - | 0/110 | ❌ Unreachable |

### Critical Issues

**node-prod-05** is currently **NotReady**:
- Last heartbeat: 15 minutes ago
- Condition: NetworkUnavailable, KubeletNotReady
- Action Required: Check network connectivity and kubelet service

**node-prod-03** is under resource pressure:
- Memory pressure detected
- Eviction threshold approaching
- Consider pod migration or scaling

### Cluster Capacity
- Total Pods: 196/550 (36% utilized)
- Available Capacity: 354 pods
- Node Count: 4/5 healthy`,
  },
  {
    question: "What's causing high latency in the api-gateway pods?",
    answer: `## API Gateway Latency Analysis

### Current Metrics
| Metric | Value | Baseline | Delta |
|--------|-------|----------|-------|
| P50 Latency | 245ms | 45ms | +444% |
| P95 Latency | 1.2s | 180ms | +567% |
| P99 Latency | 3.8s | 450ms | +744% |
| Error Rate | 2.3% | 0.1% | +2200% |

### Root Cause Analysis

1. **DNS Resolution Delays**
   - CoreDNS pods are overloaded
   - ndots:5 causing excessive DNS queries
   - Resolution time: 180ms avg (should be <5ms)

2. **Upstream Service Slowdown**
   - user-service: 890ms avg response
   - inventory-service: 1.2s avg response

3. **Resource Contention**
   - CPU throttling detected (limits too restrictive)
   - Network I/O wait: 34% of request time

### Recommendations

\`\`\`yaml
# Add DNS caching
dnsConfig:
  options:
    - name: ndots
      value: "2"
    - name: single-request-reopen

# Increase CPU limits
resources:
  limits:
    cpu: "2000m"  # Was 500m
\`\`\`

Add connection pooling and circuit breakers for upstream services.`,
  },
  {
    question:
      "Are there any pending or failed deployments in the staging namespace?",
    answer: `## Staging Namespace Deployment Status

### Deployment Summary
| Deployment | Replicas | Ready | Updated | Available | Status |
|------------|----------|-------|---------|-----------|--------|
| user-service | 3 | 3/3 | 3 | 3 | ✅ Running |
| order-service | 2 | 2/2 | 2 | 2 | ✅ Running |
| notification-svc | 3 | 1/3 | 3 | 1 | ⚠️ Progressing |
| analytics-worker | 2 | 0/2 | 2 | 0 | ❌ Failed |
| cache-service | 1 | 1/1 | 1 | 1 | ✅ Running |

### Failed Deployment: analytics-worker

**Status:** ImagePullBackOff
**Reason:** Failed to pull image \`registry.internal/analytics:v2.3.1\`

\`\`\`
Error: rpc error: code = NotFound
desc = failed to pull and unpack image:
image not found in registry
\`\`\`

**Action Required:**
1. Verify image tag exists: \`v2.3.1\`
2. Check registry credentials
3. Rollback to previous version if needed

### Progressing: notification-svc

**Status:** Rolling update in progress
- Old ReplicaSet: 2 pods (terminating)
- New ReplicaSet: 1 pod (ready), 2 pods (pending)
- Pending reason: Insufficient CPU (0/3 nodes schedulable)`,
  },
  {
    question:
      "How can I optimize resource allocation for the data-processing namespace?",
    answer: `## Resource Optimization: data-processing Namespace

### Current Resource Usage

| Workload | CPU Req | CPU Used | Mem Req | Mem Used | Efficiency |
|----------|---------|----------|---------|----------|------------|
| etl-pipeline | 4000m | 890m | 8Gi | 2.1Gi | 22% |
| spark-driver | 2000m | 1800m | 4Gi | 3.8Gi | 92% |
| spark-executor | 8000m | 7200m | 16Gi | 14Gi | 89% |
| kafka-consumer | 1000m | 120m | 2Gi | 450Mi | 15% |
| data-validator | 500m | 480m | 1Gi | 920Mi | 94% |

### Optimization Recommendations

#### 1. Reduce Over-Provisioned Resources
\`\`\`yaml
# etl-pipeline - reduce by 75%
resources:
  requests:
    cpu: "1000m"    # Was 4000m
    memory: "2Gi"   # Was 8Gi
  limits:
    cpu: "2000m"
    memory: "4Gi"

# kafka-consumer - reduce by 80%
resources:
  requests:
    cpu: "200m"     # Was 1000m
    memory: "512Mi" # Was 2Gi
\`\`\`

#### 2. Implement VPA (Vertical Pod Autoscaler)
\`\`\`yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: etl-pipeline-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: etl-pipeline
  updatePolicy:
    updateMode: "Auto"
\`\`\`

### Projected Savings
- **CPU:** 5,110m freed (63% reduction)
- **Memory:** 7.05Gi freed (52% reduction)
- **Cost Impact:** ~$840/month savings`,
  },
  {
    question: "What events are associated with the CrashLoopBackOff pods?",
    answer: `## CrashLoopBackOff Pod Events Analysis

### Affected Pods
| Pod | Namespace | Restarts | Age | Last State |
|-----|-----------|----------|-----|------------|
| auth-service-7d8f9-xk2nm | production | 23 | 45m | Error |
| worker-batch-5c4d3-mn9p | jobs | 15 | 30m | Error |
| metrics-agent-8f7e6-ab1c | monitoring | 8 | 20m | OOMKilled |

### Event Timeline: auth-service-7d8f9-xk2nm

\`\`\`
TIMESTAMP              TYPE      REASON              MESSAGE
12:45:23  Normal   Scheduled           Successfully assigned to node-prod-02
12:45:25  Normal   Pulling             Pulling image "auth-service:v4.2.0"
12:45:28  Normal   Pulled              Successfully pulled image
12:45:28  Normal   Created             Created container auth
12:45:29  Normal   Started             Started container auth
12:45:31  Warning  Unhealthy           Readiness probe failed: connection refused
12:45:34  Warning  BackOff             Back-off restarting failed container
12:46:04  Normal   Pulled              Container image already present
12:46:04  Warning  BackOff             Back-off 20s restarting failed container
\`\`\`

### Root Causes

1. **auth-service:** Missing environment variable \`DATABASE_URL\`
2. **worker-batch:** Exit code 1 - Null pointer in job processor
3. **metrics-agent:** Memory limit 128Mi insufficient (needs 256Mi)

### Quick Fix Commands
\`\`\`bash
# Check container logs
kubectl logs auth-service-7d8f9-xk2nm --previous

# Describe pod for detailed events
kubectl describe pod auth-service-7d8f9-xk2nm
\`\`\``,
  },
  {
    question: "Compare resource utilization across all namespaces",
    answer: `## Namespace Resource Utilization Comparison

### Overview
| Namespace | CPU Req | CPU Used | CPU % | Mem Req | Mem Used | Mem % | Pods |
|-----------|---------|----------|-------|---------|----------|-------|------|
| production | 24000m | 18500m | 77% | 48Gi | 41Gi | 85% | 89 |
| staging | 12000m | 4200m | 35% | 24Gi | 8.5Gi | 35% | 45 |
| development | 8000m | 1200m | 15% | 16Gi | 3.2Gi | 20% | 32 |
| monitoring | 4000m | 3600m | 90% | 8Gi | 7.2Gi | 90% | 12 |
| jobs | 16000m | 14000m | 87% | 32Gi | 28Gi | 87% | 24 |
| kube-system | 2000m | 1800m | 90% | 4Gi | 3.5Gi | 87% | 18 |

### Key Insights

#### High Utilization (Needs Attention)
- **monitoring:** Running at 90% capacity - scale up recommended
- **jobs:** Batch processing at 87% - consider job scheduling optimization
- **production:** Memory at 85% - approaching pressure threshold

#### Low Utilization (Cost Optimization)
- **staging:** Only 35% utilized - reduce resource quotas
- **development:** 15-20% utilized - implement auto-shutdown

### Recommendations

1. **Scale monitoring namespace:**
\`\`\`yaml
# Increase Prometheus resources
resources:
  requests:
    cpu: "2000m"
    memory: "4Gi"
\`\`\`

2. **Add ResourceQuota to development:**
\`\`\`yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
spec:
  hard:
    requests.cpu: "4000m"
    requests.memory: "8Gi"
\`\`\``,
  },
  {
    question: "Why can't the frontend pods schedule on any node?",
    answer: `## Pod Scheduling Failure Analysis: frontend

### Scheduling Status
| Pod | Status | Age | Reason |
|-----|--------|-----|--------|
| frontend-v5-8d7f6-a1b2 | Pending | 15m | Unschedulable |
| frontend-v5-8d7f6-c3d4 | Pending | 15m | Unschedulable |
| frontend-v5-8d7f6-e5f6 | Pending | 15m | Unschedulable |

### Scheduler Events
\`\`\`
Warning  FailedScheduling  15m  default-scheduler
0/5 nodes are available:
  - 2 node(s) had taint {dedicated: database},
    that the pod didn't tolerate
  - 2 node(s) didn't match Pod's node affinity/selector
  - 1 node(s) had insufficient memory
\`\`\`

### Root Cause Analysis

**1. Node Affinity Mismatch**
\`\`\`yaml
# Pod requires:
nodeSelector:
  node-type: frontend
  tier: web

# Available nodes have:
# node-prod-01: node-type=general
# node-prod-02: node-type=general
# node-prod-03: node-type=database (tainted)
# node-prod-04: node-type=database (tainted)
# node-prod-05: node-type=frontend (insufficient memory)
\`\`\`

### Solutions

**Option 1:** Remove strict node selector
\`\`\`yaml
nodeSelector:
  tier: web  # Keep only essential selector
\`\`\`

**Option 2:** Add labels to available nodes
\`\`\`bash
kubectl label nodes node-prod-01 node-type=frontend tier=web
\`\`\`

**Option 3:** Add toleration for database nodes (temporary)
\`\`\`yaml
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "database"
    effect: "NoSchedule"
\`\`\``,
  },
  {
    question:
      "What's the current state of persistent volume claims in production?",
    answer: `## Persistent Volume Claims: Production Namespace

### PVC Overview
| PVC Name | Status | Volume | Capacity | Access | Storage Class |
|----------|--------|--------|----------|--------|---------------|
| postgres-data | Bound | pv-pg-001 | 100Gi | RWO | fast-ssd |
| redis-data | Bound | pv-redis-001 | 20Gi | RWO | fast-ssd |
| elasticsearch-data | Bound | pv-es-001 | 500Gi | RWO | standard |
| minio-storage | Bound | pv-minio-001 | 1Ti | RWX | standard |
| logs-archive | Pending | - | 200Gi | RWO | fast-ssd |
| backup-storage | Lost | pv-backup-001 | 500Gi | RWO | standard |

### Issues Detected

#### 1. Pending PVC: logs-archive
**Reason:** No available PV with matching criteria
\`\`\`
Events:
  Warning  ProvisioningFailed  5m
  storageclass "fast-ssd" does not have enough capacity
  requested: 200Gi, available: 50Gi
\`\`\`

**Solution:** Request storage expansion or use \`standard\` class

#### 2. Lost PVC: backup-storage
**Reason:** Underlying PV was deleted
- Data may be unrecoverable
- Recreate PV from backup if available

### Storage Utilization
| PVC | Capacity | Used | Available | Usage % |
|-----|----------|------|-----------|---------|
| postgres-data | 100Gi | 78Gi | 22Gi | 78% ⚠️ |
| redis-data | 20Gi | 4Gi | 16Gi | 20% |
| elasticsearch-data | 500Gi | 423Gi | 77Gi | 85% ⚠️ |
| minio-storage | 1Ti | 312Gi | 712Gi | 30% |

**Alert:** postgres-data and elasticsearch-data approaching capacity`,
  },
  {
    question: "Show me the ingress configuration issues in the cluster",
    answer: `## Ingress Configuration Analysis

### Ingress Overview
| Ingress | Namespace | Host | Backend | Status |
|---------|-----------|------|---------|--------|
| api-ingress | production | api.telemetryflow.id | api-gateway:8080 | ✅ Active |
| web-ingress | production | www.telemetryflow.id | frontend:80 | ✅ Active |
| admin-ingress | production | admin.telemetryflow.id | admin-ui:3000 | ⚠️ No Backend |
| legacy-api | production | old.telemetryflow.id | legacy-svc:8000 | ❌ Misconfigured |
| grafana | monitoring | grafana.internal | grafana:3000 | ✅ Active |

### Issues Detected

#### 1. No Backend Endpoints: admin-ingress
\`\`\`yaml
# Ingress points to service that has no ready pods
backend:
  service:
    name: admin-ui  # Service exists but no endpoints
    port:
      number: 3000
\`\`\`
**Fix:** Scale admin-ui deployment or check pod health

#### 2. Invalid TLS Configuration: legacy-api
\`\`\`yaml
# Certificate secret not found
tls:
  - hosts:
      - old.telemetryflow.id
    secretName: legacy-tls-cert  # Secret doesn't exist
\`\`\`
**Fix:** Create TLS secret or update cert-manager issuer

#### 3. Missing Annotations: web-ingress
\`\`\`yaml
# Recommended annotations missing
metadata:
  annotations:
    # Add these:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
\`\`\`

### Health Check Summary
- Active ingresses: 3
- With issues: 2
- Total backends: 5
- Healthy backends: 3`,
  },
  {
    question: "Analyze the HPA (Horizontal Pod Autoscaler) effectiveness",
    answer: `## HPA Effectiveness Analysis

### HPA Status Overview
| HPA | Target | Min | Max | Current | Desired | CPU Target | CPU Actual |
|-----|--------|-----|-----|---------|---------|------------|------------|
| api-gateway | Deployment | 3 | 20 | 8 | 8 | 70% | 68% |
| user-service | Deployment | 2 | 10 | 2 | 5 | 80% | 156% ⚠️ |
| order-service | Deployment | 3 | 15 | 15 | 15 | 60% | 89% ⚠️ |
| notification | Deployment | 1 | 5 | 1 | 1 | 50% | 12% |
| search-svc | Deployment | 2 | 8 | 4 | 4 | 70% | 71% |

### Issues Identified

#### 1. user-service: Unable to Scale
**Status:** ScalingLimited
**Reason:** Maximum replicas reached, demand exceeds capacity
\`\`\`
Current: 2 pods at 156% CPU (target: 80%)
Desired: 5 pods but max is 10
Problem: Pods aren't scaling despite high CPU
\`\`\`
**Cause:** Insufficient cluster resources
**Fix:** Increase max replicas or add nodes

#### 2. order-service: At Maximum
**Status:** At max replicas (15)
**Current CPU:** 89% (above 60% target)
\`\`\`
Recommendation:
- Increase maxReplicas to 25
- Or optimize service performance
- Consider VPA for vertical scaling
\`\`\`

### Scaling Recommendations

\`\`\`yaml
# Improved HPA for user-service
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  minReplicas: 3     # Increase from 2
  maxReplicas: 20    # Increase from 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # Lower threshold
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30  # Faster scale-up
\`\`\``,
  },
  {
    question: "What services are affected by the network policy restrictions?",
    answer: `## Network Policy Impact Analysis

### Current Network Policies
| Policy | Namespace | Pods Selected | Ingress | Egress |
|--------|-----------|---------------|---------|--------|
| default-deny | production | All | ❌ Deny | ❌ Deny |
| allow-frontend | production | app=frontend | ✅ Allow | Limited |
| allow-api | production | app=api | ✅ Allow | ✅ Allow |
| db-isolation | database | tier=db | Limited | ❌ Deny |
| monitoring-access | monitoring | All | ✅ Allow | ✅ Allow |

### Affected Services

#### 1. Blocked: payment-service → external-gateway
\`\`\`yaml
# payment-service cannot reach external payment APIs
# Policy: default-deny blocks all egress
# Required: Allow egress to payment.stripe.com
\`\`\`

#### 2. Blocked: worker-service → redis
\`\`\`yaml
# worker pods cannot connect to Redis
# Policy: db-isolation restricts ingress
# Fix needed:
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-worker-redis
spec:
  podSelector:
    matchLabels:
      tier: db
      app: redis
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: worker-service
      ports:
        - port: 6379
\`\`\`

#### 3. Partially Blocked: frontend → api-gateway
| Source | Destination | Port | Status |
|--------|-------------|------|--------|
| frontend | api-gateway | 8080 | ✅ Allowed |
| frontend | api-gateway | 8081 | ❌ Blocked |
| frontend | user-service | 3000 | ❌ Blocked |

### Connectivity Matrix
\`\`\`
         Frontend  API  User  Order  DB   Redis  External
Frontend    -      ✅    ❌     ❌    ❌    ❌      ✅
API         ❌      -    ✅     ✅    ✅    ✅      ✅
User        ❌     ✅     -     ✅    ✅    ✅      ❌
Order       ❌     ✅    ✅      -    ✅    ✅      ✅
\`\`\``,
  },
  {
    question: "How do I troubleshoot the failing liveness probes?",
    answer: `## Liveness Probe Failure Troubleshooting

### Pods with Failing Liveness Probes
| Pod | Namespace | Failures | Threshold | Action Taken |
|-----|-----------|----------|-----------|--------------|
| api-v3-8d7f6 | production | 12/3 | 3 | Restarted 4x |
| auth-service-5c4d3 | production | 8/3 | 3 | Restarted 2x |
| worker-9a8b7 | jobs | 5/5 | 5 | Restarting |
| cache-proxy-2e1d0 | production | 2/3 | 3 | Warning |

### Probe Configuration Analysis

#### api-v3: HTTP Probe Timeout
\`\`\`yaml
# Current (too aggressive):
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5   # App needs 15s to start
  periodSeconds: 5
  timeoutSeconds: 1        # Too short for health check
  failureThreshold: 3

# Recommended:
livenessProbe:
  httpGet:
    path: /health/live     # Lightweight endpoint
    port: 8080
  initialDelaySeconds: 30  # Allow startup time
  periodSeconds: 10
  timeoutSeconds: 5        # Allow slow responses
  failureThreshold: 3
\`\`\`

#### auth-service: Wrong Port
\`\`\`yaml
# Issue: Probe targeting wrong port
livenessProbe:
  tcpSocket:
    port: 3000  # App listens on 8080
# Fix: Change to port 8080
\`\`\`

### Debugging Commands
\`\`\`bash
# Check probe endpoint manually
kubectl exec -it api-v3-8d7f6 -- curl -v localhost:8080/health

# View probe events
kubectl describe pod api-v3-8d7f6 | grep -A 20 "Events"

# Check container startup time
kubectl logs api-v3-8d7f6 --timestamps | head -50
\`\`\`

### Best Practices
| Aspect | Recommendation |
|--------|----------------|
| Initial Delay | Match application startup time |
| Timeout | 2-5 seconds for HTTP probes |
| Period | 10-30 seconds to reduce load |
| Endpoint | Use lightweight /healthz endpoint |
| Separate | Use different endpoints for liveness vs readiness |`,
  },
  {
    question: "What's the status of the cert-manager certificates?",
    answer: `## Certificate Manager Status

### Certificate Overview
| Certificate | Namespace | Secret | Issuer | Status | Expiry |
|-------------|-----------|--------|--------|--------|--------|
| api-tls | production | api-tls-secret | letsencrypt-prod | ✅ Ready | 58 days |
| web-tls | production | web-tls-secret | letsencrypt-prod | ✅ Ready | 45 days |
| admin-tls | production | admin-tls-secret | letsencrypt-prod | ⚠️ Renewing | 5 days |
| internal-tls | internal | internal-secret | internal-ca | ✅ Ready | 320 days |
| grafana-tls | monitoring | grafana-secret | letsencrypt-prod | ❌ Failed | Expired |

### Issues Detected

#### 1. Failed Certificate: grafana-tls
\`\`\`
Status: False
Reason: Failed
Message: The certificate request has failed to complete and
will be retried: Failed to determine a]uffix to use for
the challenge solver: no configured challenge solvers can
be used for this challenge
\`\`\`

**Root Cause:** DNS01 challenge solver misconfigured
**Fix:**
\`\`\`yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: grafana-tls
spec:
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  # Add HTTP01 solver as fallback
  acme:
    solvers:
      - http01:
          ingress:
            class: nginx
\`\`\`

#### 2. Expiring Soon: admin-tls
- Expires in: 5 days
- Auto-renewal status: In progress
- Last renewal attempt: 2 hours ago

### Certificate Health Summary
| Status | Count | Action |
|--------|-------|--------|
| ✅ Ready | 3 | None |
| ⚠️ Renewing | 1 | Monitor |
| ❌ Failed | 1 | Fix configuration |

### Commands
\`\`\`bash
# Check certificate status
kubectl get certificates -A

# Force renewal
kubectl cert-manager renew grafana-tls -n monitoring

# Check challenges
kubectl get challenges -A
\`\`\``,
  },
  {
    question:
      "Analyze the ConfigMap and Secret usage in the production namespace",
    answer: `## ConfigMap & Secret Analysis: Production

### ConfigMap Summary
| ConfigMap | Keys | Mounted By | Last Updated | Size |
|-----------|------|------------|--------------|------|
| app-config | 12 | 8 pods | 3 days ago | 4.2KB |
| nginx-config | 3 | 2 pods | 2 weeks ago | 1.8KB |
| feature-flags | 24 | 15 pods | 5 hours ago | 2.1KB |
| env-config | 8 | 12 pods | 1 month ago | 892B |
| logging-config | 5 | All pods | 6 months ago | 1.4KB |

### Secret Summary
| Secret | Type | Keys | Used By | Age |
|--------|------|------|---------|-----|
| db-credentials | Opaque | 3 | 4 deployments | 45 days |
| api-keys | Opaque | 8 | 6 deployments | 12 days |
| tls-certs | kubernetes.io/tls | 2 | 3 ingresses | 30 days |
| registry-creds | kubernetes.io/dockerconfigjson | 1 | All pods | 90 days |
| jwt-signing | Opaque | 2 | auth-service | 180 days ⚠️ |

### Issues Identified

#### 1. Stale Secret: jwt-signing
- **Age:** 180 days (6 months)
- **Recommendation:** Rotate JWT signing keys
- **Risk:** Extended exposure window if compromised

#### 2. Unused ConfigMaps
| ConfigMap | Last Access | Pods Using |
|-----------|-------------|------------|
| legacy-config | Never | 0 |
| test-config | 45 days ago | 0 |
| old-feature-flags | 30 days ago | 0 |

#### 3. Secret Sprawl
- 3 secrets contain duplicate database credentials
- Recommendation: Use ExternalSecrets or Vault

### Best Practices Check
| Practice | Status |
|----------|--------|
| Secrets encrypted at rest | ✅ Enabled |
| RBAC for secrets access | ⚠️ Too permissive |
| ConfigMap immutability | ❌ Not enabled |
| Secret rotation policy | ❌ Not implemented |

\`\`\`bash
# Find unused ConfigMaps
kubectl get configmap -o json | jq '.items[] |
  select(.metadata.annotations."kubectl.kubernetes.io/last-applied-configuration" == null)'
\`\`\``,
  },
  {
    question: "What container images need security updates?",
    answer: `## Container Image Security Scan Results

### Critical Vulnerabilities
| Image | Tag | Critical | High | Medium | Action |
|-------|-----|----------|------|--------|--------|
| nginx | 1.19.0 | 4 | 12 | 28 | 🔴 Update immediately |
| node | 14.15.0 | 2 | 8 | 15 | 🔴 Update to 18.x LTS |
| postgres | 12.4 | 1 | 5 | 11 | 🟡 Update to 12.17+ |
| redis | 6.0.9 | 0 | 3 | 8 | 🟡 Update to 6.2+ |
| alpine | 3.12 | 0 | 2 | 5 | 🟡 Update to 3.19 |

### Detailed CVE Analysis

#### nginx:1.19.0 - Critical
| CVE | Severity | Description |
|-----|----------|-------------|
| CVE-2021-23017 | Critical | DNS resolver vulnerability |
| CVE-2021-3618 | Critical | ALPN buffer overflow |
| CVE-2022-41741 | Critical | MP4 module memory corruption |
| CVE-2022-41742 | Critical | MP4 module memory disclosure |

**Fix:** Update to nginx:1.25.3
\`\`\`yaml
# deployment.yaml
containers:
  - name: nginx
    image: nginx:1.25.3-alpine  # Was 1.19.0
\`\`\`

#### node:14.15.0 - Critical
| CVE | Severity | Component |
|-----|----------|-----------|
| CVE-2023-32002 | Critical | Policy bypass |
| CVE-2023-32006 | Critical | Permissions |

**Fix:** Update to node:20.11.0-alpine or 18.19.0-alpine

### Image Update Priority
1. **Immediate:** nginx, node (Critical CVEs)
2. **This week:** postgres (1 Critical)
3. **This month:** redis, alpine (High only)

### Scan Summary
- Total images scanned: 45
- Images with criticals: 3
- Images up to date: 38
- Average image age: 6.2 months`,
  },
  {
    question: "Show me the pod disruption budgets and their effectiveness",
    answer: `## Pod Disruption Budget Analysis

### PDB Overview
| PDB | Selector | Min Available | Max Unavailable | Current | Disruptions Allowed |
|-----|----------|---------------|-----------------|---------|---------------------|
| api-gateway-pdb | app=api-gateway | 2 | - | 5 pods | 3 ✅ |
| user-service-pdb | app=user-service | 80% | - | 4 pods | 0 ⚠️ |
| order-service-pdb | - | - | 1 | 6 pods | 1 ✅ |
| database-pdb | app=postgres | 1 | - | 1 pod | 0 ❌ |
| redis-pdb | app=redis | 2 | - | 3 pods | 1 ✅ |

### Issues Identified

#### 1. user-service-pdb: No Disruptions Allowed
**Problem:** With 4 pods and minAvailable=80%, only 3.2 pods can be unavailable, meaning 0 disruptions allowed during maintenance.
\`\`\`yaml
# Current (too restrictive)
spec:
  minAvailable: 80%  # = 3.2 pods minimum

# Recommended
spec:
  maxUnavailable: 1  # Allow 1 pod disruption
  # Or
  minAvailable: 3    # Explicit pod count
\`\`\`

#### 2. database-pdb: Single Replica Blocking
**Problem:** PDB with minAvailable=1 on a single-replica StatefulSet blocks all voluntary disruptions.
**Impact:** Node drains will be blocked indefinitely

**Solution Options:**
1. Add a read replica to allow disruptions
2. Accept the risk and remove PDB for maintenance windows
3. Use \`maxUnavailable: 0\` (same effect but explicit)

### Recent Disruption Events
| Time | PDB | Event | Result |
|------|-----|-------|--------|
| 2h ago | database-pdb | Node drain attempted | ❌ Blocked |
| 1d ago | api-gateway-pdb | Rolling update | ✅ Allowed |
| 3d ago | user-service-pdb | Cluster upgrade | ⚠️ Delayed 45m |

### Recommendations
\`\`\`yaml
# Template for highly available services
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ha-service-pdb
spec:
  maxUnavailable: 25%  # Or fixed number
  selector:
    matchLabels:
      app: ha-service
\`\`\``,
  },
  {
    question: "What Kubernetes jobs have failed recently?",
    answer: `## Failed Kubernetes Jobs Analysis

### Job Failure Summary (Last 24h)
| Job | Namespace | Type | Failures | Last Run | Status |
|-----|-----------|------|----------|----------|--------|
| backup-db-prod | production | CronJob | 3/3 | 2h ago | ❌ Failed |
| etl-daily | data | CronJob | 1/3 | 6h ago | ⚠️ Partial |
| report-generator | reporting | CronJob | 2/3 | 4h ago | ❌ Failed |
| cleanup-logs | maintenance | CronJob | 0/1 | 12h ago | ✅ Success |
| migration-v5 | production | Job | 1/1 | 18h ago | ❌ Failed |

### Detailed Failure Analysis

#### backup-db-prod: All Attempts Failed
\`\`\`
Pod: backup-db-prod-28422240-xk9mn
Exit Code: 1
Reason: Error

Container Logs:
pg_dump: error: connection to server failed:
FATAL: password authentication failed for user "backup_user"
\`\`\`

**Root Cause:** Credential rotation broke backup job
**Fix:** Update secret \`backup-credentials\` with new password

#### etl-daily: Partial Failure
\`\`\`
Completion: 2/3 tasks completed
Failed Task: data-transform-stage
Exit Code: 137 (OOMKilled)

Memory Usage:
- Limit: 2Gi
- Peak: 2.8Gi
\`\`\`

**Fix:** Increase memory limit to 4Gi

#### migration-v5: Schema Conflict
\`\`\`
Error: relation "users_v2" already exists
Command: CREATE TABLE users_v2 ...
\`\`\`

**Fix:** Add IF NOT EXISTS or drop table first

### Failed Jobs Cleanup
\`\`\`bash
# List failed jobs
kubectl get jobs --field-selector status.successful=0

# Delete failed jobs older than 24h
kubectl delete jobs --field-selector status.successful=0 \\
  --selector='!keep' --all-namespaces
\`\`\`

### CronJob Configuration Check
| Setting | backup-db-prod | Recommendation |
|---------|---------------|----------------|
| backoffLimit | 3 | ✅ Good |
| activeDeadlineSeconds | Not set | Set to 3600 |
| concurrencyPolicy | Allow | Change to Forbid |
| failedJobsHistoryLimit | 1 | Increase to 3 |`,
  },
  {
    question: "Analyze the service mesh configuration and performance",
    answer: `## Service Mesh (Istio) Analysis

### Mesh Status Overview
| Component | Status | Version | Health |
|-----------|--------|---------|--------|
| istiod | Running | 1.19.3 | ✅ Healthy |
| istio-ingressgateway | Running | 1.19.3 | ✅ Healthy |
| istio-egressgateway | Running | 1.19.3 | ⚠️ High CPU |
| kiali | Running | 1.73.0 | ✅ Healthy |
| jaeger | Running | 1.50.0 | ✅ Healthy |

### Sidecar Injection Status
| Namespace | Injection | Pods | Sidecar % |
|-----------|-----------|------|-----------|
| production | Enabled | 45 | 100% |
| staging | Enabled | 23 | 87% ⚠️ |
| jobs | Disabled | 12 | 0% |
| monitoring | Enabled | 8 | 100% |

### Performance Metrics
| Metric | Current | Baseline | Status |
|--------|---------|----------|--------|
| Proxy CPU (avg) | 45m | 30m | ⚠️ +50% |
| Proxy Memory (avg) | 89Mi | 70Mi | ⚠️ +27% |
| Latency overhead | 3.2ms | 2ms | ⚠️ +60% |
| mTLS coverage | 94% | 100% | ⚠️ Gap |

### Issues Detected

#### 1. mTLS Gap: 6% Unencrypted Traffic
\`\`\`yaml
# Non-mTLS connections detected:
- legacy-service → database (PERMISSIVE mode)
- external-api → api-gateway (No sidecar)

# Fix: Enable STRICT mode
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
\`\`\`

#### 2. Missing Sidecars: staging namespace
3 pods without sidecars:
- legacy-worker-v1 (annotation: sidecar.istio.io/inject: "false")
- batch-job-runner (init container conflict)
- debug-pod (excluded by policy)

#### 3. High Egress Gateway Load
\`\`\`
CPU: 890m / 1000m (89%)
Connections: 12,450 active
Recommendation: Scale to 3 replicas
\`\`\`

### Traffic Policies Check
| Policy Type | Count | Issues |
|-------------|-------|--------|
| VirtualService | 24 | 2 invalid |
| DestinationRule | 18 | 1 missing subset |
| Gateway | 5 | 0 |
| AuthorizationPolicy | 12 | 3 overly permissive |`,
  },
  {
    question:
      "What's causing the high memory usage in the monitoring namespace?",
    answer: `## Memory Analysis: Monitoring Namespace

### Current Memory Usage
| Pod | Requests | Limits | Used | Usage % |
|-----|----------|--------|------|---------|
| prometheus-0 | 4Gi | 8Gi | 7.2Gi | 90% ⚠️ |
| alertmanager-0 | 256Mi | 512Mi | 489Mi | 95% ⚠️ |
| grafana-7d8f6 | 512Mi | 1Gi | 680Mi | 66% |
| loki-0 | 2Gi | 4Gi | 3.6Gi | 90% ⚠️ |
| promtail-* (5x) | 128Mi | 256Mi | 180Mi | 70% |

### Root Cause Analysis

#### 1. Prometheus: Cardinality Explosion
\`\`\`
Active Time Series: 2.4M (was 800K)
Cardinality Growth: 200% in 7 days

Top Cardinality Offenders:
1. http_requests_total (labels: 45K combinations)
2. container_memory_usage_bytes (all containers)
3. custom_business_metrics (unbounded user_id label)
\`\`\`

**High Cardinality Labels:**
| Metric | Label | Unique Values |
|--------|-------|---------------|
| http_requests_total | user_id | 28,000 |
| http_requests_total | request_id | 150,000 |
| custom_app_metric | session_id | 45,000 |

**Fix:** Remove high-cardinality labels
\`\`\`yaml
# prometheus-config
metric_relabel_configs:
  - source_labels: [__name__]
    regex: 'http_requests_total'
    action: labeldrop
    regex: 'user_id|request_id'
\`\`\`

#### 2. Loki: Log Volume Spike
\`\`\`
Ingestion Rate: 15MB/s (was 5MB/s)
Cause: Debug logging enabled in production
Streams: 12,000 active (threshold: 5,000)
\`\`\`

### Memory Optimization Plan

| Action | Impact | Effort |
|--------|--------|--------|
| Drop high-cardinality labels | -40% Prometheus | Low |
| Reduce retention to 15d | -25% Prometheus | Low |
| Disable debug logging | -60% Loki | Low |
| Add memory limits | Prevent OOM | Low |
| Enable Prometheus compaction | -15% | Medium |

### Immediate Actions
\`\`\`bash
# Increase Prometheus memory temporarily
kubectl set resources deployment prometheus --limits=memory=12Gi

# Scale alertmanager
kubectl scale statefulset alertmanager --replicas=2
\`\`\``,
  },
  {
    question: "How do I set up proper resource quotas for new namespaces?",
    answer: `## Resource Quota Configuration Guide

### Recommended Quota Template by Environment

#### Production Namespace
\`\`\`yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    # Compute Resources
    requests.cpu: "100"
    requests.memory: "200Gi"
    limits.cpu: "200"
    limits.memory: "400Gi"

    # Object Counts
    pods: "200"
    services: "50"
    secrets: "100"
    configmaps: "100"
    persistentvolumeclaims: "50"

    # Storage
    requests.storage: "1Ti"

    # Priority Classes
    count/deployments.apps: "50"
    count/statefulsets.apps: "20"
    count/jobs.batch: "100"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: production-limits
  namespace: production
spec:
  limits:
    - default:
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "4"
        memory: "8Gi"
      min:
        cpu: "50m"
        memory: "64Mi"
      type: Container
\`\`\`

#### Development Namespace
\`\`\`yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: development-quota
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    pods: "50"
    services: "20"
    persistentvolumeclaims: "10"
    requests.storage: "100Gi"
\`\`\`

### Quota Recommendations by Team Size
| Team Size | CPU Req | Memory Req | Pods | Storage |
|-----------|---------|------------|------|---------|
| Small (1-5) | 10 | 20Gi | 30 | 50Gi |
| Medium (5-15) | 30 | 60Gi | 75 | 200Gi |
| Large (15+) | 100 | 200Gi | 200 | 500Gi |

### Applying Quotas
\`\`\`bash
# Create namespace with quotas
kubectl create namespace new-team
kubectl apply -f quota.yaml -n new-team

# Verify quota
kubectl describe resourcequota -n new-team

# Check usage
kubectl get resourcequota -n new-team -o yaml
\`\`\`

### Monitoring Quota Usage
Add Prometheus alerts:
\`\`\`yaml
- alert: NamespaceQuotaNearLimit
  expr: |
    kube_resourcequota{type="used"} /
    kube_resourcequota{type="hard"} > 0.9
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Namespace {{ $labels.namespace }} near quota limit"
\`\`\``,
  },
  {
    question: "What's the current cluster autoscaler behavior?",
    answer: `## Cluster Autoscaler Analysis

### Autoscaler Configuration
| Setting | Value |
|---------|-------|
| Min Nodes | 3 |
| Max Nodes | 20 |
| Current Nodes | 8 |
| Scale Down Delay | 10m |
| Scale Down Utilization | 50% |
| Scan Interval | 10s |

### Node Pool Status
| Pool | Type | Min | Max | Current | Status |
|------|------|-----|-----|---------|--------|
| general-pool | n2-standard-4 | 2 | 10 | 5 | ✅ Scaling |
| compute-pool | n2-highmem-8 | 1 | 5 | 2 | ✅ Stable |
| gpu-pool | n1-standard-8-t4 | 0 | 3 | 1 | ✅ Stable |

### Recent Scaling Events
| Time | Event | Reason | Result |
|------|-------|--------|--------|
| 15m ago | Scale Up | Pending pods (12) | +2 nodes |
| 45m ago | Scale Up | CPU pressure | +1 node |
| 2h ago | Scale Down | Low utilization | -1 node |
| 6h ago | Scale Down Blocked | PDB restriction | No action |

### Pending Pods Analysis
\`\`\`
Total Pending: 8 pods
Schedulable: 5 (waiting for scale-up)
Unschedulable: 3 (resource constraints)

Unschedulable Reasons:
- 2 pods: node selector doesn't match any node
- 1 pod: PVC not bound
\`\`\`

### Scaling Efficiency
| Metric | Last 24h |
|--------|----------|
| Scale Up Events | 7 |
| Scale Down Events | 3 |
| Avg Scale Up Time | 3.2 min |
| Failed Scale Ups | 1 (quota limit) |
| Nodes Wasted (underutilized) | 1.2 |

### Issues Detected

#### 1. Scale Down Blocked Frequently
\`\`\`
Reason: Pod "prometheus-0" has local storage
Node: node-general-004 (45% utilized)
Blocked for: 6 hours
\`\`\`

**Fix:** Enable safe eviction annotation:
\`\`\`yaml
annotations:
  cluster-autoscaler.kubernetes.io/safe-to-evict: "true"
\`\`\`

#### 2. GPU Pool Never Scales Down
\`\`\`
Current: 1 node
Utilization: 5%
Reason: GPU pods have anti-affinity
\`\`\`

### Recommendations
\`\`\`yaml
# Optimize autoscaler config
--scale-down-utilization-threshold=0.65
--scale-down-delay-after-add=5m
--skip-nodes-with-local-storage=false
--balance-similar-node-groups=true
\`\`\``,
  },
  {
    question: "Analyze the DaemonSet rollout status across all nodes",
    answer: `## DaemonSet Rollout Analysis

### DaemonSet Overview
| DaemonSet | Namespace | Desired | Current | Ready | Up-to-date | Status |
|-----------|-----------|---------|---------|-------|------------|--------|
| fluentd | logging | 8 | 8 | 8 | 8 | ✅ Ready |
| node-exporter | monitoring | 8 | 8 | 8 | 8 | ✅ Ready |
| calico-node | kube-system | 8 | 8 | 6 | 8 | ⚠️ Degraded |
| kube-proxy | kube-system | 8 | 8 | 8 | 5 | ⚠️ Updating |
| datadog-agent | monitoring | 8 | 8 | 7 | 8 | ⚠️ Degraded |

### Issues Detected

#### 1. calico-node: 2 Pods Not Ready
| Node | Pod | Status | Reason |
|------|-----|--------|--------|
| node-05 | calico-node-x9k2m | NotReady | CrashLoopBackOff |
| node-07 | calico-node-p3n4q | NotReady | Init:Error |

**Pod Events (node-05):**
\`\`\`
Warning  Unhealthy  2m  kubelet
Readiness probe failed: calico/node is not ready:
BIRD is not ready: BGP not established
\`\`\`

**Root Cause:** BGP peering failure
**Fix:** Check node network configuration

#### 2. kube-proxy: Rolling Update in Progress
\`\`\`
Update Strategy: RollingUpdate
Max Unavailable: 1
Progress: 5/8 nodes updated
Current Image: kube-proxy:v1.28.4
New Image: kube-proxy:v1.28.5
\`\`\`

**Stuck on nodes:** node-03, node-06, node-08
**Reason:** Pods terminating slowly (grace period)

#### 3. datadog-agent: Resource Issue
\`\`\`
Node: node-02
Status: Pending
Reason: Insufficient memory
Required: 512Mi
Available: 256Mi
\`\`\`

### Rollout Commands
\`\`\`bash
# Check rollout status
kubectl rollout status daemonset/kube-proxy -n kube-system

# Force restart stuck pods
kubectl rollout restart daemonset/calico-node -n kube-system

# Pause rollout if issues
kubectl rollout pause daemonset/kube-proxy -n kube-system

# Resume rollout
kubectl rollout resume daemonset/kube-proxy -n kube-system
\`\`\`

### Update Strategy Recommendations
\`\`\`yaml
updateStrategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1  # Or 10% for large clusters
    maxSurge: 0  # DaemonSets don't support surge
\`\`\``,
  },
  {
    question: "What are the top resource consumers in the cluster?",
    answer: `## Top Resource Consumers Analysis

### Top 10 CPU Consumers
| Rank | Pod | Namespace | CPU Used | CPU Limit | % of Limit |
|------|-----|-----------|----------|-----------|------------|
| 1 | prometheus-0 | monitoring | 3.8 cores | 4 cores | 95% |
| 2 | elasticsearch-0 | logging | 3.2 cores | 4 cores | 80% |
| 3 | kafka-0 | streaming | 2.9 cores | 4 cores | 72% |
| 4 | spark-driver-01 | analytics | 2.4 cores | 3 cores | 80% |
| 5 | api-gateway-8d7f6 | production | 1.8 cores | 2 cores | 90% |
| 6 | redis-master-0 | production | 1.5 cores | 2 cores | 75% |
| 7 | postgres-primary | database | 1.4 cores | 2 cores | 70% |
| 8 | worker-batch-5c4d3 | jobs | 1.2 cores | 2 cores | 60% |
| 9 | grafana-7d8f6 | monitoring | 1.1 cores | 2 cores | 55% |
| 10 | nginx-ingress-abc | ingress | 0.9 cores | 1 core | 90% |

### Top 10 Memory Consumers
| Rank | Pod | Namespace | Memory Used | Memory Limit | % of Limit |
|------|-----|-----------|-------------|--------------|------------|
| 1 | elasticsearch-0 | logging | 14.2Gi | 16Gi | 89% |
| 2 | kafka-0 | streaming | 7.8Gi | 8Gi | 97% ⚠️ |
| 3 | prometheus-0 | monitoring | 7.2Gi | 8Gi | 90% |
| 4 | spark-executor-* | analytics | 6.4Gi | 8Gi | 80% |
| 5 | postgres-primary | database | 4.1Gi | 6Gi | 68% |
| 6 | redis-master-0 | production | 3.8Gi | 4Gi | 95% ⚠️ |
| 7 | loki-0 | logging | 3.6Gi | 4Gi | 90% |
| 8 | mongodb-0 | database | 2.9Gi | 4Gi | 72% |
| 9 | api-gateway-* | production | 2.4Gi | 3Gi | 80% |
| 10 | node-0 | blockchain | 2.1Gi | 4Gi | 52% |

### Critical Alerts

| Pod | Resource | Status | Action |
|-----|----------|--------|--------|
| kafka-0 | Memory 97% | ⚠️ Critical | Scale up or optimize |
| redis-master-0 | Memory 95% | ⚠️ Critical | Eviction risk |
| prometheus-0 | CPU 95% | ⚠️ Warning | Add resources |
| api-gateway | CPU 90% | ⚠️ Warning | Scale horizontally |

### Namespace Resource Summary
| Namespace | CPU (used/req) | Memory (used/req) | Efficiency |
|-----------|----------------|-------------------|------------|
| monitoring | 7.2/10 cores | 15Gi/20Gi | 72% |
| production | 12.4/20 cores | 28Gi/40Gi | 65% |
| logging | 4.5/8 cores | 18Gi/24Gi | 70% |
| database | 3.8/6 cores | 9Gi/14Gi | 62% |

### Optimization Opportunities
- **kafka-0:** Consider adding heap size or partitioning
- **redis-master-0:** Enable memory eviction policy or add replicas
- **prometheus:** Reduce retention or cardinality`,
  },
  {
    question: "Show me the RBAC configuration issues in the cluster",
    answer: `## RBAC Security Analysis

### Overly Permissive Roles
| Role/ClusterRole | Namespace | Risk Level | Issue |
|------------------|-----------|------------|-------|
| admin-full-access | cluster-wide | 🔴 Critical | Wildcard permissions |
| developer-role | production | 🟡 High | Can delete pods |
| cicd-role | all namespaces | 🔴 Critical | Secrets access |
| monitoring-role | monitoring | 🟢 Low | Read-only, appropriate |

### Critical Findings

#### 1. Wildcard Permissions Detected
\`\`\`yaml
# admin-full-access ClusterRole
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]  # 🔴 God mode - never use in production
\`\`\`

**Bound to:**
- ServiceAccount: admin-sa (production)
- User: john@company.com
- Group: platform-team

#### 2. Secrets Access Too Broad
\`\`\`yaml
# cicd-role
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch", "create", "update"]
    # 🔴 Can access ALL secrets in ALL namespaces
\`\`\`

**Recommendation:**
\`\`\`yaml
# Restrict to specific secrets
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["cicd-credentials", "registry-secret"]
    verbs: ["get"]
\`\`\`

#### 3. Service Accounts with Cluster Admin
| ServiceAccount | Namespace | Binding | Risk |
|----------------|-----------|---------|------|
| default | kube-system | cluster-admin | 🔴 Critical |
| jenkins-sa | cicd | cluster-admin | 🔴 Critical |
| argocd-server | argocd | cluster-admin | 🟡 Review |

### RBAC Best Practices Violations
| Practice | Status | Count |
|----------|--------|-------|
| Default SA with privileges | ❌ Violation | 3 |
| Wildcard verbs | ❌ Violation | 5 |
| Wildcard resources | ❌ Violation | 2 |
| Namespace-scoped roles | ⚠️ Partial | 12/18 |
| Least privilege | ❌ Violation | 8 roles |

### Remediation Steps
\`\`\`bash
# Audit current permissions
kubectl auth can-i --list --as=system:serviceaccount:production:admin-sa

# Find all cluster-admin bindings
kubectl get clusterrolebindings -o json | jq '.items[] |
  select(.roleRef.name=="cluster-admin") | .subjects[]'

# Remove dangerous binding
kubectl delete clusterrolebinding admin-full-access-binding
\`\`\``,
  },
  {
    question: "Why is pod anti-affinity causing scheduling failures?",
    answer: `## Pod Anti-Affinity Scheduling Analysis

### Failing Pods Due to Anti-Affinity
| Pod | Namespace | Status | Time Pending |
|-----|-----------|--------|--------------|
| api-gateway-v2-8x9y | production | Pending | 45 minutes |
| cache-service-3a4b | production | Pending | 2 hours |
| order-service-5c6d | production | Pending | 30 minutes |

### Anti-Affinity Configuration Analysis

#### api-gateway-v2: Hard Anti-Affinity
\`\`\`yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:  # HARD
      - labelSelector:
          matchLabels:
            app: api-gateway
        topologyKey: kubernetes.io/hostname

# Problem:
# - 5 nodes in cluster
# - 5 api-gateway pods already running
# - 6th pod CANNOT be scheduled (no node available)
\`\`\`

#### Scheduler Output
\`\`\`
0/5 nodes are available:
  - 5 node(s) didn't match pod anti-affinity rules
\`\`\`

### Node Distribution
| Node | api-gateway | cache-service | order-service |
|------|-------------|---------------|---------------|
| node-01 | 1 ✓ | 1 ✓ | 2 |
| node-02 | 1 ✓ | 1 ✓ | 1 |
| node-03 | 1 ✓ | 1 ✓ | 2 |
| node-04 | 1 ✓ | 1 ✓ | 1 |
| node-05 | 1 ✓ | 1 ✓ | 1 |

### Solutions

#### Option 1: Convert to Soft Anti-Affinity
\`\`\`yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:  # SOFT
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: api-gateway
          topologyKey: kubernetes.io/hostname
\`\`\`

#### Option 2: Use Zone-Based Distribution
\`\`\`yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: api-gateway
        topologyKey: topology.kubernetes.io/zone  # Zone instead of node
\`\`\`

#### Option 3: Add More Nodes
\`\`\`bash
# Scale node pool
gcloud container clusters resize my-cluster \\
  --node-pool general-pool --num-nodes 8
\`\`\`

### Recommendation Matrix
| Approach | Availability | Cost | Complexity |
|----------|--------------|------|------------|
| Soft anti-affinity | Medium | None | Low |
| Zone distribution | High | None | Low |
| Add nodes | High | High | Medium |
| Reduce replicas | Low | None | Low |`,
  },
  {
    question: "What are the Kubernetes API server performance metrics?",
    answer: `## API Server Performance Analysis

### Request Latency
| Verb | Resource | P50 | P90 | P99 | Status |
|------|----------|-----|-----|-----|--------|
| GET | pods | 12ms | 45ms | 120ms | ✅ Good |
| LIST | pods | 89ms | 350ms | 1.2s | ⚠️ Slow |
| GET | secrets | 8ms | 25ms | 80ms | ✅ Good |
| LIST | events | 156ms | 890ms | 2.8s | 🔴 Critical |
| WATCH | all | 2ms | 5ms | 15ms | ✅ Good |
| CREATE | pods | 45ms | 180ms | 450ms | ✅ Good |
| DELETE | pods | 78ms | 290ms | 780ms | ⚠️ Monitor |

### Request Rate
| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Total QPS | 450 | 1000 | ✅ 45% |
| Mutating QPS | 85 | 200 | ✅ 42% |
| Read QPS | 365 | 800 | ✅ 46% |
| Inflight Requests | 23 | 400 | ✅ 6% |

### Top API Consumers (Last Hour)
| Client | Requests | % Total | Throttled |
|--------|----------|---------|-----------|
| kube-controller-manager | 125,000 | 28% | 0 |
| kube-scheduler | 89,000 | 20% | 0 |
| prometheus | 67,000 | 15% | 234 ⚠️ |
| argocd | 45,000 | 10% | 0 |
| custom-operator | 38,000 | 8% | 1,892 🔴 |
| kubectl (users) | 23,000 | 5% | 12 |

### Issues Detected

#### 1. Slow LIST Events
\`\`\`
Cause: 2.4M events in etcd (should be <100K)
Solution: Reduce event TTL or enable event archiving

# Check event count
kubectl get events -A --no-headers | wc -l

# Cleanup old events
kubectl delete events --all -A --field-selector='type!=Warning'
\`\`\`

#### 2. Custom Operator Throttling
\`\`\`
Rate: 1,892 requests throttled
Reason: Exceeds per-client rate limit
Client: custom-operator/controller-manager

Fix: Implement client-side rate limiting
\`\`\`yaml
# Add to operator config
qps: 20
burst: 30
\`\`\`

### etcd Health
| Metric | Value | Threshold |
|--------|-------|-----------|
| DB Size | 4.2GB | 8GB |
| Compaction | Enabled | - |
| Leader Elections (24h) | 2 | <5 |
| Slow Queries (>100ms) | 45 | <10 ⚠️ |

### Recommendations
1. Enable API priority and fairness
2. Increase etcd compaction frequency
3. Add rate limits to custom operator
4. Archive events older than 1 hour`,
  },
  {
    question: "How do I troubleshoot the failing init containers?",
    answer: `## Init Container Troubleshooting Guide

### Pods with Failed Init Containers
| Pod | Namespace | Init Container | Status | Restarts |
|-----|-----------|----------------|--------|----------|
| app-server-8x9y | production | wait-for-db | Init:Error | 12 |
| worker-5a6b | jobs | config-init | Init:CrashLoopBackOff | 8 |
| api-v3-7c8d | production | migrate-db | Init:Error | 5 |
| cache-2e3f | production | init-permissions | Init:0/2 | 0 |

### Detailed Analysis

#### 1. wait-for-db: Connection Timeout
\`\`\`bash
# Check init container logs
kubectl logs app-server-8x9y -c wait-for-db

# Output:
Waiting for database at postgres:5432...
Connection refused
Retry 1/30...
...
Error: Timeout after 30 attempts
\`\`\`

**Root Cause:** Database service not ready
**Fix Options:**
\`\`\`yaml
# Option 1: Increase timeout
initContainers:
  - name: wait-for-db
    env:
      - name: TIMEOUT
        value: "120"  # Was 30

# Option 2: Fix database service
kubectl get endpoints postgres -n production
# If empty, database pods aren't ready
\`\`\`

#### 2. config-init: Permission Denied
\`\`\`
Error: Cannot write to /config/app.yaml
Permission denied
\`\`\`

**Fix:**
\`\`\`yaml
initContainers:
  - name: config-init
    securityContext:
      runAsUser: 0  # Run as root for setup
    volumeMounts:
      - name: config
        mountPath: /config
\`\`\`

#### 3. migrate-db: Missing Secret
\`\`\`
Error: Environment variable DATABASE_URL not set
\`\`\`

**Fix:** Mount the required secret
\`\`\`yaml
initContainers:
  - name: migrate-db
    envFrom:
      - secretRef:
          name: db-credentials
\`\`\`

### Debugging Commands
\`\`\`bash
# Describe pod for init container status
kubectl describe pod app-server-8x9y

# Get init container logs
kubectl logs app-server-8x9y -c wait-for-db

# Get previous attempt logs
kubectl logs app-server-8x9y -c wait-for-db --previous

# Execute into init container (if still running)
kubectl exec -it app-server-8x9y -c init-permissions -- sh

# Check events
kubectl get events --field-selector involvedObject.name=app-server-8x9y
\`\`\`

### Common Init Container Patterns
| Pattern | Use Case | Example |
|---------|----------|---------|
| wait-for-service | Dependency check | wait-for-db, wait-for-redis |
| init-permissions | Volume setup | chown, chmod |
| config-loader | Fetch configs | Download from S3/ConfigMap |
| migrate | Database setup | Run migrations |
| clone-repo | Git operations | Clone code/configs |`,
  },
  {
    question: "What namespaces are approaching their resource quotas?",
    answer: `## Resource Quota Utilization Report

### Quota Status by Namespace
| Namespace | CPU Used/Limit | Memory Used/Limit | Pods Used/Limit | Status |
|-----------|----------------|-------------------|-----------------|--------|
| production | 85/100 (85%) | 180Gi/200Gi (90%) | 89/100 (89%) | 🔴 Critical |
| staging | 12/50 (24%) | 24Gi/100Gi (24%) | 45/80 (56%) | ✅ Healthy |
| development | 8/30 (27%) | 16Gi/50Gi (32%) | 32/50 (64%) | ✅ Healthy |
| cicd | 18/20 (90%) | 28Gi/32Gi (87%) | 24/30 (80%) | 🔴 Critical |
| monitoring | 7/10 (70%) | 14Gi/16Gi (87%) | 12/15 (80%) | ⚠️ Warning |
| jobs | 24/40 (60%) | 48Gi/64Gi (75%) | 45/100 (45%) | ⚠️ Warning |

### Critical Alerts

#### production: Multiple Limits Near Threshold
\`\`\`
⚠️ Memory: 90% utilized
⚠️ Pods: 89% utilized
⚠️ CPU: 85% utilized

Risk: New deployments may fail
Impact: Auto-scaling blocked
\`\`\`

**Recent Rejections:**
| Time | Resource | Request | Available |
|------|----------|---------|-----------|
| 10m ago | pods | +3 | 11 remaining |
| 1h ago | memory | +8Gi | 20Gi remaining |
| 3h ago | cpu | +4 cores | 15 cores remaining |

#### cicd: Pipeline Failures Expected
\`\`\`
CPU: 90% (18/20 cores)
Memory: 87% (28/32Gi)

Concurrent builds limited to: ~2
Queue depth: 8 jobs waiting
\`\`\`

### Detailed Breakdown: production

| Resource Type | Used | Limit | % | Trend (7d) |
|---------------|------|-------|---|------------|
| requests.cpu | 72 | 100 | 72% | ↗ +12% |
| limits.cpu | 144 | 200 | 72% | ↗ +8% |
| requests.memory | 160Gi | 200Gi | 80% | ↗ +15% |
| limits.memory | 320Gi | 400Gi | 80% | ↗ +15% |
| pods | 89 | 100 | 89% | ↗ +5% |
| services | 24 | 50 | 48% | → |
| secrets | 67 | 100 | 67% | ↗ +3% |
| configmaps | 45 | 100 | 45% | → |
| persistentvolumeclaims | 32 | 50 | 64% | ↗ +8% |

### Recommendations

#### Immediate Actions
\`\`\`yaml
# Increase production quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    pods: "150"           # Was 100
    requests.cpu: "150"   # Was 100
    requests.memory: "300Gi"  # Was 200Gi
\`\`\`

#### Cost-Neutral Options
1. **Clean up unused pods** in production (estimate: 12 pods reclaimable)
2. **Right-size over-provisioned** deployments
3. **Move non-critical workloads** to staging

### Monitoring Command
\`\`\`bash
# Watch quota usage in real-time
kubectl get resourcequota -A -w
\`\`\``,
  },
  {
    question: "Explain the pod priority and preemption behavior",
    answer: `## Pod Priority and Preemption Analysis

### Priority Classes in Cluster
| Priority Class | Value | Preemption | Description |
|----------------|-------|------------|-------------|
| system-cluster-critical | 2000000000 | Never | System components |
| system-node-critical | 2000001000 | Never | Node-level services |
| platform-critical | 1000000 | PreemptLowerPriority | Core platform |
| high-priority | 100000 | PreemptLowerPriority | Production workloads |
| default | 0 | PreemptLowerPriority | Standard workloads |
| low-priority | -100 | Never | Batch jobs, tests |

### Current Priority Distribution
| Namespace | Critical | High | Default | Low | Total |
|-----------|----------|------|---------|-----|-------|
| kube-system | 18 | 0 | 0 | 0 | 18 |
| production | 0 | 45 | 38 | 0 | 83 |
| monitoring | 5 | 7 | 0 | 0 | 12 |
| jobs | 0 | 0 | 15 | 30 | 45 |
| development | 0 | 0 | 25 | 10 | 35 |

### Recent Preemption Events
| Time | Preempted Pod | Preempting Pod | Reason |
|------|---------------|----------------|--------|
| 15m ago | batch-job-8x9y (low) | api-deploy-5a6b (high) | Resource shortage |
| 1h ago | test-pod-7c8d (low) | prometheus-0 (critical) | Node pressure |
| 3h ago | dev-app-2e3f (default) | order-svc-1a2b (high) | Scaling event |

### Preemption Flow Example
\`\`\`
1. High-priority pod "api-gateway" requested
2. No schedulable nodes found
3. Scheduler identifies preemption victims:
   - batch-job-8x9y (priority: -100)
   - test-runner-4d5e (priority: -100)
4. Victims terminated gracefully
5. api-gateway scheduled on freed resources
\`\`\`

### Configuration Examples

#### Define Priority Classes
\`\`\`yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: production-critical
value: 500000
preemptionPolicy: PreemptLowerPriority
globalDefault: false
description: "Critical production workloads"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-jobs
value: -100
preemptionPolicy: Never  # Won't preempt others
globalDefault: false
description: "Low-priority batch processing"
\`\`\`

#### Assign to Pod
\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: high-priority-app
spec:
  priorityClassName: production-critical
  containers:
    - name: app
      image: myapp:latest
\`\`\`

### Best Practices
| Practice | Recommendation |
|----------|----------------|
| System pods | Always use system-* classes |
| Production | Use high-priority (100000+) |
| Dev/Test | Use default or low-priority |
| Batch jobs | Use negative priority with Never preemption |
| Default class | Set explicitly, don't rely on implicit 0 |

### Troubleshooting Preemption
\`\`\`bash
# Find preempted pods
kubectl get events --field-selector reason=Preempted

# Check pod priority
kubectl get pods -o custom-columns=\\
'NAME:.metadata.name,PRIORITY:.spec.priority,CLASS:.spec.priorityClassName'
\`\`\``,
  },
];

export const KUBERNETES_CONVERSATION_TITLES = [
  "Pod Restart Analysis",
  "Node Health Status",
  "API Gateway Latency",
  "Deployment Status Check",
  "Resource Optimization",
  "CrashLoopBackOff Events",
  "Namespace Comparison",
  "Pod Scheduling Issues",
  "PVC Status Review",
  "Ingress Configuration",
  "HPA Effectiveness",
  "Network Policy Impact",
  "Liveness Probe Debug",
  "Certificate Status",
  "ConfigMap Analysis",
  "Image Security Scan",
  "PDB Analysis",
  "Failed Jobs Review",
  "Service Mesh Status",
  "Memory Usage Analysis",
  "Resource Quota Setup",
  "Cluster Autoscaler",
  "DaemonSet Rollout",
  "Top Consumers",
  "RBAC Audit",
  "Anti-Affinity Issues",
  "API Server Metrics",
  "Init Container Debug",
  "Quota Utilization",
  "Priority Preemption",
];

// ==================== KUBERNETES API SERVER CONTEXT ====================

export const KUBERNETES_API_SERVER_MOCK_DATA: MockQA[] = [
  {
    question: "What is the current API server request latency?",
    answer: `## Kubernetes API Server Latency

### Request Latency Percentiles (Last 1h)
| Verb | p50 | p95 | p99 |
|------|-----|-----|-----|
| GET | 4ms | 38ms | 89ms |
| LIST | 18ms | 124ms | 312ms |
| WATCH | 2ms | 8ms | 14ms |
| CREATE | 12ms | 67ms | 145ms |
| UPDATE | 10ms | 54ms | 123ms |
| DELETE | 8ms | 42ms | 98ms |

### SLO Status
- **Read SLO** (p99 < 1s): ✅ PASSING
- **Mutating SLO** (p99 < 1s): ✅ PASSING
- **LIST SLO** (p99 < 3s): ✅ PASSING

### Hotspot Resources
| Resource | Request Rate | Avg Latency |
|----------|-------------|-------------|
| pods | 1,234/min | 22ms |
| configmaps | 456/min | 14ms |
| events | 3,450/min | 5ms |
| deployments | 234/min | 31ms |

### Recommendations
- LIST on \`events\` is high volume — consider using \`fieldSelector\` to scope queries
- Enable API server response caching for read-heavy controllers`,
  },
  {
    question: "Show API server error rate breakdown",
    answer: `## API Server Error Rate Analysis

### Error Distribution (Last 24h)
| HTTP Status | Count | % of Total | Trend |
|-------------|-------|-----------|-------|
| 200 OK | 4,523,456 | 98.7% | Stable |
| 401 Unauthorized | 3,456 | 0.07% | ↑ +12% |
| 403 Forbidden | 1,234 | 0.03% | Stable |
| 404 Not Found | 8,901 | 0.19% | Stable |
| 422 Unprocessable | 567 | 0.01% | Stable |
| 429 Too Many Requests | 234 | 0.005% | ↑ +45% |
| 500 Internal | 45 | 0.001% | Stable |

### 401 Spike Analysis
Top offending service accounts:
1. \`monitoring-agent/prometheus\` — 2,345 (expired token)
2. \`default/old-dashboard\` — 1,111 (stale kubeconfig)

### 429 Rate Limit Spike
Caused by \`cluster-autoscaler\` aggressive LIST polling — reduce poll interval to 30s.

### Action Items
1. Rotate prometheus ServiceAccount token
2. Remove stale kubeconfig for old-dashboard
3. Tune cluster-autoscaler poll interval`,
  },
  {
    question: "Analyze API server audit log for suspicious activity",
    answer: `## API Server Audit Log Analysis

### High-Risk Events (Last 24h)
| Time | User | Verb | Resource | Namespace | Risk |
|------|------|------|----------|-----------|------|
| 09:14:23 | user@telemetryflow.id | create | secrets | production | High |
| 09:45:11 | system:anonymous | get | pods | default | Critical |
| 11:23:45 | ci-runner-sa | delete | deployments | staging | Medium |
| 14:56:01 | unknown-sa | exec | pods | kube-system | Critical |

### Anonymous Access Attempt
\`\`\`
09:45:11 - system:anonymous GET pods/default
Source IP: 203.0.113.45 (external)
→ Request DENIED (403)
→ Blocked by RBAC (no ClusterRoleBinding)
\`\`\`

### Recommended Actions
1. Disable anonymous access: \`--anonymous-auth=false\`
2. Investigate exec into kube-system pods from unknown-sa
3. Review secret creation by external user account
4. Enable audit log alerting for \`system:anonymous\` attempts`,
  },
  {
    question: "What is the API server resource utilization?",
    answer: `## API Server Resource Usage

### Current Usage
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| CPU | 1.2 cores | 4 cores | ✅ 30% |
| Memory | 2.8 GB | 8 GB | ✅ 35% |
| Open File Descriptors | 4,234 | 65,536 | ✅ 6% |
| Goroutines | 1,456 | 5,000 | ✅ 29% |
| In-flight Requests | 45 | 400 | ✅ 11% |
| Request Queue Depth | 12 | 100 | ✅ 12% |

### etcd Backend Latency
| Operation | p99 | Threshold |
|-----------|-----|-----------|
| Read | 4ms | 100ms |
| Write | 8ms | 200ms |
| Leader Election | 12ms | 500ms |

### Memory Breakdown
- Request handler buffers: 1.1 GB
- Watch cache: 890 MB
- Watch event queue: 234 MB
- Go runtime overhead: 576 MB

### Trend
Memory usage increased 15% over the past 7 days — correlates with new operator CRDs being registered.`,
  },
  {
    question: "Check API server admission webhook performance",
    answer: `## Admission Webhook Performance

### Webhook Latency (p99, Last 1h)
| Webhook | Latency | Timeout | Failures |
|---------|---------|---------|----------|
| policy-engine | 23ms | 10s | 0 |
| image-scanner | 145ms | 30s | 2 |
| resource-quota-validator | 8ms | 5s | 0 |
| pod-security-standards | 4ms | 5s | 0 |
| istio-sidecar-injector | 67ms | 10s | 0 |

### image-scanner Failures
\`\`\`
14:23:45 - Webhook timeout after 30s for pod/nginx-abc
14:56:12 - Webhook returned 500: upstream CVE DB unavailable
\`\`\`

### Impact
2 pod creations were blocked and retried.

### Recommendations
1. Add HA replicas for image-scanner (currently 1 replica)
2. Implement CVE DB caching to reduce external dependency
3. Set \`failurePolicy: Ignore\` for non-critical webhooks`,
  },
  {
    question: "Show API server certificate expiry status",
    answer: `## API Server TLS Certificate Status

### Certificate Inventory
| Certificate | Expiry | Days Left | Auto-Rotate | Status |
|-------------|--------|-----------|-------------|--------|
| apiserver.crt | 2026-09-14 | 184 days | Yes | ✅ OK |
| apiserver-kubelet-client.crt | 2026-03-28 | 14 days | Yes | ⚠️ Soon |
| etcd-client.crt | 2026-05-01 | 48 days | Yes | ✅ OK |
| front-proxy-client.crt | 2026-09-14 | 184 days | Yes | ✅ OK |
| service-account.pub | N/A | N/A | Manual | ✅ OK |

### Rotation History
| Certificate | Last Rotated | Trigger |
|-------------|-------------|---------|
| apiserver.crt | 2025-09-14 | Auto (1yr) |
| etcd-client.crt | 2025-05-01 | Auto (1yr) |

### Action Required
**apiserver-kubelet-client.crt** expires in 14 days.
Run: \`kubeadm certs renew apiserver-kubelet-client\`
Then restart API server to reload.`,
  },
  {
    question: "Analyze API server request rate by client",
    answer: `## API Server Client Request Analysis

### Top 10 Clients (Requests/min)
| Client | Requests/min | Verbs | Namespaces |
|--------|-------------|-------|-----------|
| kube-controller-manager | 2,345 | LIST,WATCH | All |
| kube-scheduler | 1,234 | LIST,WATCH | All |
| prometheus-operator | 890 | GET,LIST | monitoring |
| cluster-autoscaler | 678 | LIST,PATCH | All |
| argocd-application-controller | 456 | GET,LIST,PATCH | All |
| cilium-operator | 345 | LIST,WATCH | All |
| cert-manager | 234 | GET,CREATE | All |
| ingress-nginx | 189 | LIST,WATCH | All |
| node exporter agents | 1,560 | GET | default |
| user: ci-runner | 123 | Various | staging |

### Noisy Clients
- **cluster-autoscaler**: 45% of LIST requests — tune poll interval
- **node exporters**: High GET volume — batch with aggregator

### Recommendations
1. Enable API priority and fairness (APF) per client
2. Add \`resourceVersion\` to LIST calls to use watch cache`,
  },
  {
    question: "What RBAC violations occurred in the last hour?",
    answer: `## RBAC Violation Report (Last 1h)

### Denied Requests by Subject
| Subject | Resource | Verb | Namespace | Count |
|---------|----------|------|-----------|-------|
| developer-sa | secrets | list | production | 45 |
| viewer-role | deployments | update | staging | 12 |
| ci-runner-sa | clusterroles | create | N/A | 3 |
| unknown-user | pods/exec | create | kube-system | 1 |

### Critical: Privilege Escalation Attempt
\`\`\`
14:56:01 - ci-runner-sa attempted CREATE on clusterroles
This would grant cluster-wide permissions.
RBAC blocked — no ClusterRoleBinding found.
\`\`\`

### Misconfigured Service Accounts
| Account | Issue | Namespace |
|---------|-------|-----------|
| developer-sa | Needs read on secrets in dev, not prod | production |
| monitoring-agent | Token expired | monitoring |

### Remediation
1. Scope developer-sa to non-production namespaces
2. Rotate monitoring-agent token
3. Alert on any \`clusterroles\` CREATE attempts from non-admin accounts`,
  },
  {
    question: "Show API server watch cache status",
    answer: `## API Server Watch Cache Analysis

### Watch Cache Statistics
| Resource | Cached Objects | Events/s | Cache Hit Rate |
|----------|---------------|---------|----------------|
| pods | 4,567 | 234 | 98.7% |
| nodes | 45 | 2 | 99.9% |
| services | 890 | 12 | 99.4% |
| configmaps | 2,345 | 45 | 97.8% |
| endpoints | 1,234 | 67 | 98.2% |
| secrets | 678 | 8 | 99.1% |

### Cache Bypass Events (Last 1h)
12 LIST requests bypassed cache (used etcd directly)
- Cause: \`resourceVersion="0"\` not set in client requests
- Clients: old version of helm controller (v3.9.x)

### Memory Impact
Watch cache using 890 MB of API server RAM.
Largest caches: pods (312 MB), configmaps (189 MB)

### Recommendations
1. Upgrade helm controller to v3.14+ (fixes resourceVersion)
2. Increase watch cache size for pods to reduce etcd load
3. Enable \`--watch-cache-sizes=pods#10000\``,
  },
  {
    question: "How is API server high availability configured?",
    answer: `## API Server High Availability Status

### Instance Health
| Instance | Node | Status | Uptime | Load |
|----------|------|--------|--------|------|
| kube-apiserver-master-01 | 10.0.0.1 | ✅ Leader | 34d 12h | 31% |
| kube-apiserver-master-02 | 10.0.0.2 | ✅ Active | 34d 11h | 28% |
| kube-apiserver-master-03 | 10.0.0.3 | ✅ Active | 34d 10h | 29% |

### Load Balancer
| Setting | Value |
|---------|-------|
| VIP | 10.0.0.100 |
| Algorithm | Round Robin |
| Health Check | /healthz every 5s |
| Failover Time | <10s |

### Leader Election (kube-controller-manager)
- Leader: master-01 (acquired 34d ago)
- Lease Duration: 15s
- Renew Deadline: 10s
- Last Renewal: 2s ago

### Recent Failovers
No failovers in last 30 days. ✅

### Recommendation
Consider using weighted round-robin to distribute load based on current CPU.`,
  },
];

export const KUBERNETES_API_SERVER_CONVERSATION_TITLES: string[] = [
  "API server request latency",
  "API server error rate breakdown",
  "Audit log suspicious activity",
  "API server resource utilization",
  "Admission webhook performance",
  "TLS certificate expiry status",
  "Client request rate analysis",
  "RBAC violation report",
  "Watch cache status",
  "High availability configuration",
];

// ==================== KUBERNETES COREDNS CONTEXT ====================

export const KUBERNETES_COREDNS_MOCK_DATA: MockQA[] = [
  {
    question: "Why are DNS resolution failures increasing?",
    answer: `## CoreDNS Resolution Failure Analysis

### Failure Rate (Last 1h)
| Metric | Value | Baseline | Status |
|--------|-------|----------|--------|
| Total Queries | 345,678/min | 320,000/min | Normal |
| NXDOMAIN | 1,234/min | 200/min | ⚠️ +517% |
| SERVFAIL | 45/min | 5/min | ⚠️ +800% |
| Timeouts | 12/min | 1/min | ⚠️ +1100% |

### Top NXDOMAIN Queries
| Query | Count | Service |
|-------|-------|---------|
| mongo.default.svc.cluster.local | 456 | order-svc |
| redis-v2.cache.svc.cluster.local | 312 | session-svc |
| kafka.messaging.svc.cluster.local | 289 | event-processor |

### Root Cause
Three services are querying for **stale DNS names** after service renames:
- \`mongo\` was renamed to \`mongodb\`
- \`redis-v2\` was renamed to \`redis-master\`
- \`kafka\` was renamed to \`kafka-broker\`

### Immediate Fix
Update ConfigMaps for order-svc, session-svc, event-processor with correct service names.`,
  },
  {
    question: "Show CoreDNS query latency breakdown",
    answer: `## CoreDNS Query Latency

### Latency by Record Type
| Type | p50 | p95 | p99 |
|------|-----|-----|-----|
| A (cluster.local) | 0.4ms | 1.2ms | 3.4ms |
| A (external) | 12ms | 89ms | 234ms |
| SRV | 0.6ms | 2.1ms | 5.6ms |
| CNAME | 0.8ms | 2.8ms | 7.2ms |
| PTR (reverse) | 2.3ms | 12ms | 45ms |

### Slow External Queries (>100ms)
| Query | p99 | Upstream | Frequency |
|-------|-----|----------|-----------|
| s3.amazonaws.com | 312ms | 8.8.8.8 | 2,345/min |
| dockerhub.io | 456ms | 8.8.8.8 | 123/min |

### Cache Performance
- Cache Hit Rate: **94.7%**
- Cache size: 9,234/10,000 entries
- Cache TTL: 30s (A records), 300s (CNAME)

### Recommendations
1. Add stub zone for AWS services to reduce external hops
2. Increase cache size to 20,000 for high-query clusters
3. Use NodeLocalDNSCache to cut Pod→CoreDNS latency by 90%`,
  },
  {
    question: "Analyze CoreDNS upstream resolver health",
    answer: `## CoreDNS Upstream Resolver Status

### Configured Resolvers
| Resolver | Protocol | Latency (p99) | Error Rate | Status |
|----------|----------|---------------|------------|--------|
| 8.8.8.8:53 | UDP | 89ms | 0.02% | ✅ OK |
| 8.8.4.4:53 | UDP | 91ms | 0.01% | ✅ OK |
| 1.1.1.1:53 | UDP | 34ms | 0.00% | ✅ OK |

### Resolver Response Time Trend (Last 24h)
- Peak latency: 08:00–09:00 UTC (morning traffic)
- 8.8.8.8 showed brief 500ms spike at 14:00 (recovered in 2min)

### Forward Plugin Configuration
\`\`\`
forward . 8.8.8.8 8.8.4.4 1.1.1.1 {
  max_fails 3
  health_check 5s
  policy sequential
}
\`\`\`

### Recommendations
1. Switch to \`policy round_robin\` to distribute load
2. Add 1.0.0.1 as 4th resolver for more redundancy
3. Consider private DNS for internal company domains to avoid external lookups`,
  },
  {
    question: "Check CoreDNS pod health and resource usage",
    answer: `## CoreDNS Pod Health

### Pod Status
| Pod | Node | Status | Restarts | CPU | Memory |
|-----|------|--------|----------|-----|--------|
| coredns-7d89d9b647-abc12 | node-01 | Running | 0 | 45m | 38Mi |
| coredns-7d89d9b647-def34 | node-03 | Running | 0 | 42m | 36Mi |

### Resource Utilization
| Metric | Used | Request | Limit | Status |
|--------|------|---------|-------|--------|
| CPU | 87m | 100m | 200m | ⚠️ 87% of request |
| Memory | 74Mi | 70Mi | 180Mi | ⚠️ Exceeds request |

### Throughput
- Current: 5,678 queries/s
- Capacity estimate: ~8,000 queries/s per pod
- Headroom: ~29% per pod

### Recommendations
1. Increase CPU request to 200m (currently at 87% utilization)
2. Increase memory request to 100Mi to avoid OOM risk
3. Consider adding a 3rd CoreDNS replica for zone redundancy
4. Enable readiness probe based on DNS response time`,
  },
  {
    question: "What are the top DNS queries by service?",
    answer: `## Top DNS Queries by Service

### Top 15 Services by DNS Query Volume (Last 1h)
| Service | Namespace | Queries/min | Unique Domains | Cache Hit |
|---------|-----------|-------------|----------------|-----------|
| payment-svc | production | 12,345 | 23 | 96% |
| order-svc | production | 9,876 | 18 | 94% |
| api-gateway | production | 8,234 | 45 | 91% |
| worker-pool | batch | 7,890 | 12 | 98% |
| analytics-svc | analytics | 6,543 | 67 | 89% |
| auth-svc | production | 5,678 | 8 | 99% |
| notification-svc | production | 4,321 | 34 | 92% |

### DNS-Heavy Services
**analytics-svc** resolves 67 unique external domains — consider DNS prefetch caching.

### Optimization Opportunities
| Service | Issue | Estimated Savings |
|---------|-------|------------------|
| api-gateway | Resolves same external domains repeatedly | -2,500 queries/min |
| analytics-svc | No DNS caching in SDK | -1,200 queries/min |

### Recommendations
1. Add per-service DNS caching for api-gateway
2. Enable DNS search domain optimization (reduce NDOTS)`,
  },
  {
    question: "Show CoreDNS search domain configuration issues",
    answer: `## CoreDNS Search Domain Analysis

### Current ndots Configuration
\`\`\`yaml
resolv.conf:
  ndots: 5  # default Kubernetes
\`\`\`

### Impact of ndots: 5
For query \`api.stripe.com\`, Pod tries in order:
1. \`api.stripe.com.production.svc.cluster.local\` → NXDOMAIN
2. \`api.stripe.com.svc.cluster.local\` → NXDOMAIN
3. \`api.stripe.com.cluster.local\` → NXDOMAIN
4. \`api.stripe.com\` → ✅ Resolved (4th attempt!)

### Extra DNS Queries Generated
| Pods | Queries/request (ndots:5) | Queries/request (ndots:2) | Savings |
|------|--------------------------|--------------------------|---------|
| All | 4 avg | 1 avg | 75% |

### Current Overhead
- Extra NXDOMAIN queries: ~45,000/min cluster-wide
- Extra latency per external request: +6ms avg

### Recommendation
Set \`ndots: 2\` for external-facing services:
\`\`\`yaml
spec:
  dnsConfig:
    options:
      - name: ndots
        value: "2"
\`\`\`
This reduces DNS overhead by ~75% for services making external calls.`,
  },
  {
    question: "Analyze CoreDNS cache effectiveness",
    answer: `## CoreDNS Cache Analysis

### Cache Statistics (Last 1h)
| Metric | Value |
|--------|-------|
| Cache Size (entries) | 9,234 / 10,000 |
| Cache Hit Rate | 94.7% |
| Cache Hits | 327,456 |
| Cache Misses | 18,222 |
| Expired Evictions | 4,567 |
| Forced Evictions | 12 |

### TTL Distribution of Cached Entries
| TTL Range | Entries | % |
|-----------|---------|---|
| 0-10s | 1,234 | 13% |
| 10-30s | 4,567 | 49% |
| 30-300s | 3,433 | 37% |
| >300s | 0 | 0% |

### Low TTL Impact
Services with TTL <10s cause frequent cache misses:
- \`redis-master.cache.svc.cluster.local\` (TTL: 5s) — 1,234 misses/min
- \`mongodb.db.svc.cluster.local\` (TTL: 5s) — 987 misses/min

### Recommendations
1. Increase Kubernetes service DNS TTL to 30s (default is 5s)
2. Increase CoreDNS cache size to 20,000 to avoid forced evictions
3. Enable \`prefetch\` plugin to pre-warm expiring entries`,
  },
  {
    question: "Check for DNS amplification or abuse patterns",
    answer: `## DNS Abuse Pattern Analysis

### Query Volume Anomalies
| Namespace | Queries/min | Baseline | Variance |
|-----------|-------------|----------|----------|
| production | 45,678 | 44,000 | +4% ✅ |
| staging | 12,345 | 11,000 | +12% ✅ |
| batch | 34,567 | 5,000 | +591% ⚠️ |
| testing | 78,901 | 1,000 | +7790% 🚨 |

### Testing Namespace Spike
\`\`\`
Pod: load-test-6d8f7b-xxxx
Queries/min: 78,901
Unique domains: 3 (same 3 domains queried repeatedly)
Pattern: Rapid DNS polling loop — likely load test misconfiguration
\`\`\`

### Batch Namespace
\`\`\`
Job: data-export-batch-20260314
Resolving 45 external S3 endpoints per message processed
Processing 1,200 messages/min → 54,000 DNS queries/min
\`\`\`

### Recommendations
1. Add DNS rate limits per namespace in CoreDNS
2. Fix load-test pod — add sleep between DNS calls
3. Cache S3 endpoint IPs in data-export-batch`,
  },
  {
    question: "How to configure NodeLocal DNSCache?",
    answer: `## NodeLocal DNSCache Setup Guide

### Current State
- DNS traffic goes: Pod → CoreDNS pod (may be on another node)
- Average latency: 1.2ms (within cluster)
- Cross-node penalty: +0.4ms per query

### With NodeLocalDNSCache
- DNS traffic goes: Pod → Local DNS agent (same node, link-local)
- Expected latency: <0.1ms
- Estimated improvement: **92% reduction**

### Setup Steps
\`\`\`yaml
# NodeLocalDNSCache DaemonSet (link-local IP: 169.254.20.10)
# Intercepts DNS via iptables before reaching CoreDNS

apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-local-dns
  namespace: kube-system
spec:
  template:
    spec:
      containers:
      - name: node-cache
        image: registry.k8s.io/dns/k8s-dns-node-cache:1.22.20
        args:
          - "-localip 169.254.20.10,10.96.0.10"
          - "-conf /etc/Corefile"
          - "-upstreamsvc kube-dns"
\`\`\`

### Expected Impact
| Metric | Before | After |
|--------|--------|-------|
| DNS latency p99 | 3.4ms | 0.3ms |
| CoreDNS CPU | 87m/pod | 23m/pod |
| Network traffic | High | Minimal |`,
  },
  {
    question: "Show CoreDNS plugin configuration review",
    answer: `## CoreDNS Plugin Configuration Review

### Current Corefile
\`\`\`
.:53 {
  errors
  health {
    lameduck 5s
  }
  ready
  kubernetes cluster.local in-addr.arpa ip6.arpa {
    pods insecure
    fallthrough in-addr.arpa ip6.arpa
    ttl 30
  }
  prometheus :9153
  forward . /etc/resolv.conf {
    max_concurrent 1000
  }
  cache 30
  loop
  reload
  loadbalance
}
\`\`\`

### Plugin Assessment
| Plugin | Status | Recommendation |
|--------|--------|----------------|
| errors | ✅ | Keep |
| health | ✅ | Keep |
| kubernetes | ✅ | Increase TTL to 60s |
| forward | ⚠️ | Switch to explicit nameservers |
| cache | ⚠️ | Increase TTL to 300s |
| loop | ✅ | Keep (loop detection) |
| loadbalance | ✅ | Keep |

### Missing Plugins to Consider
- **prefetch**: Pre-warm cache for popular domains
- **rewrite**: Normalize internal service names
- **autopath**: Reduce search-domain lookups

### Recommended Corefile Changes
1. Replace \`forward . /etc/resolv.conf\` with explicit nameservers
2. Add \`prefetch 10 1m 10%\`
3. Increase cache TTL: \`cache 300\``,
  },
];

export const KUBERNETES_COREDNS_CONVERSATION_TITLES: string[] = [
  "DNS resolution failure spike",
  "CoreDNS query latency analysis",
  "Upstream resolver health check",
  "CoreDNS pod resource usage",
  "Top DNS queries by service",
  "Search domain ndots optimization",
  "Cache hit rate analysis",
  "DNS abuse pattern detection",
  "NodeLocal DNSCache setup",
  "Corefile plugin review",
];
