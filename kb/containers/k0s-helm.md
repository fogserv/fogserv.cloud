# k0s Helm - Kubernetes Package Manager

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Kubernetes  
**Prerequisites**: [k0s-introduction](k0s-introduction), [k0s-storage](k0s-storage)  
**Time**: 2-3 hours  
**Tags**: k0s, kubernetes, helm, charts, packages

## Summary

Master Helm package manager for Kubernetes to deploy applications with pre-configured charts. Learn Helm basics, chart structure, repositories, releases, values customization, and managing application lifecycle in k0s clusters.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Install and configure Helm
- ✅ Use Helm repositories
- ✅ Deploy applications with charts
- ✅ Customize chart values
- ✅ Manage releases
- ✅ Create custom charts
- ✅ Debug Helm deployments

## 📦 What is Helm?

### The Problem

**Manual Kubernetes deployment**:
```bash
# Deploy application manually
k0s kubectl apply -f deployment.yaml
k0s kubectl apply -f service.yaml
k0s kubectl apply -f ingress.yaml
k0s kubectl apply -f configmap.yaml
k0s kubectl apply -f secret.yaml
# ... 20+ files
```

**Issues**:
- 📝 Too many YAML files
- 🔄 Hard to upgrade
- ❌ Difficult to rollback
- 🎛️ No parameterization
- 📦 Not portable

---

### The Solution: Helm

**Helm** is the Kubernetes package manager:
- 📦 Packages (charts) with all resources
- 🎯 One-command deployment
- 🔄 Easy upgrades and rollbacks
- 🎛️ Parameterized values
- 🌐 Shared via repositories

**Think**: APT for Kubernetes

---

### Architecture

```
┌─────────────────────────────────────────┐
│           Helm CLI (helm)               │
│     (runs on your machine)              │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Kubernetes API Server              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Helm Release (in ConfigMap)    │   │
│  │  - Release name                 │   │
│  │  - Chart version                │   │
│  │  - Values                       │   │
│  │  - Deployed resources           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🔧 Installing Helm

### Install Helm CLI

**Linux**:
```bash
# Download script
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Or manual
curl -LO https://get.helm.sh/helm-v3.13.3-linux-amd64.tar.gz
tar -zxvf helm-v3.13.3-linux-amd64.tar.gz
sudo mv linux-amd64/helm /usr/local/bin/helm
```

**macOS**:
```bash
brew install helm
```

**Windows**:
```powershell
choco install kubernetes-helm
# Or
scoop install helm
```

**Verify**:
```bash
helm version
# version.BuildInfo{Version:"v3.13.3", GitCommit:"..."}
```

---

### Configure Helm for k0s

**Set kubeconfig**:
```bash
# Export k0s kubeconfig
sudo k0s kubeconfig admin > ~/.kube/k0s-config

# Use it
export KUBECONFIG=~/.kube/k0s-config

# Or set permanently
echo 'export KUBECONFIG=~/.kube/k0s-config' >> ~/.bashrc
```

**Test connection**:
```bash
helm list
# Should connect to k0s cluster (empty list initially)
```

---

## 📚 Helm Repositories

### Add Repositories

**Popular repositories**:
```bash
# Bitnami (most popular)
helm repo add bitnami https://charts.bitnami.com/bitnami

# Stable (official)
helm repo add stable https://charts.helm.sh/stable

# Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Grafana
helm repo add grafana https://grafana.github.io/helm-charts

# Traefik
helm repo add traefik https://traefik.github.io/charts

# Update indexes
helm repo update
```

**List repositories**:
```bash
helm repo list

# NAME                	URL
# bitnami             	https://charts.bitnami.com/bitnami
# prometheus-community	https://prometheus-community.github.io/helm-charts
```

---

### Search Charts

**Search in repositories**:
```bash
# Search all repos
helm search repo nginx

