# Linkerd Service Mesh - mTLS and Observability

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Service Mesh  
**Prerequisites**: [k0s-installation](k0s-installation), [k0s-monitoring](k0s-monitoring)  
**Time**: 3-4 hours  
**Tags**: linkerd, service-mesh, mtls, observability, zero-trust, microservices

## Summary

Add service mesh capabilities to Kubernetes with Linkerd. Learn mTLS encryption between services, traffic splitting for canary deployments, automatic retries, observability, and zero-trust security.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand service mesh concepts
- ✅ Install Linkerd on k0s
- ✅ Enable automatic mTLS
- ✅ Implement traffic splitting
- ✅ Configure retries and timeouts
- ✅ Monitor service metrics
- ✅ Debug service communication
- ✅ Secure microservices

## 🕸️ What is a Service Mesh?

### The Problem

**Without service mesh**:
```yaml
# Service A calls Service B
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-a
spec:
  template:
    spec:
      containers:
      - name: app
        image: service-a:latest
        env:
        - name: SERVICE_B_URL
          value: "http://service-b:8080"

# Problems:
# ❌ No encryption (plaintext HTTP)
# ❌ No automatic retries
# ❌ No traffic shaping
# ❌ No per-request metrics
# ❌ Manual load balancing
# ❌ No circuit breaking
```

**Issues**:
- 🔓 **Security**: No encryption between services
- 📊 **Observability**: No visibility into service calls
- 🔄 **Reliability**: No automatic retries or timeouts
- 🚦 **Traffic**: No canary deployments
- 🛠️ **Complexity**: Each app implements these features

---

### The Solution: Service Mesh

**Service mesh** adds:
- 🔒 **mTLS**: Automatic encryption between all services
- 📊 **Metrics**: Per-request success rate, latency, traffic volume
- 🔄 **Retries**: Automatic retry on failure
- ⏱️ **Timeouts**: Prevent hanging requests
- 🚦 **Traffic Split**: Canary deployments (90% v1, 10% v2)
- 🛡️ **Circuit Breaking**: Stop calling failing services

**Zero code changes required!**

---

### How It Works

```
┌─────────────────┐
│   Service A     │
│   (your app)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐  mTLS     ┌─────────────────┐
│ Linkerd Proxy   │ ←────────→│ Linkerd Proxy   │
│ (sidecar)       │  encrypted │ (sidecar)       │
└────────┬────────┘            └────────┬────────┘
         │                              │
         │                              ↓
         │                     ┌─────────────────┐
         │                     │   Service B     │
         │                     │   (your app)    │
         │                     └─────────────────┘
         │
         ↓
    Metrics sent to Prometheus
```

**Sidecar proxy** = Linkerd container added to each pod

---

### Why Linkerd?

**vs Istio**:
- ✅ **Simpler**: Less complex, easier to learn
- 🚀 **Faster**: Lower latency and resource usage
- 📦 **Lighter**: Smaller memory footprint
- 🎯 **Focus**: Does one thing well (service mesh)

**vs No Service Mesh**:
- 🔒 Zero-config mTLS
- 📊 Automatic metrics
- 🔄 Built-in reliability
- 🚦 Advanced traffic control

---

## 📦 Installing Linkerd

### Prerequisites

```bash
# Check k0s cluster
kubectl get nodes

# Check Kubernetes version (1.21+)
kubectl version --short
```

---

### Install Linkerd CLI

**Linux/macOS**:
```bash
# Install CLI
curl -fsL https://run.linkerd.io/install | sh

# Add to PATH
export PATH=$PATH:$HOME/.linkerd2/bin

# Verify
linkerd version
# Output: Client version: stable-2.14.10
```

**Windows**:
```powershell
# Install with Scoop
scoop bucket add linkerd https://github.com/linkerd/scoop-linkerd
scoop install linkerd

# Verify
linkerd version
```

---

### Pre-flight Check

```bash
# Check cluster compatibility
linkerd check --pre

# Output:
# √ can initialize the client
# √ can query the Kubernetes API
# √ is running the minimum Kubernetes API version
# √ can query the Linkerd API
# ...
# Status check results are √
```

**Fix any ✗** before proceeding.

---

### Install Linkerd Control Plane

```bash
# Generate TLS certificates
linkerd install --crds | kubectl apply -f -

# Install control plane
linkerd install | kubectl apply -f -

# Wait for installation
linkerd check

# Output:
# √ control plane is up-to-date
# √ can initialize the client
# √ linkerd-config config map exists
# ...
# Status check results are √
```

