# Drift Detection - Catch Infrastructure Changes

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Monitoring & Compliance  
**Prerequisites**: [terraform-basics](terraform-basics), [gitops-principles](gitops-principles)  
**Time**: 2-3 hours  
**Tags**: drift, detection, compliance, terraform, infrastructure, monitoring

## Summary

Learn to detect and remediate infrastructure drift. Master Terraform refresh, driftctl for cloud resource drift detection, automated monitoring, and strategies to prevent configuration divergence in production environments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand infrastructure drift
- ✅ Detect drift with Terraform
- ✅ Use driftctl for comprehensive scanning
- ✅ Automate drift detection
- ✅ Remediate drift safely
- ✅ Prevent drift with policies
- ✅ Monitor drift continuously
- ✅ Build drift reports

## 🔄 What is Infrastructure Drift?

### The Problem

**Day 1 - Deploy with Terraform**:
```hcl
resource "aws_instance" "web" {
  instance_type = "t3.small"
  ami           = "ami-12345"
  
  tags = {
    Environment = "production"
  }
}
```

**Day 30 - Manual changes**:
```bash
# Someone logs into AWS console and changes:
# - Instance type: t3.small → t3.large
# - Tags: Added "Owner: john"
# - Security group: Added port 3306

# Terraform doesn't know about these changes!
```

**Day 60 - Confusion**:
```
Developer: "Why is production using t3.large? We agreed on t3.small!"
Ops: "I needed more CPU for the spike last month..."
Finance: "Why is the bill higher?"
Security: "Who opened MySQL port to the internet?!"
```

---

### Types of Drift

```
┌──────────────────────────────────────────────────────┐
│           Infrastructure Drift Types                  │
│                                                      │
│  1. Resource Drift                                   │
│     Terraform-managed resources modified outside IaC │
│     Example: Change instance type in console         │
│                                                      │
│  2. Configuration Drift                              │
│     File changes, system settings                    │
│     Example: Edit nginx.conf manually on server      │
│                                                      │
│  3. Unmanaged Resources                              │
│     Resources created outside Terraform              │
│     Example: Manual S3 bucket creation               │
│                                                      │
│  4. Deleted Resources                                │
│     Resources removed outside Terraform              │
│     Example: Delete RDS instance from console        │
└──────────────────────────────────────────────────────┘
```

---

## 🔍 Terraform Drift Detection

### Refresh State

**Check for drift**:
```bash
# Old way (modifies state)
terraform refresh

# New way (safer, doesn't modify state)
terraform plan -refresh-only

# Output:
# Terraform will perform the following actions:
#
# ~ aws_instance.web (refresh only)
#   ~ instance_type = "t3.small" -> "t3.large"
#   ~ tags          = {
#       "Environment" = "production"
#     + "Owner"       = "john"
#     }
```

**What it shows**:
- `~` = Resource exists but modified
- `+` = Attribute added
- `-` = Attribute removed
- `-/+` = Resource will be replaced

---

### Detailed Drift Report

**Generate JSON output**:
```bash
terraform plan -refresh-only -out=drift.tfplan
terraform show -json drift.tfplan > drift.json

# Parse with jq
jq '.resource_changes[] | select(.change.actions | contains(["update"]))' drift.json

# Output:
# {
#   "address": "aws_instance.web",
#   "mode": "managed",
#   "type": "aws_instance",
#   "name": "web",
#   "change": {
#     "actions": ["update"],
#     "before": {
#       "instance_type": "t3.small"
#     },
#     "after": {
#       "instance_type": "t3.large"
#     }
#   }
# }
```

---

### Detect Specific Changes

