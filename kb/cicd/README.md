# CI/CD - Continuous Integration & Deployment

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: CI/CD & GitOps  
**Prerequisites**: [kb/basics/git-fundamentals](../basics/git-fundamentals), [kb/containers/docker-basics](../containers/docker-basics)  
**Tags**: ci-cd, forgejo, woodpecker-ci, gitops, automation, pipelines, self-hosted

## Summary

Complete learning path for Continuous Integration and Continuous Deployment using **self-hosted, open-source tools**. Focus on Forgejo (Git hosting) + Woodpecker CI (pipelines) as the GitLab/GitHub Actions alternative for homelabs and small-medium teams.

## 🎯 Learning Philosophy

**Git → CI → CD → GitOps**:
```
Git Basics → Forgejo Setup → Woodpecker CI → Auto Deploy → GitOps
 (Version)    (Self-Host)     (Pipelines)    (Delivery)   (Production)
```

This directory teaches CI/CD assuming **basic Git knowledge** but no prior CI/CD experience. Progression from manual builds through fully automated GitOps deployments.

## 📚 Learning Path

```
Prerequisites: Git fundamentals, Docker basics
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: CI/CD Concepts               │
│  ├─ What is CI/CD?                     │
│  ├─ Build → Test → Deploy              │
│  ├─ Why automation matters             │
│  ├─ Manual vs automated workflows      │
│  └─ Self-hosted vs cloud services      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Forgejo (Git Hosting)        │
│  ├─ Self-hosted Git (GitHub alt)       │
│  ├─ Forgejo installation               │
│  ├─ User/organization management       │
│  ├─ Repository setup                   │
│  ├─ Access control & SSH keys          │
│  └─ Webhooks integration               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Woodpecker CI                │
│  ├─ Container-native CI/CD             │
│  ├─ Woodpecker installation            │
│  ├─ First pipeline (.woodpecker.yml)   │
│  ├─ Build steps & Docker images        │
│  ├─ Testing automation                 │
│  └─ Secrets management                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: Advanced Pipelines          │
│  ├─ Multi-stage builds                 │
│  ├─ Matrix builds (multi-platform)     │
│  ├─ Caching strategies                 │
│  ├─ Building Docker images             │
│  ├─ Publishing to Harbor registry      │
│  └─ Deployment automation              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: GitOps & Production          │
│  ├─ GitOps principles                  │
│  ├─ Infrastructure as Code integration │
│  ├─ Kubernetes/k0s deployments         │
│  ├─ Rollback strategies                │
│  ├─ Monitoring & alerting              │
│  └─ Production best practices          │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: CI/CD Fundamentals (Start Here)

**Understanding the Basics**:
1. **[cicd-concepts](cicd-concepts)** - What is CI/CD and why it matters
   - Continuous Integration explained
   - Continuous Deployment vs Delivery
   - Traditional vs modern workflows
   - Benefits and tradeoffs
   - **Prerequisites**: None
   - **Time**: 1 hour
   - **Resources**: `[██░░░░░░░░]` 20% - Conceptual

2. **[manual-vs-automated](manual-vs-automated)** - Why automate your workflow
   - Manual deployment pain points
   - Automation benefits
   - When to automate
   - Cost-benefit analysis
   - **Prerequisites**: Development experience
   - **Time**: 1 hour
   - **Resources**: `[██░░░░░░░░]` 20%

3. **[self-hosted-vs-cloud](self-hosted-vs-cloud)** - Self-hosted CI/CD advantages
   - GitHub Actions vs Woodpecker
   - GitLab CI/CD vs self-hosted
   - Privacy and control
   - Cost comparison
   - **Prerequisites**: CI/CD concepts
   - **Time**: 1 hour
   - **Resources**: `[██░░░░░░░░]` 20%

### 🟡 Phase 2: Forgejo (Self-Hosted Git)

4. **[forgejo-introduction](forgejo-introduction)** - Forgejo as GitHub alternative
   - What is Forgejo (Gitea fork)
   - Why Forgejo over Gitea/GitLab
   - Feature comparison
   - Use cases
   - **Prerequisites**: Git basics
   - **Time**: 1 hour
   - **Resources**: `[██░░░░░░░░]` 20%

5. **[forgejo-installation](forgejo-installation)** - Installing Forgejo
   - Docker compose setup
   - Reverse proxy (Traefik/Caddy)
   - Database configuration
   - Initial admin setup
   - SSL/TLS configuration
   - **Prerequisites**: Docker basics
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50% - 2GB RAM

6. **[forgejo-organization](forgejo-organization)** - Organizing repositories
   - Creating organizations
   - Team management
   - Repository permissions
   - SSH key management
   - Webhook configuration
   - **Prerequisites**: Forgejo installed
   - **Time**: 2 hours
   - **Resources**: `[███░░░░░░░]` 30%

7. **[migrating-to-forgejo](migrating-to-forgejo)** - Migrate from GitHub/GitLab
   - Repository migration tools
   - Preserving history
   - Updating CI/CD configs
   - Team transition
   - **Prerequisites**: Existing Git repos
   - **Time**: 2-4 hours
   - **Resources**: `[████░░░░░░]` 40%

### 🟠 Phase 3: Woodpecker CI (Pipeline Automation)

8. **[woodpecker-introduction](woodpecker-introduction)** - Container-native CI/CD
   - What is Woodpecker CI
   - Drone CI fork benefits
   - Architecture overview
   - Forgejo integration
   - **Prerequisites**: CI/CD concepts
   - **Time**: 1 hour
   - **Resources**: `[██░░░░░░░░]` 20%

9. **[woodpecker-installation](woodpecker-installation)** - Installing Woodpecker
   - Docker compose deployment
   - Forgejo OAuth setup
   - Agent configuration
   - First repository activation
   - **Prerequisites**: Forgejo running
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50% - 2GB RAM

10. **[first-pipeline](first-pipeline)** - Your first .woodpecker.yml
    - Pipeline syntax basics
    - Build steps
    - Docker image selection
    - Testing commands
    - Pipeline execution
    - **Prerequisites**: Woodpecker installed
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

11. **[pipeline-syntax](pipeline-syntax)** - Woodpecker YAML deep dive
    - Pipeline structure
    - Step configuration
    - Environment variables
    - Conditional execution
    - Services (databases, Redis)
    - **Prerequisites**: First pipeline
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

12. **[secrets-management](secrets-management)** - Secure secrets in pipelines
    - Adding secrets to Woodpecker
    - Environment-specific secrets
    - Using secrets in steps
    - Security best practices
    - Cross-reference: [kb/security/vault-basics](../security/vault-basics)
    - **Prerequisites**: Pipeline basics
    - **Time**: 2 hours
    - **Resources**: `[████░░░░░░]` 40%

### 🔴 Phase 4: Advanced Pipelines (Power User)

13. **[matrix-builds](matrix-builds)** - Multi-platform testing
    - Matrix strategy explained
    - Testing multiple versions
    - Cross-platform builds
    - Parallel execution
    - **Prerequisites**: Pipeline syntax
    - **Time**: 2-3 hours
    - **Resources**: `[██████░░░░]` 60%

14. **[caching-strategies](caching-strategies)** - Speed up pipelines
    - Volume caching
    - Dependency caching
    - Docker layer caching
    - Cache invalidation
    - **Prerequisites**: Advanced pipelines
    - **Time**: 2 hours
    - **Resources**: `[█████░░░░░]` 50%

15. **[building-docker-images](building-docker-images)** - Build containers in CI
    - Docker-in-Docker
    - BuildKit usage
    - Multi-stage builds
    - Image tagging strategies
    - Pushing to Harbor registry
    - **Prerequisites**: Docker fundamentals
    - **Time**: 3-4 hours
    - **Resources**: `[███████░░░]` 70%

16. **[testing-automation](testing-automation)** - Automated test suites
    - Unit tests in pipeline
    - Integration tests
    - Linting and formatting
    - Code coverage
    - Test reports
    - **Prerequisites**: Testing knowledge
    - **Time**: 4-5 hours
    - **Resources**: `[██████░░░░]` 60%

17. **[deployment-patterns](deployment-patterns)** - Deploy from CI
    - SSH deployments
    - Docker compose deployments
    - Kubernetes/k0s deployments
    - Blue-green deployments
    - Canary releases
    - **Prerequisites**: Infrastructure knowledge
    - **Time**: 4-6 hours
    - **Resources**: `[████████░░]` 80%

### ⚫ Phase 5: GitOps & Production (Enterprise-Ready)

18. **[gitops-principles](gitops-principles)** - Git as source of truth
    - What is GitOps
    - Git-centric workflow
    - Declarative configuration
    - Reconciliation loops
    - **Prerequisites**: K8s or infrastructure basics
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

19. **[gitops-with-argocd](gitops-with-argocd)** - ArgoCD for k0s
    - ArgoCD installation on k0s
    - Application definitions
    - Sync strategies
    - Self-healing apps
    - **Prerequisites**: k0s cluster
    - **Time**: 4-5 hours
    - **Resources**: `[████████░░]` 80%

20. **[monitoring-pipelines](monitoring-pipelines)** - CI/CD observability
    - Pipeline metrics
    - Failed build alerts
    - Slack/Discord notifications
    - Prometheus metrics
    - Grafana dashboards
    - Cross-reference: [kb/observability/](../observability/)
    - **Prerequisites**: CI/CD running
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

21. **[production-best-practices](production-best-practices)** - Production CI/CD
    - Environment promotion
    - Approval workflows
    - Rollback strategies
    - Security scanning
    - Compliance auditing
    - **Prerequisites**: Production experience
    - **Time**: 4-6 hours
    - **Resources**: `[█████████░]` 90%

## 🔗 What Comes Next?

After mastering CI/CD:

**For Infrastructure Automation**:
- **[kb/infrastructure/ansible-basics](../infrastructure/ansible-basics)** - Deploy with Ansible
- **[kb/infrastructure/terraform-basics](../infrastructure/terraform-basics)** - Provision with Terraform
- **[kb/infrastructure/gitops-infrastructure](../infrastructure/gitops-infrastructure)** - GitOps for infra

**For Container Orchestration**:
- **[kb/containers/k0s-installation](../containers/k0s-installation)** - Deploy to k0s
- **[kb/containers/k0s-deployments](../containers/k0s-deployments)** - k8s deployments

**For Security**:
- **[kb/security/vault-basics](../security/vault-basics)** - Vault for secrets
- **[kb/security/container-scanning](../security/container-scanning)** - Image security

**For Monitoring**:
- **[kb/observability/prometheus-grafana](../observability/prometheus-grafana)** - Monitor pipelines

## 📊 Resource Requirements

**Forgejo**:
- **Minimal**: 512MB RAM, 1 CPU, 5GB disk `[███░░░░░░░]` 30%
- **Comfortable**: 1GB RAM, 2 CPU, 20GB disk `[████░░░░░░]` 40%
- **Production**: 2GB RAM, 2 CPU, 50GB disk `[██████░░░░]` 60%

**Woodpecker CI Server**:
- **Minimal**: 512MB RAM, 1 CPU `[███░░░░░░░]` 30%
- **Comfortable**: 1GB RAM, 2 CPU `[████░░░░░░]` 40%

**Woodpecker CI Agent** (per agent):
- **Minimal**: 1GB RAM, 1 CPU `[████░░░░░░]` 40%
- **Comfortable**: 2GB RAM, 2 CPU `[█████░░░░░]` 50%
- **Heavy builds**: 4GB RAM, 4 CPU `[███████░░░]` 70%

**Complete Stack** (Forgejo + Woodpecker + Agent):
- **Minimal**: 3GB RAM, 3 CPU `[█████░░░░░]` 50%
- **Comfortable**: 6GB RAM, 4 CPU `[███████░░░]` 70%
- **Production**: 8GB+ RAM, 6+ CPU `[████████░░]` 80%

**Learning Time Investment**:
- **CI/CD Concepts**: 1 week `[███░░░░░░░]` 30%
- **Forgejo Setup**: 1 week `[████░░░░░░]` 40%
- **Woodpecker Basics**: 2 weeks `[█████░░░░░]` 50%
- **Advanced Pipelines**: 3-4 weeks `[███████░░░]` 70%
- **GitOps Production**: 2-3 months `[█████████░]` 90%
- **CI/CD Mastery**: 6-12 months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**Core Stack** (Required):
- **Forgejo** `[██████████]` Required - Git hosting
- **Woodpecker CI** `[██████████]` Required - Pipeline runner
- **Docker** `[██████████]` Required - Container runtime

**Supporting Tools**:
- **Harbor** `[████████░░]` 80% - Container registry
- **Traefik/Caddy** `[████████░░]` 80% - Reverse proxy
- **PostgreSQL** `[███████░░░]` 70% - Database (vs SQLite)
- **Redis** `[█████░░░░░]` 50% - Caching (optional)

**GitOps Tools**:
- **ArgoCD** `[████████░░]` 80% - k8s GitOps
- **Flux** `[███████░░░]` 70% - Alternative to ArgoCD
- **Ansible** `[████████░░]` 80% - VM deployments

**Alternatives to Consider**:
- **Gitea** `[███████░░░]` 70% - If Forgejo too new
- **Drone CI** `[██████░░░░]` 60% - Woodpecker upstream
- **Jenkins** `[████░░░░░░]` 40% - Classic but heavy
- **Concourse CI** `[█████░░░░░]` 50% - Complex but powerful

## 💡 Pro Tips for CI/CD

1. **Start Simple**: One repo, one pipeline, manual deploy first
2. **Version Pipelines**: Pipeline configs in Git, versioned with code
3. **Fail Fast**: Quick feedback loops, fail early in pipeline
4. **Idempotent Builds**: Same input → same output, always
5. **Secrets Never in Git**: Use secret management, never commit
6. **Monitor Everything**: Pipeline metrics, build times, failure rates
7. **Cache Aggressively**: Dependencies, build artifacts, Docker layers
8. **Test Locally**: Run pipelines locally before pushing
9. **Document Processes**: README with build/deploy instructions
10. **Automate Incrementally**: Build → Test → Deploy, step by step

## 🔄 Common Learning Pitfalls

**Pitfall 1: Over-Automating Too Soon**
- Automating before understanding process
- **Fix**: Manual first, document, then automate

**Pitfall 2: No Testing in Pipeline**
- Deploying without tests
- **Fix**: Add tests before auto-deploy

**Pitfall 3: Secrets in Git**
- Committing API keys, passwords
- **Fix**: Use Woodpecker secrets, Vault

**Pitfall 4: No Rollback Plan**
- Breaking production with no undo
- **Fix**: Blue-green deployments, versioned releases

**Pitfall 5: Ignoring Pipeline Failures**
- Broken main branch, ignoring red builds
- **Fix**: Fix immediately, never merge broken code

**Pitfall 6: Complex Pipelines**
- Overly complicated YAML, hard to debug
- **Fix**: Keep simple, modular, readable

**Pitfall 7: No Local Testing**
- Only testing in CI, slow feedback
- **Fix**: Docker compose local env

**Pitfall 8: Single Agent Bottleneck**
- One agent, long queues
- **Fix**: Multiple agents for parallel builds

## 🔗 Related KB Sections

- **[kb/basics/git-fundamentals](../basics/git-fundamentals)** - Git prerequisite
- **[kb/containers/](../containers/)** - Docker/k0s for deployments
- **[kb/infrastructure/](../infrastructure/)** - IaC integration
- **[kb/security/](../security/)** - Secrets, scanning
- **[kb/observability/](../observability/)** - Pipeline monitoring
- **[kb/gitops/](../gitops/)** - GitOps workflows

## 📝 Change Log

### 2026-01-30
- Created CI/CD directory structure
- Defined complete learning path from concepts to GitOps
- Established Forgejo + Woodpecker as core stack
- Listed all planned articles with time estimates
- Added resource requirements for each component
- Emphasized self-hosted, open-source tools
- Organized by learning phases (1-5)
- Added tool alternatives and comparisons
- Cross-referenced related KB sections
- Included production best practices path

---

**🚀 Remember**: CI/CD transforms development workflow. Automating builds, tests, and deployments saves hours daily, catches bugs early, and enables rapid iteration. Start with Forgejo + Woodpecker for privacy, control, and cost-effectiveness!

