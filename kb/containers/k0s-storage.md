# k0s Storage - Persistent Volumes and StatefulSets

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Kubernetes  
**Prerequisites**: [k0s-introduction](k0s-introduction), [k0s-multi-node](k0s-multi-node)  
**Time**: 3-4 hours  
**Tags**: k0s, kubernetes, storage, persistent-volumes, statefulsets

## Summary

Master persistent storage in k0s with PersistentVolumes, PersistentVolumeClaims, StorageClasses, and StatefulSets for databases and stateful applications. Learn local storage, NFS, and CSI drivers for production-ready persistent data.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Kubernetes storage concepts
- ✅ Create PersistentVolumes
- ✅ Use PersistentVolumeClaims
- ✅ Configure StorageClasses
- ✅ Deploy StatefulSets
- ✅ Use local storage
- ✅ Set up NFS storage
- ✅ Implement CSI drivers

## 💾 Storage Concepts

### The Problem

**Pods are ephemeral** - when deleted, data is lost.

**Containers**:
```bash
# Run container with data
k0s kubectl run test --image=nginx
k0s kubectl exec test -- sh -c "echo 'data' > /tmp/file.txt"

# Delete pod
k0s kubectl delete pod test

# Recreate
k0s kubectl run test --image=nginx
k0s kubectl exec test -- cat /tmp/file.txt
# Error: No such file
```

**Solution**: Persistent storage that survives pod restarts.

---

### Storage Architecture

```
┌────────────────────────────────────────────────┐
│              Storage Layers                    │
├────────────────────────────────────────────────┤
│                                                │
│  Application (Pod)                             │
│       ↓                                        │
│  PersistentVolumeClaim (PVC)                   │
│       ↓                                        │
│  PersistentVolume (PV)                         │
│       ↓                                        │
│  Storage Backend (Local/NFS/Cloud)             │
│                                                │
└────────────────────────────────────────────────┘
```

---

### Key Concepts

**PersistentVolume (PV)**:
- 🗄️ Actual storage resource
- 📁 Cluster-level resource
- 🔧 Provisioned by admin

**PersistentVolumeClaim (PVC)**:
- 📋 Request for storage
- 📦 Namespace-scoped
- 👤 Used by pods

**StorageClass**:
- 🏭 Dynamic provisioning
- ⚙️ Storage parameters
- 🔄 Automatic PV creation

---

## 📁 Volumes vs Persistent Volumes

### EmptyDir (Temporary)

**Exists as long as pod exists**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-emptydir
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:
    - name: cache
      mountPath: /cache
  
  volumes:
  - name: cache
    emptyDir: {}
```

**Data lost** when pod deleted.

---

### HostPath (Node Storage)

**Uses node filesystem**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-hostpath
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /data
  
  volumes:
  - name: data
    hostPath:
      path: /mnt/data
      type: DirectoryOrCreate
```

**Issues**:
- ❌ Not portable (tied to specific node)
- ❌ Node failure = data loss
- ❌ Pod rescheduled to different node = no data

---

### PersistentVolume (Proper Solution)

**Portable, survives pod deletion**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pv
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /data
  
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: my-pvc
```

✅ **Data persists** across pod restarts  
✅ **Portable** between nodes  
✅ **Managed** lifecycle

---

## 🗄️ PersistentVolumes (PV)

### Manual PV Creation

**Local storage PV** - `pv-local.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-local-1
spec:
  capacity:
    storage: 10Gi
  
  accessModes:
  - ReadWriteOnce
  
  persistentVolumeReclaimPolicy: Retain
  
  storageClassName: local-storage
  
  local:
    path: /mnt/disks/vol1
  
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - worker-1
```

**Create**:
```bash
# Prepare directory on worker-1
ssh worker-1 'sudo mkdir -p /mnt/disks/vol1'

# Create PV
k0s kubectl apply -f pv-local.yaml

