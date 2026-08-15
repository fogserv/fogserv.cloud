# Disaster Recovery - Plan for the Worst

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Business Continuity  
**Prerequisites**: [terraform-basics](terraform-basics), [gitops-principles](gitops-principles)  
**Time**: 3-4 hours  
**Tags**: disaster-recovery, backup, rto, rpo, business-continuity, resilience

## Summary

Master disaster recovery for infrastructure. Learn backup strategies, define RTO/RPO, implement automated recovery procedures, test disaster scenarios, and build complete business continuity plans for production systems.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Define RTO and RPO requirements
- ✅ Design backup strategies
- ✅ Automate backup processes
- ✅ Create recovery procedures
- ✅ Test disaster scenarios
- ✅ Implement multi-region failover
- ✅ Document DR plans
- ✅ Conduct DR drills

## 📊 Understanding DR Metrics

### RTO vs RPO

```
Time →

┌─────────┬─────────────┬──────────────┬─────────────┐
│ Normal  │  Disaster   │   Recovery   │   Normal    │
│Operation│   Occurs    │   Process    │ Operations  │
└─────────┴─────────────┴──────────────┴─────────────┘
                ↑              ↑              ↑
                │              │              │
                │              │         Recovered
           Disaster         Started      (RTO met)
           Detected        Recovery
                │              │
                └──────┬───────┘
                      RTO
                (Recovery Time Objective)
                
                ↑
                │
           ┌────┴────┐
           │  Lost   │
           │  Data   │
           └─────────┘
                RPO
         (Recovery Point Objective)
```

**RTO (Recovery Time Objective)**:
- Maximum acceptable downtime
- How long to restore service
- Example: "4 hours"

**RPO (Recovery Point Objective)**:
- Maximum acceptable data loss
- How old can recovered data be
- Example: "1 hour" (lose up to 1 hour of data)

---

### DR Tiers

**Tier 1 - Backup and Restore** (Slowest, Cheapest):
```
RTO: 24+ hours
RPO: 24 hours
Cost: $

Backup → S3 Glacier
Restore when disaster occurs
```

**Tier 2 - Pilot Light** (Medium):
```
RTO: 1-4 hours
RPO: 15 minutes
Cost: $$

Minimal infrastructure running
Scale up when needed
Data replicated continuously
```

**Tier 3 - Warm Standby** (Fast):
```
RTO: 5-30 minutes
RPO: 5 minutes
Cost: $$$

Scaled-down version running
Ready to scale up
Data synchronized in real-time
```

**Tier 4 - Hot Standby / Active-Active** (Fastest, Most Expensive):
```
RTO: <1 minute
RPO: <1 minute
Cost: $$$$

Full production replica
Active-active configuration
Instant failover
```

---

## 💾 Backup Strategies

### Infrastructure as Code Backups

**Git repository** (primary backup):
```bash
# All infrastructure code in Git
infrastructure/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── modules/
├── ansible/
│   └── playbooks/
└── k8s/
    └── manifests/

# Backup strategy
git remote add backup git@backup-server:infrastructure.git
git push backup main --force

# Multiple remotes
git remote add github git@github.com:org/infrastructure.git
git remote add gitlab git@gitlab.com:org/infrastructure.git
git remote add bitbucket git@bitbucket.org:org/infrastructure.git

# Push to all
git push --all github
git push --all gitlab
git push --all bitbucket
```

---

### Terraform State Backups

**S3 backend with versioning**:
```hcl
terraform {
  backend "s3" {
    bucket         = "myorg-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
    
    # Enable versioning in S3
  }
}
```

