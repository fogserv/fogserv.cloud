# k0s Multi-Node Clusters - Production Kubernetes

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Kubernetes  
**Prerequisites**: [k0s-introduction](k0s-introduction), [k0s-installation](k0s-installation)  
**Time**: 3-4 hours  
**Tags**: k0s, kubernetes, cluster, multi-node, production

## Summary

Build production-ready multi-node k0s clusters with controller and worker separation, node management, cluster scaling, and high availability patterns. Learn node labels, taints/tolerations, and workload distribution for resilient Kubernetes deployments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Design multi-node cluster architecture
- ✅ Add and remove worker nodes
- ✅ Use node labels and selectors
- ✅ Apply taints and tolerations
- ✅ Distribute workloads intelligently
- ✅ Scale clusters up and down
- ✅ Handle node maintenance

## 🏗️ Multi-Node Architecture

### Cluster Design Patterns

```
┌─────────────────────────────────────────────┐
│              Load Balancer                  │
│         (HAProxy / nginx)                   │
│            :6443 :9443                      │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────┴─────────┬─────────────────┐
    │                   │                 │
    v                   v                 v
┌──────────┐      ┌──────────┐      ┌──────────┐
│Controller│      │Controller│      │Controller│
│    #1    │      │    #2    │      │    #3    │
│  + etcd  │      │  + etcd  │      │  + etcd  │
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │
     └─────────────────┴─────────────────┘
              k0s Control Plane
                     │
     ┌───────────────┼───────────────┬─────────────┐
     │               │               │             │
     v               v               v             v
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Worker 1 │   │ Worker 2 │   │ Worker 3 │   │ Worker N │
│  Pods    │   │  Pods    │   │  Pods    │   │  Pods    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

### Cluster Sizing

**Development** (Minimal):
- 1 Controller (also worker): 2 CPU, 2GB RAM
- Total: 1 node

**Production** (Recommended):
- 3 Controllers: 2 CPU, 4GB RAM each
- 3+ Workers: 4+ CPU, 8+ GB RAM each
- Total: 6+ nodes

**High Load** (Enterprise):
- 5 Controllers: 4 CPU, 8GB RAM each
- 10+ Workers: 8+ CPU, 16+ GB RAM each
- Total: 15+ nodes

---

## ➕ Adding Worker Nodes

### Generate Worker Token

On **controller**:
```bash
# Generate token (valid for 1 hour by default)
k0s token create --role=worker

# Custom expiry
k0s token create --role=worker --expiry=24h

# Save to file
k0s token create --role=worker > /tmp/worker-token.txt
```

---

### Install Worker

On **worker node**:
```bash
# Download k0s
curl -sSLf https://get.k0s.sh | sudo sh

# Install worker with token
sudo k0s install worker --token-file /tmp/worker-token.txt

# Start worker
sudo k0s start

# Check status
sudo k0s status
```

---

### Verify Node Joined

On **controller**:
```bash
# Check nodes
k0s kubectl get nodes

# Example output:
# NAME       STATUS   ROLES    AGE   VERSION
# worker-1   Ready    <none>   2m    v1.28.4+k0s
# worker-2   Ready    <none>   1m    v1.28.4+k0s
```

---

### Automated Worker Deployment

**Ansible playbook** - `add-workers.yml`:
```yaml
---
- name: Add k0s workers to cluster
  hosts: new_workers
  become: yes
  
  vars:
    k0s_version: "v1.28.4+k0s"
    controller_host: "{{ groups['controllers'][0] }}"
  
  tasks:
    - name: Install k0s binary
      get_url:
        url: "https://github.com/k0sproject/k0s/releases/download/{{ k0s_version }}/k0s-{{ k0s_version }}-amd64"
        dest: /usr/local/bin/k0s
        mode: '0755'
    
    - name: Generate worker token
      command: k0s token create --role=worker --expiry=1h
      register: worker_token
      delegate_to: "{{ controller_host }}"
      run_once: true
    
    - name: Save token to file
      copy:
        content: "{{ worker_token.stdout }}"
        dest: /tmp/worker-token.txt
        mode: '0600'
    
    - name: Install k0s worker
      command: k0s install worker --token-file /tmp/worker-token.txt
      args:
        creates: /etc/systemd/system/k0sworker.service
    
    - name: Start k0s worker
      systemd:
        name: k0sworker
        state: started
        enabled: yes
    
    - name: Wait for node to be ready
      command: kubectl get node {{ inventory_hostname }} -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
      register: node_status
      until: node_status.stdout == "True"
      retries: 30
      delay: 10
      delegate_to: "{{ controller_host }}"
    
    - name: Clean up token file
      file:
        path: /tmp/worker-token.txt
        state: absent