# Check
k0s kubectl get pv
# NAME         CAPACITY   ACCESS MODES   STATUS      STORAGECLASS
# pv-local-1   10Gi       RWO            Available   local-storage
```

---

### Access Modes

**ReadWriteOnce (RWO)**:
- 📝 Read-write by single node
- 💾 Most common (databases, apps)

**ReadOnlyMany (ROX)**:
- 📖 Read-only by multiple nodes
- 📚 Static content, shared configs

**ReadWriteMany (RWX)**:
- 📝 Read-write by multiple nodes
- 🔄 Requires network storage (NFS, CephFS)

---

### Reclaim Policies

**Retain**:
- 🔒 Data kept after claim deleted
- 🔧 Manual cleanup required
- 🛡️ Safest for production

**Delete**:
- 🗑️ Data deleted with claim
- 🔄 Used with dynamic provisioning

**Recycle** (deprecated):
- ♻️ Basic scrub (`rm -rf`)
- ⚠️ Don't use

---

## 📋 PersistentVolumeClaims (PVC)

### Creating PVC

**Request storage** - `pvc-app.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
  namespace: default
spec:
  accessModes:
  - ReadWriteOnce
  
  resources:
    requests:
      storage: 5Gi
  
  storageClassName: local-storage
```

**Create**:
```bash
k0s kubectl apply -f pvc-app.yaml

# Check status
k0s kubectl get pvc
# NAME       STATUS   VOLUME       CAPACITY   ACCESS MODES
# app-data   Bound    pv-local-1   10Gi       RWO

# Bound to pv-local-1!
```

---

### Using PVC in Pod

**Mount in pod** - `pod-with-pvc.yaml`:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html
  
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: app-data
```

**Test persistence**:
```bash
# Create pod
k0s kubectl apply -f pod-with-pvc.yaml

# Write data
k0s kubectl exec app -- sh -c "echo 'Hello from PVC' > /usr/share/nginx/html/index.html"

# Delete pod
k0s kubectl delete pod app

# Recreate
k0s kubectl apply -f pod-with-pvc.yaml

# Check data still there
k0s kubectl exec app -- cat /usr/share/nginx/html/index.html
# Output: Hello from PVC
```

✅ **Data persists!**

---

## 🏭 StorageClasses

### What are StorageClasses?

**Dynamic provisioning** - automatic PV creation.

**Benefits**:
- 🔄 No manual PV creation
- 📈 Scalable
- 🎯 Different storage tiers (fast SSD, cheap HDD)

---

### Local Path Provisioner

**Install local-path provisioner**:
```bash
k0s kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml
```

**Check StorageClass**:
```bash
k0s kubectl get storageclass
# NAME         PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE
# local-path   rancher.io/local-path   Delete          WaitForFirstConsumer
```

---

### Using StorageClass

**PVC with StorageClass** - `pvc-dynamic.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data-dynamic
spec:
  accessModes:
  - ReadWriteOnce
  
  storageClassName: local-path
  
  resources:
    requests:
      storage: 5Gi
```

**Create**:
```bash
k0s kubectl apply -f pvc-dynamic.yaml

# Check - STATUS is Pending (WaitForFirstConsumer)
k0s kubectl get pvc
# NAME               STATUS    VOLUME   CAPACITY
# app-data-dynamic   Pending            
```

**Create pod to trigger provisioning**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-dynamic
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /data
  
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: app-data-dynamic
```

**Now PV is created automatically**:
```bash
k0s kubectl get pvc
# NAME               STATUS   VOLUME                                     CAPACITY
# app-data-dynamic   Bound    pvc-abc123-def4-5678-90ab-cdef12345678    5Gi