**S3 bucket configuration**:
```hcl
resource "aws_s3_bucket" "terraform_state" {
  bucket = "myorg-terraform-state"
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    enabled = true
    
    noncurrent_version_transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    noncurrent_version_transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    noncurrent_version_expiration {
      days = 365
    }
  }
  
  replication_configuration {
    role = aws_iam_role.replication.arn
    
    rules {
      id     = "replicate-state"
      status = "Enabled"
      
      destination {
        bucket        = aws_s3_bucket.terraform_state_replica.arn
        storage_class = "STANDARD"
        
        replica_modifications {
          status = "Enabled"
        }
      }
    }
  }
}

# Replica bucket in different region
resource "aws_s3_bucket" "terraform_state_replica" {
  provider = aws.us_west_2
  bucket   = "myorg-terraform-state-replica"
  
  versioning {
    enabled = true
  }
}
```

**Manual state backup**:
```bash
# Download current state
terraform state pull > backups/terraform-$(date +%Y%m%d-%H%M%S).tfstate

# Restore from backup
terraform state push backups/terraform-20260130-120000.tfstate

# List state versions (S3)
aws s3api list-object-versions \
  --bucket myorg-terraform-state \
  --prefix production/terraform.tfstate \
  --output json | jq '.Versions[] | {Key, VersionId, LastModified}'
```

---

### Database Backups

**PostgreSQL automated backups**:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: production
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - |
              set -e
              
              TIMESTAMP=$(date +%Y%m%d-%H%M%S)
              BACKUP_FILE="postgres-${TIMESTAMP}.sql.gz"
              
              echo "Starting backup: $BACKUP_FILE"
              
              # Dump database
              pg_dump -h $POSTGRES_HOST \
                      -U $POSTGRES_USER \
                      -d $POSTGRES_DB \
                      --format=custom \
                      --compress=9 \
                      --verbose \
                | gzip > /backup/$BACKUP_FILE
              
              # Calculate checksum
              sha256sum /backup/$BACKUP_FILE > /backup/$BACKUP_FILE.sha256
              
              # Upload to S3
              aws s3 cp /backup/$BACKUP_FILE \
                s3://$BACKUP_BUCKET/postgres/$BACKUP_FILE \
                --storage-class STANDARD_IA
              
              aws s3 cp /backup/$BACKUP_FILE.sha256 \
                s3://$BACKUP_BUCKET/postgres/$BACKUP_FILE.sha256
              
              # Upload to secondary region
              aws s3 cp /backup/$BACKUP_FILE \
                s3://$BACKUP_BUCKET_REPLICA/postgres/$BACKUP_FILE \
                --region us-west-2
              
              # Keep only last 7 days locally
              find /backup -name "postgres-*.sql.gz" -mtime +7 -delete
              
              # Verify backup
              echo "Verifying backup integrity..."
              gunzip -t /backup/$BACKUP_FILE
              
              echo "Backup completed successfully"
              
              # Send success notification
              curl -X POST $SLACK_WEBHOOK \
                -H 'Content-Type: application/json' \
                -d "{\"text\":\"✅ PostgreSQL backup completed: $BACKUP_FILE\"}"
            
            env:
            - name: POSTGRES_HOST
              value: "postgres.production.svc.cluster.local"
            - name: POSTGRES_USER
              value: "postgres"
            - name: POSTGRES_DB
              value: "myapp"
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
            - name: BACKUP_BUCKET
              value: "myorg-backups"
            - name: BACKUP_BUCKET_REPLICA
              value: "myorg-backups-replica"
            - name: SLACK_WEBHOOK
              valueFrom:
                secretKeyRef:
                  name: slack-webhooks
                  key: backup-notifications
            
            volumeMounts:
            - name: backup
              mountPath: /backup
            - name: aws-credentials
              mountPath: /root/.aws
              readOnly: true
          
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: postgres-backup-pvc
          - name: aws-credentials
            secret:
              secretName: aws-credentials
```

---

**Restore procedure** (`restore-postgres.sh`):
```bash
#!/bin/bash
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    aws s3 ls s3://myorg-backups/postgres/ | grep ".sql.gz$" | tail -10
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the database!"
echo "Backup file: $BACKUP_FILE"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted"
    exit 1