**Takes 2-3 minutes** to complete.

---

### Verify Installation

```bash
# Check pods
kubectl get pods -n linkerd

# Output:
# NAME                                     READY   STATUS    RESTARTS   AGE
# linkerd-destination-6f7c8d9b9c-xyz       4/4     Running   0          2m
# linkerd-identity-8d9c7b5f4-abc           2/2     Running   0          2m
# linkerd-proxy-injector-5f8c9d7b6-def     2/2     Running   0          2m

# Check services
kubectl get svc -n linkerd
```

---

### Access Dashboard

```bash
# Install Viz extension (observability)
linkerd viz install | kubectl apply -f -

# Wait for viz
linkerd check

# Open dashboard
linkerd viz dashboard

# Opens browser: http://localhost:50750
```

---

## 🔒 Enabling mTLS

### Inject Linkerd Proxy

**Manual injection** (single deployment):
```bash
# Get deployment YAML
kubectl get deploy myapp -o yaml > myapp.yaml

# Inject Linkerd proxy
cat myapp.yaml | linkerd inject - | kubectl apply -f -

# Verify injection
kubectl get pod -l app=myapp -o jsonpath='{.items[0].spec.containers[*].name}'
# Output: myapp linkerd-proxy
```

---

**Automatic injection** (namespace):
```bash
# Annotate namespace
kubectl annotate namespace default linkerd.io/inject=enabled

# All NEW pods get proxy automatically
kubectl rollout restart deployment/myapp

# Verify
kubectl get pods
# Each pod should show 2/2 containers (app + proxy)
```

---

### Verify mTLS

```bash
# Check mTLS status
linkerd viz stat deploy -n default

# Output:
# NAME    MESHED   SUCCESS   RPS   LATENCY_P50   LATENCY_P95   LATENCY_P99   TLS
# myapp      1/1   100.00%  2.5rps         1ms          2ms          5ms   100%
#                                                                           ^^^^
#                                                                    100% encrypted!
```

**TLS: 100%** = All traffic encrypted!

---

### Test Encryption

**Deploy two services**:
```yaml
# Service A
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-a
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: service-a
  template:
    metadata:
      labels:
        app: service-a
    spec:
      containers:
      - name: app
        image: curlimages/curl:latest
        command: ["/bin/sh", "-c", "sleep 3600"]
---
apiVersion: v1
kind: Service
metadata:
  name: service-a
spec:
  ports:
  - port: 80
  selector:
    app: service-a
```

```yaml
# Service B
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-b
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: service-b
  template:
    metadata:
      labels:
        app: service-b
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: service-b
spec:
  ports:
  - port: 80
  selector:
    app: service-b
```

---

**Inject and test**:
```bash
# Deploy with Linkerd
cat service-a.yaml service-b.yaml | linkerd inject - | kubectl apply -f -

# Test communication
kubectl exec -it deploy/service-a -- curl -s http://service-b

# Check if encrypted
linkerd viz tap deploy/service-a

# Output:
# req id=1:1 proxy=in  src=10.244.1.5:54321 dst=service-b:80 tls=true
#                                                             ^^^^^^^^
#                                                          Encrypted!
```

---

## 📊 Observability

### Real-Time Traffic

```bash
# Watch live traffic
linkerd viz tap deploy/service-a

# Output:
# req id=0:1 proxy=out src=10.244.1.5:54321 dst=service-b:80 tls=true :method=GET :authority=service-b :path=/
# rsp id=0:1 proxy=out src=10.244.1.5:54321 dst=service-b:80 tls=true :status=200 latency=2ms
# end id=0:1 proxy=out src=10.244.1.5:54321 dst=service-b:80 tls=true duration=3ms response-length=615B
```

**Shows**:
- Source and destination
- TLS status
- HTTP method and path
- Status code
- Latency

---

### Service Statistics

```bash
# Overall statistics
linkerd viz stat deploy

# Output:
# NAME        MESHED   SUCCESS   RPS   LATENCY_P50   LATENCY_P95   LATENCY_P99   TLS
# service-a      1/1   100.00%  2.5rps         1ms          2ms          5ms   100%
# service-b      1/1   100.00%  2.5rps         1ms          3ms          7ms   100%

# By namespace
linkerd viz stat ns

# Specific deployment
linkerd viz stat deploy/service-a --from deploy/service-b
```

---

### Top Routes

```bash
# Most active routes
linkerd viz top deploy/service-b

# Output:
# Source              Method  Path      Success  RPS
# service-a           GET     /         100.00%  2.5rps
# service-a           GET     /api      100.00%  1.2rps
```

