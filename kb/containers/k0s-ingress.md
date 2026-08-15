# K0s Ingress - HTTP Routing and Load Balancing

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Kubernetes Networking  
**Prerequisites**: [k0s-networking](k0s-networking), [k0s-helm](k0s-helm)  
**Time**: 2-3 hours  
**Tags**: k0s, kubernetes, ingress, traefik, routing, load-balancing

## Summary

Expose HTTP/HTTPS services to external users with Kubernetes Ingress. Learn Traefik ingress controller installation, path-based routing, host-based routing, SSL/TLS termination, and production patterns.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Kubernetes Ingress concepts
- ✅ Install Traefik ingress controller
- ✅ Create Ingress resources
- ✅ Configure path-based routing
- ✅ Set up host-based routing
- ✅ Enable SSL/TLS with Let's Encrypt
- ✅ Implement basic authentication
- ✅ Troubleshoot ingress issues

## 🌐 What is Ingress?

### The Problem

**Without Ingress**:
```yaml
# Each service needs NodePort or LoadBalancer
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  type: NodePort  # Exposes on random port 30000-32767
  ports:
    - port: 80
      nodePort: 30080
---
# Another service
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: NodePort
  ports:
    - port: 80
      nodePort: 30081
```

**Issues**:
- 🔢 Weird ports (30080, 30081, etc.)
- 🌐 No hostname routing
- 🔒 No SSL termination
- 💰 Multiple LoadBalancers expensive
- 📍 Users must remember ports

---

### The Solution: Ingress

**Ingress** provides HTTP routing:
- 🌐 Single entry point (port 80/443)
- 🏷️ Host-based routing (`api.example.com` → api service)
- 📂 Path-based routing (`example.com/api` → api service)
- 🔒 SSL/TLS termination
- ⚖️ Load balancing

---

### Architecture

```
Internet
   ↓
Ingress Controller (Traefik/NGINX)
   ↓
Ingress Rules
   ↓
┌─────────────┬─────────────┬─────────────┐
│ Service A   │ Service B   │ Service C   │
│ (ClusterIP) │ (ClusterIP) │ (ClusterIP) │
└─────────────┴─────────────┴─────────────┘
```

**Ingress Controller** = Implementation (Traefik, NGINX, HAProxy)  
**Ingress** = Configuration (routing rules)

---

## 📦 Installing Traefik

### Why Traefik?

- 🚀 Kubernetes-native
- 🔄 Automatic service discovery
- 🔒 Let's Encrypt built-in
- 📊 Dashboard included
- 🎯 Simple configuration

---

### Install with Helm

```bash
# Add repository
helm repo add traefik https://traefik.github.io/charts
helm repo update

# Install Traefik
helm install traefik traefik/traefik \
  --namespace traefik \
  --create-namespace \
  --set dashboard.enabled=true \
  --set dashboard.domain=traefik.local

# Check installation
kubectl get pods -n traefik

# Output:
# NAME                      READY   STATUS    RESTARTS   AGE
# traefik-7d6b9c5d5-8xz2k   1/1     Running   0          30s
```

---

### Check Service

```bash
kubectl get svc -n traefik

# Output:
# NAME      TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)
# traefik   LoadBalancer   10.96.58.123   <pending>     80:32080/TCP,443:32443/TCP
```

**Note**: `<pending>` without MetalLB. Use NodePort instead.

---

### NodePort Configuration

**For bare-metal without LoadBalancer**:
```bash
# Install with NodePort
helm install traefik traefik/traefik \
  --namespace traefik \
  --create-namespace \
  --set service.type=NodePort \
  --set ports.web.nodePort=30080 \
  --set ports.websecure.nodePort=30443 \
  --set dashboard.enabled=true

# Check NodePort
kubectl get svc -n traefik

# Output:
# NAME      TYPE       CLUSTER-IP     PORT(S)
# traefik   NodePort   10.96.58.123   80:30080/TCP,443:30443/TCP
```

**Access**: `http://<node-ip>:30080`

---

### Traefik Dashboard

```bash
# Port-forward to dashboard
kubectl port-forward -n traefik svc/traefik 9000:9000

# Open browser: http://localhost:9000/dashboard/
```

---

## 🎯 Basic Ingress

### Simple Ingress

**Deploy application**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx-demo
  template:
    metadata:
      labels:
        app: nginx-demo
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-demo
spec:
  type: ClusterIP  # Note: ClusterIP, not NodePort
  ports:
    - port: 80
      targetPort: 80
  selector:
    app: nginx-demo
```

---

**Create Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-demo
spec:
  rules:
  - host: nginx.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-demo
            port:
              number: 80
```

```bash
kubectl apply -f nginx-demo.yaml
kubectl apply -f ingress.yaml

# Check Ingress
kubectl get ingress

# Output:
# NAME         CLASS     HOSTS         ADDRESS        PORTS   AGE
# nginx-demo   traefik   nginx.local   10.0.1.10      80      30s
```

