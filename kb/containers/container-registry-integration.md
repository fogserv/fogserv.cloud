# Container Registry Integration - Harbor Private Registry

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Registry Management  
**Prerequisites**: [docker-basics](docker-basics), [k0s-installation](k0s-installation)  
**Time**: 2-3 hours  
**Tags**: harbor, registry, docker, kubernetes, security, image-scanning

## Summary

Set up private container registries with Harbor for secure image storage. Learn registry installation, image scanning, access control, integration with k0s, and production registry patterns.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand container registries
- ✅ Install Harbor registry
- ✅ Push and pull images
- ✅ Scan images for vulnerabilities
- ✅ Configure access control
- ✅ Integrate with Kubernetes
- ✅ Set up image replication
- ✅ Implement registry best practices

## 📦 What is a Container Registry?

### The Problem

**Public Docker Hub**:
```bash
# Pull from Docker Hub (public)
docker pull nginx:latest

# Problems:
# ❌ Rate limits (100 pulls/6 hours for anonymous)
# ❌ Images are public
# ❌ No vulnerability scanning
# ❌ No access control
# ❌ Dependency on external service
```

**Issues**:
- 🔒 **Security**: Can't host proprietary images
- 📊 **Compliance**: No audit logs
- 🚦 **Control**: Rate limits and availability
- 🔍 **Scanning**: No vulnerability detection
- 💰 **Cost**: Paid plans for private repos

---

### The Solution: Private Registry

**Private registry** provides:
- 🏠 **Self-hosted**: Full control
- 🔒 **Private**: Proprietary images secure
- 🔍 **Scanning**: Automated vulnerability detection
- 👥 **RBAC**: Role-based access control
- 📊 **Audit**: Complete activity logs
- 🔄 **Replication**: Multi-region sync

---

### Harbor vs Alternatives

**Harbor**:
- ✅ Enterprise-grade features
- ✅ Built-in vulnerability scanning
- ✅ RBAC and policies
- ✅ Web UI
- ✅ Replication
- ✅ Open source

**vs Docker Registry**:
- Basic, no UI, no scanning

**vs GitLab Registry**:
- Requires full GitLab installation

**vs Nexus/Artifactory**:
- More complex, broader scope

---

## 📥 Installing Harbor

### Prerequisites

```bash
# Docker Compose required
docker --version
docker compose version

# Minimum requirements:
# - 2 CPU cores
# - 4GB RAM
# - 40GB disk
```

---

### Download Harbor

```bash
# Download latest
wget https://github.com/goharbor/harbor/releases/download/v2.10.0/harbor-online-installer-v2.10.0.tgz

# Extract
tar xzvf harbor-online-installer-v2.10.0.tgz
cd harbor

# List files
ls
# Output: LICENSE  harbor.yml.tmpl  install.sh  prepare
```

---

### Configure Harbor

```bash
# Copy template
cp harbor.yml.tmpl harbor.yml

# Edit configuration
vim harbor.yml
```

**`harbor.yml`**:
```yaml
# Hostname (use your domain or IP)
hostname: registry.example.com

# HTTP port
http:
  port: 80

# HTTPS (optional, recommended)
https:
  port: 443
  certificate: /path/to/cert.crt
  private_key: /path/to/cert.key

# Harbor admin password
harbor_admin_password: Harbor12345  # Change this!

# Database settings
database:
  password: root123
  max_idle_conns: 100
  max_open_conns: 900

# Data volume
data_volume: /data

# Trivy (vulnerability scanning)
trivy:
  ignore_unfixed: false
  skip_update: false
  insecure: false

# Log
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor
```

---

### Install

```bash
# Prepare configuration
sudo ./prepare

# Install with Trivy scanner
sudo ./install.sh --with-trivy

# Output:
# [Step 0]: checking if docker is installed ...
# [Step 1]: checking docker-compose is installed ...
# [Step 2]: loading Harbor images ...
# [Step 3]: preparing environment ...
# [Step 4]: preparing harbor configs ...
# [Step 5]: starting Harbor ...
# ✔ ----Harbor has been installed and started successfully.----
```

---

### Access Harbor

```bash
# Open browser
http://registry.example.com

# Login:
# Username: admin
# Password: Harbor12345 (or what you set)
```

---

### Verify Installation

