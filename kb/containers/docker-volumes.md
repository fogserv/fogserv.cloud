# Docker Volumes - Persistent Data Management

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Storage  
**Prerequisites**: [docker-basics](docker-basics), [docker-concepts](docker-concepts)  
**Time**: 2-3 hours  
**Tags**: docker, volumes, storage, persistence, data

## Summary

Master Docker data persistence with volumes, bind mounts, and tmpfs mounts. Learn when to use each storage type, how to manage volumes, backup/restore strategies, and solve common data persistence challenges in containerized applications.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Docker storage types (volumes, bind mounts, tmpfs)
- ✅ Create and manage volumes
- ✅ Use volumes in containers
- ✅ Backup and restore volume data
- ✅ Share volumes between containers
- ✅ Understand volume drivers
- ✅ Implement proper data persistence strategies

## 🤔 The Storage Problem

**Container Filesystem is Ephemeral**:
```bash
docker run --name test-db postgres:15
# Database stores data in container

docker rm test-db
# Data is GONE forever! 💀
```

**The Problem**:
- Container storage disappears when container is removed
- Can't share data between containers easily
- Performance issues with container layers
- Backup/restore is complex

**The Solution**: Docker volumes and mounts!

---

## 📦 Three Storage Types

### Quick Comparison

| Type | Location | Use Case | Performance | Managed By |
|------|----------|----------|-------------|------------|
| **Volume** | Docker area | Production data | Best | Docker |
| **Bind Mount** | Any host path | Development, config | Good | You |
| **tmpfs** | Memory | Temporary/secrets | Fastest | Docker |

**Visual**:
```
┌─────────────────────────────────────────────────────┐
│  Host Machine                                       │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │ /var/lib/docker/volumes/                   │    │
│  │   └── my-volume/                           │    │
│  │       └── _data/  ← Volume (managed)       │────┼─┐
│  └────────────────────────────────────────────┘    │ │
│                                                     │ │
│  ┌────────────────────────────────────────────┐    │ │
│  │ /home/user/data/  ← Bind mount (your path)│────┼─┤
│  └────────────────────────────────────────────┘    │ │
│                                                     │ │
│  ┌────────────────────────────────────────────┐    │ │
│  │ RAM  ← tmpfs (memory only, temporary)     │────┼─┤
│  └────────────────────────────────────────────┘    │ │
└─────────────────────────────────────────────────────┘ │
                                                        │
┌─────────────────────────────────────────────────────┐ │
│  Container                                          │ │
│  ┌────────────────────────────────────────────┐    │ │
│  │ /var/lib/postgresql/data  ← Mount point   │◄───┼─┘
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Volumes (Recommended for Production)

**Volumes**: Managed by Docker, stored in Docker's area.

**Benefits**:
- Managed by Docker (easy backup/restore)
- Work on Windows, Mac, Linux
- Can use volume drivers (network storage, etc.)
- Isolated from host filesystem
- Safe to share between containers

### Create Volume

```bash
# Create named volume
docker volume create my-data

# Create with driver options
docker volume create --driver local \
  --opt type=none \
  --opt device=/mnt/storage \
  --opt o=bind \
  my-data
```

---

### List Volumes

```bash
# List all volumes
docker volume ls

# Output:
DRIVER    VOLUME NAME
local     my-data
local     postgres-data
local     abc123def456  ← Anonymous volume
```

---

### Inspect Volume

```bash
# Get volume details
docker volume inspect my-data

# Output:
[
    {
        "CreatedAt": "2026-01-30T10:00:00Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/my-data/_data",
        "Name": "my-data",
        "Options": {},
        "Scope": "local"
    }
]
```

---

### Use Volume in Container

```bash
# Mount volume to container
docker run -d \
  --name my-postgres \
  -v my-data:/var/lib/postgresql/data \
  postgres:15

# Or with --mount (more explicit)
docker run -d \
  --name my-postgres \
  --mount source=my-data,target=/var/lib/postgresql/data \
  postgres:15
```

**Syntax**:
```
-v VOLUME_NAME:CONTAINER_PATH
--mount source=VOLUME_NAME,target=CONTAINER_PATH
```

---

### Volume Persists After Container Removal

```bash
# Create container with volume
docker run -d --name db1 -v db-data:/var/lib/postgresql/data postgres:15

# Write some data
docker exec db1 psql -U postgres -c "CREATE DATABASE testdb;"