---

### Service Graph

**In dashboard**:
```bash
linkerd viz dashboard
```

**Navigate to**:
- **Namespace**: Select `default`
- **Top** tab: See traffic flow
- Click on deployment: Detailed metrics

---

## 🚦 Traffic Splitting

### Canary Deployment

**Deploy two versions**:
```yaml
# Version 1 (stable)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-v1
  labels:
    app: web
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
      version: v1
  template:
    metadata:
      labels:
        app: web
        version: v1
    spec:
      containers:
      - name: nginx
        image: nginx:1.24
        ports:
        - containerPort: 80
---
# Version 2 (canary)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-v2
  labels:
    app: web
    version: v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
      version: v2
  template:
    metadata:
      labels:
        app: web
        version: v2
    spec:
      containers:
      - name: nginx
        image: nginx:1.25  # New version
        ports:
        - containerPort: 80
---
# Service (selects both versions)
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  ports:
  - port: 80
  selector:
    app: web  # Note: No version selector
```

---

### TrafficSplit

**Split traffic 90/10**:
```yaml
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: web-split
  namespace: default
spec:
  service: web
  backends:
  - service: web-v1
    weight: 900   # 90%
  - service: web-v2
    weight: 100   # 10%
---
# Service for v1
apiVersion: v1
kind: Service
metadata:
  name: web-v1
spec:
  ports:
  - port: 80
  selector:
    app: web
    version: v1
---
# Service for v2
apiVersion: v1
kind: Service
metadata:
  name: web-v2
spec:
  ports:
  - port: 80
  selector:
    app: web
    version: v2
```

---

**Deploy and test**:
```bash
# Install SMI extension
linkerd smi install | kubectl apply -f -

# Deploy with Linkerd
cat canary.yaml | linkerd inject - | kubectl apply -f -

# Test traffic split
for i in {1..100}; do
  curl -s http://web | grep "nginx/" | cut -d'/' -f2
done | sort | uniq -c

# Output:
# 90 1.24.0    # 90% to v1
# 10 1.25.0    # 10% to v2
```

---

### Progressive Rollout

**Gradually increase canary**:
```bash
# Start: 10% canary
kubectl apply -f trafficsplit-10.yaml

# Wait and monitor
linkerd viz stat deploy/web-v2

# Increase: 50% canary
kubectl apply -f trafficsplit-50.yaml

# Monitor for issues
# If OK, go to 100%
kubectl apply -f trafficsplit-100.yaml

# Finally, delete v1
kubectl delete deploy web-v1
```

---

## 🔄 Reliability Features

### Automatic Retries

```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: HTTPRoute
metadata:
  name: api-retries
  namespace: default
spec:
  parentRefs:
  - name: api-service
    kind: Service
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    timeouts:
      request: 5s
    retry:
      conditions:
      - status: 5xx  # Retry on server errors
      attempts: 3    # Max 3 retries
      backoff:
        min: 100ms
        max: 1s
        jitter: 0.1
```

**Automatically retries failed requests!**

---

### Timeouts

```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: HTTPRoute
metadata:
  name: api-timeouts
spec:
  parentRefs:
  - name: api-service
    kind: Service
  rules:
  - timeouts:
      request: 10s   # Total request timeout
```

**Prevents hanging requests.**

---

### Rate Limiting

```yaml
apiVersion: policy.linkerd.io/v1alpha1
kind: RateLimit
metadata:
  name: api-rate-limit
  namespace: default
spec:
  targetRef:
    kind: Service
    name: api-service
  limits:
  - requests: 100
    unit: minute
  - requests: 1000
    unit: hour
```

---

## 🎯 Complete Example

### Three-Tier Application

**Frontend**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  type: LoadBalancer
  ports:
  - port: 80
  selector:
    app: frontend
```

---

**Backend API**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: api
        image: your-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          value: "postgresql://database:5432/myapp"
---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  ports:
  - port: 8080
  selector:
    app: backend
```

---

**Database**:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: database
  namespace: default
spec:
  serviceName: database
  replicas: 1
  selector:
    matchLabels:
      app: database
  template:
    metadata:
      labels:
        app: database
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          value: "secret123"
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: database
spec:
  clusterIP: None  # Headless
  ports:
  - port: 5432
  selector:
    app: database
```

---

### Deploy with Linkerd

```bash
# Annotate namespace for auto-injection
kubectl annotate namespace default linkerd.io/inject=enabled

# Deploy all services
cat frontend.yaml backend.yaml database.yaml | kubectl apply -f -