---

### Test Ingress

```bash
# Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts)
echo "10.0.1.10 nginx.local" | sudo tee -a /etc/hosts

# Test (with NodePort)
curl http://nginx.local:30080

# Output: Welcome to nginx!
```

---

## 📂 Path-Based Routing

### Multiple Paths to Same Service

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-path
spec:
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
      
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-api
            port:
              number: 8080
      
      - path: /admin
        pathType: Prefix
        backend:
          service:
            name: admin-panel
            port:
              number: 3000
```

**Routing**:
- `myapp.local/` → frontend:80
- `myapp.local/api` → backend-api:8080
- `myapp.local/admin` → admin-panel:3000

---

### Path Types

**Prefix**:
```yaml
path: /api
pathType: Prefix
# Matches: /api, /api/, /api/users, /api/users/123
```

**Exact**:
```yaml
path: /api
pathType: Exact
# Matches: /api only (not /api/ or /api/users)
```

**ImplementationSpecific**:
```yaml
path: /api
pathType: ImplementationSpecific
# Behavior depends on ingress controller
```

---

### Strip Path Prefix

**Traefik**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    traefik.ingress.kubernetes.io/router.middlewares: default-strip-api@kubernetescrd
spec:
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
---
# Middleware to strip /api prefix
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: strip-api
spec:
  stripPrefix:
    prefixes:
      - /api
```

**Result**: Request to `/api/users` → backend receives `/users`

---

## 🏷️ Host-Based Routing

### Multiple Hosts

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-host
spec:
  rules:
  - host: web.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
  
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
  
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 3000
```

**Routing**:
- `web.example.com` → web-service:80
- `api.example.com` → api-service:8080
- `admin.example.com` → admin-service:3000

---

### Wildcard Hosts

**Not directly supported**, but can use default backend:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: default-backend
spec:
  defaultBackend:
    service:
      name: default-service
      port:
        number: 80
```

**Catches all** unmatched hosts.

---

## 🔒 SSL/TLS Configuration

### Manual Certificate

**Create secret**:
```bash
kubectl create secret tls myapp-tls \
  --cert=myapp.crt \
  --key=myapp.key
```

**Use in Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-tls
spec:
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

---

### Let's Encrypt with Cert-Manager

**Install cert-manager**:
```bash
# Add repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Verify
kubectl get pods -n cert-manager
```

---

**Create ClusterIssuer**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
```

```bash
kubectl apply -f clusterissuer.yaml
```

---

**Use in Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-letsencrypt
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls  # Created automatically by cert-manager
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

**Cert-manager will**:
1. Create certificate request
2. Complete ACME challenge
3. Get certificate from Let's Encrypt
4. Store in secret `myapp-tls`
5. Auto-renew before expiry

---

### Check Certificate

```bash
# Check certificate request
kubectl get certificaterequest

# Check certificate
kubectl get certificate

# Output:
# NAME        READY   SECRET      AGE
# myapp-tls   True    myapp-tls   5m

# View certificate details
kubectl describe certificate myapp-tls
```

---

## 🔐 Authentication

### Basic Authentication

**Create password file**:
```bash
# Install htpasswd
sudo apt-get install apache2-utils

# Create password (username: admin)
htpasswd -c auth admin
# Password: secret123

# Create secret
kubectl create secret generic basic-auth \
  --from-file=auth
```

---

**Use in Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: protected-app
  annotations:
    traefik.ingress.kubernetes.io/router.middlewares: default-basic-auth@kubernetescrd
spec:
  rules:
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: basic-auth
spec:
  basicAuth:
    secret: basic-auth
```

**Test**:
```bash
curl -u admin:secret123 https://admin.example.com
```

---

## 🎯 Complete Example - Multi-Service Application

### Application Stack

**Frontend**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  type: ClusterIP
  ports:
    - port: 80
  selector:
    app: frontend
```

---

**Backend API**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: api
        image: your-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          value: "postgresql://db:5432/myapp"
---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP
  ports:
    - port: 8080
  selector:
    app: backend
```

---

**Admin Panel**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: admin
  template:
    metadata:
      labels:
        app: admin
    spec:
      containers:
      - name: admin
        image: your-admin:latest
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: admin
spec:
  type: ClusterIP
  ports:
    - port: 3000
  selector:
    app: admin
```

---

### Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    traefik.ingress.kubernetes.io/router.middlewares: default-redirect-https@kubernetescrd
spec:
  tls:
  - hosts:
    - myapp.example.com
    - api.myapp.example.com
    - admin.myapp.example.com
    secretName: myapp-tls
  rules:
  # Frontend
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
  
  # Backend API
  - host: api.myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8080
  
  # Admin (with auth)
  - host: admin.myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin
            port:
              number: 3000
---
# HTTPS redirect middleware
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: redirect-https
spec:
  redirectScheme:
    scheme: https
    permanent: true
---
# Basic auth for admin
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: admin-auth
spec:
  basicAuth:
    secret: admin-credentials
```

