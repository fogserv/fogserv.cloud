# Docker Networking - Container Communication

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Networking  
**Prerequisites**: [docker-basics](docker-basics), [docker-concepts](docker-concepts), [kb/basics/linux-fundamentals](../basics/linux-fundamentals)  
**Time**: 3-4 hours  
**Tags**: docker, networking, bridge, host, overlay, macvlan, dns

## Summary

Master Docker networking to connect containers, expose services, and build multi-tier applications. Learn network drivers, DNS resolution, port mapping, network isolation, and troubleshooting container connectivity.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Docker network drivers
- ✅ Create and manage custom networks
- ✅ Connect containers to networks
- ✅ Configure port mapping and exposure
- ✅ Use Docker DNS for service discovery
- ✅ Isolate containers with networks
- ✅ Troubleshoot network issues

## 🌐 Docker Network Basics

**Default Behavior**:
```bash
# Run container without network flags
docker run -d --name web nginx

# Container gets:
# - Private IP address
# - Connected to default bridge network
# - Can reach internet
# - NOT accessible from host (unless ports mapped)
```

---

## 🔌 Network Drivers

Docker provides several network drivers:

### Quick Comparison

| Driver | Use Case | Container-to-Container | External Access | Performance |
|--------|----------|----------------------|-----------------|-------------|
| **bridge** | Single host | By IP only (default) | Port mapping | Good |
| **user-defined bridge** | Single host apps | By name (DNS!) | Port mapping | Good |
| **host** | Performance | N/A | Direct | Best |
| **overlay** | Swarm/multi-host | By name | Port mapping | Good |
| **macvlan** | Legacy apps | Like physical network | Direct | Good |
| **none** | Maximum isolation | None | None | N/A |

---

## 🌉 Bridge Network (Default)

**Bridge Network**: Default network for containers.

**Characteristics**:
- Containers get private IPs (172.17.0.0/16 range)
- Containers can reach each other by IP
- **NO DNS resolution** between containers
- Need port mapping for external access

### Default Bridge Network

```bash
# Run containers on default bridge
docker run -d --name web1 nginx
docker run -d --name web2 nginx

# Get IPs
docker inspect web1 | grep IPAddress
# "IPAddress": "172.17.0.2"

docker inspect web2 | grep IPAddress
# "IPAddress": "172.17.0.3"

# Containers can ping by IP
docker exec web1 ping 172.17.0.3
# Works!

# But NOT by name (no DNS)
docker exec web1 ping web2
# Fails! ❌
```

---

### User-Defined Bridge (Recommended)

**User-Defined Bridge**: Custom bridge network with DNS!

```bash
# Create custom bridge network
docker network create my-network

# Run containers on custom network
docker run -d --name web --network my-network nginx
docker run -d --name db --network my-network postgres:15

# Containers can reach each other BY NAME! 🎉
docker exec web ping db
# Works! DNS resolves db → IP

docker exec db ping web
# Works! DNS resolves web → IP
```

**Why Custom Bridge?**:
- ✅ Automatic DNS resolution (use container names)
- ✅ Better isolation (separate from default bridge)
- ✅ Can connect/disconnect containers dynamically
- ✅ Better control over IP range and options

---

## 🏗️ Network Management

### Create Network

```bash
# Basic custom network
docker network create my-app-network

# With subnet
docker network create \
  --subnet=192.168.100.0/24 \
  --gateway=192.168.100.1 \
  my-network

# With IP range
docker network create \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.1.0/24 \
  my-network
```

---

### List Networks

```bash
# List all networks
docker network ls

# Output:
NETWORK ID     NAME              DRIVER    SCOPE
3f7a8c9b2e1d   bridge            bridge    local
5a8d3e2f1c4b   host              host      local
7d9e4f3a2b1c   none              null      local
abc123def456   my-app-network    bridge    local
```

---

### Inspect Network

```bash
# Get network details
docker network inspect my-app-network

# See connected containers
docker network inspect my-app-network | grep -A 10 Containers

# Formatted output
docker network inspect --format='{{range .Containers}}{{.Name}} {{end}}' my-app-network
```

---

### Connect Container to Network

```bash
# Connect existing container to network
docker network connect my-network my-container

# Container now on multiple networks!

# Connect with custom IP
docker network connect --ip 192.168.100.10 my-network my-container

# Connect with alias (additional DNS name)
docker network connect --alias db-master my-network my-postgres
```

---

### Disconnect Container

```bash
# Disconnect container from network
docker network disconnect my-network my-container
```

---

### Remove Network

```bash
# Remove network (no containers connected)
docker network rm my-network

# Remove all unused networks
docker network prune
```

---

## 🔌 Port Mapping

**Port Mapping**: Expose container ports to host.

### Basic Port Mapping

