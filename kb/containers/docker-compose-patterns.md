# Docker Compose Patterns - Production Best Practices

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Orchestration  
**Prerequisites**: [docker-compose-intro](docker-compose-intro), [docker-networking](docker-networking)  
**Time**: 3-4 hours  
**Tags**: docker-compose, patterns, production, scaling, monitoring

## Summary

Master production-ready Docker Compose patterns for building reliable, scalable multi-container applications. Learn health checks, restart policies, resource limits, secrets management, logging strategies, and deployment patterns used in real-world environments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Implement health checks and readiness probes
- ✅ Configure resource limits and reservations
- ✅ Manage secrets securely
- ✅ Set up proper logging
- ✅ Handle service dependencies correctly
- ✅ Deploy with zero-downtime
- ✅ Scale services effectively

## ❤️ Health Checks

### Basic Health Check

```yaml
services:
  web:
    image: nginx:alpine
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Parameters**:
- `test`: Command to run (exit 0 = healthy)
- `interval`: Time between checks
- `timeout`: Max time for check to complete
- `retries`: Consecutive failures before unhealthy
- `start_period`: Grace period on startup

---

### HTTP Health Check

```yaml
services:
  api:
    build: ./api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    depends_on:
      db:
        condition: service_healthy
  
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

### Custom Health Check Script

**health-check.sh**:
```bash
#!/bin/bash
# Check if app is responding AND database is accessible

# Check HTTP endpoint
curl -f http://localhost:3000/health || exit 1

# Check database connection
psql -U app -d mydb -c "SELECT 1" || exit 1

exit 0
```

**compose.yaml**:
```yaml
services:
  app:
    build: .
    healthcheck:
      test: ["CMD", "/app/health-check.sh"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🔄 Restart Policies

### Restart Policy Options

```yaml
services:
  # Always restart (even after host reboot)
  web:
    image: nginx
    restart: always
  
  # Restart only on failure (not after host reboot)
  worker:
    image: myworker
    restart: on-failure
  
  # Restart on failure with max attempts
  task:
    image: mytask
    restart: on-failure:5
  
  # Never restart (for one-off tasks)
  init:
    image: myinit
    restart: "no"
  
  # Restart unless explicitly stopped
  api:
    image: myapi
    restart: unless-stopped
```

**Use cases**:
- `always`: Critical services (web, db, cache)
- `on-failure`: Workers that might crash legitimately
- `unless-stopped`: Long-running services you want to persist
- `no`: One-time initialization tasks

---

## 💾 Resource Limits

### CPU and Memory Limits

```yaml
services:
  web:
    image: nginx
    deploy:
      resources:
        limits:
          cpus: '0.5'      # Max 50% of one CPU
          memory: 512M      # Max 512MB RAM
        reservations:
          cpus: '0.25'     # Guaranteed 25% CPU
          memory: 256M      # Guaranteed 256MB RAM
```

**Note**: `deploy.resources` works in Docker Swarm mode. For standalone Compose, use:

```yaml
services:
  web:
    image: nginx
    mem_limit: 512m
    mem_reservation: 256m
    cpus: 0.5
```

---

### Resource Limits Example

```yaml
services:
  # High-traffic frontend (needs resources)
  frontend:
    image: myapp/frontend
    mem_limit: 1g
    mem_reservation: 512m
    cpus: 1.0
  
  # API server (medium resources)
  api:
    image: myapp/api
    mem_limit: 512m
    mem_reservation: 256m
    cpus: 0.5
  
  # Background worker (light resources)
  worker:
    image: myapp/worker
    mem_limit: 256m
    mem_reservation: 128m
    cpus: 0.25
  
  # Database (high memory, I/O priority)
  db:
    image: postgres:15
    mem_limit: 2g
    mem_reservation: 1g
    cpus: 2.0
```

---

## 🔐 Secrets Management

### Using Environment Files

**.env** (NEVER commit this!):
```env
DB_PASSWORD=super_secret_password
API_KEY=abc123xyz789
JWT_SECRET=my_jwt_secret_key
```

**compose.yaml**:
```yaml
services:
  app:
    image: myapp
    env_file:
      - .env
    environment:
      - NODE_ENV=production
