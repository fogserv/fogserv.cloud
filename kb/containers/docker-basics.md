# Docker Basics - Essential Commands and First Containers

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Fundamentals  
**Prerequisites**: [docker-installation](docker-installation), [docker-concepts](docker-concepts)  
**Time**: 3-4 hours  
**Tags**: docker, commands, containers, cli, basics

## Summary

Master essential Docker commands through hands-on practice. Learn to run, manage, inspect, and troubleshoot containers. Build practical skills with real examples using common images like Nginx, Postgres, and Redis.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Run containers from Docker Hub images
- ✅ Manage container lifecycle (start, stop, restart, remove)
- ✅ View container logs and stats
- ✅ Execute commands inside running containers
- ✅ Map ports and volumes
- ✅ Understand container networking basics
- ✅ Troubleshoot common container issues

## 📦 Your First Container

### The Classic: Hello World

```bash
docker run hello-world
```

**What Happens**:
```
1. Docker CLI connects to Docker daemon
2. Daemon checks if 'hello-world' image exists locally
3. Image not found → pulls from Docker Hub
4. Creates container from image
5. Runs container (prints message)
6. Container exits
```

**Output Breakdown**:
```
Unable to find image 'hello-world:latest' locally
  ↑ Not found locally

latest: Pulling from library/hello-world
  ↑ Downloading from Docker Hub

2db29710123e: Pull complete
  ↑ Downloaded image layer

Status: Downloaded newer image for hello-world:latest
  ↑ Image ready

Hello from Docker!
  ↑ Container ran successfully!
```

---

## 🏃 Running Containers

### Basic `docker run` Syntax

```bash
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

### Run Interactive Container

```bash
# Run Ubuntu container with interactive bash
docker run -it ubuntu:22.04 bash

# Now you're inside the container!
root@abc123:/# ls
root@abc123:/# cat /etc/os-release
root@abc123:/# exit  # Exit container
```

**Flags**:
- `-i`: Interactive (keep STDIN open)
- `-t`: Allocate pseudo-TTY (terminal)
- `-it`: Combined (interactive terminal)

---

### Run Detached Container (Background)

```bash
# Run Nginx web server in background
docker run -d nginx:latest

# Output: container ID
3f7a8c9b2e1d...
```

**Flag**:
- `-d`: Detached mode (background)

---

### Run with Port Mapping

```bash
# Map host port 8080 → container port 80
docker run -d -p 8080:80 nginx:latest

# Test it
curl http://localhost:8080
# Or open browser: http://localhost:8080
```

**Port Mapping**:
```
-p HOST_PORT:CONTAINER_PORT

Examples:
-p 8080:80          # Host 8080 → Container 80
-p 3000:3000        # Same ports
-p 127.0.0.1:5000:5000  # Bind to specific host IP
-p 80:80 -p 443:443     # Multiple ports
```

---

### Run with Name

```bash
# Give container a custom name
docker run -d --name my-nginx nginx:latest

# Easier to reference
docker stop my-nginx
docker start my-nginx
docker logs my-nginx
```

---

### Run with Environment Variables

```bash
# Pass environment variables
docker run -d --name my-postgres \
  -e POSTGRES_PASSWORD=secret123 \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_DB=myapp \
  postgres:15

# Check it
docker exec my-postgres env | grep POSTGRES
```

---

### Run with Volume Mount

```bash
# Mount host directory into container
docker run -d --name nginx-custom \
  -p 8080:80 \
  -v /home/user/website:/usr/share/nginx/html:ro \
  nginx:latest
```

**Volume Syntax**:
```
-v HOST_PATH:CONTAINER_PATH[:OPTIONS]

Examples:
-v /data:/app/data              # Read-write
-v /config:/etc/app:ro          # Read-only
-v my-volume:/app/data          # Named volume
```

---

## 📋 Managing Containers

### List Containers

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Show container sizes
docker ps -s

# Show only IDs
docker ps -q
```

**Output Explained**:
```
CONTAINER ID   IMAGE          COMMAND                  CREATED          STATUS          PORTS                  NAMES
3f7a8c9b2e1d   nginx:latest   "nginx -g 'daemon of…"   2 minutes ago    Up 2 minutes    0.0.0.0:8080->80/tcp   my-nginx
```

---

### Start/Stop Containers