k0s kubectl get pv
# NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM
# pvc-abc123-def4-5678-90ab-cdef12345678    5Gi        RWO            Delete           Bound    default/app-data-dynamic
```

---

### Custom StorageClass

**Define storage tiers**:
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: rancher.io/local-path
parameters:
  path: /mnt/fast-ssd
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: slow-hdd
provisioner: rancher.io/local-path
parameters:
  path: /mnt/slow-hdd
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

**Use**:
```yaml
# Database - fast SSD
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-data
spec:
  storageClassName: fast-ssd
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
# Logs - cheap HDD
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: log-data
spec:
  storageClassName: slow-hdd
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 200Gi
```

---

## 🔄 StatefulSets

### What are StatefulSets?

**For stateful applications**:
- 🔢 Stable, unique network identifiers
- 💾 Persistent storage per pod
- 📊 Ordered deployment and scaling
- 🔄 Ordered, automated rolling updates

**Use cases**:
- Databases (PostgreSQL, MySQL, MongoDB)
- Message queues (Kafka, RabbitMQ)
- Distributed systems (Elasticsearch, Cassandra)

---

### StatefulSet vs Deployment

**Deployment**:
- Pod names: `web-abc123`, `web-def456` (random)
- No guaranteed order
- Shared storage

**StatefulSet**:
- Pod names: `web-0`, `web-1`, `web-2` (predictable)
- Ordered creation: `web-0` → `web-1` → `web-2`
- Individual storage per pod

---

### PostgreSQL StatefulSet

**Complete example** - `postgres-statefulset.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  ports:
  - port: 5432
    name: postgres
  clusterIP: None  # Headless service
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  
  selector:
    matchLabels:
      app: postgres
  
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
          name: postgres
        
        env:
        - name: POSTGRES_PASSWORD
          value: secretpassword
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  
  # Volume claim template - creates PVC per pod
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes:
      - ReadWriteOnce
      storageClassName: local-path
      resources:
        requests:
          storage: 10Gi
```

**Deploy**:
```bash
k0s kubectl apply -f postgres-statefulset.yaml

# Watch creation (ordered)
k0s kubectl get pods -l app=postgres -w
# NAME         READY   STATUS
# postgres-0   0/1     Pending
# postgres-0   1/1     Running
# postgres-1   0/1     Pending
# postgres-1   1/1     Running
# postgres-2   0/1     Pending
# postgres-2   1/1     Running

# Check PVCs (one per pod)
k0s kubectl get pvc
# NAME              STATUS   VOLUME                                     CAPACITY
# data-postgres-0   Bound    pvc-abc123-def4-5678-90ab-cdef12345678    10Gi
# data-postgres-1   Bound    pvc-def456-abc1-2345-6789-0abcdef12345    10Gi
# data-postgres-2   Bound    pvc-789012-345a-bcde-f123-456789abcdef    10Gi
```

---

### Headless Service

**For StatefulSets** - `clusterIP: None`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None  # Headless
  selector:
    app: postgres
  ports:
  - port: 5432
```

**DNS records for each pod**:
```
postgres-0.postgres.default.svc.cluster.local
postgres-1.postgres.default.svc.cluster.local
postgres-2.postgres.default.svc.cluster.local
```

**Use**:
```bash
# Connect to specific pod
psql -h postgres-0.postgres.default.svc.cluster.local -U postgres
```

---

### Scaling StatefulSets

**Scale up** (ordered):
```bash
k0s kubectl scale statefulset postgres --replicas=5

# Creates: postgres-3, then postgres-4
```

**Scale down** (reverse order):
```bash
k0s kubectl scale statefulset postgres --replicas=2

# Deletes: postgres-4, then postgres-3
```

**PVCs remain** after scaling down:
```bash
k0s kubectl get pvc
# data-postgres-0   Bound
# data-postgres-1   Bound
# data-postgres-2   Bound  # Still here!
# data-postgres-3   Bound  # Still here!
# data-postgres-4   Bound  # Still here!
```

**Manual cleanup**:
```bash
k0s kubectl delete pvc data-postgres-3 data-postgres-4
```

