# k0s - Lightweight Kubernetes

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Orchestration  
**Prerequisites**: [orchestration-need](orchestration-need), [docker-basics](docker-basics)  
**Time**: 2-3 hours  
**Tags**: kubernetes, k0s, orchestration, cluster, containers

## Summary

Learn k0s, a lightweight Kubernetes distribution with minimal dependencies and simple installation. Master single-node and multi-node cluster setup, understand k0s architecture, and deploy your first applications on Kubernetes without the complexity of traditional distributions.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand k0s architecture and benefits
- ✅ Install k0s on Linux servers
- ✅ Create single-node development clusters
- ✅ Deploy applications with kubectl
- ✅ Understand Kubernetes basics through k0s
- ✅ Troubleshoot common issues

## 🤔 What is k0s?

### Kubernetes Made Simple

**Traditional Kubernetes**:
- Complex installation
- Many dependencies (Docker/containerd, etcd, complex networking)
- Multiple tools (kubeadm, kubelet, kubectl)
- Steep learning curve

**k0s Philosophy**:
- 🎯 Single binary (all-in-one)
- 📦 Zero dependencies
- 🚀 Quick setup (< 2 minutes)
- 🔒 Secure by default
- 📏 Small footprint (< 200MB)

---

### k0s Architecture

```
┌─────────────────────────────────────────────────┐
│              k0s Controller Node                │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Control Plane                     │  │
│  │  - API Server                             │  │
│  │  - Scheduler                              │  │
│  │  - Controller Manager                     │  │
│  │  - etcd (embedded)                        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Worker Components                 │  │
│  │  - kubelet                                │  │
│  │  - containerd                             │  │
│  │  - kube-proxy                             │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│              k0s Worker Nodes                    │
│  (Optional - for multi-node clusters)            │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  - kubelet                                │   │
│  │  - containerd                             │   │
│  │  - kube-proxy                             │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## 🆚 k0s vs Other K8s Distributions

| Feature | k0s | k3s | microk8s | kubeadm |
|---------|-----|-----|----------|---------|
| **Binary Size** | ~180MB | ~70MB | ~200MB | Multiple |
| **Dependencies** | Zero | Zero | snapd | Many |
| **Installation** | Single binary | Single binary | Snap | Complex |
| **Memory (min)** | 1GB | 512MB | 540MB | 2GB |
| **Use Case** | All | Edge/IoT | Ubuntu | DIY |
| **Managed etcd** | ✅ | ✅ | ✅ | ❌ |
| **Modular** | ✅ | Limited | Limited | ✅ |
| **Complexity** | Low | Low | Low | High |

---

## 🔧 Prerequisites

### System Requirements

**Minimum** (single-node dev):
- 1 GB RAM
- 1 CPU core
- 10 GB disk space
- Linux (Ubuntu, Debian, CentOS, RHEL, etc.)

**Recommended** (production):
- 2 GB RAM
- 2 CPU cores
- 20 GB disk space
- Linux kernel 4.x+

---

### Supported Operating Systems

- ✅ Ubuntu 20.04, 22.04
- ✅ Debian 10, 11
- ✅ CentOS 7, 8
- ✅ RHEL 8, 9
- ✅ Rocky Linux
- ✅ Fedora
- ✅ Raspberry Pi OS

---

## 📥 Installation

### Quick Install (Single Command)

```bash
# Download and install k0s
curl -sSLf https://get.k0s.sh | sudo sh
```

**This downloads the k0s binary to `/usr/local/bin/k0s`**

---

### Manual Installation

```bash
# Download specific version
VERSION="v1.28.5+k0s.0"
wget https://github.com/k0sproject/k0s/releases/download/${VERSION}/k0s-${VERSION}-amd64

# Make executable
chmod +x k0s-${VERSION}-amd64

# Move to PATH
sudo mv k0s-${VERSION}-amd64 /usr/local/bin/k0s

# Verify installation
k0s version
```

---

## 🚀 Single-Node Cluster

### Install as Controller+Worker

```bash
# Install k0s as a service (controller + worker on same node)
sudo k0s install controller --single

# Start k0s
sudo k0s start

# Check status
sudo k0s status
```

**Output**:
```
Version: v1.28.5+k0s.0
Process ID: 1234
Role: controller+worker
Workloads: true
SingleNode: true
```

---

### Get kubeconfig

```bash
# Export kubeconfig
sudo k0s kubeconfig admin > ~/.kube/k0s-config

