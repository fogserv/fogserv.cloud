# K0s Monitoring - Prometheus and Grafana

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Kubernetes Observability  
**Prerequisites**: [k0s-installation](k0s-installation), [k0s-helm](k0s-helm)  
**Time**: 3-4 hours  
**Tags**: k0s, kubernetes, monitoring, prometheus, grafana, metrics, alerting

## Summary

Monitor Kubernetes clusters and applications with Prometheus and Grafana. Learn metrics collection, dashboard creation, alerting rules, and production monitoring patterns for k0s.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand monitoring fundamentals
- ✅ Install Prometheus and Grafana
- ✅ Collect cluster metrics
- ✅ Monitor application performance
- ✅ Create custom dashboards
- ✅ Set up alerting rules
- ✅ Debug performance issues
- ✅ Implement production monitoring

## 📊 What is Monitoring?

### The Problem

**Without monitoring**:
```bash
# Something is wrong...
kubectl get pods
# NAME                    READY   STATUS    RESTARTS
# web-app-xyz             0/1     Running   47        # 😱 47 restarts!

# But why?
# - Memory leak?
# - CPU throttling?
# - Network issues?
# - Disk full?

# No data = No answers
```

**Issues**:
- 🔍 No visibility into problems
- ⏱️ Reactive instead of proactive
- 🎯 Can't identify bottlenecks
- 📈 No capacity planning data
- 🚨 Alerts arrive too late

---

### The Solution: Observability

**Monitoring** provides:
- 📊 **Metrics**: Numbers over time (CPU, memory, requests/sec)
- 📝 **Logs**: Event records (errors, warnings, info)
- 🔍 **Traces**: Request flow through services

**This guide focuses on metrics** with Prometheus and Grafana.

---

### Architecture

```
┌─────────────────────────────────────────────┐
│              Grafana                         │
│         (Visualization)                      │
└──────────────┬──────────────────────────────┘
               │ Queries
               ↓
┌─────────────────────────────────────────────┐
│            Prometheus                        │
│       (Metrics Storage & Querying)           │
└──────────────┬──────────────────────────────┘
               │ Scrapes metrics
               ↓
┌──────────────┬──────────────┬───────────────┐
│   Node       │  kube-state  │  Application  │
│  Exporter    │    Metrics   │   Metrics     │
│ (Node CPU,   │ (Pod status, │ (Custom       │
│  memory...)  │  deploys...) │  metrics)     │
└──────────────┴──────────────┴───────────────┘
```

---

## 📦 Installing Prometheus Stack

### kube-prometheus-stack

**All-in-one Helm chart** includes:
- 📊 Prometheus Operator
- 📈 Grafana
- 🖥️ Node Exporter
- 📋 kube-state-metrics
- 🚨 Alertmanager
- 📚 Pre-built dashboards

---

### Install with Helm

```bash
# Add repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create namespace
kubectl create namespace monitoring

# Install stack
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=local-path \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.adminPassword=admin123

# Wait for pods
kubectl wait --for=condition=ready pod --all -n monitoring --timeout=300s
```

**Note**: Change `admin123` to secure password!

---

### Check Installation

```bash
kubectl get pods -n monitoring

# Output:
# NAME                                                     READY   STATUS    RESTARTS   AGE
# alertmanager-kube-prometheus-stack-alertmanager-0        2/2     Running   0          2m
# kube-prometheus-stack-grafana-5f7b8c4d9c-xyz             3/3     Running   0          2m
# kube-prometheus-stack-kube-state-metrics-abc123          1/1     Running   0          2m
# kube-prometheus-stack-operator-7d9c8f5b4d-xyz            1/1     Running   0          2m
# kube-prometheus-stack-prometheus-node-exporter-abc       1/1     Running   0          2m
# prometheus-kube-prometheus-stack-prometheus-0            2/2     Running   0          2m
```

---

### Access Grafana

**Port-forward**:
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
```

**Open browser**: `http://localhost:3000`
- Username: `admin`
- Password: `admin123` (or what you set)

---

### Access Prometheus

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
```

**Open browser**: `http://localhost:9090`

---

## 📊 Exploring Metrics

### Pre-installed Dashboards

**In Grafana**:
1. Click **Dashboards** (left menu)
2. Browse folders:
   - **Kubernetes / Compute Resources / Cluster**
   - **Kubernetes / Compute Resources / Namespace (Pods)**
   - **Kubernetes / Compute Resources / Node (Pods)**
   - **Node Exporter / Nodes**

**10+ dashboards pre-configured!**

---

### Key Metrics

