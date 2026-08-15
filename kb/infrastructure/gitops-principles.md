# GitOps Principles - Git as Source of Truth

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Operations Methodology  
**Prerequisites**: [git-fundamentals](../basics/git-fundamentals), [terraform-basics](terraform-basics), [k0s-installation](../containers/k0s-installation)  
**Time**: 2-3 hours  
**Tags**: gitops, devops, automation, kubernetes, argocd, flux, continuous-deployment

## Summary

Implement GitOps methodology for infrastructure and application management. Learn Git-driven operations, declarative configuration, automated synchronization, and tools like ArgoCD and Flux for Kubernetes deployments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand GitOps principles
- ✅ Set up Git-based workflows
- ✅ Install ArgoCD on Kubernetes
- ✅ Implement declarative deployments
- ✅ Manage multiple environments
- ✅ Handle secrets securely
- ✅ Implement rollback strategies
- ✅ Monitor deployment status

## 🔄 What is GitOps?

### Traditional Operations

**Manual deployments**:
```bash
# Developer makes changes
vim deployment.yaml

# Manually applies
kubectl apply -f deployment.yaml

# Problems:
# ❌ Who deployed what?
# ❌ What's currently deployed?
# ❌ How to rollback?
# ❌ No audit trail
# ❌ Manual process (error-prone)
```

**Issues**:
- 🤷 **Unknown State**: Cluster state unclear
- 📝 **No History**: Changes not tracked
- 👥 **Access Control**: Everyone needs cluster access
- 🔙 **Difficult Rollback**: No easy undo
- 🐛 **Drift**: Manual changes cause inconsistency

---

### GitOps Approach

**Git-driven operations**:
```bash
# Developer makes changes
vim deployment.yaml
git add deployment.yaml
git commit -m "Update replica count to 5"
git push

# GitOps operator automatically:
# 1. Detects change in Git
# 2. Applies to cluster
# 3. Monitors for drift
# 4. Self-heals if manual changes made

# Git = Source of Truth
```

**Benefits**:
- ✅ **Single Source of Truth**: Git repo
- ✅ **Audit Trail**: Every change tracked
- ✅ **Easy Rollback**: git revert
- ✅ **Access Control**: Git permissions
- ✅ **Consistency**: Automatic sync

---

### Core Principles

**1. Declarative**:
```yaml
# Desired state (not imperative commands)
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 5  # "I want 5 replicas"
                # Not: "Add 2 more replicas"
```

**2. Versioned**:
```bash
git log deployment.yaml
# See all changes over time
```

**3. Pulled Automatically**:
```
┌──────────┐    Push    ┌──────────┐
│Developer │ ────────→  │   Git    │
└──────────┘            └────┬─────┘
                             │
                             │ Pull (automatic)
                             ↓
                      ┌────────────┐
                      │  ArgoCD    │
                      │  Operator  │
                      └──────┬─────┘
                             │
                             │ Apply
                             ↓
                      ┌────────────┐
                      │ Kubernetes │
                      │  Cluster   │
                      └────────────┘
```

**4. Self-Healing**:
```bash
# Someone manually changes cluster
kubectl scale deployment myapp --replicas=10

# GitOps operator detects drift
# Automatically reverts to Git state (5 replicas)
```

---

## 🚀 ArgoCD Setup

### Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods
kubectl wait --for=condition=ready pod --all -n argocd --timeout=300s

# Check installation
kubectl get pods -n argocd

# Output:
# NAME                                  READY   STATUS    RESTARTS   AGE
# argocd-application-controller-0       1/1     Running   0          2m
# argocd-applicationset-controller-..   1/1     Running   0          2m
# argocd-dex-server-...                 1/1     Running   0          2m
# argocd-notifications-controller-...   1/1     Running   0          2m
# argocd-redis-...                      1/1     Running   0          2m
# argocd-repo-server-...                1/1     Running   0          2m
# argocd-server-...                     1/1     Running   0          2m
```

---

### Access ArgoCD UI

**Get admin password**:
```bash
# Initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Output: randompassword123
```

**Expose UI**:
```bash
# Option 1: Port-forward
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open: https://localhost:8080
# Username: admin
# Password: (from above)