```bash
# Check containers
docker ps

# Output:
# CONTAINER ID   IMAGE                                COMMAND                  STATUS
# abc123         goharbor/harbor-portal:v2.10.0       "nginx -g 'daemon of…"   Up 2 minutes
# def456         goharbor/harbor-core:v2.10.0         "/harbor/entrypoint.…"   Up 2 minutes
# ghi789         goharbor/harbor-jobservice:v2.10.0   "/harbor/entrypoint.…"   Up 2 minutes
# jkl012         goharbor/registry-photon:v2.10.0     "/home/harbor/entryp…"   Up 2 minutes
# mno345         goharbor/harbor-db:v2.10.0           "/docker-entrypoint.…"   Up 2 minutes
# pqr678         goharbor/redis-photon:v2.10.0        "redis-server /etc/r…"   Up 2 minutes
```

---

## 🖼️ Working with Images

### Create Project

**In Harbor UI**:
1. Click **Projects** → **+ New Project**
2. Project Name: `myapp`
3. Access Level: **Private**
4. Click **OK**

---

### Login to Registry

```bash
# Docker login
docker login registry.example.com

# Username: admin
# Password: Harbor12345

# Output: Login Succeeded
```

---

### Tag and Push Image

```bash
# Build image
docker build -t myapp:1.0.0 .

# Tag for Harbor
docker tag myapp:1.0.0 registry.example.com/myapp/myapp:1.0.0

# Push
docker push registry.example.com/myapp/myapp:1.0.0

# Output:
# The push refers to repository [registry.example.com/myapp/myapp]
# 1.0.0: digest: sha256:abc123... size: 1234
```

---

### Pull Image

```bash
# From any machine with access
docker pull registry.example.com/myapp/myapp:1.0.0

# Output:
# 1.0.0: Pulling from myapp/myapp
# Already exists
# Digest: sha256:abc123...
# Status: Downloaded newer image for registry.example.com/myapp/myapp:1.0.0
```

---

### List Images

**In Harbor UI**:
1. Click project **myapp**
2. See all images
3. Click image to see tags

**CLI**:
```bash
# Using Harbor API
curl -u admin:Harbor12345 \
  https://registry.example.com/api/v2.0/projects/myapp/repositories

# Output: [{"name":"myapp/myapp","tags_count":1,...}]
```

---

## 🔍 Vulnerability Scanning

### Automatic Scanning

**Configure project**:
1. Click **Projects** → **myapp**
2. Click **Configuration** tab
3. Enable **Automatically scan images on push**
4. Click **Save**

**Now every push triggers scan!**

---

### Manual Scan

**In Harbor UI**:
1. Navigate to image
2. Click **Scan** button
3. Wait for completion (30s - 2min)
4. View results

---

### View Vulnerabilities

**After scan**:
```
Image: myapp:1.0.0

Vulnerabilities: 12
├─ Critical: 2
├─ High: 3
├─ Medium: 5
└─ Low: 2

Details:
CVE-2023-1234 | Critical | openssl | 1.1.1k → 1.1.1n
CVE-2023-5678 | High     | curl    | 7.68.0 → 7.81.0
```

**Click CVE** to see:
- Description
- Severity
- Fixed version
- Links to security advisories

---

### Prevent Vulnerable Images

**Set policy**:
1. Project **Configuration**
2. **Prevent vulnerable images from running**
3. Severity: **Critical** or **High**
4. Save

**Now k8s can't pull images with critical/high CVEs!**

---

## 👥 Access Control

### Create Users

**In Harbor UI**:
1. Click **Users** → **+ New User**
2. Username: `developer`
3. Email: `dev@example.com`
4. Set password
5. Click **OK**

---

### Project Members

**Add to project**:
1. Click **Projects** → **myapp**
2. **Members** tab
3. **+ User** → Select `developer`
4. Role: **Developer**
5. **OK**

---

### Roles

**Project roles**:
- 👑 **Project Admin**: Full control
- 👨‍💻 **Developer**: Push/pull images
- 👀 **Guest**: Read-only access
- 🔧 **Maintainer**: Manage project settings

---

### Robot Accounts

**For CI/CD**:
1. Project → **Robot Accounts** tab
2. **+ New Robot Account**
3. Name: `ci-bot`
4. Expiration: 365 days (or never)
5. Permissions: **Push** and **Pull**
6. **Add**
7. **Copy token** (shown once!)

**Use in CI**:
```bash
docker login registry.example.com \
  -u 'robot$ci-bot' \
  -p 'eyJhbGciOiJSUzI1...'
```

---

## 🔐 Kubernetes Integration

### Create Secret

```bash
# Create docker-registry secret
kubectl create secret docker-registry harbor-registry \
  --docker-server=registry.example.com \
  --docker-username=admin \
  --docker-password=Harbor12345 \
  --docker-email=admin@example.com

# Verify
kubectl get secret harbor-registry
```