**Node metrics**:
```promql
# CPU usage
node_cpu_seconds_total

# Memory available
node_memory_MemAvailable_bytes

# Disk I/O
node_disk_io_time_seconds_total

# Network bytes
node_network_receive_bytes_total
```

---

**Pod metrics**:
```promql
# Pod CPU usage
container_cpu_usage_seconds_total

# Pod memory usage
container_memory_working_set_bytes

# Pod restarts
kube_pod_container_status_restarts_total

# Pod status
kube_pod_status_phase
```

---

**Cluster metrics**:
```promql
# Total pods
kube_pod_info

# Total nodes
kube_node_info

# Namespace resource usage
namespace_cpu:kube_pod_container_resource_requests:sum
```

---

### PromQL Basics

**Simple query**:
```promql
# Current CPU usage per pod
container_cpu_usage_seconds_total
```

**With labels**:
```promql
# CPU for specific namespace
container_cpu_usage_seconds_total{namespace="default"}

# CPU for specific pod
container_cpu_usage_seconds_total{namespace="default", pod="web-app-xyz"}
```

---

**Rate function**:
```promql
# CPU usage rate (last 5 minutes)
rate(container_cpu_usage_seconds_total[5m])
```

**Sum aggregation**:
```promql
# Total CPU usage by namespace
sum(rate(container_cpu_usage_seconds_total[5m])) by (namespace)
```

**Memory percentage**:
```promql
# Memory usage percentage
container_memory_working_set_bytes / container_spec_memory_limit_bytes * 100
```

---

## 🎯 Monitoring Applications

### Instrument Application

**Example: Node.js with prom-client**:
```javascript
const express = require('express');
const promClient = require('prom-client');

const app = express();

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom counter
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware to count requests
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Application routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
```

---

### ServiceMonitor

**Tell Prometheus to scrape your app**:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-metrics
  namespace: default
  labels:
    release: kube-prometheus-stack  # Required!
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

```bash
kubectl apply -f servicemonitor.yaml
```

**Prometheus will automatically**:
1. Discover ServiceMonitor
2. Find matching services
3. Scrape `/metrics` endpoint
4. Store metrics

---

### Verify Scraping

**In Prometheus UI** (`http://localhost:9090`):
1. Click **Status** → **Targets**
2. Find your ServiceMonitor
3. Should show **UP** status

---

## 📈 Creating Dashboards

### Simple Dashboard

**In Grafana**:
1. Click **+** → **Dashboard**
2. Click **Add visualization**
3. Select **Prometheus** data source
4. Enter query:
   ```promql
   rate(http_requests_total[5m])
   ```
5. Click **Apply**

---

### Pod CPU Dashboard

**Panel configuration**:
```json
{
  "title": "Pod CPU Usage",
  "targets": [{
    "expr": "sum(rate(container_cpu_usage_seconds_total{namespace=\"default\"}[5m])) by (pod)",
    "legendFormat": "{{pod}}"
  }],
  "type": "timeseries"
}
```

**Steps**:
1. Add visualization
2. Set query: `sum(rate(container_cpu_usage_seconds_total{namespace="default"}[5m])) by (pod)`
3. Legend: `{{pod}}`
4. Unit: **percent (0-100)**
5. Apply

---

### Pod Memory Dashboard

```promql
# Query
sum(container_memory_working_set_bytes{namespace="default"}) by (pod)
```

**Unit**: **bytes(IEC)**

---

### Request Rate Dashboard

```promql
# Query
sum(rate(http_requests_total[5m])) by (route)
```

**Unit**: **requests/sec (reqps)**

---

### Complete Dashboard JSON

**Save as `app-dashboard.json`**:
```json
{
  "dashboard": {
    "title": "Application Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "sum(rate(http_requests_total[5m])) by (route)"
        }],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) by (route)"
        }],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "title": "Response Time (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))"
        }],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      }
    ]
  }
}
```

**Import**: Grafana → Dashboards → Import → Upload JSON

---

## 🚨 Alerting

### PrometheusRule

**High CPU alert**:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: app-alerts
  namespace: default
  labels:
    release: kube-prometheus-stack
spec:
  groups:
  - name: app
    interval: 30s
    rules:
    - alert: HighCPUUsage
      expr: |
        sum(rate(container_cpu_usage_seconds_total{namespace="default"}[5m])) by (pod) > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} high CPU usage"
        description: "CPU usage is {{ $value | humanizePercentage }} for 5 minutes"