fi

# Download backup
echo "Downloading backup..."
aws s3 cp "s3://myorg-backups/postgres/$BACKUP_FILE" /tmp/$BACKUP_FILE
aws s3 cp "s3://myorg-backups/postgres/$BACKUP_FILE.sha256" /tmp/$BACKUP_FILE.sha256

# Verify checksum
echo "Verifying integrity..."
cd /tmp
sha256sum -c $BACKUP_FILE.sha256

# Stop application
echo "Stopping application..."
kubectl scale deployment myapp --replicas=0 -n production

# Drop existing database
echo "Dropping existing database..."
kubectl exec -n production postgres-0 -- psql -U postgres -c "DROP DATABASE IF EXISTS myapp;"
kubectl exec -n production postgres-0 -- psql -U postgres -c "CREATE DATABASE myapp;"

# Restore
echo "Restoring database..."
gunzip -c /tmp/$BACKUP_FILE | \
  kubectl exec -i -n production postgres-0 -- pg_restore -U postgres -d myapp --verbose

# Verify
echo "Verifying restore..."
kubectl exec -n production postgres-0 -- psql -U postgres -d myapp -c "SELECT COUNT(*) FROM users;"

# Start application
echo "Starting application..."
kubectl scale deployment myapp --replicas=3 -n production

# Wait for ready
echo "Waiting for application to be ready..."
kubectl wait --for=condition=ready pod -l app=myapp -n production --timeout=300s

# Cleanup
rm /tmp/$BACKUP_FILE /tmp/$BACKUP_FILE.sha256

echo "✅ Restore completed successfully"
```

---

### Volume Snapshots

**Kubernetes VolumeSnapshot**:
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: postgres-snapshot
  namespace: production
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: postgres-data
---
# Schedule snapshots
apiVersion: batch/v1
kind: CronJob
metadata:
  name: volume-snapshot
  namespace: production
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: snapshot-creator
          restartPolicy: OnFailure
          containers:
          - name: snapshot
            image: bitnami/kubectl:latest
            command:
            - /bin/bash
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d-%H%M%S)
              
              kubectl apply -f - <<EOF
              apiVersion: snapshot.storage.k8s.io/v1
              kind: VolumeSnapshot
              metadata:
                name: postgres-snapshot-${TIMESTAMP}
                namespace: production
              spec:
                volumeSnapshotClassName: csi-snapclass
                source:
                  persistentVolumeClaimName: postgres-data
              EOF
              
              # Wait for snapshot to be ready
              kubectl wait --for=jsonpath='{.status.readyToUse}'=true \
                volumesnapshot/postgres-snapshot-${TIMESTAMP} \
                -n production \
                --timeout=600s
              
              # Delete old snapshots (keep 7 days)
              kubectl get volumesnapshots -n production \
                --sort-by=.metadata.creationTimestamp \
                -o json | \
                jq -r '.items[] | select(.metadata.name | startswith("postgres-snapshot-")) | 
                  select((now - (.metadata.creationTimestamp | fromdateiso8601)) > (7*24*3600)) | 
                  .metadata.name' | \
                xargs -r kubectl delete volumesnapshot -n production
```

**Restore from snapshot**:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-restored
  namespace: production
spec:
  storageClassName: local-path
  dataSource:
    name: postgres-snapshot-20260130-020000
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
```

---

## 🌍 Multi-Region Architecture

### Active-Passive Setup

**Primary region (us-east-1)**:
```hcl
# main.tf
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

module "primary_infrastructure" {
  source = "./modules/infrastructure"
  
  providers = {
    aws = aws.primary
  }
  
  region      = "us-east-1"
  environment = "production"
  replicas    = 10
}

# RDS with read replica
resource "aws_db_instance" "primary" {
  provider = aws.primary
  
  identifier        = "myapp-primary"
  engine            = "postgres"
  instance_class    = "db.r6g.xlarge"
  allocated_storage = 100
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  
  multi_az = true
}