# Verify mesh
linkerd viz stat deploy

# Output:
# NAME       MESHED   SUCCESS   RPS   LATENCY_P50   LATENCY_P95   LATENCY_P99   TLS
# frontend      2/2   100.00%  5.2rps         2ms          5ms         10ms   100%
# backend       3/3   100.00%  5.2rps         3ms          8ms         15ms   100%
# database      1/1   100.00%  5.2rps         1ms          2ms          5ms   100%
```

---

### Configure Policies

**Retries for backend**:
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: HTTPRoute
metadata:
  name: backend-retries
  namespace: default
spec:
  parentRefs:
  - name: backend
    kind: Service
  rules:
  - retry:
      conditions:
      - status: 5xx
      attempts: 3
      backoff:
        min: 100ms
        max: 1s
```

**Timeouts for database**:
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: HTTPRoute
metadata:
  name: database-timeout
  namespace: default
spec:
  parentRefs:
  - name: database
    kind: Service
  rules:
  - timeouts:
      request: 30s
```

```bash
kubectl apply -f policies.yaml
```

---

## 🔍 Troubleshooting

### Proxy Not Injected

**Check**:
```bash
# Verify namespace annotation
kubectl get namespace default -o jsonpath='{.metadata.annotations}'

# Should show: linkerd.io/inject=enabled
```

**Fix**:
```bash
# Annotate namespace
kubectl annotate namespace default linkerd.io/inject=enabled

# Restart deployments
kubectl rollout restart deployment -n default
```

---

### mTLS Not Working

**Check control plane**:
```bash
linkerd check

# Look for ✗ marks
# Common issues:
# - Certificate expired
# - Control plane not running
# - Network policies blocking
```

---

### High Latency

**Check proxy resources**:
```bash
# View proxy CPU/memory
kubectl top pod -l linkerd.io/proxy-deployment

# Increase limits if needed
kubectl set resources deployment myapp \
  -c linkerd-proxy \
  --limits=cpu=500m,memory=512Mi
```

---

### Tap Not Showing Traffic

**Check authority**:
```bash
# Tap requires authority annotation
kubectl annotate deployment myapp config.linkerd.io/admin-port="4191"

# Restart
kubectl rollout restart deployment myapp
```

---

## 💡 Best Practices

### 1. Resource Limits

```yaml
spec:
  template:
    metadata:
      annotations:
        config.linkerd.io/proxy-cpu-request: "100m"
        config.linkerd.io/proxy-cpu-limit: "500m"
        config.linkerd.io/proxy-memory-request: "128Mi"
        config.linkerd.io/proxy-memory-limit: "512Mi"
```

---

### 2. Skip Ports

**Don't mesh database ports**:
```yaml
metadata:
  annotations:
    config.linkerd.io/skip-outbound-ports: "5432,3306"  # PostgreSQL, MySQL
```

---

### 3. Gradual Rollout

```bash
# Start with dev/staging
kubectl annotate namespace dev linkerd.io/inject=enabled

# Test thoroughly
# Then production
kubectl annotate namespace production linkerd.io/inject=enabled
```

---

### 4. Monitor Proxy Health

```bash
# Check proxy status
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[?(@.name=="linkerd-proxy")].ready}{"\n"}{end}'

# All should show "true"
```

---

### 5. Certificate Rotation

```bash
# Check certificate expiry
linkerd check --proxy

# Rotate before expiry (default: 24 hours for proxy certs)
```

---

## 🔗 What's Next?

**Monitoring**:
- **[k0s-monitoring](k0s-monitoring)** - Prometheus integration

**Security**:
- **[../security/zero-trust-networking](../security/zero-trust-networking)** - Zero Trust architecture

**Container Registry**:
- **[container-registry-integration](container-registry-integration)** - Private registries

---

## 📚 Resources

**Linkerd**:
- [Official Documentation](https://linkerd.io/docs/)
- [Getting Started](https://linkerd.io/getting-started/)
- [Architecture](https://linkerd.io/architecture/)

**Service Mesh**:
- [Service Mesh Comparison](https://servicemesh.es/)
- [SMI Spec](https://smi-spec.io/)

---

## 📝 Change Log

### 2026-01-30
- Created Linkerd guide
- Explained service mesh concepts
- Covered installation on k0s
- Demonstrated automatic mTLS
- Showed traffic splitting
- Implemented reliability features
- Complete three-tier example
- Added policy configuration
- Troubleshooting guide
- Best practices

---

**Next Article**: [container-registry-integration](container-registry-integration) - Private registries!