```bash
# Stop running container
docker stop my-nginx

# Start stopped container
docker start my-nginx

# Restart container
docker restart my-nginx

# Stop multiple containers
docker stop container1 container2 container3

# Stop all running containers
docker stop $(docker ps -q)
```

**Graceful Shutdown**:
- `docker stop`: Sends SIGTERM, waits 10s, then SIGKILL
- `docker kill`: Immediately sends SIGKILL

---

### Remove Containers

```bash
# Remove stopped container
docker rm my-nginx

# Force remove running container
docker rm -f my-nginx

# Remove multiple containers
docker rm container1 container2

# Remove all stopped containers
docker container prune

# Remove specific stopped containers
docker rm $(docker ps -aq -f status=exited)
```

---

## 🔍 Inspecting Containers

### View Logs

```bash
# View container logs
docker logs my-nginx

# Follow logs (real-time)
docker logs -f my-nginx

# Last 100 lines
docker logs --tail 100 my-nginx

# Logs with timestamps
docker logs -t my-nginx

# Logs since specific time
docker logs --since 2024-01-30T10:00:00 my-nginx
```

---

### Execute Commands in Container

```bash
# Run bash inside running container
docker exec -it my-nginx bash

# Run single command
docker exec my-nginx ls /etc/nginx

# Run as specific user
docker exec -u www-data my-nginx whoami

# Set working directory
docker exec -w /app my-container pwd
```

**Common Use Cases**:
```bash
# Check processes
docker exec my-container ps aux

# Check network connectivity
docker exec my-container ping google.com

# View config file
docker exec my-container cat /etc/nginx/nginx.conf

# Debug database
docker exec -it my-postgres psql -U postgres
```

---

### Inspect Container Details

```bash
# Full container info (JSON)
docker inspect my-nginx

# Get specific value (IP address)
docker inspect -f '{{.NetworkSettings.IPAddress}}' my-nginx

# Get ports
docker inspect -f '{{.NetworkSettings.Ports}}' my-nginx

# Get environment variables
docker inspect -f '{{.Config.Env}}' my-nginx
```

---

### Container Stats

```bash
# Real-time resource usage
docker stats

# Stats for specific container
docker stats my-nginx

# One-time snapshot (no stream)
docker stats --no-stream
```

**Output**:
```
CONTAINER ID   NAME        CPU %     MEM USAGE / LIMIT    MEM %     NET I/O       BLOCK I/O
3f7a8c9b2e1d   my-nginx    0.00%     2.5MiB / 7.78GiB    0.03%     1kB / 0B      0B / 0B
```

---

## 🖼️ Working with Images

### List Images

```bash
# List downloaded images
docker images

# Or
docker image ls

# Show image IDs only
docker images -q

# Show all layers
docker images -a
```

---

### Pull Images

```bash
# Pull latest version
docker pull nginx

# Pull specific version
docker pull nginx:1.25

# Pull from specific registry
docker pull ghcr.io/username/myapp:latest
```

**Image Naming**:
```
[REGISTRY/][NAMESPACE/]REPOSITORY[:TAG]

Examples:
nginx                                    # Docker Hub, latest
nginx:1.25                              # Specific version
docker.io/library/nginx:latest          # Explicit Docker Hub
ghcr.io/myusername/myapp:v1.0          # GitHub Container Registry
harbor.example.com/prod/api:2.3.1      # Self-hosted Harbor
```

---

### Remove Images

```bash
# Remove image
docker rmi nginx:latest

# Force remove (even if containers exist)
docker rmi -f nginx:latest

# Remove unused images
docker image prune

# Remove all images (dangerous!)
docker rmi $(docker images -q)
```

---

## 🌐 Networking Basics

### Default Bridge Network

Containers automatically connect to default bridge network.

```bash
# Run two containers
docker run -d --name web nginx
docker run -d --name db postgres:15

# Check container IPs
docker inspect -f '{{.NetworkSettings.IPAddress}}' web
docker inspect -f '{{.NetworkSettings.IPAddress}}' db

# Containers can reach each other by IP
docker exec web ping <db-ip-address>
```

---

### Create Custom Network

```bash
# Create custom bridge network
docker network create my-network

# Run containers on custom network
docker run -d --name web --network my-network nginx
docker run -d --name db --network my-network postgres:15

# Containers can reach each other BY NAME! (DNS)
docker exec web ping db  # Works!
docker exec db ping web  # Works!
```

**Why Custom Networks?**:
- Automatic DNS resolution (use container names)
- Better isolation
- Custom subnet configuration

