# Container Best Practices - Production Readiness

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Production & Security  
**Prerequisites**: [docker-basics](docker-basics), [kubernetes-concepts](kubernetes-concepts)  
**Time**: 4-5 hours  
**Tags**: containers, docker, kubernetes, security, optimization, production

## Summary

Master production container patterns. Learn security hardening, image optimization, resource management, monitoring, disaster recovery, and complete production readiness checklists for containerized applications.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Build secure container images
- ✅ Optimize image size and build time
- ✅ Implement security scanning
- ✅ Configure resource limits properly
- ✅ Set up health checks and monitoring
- ✅ Handle secrets securely
- ✅ Plan disaster recovery
- ✅ Pass production readiness review

## 🔒 Security Best Practices

### Use Minimal Base Images

**Bad - Large attack surface**:
```dockerfile
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    python3 python3-pip
COPY . /app
CMD ["python3", "app.py"]
```
- **Size**: 500+ MB
- **Vulnerabilities**: Many
- **Attack surface**: Large

---

**Good - Minimal base**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```
- **Size**: 150 MB
- **Fewer vulnerabilities**

---

**Better - Distroless**:
```dockerfile
# Build stage
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM gcr.io/distroless/python3-debian11
COPY --from=builder /root/.local /root/.local
COPY . /app
WORKDIR /app
ENV PATH=/root/.local/bin:$PATH
CMD ["app.py"]
```
- **Size**: 80 MB
- **No shell** (more secure)
- **No package manager** (can't install malware)

---

**Best - Scratch for static binaries**:
```dockerfile
# Build stage
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

# Runtime stage
FROM scratch
COPY --from=builder /app/app /app
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 8080
USER 1000:1000
ENTRYPOINT ["/app"]
```
- **Size**: 10 MB
- **Nothing but your app**
- **Most secure**

---

### Don't Run as Root

**Bad**:
```dockerfile
FROM node:18
COPY . /app
WORKDIR /app
RUN npm install
CMD ["node", "server.js"]
# Runs as root (UID 0)
```

**Good**:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

CMD ["node", "server.js"]
```

**In Kubernetes**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
  
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
```

---

### Scan for Vulnerabilities

**Trivy** (recommended):
```bash
# Install
brew install trivy

# Scan image
trivy image myapp:latest

# Output:
# myapp:latest (alpine 3.18.0)
# ==========================
# Total: 2 (HIGH: 1, CRITICAL: 1)
#
# ┌───────────────┬────────────────┬──────────┬───────────────────┬───────────────┬──────────────────────────────────────┐
# │    Library    │ Vulnerability  │ Severity │ Installed Version │ Fixed Version │                Title                 │
# ├───────────────┼────────────────┼──────────┼───────────────────┼───────────────┼──────────────────────────────────────┤
# │ openssl       │ CVE-2023-12345 │ CRITICAL │ 3.0.8-r0          │ 3.0.9-r0      │ OpenSSL: Buffer overflow             │
# │ curl          │ CVE-2023-67890 │ HIGH     │ 8.1.0-r0          │ 8.1.2-r0      │ curl: Authentication bypass          │
# └───────────────┴────────────────┴──────────┴───────────────────┴───────────────┴──────────────────────────────────────┘

# Fail on severity
trivy image --severity HIGH,CRITICAL --exit-code 1 myapp:latest

# In CI/CD
docker build -t myapp:latest .
trivy image --severity HIGH,CRITICAL --exit-code 1 myapp:latest
docker push myapp:latest
```

---

**Grype**:
```bash
# Install
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh

# Scan
grype myapp:latest

# JSON output
grype myapp:latest -o json > vulnerabilities.json
```

---

**Snyk**:
```bash
# Install
npm install -g snyk

# Authenticate
snyk auth

# Scan Dockerfile
snyk container test myapp:latest

# Monitor continuously
snyk container monitor myapp:latest
```

---

### Multi-Stage Builds

**Without multi-stage** (bad):
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install  # Includes devDependencies
RUN npm run build
CMD ["node", "dist/server.js"]
# Final image: 1.2 GB (includes build tools, source, tests)
```

---

**With multi-stage** (good):
```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Runtime
FROM node:18-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node
CMD ["node", "dist/server.js"]
# Final image: 200 MB (only runtime dependencies)
```

---