---

## 🌐 NFS Storage

### Setup NFS Server

**On NFS server** (e.g., `nfs-server.local`):
```bash
# Install NFS
sudo apt update
sudo apt install -y nfs-kernel-server

# Create export directory
sudo mkdir -p /export/k8s

# Set permissions
sudo chown nobody:nogroup /export/k8s
sudo chmod 777 /export/k8s

# Configure export
echo '/export/k8s *(rw,sync,no_subtree_check,no_root_squash)' | sudo tee -a /etc/exports

# Apply
sudo exportfs -a
sudo systemctl restart nfs-kernel-server
```

---

### NFS Client on Workers

**Install NFS client** on all worker nodes:
```bash
# Ubuntu/Debian
sudo apt install -y nfs-common

# RHEL/CentOS
sudo dnf install -y nfs-utils
```

**Test mount**:
```bash
sudo mount -t nfs nfs-server.local:/export/k8s /mnt/test
```

---

### NFS PersistentVolume

**Create NFS PV** - `pv-nfs.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-1
spec:
  capacity:
    storage: 100Gi
  
  accessModes:
  - ReadWriteMany  # Multiple pods can write
  
  persistentVolumeReclaimPolicy: Retain
  
  nfs:
    server: nfs-server.local
    path: /export/k8s/vol1
```

**Create PVC**:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-storage
spec:
  accessModes:
  - ReadWriteMany
  
  resources:
    requests:
      storage: 50Gi
```

---

### Shared Storage Example

**Multiple pods writing** - `shared-app.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shared-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shared
  template:
    metadata:
      labels:
        app: shared
    spec:
      containers:
      - name: writer
        image: busybox
        command:
        - sh
        - -c
        - |
          while true; do
            echo "$(hostname) - $(date)" >> /shared/log.txt
            sleep 5
          done
        volumeMounts:
        - name: shared
          mountPath: /shared
      
      volumes:
      - name: shared
        persistentVolumeClaim:
          claimName: shared-storage
```

**All pods write to same file**:
```bash
k0s kubectl exec -it shared-app-abc123 -- tail -f /shared/log.txt
# shared-app-abc123 - Thu Jan 30 10:00:00 UTC 2026
# shared-app-def456 - Thu Jan 30 10:00:01 UTC 2026
# shared-app-ghi789 - Thu Jan 30 10:00:02 UTC 2026
```

---

## 💾 Volume Snapshots

### VolumeSnapshotClass

**Define snapshot class**:
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: local-snapshots
driver: rancher.io/local-path
deletionPolicy: Delete
```

---

### Create Snapshot

**Take snapshot** - `snapshot.yaml`:
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: db-snapshot-20260130
spec:
  volumeSnapshotClassName: local-snapshots
  source:
    persistentVolumeClaimName: db-data
```

**Create**:
```bash
k0s kubectl apply -f snapshot.yaml

# Check
k0s kubectl get volumesnapshot
# NAME                   READYTOUSE   SOURCEPVC   RESTORESIZE   AGE
# db-snapshot-20260130   true         db-data     10Gi          5s
```

---

### Restore from Snapshot

**Create PVC from snapshot**:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-data-restored
spec:
  accessModes:
  - ReadWriteOnce
  
  storageClassName: local-path
  
  dataSource:
    name: db-snapshot-20260130
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  
  resources:
    requests:
      storage: 10Gi
```

---

## 🔍 Troubleshooting

### PVC Stuck Pending

**Check PVC status**:
```bash
k0s kubectl describe pvc app-data

# Events:
# Warning  ProvisioningFailed  No PersistentVolumes available
```

**Causes**:
1. **No matching PV**: Create PV or use StorageClass
2. **Wrong StorageClass**: Check `storageClassName` matches
3. **Size too large**: PV has 5Gi, request 10Gi
4. **Access mode mismatch**: PV is RWO, claim wants RWX

---

