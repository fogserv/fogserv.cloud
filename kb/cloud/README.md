# Cloud - Self-Hosted Cloud Storage & Services

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Cloud Infrastructure  
**Prerequisites**: [kb/basics/](../basics/), [kb/containers/docker-basics](../containers/docker-basics)  
**Tags**: cloud, storage, nextcloud, minio, harbor, backups, object-storage, self-hosted

## Summary

Build your own cloud infrastructure with self-hosted alternatives to AWS S3, Google Drive, Dropbox, and Docker Hub. Learn object storage, file sync, container registries, and backup strategies for complete data sovereignty.

## 🎯 Learning Philosophy

**Own Your Data**:
```
Commercial Cloud → Self-Hosted Cloud → Your Rules
(Pay forever)     (One-time cost)     (Full control)
```

This directory teaches cloud infrastructure assuming **no cloud experience** but desire for data sovereignty. Progressive implementation from simple file sharing through production-grade object storage and container registries.

## 📚 Learning Path

```
Prerequisites: Docker basics, basic networking
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: File Storage & Sync          │
│  ├─ Cloud storage concepts             │
│  ├─ Nextcloud setup (personal cloud)   │
│  ├─ File sync clients                  │
│  ├─ Collaborative editing              │
│  └─ Mobile access                      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Object Storage               │
│  ├─ S3-compatible storage              │
│  ├─ MinIO setup (AWS S3 alternative)   │
│  ├─ Bucket management                  │
│  ├─ Access policies                    │
│  └─ SDK integration                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Container Registries         │
│  ├─ Why private registry               │
│  ├─ Harbor setup (Docker Hub alt)      │
│  ├─ Image scanning & security          │
│  ├─ Replication and HA                 │
│  └─ Registry integration               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: Backups & Disaster Recovery  │
│  ├─ Backup strategies (3-2-1 rule)     │
│  ├─ Restic encrypted backups           │
│  ├─ Automated backup scheduling        │
│  ├─ Off-site replication               │
│  └─ Disaster recovery testing          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Production & Advanced        │
│  ├─ High availability storage          │
│  ├─ CDN for static assets              │
│  ├─ Hybrid cloud patterns              │
│  ├─ Cost optimization                  │
│  └─ Performance tuning                 │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: File Storage & Sync (Start Here)

**Personal Cloud - Dropbox/Drive Alternative**:
1. **[cloud-storage-concepts](cloud-storage-concepts)** - Understanding cloud storage
   - File storage vs object storage
   - Sync vs backup
   - Why self-host
   - Privacy considerations
   - Commercial vs self-hosted
   - **Prerequisites**: None
   - **Time**: 1-2 hours
   - **Resources**: `[██░░░░░░░░]` 20% - Conceptual

2. **[nextcloud-setup](nextcloud-setup)** - Your personal cloud
   - Nextcloud installation (Docker)
   - Initial configuration
   - User management
   - Storage configuration
   - External storage
   - **Prerequisites**: Docker basics
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50% - 1-2GB RAM

3. **[nextcloud-clients](nextcloud-clients)** - Desktop and mobile sync
   - Desktop client setup
   - Selective sync
   - Mobile apps
   - WebDAV access
   - File sharing
   - **Prerequisites**: Nextcloud running
   - **Time**: 1-2 hours
   - **Resources**: `[███░░░░░░░]` 30%

4. **[nextcloud-collaboration](nextcloud-collaboration)** - Team productivity
   - Nextcloud Office (OnlyOffice)
   - Collaborative editing
   - Calendar and contacts
   - Talk (video calls)
   - Deck (Trello alternative)
   - **Prerequisites**: Nextcloud proficiency
   - **Time**: 3-4 hours
   - **Resources**: `[██████░░░░]` 60% - 4GB RAM

### 🟡 Phase 2: Object Storage (AWS S3 Alternative)

5. **[object-storage-concepts](object-storage-concepts)** - Understanding S3-like storage
   - Object storage vs file storage
   - Buckets and objects
   - S3 API compatibility
   - Use cases
   - **Prerequisites**: Cloud concepts
   - **Time**: 1-2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

6. **[minio-setup](minio-setup)** - High-performance object storage
   - MinIO installation (Docker)
   - Console access
   - Creating buckets
   - Access keys (IAM)
   - Data persistence
   - **Prerequisites**: Docker basics
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50% - 1-2GB RAM

7. **[minio-bucket-management](minio-bucket-management)** - Managing buckets
   - Bucket policies
   - Versioning
   - Lifecycle rules
   - Encryption
   - Replication
   - **Prerequisites**: MinIO running
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50%

8. **[s3-sdk-integration](s3-sdk-integration)** - Application integration
   - AWS SDK usage
   - Python boto3
   - Node.js AWS SDK
   - Pre-signed URLs
   - Multipart uploads
   - **Prerequisites**: Programming basics
   - **Time**: 3-4 hours
   - **Resources**: `[██████░░░░]` 60%

9. **[s3-cli-tools](s3-cli-tools)** - Command-line management
   - mc (MinIO client)
   - s3cmd
   - rclone for sync
   - Backup scripts
   - **Prerequisites**: CLI proficiency
   - **Time**: 2-3 hours
   - **Resources**: `[████░░░░░░]` 40%

### 🟠 Phase 3: Container Registries (Docker Hub Alternative)

10. **[private-registry-why](private-registry-why)** - Why host your own
    - Docker Hub limitations
    - Rate limiting issues
    - Private images
    - Security scanning
    - Air-gapped environments
    - **Prerequisites**: Docker understanding
    - **Time**: 1 hour
    - **Resources**: `[██░░░░░░░░]` 20%

11. **[harbor-setup](harbor-setup)** - Enterprise container registry
    - Harbor installation
    - HTTPS configuration
    - User authentication
    - Projects and repositories
    - Role-based access
    - **Prerequisites**: Docker, reverse proxy
    - **Time**: 3-4 hours
    - **Resources**: `[███████░░░]` 70% - 4GB RAM

12. **[harbor-image-scanning](harbor-image-scanning)** - Security scanning
    - Trivy integration
    - Vulnerability scanning
    - Scan policies
    - CVE management
    - Remediation workflows
    - **Prerequisites**: Harbor running
    - **Time**: 2-3 hours
    - **Resources**: `[██████░░░░]` 60%

13. **[harbor-replication](harbor-replication)** - Multi-site registries
    - Replication rules
    - Push vs pull replication
    - Multi-datacenter setup
    - Harbor HA
    - **Prerequisites**: Harbor proficiency
    - **Time**: 3-4 hours
    - **Resources**: `[████████░░]` 80%

14. **[registry-integration](registry-integration)** - Using private registries
    - Docker login
    - CI/CD integration
    - Kubernetes imagePullSecrets
    - Docker Compose with private images
    - **Prerequisites**: Registry setup
    - **Time**: 2 hours
    - **Resources**: `[█████░░░░░]` 50%

### 🔴 Phase 4: Backups & Disaster Recovery (Critical)

15. **[backup-strategies](backup-strategies)** - The 3-2-1 rule
    - Backup vs sync
    - 3-2-1-1-0 rule
    - RPO and RTO
    - Testing backups
    - Disaster scenarios
    - **Prerequisites**: None
    - **Time**: 2 hours
    - **Resources**: `[███░░░░░░░]` 30% - Conceptual

16. **[restic-setup](restic-setup)** - Encrypted backup tool
    - Restic installation
    - Repository initialization
    - Backup creation
    - Snapshots
    - Forget and prune
    - **Prerequisites**: Linux CLI
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

17. **[restic-automated-backups](restic-automated-backups)** - Scheduled backups
    - Systemd timers
    - Backup scripts
    - Monitoring backup success
    - Email notifications
    - **Prerequisites**: Restic basics
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50%

18. **[backup-destinations](backup-destinations)** - Where to store backups
    - Local storage
    - NAS backups
    - Off-site storage
    - Cloud storage backends
    - Restic with MinIO
    - **Prerequisites**: Backup concepts
    - **Time**: 2 hours
    - **Resources**: `[████░░░░░░]` 40%

19. **[disaster-recovery-testing](disaster-recovery-testing)** - Test your backups!
    - Recovery scenarios
    - Restore testing
    - DR drills
    - Documentation
    - Recovery automation
    - **Prerequisites**: Backup system
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

### ⚫ Phase 5: Production & Advanced (Scale & Optimize)

20. **[storage-high-availability](storage-high-availability)** - HA storage
    - RAID concepts
    - ZFS for storage
    - Ceph distributed storage
    - MinIO distributed mode
    - Storage redundancy
    - **Prerequisites**: Production experience
    - **Time**: 5-6 hours
    - **Resources**: `[█████████░]` 90% - 8GB+ RAM

21. **[cdn-static-assets](cdn-static-assets)** - Content delivery
    - CDN concepts
    - Self-hosted CDN
    - CloudFlare integration
    - Cache strategies
    - Image optimization
    - **Prerequisites**: Web understanding
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

22. **[hybrid-cloud-patterns](hybrid-cloud-patterns)** - Best of both worlds
    - Public + private cloud
    - Burst to cloud
    - Data tiering
    - Multi-cloud strategies
    - **Prerequisites**: Cloud experience
    - **Time**: 3-4 hours
    - **Resources**: `[███████░░░]` 70%

23. **[storage-cost-optimization](storage-cost-optimization)** - Efficient storage
    - Deduplication
    - Compression
    - Lifecycle management
    - Cold storage
    - Cost monitoring
    - **Prerequisites**: Storage running
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50%

24. **[storage-performance-tuning](storage-performance-tuning)** - Speed optimization
    - Benchmarking tools
    - Disk I/O optimization
    - Network tuning
    - Caching strategies
    - SSD vs HDD considerations
    - **Prerequisites**: Production systems
    - **Time**: 4-5 hours
    - **Resources**: `[████████░░]` 80%

## 🔗 What Comes Next?

After mastering cloud storage:

**For Backups**:
- **[kb/infrastructure/backup-automation](../infrastructure/backup-automation)** - IaC for backups

**For Containers**:
- **[kb/containers/registry-integration](../containers/registry-integration)** - Using Harbor in k0s

**For CI/CD**:
- **[kb/cicd/artifact-storage](../cicd/artifact-storage)** - CI artifacts in MinIO
- **[kb/cicd/container-building](../cicd/container-building)** - Build to Harbor

**For Security**:
- **[kb/security/data-encryption](../security/data-encryption)** - Encrypt storage

## 📊 Resource Requirements

**Nextcloud**:
- **Minimal** (personal use): 1GB RAM, 2 CPU `[████░░░░░░]` 40%
- **Small Team** (5-10 users): 2GB RAM, 4 CPU `[█████░░░░░]` 50%
- **With Office**: +2GB RAM `[██████░░░░]` 60%

**MinIO**:
- **Standalone**: 1GB RAM, 2 CPU `[████░░░░░░]` 40%
- **Distributed** (4 nodes): 4GB RAM each `[████████░░]` 80%

**Harbor**:
- **Small Registry**: 4GB RAM, 4 CPU `[███████░░░]` 70%
- **Production**: 8GB RAM, 8 CPU `[█████████░]` 90%

**Restic Backup**:
- **Minimal**: 256MB RAM `[██░░░░░░░░]` 20%
- **Large Repos**: 2GB RAM `[█████░░░░░]` 50%

**Complete Cloud Stack** (Nextcloud + MinIO + Harbor + Backups):
- **Homelab**: 8-12GB RAM `[████████░░]` 80%
- **Small Business**: 16-24GB RAM `[█████████░]` 90%

**Storage Requirements**:
- **Nextcloud**: 100GB+ per user
- **MinIO**: Depends on use case
- **Harbor**: 500GB+ for images
- **Backups**: 2-3x primary data

**Learning Time Investment**:
- **File Storage**: 1-2 weeks `[████░░░░░░]` 40%
- **Object Storage**: 2 weeks `[█████░░░░░]` 50%
- **Container Registries**: 2 weeks `[█████░░░░░]` 50%
- **Backups**: 1-2 weeks `[████░░░░░░]` 40%
- **Production Mastery**: 6-12 months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**File Sync/Share**:
- **Nextcloud** `[██████████]` Required - Complete cloud
- **FileRun** `[██████░░░░]` 60% - Lightweight alternative
- **Seafile** `[█████░░░░░]` 50% - High-performance sync

**Object Storage**:
- **MinIO** `[██████████]` Required - S3-compatible
- **SeaweedFS** `[██████░░░░]` 60% - Alternative
- **Ceph** `[█████░░░░░]` 50% - Enterprise, complex

**Container Registry**:
- **Harbor** `[█████████░]` 90% - Enterprise features
- **Gitea Packages** `[███████░░░]` 70% - All-in-one
- **Docker Registry** `[██████░░░░]` 60% - Minimal

**Backup Tools**:
- **Restic** `[██████████]` Required - Encrypted, efficient
- **Borg** `[████████░░]` 80% - Deduplication
- **Duplicati** `[██████░░░░]` 60% - GUI-friendly

**Supporting Tools**:
- **rclone** `[█████████░]` 90% - Sync tool
- **Syncthing** `[████████░░]` 80% - P2P sync
- **ZFS** `[████████░░]` 80% - Enterprise filesystem

## 💡 Pro Tips for Cloud Storage

1. **Backups Aren't Sync**: Nextcloud sync ≠ backup (use Restic!)
2. **Test Restores**: Backup without restore testing = no backup
3. **3-2-1 Rule**: 3 copies, 2 media types, 1 off-site
4. **Encrypt Everything**: Especially off-site backups
5. **Monitor Storage Usage**: Set quotas, alerts for full disks
6. **Version Everything**: Accidental deletes happen
7. **Document Recovery**: Write DR procedures while system works
8. **Automate Backups**: Humans forget, cron doesn't
9. **Off-site is Critical**: House fire = local backup gone
10. **Start Small, Scale Up**: Perfect is enemy of done

## 🔄 Common Cloud Storage Pitfalls

**Pitfall 1: No Backups**
- "Nextcloud IS my backup" - Wrong!
- **Fix**: Separate backup system (Restic)

**Pitfall 2: Untested Restores**
- Backups run but never tested
- **Fix**: Quarterly restore drills

**Pitfall 3: Single Copy**
- All data on one disk
- **Fix**: RAID, off-site replication

**Pitfall 4: No Monitoring**
- Storage full, backups fail silently
- **Fix**: Monitoring + alerting

**Pitfall 5: Weak Access Control**
- Public buckets, leaked credentials
- **Fix**: Principle of least privilege

**Pitfall 6: No Encryption**
- Off-site backups in plain text
- **Fix**: Restic encryption, MinIO encryption

**Pitfall 7: Ignoring Costs**
- Storing everything forever
- **Fix**: Lifecycle policies, cold storage

**Pitfall 8: Poor Documentation**
- How to restore when disaster strikes?
- **Fix**: Written DR procedures

## 🔗 Related KB Sections

- **[kb/containers/](../containers/)** - Docker for cloud services
- **[kb/infrastructure/](../infrastructure/)** - IaC for storage
- **[kb/security/](../security/)** - Encryption, access control
- **[kb/observability/](../observability/)** - Monitor storage health
- **[kb/networking/](../networking/)** - Storage networking

## 📝 Change Log

### 2026-01-30
- Created cloud storage directory structure
- Defined complete learning path from file sync to HA storage
- Established Nextcloud + MinIO + Harbor as core stack
- Listed all planned articles with time estimates
- Added resource requirements for cloud services
- Emphasized backup strategies and DR testing
- Organized by learning phases (1-5)
- Added tool recommendations with ratings
- Cross-referenced related KB sections
- Included production storage patterns

---

**☁️ Remember**: Cloud = Someone else's computer! Self-hosted cloud = YOUR computer, YOUR rules! Start with Nextcloud for files, add MinIO for object storage, Harbor for container images, and Restic for backups. Test restores religiously - untested backups are worthless!