# Option 2: Ingress (production)
kubectl apply -f argocd-ingress.yaml
```

**`argocd-ingress.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server
  namespace: argocd
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - argocd.example.com
    secretName: argocd-tls
  rules:
  - host: argocd.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
```

---

### Install ArgoCD CLI

**Linux/macOS**:
```bash
# Download
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64

# Install
sudo install -m 555 argocd /usr/local/bin/argocd

# Verify
argocd version
```

**Windows**:
```powershell
# With Scoop
scoop install argocd

# Verify
argocd version
```

---

### Login

```bash
# Login to ArgoCD
argocd login localhost:8080 \
  --username admin \
  --password randompassword123 \
  --insecure

# Change password
argocd account update-password
```

---

## 📦 First GitOps Application

### Prepare Git Repository

**Create repo structure**:
```bash
mkdir -p gitops-demo
cd gitops-demo

git init
git remote add origin https://github.com/youruser/gitops-demo.git
```

**Directory structure**:
```
gitops-demo/
├── apps/
│   └── myapp/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── kustomization.yaml
└── README.md
```

---

### Application Manifests

**`apps/myapp/deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
```

**`apps/myapp/service.yaml`**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: default
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: myapp
```

**`apps/myapp/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml

commonLabels:
  app.kubernetes.io/name: myapp
  app.kubernetes.io/managed-by: argocd
```

---

### Commit and Push

```bash
git add .
git commit -m "Initial myapp deployment"
git push origin main
```

---

### Create ArgoCD Application

**CLI**:
```bash
argocd app create myapp \
  --repo https://github.com/youruser/gitops-demo.git \
  --path apps/myapp \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated \
  --auto-prune \
  --self-heal

# Output: application 'myapp' created
```

**Or YAML** (`argocd-app.yaml`):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  # Source: Git repository
  source:
    repoURL: https://github.com/youruser/gitops-demo.git
    targetRevision: main
    path: apps/myapp
  
  # Destination: Kubernetes cluster
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  
  # Sync policy
  syncPolicy:
    automated:
      prune: true      # Delete resources not in Git
      selfHeal: true   # Revert manual changes
    syncOptions:
    - CreateNamespace=true
```

```bash
kubectl apply -f argocd-app.yaml
```

---

### Verify Deployment

```bash
# Check ArgoCD app status
argocd app get myapp

# Output:
# Name:               myapp
# Project:            default
# Server:             https://kubernetes.default.svc
# Namespace:          default
# URL:                https://argocd.example.com/applications/myapp
# Repo:               https://github.com/youruser/gitops-demo.git
# Target:             main
# Path:               apps/myapp
# SyncWindow:         Sync Allowed
# Sync Policy:        Automated (Prune)
# Sync Status:        Synced to main (abc123)
# Health Status:      Healthy

# Check pods
kubectl get pods

# Output:
# NAME                     READY   STATUS    RESTARTS   AGE
# myapp-abc123-xyz         1/1     Running   0          2m
# myapp-def456-abc         1/1     Running   0          2m
# myapp-ghi789-def         1/1     Running   0          2m
```

---

## 🔄 GitOps Workflow

### Making Changes

**1. Edit deployment in Git**:
```bash
# Increase replicas
vim apps/myapp/deployment.yaml

# Change:
spec:
  replicas: 5  # Was 3

# Commit
git add apps/myapp/deployment.yaml
git commit -m "Scale to 5 replicas"
git push
```

**2. ArgoCD syncs automatically** (within 3 minutes):
```bash
# Watch sync
argocd app wait myapp

# Output:
# Name:               myapp
# Sync Status:        Synced to main (def456)
# Health Status:      Progressing
# ...
# Health Status:      Healthy

# Verify
kubectl get pods
# Output: 5 pods running
```

---

### Rollback

**Simple: Git revert**:
```bash
# Find commit to revert
git log --oneline

