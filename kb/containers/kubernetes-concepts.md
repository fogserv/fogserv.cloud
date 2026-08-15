# Kubernetes Concepts - Core Objects and Patterns

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Kubernetes Fundamentals  
**Prerequisites**: [k0s-installation](k0s-installation), [docker-basics](docker-basics)  
**Time**: 3-4 hours  
**Tags**: kubernetes, k8s, workloads, jobs, cronjobs, daemonsets, configmaps, secrets

## Summary

Master core Kubernetes concepts and object types. Learn Jobs, CronJobs, DaemonSets, ConfigMaps, Secrets, resource management, and essential patterns for production workloads beyond basic Deployments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Kubernetes architecture
- ✅ Use Jobs and CronJobs
- ✅ Deploy DaemonSets
- ✅ Manage ConfigMaps and Secrets
- ✅ Configure resource limits
- ✅ Implement health checks
- ✅ Use init containers
- ✅ Apply pod affinity rules

## 🏗️ Kubernetes Architecture

### Control Plane Components

```
┌───────────────────────────────────────────────┐
│            Control Plane                       │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ API      │  │ Scheduler│  │Controller│   │
│  │ Server   │  │          │  │ Manager  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  ┌──────────────────────────────────┐        │
│  │         etcd (Data Store)        │        │
│  └──────────────────────────────────┘        │
└───────────────────────────────────────────────┘
            ↓
┌───────────────────────────────────────────────┐
│              Worker Nodes                      │
│                                               │
│  Node 1            Node 2            Node 3   │
│  ┌──────────┐     ┌──────────┐     ┌──────┐  │
│  │ kubelet  │     │ kubelet  │     │kubelet│ │
│  │ kube-proxy     │ kube-proxy     │kube-pr│ │
│  │ Container      │ Container      │Contain│ │
│  │ Runtime  │     │ Runtime  │     │Runtime│ │
│  └──────────┘     └──────────┘     └──────┘  │
└───────────────────────────────────────────────┘
```

**Control Plane**:
- **API Server**: Frontend for Kubernetes API
- **Scheduler**: Assigns pods to nodes
- **Controller Manager**: Runs controllers (Deployment, ReplicaSet)
- **etcd**: Key-value store for cluster data

**Worker Nodes**:
- **kubelet**: Agent running on each node
- **kube-proxy**: Network proxy
- **Container Runtime**: Docker, containerd, CRI-O

---

## 📦 Core Workload Types

### Pod

**Smallest deployable unit**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    ports:
    - containerPort: 80
```

**Note**: Usually don't create Pods directly, use Deployments.

---

### Deployment

**For stateless applications** (covered in k0s articles):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
```

**Use for**: Web servers, APIs, microservices

---

### StatefulSet

**For stateful applications** (covered in [k0s-storage](k0s-storage)):
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: database
spec:
  serviceName: database
  replicas: 3
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
      - name: postgres
        image: postgres:15
```

**Use for**: Databases, message queues, stateful apps

---

### DaemonSet

**Runs on every node**:
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        ports:
        - containerPort: 9100
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
```

**Use for**:
- Monitoring agents (node-exporter)
- Log collectors (fluentd)
- Network plugins
- Storage drivers

**Verify**:
```bash
kubectl get ds -n monitoring

# Output:
# NAME            DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
# node-exporter   3         3         3       3            3           <none>          2m

# Should have 1 pod per node
kubectl get pods -n monitoring -o wide
```

---

### Job

**Run to completion**:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-migration
spec:
  completions: 1        # Run once
  backoffLimit: 4       # Retry 4 times on failure
  activeDeadlineSeconds: 600  # Timeout after 10 minutes
  template:
    spec:
      restartPolicy: Never  # Don't restart on failure
      containers:
      - name: migrate
        image: myapp:latest
        command: ["python", "migrate.py"]
        env:
        - name: DATABASE_URL
          value: "postgresql://db:5432/myapp"
```

**Run job**:
```bash
kubectl apply -f job.yaml

# Check status
kubectl get jobs

# Output:
# NAME             COMPLETIONS   DURATION   AGE
# data-migration   1/1           45s        2m

# View logs
kubectl logs job/data-migration
```

**Parallel jobs**:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-processing
spec:
  parallelism: 5    # Run 5 pods in parallel
  completions: 100  # Need 100 successful completions
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: worker
        image: worker:latest
        command: ["./process-batch.sh"]
```