```

```bash
kubectl apply -f alerts.yaml
```

---

### High Memory Alert

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: memory-alerts
  namespace: default
  labels:
    release: kube-prometheus-stack
spec:
  groups:
  - name: memory
    interval: 30s
    rules:
    - alert: HighMemoryUsage
      expr: |
        container_memory_working_set_bytes / container_spec_memory_limit_bytes > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} high memory usage"
        description: "Memory usage is {{ $value | humanizePercentage }}"
```

---

### Pod Restart Alert

```yaml
- alert: PodRestartingTooOften
  expr: |
    rate(kube_pod_container_status_restarts_total[15m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Pod {{ $labels.pod }} restarting frequently"
    description: "Pod has restarted {{ $value }} times in 15 minutes"
```

---

### Pod Down Alert

```yaml
- alert: PodDown
  expr: |
    kube_pod_status_phase{phase="Running"} == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Pod {{ $labels.pod }} is down"
    description: "Pod has been down for more than 5 minutes"
```

---

### View Alerts

**In Prometheus** (`http://localhost:9090`):
- Click **Alerts**
- See all rules and their status

**In Grafana**:
- Click **Alerting** → **Alert rules**

---

## 📧 Alert Notifications

### Alertmanager Configuration

**Create secret**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
  namespace: monitoring
type: Opaque
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
    
    route:
      receiver: 'default'
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      routes:
      - match:
          severity: critical
        receiver: 'critical'
    
    receivers:
    - name: 'default'
      email_configs:
      - to: 'team@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password123'
    
    - name: 'critical'
      slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}
```

```bash
kubectl apply -f alertmanager-config.yaml

# Restart Alertmanager
kubectl rollout restart statefulset/alertmanager-kube-prometheus-stack-alertmanager -n monitoring
```

---

### Slack Integration

**Get webhook URL**:
1. Go to your Slack workspace
2. Create new app: https://api.slack.com/apps
3. Enable **Incoming Webhooks**
4. Add webhook to channel
5. Copy webhook URL

**Add to Alertmanager config**:
```yaml
receivers:
- name: 'slack'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX'
    channel: '#alerts'
    title: '{{ .GroupLabels.alertname }}'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## 🎯 Complete Example

### Deploy Demo Application

**Application with metrics**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
  labels:
    app: demo-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
      - name: app
        image: your-app:latest  # App with /metrics endpoint
        ports:
        - name: http
          containerPort: 3000
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: demo-app
  labels:
    app: demo-app
spec:
  ports:
  - name: http
    port: 80
    targetPort: 3000
  selector:
    app: demo-app
```

---

### ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: demo-app
  namespace: default
  labels:
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app: demo-app
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
```

---

### Alerts

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: demo-app-alerts
  namespace: default
  labels:
    release: kube-prometheus-stack
spec:
  groups:
  - name: demo-app
    interval: 30s
    rules:
    # High error rate
    - alert: HighErrorRate
      expr: |
        sum(rate(http_requests_total{status_code=~"5..", app="demo-app"}[5m])) 
        / 
        sum(rate(http_requests_total{app="demo-app"}[5m])) 
        > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate in demo-app"
        description: "Error rate is {{ $value | humanizePercentage }}"
    
    # Slow response time
    - alert: SlowResponseTime
      expr: |
        histogram_quantile(0.95, 
          sum(rate(http_request_duration_seconds_bucket{app="demo-app"}[5m])) by (le)
        ) > 1.0
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Slow response time in demo-app"
        description: "P95 latency is {{ $value }}s"
    
    # High memory usage
    - alert: HighMemoryUsage
      expr: |
        container_memory_working_set_bytes{pod=~"demo-app-.*"} 
        / 
        container_spec_memory_limit_bytes{pod=~"demo-app-.*"} 
        > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} high memory"
        description: "Memory at {{ $value | humanizePercentage }}"
```

---

### Deploy Everything

```bash
# Deploy application
kubectl apply -f demo-app.yaml

# Deploy monitoring
kubectl apply -f servicemonitor.yaml
kubectl apply -f alerts.yaml

# Check ServiceMonitor discovered
kubectl get servicemonitor

# Check alerts loaded
kubectl get prometheusrule

# View in Prometheus
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
# Open: http://localhost:9090/alerts
```

---

## 📊 Advanced Dashboards

### RED Method Dashboard

**Rate, Errors, Duration**:
```promql
# Rate: Requests per second
sum(rate(http_requests_total[5m])) by (service)

# Errors: Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service)
/ 
sum(rate(http_requests_total[5m])) by (service)

# Duration: Response time (p95)
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)
```

---

### USE Method Dashboard

**Utilization, Saturation, Errors**:
```promql
# Utilization: CPU usage
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)