**Complex multi-stage**:
```dockerfile
# Stage 1: Dependencies
FROM golang:1.21 AS deps
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

# Stage 2: Build
FROM deps AS builder
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o app

# Stage 3: Test
FROM builder AS tester
RUN go test -v ./...

# Stage 4: Runtime
FROM alpine:3.18
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/app .
USER nobody
ENTRYPOINT ["/app/app"]
```

**Build specific stage**:
```bash
# Build and test
docker build --target tester -t myapp:test .

# Build for production
docker build --target runtime -t myapp:latest .
```

---

### Secrets Management

**Never hardcode secrets** ❌:
```dockerfile
# BAD - Don't do this!
ENV DATABASE_PASSWORD=supersecret123
ENV API_KEY=sk-abc123def456
```

---

**Docker secrets** (Swarm):
```bash
# Create secret
echo "supersecret123" | docker secret create db_password -

# Use in service
docker service create \
  --name myapp \
  --secret db_password \
  myapp:latest

# In container: /run/secrets/db_password
```

**Dockerfile**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
CMD ["python", "-c", "print(open('/run/secrets/db_password').read())"]
```

---

**Kubernetes secrets**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  db-password: "supersecret123"
  api-key: "sk-abc123def456"
---
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: db-password
    # Or mount as files
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secrets
    secret:
      secretName: app-secrets
```

---

**External secrets** (recommended):
```yaml
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace

# AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: db-password
    remoteRef:
      key: production/database
      property: password
```

---

## 📦 Image Optimization

### Layer Caching

**Bad - Cache busted every time**:
```dockerfile
FROM node:18
WORKDIR /app
COPY . .                    # Everything copied first
RUN npm install             # Cache invalidated on any file change
CMD ["node", "server.js"]
```

---

**Good - Optimize caching**:
```dockerfile
FROM node:18
WORKDIR /app

# Copy dependency files first (changes rarely)
COPY package*.json ./
RUN npm ci --only=production  # Cached unless package.json changes

# Copy source code (changes frequently)
COPY . .

CMD ["node", "server.js"]
```

**Build time**:
- First build: 5 minutes
- Rebuild with code change: 10 seconds (reuses npm install)

---

### .dockerignore

**.dockerignore**:
```
# Don't copy to image
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
*.md
Dockerfile
docker-compose.yml
.vscode
.idea
*.test.js
coverage/
.DS_Store
dist/
build/
```

**Benefits**:
- Faster builds
- Smaller context
- Fewer secrets leaked

---

### Minimize Layers

**Bad - Many layers**:
```dockerfile
FROM ubuntu:22.04
RUN apt-get update
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get clean
# 7 layers
```

---

**Good - Combined layers**:
```dockerfile
FROM ubuntu:22.04
RUN apt-get update && \
    apt-get install -y \
        python3 \
        python3-pip \
        curl \
        git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
# 2 layers
```

---

### BuildKit and Cache Mounts

**Enable BuildKit**:
```bash
export DOCKER_BUILDKIT=1
docker build -t myapp .
```

**Cache mounts** (faster builds):
```dockerfile
# syntax=docker/dockerfile:1
FROM golang:1.21
WORKDIR /app
COPY go.mod go.sum ./

# Cache Go modules
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

# Cache build cache
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o app

FROM alpine:3.18
COPY --from=0 /app/app /app
ENTRYPOINT ["/app"]
```

**Python example**:
```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .

# Cache pip packages
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .
CMD ["python", "app.py"]
```

---

## 🎯 Resource Management

### Set Resource Limits

**Docker**:
```bash
docker run -d \
  --name myapp \
  --memory="512m" \
  --memory-swap="512m" \
  --cpus="0.5" \
  --restart=unless-stopped \
  myapp:latest
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  web:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    restart: unless-stopped
```

---

**Kubernetes**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          requests:
            cpu: 100m        # 0.1 CPU core minimum
            memory: 128Mi    # 128 MiB minimum
          limits:
            cpu: 500m        # 0.5 CPU core maximum
            memory: 512Mi    # 512 MiB maximum
        
        # Prevent OOMKilled
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Why limits matter**:
- **Without limits**: One container can consume all node resources
- **With limits**: Predictable performance, fair resource sharing
- **OOMKilled**: Container killed if exceeds memory limit

---

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