```

**Run**:
```bash
# Add inventory
cat >> inventory.ini <<EOF
[new_workers]
worker-3 ansible_host=10.0.1.13
worker-4 ansible_host=10.0.1.14
EOF

# Deploy
ansible-playbook -i inventory.ini add-workers.yml
```

---

## 🏷️ Node Labels

### What are Labels?

**Labels** are key-value pairs attached to nodes for:
- 🎯 Organizing nodes
- 📍 Scheduling workloads
- 🔍 Selecting subsets

---

### Common Label Patterns

```bash
# Hardware labels
environment=production
environment=staging

# Workload labels
workload=web
workload=database
workload=cache

# Location labels
zone=us-east-1a
zone=us-east-1b
region=us-east

# Hardware specs
disk=ssd
disk=hdd
gpu=nvidia-t4
```

---

### Apply Labels

```bash
# Label single node
k0s kubectl label nodes worker-1 workload=web

# Label multiple
k0s kubectl label nodes worker-1 worker-2 environment=production

# Multiple labels at once
k0s kubectl label nodes worker-3 \
  environment=production \
  workload=database \
  disk=ssd

# Show labels
k0s kubectl get nodes --show-labels

# Filter by label
k0s kubectl get nodes -l workload=web
```

---

### Label Nodes at Join Time

**Worker config** - `/etc/k0s/k0s-worker.yaml`:
```yaml
spec:
  workerProfiles:
    - name: default
      values:
        labels:
          environment: production
          workload: web
          zone: us-east-1a
```

**Install with config**:
```bash
sudo k0s install worker \
  --token-file /tmp/worker-token.txt \
  --config /etc/k0s/k0s-worker.yaml
```

---

### Use Node Selectors

**Deployment with node selector**:
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
      # Only schedule on nodes with workload=web label
      nodeSelector:
        workload: web
      
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
```

**Apply**:
```bash
k0s kubectl apply -f web-deployment.yaml

# Verify pod placement
k0s kubectl get pods -o wide
# Should only be on worker-1, worker-2 (labeled workload=web)
```

---

## 🚫 Taints and Tolerations

### What are Taints?

**Taints** prevent pods from being scheduled on nodes **unless** they have matching **tolerations**.

**Use cases**:
- 🔧 Reserve nodes for specific workloads
- 🛠️ Maintenance mode
- 💰 Expensive hardware (GPUs)
- 🔐 Isolated workloads

---

### Taint Effects

1. **NoSchedule**: Don't schedule new pods
2. **PreferNoSchedule**: Avoid scheduling (soft)
3. **NoExecute**: Evict existing pods

---

### Apply Taints

```bash
# Taint node (NoSchedule)
k0s kubectl taint nodes worker-3 workload=database:NoSchedule

# GPU node
k0s kubectl taint nodes worker-gpu gpu=nvidia:NoSchedule

# Maintenance mode
k0s kubectl taint nodes worker-2 maintenance=true:NoExecute

# Show taints
k0s kubectl describe node worker-3 | grep Taints
```

---

### Tolerate Taints

**Deployment with toleration**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      # Tolerate database taint
      tolerations:
      - key: workload
        operator: Equal
        value: database
        effect: NoSchedule
      
      nodeSelector:
        workload: database
      
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_PASSWORD
          value: secret
