# k0s Installation - Production Setup

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Orchestration  
**Prerequisites**: [k0s-introduction](k0s-introduction), [docker-basics](docker-basics)  
**Time**: 3-4 hours  
**Tags**: k0s, kubernetes, installation, production, cluster

## Summary

Master production-ready k0s installation patterns for controller and worker nodes, high availability clusters, configuration management, and automated deployment. Learn systemd integration, backup strategies, and upgrade procedures for reliable Kubernetes clusters.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Install k0s with custom configuration
- ✅ Set up dedicated controller nodes
- ✅ Add worker nodes to clusters
- ✅ Configure high availability
- ✅ Automate k0s deployment
- ✅ Backup and restore clusters
- ✅ Upgrade k0s safely

## 🏗️ Architecture Patterns

### Single-Node (Development)

```
┌─────────────────────────┐
│   Controller + Worker   │
│  (Combined on one node) │
│                         │
│  - Control Plane        │
│  - Worker Components    │
│  - Pods run here        │
└─────────────────────────┘

Use case: Development, testing, small workloads
Resources: 1GB RAM, 1 CPU minimum
```

---

### Multi-Node (Production)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Controller 1   │  │  Controller 2   │  │  Controller 3   │
│  (Control only) │  │  (Control only) │  │  (Control only) │
│  - API Server   │  │  - API Server   │  │  - API Server   │
│  - Scheduler    │  │  - Scheduler    │  │  - Scheduler    │
│  - etcd         │  │  - etcd         │  │  - etcd         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        ↓                     ↓                     ↓
┌────────────────────────────────────────────────────────────┐
│                      Load Balancer                         │
│               (HAProxy, Nginx, or cloud LB)                │
└────────────────────────────────────────────────────────────┘
        ↓                     ↓                     ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    Worker 1     │  │    Worker 2     │  │    Worker 3     │
│  - kubelet      │  │  - kubelet      │  │  - kubelet      │
│  - containerd   │  │  - containerd   │  │  - containerd   │
│  - Pods         │  │  - Pods         │  │  - Pods         │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Use case: Production workloads
Resources: 2GB RAM, 2 CPU per controller; 4GB RAM, 2 CPU per worker
```

---

## 🎛️ k0s Configuration

### Default Configuration

```bash
# Generate default config
k0s config create > k0s.yaml
```

**k0s.yaml** (annotated):
```yaml
apiVersion: k0s.k0sproject.io/v1beta1
kind: ClusterConfig
metadata:
  name: k0s
spec:
  api:
    # API server configuration
    address: 0.0.0.0  # Listen on all interfaces
    port: 6443
    k0sApiPort: 9443
    sans:  # Additional SANs for TLS cert
    - 10.0.1.10
    - controller.example.com
  
  storage:
    # etcd configuration
    type: etcd
    etcd:
      peerAddress: 10.0.1.10  # Controller's IP
  
  network:
    # Networking configuration
    provider: calico
    calico:
      mode: vxlan
    podCIDR: 10.244.0.0/16
    serviceCIDR: 10.96.0.0/12
  
  # Install default components
  extensions:
    helm:
      repositories:
      - name: stable
        url: https://charts.helm.sh/stable
      charts: []
    
    storage:
      type: external_storage
  
  # Telemetry (disable if needed)
  telemetry:
    enabled: true
```

---

### Custom Configuration

**k0s-custom.yaml**:
```yaml
apiVersion: k0s.k0sproject.io/v1beta1
kind: ClusterConfig
metadata:
  name: production-cluster