**Use for**:
- Database migrations
- Batch processing
- One-time tasks
- Data imports/exports

---

### CronJob

**Scheduled jobs**:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-database
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 2
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
              pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
              gzip > /backup/db-$(date +%Y%m%d-%H%M%S).sql.gz
            env:
            - name: DB_HOST
              value: "database.default.svc.cluster.local"
            - name: DB_USER
              value: "postgres"
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: backup-pvc
```

**Cron schedule format**:
```
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
# │ │ │ │ │
# * * * * *

"0 2 * * *"     # 2 AM daily
"*/15 * * * *"  # Every 15 minutes
"0 */6 * * *"   # Every 6 hours
"0 0 * * 0"     # Weekly (Sunday midnight)
"0 0 1 * *"     # Monthly (1st of month)
```

**Common CronJobs**:
```yaml
---
# Cleanup old data
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-old-data
spec:
  schedule: "0 3 * * *"  # 3 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: cleanup
            image: myapp:latest
            command: ["python", "cleanup.py", "--days", "30"]
---
# Generate reports
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
spec:
  schedule: "0 8 * * 1-5"  # 8 AM weekdays
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: report
            image: report-generator:latest
            command: ["./generate-report.sh"]
```

**Manage CronJobs**:
```bash
# List CronJobs
kubectl get cronjobs

# See recent jobs
kubectl get jobs --sort-by=.status.startTime

# Manually trigger
kubectl create job --from=cronjob/backup-database manual-backup

# Suspend (stop scheduling)
kubectl patch cronjob backup-database -p '{"spec":{"suspend":true}}'

# Resume
kubectl patch cronjob backup-database -p '{"spec":{"suspend":false}}'
```

---

## ⚙️ ConfigMaps and Secrets

### ConfigMap

**Store configuration data**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # Key-value pairs
  app.env: "production"
  log.level: "info"
  
  # Multi-line configuration
  nginx.conf: |
    server {
      listen 80;
      server_name example.com;
      root /var/www/html;
    }
  
  # JSON configuration
  database.json: |
    {
      "host": "database.default.svc.cluster.local",
      "port": 5432,
      "name": "myapp"
    }
```

**Create from file**:
```bash
# From file
kubectl create configmap app-config --from-file=app.properties

# From literal
kubectl create configmap app-config \
  --from-literal=app.env=production \
  --from-literal=log.level=info

# From directory
kubectl create configmap app-config --from-file=config/
```

---

**Use in Pod**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    
    # Method 1: Environment variables
    env:
    - name: APP_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: app.env
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: log.level
    
    # Method 2: All keys as env vars
    envFrom:
    - configMapRef:
        name: app-config
    
    # Method 3: Mount as volume
    volumeMounts:
    - name: config
      mountPath: /etc/config
      readOnly: true
  
  volumes:
  - name: config
    configMap:
      name: app-config
```

**Access in container**:
```bash
# Environment variables
echo $APP_ENV
# Output: production

# Files (if mounted)
cat /etc/config/nginx.conf
```

---

### Secrets

**Store sensitive data**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  # Base64 encoded (not encrypted!)
  username: cG9zdGdyZXM=        # postgres
  password: c3VwZXJzZWNyZXQ=    # supersecret
```

**Create secret**:
```bash
# From literal
kubectl create secret generic db-credentials \
  --from-literal=username=postgres \
  --from-literal=password=supersecret

# From file
kubectl create secret generic ssh-key --from-file=id_rsa=~/.ssh/id_rsa

# TLS certificate
kubectl create secret tls myapp-tls \
  --cert=myapp.crt \
  --key=myapp.key
```

---

**Use in Pod**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    
    # Environment variables
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
    
    # Mount as volume
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true
  
  volumes:
  - name: secrets
    secret:
      secretName: db-credentials
      defaultMode: 0400  # Read-only for owner
```

**Security notes**:
- ⚠️ Secrets are base64 encoded, not encrypted
- 🔒 Enable encryption at rest in etcd
- 🔐 Use RBAC to restrict access
- 🛡️ Consider external secrets (Vault, AWS Secrets Manager)

---

## 🎯 Resource Management

### Resource Requests and Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    resources:
      requests:
        cpu: 250m        # 0.25 CPU cores (minimum)
        memory: 512Mi    # 512 MiB (minimum)
      limits:
        cpu: 500m        # 0.5 CPU cores (maximum)
        memory: 1Gi      # 1 GiB (maximum)
```