```

---

### Remove Taints

```bash
# Remove specific taint
k0s kubectl taint nodes worker-3 workload:NoSchedule-
# Note the trailing minus sign

# Remove all taints
k0s kubectl taint nodes worker-3 workload-
```

---

## 📊 Node Affinity

### Affinity vs Node Selectors

**Node Selector**: Simple, exact match
**Node Affinity**: Complex rules, preferences

---

### Required Affinity

**Must** run on specific nodes:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: database-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: disk
            operator: In
            values:
            - ssd
            - nvme
          - key: workload
            operator: NotIn
            values:
            - test
  
  containers:
  - name: postgres
    image: postgres:15
```

---

### Preferred Affinity

**Prefer** specific nodes (soft):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 5
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          # Prefer zone us-east-1a (weight 80)
          - weight: 80
            preference:
              matchExpressions:
              - key: zone
                operator: In
                values:
                - us-east-1a
          
          # Then prefer SSD (weight 50)
          - weight: 50
            preference:
              matchExpressions:
              - key: disk
                operator: In
                values:
                - ssd
      
      containers:
      - name: nginx
        image: nginx:latest
```

Scheduler tries to place pods on nodes matching preferences, but will schedule elsewhere if needed.

---

## 🔄 Pod Anti-Affinity

### Spread Pods Across Nodes

**Avoid single point of failure**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - api
            topologyKey: kubernetes.io/hostname
      
      containers:
      - name: api
        image: myapi:latest
```

Ensures each pod runs on a **different node**.

---

### Spread Across Zones

```yaml
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
              - frontend
          topologyKey: zone
```

Prefers to spread pods across different zones.

---

## ➖ Removing Nodes

### Drain Node

**Before removal**, drain workloads:
```bash
# Drain (evict pods gracefully)
k0s kubectl drain worker-3 \
  --ignore-daemonsets \
  --delete-emptydir-data \
  --timeout=5m

# Example output:
# node/worker-3 cordoned
# evicting pod default/nginx-abc123
# pod/nginx-abc123 evicted
# node/worker-3 drained
```

---

### Remove from Cluster

On **controller**:
```bash
# Delete node
k0s kubectl delete node worker-3

# Verify
k0s kubectl get nodes
```

On **worker node** being removed:
```bash
# Stop worker
sudo k0s stop

# Uninstall
sudo k0s reset
```

---

### Uncordon Node

If you want to bring node back **without removing**:
```bash
# Drain makes node "cordoned" (unschedulable)
# Uncordon to allow scheduling again
k0s kubectl uncordon worker-3
```

---

## 📈 Cluster Scaling

### Scale Up Strategy

**1. Prepare infrastructure**:
```bash
# Provision VMs (Terraform, Proxmox, cloud)
terraform apply -var="worker_count=5"
```

**2. Generate tokens**:
```bash
# On controller
for i in {4..5}; do
  k0s token create --role=worker > worker-${i}-token.txt
done
```

**3. Join workers**:
```bash
# Ansible or script
ansible-playbook -i inventory add-workers.yml
```

**4. Verify**:
```bash
k0s kubectl get nodes
k0s kubectl top nodes
```

---

### Scale Down Strategy

**1. Identify nodes to remove**:
```bash
# List nodes with resource usage
k0s kubectl top nodes

# Choose least utilized or oldest
```

**2. Drain workloads**:
```bash
k0s kubectl drain worker-5 --ignore-daemonsets
```

**3. Remove from cluster**:
```bash
k0s kubectl delete node worker-5
```

**4. Decommission infrastructure**:
```bash
# On worker-5
sudo k0s reset

# Destroy VM
terraform destroy -target=proxmox_vm_qemu.worker[4]
```

---

### Auto-scaling (Advanced)