spec:
  api:
    address: 10.0.1.10
    port: 6443
    sans:
    - 10.0.1.10
    - 10.0.1.11
    - 10.0.1.12
    - k8s.example.com
    - "*.k8s.example.com"
  
  storage:
    type: etcd
    etcd:
      peerAddress: 10.0.1.10
  
  network:
    provider: calico
    calico:
      mode: vxlan
      mtu: 1450
    podCIDR: 10.244.0.0/16
    serviceCIDR: 10.96.0.0/12
  
  # Pod Security Standards
  podSecurityPolicy:
    defaultPolicy: restricted
  
  # kube-proxy mode
  konnectivity:
    agentPort: 8132
  
  # Controller manager flags
  controllerManager:
    extraArgs:
      node-monitor-grace-period: 40s
      node-monitor-period: 5s
  
  # Scheduler flags
  scheduler:
    extraArgs:
      v: "2"
  
  # Worker profiles
  workerProfiles:
  - name: default
    values:
      maxPods: 110
  - name: high-density
    values:
      maxPods: 250
  
  extensions:
    storage:
      create_default_storage_class: false
    
    helm:
      repositories:
      - name: bitnami
        url: https://charts.bitnami.com/bitnami
      
      charts:
      - name: metrics-server
        chartname: bitnami/metrics-server
        version: "6.2.0"
        namespace: kube-system
```

**Install with config**:
```bash
sudo k0s install controller --config k0s-custom.yaml
sudo k0s start
```

---

## 🎮 Controller Installation

### Dedicated Controller (No Workers)

```bash
# Install controller only
sudo k0s install controller \
  --enable-worker=false \
  --config /etc/k0s/k0s.yaml

# Enable systemd service
sudo systemctl enable k0scontroller

# Start service
sudo systemctl start k0scontroller

# Check status
sudo k0s status
sudo systemctl status k0scontroller

# View logs
sudo journalctl -u k0scontroller -f
```

---

### Controller with Custom Options

```bash
# Install with specific data dir
sudo k0s install controller \
  --data-dir /var/lib/k0s \
  --enable-worker=false \
  --config /etc/k0s/k0s.yaml

# Install with specific log level
sudo k0s install controller \
  --enable-worker=false \
  --logging '{"level": "debug"}' \
  --config /etc/k0s/k0s.yaml
```

---

### Controller Systemd Service

**View generated service**:
```bash
cat /etc/systemd/system/k0scontroller.service
```

**Example service file**:
```ini
[Unit]
Description=k0s - Zero Friction Kubernetes
Documentation=https://docs.k0sproject.io
After=network-online.target

[Service]
Type=notify
WorkingDirectory=/var/lib/k0s
ExecStart=/usr/local/bin/k0s controller --config=/etc/k0s/k0s.yaml
Restart=always
RestartSec=5s
KillMode=process

[Install]
WantedBy=multi-user.target
```

---

## 👷 Worker Installation

### Generate Worker Token

**On controller**:
```bash
# Generate token for worker to join
sudo k0s token create --role=worker > worker-token.txt

# Token is valid for 4 hours by default
# Generate with custom expiry
sudo k0s token create --role=worker --expiry=24h > worker-token.txt
```

---

### Install Worker Node

**On worker node**:
```bash
# 1. Install k0s binary
curl -sSLf https://get.k0s.sh | sudo sh

# 2. Install as worker with token
sudo k0s install worker --token-file /path/to/worker-token.txt

# Or pass token directly
sudo k0s install worker --token "TOKEN_STRING_HERE"

# 3. Start worker
sudo k0s start

# 4. Check status
sudo k0s status
sudo systemctl status k0sworker
```

---

### Worker with Custom Config

```bash
# Custom data dir and labels
sudo k0s install worker \
  --token-file /path/to/token.txt \
  --data-dir /data/k0s \
  --labels "node-role.kubernetes.io/worker=true,workload=web"

# Custom kubelet args
sudo k0s install worker \
  --token-file /path/to/token.txt \
  --kubelet-extra-args "--max-pods=250 --kube-reserved=cpu=500m,memory=1Gi"
```

---

### Verify Worker Joined

**On controller**:
```bash
# List nodes
sudo k0s kubectl get nodes

