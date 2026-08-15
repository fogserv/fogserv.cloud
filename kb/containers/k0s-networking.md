# k0s Networking - CNI and Network Policies

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Kubernetes  
**Prerequisites**: [k0s-introduction](k0s-introduction), [k0s-multi-node](k0s-multi-node)  
**Time**: 3-4 hours  
**Tags**: k0s, kubernetes, networking, calico, cni, network-policies

## Summary

Master Kubernetes networking in k0s with Calico CNI, service types, DNS resolution, network policies for security, and troubleshooting connectivity. Learn pod-to-pod, pod-to-service, and external communication patterns.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Kubernetes networking model
- ✅ Configure Calico CNI
- ✅ Use all service types
- ✅ Implement network policies
- ✅ Configure DNS resolution
- ✅ Troubleshoot connectivity
- ✅ Expose applications externally

## 🌐 Kubernetes Networking Model

### The Three Rules

**1. Pod-to-Pod**: All pods can communicate without NAT
**2. Node-to-Pod**: Nodes can reach all pods without NAT
**3. Pod IP**: Pod sees same IP as others see it (no NAT)

```
┌─────────────────────────────────────────────────┐
│              Cluster Network                    │
│                                                 │
│  ┌──────────┐        ┌──────────┐              │
│  │  Node 1  │        │  Node 2  │              │
│  │          │        │          │              │
│  │  Pod A   │───────▶│  Pod B   │              │
│  │10.244.1.5│  CNI   │10.244.2.7│              │
│  └──────────┘        └──────────┘              │
│                                                 │
│  Direct communication, no NAT                   │
└─────────────────────────────────────────────────┘
```

---

## 🔌 CNI (Container Network Interface)

### What is CNI?

**CNI** plugins handle:
- 📡 IP address allocation
- 🔗 Network connectivity
- 🛣️ Routing between nodes
- 🔐 Network policies

**k0s default**: Calico

---

### Calico Architecture

```
┌─────────────────────────────────────────────────┐
│                  Calico                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Felix (Agent)          BGP Router              │
│  - Network rules        - Route exchange        │
│  - iptables             - IP pools              │
│  - Routes                                       │
│                                                 │
│  IPAM (IP Address Management)                   │
│  - Assign pod IPs                               │
│  - Manage pools                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### k0s Network Configuration

**Default config** (`k0s config create`):
```yaml
spec:
  network:
    provider: calico
    calico:
      mode: vxlan          # or ipip, bird
      vxlanPort: 4789
      vxlanVNI: 4096
      mtu: 1450
      wireguard: false     # Enable for encryption
      flexVolumeDriverPath: /usr/libexec/k0s/kubelet-plugins/volume/exec/nodeagent~uds
      
    podCIDR: 10.244.0.0/16      # Pod IP range
    serviceCIDR: 10.96.0.0/12   # Service IP range
    
    kubeProxy:
      mode: iptables        # or ipvs
      metricsBindAddress: 0.0.0.0:10249
```

---

### Custom Network Configuration

**/etc/k0s/k0s.yaml**:
```yaml
apiVersion: k0s.k0sproject.io/v1beta1
kind: ClusterConfig
metadata:
  name: k0s
spec:
  network:
    provider: calico
    calico:
      mode: vxlan
      mtu: 1450
      wireguard: true      # Enable WireGuard encryption
    
    # Custom IP ranges
    podCIDR: 192.168.0.0/16
    serviceCIDR: 10.0.0.0/16
    
    # NodePort range
    nodePortRange: 30000-32767
    
    kubeProxy:
      mode: iptables
```

**Apply**:
```bash
sudo k0s install controller --config /etc/k0s/k0s.yaml
sudo k0s start
```

---

## 🎯 Service Types

### ClusterIP (Default)

**Internal only** - accessible within cluster:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - port: 8080        # Service port
    targetPort: 8080  # Container port
```

**Access**:
```bash
# From another pod
curl http://backend.default.svc.cluster.local:8080

# Port-forward for testing
k0s kubectl port-forward svc/backend 8080:8080
```

---

### NodePort

**External access** via node IP + port:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: NodePort
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080   # Optional, auto-assigned if omitted (30000-32767)
```

**Access**:
```bash
# From outside cluster
curl http://<node-ip>:30080

# Get node IP
k0s kubectl get nodes -o wide
```

**Architecture**:
```
External Client
      │
      ▼
   NodePort :30080
      │
      ├──▶ Pod 1:8080
      ├──▶ Pod 2:8080
      └──▶ Pod 3:8080
```

---

### LoadBalancer

**Cloud provider** load balancer (AWS ELB, Azure LB):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
```

**Note**: Requires cloud controller or MetalLB for bare-metal.

---

### MetalLB for Bare-Metal

**Install MetalLB**:
```bash
# Create namespace
k0s kubectl create namespace metallb-system

# Install
k0s kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml
```

**Configure IP pool** - `metallb-config.yaml`:
```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: production
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.100-192.168.1.110
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: production
  namespace: metallb-system
spec:
  ipAddressPools:
  - production
```

**Apply**:
```bash
k0s kubectl apply -f metallb-config.yaml
```