# Remove container
docker rm -f db1

# Volume still exists!
docker volume ls | grep db-data

# Create new container with same volume
docker run -d --name db2 -v db-data:/var/lib/postgresql/data postgres:15

# Data is still there!
docker exec db2 psql -U postgres -l | grep testdb
```

---

### Remove Volume

```bash
# Remove volume (must not be in use)
docker volume rm my-data

# Remove all unused volumes
docker volume prune

# Force remove (be careful!)
docker volume prune -f
```

---

## 📁 Bind Mounts (Development & Config)

**Bind Mount**: Mount any host directory into container.

**Benefits**:
- Access files on host immediately
- Edit files with host tools
- Good for development
- Good for config files

**Drawbacks**:
- Host path must exist
- Less portable (path may not exist on other machines)
- Permission issues possible

### Basic Bind Mount

```bash
# Create directory on host
mkdir -p ~/my-website

# Create index file
echo "<h1>Hello from Host!</h1>" > ~/my-website/index.html

# Mount into Nginx container
docker run -d \
  --name web \
  -p 8080:80 \
  -v ~/my-website:/usr/share/nginx/html:ro \
  nginx:latest

# Test
curl http://localhost:8080
# Output: <h1>Hello from Host!</h1>

# Edit file on host
echo "<h1>Updated!</h1>" > ~/my-website/index.html

# Immediately visible in container
curl http://localhost:8080
# Output: <h1>Updated!</h1>
```

**Syntax**:
```
-v /host/path:/container/path[:options]