# Or set KUBECONFIG environment variable
export KUBECONFIG=~/.kube/k0s-config

# Test access
k0s kubectl get nodes
```

**Output**:
```
NAME   STATUS   ROLES    AGE   VERSION
k0s    Ready    <none>   1m    v1.28.5+k0s.0
```

---

### Install kubectl (Optional)

**k0s includes kubectl**, but you can install standalone:

```bash
# Download kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
```

**Use k0s kubectl**:
```bash
# Alias for convenience
alias kubectl='k0s kubectl'
```

---

## 🎯 First Application

### Deploy Nginx

```bash
# Create deployment
k0s kubectl create deployment nginx --image=nginx

# Expose as service
k0s kubectl expose deployment nginx --port=80 --type=NodePort

# Check status
k0s kubectl get deployments
k0s kubectl get pods
k0s kubectl get services
```

**Output**:
```
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   1/1     1            1           30s

NAME          READY   STATUS    RESTARTS   AGE
nginx-abc123  1/1     Running   0          30s

NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
nginx        NodePort    10.96.1.100    <none>        80:30080/TCP   20s
```

---

### Access Application

```bash
# Get node port
PORT=$(k0s kubectl get service nginx -o jsonpath='{.spec.ports[0].nodePort}')

# Test locally
curl http://localhost:$PORT

# Or from external machine
curl http://your-server-ip:$PORT
```

---

### View Logs

```bash
# Get pod name
POD=$(k0s kubectl get pod -l app=nginx -o jsonpath='{.items[0].metadata.name}')

# View logs
k0s kubectl logs $POD

# Follow logs
k0s kubectl logs -f $POD
```

---

### Scale Application

```bash
# Scale to 3 replicas
k0s kubectl scale deployment nginx --replicas=3

# Check pods
k0s kubectl get pods -l app=nginx
```

**Output**:
```
NAME           READY   STATUS    RESTARTS   AGE
nginx-abc123   1/1     Running   0          5m
nginx-def456   1/1     Running   0          10s
nginx-ghi789   1/1     Running   0          10s
```

---

## 📝 Kubernetes Basics (via k0s)

### Pods

**Smallest deployable unit in Kubernetes**

```bash
# Create pod from YAML
cat <<EOF | k0s kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    ports:
    - containerPort: 80
EOF

# Check pod
k0s kubectl get pod nginx-pod

# Describe pod (detailed info)
k0s kubectl describe pod nginx-pod

# Execute command in pod
k0s kubectl exec -it nginx-pod -- /bin/sh

# Delete pod
k0s kubectl delete pod nginx-pod
```

---

### Deployments

**Manages replica sets and rolling updates**

```yaml
# deployment.yaml
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
      containers:
      - name: myapp
        image: nginx:alpine
        ports:
        - containerPort: 80
```

```bash
# Apply deployment
k0s kubectl apply -f deployment.yaml

# Check rollout status
k0s kubectl rollout status deployment myapp

# Update image (rolling update)
k0s kubectl set image deployment myapp myapp=nginx:latest

# Rollback
k0s kubectl rollout undo deployment myapp
```

---

### Services

**Expose pods to network**

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer  # or ClusterIP, NodePort
```

```bash
# Apply service
k0s kubectl apply -f service.yaml

# Get service details
k0s kubectl get service myapp-service

# Get service endpoints
k0s kubectl get endpoints myapp-service
```

---

### ConfigMaps

**Store configuration data**

```bash
# Create from literal
k0s kubectl create configmap app-config \
  --from-literal=database_url=postgres://db:5432 \
  --from-literal=cache_enabled=true

# Create from file
echo "debug=true" > config.properties
k0s kubectl create configmap app-config --from-file=config.properties

# Use in pod
cat <<EOF | k0s kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp
    envFrom:
    - configMapRef:
        name: app-config
EOF
```

---

### Secrets

**Store sensitive data (base64 encoded)**

```bash
# Create secret
k0s kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=secretpass

# View secret (base64 encoded)
k0s kubectl get secret db-secret -o yaml

# Use in pod
cat <<EOF | k0s kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
EOF
```

---

## 🌐 Namespaces

### Create Namespace

```bash
# Create namespace
k0s kubectl create namespace development

# List namespaces
k0s kubectl get namespaces

# Deploy to namespace
k0s kubectl create deployment nginx --image=nginx -n development

# Set default namespace
k0s kubectl config set-context --current --namespace=development

# Get resources in namespace
k0s kubectl get all -n development
```