```bash
# Map host port 8080 → container port 80
docker run -d -p 8080:80 --name web nginx

# Access from host
curl http://localhost:8080
```

**Syntax**:
```
-p HOST_PORT:CONTAINER_PORT
```

---

### Advanced Port Mapping

```bash
# Bind to specific host IP
docker run -d -p 127.0.0.1:8080:80 nginx
# Only accessible from localhost

# Map to random host port
docker run -d -p 80 nginx
# Docker assigns random high port (e.g., 32768)

# Find assigned port
docker port my-container
# 80/tcp -> 0.0.0.0:32768

# Multiple port mappings
docker run -d \
  -p 8080:80 \
  -p 8443:443 \
  nginx

# UDP port
docker run -d -p 53:53/udp dns-server

# Multiple interfaces
docker run -d \
  -p 192.168.1.10:8080:80 \
  -p 10.0.0.10:8080:80 \
  nginx
```

---

## 🎯 Real-World Network Examples

### Example 1: Web App with Database

```bash
# Create network
docker network create app-network

# Run database (no ports exposed to host!)
docker run -d \
  --name postgres \
  --network app-network \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

# Run web app
docker run -d \
  --name webapp \
  --network app-network \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://postgres:secret@postgres:5432/app \
  my-webapp:latest

# Web app connects to postgres by name
# Only port 8080 exposed to outside
```

---

### Example 2: Microservices Architecture

```bash
# Create network
docker network create microservices

# Frontend
docker run -d \
  --name frontend \
  --network microservices \
  -p 80:80 \
  frontend-app:latest

# Auth service (internal only)
docker run -d \
  --name auth \
  --network microservices \
  -e JWT_SECRET=secret123 \
  auth-service:latest

# User service (internal only)
docker run -d \
  --name users \
  --network microservices \
  -e DATABASE_URL=postgresql://db:5432/users \
  user-service:latest

# Database (internal only)
docker run -d \
  --name db \
  --network microservices \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

# All services communicate by name
# Only frontend accessible from outside
```

---

### Example 3: Development with Multiple Networks

```bash
# Frontend network
docker network create frontend-net

# Backend network
docker network create backend-net

# Database (backend only)
docker run -d \
  --name db \
  --network backend-net \
  postgres:15

# API (both networks)
docker run -d \
  --name api \
  --network backend-net \
  my-api:latest

docker network connect frontend-net api

# Web (frontend only)
docker run -d \
  --name web \
  --network frontend-net \
  -p 8080:80 \
  my-web:latest

# Result:
# - web can reach api (both on frontend-net)
# - api can reach db (both on backend-net)
# - web CANNOT reach db (isolated!)
```

---

## 🏠 Host Network Driver

**Host Network**: Container uses host's network directly.

**Characteristics**:
- No network isolation
- Container shares host's IP
- Best performance (no NAT overhead)
- No port mapping needed

```bash
# Run with host network
docker run -d --network host nginx

# Container binds to host's ports directly
# Access via host's IP:
curl http://<host-ip>:80
```

**Use Cases**:
- Performance-critical applications
- Network monitoring tools
- Simple single-container deployments

**Limitations**:
- No port mapping (uses host ports directly)
- Less isolation
- Port conflicts possible

---

## 🚫 None Network Driver

**None Network**: No networking.

```bash
# Run with no network
docker run -d --network none alpine sleep infinity

# Container has no network interfaces (except loopback)
docker exec my-container ip addr
# Only lo (127.0.0.1)
```

**Use Cases**:
- Maximum isolation
- Security-sensitive workloads
- Containers that don't need network

---

## 🔍 DNS and Service Discovery

### Automatic DNS

**User-defined bridges provide automatic DNS**:

```bash
# Create network
docker network create app-net

# Run services
docker run -d --name web --network app-net nginx
docker run -d --name api --network app-net my-api:latest
docker run -d --name db --network app-net postgres:15

# Services resolve each other by name
docker exec web ping api     # Works!
docker exec api ping db      # Works!
docker exec db ping web      # Works!
```

---

### DNS Aliases

**Add multiple DNS names**:

```bash
# Run with alias
docker run -d \
  --name postgres-primary \
  --network app-net \
  --network-alias db \
  --network-alias database \
  postgres:15

# Can reach by any name:
docker exec app ping postgres-primary  # Works
docker exec app ping db                # Works
docker exec app ping database          # Works
```

---

### Custom DNS Servers

```bash
# Use custom DNS server
docker run -d \
  --dns 8.8.8.8 \
  --dns 1.1.1.1 \
  nginx

# Add DNS search domains
docker run -d \
  --dns-search example.com \
  --dns-search internal.example.com \
  nginx
```

---

## 🔬 Network Troubleshooting

### Check Container Network