**Units**:
- **CPU**: `100m` = 0.1 cores, `1` = 1 core, `2` = 2 cores
- **Memory**: `128Mi` = 128 MiB, `1Gi` = 1 GiB

**What happens**:
- **Requests**: Scheduler ensures node has resources
- **Limits**: Container killed if exceeded (memory), throttled (CPU)

---

### Quality of Service (QoS)

**Guaranteed** (highest priority):
```yaml
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 500m      # Same as requests
    memory: 1Gi    # Same as requests
```

**Burstable** (medium priority):
```yaml
resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 500m      # Higher than requests
    memory: 1Gi
```

**BestEffort** (lowest priority):
```yaml
# No requests or limits
```

**Priority during eviction**:
1. BestEffort pods killed first
2. Burstable pods next
3. Guaranteed pods last

---

### LimitRange

**Set defaults for namespace**:
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: default
spec:
  limits:
  - default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    max:
      cpu: 2
      memory: 4Gi
    min:
      cpu: 50m
      memory: 64Mi
    type: Container
```

**Enforces**:
- Minimum resources
- Maximum resources
- Default requests/limits if not specified

---

### ResourceQuota

**Limit namespace resources**:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "10"       # Max 10 CPU cores requested
    requests.memory: 20Gi    # Max 20 GiB memory requested
    limits.cpu: "20"         # Max 20 CPU cores limit
    limits.memory: 40Gi      # Max 40 GiB memory limit
    pods: "50"               # Max 50 pods
    services: "20"           # Max 20 services
    persistentvolumeclaims: "10"  # Max 10 PVCs
```

```bash
# Check quota usage
kubectl get resourcequota -n dev

# Output:
# NAME        AGE   REQUEST                                        LIMIT
# dev-quota   5m    requests.cpu: 5/10, requests.memory: 10Gi/20Gi   limits.cpu: 10/20, limits.memory: 20Gi/40Gi
```

---

## 🏥 Health Checks

### Liveness Probe

**Restart container if unhealthy**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30  # Wait 30s before first check
      periodSeconds: 10        # Check every 10s
      timeoutSeconds: 5        # Timeout after 5s
      failureThreshold: 3      # Restart after 3 failures
```

**Probe types**:
```yaml
# HTTP GET
livenessProbe:
  httpGet:
    path: /health
    port: 8080
    httpHeaders:
    - name: Custom-Header
      value: HealthCheck

# TCP Socket
livenessProbe:
  tcpSocket:
    port: 8080

# Command execution
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
```

---

### Readiness Probe

**Remove from service if not ready**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 2
```

**Difference from liveness**:
- **Liveness**: Restart container
- **Readiness**: Remove from service endpoints

---

### Startup Probe

**For slow-starting containers**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    startupProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 10
      failureThreshold: 30  # 30 * 10 = 300s = 5 minutes max startup
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      periodSeconds: 10
```

**Use when**: Application takes minutes to start

---

## 🔧 Init Containers

**Run before main containers**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  # Init containers run sequentially, in order
  initContainers:
  - name: wait-for-db
    image: busybox:1.36
    command:
    - sh
    - -c
    - |
      until nc -z database 5432; do
        echo "Waiting for database..."
        sleep 2
      done
      echo "Database ready!"
  
  - name: run-migrations
    image: myapp:latest
    command: ["python", "migrate.py"]
    env:
    - name: DATABASE_URL
      value: "postgresql://database:5432/myapp"
  
  # Main container starts after all init containers succeed
  containers:
  - name: app
    image: myapp:latest
    ports:
    - containerPort: 8080
```

**Use cases**:
- Wait for dependencies
- Run database migrations
- Fetch configuration from remote
- Set up file permissions
- Clone git repositories

---

## 📍 Pod Affinity and Anti-Affinity

### Node Affinity

**Schedule pods on specific nodes**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  affinity:
    nodeAffinity:
      # Required: Must match
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: disktype
            operator: In
            values:
            - ssd
      
      # Preferred: Try to match
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values:
            - us-east-1a
  
  containers:
  - name: app
    image: myapp:latest