**Script to find drift** (`check-drift.sh`):
```bash
#!/bin/bash
set -e

echo "Checking for infrastructure drift..."

# Run plan
terraform plan -refresh-only -detailed-exitcode -no-color > drift-check.txt 2>&1
EXIT_CODE=$?

# Exit codes:
# 0 = No changes (no drift)
# 1 = Error
# 2 = Changes detected (drift found)

if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ No drift detected"
    exit 0
elif [ $EXIT_CODE -eq 2 ]; then
    echo "✗ DRIFT DETECTED!"
    echo ""
    cat drift-check.txt
    
    # Send alert
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
      -H 'Content-Type: application/json' \
      -d '{
        "text": "⚠️ Infrastructure Drift Detected",
        "attachments": [{
          "color": "danger",
          "fields": [{
            "title": "Environment",
            "value": "'"$ENVIRONMENT"'",
            "short": true
          }]
        }]
      }'
    
    exit 2
else
    echo "✗ Error checking drift"
    cat drift-check.txt
    exit 1
fi
```

**Run daily**:
```bash
chmod +x check-drift.sh
./check-drift.sh
```

---

## 🛠️ Driftctl - Comprehensive Drift Detection

### Installation

```bash
# Linux
curl -L https://github.com/snyk/driftctl/releases/latest/download/driftctl_linux_amd64 -o driftctl
chmod +x driftctl
sudo mv driftctl /usr/local/bin/

# macOS
brew install driftctl

# Windows
scoop install driftctl

# Verify
driftctl version
```

---

### Basic Scan

**Scan all AWS resources**:
```bash
# Set AWS credentials
export AWS_REGION=us-east-1

# Scan
driftctl scan

# Output:
# Found 23 resource(s)
#  - 100% coverage
# Found 5 unmanaged resource(s)
#  - aws_s3_bucket.backup (not in Terraform)
#  - aws_security_group.manual-sg (not in Terraform)
#  - aws_instance.i-abc123 (not in Terraform)
# Found 2 resource(s) with drift
#  - aws_instance.web
#      ~ instance_type: "t3.small" => "t3.large"
#  - aws_security_group.web-sg
#      + ingress[3306]: "0.0.0.0/0"
# Found 16 managed resource(s)
#  - 16 resource(s) managed by Terraform
```

---

### Detailed Output

**HTML report**:
```bash
driftctl scan --output html://drift-report.html

# Opens report in browser
# Shows:
# - Resource coverage
# - Unmanaged resources
# - Drifted resources with diff
# - Chart visualization
```

**JSON output**:
```bash
driftctl scan --output json://drift.json

# Parse
jq '.summary' drift.json

# Output:
# {
#   "total_resources": 23,
#   "total_managed": 16,
#   "total_unmanaged": 5,
#   "total_drifted": 2
# }
```

---

### Scan Specific Resources

**Only EC2 instances**:
```bash
driftctl scan --filter "Type=='aws_instance'"
```

**Exclude S3 buckets**:
```bash
driftctl scan --filter "Type!='aws_s3_bucket'"
```

**Specific tags**:
```bash
driftctl scan --filter "Attr.tags.Environment=='production'"
```

---

### Ignore Resources

**.driftignore**:
```
# Ignore specific resources
aws_s3_bucket.logs-*
aws_cloudwatch_log_group.*

# Ignore resource types
aws_iam_role_policy_attachment.*

# Ignore by tags
aws_*.tags.ManagedBy==manual
```

**Scan with ignore file**:
```bash
driftctl scan --driftignore .driftignore
```

---

## 📊 Drift Detection Strategies

### 1. On-Demand Detection

**Manual checks**:
```bash
# Before deployment
terraform plan -refresh-only

# After deployment
driftctl scan

# When investigating issues
terraform state pull | jq '.resources'
```

**When to use**: Troubleshooting, pre-deployment verification

---

### 2. Scheduled Detection

**Daily drift check** (cron):
```bash
# /etc/cron.d/drift-check
0 6 * * * /opt/scripts/check-drift.sh
```