---

### Use in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
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
      # Reference secret
      imagePullSecrets:
      - name: harbor-registry
      
      containers:
      - name: app
        # Use private image
        image: registry.example.com/myapp/myapp:1.0.0
        ports:
        - containerPort: 8080
```

```bash
kubectl apply -f deployment.yaml

# Check pods
kubectl get pods
# Output:
# NAME                     READY   STATUS    RESTARTS   AGE
# myapp-abc123-xyz         1/1     Running   0          30s
# myapp-def456-abc         1/1     Running   0          30s
# myapp-ghi789-def         1/1     Running   0          30s
```

---

### Default Service Account

**Add to default service account** (applies to all pods):
```bash
kubectl patch serviceaccount default \
  -p '{"imagePullSecrets": [{"name": "harbor-registry"}]}'

# Now all deployments automatically use this secret
```

---

## 🔄 Image Replication

### Setup Replication

**For disaster recovery or multi-region**:

**Harbor 1 (Source)**:
1. **Administration** → **Registries**
2. **+ New Endpoint**
3. Provider: **Harbor**
4. Name: `harbor-backup`
5. Endpoint URL: `https://harbor2.example.com`
6. Access ID: `admin`
7. Access Secret: `password`
8. **Test Connection** → **OK**

---

**Create replication rule**:
1. **Administration** → **Replications**
2. **+ New Replication Rule**
3. Name: `myapp-replication`
4. Replication mode: **Push-based**
5. Source resource filter: `myapp/**`
6. Destination registry: `harbor-backup`
7. Trigger Mode: **Event Based** (on push)
8. **Save**

**Now images automatically replicate!**

---

### Manual Replication

```bash
# Trigger manually
# Harbor UI → Replications → Select rule → Replicate
```

---

## 🎯 Complete Example

### CI/CD Pipeline

**GitLab CI/CD** (`.gitlab-ci.yml`):
```yaml
stages:
  - build
  - scan
  - deploy

variables:
  REGISTRY: registry.example.com
  IMAGE_NAME: $REGISTRY/myapp/myapp
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    # Login to Harbor
    - echo "$HARBOR_PASSWORD" | docker login $REGISTRY -u "$HARBOR_USERNAME" --password-stdin
    
    # Build image
    - docker build -t $IMAGE_NAME:$IMAGE_TAG .
    - docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE_NAME:latest
    
    # Push to Harbor
    - docker push $IMAGE_NAME:$IMAGE_TAG
    - docker push $IMAGE_NAME:latest

scan:
  stage: scan
  image: curlimages/curl:latest
  script:
    # Trigger scan via Harbor API
    - |
      curl -X POST \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD" \
        "$REGISTRY/api/v2.0/projects/myapp/repositories/myapp/artifacts/$IMAGE_TAG/scan"
    
    # Wait for scan to complete
    - sleep 30
    
    # Get scan results
    - |
      SCAN_RESULT=$(curl -s \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD" \
        "$REGISTRY/api/v2.0/projects/myapp/repositories/myapp/artifacts/$IMAGE_TAG")
      
      echo "$SCAN_RESULT" | jq '.scan_overview'
      
      # Fail if critical vulnerabilities
      CRITICAL=$(echo "$SCAN_RESULT" | jq '.scan_overview."application/vnd.security.vulnerability.report; version=1.1".summary.critical')
      if [ "$CRITICAL" -gt "0" ]; then
        echo "Critical vulnerabilities found!"
        exit 1
      fi

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    # Update deployment with new image
    - kubectl set image deployment/myapp app=$IMAGE_NAME:$IMAGE_TAG
    - kubectl rollout status deployment/myapp
```

---

### GitHub Actions

