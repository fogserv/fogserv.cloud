# Docker Compose - Multi-Container Applications Made Easy

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Orchestration  
**Prerequisites**: [docker-basics](docker-basics), [docker-networking](docker-networking), [docker-volumes](docker-volumes)  
**Time**: 3-4 hours  
**Tags**: docker-compose, yaml, multi-container, orchestration, services

## Summary

Learn Docker Compose to define and run multi-container applications with a single YAML file. Master services, networks, volumes, and environment configuration to replace complex docker run commands with simple, version-controlled compose files.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Write docker-compose.yml files
- ✅ Define services, networks, and volumes
- ✅ Manage multi-container applications
- ✅ Use environment variables and secrets
- ✅ Scale services
- ✅ Debug compose applications
- ✅ Understand compose vs docker commands

## 🤔 The Problem Compose Solves

### Without Compose (Painful!)

```bash
# Create network
docker network create myapp-network

# Create volumes
docker volume create myapp-db-data
docker volume create myapp-redis-data

# Run database
docker run -d \
  --name myapp-db \
  --network myapp-network \
  -e POSTGRES_PASSWORD=secret123 \
  -e POSTGRES_DB=myapp \
  -v myapp-db-data:/var/lib/postgresql/data \
  postgres:15

# Run Redis
docker run -d \
  --name myapp-redis \
  --network myapp-network \
  -v myapp-redis-data:/data \
  redis:latest

# Run web app
docker run -d \
  --name myapp-web \
  --network myapp-network \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://postgres:secret123@myapp-db:5432/myapp \
  -e REDIS_URL=redis://myapp-redis:6379 \
  -v $(pwd)/uploads:/app/uploads \
  myapp:latest

# 🤯 That's a lot of commands!
# 🤯 Hard to reproduce
# 🤯 Not version controlled
```

---

### With Compose (Simple!)

**File**: `docker-compose.yml`
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret123
      POSTGRES_DB: myapp
    volumes:
      - db-data:/var/lib/postgresql/data
  
  redis:
    image: redis:latest
    volumes:
      - redis-data:/data
  
  web:
    image: myapp:latest
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://postgres:secret123@db:5432/myapp
      REDIS_URL: redis://redis:6379
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - db
      - redis

volumes:
  db-data:
  redis-data:
```

**Run Everything**:
```bash
docker-compose up -d

# ✅ One command!
# ✅ Version controlled
# ✅ Easy to share
```

---

## 📦 Installation

**Docker Compose comes with Docker Desktop** (Windows/Mac).

**Linux Installation**:
```bash
# Modern Docker includes compose plugin
docker compose version

# If not installed, add it
sudo apt update
sudo apt install docker-compose-plugin

# Verify
docker compose version
```

**Legacy standalone (older systems)**:
```bash
# Download standalone binary
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose version
```

**Command Syntax**:
- Modern: `docker compose` (plugin)
- Legacy: `docker-compose` (standalone)

---

## 📝 Compose File Structure

### Basic Structure

```yaml
version: '3.8'  # Compose file format version

services:       # Define containers
  service1:
    # service configuration
  service2:
    # service configuration

networks:       # Define networks (optional)
  network1:
    # network configuration

volumes:        # Define volumes (optional)
  volume1:
    # volume configuration
```

---

### Minimal Example

```yaml
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
```

**Run**:
```bash
docker compose up -d
```

---

## 🎮 Essential Compose Commands

### Start Services

```bash
# Start all services (foreground)
docker compose up

# Start in background (detached)
docker compose up -d

# Start specific service
docker compose up -d web

# Force recreate containers
docker compose up -d --force-recreate

# Rebuild images before starting
docker compose up -d --build
```

---

### Stop Services

```bash
# Stop services (containers still exist)
docker compose stop

# Stop and remove containers
docker compose down

# Remove containers, networks, AND volumes
docker compose down --volumes

# Remove everything including images
docker compose down --rmi all --volumes
```

---

### View Status

```bash
# List running services
docker compose ps

# Show logs
docker compose logs

# Follow logs
docker compose logs -f

# Logs for specific service
docker compose logs -f web

# Last 100 lines
docker compose logs --tail 100
```

---

### Execute Commands

```bash
# Run command in service
docker compose exec web bash

# Run command without allocating TTY
docker compose exec -T web ls -la

# Run one-off command (new container)
docker compose run web python manage.py migrate
```

---

### Scale Services

```bash
# Scale service to 3 instances
docker compose up -d --scale web=3

# Scale multiple services
docker compose up -d --scale web=3 --scale worker=5
```

---

### Other Useful Commands

```bash
# Restart services
docker compose restart

# Restart specific service
docker compose restart web

# Pause services
docker compose pause

# Unpause services
docker compose unpause

# View container processes
docker compose top

# Validate compose file
docker compose config