# Create read replica in secondary region
resource "aws_db_instance" "replica" {
  provider = aws.secondary
  
  identifier             = "myapp-replica"
  replicate_source_db    = aws_db_instance.primary.arn
  instance_class         = "db.r6g.large"
  
  backup_retention_period = 0  # Replica doesn't need backups
}
```

---

**Secondary region (us-west-2)**:
```hcl
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}

module "secondary_infrastructure" {
  source = "./modules/infrastructure"
  
  providers = {
    aws = aws.secondary
  }
  
  region      = "us-west-2"
  environment = "dr"
  replicas    = 2  # Minimal capacity
}
```

---

**DNS failover** (Route53):
```hcl
resource "aws_route53_health_check" "primary" {
  fqdn              = "api.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
}

resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"
  
  # Primary record
  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = module.primary_infrastructure.lb_dns_name
    zone_id                = module.primary_infrastructure.lb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_failover" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"
  
  # Secondary record
  set_identifier = "secondary"
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  alias {
    name                   = module.secondary_infrastructure.lb_dns_name
    zone_id                = module.secondary_infrastructure.lb_zone_id
    evaluate_target_health = true
  }
}
```

---

### Failover Procedure

**Automated failover script** (`failover.sh`):
```bash
#!/bin/bash
set -e

TARGET_REGION=$1

if [ "$TARGET_REGION" != "us-east-1" ] && [ "$TARGET_REGION" != "us-west-2" ]; then
    echo "Usage: $0 <us-east-1|us-west-2>"
    exit 1
fi

echo "🚨 INITIATING FAILOVER TO $TARGET_REGION"
echo ""
echo "This will:"
echo "1. Promote database replica to primary"
echo "2. Scale up secondary region infrastructure"
echo "3. Update DNS to point to new region"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted"
    exit 1
fi

# Step 1: Promote replica to standalone
echo "Step 1: Promoting database replica..."
aws rds promote-read-replica \
  --db-instance-identifier myapp-replica \
  --region $TARGET_REGION

# Wait for promotion
aws rds wait db-instance-available \
  --db-instance-identifier myapp-replica \
  --region $TARGET_REGION

echo "✓ Database promoted"

# Step 2: Scale up infrastructure
echo "Step 2: Scaling up infrastructure..."
cd terraform/
terraform workspace select $TARGET_REGION

terraform apply -auto-approve \
  -var="replicas=10" \
  -var="instance_type=t3.large"

echo "✓ Infrastructure scaled"

# Step 3: Update DNS
echo "Step 3: Updating DNS..."
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dns-failover.json

echo "✓ DNS updated"

# Step 4: Verify
echo "Step 4: Verifying failover..."
for i in {1..10}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health)
    if [ "$RESPONSE" = "200" ]; then
        echo "✓ Health check passed"
        break
    fi
    echo "Waiting for health check... ($i/10)"
    sleep 10
done

echo ""
echo "✅ FAILOVER COMPLETED"
echo "New primary region: $TARGET_REGION"
echo ""
echo "Next steps:"
echo "1. Monitor application logs"
echo "2. Verify all services running"
echo "3. Update documentation"
echo "4. Plan failback when ready"
```

---

## 📋 DR Plan Documentation

### DR Runbook Template

**DR-RUNBOOK.md**:
```markdown
# Disaster Recovery Runbook

**Version**: 1.2  
**Last Updated**: 2026-01-30  
**Last Tested**: 2026-01-15  

## Contact Information

### On-Call Team
- **Primary**: John Doe (john@example.com, +1-555-0001)
- **Secondary**: Jane Smith (jane@example.com, +1-555-0002)
- **Manager**: Bob Johnson (bob@example.com, +1-555-0003)

### External Contacts
- **AWS Support**: +1-800-AWS-HELP (Premium Support)
- **DNS Provider**: support@cloudflare.com
- **Vendor Support**: vendor@example.com