# NAME                            	CHART VERSION	APP VERSION	DESCRIPTION
# bitnami/nginx                   	15.4.4       	1.25.3     	NGINX Open Source is a web server...
# bitnami/nginx-ingress-controller	10.1.1       	1.9.5      	NGINX Ingress Controller...

# Search specific repo
helm search repo bitnami/postgres

# Search Helm Hub (all public charts)
helm search hub wordpress
```

---

## 🚀 Deploying Applications

### Install Chart

**Basic installation**:
```bash
# Install nginx
helm install my-nginx bitnami/nginx

# Output:
# NAME: my-nginx
# LAST DEPLOYED: Thu Jan 30 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1
```

**Check release**:
```bash
helm list

# NAME     	NAMESPACE	REVISION	UPDATED                            	STATUS  	CHART       	APP VERSION
# my-nginx 	default  	1       	2026-01-30 10:00:00.123456 -0500 EST	deployed	nginx-15.4.4	1.25.3
```

**Check resources**:
```bash
k0s kubectl get all -l app.kubernetes.io/instance=my-nginx

# NAME                             READY   STATUS    RESTARTS   AGE
# pod/my-nginx-123456-abc          1/1     Running   0          1m
#
# NAME               TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)
# service/my-nginx   LoadBalancer   10.96.123.45    <pending>     80:30123/TCP
```

---

### Install with Values

**Get default values**:
```bash
helm show values bitnami/nginx > values.yaml
```

**values.yaml** (excerpt):
```yaml
replicaCount: 1

image:
  registry: docker.io
  repository: bitnami/nginx
  tag: 1.25.3

service:
  type: LoadBalancer
  port: 80

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

**Customize values** - `my-values.yaml`:
```yaml
replicaCount: 3

service:
  type: NodePort
  nodePorts:
    http: 30080

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

ingress:
  enabled: true
  hostname: nginx.example.com
```

**Install with custom values**:
```bash
helm install my-nginx bitnami/nginx -f my-values.yaml
```

---

### Install with Inline Values

**Override specific values**:
```bash
helm install my-nginx bitnami/nginx \
  --set replicaCount=3 \
  --set service.type=NodePort \
  --set service.nodePorts.http=30080
```

**Multiple values**:
```bash
helm install my-db bitnami/postgresql \
  --set auth.username=admin \
  --set auth.password=secret123 \
  --set auth.database=myapp \
  --set primary.persistence.size=10Gi
```

---

## 🔄 Managing Releases

### List Releases

```bash
# Current releases
helm list

# All namespaces
helm list -A

# Specific namespace
helm list -n production

# Include uninstalled
helm list --uninstalled
```

---

### Upgrade Release

**Upgrade to new version**:
```bash
# Update repo
helm repo update

# Upgrade
helm upgrade my-nginx bitnami/nginx

# Upgrade with new values
helm upgrade my-nginx bitnami/nginx -f my-values.yaml
```

**Upgrade with changes**:
```bash
# Change replica count
helm upgrade my-nginx bitnami/nginx \
  --set replicaCount=5 \
  --reuse-values
```

---

### Rollback Release

**View history**:
```bash
helm history my-nginx

# REVISION	UPDATED                 	STATUS    	CHART       	APP VERSION	DESCRIPTION
# 1       	Thu Jan 30 10:00:00 2026	superseded	nginx-15.4.4	1.25.3     	Install complete
# 2       	Thu Jan 30 11:00:00 2026	superseded	nginx-15.4.5	1.25.4     	Upgrade complete
# 3       	Thu Jan 30 12:00:00 2026	deployed  	nginx-15.4.6	1.25.5     	Upgrade complete
```

**Rollback**:
```bash
# Rollback to previous version
helm rollback my-nginx

# Rollback to specific revision
helm rollback my-nginx 2
```

---

### Uninstall Release

```bash
# Uninstall (delete resources)
helm uninstall my-nginx

# Keep history
helm uninstall my-nginx --keep-history

# Can see in history later
helm list --uninstalled
```

---

## 📊 Common Applications

### PostgreSQL Database