```bash
# Get container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-container

# Get all network info
docker inspect my-container | grep -A 20 NetworkSettings

# Check which networks container is on
docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' my-container
```

---

### Test Connectivity

```bash
# Ping another container
docker exec my-container ping other-container

# Check DNS resolution
docker exec my-container nslookup other-container

# Test HTTP connectivity
docker exec my-container curl http://other-container:8080

# Check open ports
docker exec my-container netstat -tulpn
```

---

### Debug Network Issues

```bash
# Run temporary debug container
docker run --rm -it --network my-network nicolaka/netshoot

# Inside debug container:
# - ping other containers
# - nslookup container-name
# - curl http://container-name
# - tcpdump
# - traceroute
```

---

### Common Issues

**Issue 1: Containers Can't Communicate**

```bash
# Check if on same network
docker network inspect my-network

# Solution: Connect to same network
docker network connect my-network container1
docker network connect my-network container2
```

**Issue 2: DNS Not Working**

```bash
# Default bridge doesn't have DNS
# Solution: Use custom network
docker network create my-net
docker run --network my-net ...
```

**Issue 3: Port Already in Use**

```bash
# Check what's using port
sudo netstat -tulpn | grep :8080

# Solution: Use different host port
docker run -p 8081:80 nginx
```

---

## 🏷️ Network Labels and Metadata

```bash
# Create network with labels
docker network create \
  --label project=myapp \
  --label environment=production \
  myapp-prod-network

# Filter networks by label
docker network ls --filter label=project=myapp

# Inspect labels
docker network inspect myapp-prod-network | grep -A 5 Labels
```

---

## ⚙️ Advanced Network Options

### Internal Networks

**Internal Network**: No external connectivity.

```bash
# Create internal network (no internet access)
docker network create --internal secure-network

# Containers can reach each other but not internet
docker run -d --name db --network secure-network postgres:15

docker exec db ping google.com
# Fails! No external access
```

---

### IPv6 Networks

```bash
# Enable IPv6
docker network create \
  --ipv6 \
  --subnet=2001:db8:1::/64 \
  my-ipv6-network

# Run container with IPv6
docker run -d --network my-ipv6-network nginx
```

---

### Network Scopes

```bash
# Local scope (single host)
docker network create --scope local my-local-net

# Swarm scope (multi-host) - requires Swarm mode
docker network create --scope swarm --driver overlay my-overlay-net
```

---

## 💡 Best Practices

### 1. Use Custom Networks

```bash
# Good: Custom network with DNS
docker network create my-app
docker run --network my-app --name web nginx
docker run --network my-app --name db postgres

# Bad: Default bridge (no DNS)
docker run --name web nginx
docker run --name db postgres
```

---

### 2. Network Isolation

```bash
# Separate networks for different tiers
docker network create frontend
docker network create backend

# API server on both (gateway)
docker run --name api --network backend my-api
docker network connect frontend api

# Web on frontend only
docker run --network frontend --name web my-web

# DB on backend only (isolated!)
docker run --network backend --name db postgres
```

---

### 3. Don't Expose Unnecessary Ports

```bash
# Good: Only expose what's needed
docker run -d \
  --name db \
  --network app-net \
  postgres:15
# No -p flag! Only accessible within network

# Bad: Exposing database to world
docker run -d \
  -p 5432:5432 \
  postgres:15
# Now anyone can try to connect! 😱
```

---

### 4. Use Network Aliases

```bash
# Primary database
docker run -d \
  --name postgres-01 \
  --network app-net \
  --network-alias db \
  --network-alias primary \
  postgres:15

# App connects to "db" or "primary"
# Easy to swap instances
```

---

## 🔗 What's Next?

Now that you understand Docker networking:

**Multi-Container Apps**:
- **[docker-compose-intro](docker-compose-intro)** - Define multi-container applications

**Advanced Networking**:
- **[docker-overlay-networks](docker-overlay-networks)** - Multi-host networking

**Container Orchestration**:
- **[k0s-introduction](k0s-introduction)** - Kubernetes networking

---

## 📚 Resources

**Official Docs**:
- [Docker Networking](https://docs.docker.com/network/)
- [Network Drivers](https://docs.docker.com/network/drivers/)
- [Network Commands](https://docs.docker.com/engine/reference/commandline/network/)

**Tools**:
- [netshoot](https://github.com/nicolaka/netshoot) - Network troubleshooting container
- [Weave](https://www.weave.works/) - Container networking

---

## 📝 Change Log

### 2026-01-30
- Created Docker networking article
- Covered all network drivers (bridge, host, overlay, macvlan, none)
- Explained custom networks and DNS
- Included port mapping patterns
- Provided multi-tier architecture examples
- Added comprehensive troubleshooting section
- Included best practices for production

---

**Next Article**: [docker-compose-intro](docker-compose-intro) - Simplify multi-container apps!