**Cluster Autoscaler** (for cloud providers):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - name: cluster-autoscaler
        image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0
        command:
        - ./cluster-autoscaler
        - --cloud-provider=aws  # or azure, gcp
        - --nodes=1:10:k0s-workers
        env:
        - name: AWS_REGION
          value: us-east-1
```

**Note**: Self-hosted (Proxmox) requires custom scaling scripts.

---

## 🔧 Node Maintenance

### Maintenance Mode

**1. Cordon node** (prevent new pods):
```bash
k0s kubectl cordon worker-2
```

**2. Perform maintenance**:
```bash
# SSH to node
ssh worker-2

# Update system
sudo apt update && sudo apt upgrade -y

# Reboot if needed
sudo reboot
```

**3. Uncordon**:
```bash
k0s kubectl uncordon worker-2
```

---

### Rolling Node Updates

**Ansible playbook** - `rolling-update.yml`:
```yaml
---
- name: Rolling update k0s workers
  hosts: workers
  serial: 1  # One at a time
  become: yes
  
  vars:
    controller_host: "{{ groups['controllers'][0] }}"
  
  tasks:
    - name: Cordon node
      command: kubectl cordon {{ inventory_hostname }}
      delegate_to: "{{ controller_host }}"
    
    - name: Drain node
      command: >
        kubectl drain {{ inventory_hostname }}
        --ignore-daemonsets
        --delete-emptydir-data
        --timeout=5m
      delegate_to: "{{ controller_host }}"
    
    - name: Update k0s
      get_url:
        url: "https://github.com/k0sproject/k0s/releases/download/v1.29.0+k0s/k0s-v1.29.0+k0s-amd64"
        dest: /tmp/k0s-new
        mode: '0755'
    
    - name: Stop k0s
      systemd:
        name: k0sworker
        state: stopped
    
    - name: Replace binary
      copy:
        src: /tmp/k0s-new
        dest: /usr/local/bin/k0s
        remote_src: yes
        mode: '0755'
    
    - name: Start k0s
      systemd:
        name: k0sworker
        state: started
    
    - name: Wait for node ready
      command: kubectl get node {{ inventory_hostname }} -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
      register: node_status
      until: node_status.stdout == "True"
      retries: 30
      delay: 10
      delegate_to: "{{ controller_host }}"
    
    - name: Uncordon node
      command: kubectl uncordon {{ inventory_hostname }}
      delegate_to: "{{ controller_host }}"
    
    - name: Verify pods running
      shell: kubectl get pods --all-namespaces --field-selector spec.nodeName={{ inventory_hostname }} | grep -c Running
      register: pod_count
      delegate_to: "{{ controller_host }}"
    
    - name: Display pod count
      debug:
        msg: "{{ pod_count.stdout }} pods running on {{ inventory_hostname }}"
```

---

## 📊 Monitoring Nodes

### Node Status

```bash
# All nodes
k0s kubectl get nodes -o wide

# Specific node details
k0s kubectl describe node worker-1

# Resource usage
k0s kubectl top nodes

# Conditions
k0s kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'
```

---

### Node Problems

**Check conditions**:
```bash
k0s kubectl describe node worker-3 | grep Conditions -A 10

# Example output:
# Conditions:
#   Type             Status
#   ----             ------
#   MemoryPressure   False
#   DiskPressure     False
#   PIDPressure      False
#   Ready            True
```

**Common issues**:
- `MemoryPressure`: Low memory
- `DiskPressure`: Low disk space
- `PIDPressure`: Too many processes
- `Ready False`: Node not healthy

---

### Resource Reservations

**Prevent node resource exhaustion**:
```yaml
# /etc/k0s/k0s-worker.yaml
spec:
  workerProfiles:
    - name: default
      values:
        kubeletExtraArgs:
          # Reserve for system
          system-reserved: "cpu=500m,memory=1Gi"
          # Reserve for k0s
          kube-reserved: "cpu=500m,memory=1Gi"
          # Eviction thresholds
          eviction-hard: "memory.available<500Mi,nodefs.available<10%"