**Test autoscaling**:
```bash
# Generate load
kubectl run -it --rm load-generator --image=busybox:1.36 -- /bin/sh
while true; do wget -q -O- http://myapp; done

# Watch scaling
kubectl get hpa myapp-hpa --watch

# Output:
# NAME        REFERENCE          TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
# myapp-hpa   Deployment/myapp   45%/70%    2         10        2          1m
# myapp-hpa   Deployment/myapp   85%/70%    2         10        2          2m
# myapp-hpa   Deployment/myapp   85%/70%    2         10        4          3m  # Scaled up
```

---

## 🏥 Health Checks

### Comprehensive Health Checks

**Simple health endpoint** (Node.js):
```javascript
const express = require('express');
const app = express();

let isShuttingDown = false;
let dbConnected = false;

// Database check
const checkDatabase = async () => {
  try {
    await db.ping();
    dbConnected = true;
    return true;
  } catch (error) {
    dbConnected = false;
    return false;
  }
};

// Liveness: Am I alive?
app.get('/health', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'shutting down' });
  }
  res.json({ status: 'ok' });
});

// Readiness: Can I serve traffic?
app.get('/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    memory: process.memoryUsage().heapUsed < 450 * 1024 * 1024, // < 450MB
  };
  
  const allHealthy = Object.values(checks).every(v => v);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not ready',
    checks
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  isShuttingDown = true;
  
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

const server = app.listen(8080);
```

---

**Kubernetes probes**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    ports:
    - containerPort: 8080
    
    # Startup: For slow-starting apps
    startupProbe:
      httpGet:
        path: /health
        port: 8080
      failureThreshold: 30  # 30 * 10s = 5 minutes max startup time
      periodSeconds: 10
    
    # Liveness: Restart if unhealthy
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 0  # startupProbe protects this
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    
    # Readiness: Remove from service if not ready
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 2
    
    # Graceful shutdown
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 15"]  # Wait for connections to drain
```

---

## 📊 Logging and Monitoring

### Structured Logging

**Bad - Unstructured logs**:
```javascript
console.log('User login');
console.log('Processing order 12345');
console.log('Error: Database timeout');
```

---

**Good - Structured JSON logs**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('User login', {
  userId: '123',
  email: 'user@example.com',
  ip: '192.168.1.1'
});

logger.info('Processing order', {
  orderId: '12345',
  userId: '123',
  amount: 99.99,
  items: 3
});

logger.error('Database timeout', {
  error: err.message,
  stack: err.stack,
  query: 'SELECT * FROM users',
  duration: 5000
});
```

**Output**:
```json
{"level":"info","message":"User login","timestamp":"2026-01-30T10:15:30.123Z","userId":"123","email":"user@example.com","ip":"192.168.1.1"}
{"level":"info","message":"Processing order","timestamp":"2026-01-30T10:15:31.456Z","orderId":"12345","userId":"123","amount":99.99,"items":3}
{"level":"error","message":"Database timeout","timestamp":"2026-01-30T10:15:32.789Z","error":"Connection timeout","query":"SELECT * FROM users","duration":5000}
```

**Benefits**:
- Easy to parse
- Searchable in log aggregators
- Consistent format

---

### Export Metrics

**Prometheus metrics** (Node.js):
```javascript
const express = require('express');
const promClient = require('prom-client');

const app = express();
const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode
      },
      duration
    );
    
    activeConnections.dec();
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(8080);
```

---

## 🔄 Deployment Strategies

### Rolling Update

**Kubernetes**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # Create 25% extra pods during rollout
      maxUnavailable: 25%  # Max 25% pods can be unavailable
  template:
    spec:
      containers:
      - name: app
        image: myapp:v2
```

**Process**:
1. Create 2-3 new pods (maxSurge)
2. Wait for them to become ready
3. Terminate 2-3 old pods
4. Repeat until all updated

**Rollback**:
```bash
# Check history
kubectl rollout history deployment/myapp

# Rollback to previous
kubectl rollout undo deployment/myapp

# Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=3
```

---

### Blue-Green Deployment

**Setup**:
```yaml
# Blue (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
  labels:
    app: myapp
    version: blue
spec:
  replicas: 5
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
      - name: app
        image: myapp:v1
---
# Green (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
  labels:
    app: myapp
    version: green
spec:
  replicas: 5
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
      - name: app
        image: myapp:v2
---
# Service (switch traffic)
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue  # Change to 'green' to switch
  ports:
  - port: 80
    targetPort: 8080