**Install**:
```bash
helm install my-db bitnami/postgresql \
  --set auth.username=admin \
  --set auth.password=secret123 \
  --set auth.database=myapp \
  --set primary.persistence.storageClass=local-path \
  --set primary.persistence.size=20Gi
```

**Get connection info**:
```bash
# Password stored in secret
export POSTGRES_PASSWORD=$(kubectl get secret --namespace default my-db-postgresql -o jsonpath="{.data.postgres-password}" | base64 -d)

# Connect
kubectl run my-db-postgresql-client --rm --tty -i --restart='Never' \
  --namespace default \
  --image docker.io/bitnami/postgresql:15 \
  --env="PGPASSWORD=$POSTGRES_PASSWORD" \
  --command -- psql --host my-db-postgresql -U postgres -d postgres -p 5432
```

---

### Redis Cache

**Install**:
```bash
helm install my-cache bitnami/redis \
  --set auth.password=redis123 \
  --set master.persistence.storageClass=local-path \
  --set master.persistence.size=5Gi
```

**Connect**:
```bash
export REDIS_PASSWORD=$(kubectl get secret --namespace default my-cache-redis -o jsonpath="{.data.redis-password}" | base64 -d)

kubectl run --namespace default redis-client --restart='Never' --rm -i --tty \
  --env REDIS_PASSWORD=$REDIS_PASSWORD \
  --image docker.io/bitnami/redis:7.2 \
  -- bash

# Inside container
redis-cli -h my-cache-redis-master -a $REDIS_PASSWORD
```

---

### WordPress

**Install**:
```bash
helm install my-blog bitnami/wordpress \
  --set wordpressUsername=admin \
  --set wordpressPassword=admin123 \
  --set wordpressEmail=admin@example.com \
  --set service.type=NodePort \
  --set service.nodePorts.http=30180 \
  --set mariadb.auth.rootPassword=secret123 \
  --set persistence.storageClass=local-path \
  --set persistence.size=10Gi
```

**Access**:
```bash
# Get node IP
NODE_IP=$(kubectl get nodes -o jsonpath="{.items[0].status.addresses[0].address}")

echo "WordPress URL: http://$NODE_IP:30180"
echo "Username: admin"
echo "Password: admin123"
```

---

### Grafana

**Install**:
```bash
helm install grafana grafana/grafana \
  --set adminPassword=admin123 \
  --set service.type=NodePort \
  --set service.nodePort=30300 \
  --set persistence.enabled=true \
  --set persistence.storageClassName=local-path \
  --set persistence.size=5Gi
```

---

## 🎨 Creating Custom Charts

### Generate Chart

**Create chart skeleton**:
```bash
helm create myapp

# Creates:
# myapp/
# ├── Chart.yaml
# ├── values.yaml
# ├── templates/
# │   ├── deployment.yaml
# │   ├── service.yaml
# │   ├── ingress.yaml
# │   └── ...
# └── charts/
```

---

### Chart.yaml

**Chart metadata**:
```yaml
apiVersion: v2
name: myapp
description: My application Helm chart
type: application
version: 0.1.0
appVersion: "1.0.0"
keywords:
  - web
  - nodejs
maintainers:
  - name: Your Name
    email: you@example.com
```

---

### values.yaml

**Default values**:
```yaml
replicaCount: 1

image:
  repository: myapp
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: ""
  hosts:
    - host: myapp.local
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi

env:
  DATABASE_URL: "postgres://db:5432/myapp"
  REDIS_URL: "redis://cache:6379"
```

---

### templates/deployment.yaml