```

---

## 🎯 Best Practices

### 1. Separate Controllers and Workers

```bash
# Controllers: NO workloads (except system pods)
k0s install controller --enable-worker=false

# Workers: Application workloads only
k0s install worker --token-file worker-token.txt
```

---

### 2. Use Descriptive Labels

```bash
# Good: Clear meaning
k0s kubectl label nodes worker-1 \
  environment=production \
  workload=web \
  zone=us-east-1a \
  instance-type=t3.large

# Bad: Vague
k0s kubectl label nodes worker-1 type=1
```

---

### 3. Label Nodes Early

**During deployment**:
```yaml
# Ansible
- name: Label nodes
  command: >
    kubectl label nodes {{ inventory_hostname }}
    environment={{ environment }}
    workload={{ node_role }}
    zone={{ availability_zone }}
  delegate_to: "{{ groups['controllers'][0] }}"
```

---

### 4. Use Anti-Affinity for HA

```yaml
# Spread replicas across nodes
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: myapp
        topologyKey: kubernetes.io/hostname
```

---

### 5. Drain Before Maintenance

```bash
# Always drain first
k0s kubectl drain worker-2 --ignore-daemonsets

# Never just stop k0s!
# sudo k0s stop  ❌ Don't do this without draining
```

---

### 6. Monitor Node Health

**Prometheus NodeExporter** (see k0s-monitoring.md):
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
      hostNetwork: true
      hostPID: true
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        ports:
        - containerPort: 9100
```

---

## 🔍 Troubleshooting

### Node Not Joining

**Check token**:
```bash
# On controller, verify token
k0s token list

# Generate new token
k0s token create --role=worker --expiry=1h
```

**Check network**:
```bash
# From worker, test connectivity
telnet controller-1 6443
curl -k https://controller-1:6443

# Check firewall
sudo ufw status
```

**Check logs**:
```bash
# On worker
sudo journalctl -u k0sworker -f
```

---

### Pods Not Scheduling

**Check node status**:
```bash
k0s kubectl get nodes
# Look for "NotReady" or "SchedulingDisabled"
```

**Check node resources**:
```bash
k0s kubectl describe node worker-3 | grep -A 5 "Allocated resources"

# Insufficient resources?
# Allocatable:
#   cpu:                2
#   memory:             4Gi
# Allocated:
#   cpu:                1800m (90%)  # Too high!
#   memory:             3.5Gi (87%)
```

**Check taints**:
```bash
k0s kubectl describe node worker-3 | grep Taints

# If tainted, pods need tolerations
```

---

### Node Stuck Terminating

**Force delete**:
```bash
k0s kubectl delete node worker-5 --force --grace-period=0
```

**Check for finalizers**:
```bash
k0s kubectl get node worker-5 -o yaml | grep finalizers -A 3

# Remove finalizers if stuck
k0s kubectl patch node worker-5 -p '{"metadata":{"finalizers":[]}}'
```

---

## 🔗 What's Next?

**Networking**:
- **[k0s-networking](k0s-networking)** - CNI, network policies

**Storage**:
- **[k0s-storage](k0s-storage)** - Persistent volumes

**Package Management**:
- **[k0s-helm](k0s-helm)** - Helm charts

---

## 📚 Resources

**k0s Documentation**:
- [k0s Workers](https://docs.k0sproject.io/stable/worker-nodes/)
- [Node Management](https://docs.k0sproject.io/stable/node-management/)

**Kubernetes Concepts**:
- [Nodes](https://kubernetes.io/docs/concepts/architecture/nodes/)
- [Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [Node Affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity)

---

## 📝 Change Log

### 2026-01-30
- Created multi-node guide
- Explained cluster architecture
- Covered node addition/removal
- Demonstrated labels and selectors
- Explained taints and tolerations
- Covered node affinity patterns
- Showed cluster scaling
- Included node maintenance
- Added monitoring and troubleshooting

---

**Next Article**: [k0s-networking](k0s-networking) - CNI and network policies!