```

**Deployment process**:
```bash
# 1. Deploy green
kubectl apply -f myapp-green.yaml

# 2. Test green
kubectl port-forward deployment/myapp-green 8080:8080
curl http://localhost:8080

# 3. Switch traffic to green
kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Monitor
kubectl get pods -l app=myapp -w

# 5. If problems, instant rollback
kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'

# 6. Clean up blue
kubectl delete deployment myapp-blue
```

---

### Canary Deployment

**With Flagger** (recommended):
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
    webhooks:
    - name: load-test
      url: http://flagger-loadtester/
      timeout: 5s
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://myapp-canary/"
```

**Process**:
1. Deploy new version (canary)
2. Send 10% traffic to canary
3. Check metrics (success rate, latency)
4. If good, increase to 20%, 30%, etc.
5. If bad, rollback automatically
6. Promote to 100% if all checks pass

---

## 💾 Backup and Disaster Recovery

### Backup Strategies

**Database backups** (CronJob):
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/sh
            - -c
            - |
              BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql.gz"
              pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > /backup/$BACKUP_FILE
              
              # Upload to S3
              aws s3 cp /backup/$BACKUP_FILE s3://my-backups/postgres/$BACKUP_FILE
              
              # Keep only last 7 days locally
              find /backup -name "backup-*.sql.gz" -mtime +7 -delete
              
              echo "Backup completed: $BACKUP_FILE"
            env:
            - name: DB_HOST
              value: "postgres.default.svc.cluster.local"
            - name: DB_USER
              value: "postgres"
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: postgres-backup-pvc
```

---

**Volume snapshots** (Kubernetes):
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: postgres-snapshot
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: postgres-data
---
# Restore from snapshot
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-restored
spec:
  storageClassName: local-path
  dataSource:
    name: postgres-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

---

### Disaster Recovery Plan

**1. Documentation**:
```markdown
# Disaster Recovery Plan

## RTO (Recovery Time Objective): 1 hour
## RPO (Recovery Point Objective): 24 hours

### Backup Schedule
- **Database**: Daily at 2 AM UTC, retained 30 days
- **Volume snapshots**: Daily at 3 AM UTC, retained 7 days
- **Configuration**: Git repository, always available

### Recovery Procedures

#### Scenario 1: Database Corruption
1. Stop application: `kubectl scale deployment myapp --replicas=0`
2. Restore latest backup from S3
3. Start application: `kubectl scale deployment myapp --replicas=5`
4. Verify: Check logs and health endpoints
5. Expected time: 15 minutes

#### Scenario 2: Complete Cluster Loss
1. Provision new k0s cluster (Terraform)
2. Install ArgoCD
3. Connect to Git repository
4. ArgoCD syncs all applications
5. Restore database from S3 backup
6. Update DNS to new cluster
7. Expected time: 45 minutes
```

---

**2. Test regularly**:
```bash
# Monthly DR test
./scripts/dr-test.sh

# Script:
#!/bin/bash
set -e

echo "Starting DR test..."

# Create test namespace
kubectl create namespace dr-test

# Deploy from backup
kubectl apply -f manifests/ -n dr-test

# Restore database
kubectl exec -n dr-test postgres-0 -- psql -c "CREATE DATABASE test;"
aws s3 cp s3://backups/latest.sql.gz - | gunzip | kubectl exec -i -n dr-test postgres-0 -- psql test

# Run smoke tests
./tests/smoke-test.sh --namespace dr-test

# Cleanup
kubectl delete namespace dr-test