## RTO/RPO Commitments

| Service | RTO | RPO | Tier |
|---------|-----|-----|------|
| API | 1 hour | 15 minutes | Warm Standby |
| Database | 1 hour | 15 minutes | Warm Standby |
| Web Frontend | 30 minutes | 0 (static) | Hot Standby |
| Background Jobs | 4 hours | 1 hour | Pilot Light |

## Disaster Scenarios

### 1. Complete Regional Failure

**Symptoms**:
- All health checks failing in primary region
- Cannot access any resources in us-east-1
- CloudWatch showing region-wide issues

**Recovery Procedure**:

1. **Declare Incident** (5 minutes)
   ```bash
   # Start incident in PagerDuty
   curl -X POST https://api.pagerduty.com/incidents \
     -H "Authorization: Token token=$PD_TOKEN" \
     -d '{
       "incident": {
         "type": "incident",
         "title": "Regional Failure - us-east-1",
         "service": {"id": "PSERVICE1", "type": "service_reference"},
         "urgency": "high",
         "incident_key": "regional-failure-$(date +%s)"
       }
     }'
   
   # Notify stakeholders
   ./scripts/notify-stakeholders.sh "Regional failure detected"
   ```

2. **Assess Situation** (10 minutes)
   ```bash
   # Check AWS Service Health Dashboard
   open https://health.aws.amazon.com/health/status
   
   # Check our monitoring
   open https://grafana.example.com/d/regional-health
   
   # Verify secondary region healthy
   curl -v https://dr.api.example.com/health
   ```

3. **Execute Failover** (30 minutes)
   ```bash
   cd /opt/disaster-recovery
   
   # Automated failover to us-west-2
   ./failover.sh us-west-2
   
   # Monitor progress
   tail -f /var/log/failover.log
   ```

4. **Verify Services** (15 minutes)
   ```bash
   # Run smoke tests
   ./tests/smoke-test.sh
   
   # Check all endpoints
   curl https://api.example.com/health
   curl https://www.example.com
   
   # Verify database
   psql -h myapp-replica.us-west-2.rds.amazonaws.com -U postgres -c "SELECT 1"
   
   # Check metrics
   open https://grafana.example.com/d/production-overview
   ```

5. **Communicate** (Ongoing)
   ```bash
   # Update status page
   ./scripts/update-status.sh \
     --status degraded \
     --message "Failover to secondary region completed. Monitoring stability."
   
   # Post update
   # - Internal Slack: #incidents
   # - External: status.example.com
   # - Customers: Email to critical accounts
   ```

---

### 2. Database Corruption

**Symptoms**:
- Database query errors
- Data inconsistency reported by users
- Replication lag increasing

**Recovery Procedure**:

1. **Stop Write Operations** (5 minutes)
   ```bash
   # Put application in read-only mode
   kubectl set env deployment/myapp -n production \
     DB_READ_ONLY=true
   
   # Or scale to 0 if critical
   kubectl scale deployment/myapp --replicas=0 -n production
   ```

2. **Assess Corruption** (15 minutes)
   ```bash
   # Check PostgreSQL logs
   kubectl logs -n production postgres-0 | grep -i error
   
   # Run integrity check
   kubectl exec -n production postgres-0 -- \
     psql -U postgres -d myapp -c "SELECT * FROM pg_stat_database;"
   
   # Identify corrupted tables
   kubectl exec -n production postgres-0 -- \
     psql -U postgres -d myapp -c "
       SELECT schemaname, tablename 
       FROM pg_tables 
       WHERE schemaname = 'public';
     "
   ```

3. **Restore from Backup** (30-60 minutes)
   ```bash
   # List recent backups
   aws s3 ls s3://myorg-backups/postgres/ | tail -20
   
   # Select backup before corruption
   BACKUP_FILE="postgres-20260130-060000.sql.gz"
   
   # Execute restore
   ./scripts/restore-postgres.sh $BACKUP_FILE
   ```