```

---

### Docker Secrets (Swarm Mode)

**secrets/db_password.txt**:
```
my_secure_password
```

**compose.yaml**:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    secrets:
      - db_password
      - db_user
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_USER_FILE: /run/secrets/db_user

secrets:
  db_password:
    file: ./secrets/db_password.txt
  db_user:
    file: ./secrets/db_user.txt
```

**Application reads from**: `/run/secrets/db_password`

---

### External Secrets

```yaml
services:
  app:
    image: myapp
    environment:
      # Read from external secret manager
      - DB_PASSWORD=${DB_PASSWORD}
      - API_KEY=${API_KEY}
```

**Fetch secrets at runtime**:
```bash
# From AWS Secrets Manager
export DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id prod/db/password --query SecretString --output text)

# From HashiCorp Vault
export API_KEY=$(vault kv get -field=api_key secret/app)

# Then run compose
docker compose up -d
```

---

## 📊 Logging

### Logging Drivers

```yaml
services:
  web:
    image: nginx
    logging:
      driver: "json-file"
      options:
        max-size: "10m"    # Max size per log file
        max-file: "3"       # Keep 3 rotated files
```

**Logging drivers**:
- `json-file`: Default, stores on disk
- `syslog`: Send to syslog
- `journald`: Systemd journal
- `gelf`: Graylog Extended Log Format
- `fluentd`: Fluentd logging
- `awslogs`: AWS CloudWatch

---

### Centralized Logging

```yaml
services:
  web:
    image: myapp
    logging:
      driver: "fluentd"
      options:
        fluentd-address: localhost:24224
        tag: web.{{.Name}}
  
  fluentd:
    image: fluent/fluentd:latest
    ports:
      - "24224:24224"
    volumes:
      - ./fluentd/conf:/fluentd/etc
      - ./logs:/var/log/fluentd
```

---

### JSON Logging with Rotation

```yaml
services:
  api:
    image: myapi
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
        labels: "service,env"
        env: "ENV,RELEASE"
    labels:
      service: "api"
      env: "production"
    environment:
      - ENV=production
      - RELEASE=v1.2.3
```

---

## 🔗 Dependency Management

### Service Dependencies

```yaml
services:
  web:
    image: nginx
    depends_on:
      - api
  
  api:
    build: ./api
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
  
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
  
  cache:
    image: redis:alpine
```

**Conditions**:
- `service_started`: Wait for service to start (default)
- `service_healthy`: Wait for health check to pass
- `service_completed_successfully`: Wait for one-shot service

---

### Init Containers Pattern

```yaml
services:
  # Run migrations first
  migrate:
    image: myapp
    command: npm run migrate
    depends_on:
      db:
        condition: service_healthy
    restart: on-failure
  
  # Then start app
  app:
    image: myapp
    depends_on:
      migrate:
        condition: service_completed_successfully
  
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 5s
```

---

## 🚀 Production Stack Example

```yaml
version: '3.8'

services:
  # Reverse proxy with SSL
  traefik:
    image: traefik:v2.10
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-letsencrypt:/letsencrypt
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Frontend application
  frontend:
    image: myapp/frontend:${VERSION:-latest}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`example.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
    depends_on:
      - api
    restart: unless-stopped
    mem_limit: 512m
    cpus: 0.5
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Backend API
  api:
    image: myapp/api:${VERSION:-latest}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.example.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://app:${DB_PASSWORD}@db:5432/myapp
      - REDIS_URL=redis://cache:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped
    mem_limit: 1g
    cpus: 1.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Background workers
  worker:
    image: myapp/api:${VERSION:-latest}
    command: npm run worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://app:${DB_PASSWORD}@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped
    mem_limit: 512m
    cpus: 0.5
    deploy:
      replicas: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # PostgreSQL database
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    mem_limit: 2g
    cpus: 2.0
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Redis cache
  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    restart: unless-stopped
    mem_limit: 512m
    cpus: 0.5
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Database backup (runs daily)
  backup:
    image: postgres:15-alpine
    command: >
      sh -c "while true; do
        pg_dump -h db -U app myapp | gzip > /backups/backup-$$(date +%Y%m%d-%H%M%S).sql.gz;
        find /backups -name '*.sql.gz' -mtime +7 -delete;
        sleep 86400;
      done"
    environment:
      - PGPASSWORD=${DB_PASSWORD}
    volumes:
      - ./backups:/backups
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    mem_limit: 256m
    cpus: 0.25

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  traefik-letsencrypt:
    driver: local