**Script** (`check-drift.sh`):
```bash
#!/bin/bash
set -e

REPORT_DIR="/var/reports/drift"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $REPORT_DIR

# Terraform drift
cd /opt/terraform/production
terraform plan -refresh-only -no-color > $REPORT_DIR/terraform-$DATE.txt 2>&1

# Driftctl scan
driftctl scan --output json://$REPORT_DIR/driftctl-$DATE.json

# Parse results
TERRAFORM_EXIT=$?
DRIFTED=$(jq '.summary.total_drifted' $REPORT_DIR/driftctl-$DATE.json)

if [ $DRIFTED -gt 0 ]; then
    # Send alert
    python3 /opt/scripts/send-drift-alert.py \
      --terraform-report $REPORT_DIR/terraform-$DATE.txt \
      --driftctl-report $REPORT_DIR/driftctl-$DATE.json
fi

# Cleanup old reports (keep 30 days)
find $REPORT_DIR -name "*.txt" -mtime +30 -delete
find $REPORT_DIR -name "*.json" -mtime +30 -delete
```

---

### 3. Continuous Detection (CI/CD)

**GitHub Actions** (`.github/workflows/drift-detection.yml`):
```yaml
name: Drift Detection

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:        # Manual trigger

jobs:
  detect-drift:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Terraform Init
        run: terraform init
        working-directory: terraform/production
      
      - name: Check Terraform Drift
        id: terraform-drift
        run: |
          terraform plan -refresh-only -detailed-exitcode -no-color | tee drift.txt
        continue-on-error: true
        working-directory: terraform/production
      
      - name: Install driftctl
        run: |
          curl -L https://github.com/snyk/driftctl/releases/latest/download/driftctl_linux_amd64 -o driftctl
          chmod +x driftctl
          sudo mv driftctl /usr/local/bin/
      
      - name: Run driftctl
        run: |
          driftctl scan --output json://drift.json
          cat drift.json | jq
      
      - name: Parse Results
        id: parse
        run: |
          DRIFTED=$(jq '.summary.total_drifted' drift.json)
          UNMANAGED=$(jq '.summary.total_unmanaged' drift.json)
          
          echo "drifted=$DRIFTED" >> $GITHUB_OUTPUT
          echo "unmanaged=$UNMANAGED" >> $GITHUB_OUTPUT
          
          # Generate summary
          jq -r '.unmanaged_resources[] | "⚠️ Unmanaged: \(.type).\(.id)"' drift.json > summary.txt
          jq -r '.drifts[] | "🔄 Drift: \(.type).\(.id)"' drift.json >> summary.txt
      
      - name: Create Issue if Drift
        if: steps.parse.outputs.drifted > 0 || steps.parse.outputs.unmanaged > 0
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('summary.txt', 'utf8');
            
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Infrastructure Drift Detected - ${new Date().toISOString().split('T')[0]}`,
              body: `## Drift Detection Report
              
              **Drifted Resources**: ${process.env.DRIFTED}
              **Unmanaged Resources**: ${process.env.UNMANAGED}
              
              ### Details
              \`\`\`
              ${summary}
              \`\`\`
              
              ### Actions Required
              1. Review changes in AWS Console
              2. Update Terraform code to match desired state
              3. Or apply Terraform to revert changes
              
              See workflow run: ${context.payload.repository.html_url}/actions/runs/${context.runId}
              `,
              labels: ['drift', 'infrastructure', 'alert']
            });
        env:
          DRIFTED: ${{ steps.parse.outputs.drifted }}
          UNMANAGED: ${{ steps.parse.outputs.unmanaged }}
      
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: drift-reports
          path: |
            drift.txt
            drift.json
```

---

### 4. Real-Time Detection (Advanced)

**CloudWatch Events + Lambda**:
```python
# lambda_function.py
import boto3
import json
import os
from datetime import datetime