4. **Verify Data Integrity** (15 minutes)
   ```bash
   # Run data validation
   ./scripts/validate-database.sh
   
   # Compare row counts with monitoring
   kubectl exec -n production postgres-0 -- \
     psql -U postgres -d myapp -c "
       SELECT schemaname, tablename, n_live_tup 
       FROM pg_stat_user_tables 
       ORDER BY n_live_tup DESC;
     "
   ```

5. **Resume Operations** (10 minutes)
   ```bash
   # Remove read-only mode
   kubectl set env deployment/myapp -n production DB_READ_ONLY-
   
   # Scale back up
   kubectl scale deployment/myapp --replicas=3 -n production
   
   # Monitor
   kubectl logs -f deployment/myapp -n production
   ```

---

### 3. Kubernetes Cluster Failure

**Symptoms**:
- Cannot connect to kubectl
- All pods showing NotReady
- Control plane unresponsive

**Recovery Procedure**:

1. **Verify Cluster State** (10 minutes)
   ```bash
   # Check nodes
   kubectl get nodes
   
   # Check control plane pods
   kubectl get pods -n kube-system
   
   # Check etcd
   kubectl exec -n kube-system etcd-0 -- etcdctl cluster-health
   ```

2. **Deploy to Backup Cluster** (30 minutes)
   ```bash
   # Switch kubectl context
   kubectl config use-context backup-cluster
   
   # Deploy via GitOps (ArgoCD)
   argocd app sync myapp --force
   
   # Or manual apply
   kubectl apply -k k8s/production/
   ```

3. **Restore Database Connection** (15 minutes)
   ```bash
   # Update DNS or use existing RDS
   kubectl create secret generic db-credentials \
     --from-literal=host=myapp-primary.us-east-1.rds.amazonaws.com \
     --from-literal=password=$DB_PASSWORD
   
   # Restart pods
   kubectl rollout restart deployment/myapp
   ```

4. **Update Load Balancer** (10 minutes)
   ```bash
   # Get new load balancer DNS
   kubectl get svc myapp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
   
   # Update Route53
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123 \
     --change-batch file://update-dns.json
   ```

## Testing Schedule

| Test Type | Frequency | Last Completed | Next Scheduled |
|-----------|-----------|----------------|----------------|
| Database Restore | Monthly | 2026-01-15 | 2026-02-15 |
| Regional Failover | Quarterly | 2026-01-10 | 2026-04-10 |
| Full DR Drill | Semi-annually | 2025-12-20 | 2026-06-20 |
| Tabletop Exercise | Quarterly | 2026-01-05 | 2026-04-05 |

## Backup Verification

```bash
# Daily automated verification
0 8 * * * /opt/scripts/verify-backups.sh

# Script checks:
# 1. Backups exist for last 7 days
# 2. Backup file integrity (checksums)
# 3. Can extract and read backup
# 4. Backup size within expected range
```

## Post-Recovery Checklist

- [ ] All services operational
- [ ] Database integrity verified
- [ ] Monitoring showing green
- [ ] Performance metrics normal
- [ ] No error logs
- [ ] Stakeholders notified
- [ ] Incident documentation updated
- [ ] Post-mortem scheduled
- [ ] Backup/recovery procedures updated
```

---

## 🧪 DR Testing

### Monthly Database Restore Test

**Automated test** (`.github/workflows/dr-test.yml`):
```yaml
name: DR Test - Database Restore

on:
  schedule:
    - cron: '0 8 15 * *'  # 15th of each month at 8 AM
  workflow_dispatch:

jobs:
  test-database-restore:
    runs-on: ubuntu-latest
    
    steps:
      - name: Setup
        run: |
          # Create test namespace
          kubectl create namespace dr-test-$(date +%s)
          
          export TEST_NS=$(kubectl get ns | grep dr-test | tail -1 | awk '{print $1}')
          echo "TEST_NS=$TEST_NS" >> $GITHUB_ENV
      
      - name: Get Latest Backup
        run: |
          BACKUP=$(aws s3 ls s3://myorg-backups/postgres/ | \
            grep ".sql.gz$" | \
            sort -r | \
            head -1 | \
            awk '{print $4}')
          
          echo "Testing restore of: $BACKUP"
          echo "BACKUP=$BACKUP" >> $GITHUB_ENV
      
      - name: Deploy Test Database
        run: |
          kubectl apply -f - <<EOF
          apiVersion: apps/v1
          kind: StatefulSet
          metadata:
            name: postgres-test
            namespace: $TEST_NS
          spec:
            serviceName: postgres-test
            replicas: 1
            selector:
              matchLabels:
                app: postgres-test
            template:
              metadata:
                labels:
                  app: postgres-test
              spec:
                containers:
                - name: postgres
                  image: postgres:15
                  env:
                  - name: POSTGRES_PASSWORD
                    value: testpassword
                  volumeMounts:
                  - name: data
                    mountPath: /var/lib/postgresql/data
            volumeClaimTemplates:
            - metadata:
                name: data
              spec:
                accessModes: ["ReadWriteOnce"]
                resources:
                  requests:
                    storage: 10Gi
          EOF
          
          kubectl wait --for=condition=ready pod \
            -l app=postgres-test \
            -n $TEST_NS \
            --timeout=300s
      
      - name: Restore Backup
        run: |
          # Download backup
          aws s3 cp s3://myorg-backups/postgres/$BACKUP /tmp/
          
          # Restore
          gunzip -c /tmp/$BACKUP | \
            kubectl exec -i -n $TEST_NS postgres-test-0 -- \
            pg_restore -U postgres -d postgres --verbose
      
      - name: Verify Restore
        run: |
          # Check table count
          TABLES=$(kubectl exec -n $TEST_NS postgres-test-0 -- \
            psql -U postgres -d postgres -t -c "
              SELECT COUNT(*) 
              FROM information_schema.tables 
              WHERE table_schema = 'public';
            ")
          
          echo "Tables restored: $TABLES"
          
          if [ "$TABLES" -lt 10 ]; then
            echo "❌ Too few tables restored"
            exit 1
          fi
          
          # Check row counts
          kubectl exec -n $TEST_NS postgres-test-0 -- \
            psql -U postgres -d postgres -c "
              SELECT schemaname, tablename, n_live_tup 
              FROM pg_stat_user_tables 
              ORDER BY n_live_tup DESC 
              LIMIT 10;
            "
          
          echo "✅ Restore verified"
      
      - name: Cleanup
        if: always()
        run: |
          kubectl delete namespace $TEST_NS
          rm -f /tmp/$BACKUP
      
      - name: Report Results
        if: always()
        run: |
          # Send report
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d "{
              \"text\": \"DR Test Results\",
              \"attachments\": [{
                \"color\": \"${{ job.status == 'success' && 'good' || 'danger' }}\",
                \"fields\": [
                  {\"title\": \"Test\", \"value\": \"Database Restore\", \"short\": true},
                  {\"title\": \"Status\", \"value\": \"${{ job.status }}\", \"short\": true},
                  {\"title\": \"Backup\", \"value\": \"${{ env.BACKUP }}\"}
                ]
              }]
            }"
```

---

### Quarterly Failover Drill

**Procedure**:
```bash
#!/bin/bash
# quarterly-failover-drill.sh

echo "======================================"
echo "QUARTERLY DR DRILL - REGIONAL FAILOVER"
echo "======================================"
echo ""
echo "Date: $(date)"
echo "Participants:"
echo "  - SRE Team"
echo "  - Engineering Leadership"
echo "  - Product Management"
echo ""
read -p "Press Enter to begin drill..."

# Start timer
START_TIME=$(date +%s)

# Step 1: Simulate primary region failure
echo ""
echo "[SIMULATION] Primary region (us-east-1) is DOWN"
echo ""