# Output:
# def456 Scale to 5 replicas
# abc123 Initial myapp deployment

# Revert
git revert def456
git push

# ArgoCD automatically reverts to 3 replicas!
```

---

### Manual Sync

**If automatic sync disabled**:
```bash
# Sync manually
argocd app sync myapp

# Or in UI: Click "Sync" button
```

---

## 🌍 Multi-Environment Setup

### Directory Structure

```
gitops-demo/
├── apps/
│   └── myapp/
│       ├── base/
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── kustomization.yaml
│       └── overlays/
│           ├── dev/
│           │   ├── kustomization.yaml
│           │   └── replicas.yaml
│           ├── staging/
│           │   ├── kustomization.yaml
│           │   └── replicas.yaml
│           └── production/
│               ├── kustomization.yaml
│               └── replicas.yaml
```

---

### Base Configuration

**`apps/myapp/base/deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1  # Overridden by overlays
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
```

**`apps/myapp/base/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
```

---

### Environment Overlays

**`apps/myapp/overlays/dev/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: dev

bases:
  - ../../base

patchesStrategicMerge:
  - replicas.yaml

commonLabels:
  environment: dev
```

**`apps/myapp/overlays/dev/replicas.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1  # Dev: 1 replica
```

---

**`apps/myapp/overlays/production/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

bases:
  - ../../base

patchesStrategicMerge:
  - replicas.yaml

commonLabels:
  environment: production

images:
  - name: myapp
    newTag: v1.2.3  # Production uses specific version
```

**`apps/myapp/overlays/production/replicas.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 10  # Production: 10 replicas
```

---

### Create Environment Applications

**Dev**:
```bash
argocd app create myapp-dev \
  --repo https://github.com/youruser/gitops-demo.git \
  --path apps/myapp/overlays/dev \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace dev \
  --sync-policy automated
```

**Staging**:
```bash
argocd app create myapp-staging \
  --repo https://github.com/youruser/gitops-demo.git \
  --path apps/myapp/overlays/staging \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace staging \
  --sync-policy automated
```

**Production**:
```bash
argocd app create myapp-production \
  --repo https://github.com/youruser/gitops-demo.git \
  --path apps/myapp/overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production \
  --sync-policy automated
```

---

## 🔐 Secrets Management

### Problem

**Don't commit secrets to Git!**
```yaml
# ❌ NEVER DO THIS
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
stringData:
  password: supersecret123  # Visible in Git!
```

---

### Solution 1: Sealed Secrets

**Install**:
```bash
# Install controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install CLI
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64
sudo install -m 755 kubeseal-linux-amd64 /usr/local/bin/kubeseal
```

**Use**:
```bash
# Create secret (local, not committed)
kubectl create secret generic db-credentials \
  --from-literal=password=supersecret123 \
  --dry-run=client -o yaml > secret.yaml

# Seal it (encrypted, safe to commit)
kubeseal -f secret.yaml -w sealed-secret.yaml

# Commit sealed secret
git add sealed-secret.yaml
git commit -m "Add database credentials"
git push
```

**`sealed-secret.yaml`**:
```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
spec:
  encryptedData:
    password: AgBQ7H3K9...  # Encrypted, safe to commit
```

**Controller automatically decrypts** to regular Secret in cluster.

---

### Solution 2: External Secrets Operator

**Install**:
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

**Use with AWS Secrets Manager**:
```yaml
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
            name: external-secrets
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: db-credentials
  data:
  - secretKey: password
    remoteRef:
      key: prod/db-password
```

**Secrets pulled from AWS**, not stored in Git.

---

## 📊 Monitoring and Alerts

### Application Health

**Check in CLI**:
```bash
# Get app status
argocd app get myapp

# List all apps
argocd app list