# Output:
# NAME      STATUS   ROLES    AGE   VERSION
# worker1   Ready    <none>   1m    v1.28.5+k0s.0
# worker2   Ready    <none>   1m    v1.28.5+k0s.0
```

---

## 🏢 High Availability Setup

### 3-Controller HA Cluster

**Requirements**:
- 3 controller nodes (odd number for etcd quorum)
- Load balancer in front of controllers
- Shared cluster configuration

---

### Step 1: Initialize First Controller

**controller1 (10.0.1.10)**:
```bash
# Create HA config
cat > /etc/k0s/k0s.yaml <<EOF
apiVersion: k0s.k0sproject.io/v1beta1
kind: ClusterConfig
metadata:
  name: ha-cluster
spec:
  api:
    externalAddress: loadbalancer.example.com
    sans:
    - 10.0.1.10
    - 10.0.1.11
    - 10.0.1.12
    - loadbalancer.example.com
  storage:
    type: etcd
    etcd:
      peerAddress: 10.0.1.10
EOF

# Install and start
sudo k0s install controller \
  --enable-worker=false \
  --config /etc/k0s/k0s.yaml

sudo k0s start
```

---

### Step 2: Generate Controller Join Token

**On controller1**:
```bash
# Generate token for additional controllers
sudo k0s token create --role=controller > controller-token.txt
```

---

### Step 3: Join Additional Controllers

**controller2 (10.0.1.11)**:
```bash
# Create config (same as controller1 but different peerAddress)
cat > /etc/k0s/k0s.yaml <<EOF
apiVersion: k0s.k0sproject.io/v1beta1
kind: ClusterConfig
metadata:
  name: ha-cluster
spec:
  api:
    externalAddress: loadbalancer.example.com
    sans:
    - 10.0.1.10
    - 10.0.1.11
    - 10.0.1.12
    - loadbalancer.example.com
  storage:
    type: etcd
    etcd:
      peerAddress: 10.0.1.11
EOF

# Install with token
sudo k0s install controller \
  --enable-worker=false \
  --config /etc/k0s/k0s.yaml \
  --token-file /path/to/controller-token.txt

sudo k0s start
```

**Repeat for controller3 (10.0.1.12)**

---

### Step 4: Verify HA Cluster

**On any controller**:
```bash
# Check etcd members
sudo k0s etcd member-list

# Output:
# member1, started, controller1, 10.0.1.10:2380
# member2, started, controller2, 10.0.1.11:2380
# member3, started, controller3, 10.0.1.12:2380
```

---

### Load Balancer Configuration

**HAProxy example** (/etc/haproxy/haproxy.cfg):
```
frontend k8s_api
    bind *:6443
    mode tcp
    default_backend k8s_controllers

backend k8s_controllers
    mode tcp
    balance roundrobin
    option tcp-check
    
    server controller1 10.0.1.10:6443 check fall 3 rise 2
    server controller2 10.0.1.11:6443 check fall 3 rise 2
    server controller3 10.0.1.12:6443 check fall 3 rise 2

frontend k0s_api
    bind *:9443
    mode tcp
    default_backend k0s_controllers

backend k0s_controllers
    mode tcp
    balance roundrobin
    
    server controller1 10.0.1.10:9443 check fall 3 rise 2
    server controller2 10.0.1.11:9443 check fall 3 rise 2
    server controller3 10.0.1.12:9443 check fall 3 rise 2
```

---

## 🤖 Automated Deployment

### Ansible Playbook

**playbooks/k0s-cluster.yaml**:
```yaml
---
- name: Install k0s controllers
  hosts: controllers
  become: yes
  
  vars:
    k0s_version: v1.28.5+k0s.0
    cluster_name: production
  
  tasks:
    - name: Download k0s binary
      get_url:
        url: "https://github.com/k0sproject/k0s/releases/download/{{ k0s_version }}/k0s-{{ k0s_version }}-amd64"
        dest: /usr/local/bin/k0s
        mode: '0755'
    
    - name: Create k0s config directory
      file:
        path: /etc/k0s
        state: directory
    
    - name: Template k0s config
      template:
        src: k0s-config.yaml.j2
        dest: /etc/k0s/k0s.yaml
    
    - name: Install first controller
      command: k0s install controller --enable-worker=false --config /etc/k0s/k0s.yaml
      when: inventory_hostname == groups['controllers'][0]
    
    - name: Start first controller
      systemd:
        name: k0scontroller
        state: started
        enabled: yes
      when: inventory_hostname == groups['controllers'][0]
    
    - name: Wait for first controller
      wait_for:
        port: 6443
        timeout: 300
      when: inventory_hostname == groups['controllers'][0]
    
    - name: Generate controller join token
      command: k0s token create --role=controller
      register: controller_token
      delegate_to: "{{ groups['controllers'][0] }}"
      run_once: true
      when: inventory_hostname != groups['controllers'][0]
    
    - name: Install additional controllers
      command: k0s install controller --enable-worker=false --config /etc/k0s/k0s.yaml --token "{{ controller_token.stdout }}"
      when: inventory_hostname != groups['controllers'][0]
    
    - name: Start additional controllers
      systemd:
        name: k0scontroller
        state: started
        enabled: yes
      when: inventory_hostname != groups['controllers'][0]

