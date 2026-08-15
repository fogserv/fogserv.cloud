# Containers - Docker & Kubernetes Learning Path

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containerization & Orchestration  
**Prerequisites**: [kb/basics/](../basics/) - Linux and command-line fundamentals  
**Tags**: docker, kubernetes, k0s, containers, orchestration, microservices

## Summary

Complete learning path for containerization technologies, from Docker basics through Kubernetes/k0s orchestration. Assumes basic Linux knowledge and teaches containerization from first principles with practical, self-hosted focus using lean tools.

## 🎯 Learning Philosophy

**Start Simple, Scale Gradually**:
```
Single Container → docker-compose Stacks → k0s Orchestration → Production
    (Day 1)            (Week 1)               (Month 1)          (Month 3)
```

This directory teaches containers assuming **zero containerization knowledge**, progressing from "what is a container?" to running production workloads on k0s (homelab-light Kubernetes).

## 📚 Learning Path

```
Prerequisites: Linux Basics (kb/basics/)
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: Docker Fundamentals          │
│  ├─ What are containers?               │
│  ├─ Docker installation                │
│  ├─ Running first container            │
│  ├─ Building images (Dockerfile)       │
│  └─ Docker CLI essentials              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Docker Compose               │
│  ├─ Multi-container applications       │
│  ├─ docker-compose.yml                 │
│  ├─ Volumes & persistence              │
│  ├─ Networking                          │
│  └─ Real-world stacks                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Why Orchestration?           │
│  ├─ Limitations of docker-compose      │
│  ├─ When to use orchestration          │
│  ├─ Kubernetes concepts intro          │
│  └─ k0s as learning platform           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: k0s Fundamentals             │
│  ├─ k0s vs k8s vs k3s                  │
│  ├─ Single-node k0s setup              │
│  ├─ Core concepts (Pods, Services)     │
│  ├─ Deployments & scaling              │
│  └─ Basic kubectl usage                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Advanced k0s                 │
│  ├─ Multi-node clusters                │
│  ├─ Storage (PersistentVolumes)        │
│  ├─ Service mesh basics (Linkerd)      │
│  ├─ API gateways (Traefik)             │
│  └─ Production patterns                │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: Docker Fundamentals (Start Here)

**Essential First Steps**:
1. **[docker-concepts](docker-concepts)** - What are containers and why they matter
   - Virtual machines vs containers
   - Container benefits and use cases
   - When to use containers
   - **Prerequisites**: Linux basics
   - **Time**: 1 hour
   - **Resources**: `[██░░░░░░░░]` 20% - Conceptual

2. **[docker-installation](docker-installation)** - Installing Docker on Linux
   - Ubuntu/Debian installation
   - RHEL/Rocky/Fedora installation
   - Post-install configuration
   - Verification and hello-world
   - **Prerequisites**: Linux admin basics
   - **Time**: 30 minutes
   - **Resources**: `[███░░░░░░░]` 30% - Minimal VM

3. **[docker-basics](docker-basics)** - Running your first containers
   - docker run command
   - Container lifecycle (start, stop, remove)
   - Viewing logs and stats
   - Attaching to containers
   - Common patterns
   - **Prerequisites**: Docker installed
   - **Time**: 2-3 hours
   - **Resources**: `[███░░░░░░░]` 30%

4. **[dockerfile-guide](dockerfile-guide)** - Building custom images
   - Dockerfile syntax
   - Base images and layers
   - Multi-stage builds
   - Best practices
   - Real examples
   - **Prerequisites**: Docker basics
   - **Time**: 3-4 hours
   - **Resources**: `[████░░░░░░]` 40%

5. **[docker-volumes](docker-volumes)** - Data persistence
   - Volume types
   - Volume management
   - Bind mounts vs volumes
   - Backup strategies
   - **Prerequisites**: Docker basics
   - **Time**: 2 hours
   - **Resources**: `[███░░░░░░░]` 30%

6. **[docker-networking](docker-networking)** - Container networking
   - Network types (bridge, host, none)
   - Creating networks
   - Container communication
   - Port mapping
   - **Prerequisites**: Docker basics
   - **Time**: 2-3 hours
   - **Resources**: `[████░░░░░░]` 40%

### 🟡 Phase 2: Docker Compose (Building Blocks)

7. **[docker-compose-intro](docker-compose-intro)** - Multi-container applications
   - Why docker-compose
   - YAML basics
   - First compose file
   - Common patterns
   - **Prerequisites**: Docker fundamentals complete
   - **Time**: 2 hours
   - **Resources**: `[████░░░░░░]` 40%

8. **[docker-compose-patterns](docker-compose-patterns)** - Real-world stacks
   - Web app + database + cache
   - Development environments
   - Monitoring stacks (Prometheus + Grafana)
   - CI/CD stacks
   - **Prerequisites**: docker-compose basics
   - **Time**: 4-6 hours
   - **Resources**: `[█████░░░░░]` 50%

### 🟠 Phase 3: Why Orchestration? (Transition)

9. **[orchestration-need](orchestration-need)** - When docker-compose isn't enough
   - docker-compose limitations
   - Scaling challenges
   - High availability needs
   - When to use orchestration
   - Cost-benefit analysis
   - **Prerequisites**: docker-compose experience
   - **Time**: 1-2 hours
   - **Resources**: `[██░░░░░░░░]` 20% - Conceptual

10. **[kubernetes-concepts](kubernetes-concepts)** - Kubernetes fundamentals
    - What is Kubernetes
    - Core concepts (Pods, Services, Deployments)
    - Architecture overview
    - k8s vs docker-compose comparison
    - **Prerequisites**: docker-compose
    - **Time**: 2-3 hours
    - **Resources**: `[███░░░░░░░]` 30% - Conceptual

### 🔴 Phase 4: k0s Fundamentals (Homelab Kubernetes)

11. **[k0s-introduction](k0s-introduction)** - k0s as homelab Kubernetes
    - Why k0s over k8s/k3s
    - k0s architecture
    - Single binary benefits
    - Use cases for small teams
    - **Prerequisites**: Kubernetes concepts
    - **Time**: 1 hour
    - **Resources**: `[██░░░░░░░░]` 20%

12. **[k0s-installation](k0s-installation)** - Single-node k0s setup
    - System requirements
    - Installation process
    - k0sctl introduction
    - First cluster
    - kubectl setup
    - **Prerequisites**: Linux admin
    - **Time**: 1-2 hours
    - **Resources**: `[█████░░░░░]` 50% - 2GB RAM, 2 CPU

13. **[k0s-pods-services](k0s-pods-services)** - Core Kubernetes concepts
    - What is a Pod (vs container)
    - Creating Pods
    - Services explained
    - Port mapping in k8s
    - Comparing to docker-compose
    - **Prerequisites**: k0s installed
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

14. **[k0s-deployments](k0s-deployments)** - Managing applications
    - Deployments vs Pods
    - Replica management
    - Rolling updates
    - Rollbacks
    - Health checks
    - **Prerequisites**: Pods & Services
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

15. **[k0s-configmaps-secrets](k0s-configmaps-secrets)** - Configuration management
    - ConfigMaps for config
    - Secrets for sensitive data
    - Environment variables
    - Volume mounts
    - **Prerequisites**: Deployments
    - **Time**: 2 hours
    - **Resources**: `[█████░░░░░]` 50%

16. **[k0s-storage](k0s-storage)** - Persistent storage
    - PersistentVolumes explained
    - PersistentVolumeClaims
    - Storage classes
    - StatefulSets
    - **Prerequisites**: k0s basics
    - **Time**: 3 hours
    - **Resources**: `[██████░░░░]` 60%

### ⚫ Phase 5: Advanced k0s (Production-Ready)

17. **[k0s-multi-node](k0s-multi-node)** - Scaling to multi-node
    - Multi-node architecture
    - High availability
    - Worker nodes
    - Node labels and taints
    - **Prerequisites**: Single-node mastery
    - **Time**: 4-6 hours
    - **Resources**: `[████████░░]` 80% - Multiple VMs

18. **[k0s-ingress](k0s-ingress)** - External access with Traefik
    - Ingress concepts
    - Traefik installation
    - Routing rules
    - TLS termination
    - **Prerequisites**: Services
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

19. **[k0s-helm](k0s-helm)** - Package management with Helm
    - What is Helm
    - Installing Helm
    - Using charts
    - Creating charts
    - **Prerequisites**: k0s basics
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50%

20. **[k0s-monitoring](k0s-monitoring)** - Monitoring k0s clusters
    - Prometheus on k0s
    - Grafana dashboards
    - Cluster metrics
    - Application metrics
    - Cross-reference: [kb/observability/](../observability/)
    - **Prerequisites**: k0s + Helm
    - **Time**: 4 hours
    - **Resources**: `[███████░░░]` 70%

21. **[service-mesh-linkerd](service-mesh-linkerd)** - Service mesh basics
    - What is service mesh
    - Linkerd introduction
    - mTLS between services
    - Traffic management
    - **Prerequisites**: Advanced k0s
    - **Time**: 4-5 hours
    - **Resources**: `[████████░░]` 80%

## 🔗 What Comes Next?

After mastering containers and orchestration:

**For Infrastructure Automation**:
- **[kb/infrastructure/ansible-basics](../infrastructure/ansible-basics)** - Automate k0s deployment
- **[kb/infrastructure/terraform-basics](../infrastructure/terraform-basics)** - Infrastructure as Code

**For CI/CD Integration**:
- **[kb/cicd/forgejo-setup](../cicd/forgejo-setup)** - Self-hosted Git
- **[kb/cicd/woodpecker-ci](../cicd/woodpecker-ci)** - Container-native CI/CD
- **[kb/cicd/harbor-registry](../cicd/harbor-registry)** - Private container registry

**For Security**:
- **[kb/security/container-security](../security/container-security)** - Securing containers
- **[kb/security/k0s-security](../security/k0s-security)** - Kubernetes security

**For Monitoring**:
- **[kb/observability/prometheus-grafana](../observability/prometheus-grafana)** - Full stack monitoring
- **[kb/observability/loki](../observability/loki)** - Log aggregation

## 📊 Resource Requirements

**Docker Development**:
- **Minimal**: 2GB RAM, 2 CPU `[███░░░░░░░]` 30%
- **Comfortable**: 4GB RAM, 4 CPU `[█████░░░░░]` 50%
- **Recommended**: 8GB RAM, 4 CPU `[██████░░░░]` 60%

**docker-compose Stacks**:
- **Small** (2-3 containers): 4GB RAM `[████░░░░░░]` 40%
- **Medium** (4-6 containers): 8GB RAM `[██████░░░░]` 60%
- **Large** (10+ containers): 16GB RAM `[████████░░]` 80%

**k0s Single-Node**:
- **Minimum**: 2GB RAM, 2 CPU, 20GB disk `[█████░░░░░]` 50%
- **Comfortable**: 4GB RAM, 4 CPU, 50GB disk `[███████░░░]` 70%
- **Recommended**: 8GB RAM, 4 CPU, 100GB disk `[████████░░]` 80%

**k0s Multi-Node Cluster**:
- **Controller** (3x): 2GB RAM each `[██████░░░░]` 60%
- **Workers** (3+): 4GB RAM each `[████████░░]` 80%
- **Total**: 18GB+ RAM minimum `[█████████░]` 90%

**Learning Time Investment**:
- **Docker Basics**: 2 weeks `[████░░░░░░]` 40%
- **docker-compose**: 1-2 weeks `[███░░░░░░░]` 30%
- **k0s Basics**: 2-3 weeks `[██████░░░░]` 60%
- **k0s Advanced**: 4-6 weeks `[████████░░]` 80%
- **Production Ready**: 3-6 months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**Essential Tools**:
- **Docker Engine** `[██████████]` Required
- **docker-compose** `[██████████]` Required
- **k0s** `[██████████]` Required
- **kubectl** `[██████████]` Required

**Helpful Tools**:
- **k0sctl** `[████████░░]` 80% - Cluster management
- **Helm** `[████████░░]` 80% - Package manager
- **k9s** `[███████░░░]` 70% - Terminal UI for k8s
- **Lens** `[██████░░░░]` 60% - Desktop UI for k8s
- **dive** `[█████░░░░░]` 50% - Inspect Docker images

**Registry Options**:
- **Docker Hub** `[████░░░░░░]` 40% - Public images
- **Harbor** `[████████░░]` 80% - Self-hosted (recommended)
- **Forgejo Registry** `[██████░░░░]` 60% - Integrated with Git

## 💡 Pro Tips for Learning

1. **Start Small**: Master Docker before k0s. Don't skip fundamentals
2. **Practice Daily**: Run containers every day, build muscle memory
3. **Break Things**: Intentionally break containers/clusters to learn debugging
4. **Read Logs**: Always check logs (`docker logs`, `kubectl logs`)
5. **Use Alpine**: Start with Alpine Linux images (tiny, fast)
6. **Version Everything**: Tag images, version compose files
7. **Think Declarative**: Describe desired state, let tools handle it
8. **Document Commands**: Keep a cheat sheet of commands you use
9. **Join Community**: Docker/k8s Slack, Reddit r/docker, r/kubernetes
10. **Build Real Projects**: Theory + practice = mastery

## 🔄 Common Learning Pitfalls

**Pitfall 1: Skipping Docker Basics**
- Jumping to k8s without Docker understanding
- **Fix**: Complete Docker + docker-compose first

**Pitfall 2: Not Understanding Images vs Containers**
- Treating them as same thing
- **Fix**: Image = blueprint, Container = running instance

**Pitfall 3: Ignoring Volumes**
- Data loss when containers restart
- **Fix**: Use volumes for all persistent data

**Pitfall 4: Exposing Everything**
- Publishing all ports to host
- **Fix**: Use internal networks, only expose what's needed

**Pitfall 5: Running as Root**
- Security risk in containers
- **Fix**: Use non-root users in Dockerfiles

**Pitfall 6: Over-Orchestrating**
- Using k8s when docker-compose sufficient
- **Fix**: Start simple, scale when actually needed

**Pitfall 7: Not Reading Errors**
- Ignoring error messages
- **Fix**: Read full error output, search/ask for help

**Pitfall 8: Forgetting Namespaces**
- Name collisions in k8s
- **Fix**: Use namespaces for logical separation

## 🔗 Related KB Sections

- **[kb/basics/](../basics/)** - Linux fundamentals (prerequisite)
- **[kb/infrastructure/](../infrastructure/)** - IaC for container infrastructure
- **[kb/cicd/](../cicd/)** - CI/CD with containers
- **[kb/security/](../security/)** - Container & k8s security
- **[kb/observability/](../observability/)** - Monitoring containerized apps
- **[kb/networking/](../networking/)** - Reverse proxies, ingress controllers
- **[kb/cloud/](../cloud/)** - Harbor registry, storage for containers

## 📝 Change Log

### 2026-01-30
- Created containers directory structure
- Defined complete learning path from Docker to k0s
- Established progression philosophy (simple → advanced)
- Listed all planned articles with time estimates
- Added resource requirements for each phase
- Included k0s as "homelab light Kubernetes" focus
- Organized by learning phases (1-5)
- Added tool recommendations and common pitfalls
- Cross-referenced related KB sections

---

**🐳 Remember**: Containers are the foundation of modern infrastructure. Master Docker first, understand docker-compose thoroughly, then progress to k0s for orchestration. Every minute spent learning containers pays dividends in infrastructure efficiency!