### Pod Can't Mount Volume

**Check pod events**:
```bash
k0s kubectl describe pod app

# Events:
# Warning  FailedMount  MountVolume.SetUp failed: mount failed
```

**Common causes**:
1. **Node affinity**: PV has nodeAffinity, pod on wrong node
2. **NFS not installed**: Install `nfs-common` on node
3. **Path doesn't exist**: Create directory on node
4. **Permissions**: Check directory permissions

---

### Data Not Persisting

**Check mount path**:
```bash
# Inside pod
k0s kubectl exec app -- df -h
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        10G  1.5G  8.5G  15% /data  # ✅ Correct

# If shows overlay or tmpfs = not using PVC
```

**Verify PVC bound**:
```bash
k0s kubectl get pvc
# NAME       STATUS   VOLUME
# app-data   Bound    pv-local-1  # ✅ Good

# If Pending or Lost = problem
```

---

### StatefulSet Pod Stuck

**Pod waiting for volume**:
```bash
k0s kubectl describe pod postgres-1

# Events:
# Warning  FailedScheduling  pod has unbound PersistentVolumeClaims
```

**Check**:
```bash
# PVC exists?
k0s kubectl get pvc data-postgres-1

# StorageClass exists?
k0s kubectl get storageclass

# Provisioner running?
k0s kubectl get pods -n kube-system | grep provisioner
```

---

## 💡 Best Practices

### 1. Use StorageClasses

```yaml
# Good: Dynamic provisioning
spec:
  storageClassName: local-path
  resources:
    requests:
      storage: 10Gi

# Avoid: Manual PV creation for each claim
```

---

### 2. Set Reclaim Policy

```yaml
# Production databases: Retain
apiVersion: v1
kind: PersistentVolume
metadata:
  name: db-pv
spec:
  persistentVolumeReclaimPolicy: Retain
  # ...

# Temporary data: Delete
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: temp-storage
reclaimPolicy: Delete
```

---

### 3. Use Appropriate Access Modes

```yaml
# Single database: RWO
spec:
  accessModes:
  - ReadWriteOnce

# Shared files (NFS): RWX
spec:
  accessModes:
  - ReadWriteMany

# Static content: ROX
spec:
  accessModes:
  - ReadOnlyMany
```

---

### 4. StatefulSets for Databases

```yaml
# Good: StatefulSet with volumeClaimTemplates
kind: StatefulSet
spec:
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 10Gi

# Bad: Deployment with shared PVC
kind: Deployment  # ❌ For database
```

---

### 5. Backup Important Data

```bash
# Regular snapshots
k0s kubectl apply -f db-snapshot.yaml

# Or manual backup
k0s kubectl exec postgres-0 -- pg_dump mydb > backup.sql
```

---

### 6. Monitor Storage Usage

```bash
# Pod storage usage
k0s kubectl exec app -- df -h /data

# PVC capacity
k0s kubectl get pvc -o custom-columns=NAME:.metadata.name,CAPACITY:.status.capacity.storage
```

---

## 🔗 What's Next?

**Helm**:
- **[k0s-helm](k0s-helm)** - Package management

**Ingress**:
- **[k0s-ingress](k0s-ingress)** - HTTP routing

**Monitoring**:
- **[k0s-monitoring](k0s-monitoring)** - Prometheus and Grafana

---

## 📚 Resources

**Kubernetes Storage**:
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

**Provisioners**:
- [Local Path Provisioner](https://github.com/rancher/local-path-provisioner)
- [NFS Subdir Provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner)

---

## 📝 Change Log

### 2026-01-30
- Created storage guide
- Explained storage concepts
- Covered PV and PVC
- Demonstrated StorageClasses
- Explained StatefulSets
- Showed NFS setup
- Added volume snapshots
- Included troubleshooting

---

**Next Article**: [k0s-helm](k0s-helm) - Kubernetes package manager!