# Saturation: CPU throttling
sum(rate(container_cpu_cfs_throttled_seconds_total[5m])) by (pod)

# Errors: Container restarts
rate(kube_pod_container_status_restarts_total[5m])
```

---

### Golden Signals Dashboard

**Latency, Traffic, Errors, Saturation**:
```promql
# Latency
histogram_quantile(0.99, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)

# Traffic
sum(rate(http_requests_total[5m]))

# Errors
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m]))

# Saturation (memory)
sum(container_memory_working_set_bytes) 
/ 
sum(container_spec_memory_limit_bytes)
```

---

## 🔍 Troubleshooting

### No Metrics Appearing

**Check ServiceMonitor**:
```bash
# Verify ServiceMonitor exists
kubectl get servicemonitor

# Check labels match
kubectl get servicemonitor demo-app -o yaml | grep -A 5 selector
kubectl get svc demo-app -o yaml | grep -A 5 labels

# ServiceMonitor must have release: kube-prometheus-stack label
kubectl label servicemonitor demo-app release=kube-prometheus-stack
```

---

**Check Prometheus targets**:
```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090

# Open: http://localhost:9090/targets
# Look for your service
# Should show "UP" status
```

---

### Metrics Not Scraped

**Check service endpoint**:
```bash
# Get service IP
kubectl get svc demo-app

# Test metrics endpoint from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://demo-app/metrics

# Should return Prometheus format metrics
```

---

### Alerts Not Firing

**Check PrometheusRule**:
```bash
# Verify rule exists
kubectl get prometheusrule

# Check rule loaded in Prometheus
# Open: http://localhost:9090/rules
# Should see your rules listed

# Check rule has correct label
kubectl label prometheusrule demo-app-alerts release=kube-prometheus-stack
```

**Test alert expression**:
```bash
# Open Prometheus
# Graph tab
# Enter your alert expression
# Should return results if alert would fire
```

---

### Grafana No Data

**Check data source**:
1. Grafana → Configuration → Data sources
2. Click **Prometheus**
3. Scroll down, click **Save & test**
4. Should show "Data source is working"

**Check time range**:
- Top right corner
- Change from "Last 6 hours" to "Last 15 minutes"

---

## 💡 Best Practices

### 1. Set Resource Limits

```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**Required for** CPU/memory percentage metrics.

---

### 2. Use Recording Rules

**Pre-calculate expensive queries**:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: recording-rules
  labels:
    release: kube-prometheus-stack
spec:
  groups:
  - name: cpu_usage
    interval: 30s
    rules:
    - record: namespace:container_cpu_usage:sum
      expr: |
        sum(rate(container_cpu_usage_seconds_total[5m])) by (namespace)
```

**Use in queries**: `namespace:container_cpu_usage:sum`

---

### 3. Tune Retention

```bash
# Install with 60-day retention
helm install kube-prometheus-stack ... \
  --set prometheus.prometheusSpec.retention=60d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=200Gi
```

---

### 4. Alert Fatigue Prevention

```yaml
# Alert only after problem persists
for: 10m

# Group similar alerts
group_by: ['alertname', 'namespace']

# Don't repeat too often
repeat_interval: 4h
```

---

### 5. Monitor Monitoring

```promql
# Prometheus up
up{job="prometheus"}

# Scrape duration
scrape_duration_seconds

# Sample ingestion rate
rate(prometheus_tsdb_head_samples_appended_total[5m])
```

---

## 🔗 What's Next?

**Logging**:
- **[../observability/loki-basics](../observability/loki-basics)** - Centralized logging

**Tracing**:
- **[../observability/distributed-tracing](../observability/distributed-tracing)** - Request tracing

**Security**:
- **[service-mesh-linkerd](service-mesh-linkerd)** - mTLS and observability

---

## 📚 Resources

**Prometheus**:
- [Official Documentation](https://prometheus.io/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Best Practices](https://prometheus.io/docs/practices/)

**Grafana**:
- [Dashboard Gallery](https://grafana.com/grafana/dashboards/)
- [Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)

**Kubernetes**:
- [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)

---

## 📝 Change Log

### 2026-01-30
- Created monitoring guide
- Explained observability concepts
- Covered Prometheus installation
- Demonstrated PromQL queries
- Showed dashboard creation
- Implemented alerting rules
- Added notification setup
- Complete application example
- Advanced dashboard patterns
- Troubleshooting guide
- Best practices

---

**Next Article**: [service-mesh-linkerd](service-mesh-linkerd) - Service mesh with mTLS!