Options:
:ro  - Read-only
:rw  - Read-write (default)
```

---

### Bind Mount for Config Files

```bash
# Create custom nginx config
cat > ~/nginx.conf << 'EOF'
server {
    listen 80;
    server_name example.com;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF

# Mount config file
docker run -d \
  --name web \
  -p 8080:80 \
  -v ~/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  -v ~/my-website:/usr/share/nginx/html:ro \
  nginx:latest
```

---

### Development Workflow Example

```bash
# Project structure
my-app/
├── src/
│   └── app.py
└── requirements.txt

# Run with bind mount for live reload
docker run -d \
  --name dev-app \
  -p 5000:5000 \
  -v $(pwd)/src:/app/src \
  -e FLASK_ENV=development \
  my-python-app:dev

# Edit src/app.py on host
# Changes immediately visible in container
# Flask auto-reloads
```

---

## 💨 tmpfs Mounts (Temporary Data)

**tmpfs**: Mount in container's memory (RAM).

**Benefits**:
- Extremely fast (in RAM)
- Data never written to disk (security!)
- Automatically cleaned up

**Use Cases**:
- Temporary files
- Sensitive data (passwords during processing)
- High-performance scratch space
- Cache that doesn't need persistence

### Create tmpfs Mount

```bash
# Mount tmpfs
docker run -d \
  --name app \
  --tmpfs /tmp:rw,size=100m \
  my-app:latest

# Or with --mount
docker run -d \
  --name app \
  --mount type=tmpfs,target=/tmp,tmpfs-size=104857600 \
  my-app:latest
```

**Options**:
- `size`: Max size (e.g., 100m, 1g)
- `mode`: Permissions (e.g., 1777)

---

## 🔄 Sharing Volumes Between Containers

### Share Named Volume

```bash
# Create volume
docker volume create shared-data

# Container 1 writes data
docker run -d \
  --name writer \
  -v shared-data:/data \
  alpine sh -c "while true; do echo $(date) >> /data/log.txt; sleep 5; done"

# Container 2 reads data
docker run -d \
  --name reader \
  -v shared-data:/data:ro \
  alpine sh -c "while true; do tail -f /data/log.txt; done"

# Both access same data!
docker logs reader
```

---

### Volumes-From (Legacy Pattern)

```bash
# Data container
docker run -d \
  --name data-container \
  -v /data \
  alpine sleep infinity

# App container uses volumes from data-container
docker run -d \
  --name app \
  --volumes-from data-container \
  my-app:latest
```

**Note**: Named volumes (previous method) are preferred now.

---

## 💾 Backup and Restore

### Backup Volume

```bash
# Create volume with data
docker volume create important-data
docker run --rm -v important-data:/data alpine sh -c "echo 'Important stuff' > /data/file.txt"

# Backup volume to tar file
docker run --rm \
  -v important-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup.tar.gz -C /data .

# Backup file created: backup.tar.gz
```

---

### Restore Volume

```bash
# Create new volume
docker volume create restored-data

# Restore from backup
docker run --rm \
  -v restored-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backup.tar.gz -C /data

# Verify
docker run --rm -v restored-data:/data alpine cat /data/file.txt
# Output: Important stuff
```

---

### Automated Backup Script

```bash
#!/bin/bash
# backup-volume.sh

VOLUME_NAME=$1
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

docker run --rm \
  -v ${VOLUME_NAME}:/data \
  -v ${BACKUP_DIR}:/backup \
  alpine tar czf /backup/${VOLUME_NAME}_${DATE}.tar.gz -C /data .

echo "Backup created: ${BACKUP_DIR}/${VOLUME_NAME}_${DATE}.tar.gz"
```

**Usage**:
```bash
chmod +x backup-volume.sh
./backup-volume.sh postgres-data
```

---

## 🎯 Real-World Examples

### Example 1: PostgreSQL with Persistent Data

```bash
# Create volume for database
docker volume create postgres-data

# Run PostgreSQL
docker run -d \
  --name postgres-prod \
  -e POSTGRES_PASSWORD=secret123 \
  -e POSTGRES_DB=production \
  -v postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15

# Create some data
docker exec postgres-prod psql -U postgres -d production -c \
  "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));"

docker exec postgres-prod psql -U postgres -d production -c \
  "INSERT INTO users (name) VALUES ('Alice'), ('Bob');"

# Restart container (data persists)
docker restart postgres-prod

# Even remove and recreate (data still there!)
docker rm -f postgres-prod

docker run -d \
  --name postgres-prod-new \
  -e POSTGRES_PASSWORD=secret123 \
  -v postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15

# Data still exists
docker exec postgres-prod-new psql -U postgres -d production -c "SELECT * FROM users;"
```

---

### Example 2: WordPress with Separate Volumes

```bash
# Create volumes
docker volume create wp-db-data
docker volume create wp-content

# Run MySQL
docker run -d \
  --name wp-db \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=wordpress \
  -e MYSQL_USER=wpuser \
  -e MYSQL_PASSWORD=wppass \
  -v wp-db-data:/var/lib/mysql \
  mysql:8

# Run WordPress
docker run -d \
  --name wordpress \
  --link wp-db:mysql \
  -e WORDPRESS_DB_HOST=mysql \
  -e WORDPRESS_DB_USER=wpuser \
  -e WORDPRESS_DB_PASSWORD=wppass \
  -e WORDPRESS_DB_NAME=wordpress \
  -v wp-content:/var/www/html/wp-content \
  -p 8080:80 \
  wordpress:latest

# Both database and uploads persist!
```

---

### Example 3: Development with Bind Mounts

```bash
# Project directory
my-flask-app/
├── app.py
├── templates/
└── static/

# Run with bind mounts for live development
docker run -d \
  --name flask-dev \
  -p 5000:5000 \
  -v $(pwd)/app.py:/app/app.py \
  -v $(pwd)/templates:/app/templates \
  -v $(pwd)/static:/app/static \
  -e FLASK_ENV=development \
  -e FLASK_DEBUG=1 \
  my-flask-app:dev

# Edit files on host → immediately reflected in container
```

---

### Example 4: Nginx with Config and Logs

```bash
# Create directories
mkdir -p ~/nginx/{conf,html,logs}

# Create config
cat > ~/nginx/conf/nginx.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF

# Create website
echo "<h1>My Site</h1>" > ~/nginx/html/index.html

# Run with multiple bind mounts
docker run -d \
  --name nginx-custom \
  -p 8080:80 \
  -v ~/nginx/conf/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  -v ~/nginx/html:/usr/share/nginx/html:ro \
  -v ~/nginx/logs:/var/log/nginx \
  nginx:latest

# View logs on host
tail -f ~/nginx/logs/access.log
```

---

## 🔍 Volume Drivers

**Volume Drivers**: Enable different storage backends.

### Local Driver (Default)

```bash
# Default driver
docker volume create my-volume

# Explicit local driver
docker volume create --driver local my-volume
```

---

### NFS Driver Example

```bash
# Create NFS volume
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/nfs/share \
  nfs-volume

# Use in container
docker run -d -v nfs-volume:/data alpine
```

---

### Third-Party Drivers

**Popular Volume Drivers**:
- **REX-Ray**: Cloud storage (AWS EBS, Azure Disk)
- **Portworx**: Enterprise container storage
- **GlusterFS**: Distributed filesystem
- **Ceph**: Distributed storage

```bash
# Install plugin
docker plugin install rexray/ebs

# Create volume with driver
docker volume create --driver rexray/ebs my-ebs-volume
```

---

## ⚠️ Common Pitfalls

### 1. Permission Issues

**Problem**:
```bash
# Container runs as non-root (UID 1000)
# Volume owned by root (UID 0)
# Container can't write!
```

**Solution**:
```bash
# Option 1: Change ownership before mounting
sudo chown -R 1000:1000 /host/path

# Option 2: Use USER in Dockerfile
FROM python:3.11
RUN useradd -m -u 1000 appuser
USER appuser

# Option 3: Use :z or :Z flag (SELinux)
docker run -v /host:/container:z myimage
```

---

### 2. Anonymous Volumes

**Problem**:
```bash
# Dockerfile has VOLUME instruction
FROM postgres:15
VOLUME /var/lib/postgresql/data

# Running without -v creates anonymous volume
docker run postgres:15
# Anonymous volume created: abc123def456

# Hard to manage, left behind after container removal
```

**Solution**: Always use named volumes!
```bash
docker run -v postgres-data:/var/lib/postgresql/data postgres:15
```

---

### 3. Mounting Over Existing Data

**Problem**:
```bash
# Container has files in /app/data
# Mounting volume to /app/data hides those files
docker run -v my-volume:/app/data myimage
# Original /app/data contents invisible!
```

**Solution**: 
- Copy data from image to volume first
- Or mount to different path

---

### 4. Volume Not Created Before Use

**Problem**:
```bash
# Volume doesn't exist
docker run -v non-existent:/data alpine
# Docker creates it (empty!)
# But you expected existing data
```

**Solution**: Create volumes explicitly
```bash
docker volume create my-volume
docker run -v my-volume:/data alpine
```

---

## 🛠️ Best Practices

### 1. Use Named Volumes for Production

```bash
# Good
docker volume create prod-db-data
docker run -v prod-db-data:/var/lib/postgresql/data postgres:15

# Bad (anonymous volume)
docker run -v /var/lib/postgresql/data postgres:15
```

---

### 2. Bind Mounts for Development Only

```bash
# Development: OK
docker run -v $(pwd)/src:/app/src my-app:dev

# Production: Use volumes or COPY in Dockerfile
docker run -v app-data:/app/data my-app:prod
```

---

### 3. Read-Only Mounts When Possible

```bash
# Config files should be read-only
docker run -v ~/config.yaml:/app/config.yaml:ro my-app

# Prevents container from modifying config
```

---

### 4. Label Volumes

```bash
# Create with labels
docker volume create \
  --label project=myapp \
  --label environment=production \
  --label backup=daily \
  myapp-prod-data

# Find volumes by label
docker volume ls --filter label=project=myapp
```

---

### 5. Regular Backups

```bash
# Automated backup with cron
0 2 * * * /scripts/backup-volumes.sh

# Script backs up all volumes with label backup=daily
```

---

## 🔗 What's Next?

Now that you understand Docker storage:

**Networking**:
- **[docker-networking](docker-networking)** - Container networking deep dive

**Multi-Container**:
- **[docker-compose-intro](docker-compose-intro)** - Define multi-container apps

**Advanced Volumes**:
- **[docker-volume-drivers](docker-volume-drivers)** - Custom storage backends

---

## 📚 Resources

**Official Docs**:
- [Docker Volumes](https://docs.docker.com/storage/volumes/)
- [Bind Mounts](https://docs.docker.com/storage/bind-mounts/)
- [tmpfs Mounts](https://docs.docker.com/storage/tmpfs/)

**Tools**:
- [Velero](https://velero.io/) - Backup and restore
- [Restic](https://restic.net/) - Backup tool

---

## 📝 Change Log

### 2026-01-30
- Created Docker volumes article
- Covered three storage types (volumes, bind mounts, tmpfs)
- Explained volume management commands
- Included backup/restore strategies
- Provided real-world examples (Postgres, WordPress, development)
- Added troubleshooting for common issues
- Included best practices for production

---

**Next Article**: [docker-networking](docker-networking) - Master container networking!