**Use LoadBalancer**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
```

**Get external IP**:
```bash
k0s kubectl get svc web
# NAME   TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)
# web    LoadBalancer   10.96.123.45    192.168.1.100    80:30123/TCP
```

---

### ExternalName

**DNS alias** to external service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: db.example.com
```

**Use**:
```bash
# Pods can use
mysql -h external-db.default.svc.cluster.local
# Resolves to db.example.com
```

---

## 🔍 DNS Resolution

### CoreDNS

**k0s includes CoreDNS** for service discovery.

**DNS format**:
```
<service>.<namespace>.svc.cluster.local
```

**Examples**:
```bash
# Same namespace
curl http://backend:8080

# Different namespace
curl http://backend.production.svc.cluster.local:8080

# Short form (same namespace)
curl http://backend

# Full form
curl http://backend.production.svc.cluster.local
```

---

### Pod DNS

**Pods get DNS names**:
```
<pod-ip-with-dashes>.<namespace>.pod.cluster.local
```

**Example**:
```bash
# Pod IP: 10.244.1.5
# DNS: 10-244-1-5.default.pod.cluster.local
```

---

### Custom DNS

**Add to pod**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: custom-dns
spec:
  dnsPolicy: "None"
  dnsConfig:
    nameservers:
    - 8.8.8.8
    - 8.8.4.4
    searches:
    - example.com
    - internal.example.com
    options:
    - name: ndots
      value: "2"
  
  containers:
  - name: app
    image: nginx
```

---

## 🛡️ Network Policies

### What are Network Policies?

**Firewall rules** for pods:
- 🚫 Deny by default
- ✅ Allow specific traffic
- 📥 Ingress (incoming)
- 📤 Egress (outgoing)

**Note**: Requires CNI support (Calico ✅)

---

### Default Deny All

**Deny all ingress** - `deny-all.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}  # All pods in namespace
  policyTypes:
  - Ingress
  # No ingress rules = deny all
```

**Deny all egress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Egress
  # No egress rules = deny all
```

---

### Allow Specific Traffic

**Allow frontend → backend** - `allow-frontend-backend.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  
  policyTypes:
  - Ingress
  
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

**Explanation**:
- Apply to pods with `app: backend`
- Allow ingress from pods with `app: frontend`
- Only port 8080/TCP

---

### Allow from Namespace

**Allow all pods from monitoring namespace**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring
  namespace: production
spec:
  podSelector: {}
  
  policyTypes:
  - Ingress
  
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090  # Prometheus scrape
```

---

### Egress Rules

**Allow backend → database**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  
  policyTypes:
  - Egress
  
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  
  # Allow DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

---

### Allow External Access

**Allow egress to internet**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  
  policyTypes:
  - Egress
  
  egress:
  # Allow to external IPs
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8      # Block private
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - protocol: TCP
      port: 443
```

---

### Complete Example: 3-Tier App

**Architecture**:
```
Internet
   │
   ▼
Frontend ──▶ Backend ──▶ Database
```

**1. Deploy apps**:
```yaml
# Frontend
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
      tier: web
  template:
    metadata:
      labels:
        app: frontend
        tier: web
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
---
# Backend
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
      tier: api
  template:
    metadata:
      labels:
        app: backend
        tier: api
    spec:
      containers:
      - name: api
        image: myapi:latest
        ports:
        - containerPort: 8080
---
# Database
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
      tier: db
  template:
    metadata:
      labels:
        app: postgres
        tier: db
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
```

**2. Network policies**:
```yaml
# Deny all by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
# Allow frontend from internet
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-ingress
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: web
  policyTypes:
  - Ingress
  ingress:
  - from:
    - ipBlock:
        cidr: 0.0.0.0/0
    ports:
    - protocol: TCP
      port: 80
---
# Allow frontend → backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: web
    ports:
    - protocol: TCP
      port: 8080
---
# Allow backend → database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: api
    ports:
    - protocol: TCP
      port: 5432
---
# Allow egress for frontend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: web
  policyTypes:
  - Egress
  egress:
  # To backend
  - to:
    - podSelector:
        matchLabels:
          tier: api
    ports:
    - protocol: TCP
      port: 8080
  # DNS
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
---
# Allow egress for backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes:
  - Egress
  egress:
  # To database
  - to:
    - podSelector:
        matchLabels:
          tier: db
    ports:
    - protocol: TCP
      port: 5432
  # DNS
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

---

## 🔧 Network Troubleshooting

### Debug Tools Pod

**Deploy debug container**:
```bash
k0s kubectl run debug \
  --image=nicolaka/netshoot \
  --rm -it \
  -- /bin/bash
```

**Inside debug pod**:
```bash
# Test DNS
nslookup backend.production.svc.cluster.local

# Test connectivity
curl http://backend.production.svc.cluster.local:8080

# Check routes
ip route

# Test external
curl -I https://google.com

# Check network policies
# (if blocked, curl will timeout)
```

---

### DNS Issues