- name: Install k0s workers
  hosts: workers
  become: yes
  
  tasks:
    - name: Download k0s binary
      get_url:
        url: "https://github.com/k0sproject/k0s/releases/download/{{ k0s_version }}/k0s-{{ k0s_version }}-amd64"
        dest: /usr/local/bin/k0s
        mode: '0755'
    
    - name: Generate worker join token
      command: k0s token create --role=worker
      register: worker_token
      delegate_to: "{{ groups['controllers'][0] }}"
      run_once: true
    
    - name: Install worker
      command: k0s install worker --token "{{ worker_token.stdout }}"
    
    - name: Start worker
      systemd:
        name: k0sworker
        state: started
        enabled: yes
```

---

### Terraform Module

**modules/k0s/main.tf**:
```hcl
resource "null_resource" "k0s_controller" {
  count = var.controller_count
  
  connection {
    host        = var.controller_ips[count.index]
    user        = "ubuntu"
    private_key = file(var.ssh_private_key)
  }
  
  provisioner "remote-exec" {
    inline = [
      "curl -sSLf https://get.k0s.sh | sudo sh",
      "sudo k0s install controller --enable-worker=false --config /tmp/k0s.yaml",
      "sudo k0s start",
    ]
  }
}
```

---

## 💾 Backup and Restore

### Backup Cluster

```bash
# Full backup (includes etcd data)
sudo k0s backup --save-path /backup/k0s-backup-$(date +%Y%m%d-%H%M%S).tar.gz

# Backup to specific location
sudo k0s backup --save-path /mnt/backups/k0s-backup.tar.gz
```

**Backup contains**:
- etcd data
- Certificates
- Configuration files

---

### Automated Backup Script

**/usr/local/bin/k0s-backup.sh**:
```bash
#!/bin/bash
set -e

BACKUP_DIR="/backup/k0s"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
BACKUP_FILE="$BACKUP_DIR/k0s-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
k0s backup --save-path "$BACKUP_FILE"

# Compress
gzip -9 "$BACKUP_FILE"

# Remove old backups
find "$BACKUP_DIR" -name "k0s-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Cron job**:
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/k0s-backup.sh >> /var/log/k0s-backup.log 2>&1
```

---

### Restore Cluster

```bash
# Stop k0s
sudo k0s stop

# Restore from backup
sudo k0s restore /backup/k0s-backup-20260130-020000.tar.gz

# Start k0s
sudo k0s start

# Verify
sudo k0s kubectl get nodes
```

---

## 🔄 Upgrade k0s

### Upgrade Strategy

**Recommended order**:
1. Backup cluster
2. Upgrade first controller
3. Upgrade remaining controllers
4. Upgrade workers

---

### Upgrade Controller

```bash
# 1. Backup first
sudo k0s backup --save-path /backup/pre-upgrade-backup.tar.gz

# 2. Download new version
VERSION="v1.29.0+k0s.0"
wget https://github.com/k0sproject/k0s/releases/download/${VERSION}/k0s-${VERSION}-amd64

# 3. Stop k0s
sudo k0s stop