echo "DR test completed successfully"
```

---

## ✅ Production Readiness Checklist

### Security ✓

- [ ] Running as non-root user
- [ ] Read-only root filesystem where possible
- [ ] No privileged containers
- [ ] Secrets in external secret manager
- [ ] TLS everywhere (internal and external)
- [ ] Network policies configured
- [ ] Container image scanning enabled
- [ ] RBAC configured with least privilege
- [ ] Audit logging enabled

---

### Reliability ✓

- [ ] Liveness probe configured
- [ ] Readiness probe configured
- [ ] Startup probe for slow apps
- [ ] Graceful shutdown handling
- [ ] Resource limits set
- [ ] Multiple replicas (≥2)
- [ ] Pod disruption budget
- [ ] Horizontal autoscaling configured
- [ ] Rolling update strategy

---

### Observability ✓

- [ ] Structured logging (JSON)
- [ ] Metrics exported (Prometheus)
- [ ] Distributed tracing (optional)
- [ ] Health endpoints (/health, /ready)
- [ ] Dashboard created (Grafana)
- [ ] Alerts configured
- [ ] Log aggregation (Loki/ELK)
- [ ] Error tracking (Sentry)

---

### Performance ✓

- [ ] Image size optimized (< 500 MB)
- [ ] Multi-stage build
- [ ] Layer caching optimized
- [ ] .dockerignore configured
- [ ] Resource requests match actual usage
- [ ] Database connection pooling
- [ ] Caching enabled (Redis)
- [ ] CDN for static assets

---

### Disaster Recovery ✓

- [ ] Automated backups
- [ ] Backup restoration tested
- [ ] Multi-AZ/region deployment
- [ ] Volume snapshots enabled
- [ ] Documented recovery procedures
- [ ] RTO/RPO defined
- [ ] Regular DR drills
- [ ] Configuration in Git

---

## 🎯 Complete Production Example

### Application

**Dockerfile**:
```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Runtime image
FROM gcr.io/distroless/nodejs18-debian11

WORKDIR /app

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Non-root user (distroless uses UID 65532)
USER nonroot:nonroot

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 8080

CMD ["dist/server.js"]
```

---

**Kubernetes manifests**:
```yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    name: production
---
# ResourceQuota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
---
# NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ingress-controller
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1.2.3
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
        fsGroup: 65532
      
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - myapp
            topologyKey: kubernetes.io/hostname
      
      containers:
      - name: app
        image: myregistry.com/myapp:v1.2.3
        imagePullPolicy: IfNotPresent
        
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        - name: DB_HOST
          value: "postgres.production.svc.cluster.local"
        - name: REDIS_HOST
          value: "redis.production.svc.cluster.local"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        
        startupProbe:
          httpGet:
            path: /health
            port: 8080
          failureThreshold: 30
          periodSeconds: 10
        
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      
      volumes:
      - name: tmp
        emptyDir: {}
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - name: http
    port: 80
    targetPort: 8080
---
# HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 5
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
---
# PodDisruptionBudget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp
  namespace: production
spec:
  minAvailable: 3
  selector:
    matchLabels:
      app: myapp
```

---

## 💡 Best Practices Summary

### 1. Security First
- Use minimal base images
- Run as non-root
- Scan for vulnerabilities
- External secrets management
- Network policies

### 2. Optimize Images
- Multi-stage builds
- Layer caching
- .dockerignore
- BuildKit cache mounts

### 3. Set Limits
- CPU and memory requests/limits
- Proper QoS class
- Resource quotas per namespace

### 4. Health Checks
- Startup, liveness, readiness probes
- Graceful shutdown
- Meaningful health endpoints

### 5. Observability
- Structured logging
- Metrics export
- Distributed tracing
- Alerting

### 6. Deployment Safety
- Rolling updates
- Multiple replicas
- Pod disruption budgets
- Blue-green or canary deployments

### 7. Disaster Recovery
- Automated backups
- Test restoration
- Document procedures
- Regular drills

---

## 🔗 What's Next?

**Advanced Topics**:
- **[k0s-monitoring](k0s-monitoring)** - Prometheus and Grafana
- **[service-mesh-linkerd](service-mesh-linkerd)** - mTLS and observability

**Related**:
- **[gitops-principles](../infrastructure/gitops-principles)** - Automated deployments
- **[infrastructure-testing](../infrastructure/infrastructure-testing)** - Test everything

---

## 📚 Resources

**Security**:
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Trivy](https://trivy.dev/)
- [Distroless Images](https://github.com/GoogleContainerTools/distroless)

**Best Practices**:
- [12-Factor App](https://12factor.net/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

**Tools**:
- [Hadolint](https://github.com/hadolint/hadolint) - Dockerfile linter
- [Dive](https://github.com/wagoodman/dive) - Image layer analyzer

---

## 📝 Change Log

### 2026-01-30
- Created container best practices guide
- Security hardening patterns
- Image optimization strategies
- Resource management
- Health checks and graceful shutdown
- Logging and monitoring
- Deployment strategies
- Disaster recovery
- Complete production checklist
- Real-world production example

---

**Congratulations!** You've completed the containers series. Ready for production! 🚀