s3 = boto3.client('s3')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Triggered by CloudWatch Events on resource changes
    """
    
    # Parse CloudWatch event
    detail = event['detail']
    event_name = detail['eventName']
    resource_type = detail.get('requestParameters', {}).get('resourceType')
    
    # Resources to monitor
    monitored_events = [
        'ModifyInstanceAttribute',
        'AuthorizeSecurityGroupIngress',
        'CreateTags',
        'DeleteTags',
        'ModifyDBInstance'
    ]
    
    if event_name in monitored_events:
        # Get current state from Terraform
        # Compare with actual AWS state
        # Detect drift
        
        message = {
            'timestamp': datetime.utcnow().isoformat(),
            'event': event_name,
            'resource': resource_type,
            'user': detail['userIdentity']['arn'],
            'changes': detail.get('requestParameters', {})
        }
        
        # Send alert
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f'Potential Drift: {event_name}',
            Message=json.dumps(message, indent=2)
        )
        
        # Log to S3
        s3.put_object(
            Bucket=os.environ['DRIFT_BUCKET'],
            Key=f"drift-events/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json",
            Body=json.dumps(message)
        )
    
    return {'statusCode': 200}
```

**CloudWatch Event Rule**:
```json
{
  "source": ["aws.ec2", "aws.rds"],
  "detail-type": ["AWS API Call via CloudTrail"],
  "detail": {
    "eventName": [
      "ModifyInstanceAttribute",
      "AuthorizeSecurityGroupIngress",
      "CreateTags"
    ]
  }
}
```

---

## 🔧 Remediation Strategies

### 1. Import Changes to Terraform

**For new resources**:
```bash
# Discover resource
driftctl scan --filter "Type=='aws_s3_bucket'" | grep "not in Terraform"

# Output: aws_s3_bucket.manual-bucket (not in Terraform)

# Import to Terraform
terraform import aws_s3_bucket.manual_bucket manual-bucket

# Add to configuration
cat >> main.tf <<EOF
resource "aws_s3_bucket" "manual_bucket" {
  bucket = "manual-bucket"
  
  tags = {
    ManagedBy = "terraform"
  }
}
EOF

# Plan
terraform plan
```

---

### 2. Revert to Terraform State

**For modified resources**:
```bash
# Check drift
terraform plan -refresh-only

# Output shows:
# ~ aws_instance.web
#   ~ instance_type = "t3.small" -> "t3.large"

# Option A: Accept change (update Terraform)
# Edit main.tf:
# instance_type = "t3.large"

# Option B: Revert change (apply Terraform)
terraform apply

# This will:
# ~ Update in-place aws_instance.web
#   ~ instance_type: "t3.large" -> "t3.small"
```

---

### 3. Automated Remediation

**Auto-fix script** (`auto-remediate.sh`):
```bash
#!/bin/bash
set -e

ENVIRONMENT=$1
DRY_RUN=${2:-true}

if [ "$DRY_RUN" = "true" ]; then
    echo "DRY RUN MODE - No changes will be applied"
fi

cd /opt/terraform/$ENVIRONMENT

# Check drift
terraform plan -refresh-only -out=drift.tfplan -detailed-exitcode
DRIFT_EXIT=$?

if [ $DRIFT_EXIT -eq 0 ]; then
    echo "No drift detected"
    exit 0
elif [ $DRIFT_EXIT -eq 2 ]; then
    echo "Drift detected, analyzing..."
    
    # Generate JSON
    terraform show -json drift.tfplan > drift.json
    
    # Get changes
    CHANGES=$(jq -r '.resource_changes[] | 
      select(.change.actions | contains(["update"])) | 
      "\(.address): \(.change.actions)"' drift.json)
    
    echo "Changes detected:"
    echo "$CHANGES"
    
    # Auto-approve safe changes
    SAFE_ATTRS="tags,tags_all,description,enable_deletion_protection"
    
    for RESOURCE in $(jq -r '.resource_changes[] | .address' drift.json); do
        ATTRS=$(jq -r ".resource_changes[] | 
          select(.address == \"$RESOURCE\") | 
          .change.before | keys[]" drift.json)
        
        SAFE=true
        for ATTR in $ATTRS; do
            if ! echo "$SAFE_ATTRS" | grep -q "$ATTR"; then
                SAFE=false
                break
            fi
        done
        
        if [ "$SAFE" = "true" ]; then
            echo "✓ Safe to auto-remediate: $RESOURCE"
            
            if [ "$DRY_RUN" = "false" ]; then
                terraform apply -auto-approve -target="$RESOURCE"
            fi
        else
            echo "⚠ Requires manual review: $RESOURCE"
            
            # Create incident ticket
            curl -X POST https://api.pagerduty.com/incidents \
              -H "Authorization: Token token=$PD_TOKEN" \
              -d "{
                \"incident\": {
                  \"type\": \"incident\",
                  \"title\": \"Infrastructure Drift: $RESOURCE\",
                  \"body\": {
                    \"type\": \"incident_body\",
                    \"details\": \"Drift detected requiring manual review\"
                  }
                }
              }"
        fi
    done
else
    echo "Error checking drift"
    exit 1
fi
```

**Run safely**:
```bash
# Dry run first
./auto-remediate.sh production true

# Apply for real
./auto-remediate.sh production false
```

---

## 🚫 Drift Prevention

### 1. Prevent Manual Changes

**AWS Service Control Policy** (SCP):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PreventManualEC2Changes",
      "Effect": "Deny",
      "Action": [
        "ec2:ModifyInstanceAttribute",
        "ec2:TerminateInstances",
        "ec2:CreateTags",
        "ec2:DeleteTags"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::123456789012:role/TerraformRole"
        }
      }
    }
  ]
}
```

---

### 2. Enforce Tags

**Require ManagedBy tag**:
```hcl
# Terraform locals
locals {
  common_tags = {
    ManagedBy   = "terraform"
    Environment = var.environment
    Project     = var.project
  }
}

# Apply to all resources
resource "aws_instance" "web" {
  # ...
  tags = merge(local.common_tags, {
    Name = "web-server"
  })
}
```

**AWS Config Rule**:
```yaml
Resources:
  RequireManagedByTag:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: require-managed-by-tag
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters:
        tag1Key: ManagedBy
```

---

### 3. Immutable Infrastructure

**Replace, don't modify**:
```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t3.small"
  
  # Prevent in-place changes
  lifecycle {
    create_before_destroy = true
    
    # Force replacement on these changes
    replace_triggered_by = [
      aws_ami.app.id
    ]
  }
}
```

**Benefits**:
- No drift (old instances destroyed)
- Predictable deployments
- Easy rollback

---

### 4. Read-Only Production Access

**Terraform Cloud/Enterprise**:
```hcl
# Require approval for production
resource "tfe_workspace" "production" {
  name         = "production"
  organization = "myorg"
  
  # Require manual approval
  auto_apply = false
  
  # VCS-driven workflow
  vcs_repo {
    identifier = "myorg/infrastructure"
    branch     = "main"
  }
}
```

**IAM Policy** (read-only except Terraform):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:List*",
        "rds:Describe*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "ec2:*",
        "s3:*",
        "rds:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::123456789012:role/TerraformRole"
        }
      }
    }
  ]
}
```

---

## 📈 Drift Monitoring Dashboard

### Grafana Dashboard

**Metrics from drift checks**:
```bash
# Export metrics
cat > /var/lib/node_exporter/textfile_collector/drift.prom <<EOF
# HELP infrastructure_drift_resources Total drifted resources
# TYPE infrastructure_drift_resources gauge
infrastructure_drift_resources{environment="production"} $DRIFTED_COUNT

# HELP infrastructure_unmanaged_resources Total unmanaged resources
# TYPE infrastructure_unmanaged_resources gauge
infrastructure_unmanaged_resources{environment="production"} $UNMANAGED_COUNT

# HELP infrastructure_total_resources Total resources
# TYPE infrastructure_total_resources gauge
infrastructure_total_resources{environment="production"} $TOTAL_COUNT
EOF
```

**Prometheus scrape**:
```yaml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

**Grafana panels**:
```json
{
  "panels": [
    {
      "title": "Drift Status",
      "targets": [
        {
          "expr": "infrastructure_drift_resources"
        }
      ],
      "alert": {
        "conditions": [
          {
            "evaluator": {
              "params": [0],
              "type": "gt"
            },
            "query": {
              "params": ["A", "5m", "now"]
            }
          }
        ]
      }
    }
  ]
}
```

---

## 💡 Best Practices

### 1. Regular Scanning

```bash
# Daily scheduled scans
0 6 * * * /opt/scripts/check-drift.sh

# After deployments
terraform apply && driftctl scan

# Before changes
driftctl scan --output html://pre-change-report.html
```

---

### 2. Document Exceptions

**drift-exceptions.md**:
```markdown
# Known Drift Exceptions

## aws_cloudwatch_log_group.app_logs
- **Drift**: Retention period manually changed to 14 days
- **Reason**: Cost optimization during investigation
- **Action**: Will be reverted after investigation completes
- **Owner**: ops-team
- **Date**: 2026-01-15
- **Ticket**: INFRA-1234

## aws_s3_bucket.temp_backup
- **Drift**: Created manually for emergency backup
- **Reason**: Production incident required immediate backup
- **Action**: Will be imported to Terraform
- **Owner**: sre-team
- **Date**: 2026-01-20
- **Ticket**: INCIDENT-5678
```

---

### 3. Automate Remediation

```bash
# Safe auto-remediation for tags, descriptions
if is_safe_change "$RESOURCE" "$ATTRIBUTE"; then
    terraform apply -auto-approve -target="$RESOURCE"
fi

# Manual approval for sensitive changes
if is_critical_resource "$RESOURCE"; then
    create_approval_request "$RESOURCE" "$CHANGES"
fi
```

---

### 4. Track Drift Over Time

```sql
-- Drift history table
CREATE TABLE drift_scans (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    environment VARCHAR(50),
    total_resources INT,
    drifted_resources INT,
    unmanaged_resources INT,
    scan_duration_seconds FLOAT,
    report_json JSONB
);

-- Query trends
SELECT 
    date_trunc('day', timestamp) as date,
    environment,
    AVG(drifted_resources) as avg_drift,
    MAX(drifted_resources) as max_drift
FROM drift_scans
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY date, environment
ORDER BY date DESC;
```

---

## 🔗 What's Next?

**Related Topics**:
- **[gitops-principles](gitops-principles)** - Prevent drift with GitOps
- **[infrastructure-testing](infrastructure-testing)** - Test before drift happens

**Advanced**:
- **[immutable-infrastructure](immutable-infrastructure)** - Replace instead of modify
- **Policy as code** - Enforce standards

---

## 📚 Resources

**Tools**:
- [driftctl](https://driftctl.com/) - Comprehensive drift detection
- [Terraform](https://terraform.io/) - Infrastructure as Code
- [Terragrunt](https://terragrunt.gruntwork.io/) - Terraform wrapper

**Best Practices**:
- [HashiCorp Drift Detection](https://www.terraform.io/docs/cloud/run/drift.html)
- [AWS Config](https://aws.amazon.com/config/) - Resource compliance

---

## 📝 Change Log

### 2026-01-30
- Created drift detection guide
- Explained drift types and impact
- Demonstrated Terraform refresh
- Showed driftctl comprehensive scanning
- Detection strategies (on-demand, scheduled, CI/CD, real-time)
- Remediation approaches
- Prevention techniques
- Monitoring and dashboards
- Best practices

---

**Next Article**: Build more infrastructure automation! 🚀