```

**Label nodes**:
```bash
kubectl label nodes worker-1 disktype=ssd
kubectl label nodes worker-1 zone=us-east-1a
```

---

### Pod Affinity

**Schedule pods near other pods**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cache
spec:
  replicas: 3
  template:
    spec:
      affinity:
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - web
            topologyKey: kubernetes.io/hostname
      
      containers:
      - name: redis
        image: redis:7
```

**Schedules cache pods on same nodes as web pods.**

---

### Pod Anti-Affinity

**Spread pods across nodes**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - web
            topologyKey: kubernetes.io/hostname
      
      containers:
      - name: nginx
        image: nginx:1.25
```

**Ensures each web pod on different node (high availability).**

---

## 🎯 Complete Example

### Multi-Tier Application

**Namespace with quota**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    pods: "100"
```

---

**ConfigMap**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
  API_TIMEOUT: "30"
```

**Secret**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
stringData:
  DB_PASSWORD: "supersecret123"
  API_KEY: "secret-api-key"
```

---

**Web application**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: web
      tier: frontend
  template:
    metadata:
      labels:
        app: web
        tier: frontend
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - web
              topologyKey: kubernetes.io/hostname
      
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        
        envFrom:
        - configMapRef:
            name: app-config
        
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: API_KEY
        
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
        
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

**Background workers**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: worker
      tier: backend
  template:
    metadata:
      labels:
        app: worker
        tier: backend
    spec:
      initContainers:
      - name: wait-for-db
        image: busybox:1.36
        command: ['sh', '-c', 'until nc -z database 5432; do sleep 2; done']
      
      containers:
      - name: worker
        image: worker:latest
        envFrom:
        - configMapRef:
            name: app-config
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
        
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
```

---

**Scheduled jobs**:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup
  namespace: production
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: cleanup
            image: worker:latest
            command: ["python", "cleanup.py"]
            envFrom:
            - configMapRef:
                name: app-config
            env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: DB_PASSWORD
            resources:
              requests:
                cpu: 100m
                memory: 256Mi
              limits:
                cpu: 200m
                memory: 512Mi
```

---

**Monitoring DaemonSet**:
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: production
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      hostPID: true
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        ports:
        - containerPort: 9100
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 100m
            memory: 128Mi
```

---

## 💡 Best Practices

### 1. Always Set Resource Limits

```yaml
# Good
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# Bad: No limits (can consume all node resources)
```

---

### 2. Use Health Checks

```yaml
# At minimum: liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  periodSeconds: 10

# Better: liveness + readiness
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
```

---

### 3. ConfigMaps for Configuration

```yaml
# Good: Externalized configuration
configMapRef:
  name: app-config

# Bad: Hardcoded in image
ENV DATABASE_URL=postgresql://...
```

---

### 4. Never Commit Secrets to Git

```bash
# Good: Create from command
kubectl create secret generic db-creds --from-literal=password=secret

# Bad: Commit secret YAML to Git
# Use Sealed Secrets or External Secrets Operator
```

---

### 5. Use Namespaces

```bash
# Separate environments
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace production

# Apply resource quotas per namespace
```

---

## 🔗 What's Next?

**Advanced Topics**:
- **[kubernetes-operators](kubernetes-operators)** - Custom controllers
- **[container-best-practices](container-best-practices)** - Production patterns

**Related**:
- **[k0s-monitoring](k0s-monitoring)** - Monitor workloads
- **[k0s-storage](k0s-storage)** - Persistent storage

---

## 📚 Resources

**Kubernetes**:
- [Official Documentation](https://kubernetes.io/docs/)
- [API Reference](https://kubernetes.io/docs/reference/kubernetes-api/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

**Best Practices**:
- [12-Factor App](https://12factor.net/)
- [Kubernetes Patterns](https://k8spatterns.io/)

---

## 📝 Change Log

### 2026-01-30
- Created Kubernetes concepts guide
- Explained architecture
- Covered all workload types
- Demonstrated Jobs and CronJobs
- Showed ConfigMaps and Secrets
- Resource management patterns
- Health check strategies
- Init containers
- Affinity rules
- Complete production example

---

**Next Article**: [kubernetes-operators](kubernetes-operators) - Extend Kubernetes!
