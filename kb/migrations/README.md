# Migrations - Moving to Self-Hosted Infrastructure

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Migration Guides  
**Prerequisites**: All relevant KB sections  
**Tags**: migration, docker-hub, github, gitlab, forgejo, harbor, self-hosted, cloud-exit

## Summary

Complete migration guides for moving from commercial services to self-hosted alternatives. Practical step-by-step instructions for Docker Hub → Harbor, GitHub → Forgejo, AWS → MinIO, and more.

## 🎯 Learning Philosophy

**Take Back Control**:
```
Commercial Lock-in → Self-Hosted Freedom → Data Sovereignty
(Monthly fees)      (One-time setup)      (Your rules)
```

This directory provides **battle-tested migration paths** from commercial services to self-hosted alternatives. Each guide includes planning, execution, rollback strategies, and gotchas to avoid.

## 📚 Learning Path

```
Prerequisites: Existing commercial service usage
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: Planning & Assessment        │
│  ├─ Why migrate?                       │
│  ├─ Risk assessment                    │
│  ├─ Resource requirements              │
│  ├─ Downtime planning                  │
│  └─ Rollback strategies                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Container Registries         │
│  ├─ Docker Hub → Harbor migration      │
│  ├─ GitHub Packages → Harbor           │
│  ├─ Image inventory and tagging        │
│  ├─ CI/CD pipeline updates             │
│  └─ Registry cleanup                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Version Control & CI/CD      │
│  ├─ GitHub → Forgejo migration         │
│  ├─ GitLab → Forgejo                   │
│  ├─ Repository structure                │
│  ├─ GitHub Actions → Woodpecker CI     │
│  ├─ Webhook migrations                 │
│  └─ User/team migration                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: Cloud Storage & Services     │
│  ├─ Dropbox → Nextcloud                │
│  ├─ Google Drive → Nextcloud           │
│  ├─ AWS S3 → MinIO                     │
│  ├─ Data transfer strategies           │
│  └─ Sync cutover                       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Complete Infrastructure      │
│  ├─ Cloud VM → Bare metal/Proxmox      │
│  ├─ AWS/GCP → Self-hosted k0s          │
│  ├─ Multi-service migrations           │
│  ├─ DNS and routing updates            │
│  └─ Post-migration validation          │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: Planning & Assessment (Start Here)

**Before You Migrate**:
1. **[migration-planning](migration-planning)** - Strategic planning
   - Why self-host?
   - Cost-benefit analysis
   - Risk assessment
   - Team readiness
   - Success criteria
   - **Prerequisites**: None
   - **Time**: 2-4 hours
   - **Resources**: `[██░░░░░░░░]` 20% - Planning only

2. **[migration-risks](migration-risks)** - Understanding risks
   - Data loss scenarios
   - Downtime impact
   - Compliance considerations
   - Skill gaps
   - Mitigation strategies
   - **Prerequisites**: Planning basics
   - **Time**: 2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

3. **[rollback-strategies](rollback-strategies)** - Plan B
   - When to rollback
   - Rollback procedures
   - Parallel running
   - Testing rollbacks
   - **Prerequisites**: Migration planning
   - **Time**: 2 hours
   - **Resources**: `[███░░░░░░░]` 30%

### 🟡 Phase 2: Container Registries (Docker Images)

4. **[docker-hub-to-harbor](docker-hub-to-harbor)** - Registry migration
   - Pre-migration checklist
   - Harbor setup for migration
   - Image inventory
   - Bulk image transfer
   - Tag preservation
   - Update image references
   - CI/CD pipeline updates
   - Verification testing
   - Gradual cutover
   - **Prerequisites**: Harbor running, Docker Hub account
   - **Time**: 4-6 hours
   - **Resources**: `[██████░░░░]` 60% - Storage for images

5. **[github-packages-to-harbor](github-packages-to-harbor)** - GitHub Container Registry
   - GHCR authentication
   - Package listing
   - Automated migration script
   - GitHub Actions updates
   - **Prerequisites**: Harbor, GitHub account
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

6. **[registry-cleanup](registry-cleanup)** - Post-migration cleanup
   - Identifying unused images
   - Tag cleanup
   - Storage optimization
   - Garbage collection
   - **Prerequisites**: Completed migration
   - **Time**: 2-3 hours
   - **Resources**: `[███░░░░░░░]` 30%

### 🟠 Phase 3: Version Control & CI/CD (Git & Pipelines)

7. **[github-to-forgejo](github-to-forgejo)** - Git hosting migration
   - Repository export from GitHub
   - Forgejo setup
   - Import process
   - User/org migration
   - SSH keys and tokens
   - Webhook recreation
   - GitHub → Forgejo URL updates
   - Issues and PRs migration
   - Wiki migration
   - Release artifacts
   - **Prerequisites**: Forgejo installed, GitHub org admin
   - **Time**: 6-8 hours (per org)
   - **Resources**: `[███████░░░]` 70% - Storage for repos

8. **[gitlab-to-forgejo](gitlab-to-forgejo)** - GitLab alternative
   - GitLab export
   - API-based migration
   - CI/CD variable migration
   - Runner configuration
   - **Prerequisites**: Forgejo, GitLab access
   - **Time**: 6-8 hours
   - **Resources**: `[███████░░░]` 70%

9. **[github-actions-to-woodpecker](github-actions-to-woodpecker)** - CI/CD pipeline migration
   - Workflow syntax comparison
   - Converting .github/workflows to .woodpecker.yml
   - Secret management
   - Matrix builds
   - Caching strategies
   - Docker-in-Docker
   - Testing pipelines
   - **Prerequisites**: Woodpecker CI running, Forgejo repos
   - **Time**: 4-6 hours per workflow
   - **Resources**: `[██████░░░░]` 60%

10. **[gitlab-ci-to-woodpecker](gitlab-ci-to-woodpecker)** - GitLab CI conversion
    - .gitlab-ci.yml conversion
    - Variable mapping
    - Service containers
    - Artifacts handling
    - **Prerequisites**: Woodpecker CI, pipeline knowledge
    - **Time**: 4-6 hours
    - **Resources**: `[██████░░░░]` 60%

### 🔴 Phase 4: Cloud Storage & Services (Data Migration)

11. **[dropbox-to-nextcloud](dropbox-to-nextcloud)** - File sync migration
    - Dropbox data export
    - Nextcloud preparation
    - Bulk file upload
    - Folder structure mapping
    - Share link recreation
    - Client reconfiguration
    - Gradual user migration
    - Verification
    - **Prerequisites**: Nextcloud installed, Dropbox account
    - **Time**: 4-8 hours + transfer time
    - **Resources**: `[███████░░░]` 70% - Storage for files

12. **[google-drive-to-nextcloud](google-drive-to-nextcloud)** - Google Workspace exit
    - Google Takeout
    - rclone for transfer
    - Docs/Sheets conversion
    - Shared drives
    - Team migration
    - **Prerequisites**: Nextcloud, Google account
    - **Time**: 6-10 hours
    - **Resources**: `[████████░░]` 80%

13. **[aws-s3-to-minio](aws-s3-to-minio)** - Object storage migration
    - Bucket inventory
    - MinIO setup with S3 gateway
    - rclone for data transfer
    - IAM policy conversion
    - Application endpoint updates
    - Lifecycle policy migration
    - Testing object access
    - DNS cutover
    - **Prerequisites**: MinIO running, AWS access
    - **Time**: 4-6 hours + transfer
    - **Resources**: `[███████░░░]` 70% - Storage space

14. **[notion-to-obsidian](notion-to-obsidian)** - Note-taking migration
    - Notion export
    - Markdown conversion
    - File attachment handling
    - Obsidian vault setup
    - Link restructuring
    - **Prerequisites**: Notion account
    - **Time**: 3-4 hours
    - **Resources**: `[████░░░░░░]` 40%

### ⚫ Phase 5: Complete Infrastructure (Full Cloud Exit)

15. **[cloud-vm-to-proxmox](cloud-vm-to-proxmox)** - VM migration
    - VM inventory and sizing
    - Proxmox preparation
    - Image export from cloud
    - Proxmox import
    - Network reconfiguration
    - Storage migration
    - Testing and validation
    - DNS updates
    - **Prerequisites**: Proxmox cluster, cloud VMs
    - **Time**: 1-2 days
    - **Resources**: `[█████████░]` 90% - Full cluster

16. **[aws-to-self-hosted](aws-to-self-hosted)** - AWS exit strategy
    - Service inventory (EC2, RDS, S3, etc.)
    - Self-hosted mapping
    - Data export procedures
    - Networking changes
    - Phased migration
    - Cost comparison
    - **Prerequisites**: Infrastructure ready
    - **Time**: 1-4 weeks
    - **Resources**: `[██████████]` 100%

17. **[kubernetes-to-k0s](kubernetes-to-k0s)** - Managed k8s → k0s
    - Workload inventory
    - Manifest export
    - LoadBalancer → Traefik
    - Storage class migration
    - Secrets migration
    - Helm chart adjustments
    - Testing deployments
    - **Prerequisites**: k0s cluster, k8s knowledge
    - **Time**: 2-3 days
    - **Resources**: `[████████░░]` 80%

18. **[heroku-to-self-hosted](heroku-to-self-hosted)** - PaaS to self-hosted
    - Buildpack to Dockerfile
    - Database migration
    - Addon alternatives
    - Environment variables
    - Deployment automation
    - **Prerequisites**: App understanding
    - **Time**: 1-2 days per app
    - **Resources**: `[███████░░░]` 70%

19. **[dns-migration](dns-migration)** - DNS provider migration
    - Zone export
    - Record verification
    - TTL reduction
    - Parallel DNS testing
    - Cutover procedure
    - Rollback DNS
    - **Prerequisites**: Domain ownership
    - **Time**: 2-4 hours + propagation
    - **Resources**: `[███░░░░░░░]` 30%

20. **[email-migration](email-migration)** - Self-hosted email
    - Email backup (IMAP)
    - Mail server setup
    - Account migration
    - DNS records (MX, SPF, DKIM)
    - Testing mail flow
    - Client reconfiguration
    - **Prerequisites**: Mail server (complex!)
    - **Time**: 1-2 days
    - **Resources**: `[████████░░]` 80%

21. **[monitoring-migration](monitoring-migration)** - Observability stack
    - Datadog → Prometheus/Grafana
    - Dashboard conversion
    - Alert rule migration
    - Agent reconfiguration
    - Retention strategy
    - **Prerequisites**: Observability knowledge
    - **Time**: 1-2 days
    - **Resources**: `[██████░░░░]` 60%

22. **[multi-service-migration](multi-service-migration)** - Complex migrations
    - Dependency mapping
    - Migration order
    - Parallel vs sequential
    - Integration testing
    - Rollback coordination
    - **Prerequisites**: Multiple completed migrations
    - **Time**: 1-4 weeks
    - **Resources**: `[██████████]` 100%

23. **[post-migration-validation](post-migration-validation)** - Verification
    - Functionality testing
    - Performance comparison
    - Data integrity checks
    - User acceptance testing
    - Documentation updates
    - **Prerequisites**: Completed migration
    - **Time**: 1-2 days
    - **Resources**: `[█████░░░░░]` 50%

24. **[decommissioning-commercial](decommissioning-commercial)** - Cleanup
    - Service termination checklist
    - Data deletion verification
    - Subscription cancellation
    - Cost savings tracking
    - Lessons learned
    - **Prerequisites**: Stable self-hosted
    - **Time**: 2-4 hours
    - **Resources**: `[███░░░░░░░]` 30%

## 🔗 What Comes Next?

After migration:

**Maintain Your Infrastructure**:
- **[kb/observability/](../observability/)** - Monitor everything
- **[kb/security/](../security/)** - Harden your systems
- **[kb/cloud/backup-strategies](../cloud/backup-strategies)** - Backup religiously

**Optimize**:
- **[kb/infrastructure/automation](../infrastructure/automation)** - Automate ops
- **[kb/containers/k0s-production](../containers/k0s-production)** - Scale up

## 📊 Resource Requirements

**Registry Migration**:
- **Small** (< 100 images): 50GB storage `[███░░░░░░░]` 30%
- **Large** (1000+ images): 500GB+ storage `[████████░░]` 80%

**Git Migration**:
- **Small Org** (< 50 repos): 10GB storage `[███░░░░░░░]` 30%
- **Large Org** (500+ repos): 100GB+ storage `[███████░░░]` 70%

**Storage Migration**:
- **Personal** (< 1TB): 1TB+ storage `[█████░░░░░]` 50%
- **Team** (10TB+): 20TB+ storage `[█████████░]` 90%

**Time Investment**:
- **Single Service**: 1-2 days `[████░░░░░░]` 40%
- **Complete Stack**: 2-4 weeks `[████████░░]` 80%
- **Enterprise**: 2-6 months `[██████████]` 100%

## 🛠️ Essential Migration Tools

**Data Transfer**:
- **rclone** `[██████████]` Required - Universal sync
- **rsync** `[█████████░]` 90% - File sync
- **skopeo** `[████████░░]` 80% - Container images

**API Tools**:
- **curl/wget** `[█████████░]` 90% - HTTP transfers
- **jq** `[████████░░]` 80% - JSON processing
- **yq** `[███████░░░]` 70% - YAML processing

**Version Control**:
- **git** `[██████████]` Required - Repo migration
- **gh** (GitHub CLI) `[████████░░]` 80% - GitHub automation
- **glab** (GitLab CLI) `[███████░░░]` 70% - GitLab automation

**Automation**:
- **Ansible** `[████████░░]` 80% - Config management
- **Python scripts** `[█████████░]` 90% - Custom migration
- **Bash scripts** `[████████░░]` 80% - Glue logic

## 💡 Pro Tips for Migrations

1. **Test Everything**: Dry-run migrations in staging first
2. **Document the Process**: You'll need it for rollback
3. **Parallel Run**: Keep old service running during validation
4. **Low-TTL DNS**: Reduce DNS TTL before migration
5. **Off-Hours**: Schedule during low-traffic windows
6. **Incremental**: Migrate in phases, not all at once
7. **Backup First**: Before touching anything
8. **User Communication**: Warn users early and often
9. **Monitor Closely**: First 48 hours are critical
10. **Celebrate**: Migrations are hard - recognize success!

## 🔄 Common Migration Pitfalls

**Pitfall 1: No Rollback Plan**
- Something breaks, can't go back
- **Fix**: Document rollback, test it

**Pitfall 2: Underestimating Time**
- "2 hours" becomes 2 days
- **Fix**: 3x time estimates, buffer for issues

**Pitfall 3: Forgetting Webhooks**
- CI/CD breaks, integrations fail
- **Fix**: Inventory all integrations first

**Pitfall 4: Data Loss**
- Incomplete transfers, deletions
- **Fix**: Verify data integrity, backups

**Pitfall 5: No Testing**
- Production migration fails
- **Fix**: Test in staging first

**Pitfall 6: DNS Propagation**
- Stale DNS caches cause issues
- **Fix**: Lower TTL 48h before migration

**Pitfall 7: Forgotten Secrets**
- API keys, passwords not migrated
- **Fix**: Secret inventory and transfer

**Pitfall 8: User Surprise**
- Users not prepared for changes
- **Fix**: Communication plan, training

## 🔗 Related KB Sections

- **[kb/containers/harbor-setup](../containers/harbor-setup)** - Container registry
- **[kb/cicd/forgejo-setup](../cicd/forgejo-setup)** - Git hosting
- **[kb/cloud/nextcloud-setup](../cloud/nextcloud-setup)** - File storage
- **[kb/cloud/minio-setup](../cloud/minio-setup)** - Object storage
- **[kb/infrastructure/](../infrastructure/)** - Infrastructure automation
- **[kb/observability/](../observability/)** - Monitor migrations

## 📝 Change Log

### 2026-01-30
- Created migrations directory structure
- Defined complete migration roadmap from planning to validation
- Listed all common migration scenarios
- Added time and resource estimates per migration type
- Emphasized risk mitigation and rollback strategies
- Organized by learning phases (1-5)
- Added essential migration tools
- Cross-referenced setup articles in other sections
- Included post-migration validation and decommissioning

---

**🚀 Remember**: Migrations are risky but rewarding! Plan thoroughly, test extensively, communicate clearly. Start with low-risk services (container registry) before tackling high-risk ones (email, DNS). Keep commercial services running in parallel until you're confident. Document everything - you'll thank yourself later!