networks:
  default:
    driver: bridge
```

**.env**:
```env
VERSION=1.2.3
DB_PASSWORD=super_secure_password
JWT_SECRET=your_jwt_secret_key
```

---

## 📏 Scaling Services

### Manual Scaling

```bash
# Scale service to 3 instances
docker compose up -d --scale worker=3

# Scale multiple services
docker compose up -d --scale api=2 --scale worker=5
```

---

### Scale in Compose File

```yaml
services:
  worker:
    image: myworker
    deploy:
      replicas: 3
```

---

### Load Balancing with Nginx

**compose.yaml**:
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
  
  api:
    image: myapi
    deploy:
      replicas: 3
```

**nginx.conf**:
```nginx
upstream api_backend {
    server api:3000;
}

server {
    listen 80;
    
    location /api {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Docker's internal DNS will round-robin between api instances.

---

## 🔄 Zero-Downtime Deployments

### Rolling Update Pattern

```bash
# 1. Pull new images
docker compose pull

# 2. Recreate services one by one
docker compose up -d --no-deps --scale api=2 --no-recreate api

# 3. Wait for health checks

# 4. Remove old containers
docker compose up -d --scale api=1
```

---

### Blue-Green Deployment

**compose-blue.yaml**:
```yaml
services:
  app-blue:
    image: myapp:v1
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`example.com`)"
```

**compose-green.yaml**:
```yaml
services:
  app-green:
    image: myapp:v2
    labels:
      - "traefik.enable=false"  # Not routed yet
```

**Deploy**:
```bash
# 1. Start green (new version)
docker compose -f compose-green.yaml up -d

# 2. Test green
curl http://localhost:8080/health

# 3. Switch traffic (update labels)
# Update compose-green.yaml: traefik.enable=true
# Update compose-blue.yaml: traefik.enable=false
docker compose -f compose-blue.yaml -f compose-green.yaml up -d

# 4. Remove blue after verification
docker compose -f compose-blue.yaml down
```

---

## 🔍 Monitoring and Observability

### Prometheus + Grafana Stack

```yaml
services:
  # Your application
  app:
    image: myapp
    ports:
      - "3000:3000"
  
  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
  
  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus
  
  # Node exporter for host metrics
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus-data:
  grafana-data:
```

**prometheus.yml**:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['app:3000']
  
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

---

## 💡 Best Practices Checklist

### ✅ Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 5s
  retries: 3
```

---

### ✅ Resource Limits
```yaml
mem_limit: 512m
cpus: 0.5
```

---

### ✅ Restart Policies
```yaml
restart: unless-stopped
```

---

### ✅ Logging Configuration
```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

---

### ✅ Proper Dependencies
```yaml
depends_on:
  db:
    condition: service_healthy
```

---

### ✅ Environment Variables
```yaml
env_file:
  - .env
```

---

### ✅ Named Volumes
```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
    driver: local
```

---

### ✅ Networks
```yaml
networks:
  frontend:
  backend:
```

---

## 🔗 What's Next?

**Orchestration**:
- **[orchestration-need](orchestration-need)** - When to move to Kubernetes
- **[k0s-introduction](k0s-introduction)** - Lightweight Kubernetes

**Monitoring**:
- **[kb/observability/prometheus-basics](../observability/prometheus-basics)** - Metrics collection

---

## 📚 Resources

**Official Docs**:
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Logging Drivers](https://docs.docker.com/config/containers/logging/configure/)

**Production Guides**:
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 📝 Change Log

### 2026-01-30
- Created production patterns guide
- Covered health checks and dependencies
- Explained resource limits
- Demonstrated secrets management
- Included logging strategies
- Provided scaling patterns
- Showed zero-downtime deployments
- Added monitoring stack example
- Included best practices checklist

---

**Next Article**: [orchestration-need](orchestration-need) - When to use Kubernetes!