**Use template syntax**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        env:
        {{- range $key, $value := .Values.env }}
        - name: {{ $key }}
          value: {{ $value | quote }}
        {{- end }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

---

### Install Custom Chart

**From directory**:
```bash
# Test rendering
helm template myapp ./myapp

# Dry run
helm install myapp ./myapp --dry-run --debug

# Install
helm install myapp ./myapp -f myapp-prod-values.yaml
```

**Package chart**:
```bash
# Create .tgz
helm package myapp

# Output: myapp-0.1.0.tgz

# Install from package
helm install myapp myapp-0.1.0.tgz
```

---

## 🔍 Debugging

### Get Manifest

**See what Helm deployed**:
```bash
helm get manifest my-nginx

# Shows all Kubernetes YAML
```

---

### Get Values

**Current values**:
```bash
helm get values my-nginx

# USER-SUPPLIED VALUES:
# replicaCount: 3
# service:
#   type: NodePort

# All values (including defaults)
helm get values my-nginx --all
```

---

### Template Debugging

**Render templates locally**:
```bash
# See what would be deployed
helm template my-nginx bitnami/nginx

# With custom values
helm template my-nginx bitnami/nginx -f my-values.yaml

# Debug mode
helm template my-nginx bitnami/nginx --debug
```

---

### Dry Run

**Test installation**:
```bash
helm install my-nginx bitnami/nginx --dry-run --debug
```

---

### Status

**Check release status**:
```bash
helm status my-nginx

# NAME: my-nginx
# LAST DEPLOYED: Thu Jan 30 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1
# TEST SUITE: None
# NOTES:
# ... (chart notes)
```

---

## 💡 Best Practices

### 1. Use Values Files

```bash
# Good: Values in file
helm install myapp ./myapp -f production.yaml

# Avoid: Too many --set flags
helm install myapp ./myapp \
  --set a=1 --set b=2 --set c=3 ...  # ❌ Hard to maintain
```

---

### 2. Pin Chart Versions

```bash
# Good: Specific version
helm install myapp bitnami/nginx --version 15.4.4

# Avoid: Latest (can break)
helm install myapp bitnami/nginx  # ❌ Gets latest
```

---

### 3. Namespace Isolation

```bash
# Create namespace
k0s kubectl create namespace production

# Install in namespace
helm install myapp bitnami/nginx -n production
```

---

### 4. Use --wait for CI/CD

```bash
# Wait for resources to be ready
helm install myapp ./myapp --wait --timeout 5m

# Rollback on failure
helm install myapp ./myapp --wait --atomic
```

---

### 5. Always Test First

```bash
# Dry run
helm install myapp ./myapp --dry-run --debug

# Template locally
helm template myapp ./myapp

# Then install
helm install myapp ./myapp
```

---

### 6. Document with NOTES.txt

**templates/NOTES.txt**:
```
Thank you for installing {{ .Chart.Name }}.

Your release is named {{ .Release.Name }}.

To access your application:

{{- if contains "NodePort" .Values.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "myapp.fullname" . }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "LoadBalancer" .Values.service.type }}
  NOTE: It may take a few minutes for the LoadBalancer IP to be available.
  You can watch the status by running: kubectl get --namespace {{ .Release.Namespace }} svc -w {{ include "myapp.fullname" . }}
{{- end }}
```

---

## 🔗 What's Next?

**Ingress**:
- **[k0s-ingress](k0s-ingress)** - HTTP routing with Traefik

**Monitoring**:
- **[k0s-monitoring](k0s-monitoring)** - Prometheus and Grafana

**Advanced**:
- Helm hooks for migrations
- Subchart dependencies
- Chart testing

---

## 📚 Resources

**Helm Documentation**:
- [Helm Documentation](https://helm.sh/docs/)
- [Chart Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Helm Hub](https://artifacthub.io/)

**Popular Charts**:
- [Bitnami Charts](https://github.com/bitnami/charts)
- [Prometheus Community](https://github.com/prometheus-community/helm-charts)
- [Grafana Charts](https://github.com/grafana/helm-charts)

---

## 📝 Change Log

### 2026-01-30
- Created Helm guide
- Explained Helm concepts
- Covered installation
- Demonstrated repositories
- Showed application deployment
- Covered release management
- Explained custom charts
- Added debugging techniques
- Included best practices

---

**Next Article**: [k0s-ingress](k0s-ingress) - Expose applications to the internet!