# 4. Replace binary
sudo mv k0s-${VERSION}-amd64 /usr/local/bin/k0s
sudo chmod +x /usr/local/bin/k0s

# 5. Start k0s
sudo k0s start

# 6. Verify version
k0s version

# 7. Check cluster health
sudo k0s kubectl get nodes
```

---

### Automated Upgrade

**Ansible playbook**:
```yaml
---
- name: Upgrade k0s cluster
  hosts: k0s_cluster
  serial: 1  # One host at a time
  become: yes
  
  vars:
    new_k0s_version: v1.29.0+k0s.0
  
  tasks:
    - name: Backup k0s
      command: k0s backup --save-path /backup/pre-upgrade-{{ inventory_hostname }}.tar.gz
      when: "'controllers' in group_names"
    
    - name: Download new k0s version
      get_url:
        url: "https://github.com/k0sproject/k0s/releases/download/{{ new_k0s_version }}/k0s-{{ new_k0s_version }}-amd64"
        dest: /tmp/k0s-new
        mode: '0755'
    
    - name: Stop k0s
      systemd:
        name: "{{ 'k0scontroller' if 'controllers' in group_names else 'k0sworker' }}"
        state: stopped
    
    - name: Replace binary
      copy:
        src: /tmp/k0s-new
        dest: /usr/local/bin/k0s
        mode: '0755'
        remote_src: yes
    
    - name: Start k0s
      systemd:
        name: "{{ 'k0scontroller' if 'controllers' in group_names else 'k0sworker' }}"
        state: started
    
    - name: Wait for node ready
      command: k0s kubectl wait --for=condition=Ready node/{{ inventory_hostname }} --timeout=300s
      delegate_to: "{{ groups['controllers'][0] }}"
      when: "'workers' in group_names"
```

---

## 🔍 Troubleshooting

### Check Service Status

```bash
# Service status
sudo systemctl status k0scontroller  # or k0sworker

# View logs
sudo journalctl -u k0scontroller -f

# Check k0s status
sudo k0s status

# Check component health
sudo k0s kubectl get componentstatuses
```

---

### Common Issues

**Issue: Controller won't start**

```bash
# Check logs
sudo journalctl -u k0scontroller -n 100

# Verify config
sudo k0s config validate /etc/k0s/k0s.yaml

# Check port availability
sudo ss -tulpn | grep -E ':(6443|9443|2379|2380)'
```

---

**Issue: Worker can't join**

```bash
# Verify token
sudo k0s token create --role=worker

# Check connectivity to controller
telnet controller-ip 6443

# Check worker logs
sudo journalctl -u k0sworker -f
```

---

**Issue: etcd cluster unhealthy**

```bash
# Check etcd status
sudo k0s etcd member-list

# Check etcd health
sudo k0s kubectl get cs

# View etcd logs
sudo journalctl -u k0scontroller | grep etcd
```

---

## 🔗 What's Next?

**Multi-Node Clusters**:
- **[k0s-multi-node](k0s-multi-node)** - Production cluster patterns

**Networking**:
- **[k0s-networking](k0s-networking)** - CNI, services, ingress

**Storage**:
- **[k0s-storage](k0s-storage)** - Persistent volumes

---

## 📚 Resources

**Official Docs**:
- [k0s Installation](https://docs.k0sproject.io/stable/install/)
- [k0s Configuration](https://docs.k0sproject.io/stable/configuration/)
- [k0s High Availability](https://docs.k0sproject.io/stable/high-availability/)

**Tools**:
- [k0sctl](https://github.com/k0sproject/k0sctl) - Cluster lifecycle tool
- [k0smotron](https://github.com/k0sproject/k0smotron) - k0s on k8s

---

## 📝 Change Log

### 2026-01-30
- Created production installation guide
- Covered architecture patterns
- Demonstrated configuration options
- Explained controller and worker installation
- Provided HA cluster setup
- Included automation examples
- Added backup and restore procedures
- Covered upgrade strategies
- Included troubleshooting guide

---

**Next Article**: [k0s-multi-node](k0s-multi-node) - Production clusters!