# Step 2: Detection
echo "⏰ T+0: Incident detected via monitoring"
echo "   - Health checks failing"
echo "   - PagerDuty alert triggered"
sleep 5

# Step 3: Assessment
echo ""
echo "⏰ T+5: Team assembled, assessing situation"
echo "   ✓ Secondary region healthy"
echo "   ✓ Database replica available"
echo "   ✓ DNS failover ready"
sleep 5

# Step 4: Execute failover
echo ""
echo "⏰ T+10: Executing failover to us-west-2"
./failover.sh us-west-2 --drill-mode

# Step 5: Verification
echo ""
echo "⏰ T+40: Verifying failover"
./tests/smoke-test.sh --target secondary

# Step 6: Monitoring
echo ""
echo "⏰ T+55: Monitoring stability"
sleep 60

# End timer
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Report
echo ""
echo "======================================"
echo "DRILL COMPLETED"
echo "======================================"
echo ""
echo "Total Duration: $((DURATION / 60)) minutes"
echo ""
echo "Metrics:"
echo "  - RTO Target: 60 minutes"
echo "  - RTO Actual: $((DURATION / 60)) minutes"
echo "  - Status: $( [ $DURATION -le 3600 ] && echo '✅ PASSED' || echo '❌ FAILED' )"
echo ""
echo "Post-Drill Actions:"
echo "  1. Conduct team debrief"
echo "  2. Document lessons learned"
echo "  3. Update runbook if needed"
echo "  4. Schedule failback"
```

---

## 💡 Best Practices

### 1. Automate Everything

```bash
# Bad: Manual processes
# 1. SSH to server
# 2. Run pg_dump
# 3. Copy file to laptop
# 4. Upload to S3

# Good: Automated CronJob
# - Runs automatically
# - Verifies backup
# - Uploads to multiple locations
# - Sends notifications
# - Self-healing
```

### 2. Test Regularly

```markdown
**Testing Schedule**:
- Daily: Backup verification
- Weekly: Test restore (sample)
- Monthly: Full restore test
- Quarterly: Failover drill
- Semi-annually: Complete DR exercise
```

### 3. Document Everything

```markdown
**Required Documentation**:
- [ ] DR Runbook with step-by-step procedures
- [ ] Contact information (current)
- [ ] Architecture diagrams
- [ ] RTO/RPO commitments
- [ ] Backup locations and retention
- [ ] Testing results and dates
- [ ] Incident post-mortems
```

### 4. Multi-Region by Default

```hcl
# Always deploy critical services to multiple regions
module "primary" {
  source = "./infrastructure"
  region = "us-east-1"
}

module "secondary" {
  source = "./infrastructure"
  region = "us-west-2"
}
```

### 5. Immutable Backups

```hcl
# S3 Object Lock prevents deletion
resource "aws_s3_bucket_object_lock_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 30
    }
  }
}
```

---

## 🔗 What's Next?

**Related Topics**:
- **[gitops-principles](gitops-principles)** - Version controlled infrastructure
- **[drift-detection](drift-detection)** - Detect changes

**Advanced**:
- **[cost-optimization](cost-optimization)** - Optimize DR costs
- **[security-hardening](security-hardening)** - Secure backups

---

## 📚 Resources

**AWS**:
- [AWS Disaster Recovery](https://aws.amazon.com/disaster-recovery/)
- [RDS Backup and Restore](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)

**Best Practices**:
- [NIST Contingency Planning](https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final)
- [Google SRE Book - Managing Risks](https://sre.google/sre-book/managing-risk/)

---

## 📝 Change Log

### 2026-01-30
- Created disaster recovery guide
- Explained RTO/RPO metrics
- Backup strategies
- Multi-region architecture
- Failover procedures
- DR documentation templates
- Testing procedures
- Best practices

---

**Remember**: Hope for the best, plan for the worst! 🚨