---

### Network Commands

```bash
# List networks
docker network ls

# Inspect network
docker network inspect my-network

# Connect existing container to network
docker network connect my-network my-container

# Disconnect
docker network disconnect my-network my-container

# Remove network
docker network rm my-network

# Remove unused networks
docker network prune
```

---

## 💾 Data Persistence

### Named Volumes

```bash
# Create named volume
docker volume create my-data

# Use volume in container
docker run -d --name db \
  -v my-data:/var/lib/postgresql/data \
  postgres:15

# Data persists even after container removal!
docker rm -f db
docker run -d --name db2 \
  -v my-data:/var/lib/postgresql/data \
  postgres:15
# ↑ Same data!
```

---

### Bind Mounts

```bash
# Mount host directory
docker run -d --name web \
  -v /home/user/website:/usr/share/nginx/html:ro \
  nginx

# Changes on host immediately visible in container
echo "Hello" > /home/user/website/index.html
curl http://localhost  # Shows "Hello"
```

---

### Volume Commands

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect my-data

# Remove volume
docker volume rm my-data

# Remove unused volumes
docker volume prune

# Remove all volumes (dangerous!)
docker volume prune -a
```

---

## 🎮 Practical Examples

### Example 1: Nginx Web Server

```bash
# Create directory for website
mkdir ~/my-website
echo "<h1>Hello Docker!</h1>" > ~/my-website/index.html

# Run Nginx
docker run -d \
  --name my-web \
  -p 8080:80 \
  -v ~/my-website:/usr/share/nginx/html:ro \
  nginx:latest

# Test
curl http://localhost:8080

# View logs
docker logs my-web

# Cleanup
docker stop my-web
docker rm my-web
```

---

### Example 2: PostgreSQL Database

```bash
# Run Postgres
docker run -d \
  --name my-postgres \
  -e POSTGRES_PASSWORD=mysecret \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  -v pg-data:/var/lib/postgresql/data \
  postgres:15

# Wait a moment for startup, then connect
docker exec -it my-postgres psql -U postgres -d testdb

# Inside psql:
testdb=# CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));
testdb=# INSERT INTO users (name) VALUES ('Alice'), ('Bob');
testdb=# SELECT * FROM users;
testdb=# \q

# Cleanup (data preserved in volume!)
docker stop my-postgres
docker rm my-postgres
```

---

### Example 3: Redis Cache

```bash
# Run Redis
docker run -d \
  --name my-redis \
  -p 6379:6379 \
  redis:latest

# Test Redis
docker exec -it my-redis redis-cli

# Inside redis-cli:
127.0.0.1:6379> SET mykey "Hello Redis"
127.0.0.1:6379> GET mykey
127.0.0.1:6379> exit

# Cleanup
docker stop my-redis
docker rm my-redis
```

---

### Example 4: Multi-Container App (Manual)

```bash
# Create network
docker network create app-network

# Run database
docker run -d \
  --name db \
  --network app-network \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

# Run Redis
docker run -d \
  --name cache \
  --network app-network \
  redis:latest

# Run web app (example)
docker run -d \
  --name web \
  --network app-network \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://postgres:secret@db:5432/postgres \
  -e REDIS_URL=redis://cache:6379 \
  my-web-app:latest

# App can reach db and cache by name!
```

---

## 🔧 Useful Commands

### Copy Files To/From Containers

```bash
# Copy file TO container
docker cp local-file.txt my-container:/app/file.txt

# Copy FROM container
docker cp my-container:/app/logs/app.log ./local-logs.log

# Copy directory
docker cp my-container:/etc/nginx/conf.d ./nginx-configs/
```

---

### Container Diff (Changed Files)

```bash
# See what files changed in container
docker diff my-container

# Output:
# A /app/newfile.txt       (Added)
# C /etc/nginx/nginx.conf  (Changed)
# D /tmp/oldfile           (Deleted)
```

---

### Save/Load Images

```bash
# Save image to tar file
docker save nginx:latest > nginx.tar

# Or with compression
docker save nginx:latest | gzip > nginx.tar.gz

# Load image from tar
docker load < nginx.tar

# Export container filesystem
docker export my-container > container.tar

# Import as new image
docker import container.tar my-image:latest
```

---

### Commit Container to Image

```bash
# Make changes in container
docker run -it --name my-ubuntu ubuntu:22.04 bash
root@abc:/# apt update && apt install -y curl vim
root@abc:/# exit