---

### Deploy

```bash
# Deploy all services
kubectl apply -f frontend.yaml
kubectl apply -f backend.yaml
kubectl apply -f admin.yaml

# Create admin credentials
htpasswd -c auth admin
kubectl create secret generic admin-credentials --from-file=auth

# Deploy ingress
kubectl apply -f ingress.yaml

# Check
kubectl get ingress
kubectl get certificate
```

---

## 🔧 Advanced Features

### Rate Limiting

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
spec:
  rateLimit:
    average: 100  # 100 requests per second
    burst: 50     # Allow bursts up to 50
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    traefik.ingress.kubernetes.io/router.middlewares: default-rate-limit@kubernetescrd
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 8080
```

---

### Headers

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: security-headers
spec:
  headers:
    customResponseHeaders:
      X-Frame-Options: "SAMEORIGIN"
      X-Content-Type-Options: "nosniff"
      X-XSS-Protection: "1; mode=block"
      Strict-Transport-Security: "max-age=31536000"
    sslRedirect: true
```

---

### IP Whitelist

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: ip-whitelist
spec:
  ipWhiteList:
    sourceRange:
      - 10.0.0.0/8
      - 192.168.1.0/24
```

---

### Compression

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: compression
spec:
  compress: {}
```

---

## 🔍 Troubleshooting

### Ingress Not Working

**Check ingress controller**:
```bash
kubectl get pods -n traefik
kubectl logs -n traefik deployment/traefik
```

---

### 404 Not Found

**Check service exists**:
```bash
kubectl get svc
kubectl get endpoints <service-name>

# Endpoints should show pod IPs
# Output:
# NAME      ENDPOINTS             AGE
# myapp     10.244.1.5:80,...    5m
```

**Empty endpoints** = no pods matching selector.

---

### 503 Service Unavailable

**Check pods are running**:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

**Check service selector matches pod labels**:
```bash
kubectl get svc <service-name> -o yaml | grep selector
kubectl get pods --show-labels
```

---

### SSL Certificate Issues

**Check certificate**:
```bash
kubectl get certificate
kubectl describe certificate <cert-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

**Common issues**:
- DNS not pointing to ingress
- HTTP challenge blocked by firewall
- Email address invalid
- Rate limit (Let's Encrypt: 5 certs/week)

---

### Check Ingress Events

```bash
kubectl describe ingress <ingress-name>

# Output shows events:
# Events:
#   Type    Reason  Age   From                      Message
#   ----    ------  ----  ----                      -------
#   Normal  Sync    5m    nginx-ingress-controller  Scheduled for sync
```

---

### Test with curl

```bash
# Verbose output
curl -v http://myapp.local:30080

# Follow redirects
curl -L http://myapp.local:30080

# Ignore SSL errors (testing only)
curl -k https://myapp.local:30443

# Check specific host
curl -H "Host: myapp.local" http://10.0.1.10:30080
```

---

## 💡 Best Practices

### 1. Use ClusterIP Services

```yaml
# Good: ClusterIP with Ingress
apiVersion: v1
kind: Service
spec:
  type: ClusterIP  # Not NodePort or LoadBalancer
  ports:
    - port: 80
```

---

### 2. One Ingress Per Namespace

```yaml
# Good: Single ingress with multiple rules
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: namespace-ingress
spec:
  rules:
  - host: app1.example.com
    # ...
  - host: app2.example.com
    # ...
```

---

### 3. Always Use TLS

```yaml
# Good: TLS enabled
spec:
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
```

---

### 4. Set Resource Limits

```yaml
# Traefik deployment
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

---

### 5. Monitor Ingress

```bash
# Prometheus metrics endpoint
kubectl port-forward -n traefik svc/traefik 9000:9000
curl http://localhost:9000/metrics
```

---

## 🔗 What's Next?

**Monitoring**:
- **[k0s-monitoring](k0s-monitoring)** - Prometheus and Grafana

**Security**:
- **[service-mesh-linkerd](service-mesh-linkerd)** - mTLS between services

**Storage**:
- **[k0s-storage](k0s-storage)** - Persistent volumes

---

## 📚 Resources

**Traefik**:
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Kubernetes Ingress](https://doc.traefik.io/traefik/providers/kubernetes-ingress/)
- [Middlewares](https://doc.traefik.io/traefik/middlewares/overview/)

**Cert-Manager**:
- [Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt](https://letsencrypt.org/docs/)

---

## 📝 Change Log

### 2026-01-30
- Created ingress guide
- Explained concepts
- Covered Traefik installation
- Demonstrated path/host routing
- Showed SSL/TLS setup
- Added authentication
- Complete multi-service example
- Advanced features
- Troubleshooting guide

---

**Next Article**: [k0s-monitoring](k0s-monitoring) - Observability with Prometheus!