# Output:
# NAME     CLUSTER                         NAMESPACE  PROJECT  STATUS  HEALTH   SYNCPOLICY
# myapp    https://kubernetes.default.svc  default    default  Synced  Healthy  Auto-Prune
```

---

### Sync Status

**Possible states**:
- ✅ **Synced**: Git matches cluster
- ⏳ **OutOfSync**: Git differs from cluster
- 🔄 **Syncing**: Applying changes
- ❌ **Unknown**: Can't determine

---

### Health Status

**Application health**:
- ✅ **Healthy**: All resources healthy
- ⚠️ **Progressing**: Deployment in progress
- ❌ **Degraded**: Some resources unhealthy
- ⏸️ **Suspended**: Application suspended
- ❓ **Unknown**: Can't determine

---

### Notifications

**Slack integration** (`argocd-notifications-configmap.yaml`):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
  
  template.app-deployed: |
    message: |
      Application {{.app.metadata.name}} deployed to {{.app.spec.destination.namespace}}
      Sync Status: {{.app.status.sync.status}}
      Health Status: {{.app.status.health.status}}
  
  trigger.on-deployed: |
    - when: app.status.operationState.phase in ['Succeeded']
      send: [app-deployed]
---
apiVersion: v1
kind: Secret
metadata:
  name: argocd-notifications-secret
  namespace: argocd
stringData:
  slack-token: xoxb-your-slack-bot-token
```

---

## 💡 Best Practices

### 1. Separate App and Config Repos

```
app-repo/              # Application code
├── src/
├── Dockerfile
└── .gitlab-ci.yml

config-repo/           # Kubernetes manifests (GitOps)
├── apps/
│   └── myapp/
└── infrastructure/
```

**Why**: Different change frequency, access control.

---

### 2. Use Kustomize/Helm

**Don't duplicate**:
```yaml
# ❌ Bad: Copy-paste for each environment
dev/deployment.yaml    # 100 lines
staging/deployment.yaml # 100 lines (99% identical)
prod/deployment.yaml    # 100 lines (99% identical)

# ✅ Good: Base + overlays
base/deployment.yaml        # 100 lines
overlays/dev/patch.yaml     # 5 lines
overlays/staging/patch.yaml # 5 lines
overlays/prod/patch.yaml    # 5 lines
```

---

### 3. Sync Waves

**Control deployment order**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"  # Deploy first
---
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "2"  # Deploy after secrets
```

---

### 4. Health Checks

**Custom health check**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  resource.customizations: |
    apps/Deployment:
      health.lua: |
        hs = {}
        if obj.status ~= nil then
          if obj.status.replicas ~= nil and obj.status.updatedReplicas == obj.status.replicas then
            hs.status = "Healthy"
            hs.message = "All replicas ready"
            return hs
          end
        end
        hs.status = "Progressing"
        hs.message = "Waiting for replicas"
        return hs
```

---

### 5. RBAC

**Restrict access**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.csv: |
    p, role:developer, applications, get, */*, allow
    p, role:developer, applications, sync, */dev/*, allow
    p, role:ops, applications, *, */*, allow
    g, developers, role:developer
    g, ops-team, role:ops
```

---

## 🔗 What's Next?

**Testing**:
- **[infrastructure-testing](infrastructure-testing)** - Test infrastructure code

**CI/CD**:
- **[../cicd/gitlab-ci-basics](../cicd/gitlab-ci-basics)** - Build pipelines

**Monitoring**:
- **[../containers/k0s-monitoring](../containers/k0s-monitoring)** - Observability

---

## 📚 Resources

**GitOps**:
- [GitOps Principles](https://opengitops.dev/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Flux Documentation](https://fluxcd.io/docs/)

**Tools**:
- [Kustomize](https://kustomize.io/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)

---

## 📝 Change Log

### 2026-01-30
- Created GitOps guide
- Explained principles
- Demonstrated ArgoCD setup
- Showed declarative deployments
- Implemented multi-environment
- Covered secrets management
- Added monitoring and alerts
- Best practices
- RBAC configuration

---

**Next Article**: [infrastructure-testing](infrastructure-testing) - Test your infrastructure!