**Check CoreDNS**:
```bash
# CoreDNS pods
k0s kubectl get pods -n kube-system -l k8s-app=kube-dns

# Logs
k0s kubectl logs -n kube-system -l k8s-app=kube-dns

# Test DNS from pod
k0s kubectl run -it --rm debug \
  --image=busybox \
  -- nslookup kubernetes.default
```

---

### Service Not Accessible

**Check service**:
```bash
# Service exists?
k0s kubectl get svc backend

# Endpoints exist?
k0s kubectl get endpoints backend

# Should show pod IPs
# NAME      ENDPOINTS
# backend   10.244.1.5:8080,10.244.2.7:8080
```

**No endpoints** = selector doesn't match pods:
```bash
# Check selector
k0s kubectl describe svc backend | grep Selector

# Check pod labels
k0s kubectl get pods --show-labels
```

---

### Network Policy Issues

**Check policies**:
```bash
# List policies
k0s kubectl get networkpolicies -A

# Describe policy
k0s kubectl describe networkpolicy allow-frontend-to-backend
```

**Test connectivity**:
```bash
# From frontend pod
k0s kubectl exec -it frontend-abc123 -- curl http://backend:8080

# If fails, check:
# 1. Policy exists?
# 2. Labels match?
# 3. Ports correct?
# 4. DNS working?
```

---

### Calico Troubleshooting

**Check Calico pods**:
```bash
k0s kubectl get pods -n kube-system | grep calico

# Should see:
# calico-kube-controllers
# calico-node (DaemonSet on each node)
```

**Calico node logs**:
```bash
k0s kubectl logs -n kube-system -l k8s-app=calico-node
```

**Check node status**:
```bash
# Install calicoctl
curl -L https://github.com/projectcalico/calico/releases/download/v3.27.0/calicoctl-linux-amd64 -o calicoctl
chmod +x calicoctl
sudo mv calicoctl /usr/local/bin/

# Configure
export DATASTORE_TYPE=kubernetes
export KUBECONFIG=/var/lib/k0s/pki/admin.conf

# Check node status
calicoctl node status

# Check IP pools
calicoctl get ippool -o wide
```

---

## 📊 Network Monitoring

### Check Pod IPs

```bash
k0s kubectl get pods -o wide

# NAME        READY   STATUS    RESTARTS   IP
# frontend-1  1/1     Running   0          10.244.1.5
# backend-1   1/1     Running   0          10.244.2.7
```

---

### Service Endpoints

```bash
k0s kubectl get endpoints

# NAME       ENDPOINTS                         AGE
# backend    10.244.1.5:8080,10.244.2.7:8080  5m
```

---

### Network Policy Stats

**Calico policy stats**:
```bash
# View policy order
calicoctl get networkpolicy -o yaml

# View global network policy
calicoctl get globalnetworkpolicy
```

---

## 💡 Best Practices

### 1. Use Network Policies

```bash
# Start with deny-all
k0s kubectl apply -f deny-all.yaml

# Add specific allows
k0s kubectl apply -f allow-frontend-backend.yaml
```

---

### 2. Label Consistently

```yaml
# Good: Clear labels
labels:
  app: backend
  tier: api
  version: v2

# Bad: Vague
labels:
  name: thing
```

---

### 3. Always Allow DNS

```yaml
# Include in egress rules
egress:
- to:
  - namespaceSelector: {}
    podSelector:
      matchLabels:
        k8s-app: kube-dns
  ports:
  - protocol: UDP
    port: 53
```

---

### 4. Test Incrementally

```bash
# 1. Deploy app
k0s kubectl apply -f app.yaml

# 2. Test without policies
curl http://frontend:80

# 3. Apply deny-all
k0s kubectl apply -f deny-all.yaml

# 4. Verify blocked
curl http://frontend:80  # Should timeout

# 5. Add specific allow
k0s kubectl apply -f allow-frontend.yaml

# 6. Verify works
curl http://frontend:80  # Should work
```

---

### 5. Use ClusterIP for Internal

```yaml
# Internal services: ClusterIP
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP  # Default
  selector:
    app: backend
  ports:
  - port: 8080
```

---

### 6. Document Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  annotations:
    description: "Allows frontend pods to access backend API"
    owner: "platform-team"
spec:
  # ...
```

---

## 🔗 What's Next?

**Storage**:
- **[k0s-storage](k0s-storage)** - Persistent volumes

**Ingress**:
- **[k0s-ingress](k0s-ingress)** - HTTP routing with Traefik

**Service Mesh**:
- **[service-mesh-linkerd](service-mesh-linkerd)** - mTLS and observability

---

## 📚 Resources

**Calico**:
- [Calico Documentation](https://docs.tigera.io/calico/latest/about/)
- [Network Policy Guide](https://docs.tigera.io/calico/latest/network-policy/get-started/)

**Kubernetes Networking**:
- [Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [DNS](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)

---

## 📝 Change Log

### 2026-01-30
- Created networking guide
- Explained Kubernetes networking model
- Covered Calico CNI configuration
- Demonstrated all service types
- Explained DNS resolution
- Comprehensive network policies
- Added troubleshooting guide
- Included monitoring techniques

---

**Next Article**: [k0s-storage](k0s-storage) - Persistent storage for stateful apps!