---

## 🔍 Troubleshooting

### Check Cluster Health

```bash
# k0s status
sudo k0s status

# Component health
k0s kubectl get componentstatuses

# Node status
k0s kubectl get nodes -o wide

# System pods
k0s kubectl get pods -n kube-system
```

---

### Common Issues

**Issue: Pods stuck in Pending**

```bash
# Check events
k0s kubectl describe pod <pod-name>

# Common causes:
# - Insufficient resources
# - Image pull errors
# - Node selectors not matching
```

**Fix**:
```bash
# Check node resources
k0s kubectl top nodes

# Check pod resource requests
k0s kubectl describe pod <pod-name> | grep -A5 "Requests"
```

---

**Issue: Pod CrashLoopBackOff**

```bash
# Check logs
k0s kubectl logs <pod-name>

# Check previous container logs
k0s kubectl logs <pod-name> --previous

# Describe pod for events
k0s kubectl describe pod <pod-name>
```

---

**Issue: Service not accessible**

```bash
# Check service endpoints
k0s kubectl get endpoints <service-name>

# If no endpoints, check pod labels match service selector
k0s kubectl get pods --show-labels
k0s kubectl get service <service-name> -o yaml | grep selector

# Check pod is running
k0s kubectl get pods -l app=<label>
```

---

### View k0s Logs

```bash
# k0s system logs
sudo journalctl -u k0scontroller -f

# containerd logs
sudo journalctl -u k0sworker -f

# All k0s logs
sudo k0s logs
```

---

## 🛠️ Management Commands

### Stop and Start

```bash
# Stop k0s
sudo k0s stop

# Start k0s
sudo k0s start

# Restart k0s
sudo k0s stop && sudo k0s start
```

---

### Backup and Restore

```bash
# Backup cluster
sudo k0s backup --save-path /backup/k0s-backup.tar.gz

# Restore cluster
sudo k0s restore /backup/k0s-backup.tar.gz
```

---

### Reset Cluster

```bash
# Stop k0s
sudo k0s stop

# Reset (removes all data)
sudo k0s reset

# Reinstall
sudo k0s install controller --single
sudo k0s start
```

---

### Uninstall

```bash
# Stop k0s
sudo k0s stop

# Reset
sudo k0s reset

# Remove binary
sudo rm /usr/local/bin/k0s

# Remove systemd service
sudo rm /etc/systemd/system/k0scontroller.service
sudo systemctl daemon-reload
```

---

## 📊 Useful Commands

### Quick Reference

```bash
# Get everything
k0s kubectl get all

# Get pods with details
k0s kubectl get pods -o wide

# Watch resources
k0s kubectl get pods --watch

# Explain resource
k0s kubectl explain pod
k0s kubectl explain pod.spec

# Resource usage
k0s kubectl top nodes
k0s kubectl top pods

# Shell into pod
k0s kubectl exec -it <pod-name> -- /bin/sh

# Port forward
k0s kubectl port-forward <pod-name> 8080:80

# Copy files
k0s kubectl cp <pod-name>:/path/to/file ./local-file

# Events
k0s kubectl get events --sort-by=.metadata.creationTimestamp
```

---

## 🎓 Next Steps

**Practice**:
1. Deploy a multi-container application
2. Use ConfigMaps and Secrets
3. Experiment with scaling
4. Practice troubleshooting

**Learn More**:
- **[k0s-installation](k0s-installation)** - Advanced installation
- **[k0s-multi-node](k0s-multi-node)** - Multi-node clusters
- **[k0s-networking](k0s-networking)** - Networking deep dive

---

## 📚 Resources

**Official Docs**:
- [k0s Documentation](https://docs.k0sproject.io/)
- [k0s GitHub](https://github.com/k0sproject/k0s)

**Kubernetes**:
- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

**Community**:
- [k0s Slack](https://k8slens.dev/slack)
- [Kubernetes Slack](https://slack.k8s.io/)

---

## 📝 Change Log

### 2026-01-30
- Created k0s introduction
- Explained architecture and benefits
- Covered installation methods
- Demonstrated single-node setup
- Included first application deployment
- Provided Kubernetes basics primer
- Added troubleshooting guide
- Included management commands
- Provided command reference

---

**Next Article**: [k0s-installation](k0s-installation) - Production installation!