# View config with resolved variables
docker compose config
```

---

## 🏗️ Service Configuration

### Using Images

```yaml
services:
  web:
    image: nginx:1.25
    # Pulls from Docker Hub
  
  app:
    image: ghcr.io/user/myapp:v1.0
    # Pulls from GitHub Container Registry
```

---

### Building from Dockerfile

```yaml
services:
  app:
    build: .
    # Builds from Dockerfile in current directory
  
  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
      args:
        - VERSION=1.0
        - BUILD_ENV=production
```

---

### Ports

```yaml
services:
  web:
    ports:
      - "8080:80"           # host:container
      - "443:443"
      - "127.0.0.1:8000:8000"  # bind to specific IP
      - "9000-9005:9000-9005"  # port range
```

---

### Environment Variables

```yaml
services:
  app:
    environment:
      # Key-value pairs
      NODE_ENV: production
      DATABASE_HOST: db
      API_KEY: abc123
      
  db:
    environment:
      # List format
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
      
  web:
    env_file:
      # Load from file
      - .env
      - .env.local
```

**Environment file** (`.env`):
```
DATABASE_PASSWORD=secret123
API_KEY=abc123xyz
DEBUG=false
```

---

### Volumes

```yaml
services:
  db:
    volumes:
      # Named volume
      - db-data:/var/lib/postgresql/data
      
      # Bind mount
      - ./config:/etc/app:ro
      
      # Anonymous volume
      - /app/cache

volumes:
  db-data:  # Define named volume
```

---

### Networks

```yaml
services:
  frontend:
    networks:
      - frontend-net
  
  backend:
    networks:
      - frontend-net
      - backend-net
  
  db:
    networks:
      - backend-net

networks:
  frontend-net:
  backend-net:
```

---

### Depends On

```yaml
services:
  web:
    depends_on:
      - db
      - redis
    # Starts db and redis before web
    
  worker:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    # Wait for db to be healthy
```

---

### Health Checks

```yaml
services:
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

---

### Restart Policies

```yaml
services:
  web:
    restart: always
    # always, on-failure, unless-stopped, no
  
  worker:
    restart: on-failure:3
    # Retry 3 times on failure
```

---

## 🎯 Real-World Examples

### Example 1: WordPress Stack

```yaml
version: '3.8'

services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: wppass
    volumes:
      - db-data:/var/lib/mysql
    restart: always
    
  wordpress:
    image: wordpress:latest
    depends_on:
      - db
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: wppass
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wp-content:/var/www/html/wp-content
    restart: always

volumes:
  db-data:
  wp-content:
```

**Usage**:
```bash
docker compose up -d
# Visit http://localhost:8080
```

---

### Example 2: Full-Stack App (MERN)

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secret
    volumes:
      - mongo-data:/data/db
    networks:
      - backend
    
  backend:
    build: ./backend
    environment:
      MONGO_URL: mongodb://admin:secret@mongo:27017/myapp?authSource=admin
      JWT_SECRET: super-secret-key
      PORT: 5000
    depends_on:
      - mongo
    networks:
      - backend
      - frontend
    
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - frontend

networks:
  frontend:
  backend:

volumes:
  mongo-data:
```

---

### Example 3: Development Environment

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
    volumes:
      # Live code reload
      - ./app:/app/app
      - ./tests:/app/tests
      # Preserve dependencies
      - node-modules:/app/node_modules
    environment:
      NODE_ENV: development
      DEBUG: "app:*"
    command: npm run dev
    
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: devdb
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      # Load test data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  node-modules:
  postgres-data:
```

---

### Example 4: Microservices with Traefik

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - web
  
  auth:
    image: mycompany/auth-service:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.auth.rule=Host(`auth.localhost`)"
    networks:
      - web
      - backend
  
  users:
    image: mycompany/user-service:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.users.rule=Host(`users.localhost`)"
    networks:
      - web
      - backend
  
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    networks:
      - backend

networks:
  web:
  backend:
```

---

## 🔧 Advanced Features

### Environment Variable Substitution

**Compose file**:
```yaml
services:
  web:
    image: nginx:${NGINX_VERSION:-latest}
    ports:
      - "${WEB_PORT:-8080}:80"
    environment:
      APP_ENV: ${APP_ENV}
```

**.env file**:
```
NGINX_VERSION=1.25
WEB_PORT=9000
APP_ENV=production
```

**Run**:
```bash
docker compose up -d
# Uses values from .env
```

---

### Extension Fields (DRY)

```yaml
version: '3.8'

x-common-variables: &common-vars
  TZ: America/New_York
  LOG_LEVEL: info

x-restart-policy: &restart
  restart: unless-stopped

services:
  web:
    <<: *restart
    image: myapp:latest
    environment:
      <<: *common-vars
      SERVICE: web
  
  worker:
    <<: *restart
    image: myapp:latest
    environment:
      <<: *common-vars
      SERVICE: worker
```

---

### Multiple Compose Files

**Base**: `docker-compose.yml`
```yaml
version: '3.8'