**`.github/workflows/deploy.yml`**:
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: registry.example.com
  IMAGE_NAME: myapp/myapp

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Harbor
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ secrets.HARBOR_USERNAME }}
        password: ${{ secrets.HARBOR_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
    
    - name: Scan image
      run: |
        # Wait for Harbor to process
        sleep 10
        
        # Check vulnerabilities
        curl -u "${{ secrets.HARBOR_USERNAME }}:${{ secrets.HARBOR_PASSWORD }}" \
          "${{ env.REGISTRY }}/api/v2.0/projects/myapp/repositories/myapp/artifacts/${{ github.sha }}" \
          | jq '.scan_overview'
    
    - name: Deploy to k8s
      run: |
        kubectl set image deployment/myapp \
          app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

---

## 🔒 SSL/TLS Configuration

### Generate Certificate

**Using Let's Encrypt**:
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d registry.example.com

# Certificates at:
# /etc/letsencrypt/live/registry.example.com/fullchain.pem
# /etc/letsencrypt/live/registry.example.com/privkey.pem
```

---

### Configure Harbor

**Edit `harbor.yml`**:
```yaml
https:
  port: 443
  certificate: /etc/letsencrypt/live/registry.example.com/fullchain.pem
  private_key: /etc/letsencrypt/live/registry.example.com/privkey.pem
```

**Restart Harbor**:
```bash
cd harbor
sudo docker compose down
sudo ./prepare
sudo docker compose up -d
```

---

### Update Docker Clients

```bash
# Copy CA certificate
sudo mkdir -p /etc/docker/certs.d/registry.example.com
sudo cp /etc/letsencrypt/live/registry.example.com/fullchain.pem \
  /etc/docker/certs.d/registry.example.com/ca.crt

# Test
docker login registry.example.com
```

---

## 🔍 Troubleshooting

### Cannot Push Images

**Check authentication**:
```bash
# Verify login
docker login registry.example.com

# Check credentials
cat ~/.docker/config.json

# Verify network
curl -I https://registry.example.com
```

---

### Kubernetes Can't Pull

**Check secret**:
```bash
# Verify secret exists
kubectl get secret harbor-registry

# View secret details
kubectl get secret harbor-registry -o yaml

# Check pod events
kubectl describe pod <pod-name>

# Look for ImagePullBackOff error
# Common issues:
# - Wrong credentials
# - Missing imagePullSecrets
# - Network can't reach registry
```

---

### Scan Fails

**Check Trivy**:
```bash
# Check Trivy container
docker ps | grep trivy

# View Trivy logs
docker logs harbor-trivy

# Common issues:
# - Database update failed
# - Network issues downloading CVE data
# - Insufficient disk space
```

---

### Harbor UI Not Accessible

**Check containers**:
```bash
# All should be Up
docker ps -a | grep harbor

# Check logs
docker logs harbor-core
docker logs harbor-portal

# Check ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

---

## 💡 Best Practices

### 1. Use Robot Accounts

```bash
# For CI/CD, create robot accounts
# Don't use admin credentials in pipelines
```

**Better security** and audit trail.

---

### 2. Enable Scanning

```yaml
# Project Configuration
automatically_scan_images_on_push: true
prevent_vulnerable_images: true
severity_level: High
```

**Catch vulnerabilities early.**

---

### 3. Tag Images Properly

```bash
# Good: Semantic versioning + commit hash
registry.example.com/myapp/api:1.2.3-abc123def

# Also tag with branch
registry.example.com/myapp/api:main

# Bad: Only 'latest'
registry.example.com/myapp/api:latest
```

---

### 4. Quota Management

**Set project quotas**:
1. Project → **Configuration**
2. **Project Quota**: 100GB
3. **Save**

**Prevents runaway storage usage.**

---

### 5. Regular Backups

```bash
# Backup Harbor data
cd harbor
sudo docker compose stop

# Backup data directory
sudo tar -czf harbor-backup-$(date +%Y%m%d).tar.gz /data

# Backup database
docker exec harbor-db pg_dumpall -U postgres > harbor-db-$(date +%Y%m%d).sql

sudo docker compose start
```

---

## 🔗 What's Next?

**CI/CD**:
- **[../cicd/gitlab-ci-basics](../cicd/gitlab-ci-basics)** - Integrate with pipelines

**Kubernetes**:
- **[k0s-ingress](k0s-ingress)** - Expose applications

**Security**:
- **[../security/container-security](../security/container-security)** - Harden containers

---

## 📚 Resources

**Harbor**:
- [Official Documentation](https://goharbor.io/docs/)
- [Installation Guide](https://goharbor.io/docs/latest/install-config/)
- [API Reference](https://goharbor.io/docs/latest/build-customize-contribute/configure-swagger/)

**Container Security**:
- [Trivy Scanner](https://aquasecurity.github.io/trivy/)
- [CVE Database](https://cve.mitre.org/)

---

## 📝 Change Log

### 2026-01-30
- Created Harbor guide
- Explained registry concepts
- Covered installation
- Demonstrated image operations
- Showed vulnerability scanning
- Implemented access control
- Kubernetes integration
- Complete CI/CD example
- SSL/TLS configuration
- Troubleshooting guide
- Best practices

---

**Next Article**: [kubernetes-concepts](kubernetes-concepts) - Core Kubernetes objects!