# Save container as new image
docker commit my-ubuntu my-ubuntu-custom:v1

# Use new image
docker run -it my-ubuntu-custom:v1 bash
root@def:/# curl --version  # Curl installed!
```

**Note**: Better to use Dockerfiles (next article), but this is useful for experiments.

---

## 🧹 Cleanup Commands

### Remove Everything

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove EVERYTHING (be careful!)
docker system prune -a --volumes
```

---

### Check Disk Usage

```bash
# See what's using disk space
docker system df

# Detailed view
docker system df -v
```

**Example Output**:
```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          15        3         2.5GB     1.8GB (72%)
Containers      8         2         150MB     100MB (66%)
Local Volumes   4         1         500MB     300MB (60%)
Build Cache     0         0         0B        0B
```

---

## 🚨 Troubleshooting

### Container Won't Start

**Check Logs**:
```bash
docker logs my-container
docker logs --tail 50 my-container
```

**Inspect Container**:
```bash
docker inspect my-container
# Look for "State" section
```

**Common Issues**:
1. **Port already in use**: Change host port `-p 8081:80`
2. **Missing environment variables**: Check with `docker inspect`
3. **Volume permissions**: Container user can't write to mounted dir

---

### Container Exits Immediately

**Check Exit Code**:
```bash
docker ps -a  # Look at STATUS column
# Exited (0) = normal exit
# Exited (1) = error
# Exited (137) = killed (OOM?)
```

**Run with Interactive Mode to Debug**:
```bash
docker run -it my-image bash
# See what happens
```

---

### Can't Connect to Container

**Check Container is Running**:
```bash
docker ps | grep my-container
```

**Check Port Mapping**:
```bash
docker port my-container
# Shows: 80/tcp -> 0.0.0.0:8080
```

**Check Container IP**:
```bash
docker inspect -f '{{.NetworkSettings.IPAddress}}' my-container
curl http://<ip-address>
```

**Check Firewall** (if on remote host):
```bash
sudo ufw allow 8080
# or
sudo firewall-cmd --add-port=8080/tcp
```

---

### Out of Disk Space

**Clean Up**:
```bash
docker system prune -a --volumes
```

**Find Large Images**:
```bash
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | sort -k 3 -h
```

---

## 💡 Pro Tips

**1. Always Name Your Containers**:
```bash
# Bad
docker run -d nginx

# Good
docker run -d --name web-prod nginx
```

**2. Use Specific Tags**:
```bash
# Bad (tag changes)
docker pull nginx:latest

# Good (specific version)
docker pull nginx:1.25.3
```

**3. Auto-Remove After Exit**:
```bash
# Container auto-deletes after exit
docker run --rm -it ubuntu:22.04 bash
```

**4. Resource Limits**:
```bash
# Limit memory and CPU
docker run -d \
  --name my-app \
  --memory="512m" \
  --cpus="1.0" \
  my-app:latest
```

**5. Health Checks**:
```bash
# Run with health check
docker run -d \
  --name web \
  --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  nginx
```

---

## 🔗 What's Next?

Now that you can run and manage containers:

**Build Custom Images**:
- **[dockerfile-guide](dockerfile-guide)** - Create your own Docker images

**Data Persistence**:
- **[docker-volumes](docker-volumes)** - Deep dive into volumes

**Networking**:
- **[docker-networking](docker-networking)** - Advanced networking

**Multi-Container Apps**:
- **[docker-compose-intro](docker-compose-intro)** - Manage multiple containers easily

---

## 📚 Resources

**Cheat Sheets**:
- [Docker CLI Cheat Sheet](https://docs.docker.com/get-started/docker_cheatsheet.pdf)
- [Docker Commands Reference](https://docs.docker.com/engine/reference/commandline/cli/)

**Practice**:
- [Play with Docker](https://labs.play-with-docker.com/) - Free online environment
- [Docker 101 Tutorial](https://www.docker.com/101-tutorial/)

---

## 📝 Change Log

### 2026-01-30
- Created Docker basics article
- Covered essential commands (run, stop, rm, logs, exec)
- Included practical examples (Nginx, Postgres, Redis)
- Added networking and volume basics
- Provided troubleshooting guide
- Included pro tips and best practices

---

**Next Article**: [dockerfile-guide](dockerfile-guide) - Build your own images!