services:
  web:
    image: myapp:latest
    environment:
      NODE_ENV: production
```

**Override**: `docker-compose.dev.yml`
```yaml
version: '3.8'

services:
  web:
    build: .
    volumes:
      - ./src:/app/src
    environment:
      NODE_ENV: development
      DEBUG: "app:*"
```

**Run with override**:
```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production
docker compose up -d
```

---

### Profiles

```yaml
services:
  web:
    image: nginx
    # Always runs
  
  db:
    image: postgres:15
    profiles: ["backend"]
  
  redis:
    image: redis
    profiles: ["backend", "cache"]
  
  monitoring:
    image: prometheus
    profiles: ["monitoring"]
```

**Usage**:
```bash
# Start only web (no profile)
docker compose up -d

# Start web + backend services
docker compose --profile backend up -d

# Start multiple profiles
docker compose --profile backend --profile monitoring up -d
```

---

## 🔍 Debugging

### View Effective Configuration

```bash
# See resolved compose file
docker compose config

# Check for errors
docker compose config --quiet
echo $?  # 0 = valid, 1 = invalid
```

---

### Check Service Status

```bash
# List services
docker compose ps

# Include stopped services
docker compose ps -a

# Service-specific status
docker compose ps web
```

---

### View Logs

```bash
# All services
docker compose logs

# Follow logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail 100

# Specific service
docker compose logs -f web

# Multiple services
docker compose logs -f web db

# With timestamps
docker compose logs -t
```

---

### Inspect Services

```bash
# View service details
docker compose ps --format json web

# Port mappings
docker compose port web 80

# Running processes
docker compose top
```

---

## 🚨 Common Issues

### Issue 1: Port Already in Use

**Error**:
```
Error starting userland proxy: listen tcp 0.0.0.0:8080: bind: address already in use
```

**Solution**:
```yaml
# Change host port
services:
  web:
    ports:
      - "8081:80"  # Use 8081 instead
```

---

### Issue 2: Volume Permission Issues

**Problem**: Container can't write to volume.

**Solution**:
```yaml
services:
  app:
    user: "${UID}:${GID}"
    # Run as current user
```

**Or**:
```bash
# Change volume ownership
sudo chown -R 1000:1000 /path/to/volume
```

---

### Issue 3: Services Can't Communicate

**Problem**: DNS not resolving.

**Check**:
```bash
# Verify services on same network
docker compose exec web ping db
```

**Solution**: Ensure `depends_on` or explicit network:
```yaml
services:
  web:
    depends_on:
      - db
  db:
    # ...
```

---

### Issue 4: Environment Variables Not Working

**Check .env file exists**:
```bash
ls -la .env
```

**Verify loading**:
```bash
docker compose config
# Shows resolved values
```

---

## 💡 Best Practices

### 1. Use .env for Secrets

```yaml
# docker-compose.yml
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

```
# .env (gitignored!)
DB_PASSWORD=super-secret-password
```

---

### 2. Pin Image Versions

```yaml
# Good
services:
  web:
    image: nginx:1.25.3

# Bad
services:
  web:
    image: nginx:latest
```

---

### 3. Use Health Checks

```yaml
services:
  db:
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  web:
    depends_on:
      db:
        condition: service_healthy
```

---

### 4. Name Your Volumes

```yaml
# Good
volumes:
  postgres-data:
  redis-data:

# Bad (anonymous volumes)
services:
  db:
    volumes:
      - /var/lib/postgresql/data
```

---

### 5. Use compose.override for Local Dev

**docker-compose.yml** (committed):
```yaml
services:
  web:
    image: myapp:latest
```

**docker-compose.override.yml** (gitignored):
```yaml
services:
  web:
    build: .
    volumes:
      - ./src:/app/src
```

---

## 🔗 What's Next?

You've mastered Docker Compose basics! Continue with:

**Advanced Patterns**:
- **[docker-compose-patterns](docker-compose-patterns)** - Production patterns

**Orchestration**:
- **[k0s-introduction](k0s-introduction)** - Kubernetes for larger scale

**CI/CD**:
- **[kb/cicd/woodpecker-ci](../cicd/woodpecker-ci)** - Automate deployments

---

## 📚 Resources

**Official Docs**:
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Compose CLI](https://docs.docker.com/compose/reference/)
- [Compose Specification](https://compose-spec.io/)

**Examples**:
- [Awesome Compose](https://github.com/docker/awesome-compose)

---

## 📝 Change Log

### 2026-01-30
- Created Docker Compose introduction
- Covered compose file structure and syntax
- Explained all essential commands
- Provided real-world examples (WordPress, MERN, microservices)
- Included advanced features (profiles, multiple files, extensions)
- Added debugging and troubleshooting section
- Included production best practices

---

**Next Article**: [docker-compose-patterns](docker-compose-patterns) - Advanced compose patterns!

