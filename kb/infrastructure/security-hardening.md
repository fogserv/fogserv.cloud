# Infrastructure Security Hardening

## Prerequisites

- Cloud account with administrative access (AWS/Azure/GCP)
- Basic understanding of IAM, networking, and encryption
- Terraform or cloud CLI tools installed
- **Recommended**: Complete [Terraform basics](./terraform-basics) and [networking fundamentals](../networking/tcp-ip-fundamentals)

## Summary

This guide covers comprehensive security hardening for cloud infrastructure, implementing defense-in-depth strategies to protect against threats. You'll learn CIS benchmark compliance, IAM best practices, encryption implementation, network security, threat detection, and automated compliance monitoring.

Security breaches cost organizations millions in damages, regulatory fines, and reputation loss. A single misconfigured S3 bucket or overly permissive IAM policy can expose sensitive data to the internet. This guide provides practical hardening techniques following industry standards to significantly reduce your attack surface.

## What You'll Learn

- [ ] Implement CIS benchmark security controls
- [ ] Configure IAM with least privilege principles
- [ ] Enforce multi-factor authentication (MFA)
- [ ] Enable encryption at rest and in transit
- [ ] Harden network security with firewalls and NACLs
- [ ] Deploy AWS WAF for application protection
- [ ] Set up threat detection with GuardDuty
- [ ] Centralize security findings with Security Hub
- [ ] Manage secrets with Secrets Manager
- [ ] Implement compliance as code with OPA
- [ ] Automate security remediation
- [ ] Monitor and audit all access with CloudTrail

---

## CIS Benchmarks

### What are CIS Benchmarks?

Center for Internet Security (CIS) publishes security configuration baselines for various platforms. CIS Benchmarks provide prescriptive guidance for securing systems.

**CIS AWS Foundations Benchmark** covers:
- IAM configuration
- Logging and monitoring
- Networking
- Data protection

Each control has:
- **Level 1**: Basic security (minimal business impact)
- **Level 2**: Defense-in-depth (may impact operations)

### Automated CIS Compliance Scanning

**Prowler** - Open-source AWS security tool:

```bash
# Installation
pip3 install prowler

# Or use Docker
docker run -it --rm \
  -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  -e AWS_SESSION_TOKEN \
  -v $(pwd)/output:/home/prowler/output \
  toniblyx/prowler:latest

# Run full CIS Benchmark scan
prowler aws --compliance cis_2.0_aws

# Output shows PASS/FAIL for each control:
# [PASS] 1.1 - Avoid root account use
# [FAIL] 1.2 - Ensure MFA enabled for root account
# [PASS] 1.3 - Ensure credentials unused for 90 days disabled
# [FAIL] 2.1.1 - Ensure S3 bucket logging enabled

# Generate HTML report
prowler aws --compliance cis_2.0_aws --output-formats html
# Creates prowler-output-*.html with all findings
```

**AWS Security Hub** - Native CIS compliance:

```hcl
# Terraform to enable Security Hub with CIS standard
resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:us-east-1::standards/cis-aws-foundations-benchmark/v/1.4.0"
  
  depends_on = [aws_securityhub_account.main]
}

# Security Hub automatically checks compliance
# View in Console: Security Hub → Security Standards → CIS AWS Foundations Benchmark
```

**Key CIS Controls to Implement**:

1. **1.4 - Ensure access keys rotated every 90 days**:
```bash
# Find old access keys
aws iam generate-credential-report
aws iam get-credential-report --query 'Content' --output text | base64 -d > credentials.csv

# Parse CSV for keys older than 90 days
awk -F',' '$11 != "N/A" && $11 < "'$(date -d '90 days ago' +%Y-%m-%d)'" {print $1, $11}' credentials.csv
```

2. **1.12 - Ensure no root account access key exists**:
```bash
# Check root account credentials
aws iam get-account-summary | grep AccountAccessKeysPresent
# Should be 0

# If root keys exist, delete immediately
aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE --user-name root
```

3. **2.1.1 - Ensure S3 bucket logging enabled**:
```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "my-logs-bucket"
}

resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

resource "aws_s3_bucket_logging" "data" {
  bucket = aws_s3_bucket.data.id
  
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}
```

4. **2.1.2 - Ensure S3 bucket has MFA Delete enabled**:
```bash
# Enable versioning first
aws s3api put-bucket-versioning \
  --bucket my-bucket \
  --versioning-configuration Status=Enabled

# Enable MFA Delete (requires root account with MFA)
aws s3api put-bucket-versioning \
  --bucket my-bucket \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789012:mfa/root-account-mfa-device XXXXXX"
```

5. **2.3.1 - Ensure RDS encryption enabled**:
```hcl
resource "aws_db_instance" "main" {
  identifier     = "mydb"
  engine         = "postgres"
  instance_class = "db.t3.medium"
  
  storage_encrypted = true
  kms_key_id        = aws_kms_key.db.arn
  
  # Other configuration...
}
```

6. **3.1 - Ensure CloudTrail enabled in all regions**:
```hcl
resource "aws_cloudtrail" "main" {
  name                          = "organization-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/"]
    }
  }
}
```

7. **4.1 - Ensure no security groups allow 0.0.0.0/0 ingress to port 22**:
```bash
# Find security groups with SSH open to world
aws ec2 describe-security-groups \
  --query 'SecurityGroups[?IpPermissions[?FromPort==`22` && ToPort==`22` && IpRanges[?CidrIp==`0.0.0.0/0`]]].[GroupId,GroupName]' \
  --output table

# Revoke the rule
aws ec2 revoke-security-group-ingress \
  --group-id sg-abc123 \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# Add restricted rule instead
aws ec2 authorize-security-group-ingress \
  --group-id sg-abc123 \
  --protocol tcp \
  --port 22 \
  --cidr 203.0.113.0/24  # Your office IP range
```

### Azure CIS Benchmarks

```bash
# Azure Secure Score (built-in CIS compliance)
az security secure-score list

# Microsoft Defender for Cloud
az security pricing list
az security pricing create \
  --name VirtualMachines \
  --tier Standard

# Azure Policy for CIS compliance
az policy assignment create \
  --name "CIS-Azure-Benchmark" \
  --policy-set-definition "/providers/Microsoft.Authorization/policySetDefinitions/c3f5c4d9-9a1d-4a99-85c0-7f93e1b5b0e8" \
  --scope "/subscriptions/{subscription-id}"
```

### GCP CIS Benchmarks

```bash
# Security Command Center
gcloud services enable securitycenter.googleapis.com

# Security Health Analytics
gcloud scc findings list ORGANIZATION_ID \
  --source=ORGANIZATION_ID/sources/SECURITY_HEALTH_ANALYTICS_SOURCE_ID \
  --filter="category:\"CIS_GCP_BENCHMARK\""

# Forseti Security (open-source)
git clone https://github.com/forseti-security/forseti-security.git
cd forseti-security
python3 install/gcp_installer.py
```

---

## IAM Least Privilege

### Principle of Least Privilege

Grant minimum permissions required for task completion. Avoid wildcard permissions and overly broad policies.

**Bad Practice** (wildcard everything):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "*",
    "Resource": "*"
  }]
}
```

**Good Practice** (specific permissions):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-app-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/my-table"
    }
  ]
}
```

### IAM Policy Best Practices

**1. Use IAM Roles, Not Long-Term Credentials**:

```hcl
# EC2 instance with IAM role
resource "aws_iam_role" "ec2_app" {
  name = "ec2-app-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ec2_app" {
  name = "ec2-app-policy"
  role = aws_iam_role.ec2_app.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject"
      ]
      Resource = "arn:aws:s3:::my-app-bucket/*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_app" {
  name = "ec2-app-profile"
  role = aws_iam_role.ec2_app.name
}

resource "aws_instance" "app" {
  ami                  = data.aws_ami.amazon_linux_2.id
  instance_type        = "t3.medium"
  iam_instance_profile = aws_iam_instance_profile.ec2_app.name
  
  # Application automatically uses IAM role
  # No hard-coded credentials needed
}
```

**2. Implement Permission Boundaries**:

```hcl
# Boundary limits maximum permissions
resource "aws_iam_policy" "developer_boundary" {
  name = "DeveloperBoundary"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*",
          "dynamodb:*",
          "lambda:*",
          "ec2:Describe*"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "iam:*",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Apply boundary to developer role
resource "aws_iam_role" "developer" {
  name                 = "developer-role"
  permissions_boundary = aws_iam_policy.developer_boundary.arn
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::123456789012:root"
      }
    }]
  })
}

# Developer can never exceed boundary permissions
# Even if granted additional policies
```

**3. Use Service Control Policies (SCPs)**:

Organization-level policies preventing actions across all accounts:

```hcl
# Deny root account usage
resource "aws_organizations_policy" "deny_root" {
  name    = "DenyRootAccountUsage"
  type    = "SERVICE_CONTROL_POLICY"
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Deny"
      Action = "*"
      Resource = "*"
      Condition = {
        StringLike = {
          "aws:PrincipalArn" = "arn:aws:iam::*:root"
        }
      }
    }]
  })
}

# Prevent disabling CloudTrail
resource "aws_organizations_policy" "protect_cloudtrail" {
  name = "ProtectCloudTrail"
  type = "SERVICE_CONTROL_POLICY"
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Deny"
      Action = [
        "cloudtrail:StopLogging",
        "cloudtrail:DeleteTrail"
      ]
      Resource = "*"
    }]
  })
}

# Restrict regions
resource "aws_organizations_policy" "restrict_regions" {
  name = "RestrictRegions"
  type = "SERVICE_CONTROL_POLICY"
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Deny"
      NotAction = [
        "iam:*",
        "cloudfront:*",
        "route53:*",
        "support:*"
      ]
      Resource = "*"
      Condition = {
        StringNotEquals = {
          "aws:RequestedRegion" = [
            "us-east-1",
            "us-west-2"
          ]
        }
      }
    }]
  })
}

# Attach policies to organizational unit
resource "aws_organizations_policy_attachment" "production" {
  policy_id = aws_organizations_policy.deny_root.id
  target_id = aws_organizations_organizational_unit.production.id
}
```

**4. Analyze IAM with Access Analyzer**:

```hcl
resource "aws_accessanalyzer_analyzer" "main" {
  analyzer_name = "organization-analyzer"
  type          = "ORGANIZATION"
  
  depends_on = [aws_organizations_organization.main]
}

# Access Analyzer identifies:
# - Resources shared with external accounts
# - Overly permissive policies
# - Unused access
```

Check findings:
```bash
# List findings
aws accessanalyzer list-findings \
  --analyzer-arn arn:aws:access-analyzer:us-east-1:123456789012:analyzer/organization-analyzer

# Example finding:
# {
#   "id": "abc123",
#   "resourceType": "AWS::S3::Bucket",
#   "resource": "arn:aws:s3:::my-bucket",
#   "principal": {"AWS": "123456789999"},  # External account
#   "action": ["s3:GetObject"],
#   "condition": {},
#   "isPublic": false
# }
```

**5. Credential Rotation**:

```bash
# Find old access keys
aws iam list-users --query 'Users[].UserName' --output text | while read user; do
  aws iam list-access-keys --user-name $user --query 'AccessKeyMetadata[?Status==`Active`].[UserName,AccessKeyId,CreateDate]' --output text | while read username keyid date; do
    age=$(( ($(date +%s) - $(date -d "$date" +%s)) / 86400 ))
    if [ $age -gt 90 ]; then
      echo "Key $keyid for $username is $age days old - rotate immediately"
    fi
  done
done

# Automated rotation with Lambda
# Triggered by EventBridge rule every 90 days
```

**Terraform automated rotation**:
```hcl
resource "aws_iam_user" "service_account" {
  name = "app-service-account"
}

resource "aws_iam_access_key" "service_account" {
  user = aws_iam_user.service_account.name
}

# Store in Secrets Manager with rotation
resource "aws_secretsmanager_secret" "service_account" {
  name = "app-service-account-key"
  
  rotation_rules {
    automatically_after_days = 90
  }
}

resource "aws_secretsmanager_secret_version" "service_account" {
  secret_id = aws_secretsmanager_secret.service_account.id
  secret_string = jsonencode({
    access_key_id     = aws_iam_access_key.service_account.id
    secret_access_key = aws_iam_access_key.service_account.secret
  })
}
```

---

## Multi-Factor Authentication (MFA)

### Enforce MFA for Console Access

```hcl
# IAM policy requiring MFA for all actions
resource "aws_iam_policy" "require_mfa" {
  name = "RequireMFA"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyAllExceptListedIfNoMFA"
      Effect = "Deny"
      NotAction = [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:ListMFADevices",
        "iam:ListVirtualMFADevices",
        "iam:ResyncMFADevice",
        "sts:GetSessionToken"
      ]
      Resource = "*"
      Condition = {
        BoolIfExists = {
          "aws:MultiFactorAuthPresent" = "false"
        }
      }
    }]
  })
}

# Attach to all users
resource "aws_iam_group" "all_users" {
  name = "AllUsers"
}

resource "aws_iam_group_policy_attachment" "require_mfa" {
  group      = aws_iam_group.all_users.name
  policy_arn = aws_iam_policy.require_mfa.arn
}

resource "aws_iam_user_group_membership" "example" {
  user   = aws_iam_user.example.name
  groups = [aws_iam_group.all_users.name]
}
```

Users without MFA can only:
1. List their MFA devices
2. Create virtual MFA device
3. Enable MFA device
4. Resync MFA if out of sync

All other actions denied until MFA enabled.

### Enforce MFA for Root Account

```bash
# Check if root MFA enabled
aws iam get-account-summary | grep AccountMFAEnabled
# Should be 1

# Enable virtual MFA for root
# 1. Sign in as root
# 2. IAM Dashboard → Activate MFA on your root account
# 3. Choose Virtual MFA device
# 4. Scan QR code with authenticator app
# 5. Enter two consecutive MFA codes
# 6. MFA activated
```

### MFA for API/CLI Access

Require MFA for sensitive operations:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowInstanceTerminationWithMFA",
    "Effect": "Allow",
    "Action": "ec2:TerminateInstances",
    "Resource": "*",
    "Condition": {
      "Bool": {
        "aws:MultiFactorAuthPresent": "true"
      }
    }
  }]
}
```

Using CLI with MFA:
```bash
# Get temporary credentials with MFA
aws sts get-session-token \
  --serial-number arn:aws:iam::123456789012:mfa/john \
  --token-code 123456 \
  --duration-seconds 43200

# Output includes temporary AccessKeyId, SecretAccessKey, SessionToken
# Export these and use for next 12 hours
export AWS_ACCESS_KEY_ID=ASIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_SESSION_TOKEN=verylongtoken...

# Now can perform MFA-required actions
aws ec2 terminate-instances --instance-ids i-abc123
```

---

## Encryption

### Encryption at Rest

**S3 Bucket Encryption**:

```hcl
# Default encryption for all objects
resource "aws_s3_bucket" "data" {
  bucket = "sensitive-data-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true  # Reduces KMS costs
  }
}

# Deny unencrypted uploads
resource "aws_s3_bucket_policy" "require_encryption" {
  bucket = aws_s3_bucket.data.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyUnencryptedObjectUploads"
      Effect = "Deny"
      Principal = "*"
      Action = "s3:PutObject"
      Resource = "${aws_s3_bucket.data.arn}/*"
      Condition = {
        StringNotEquals = {
          "s3:x-amz-server-side-encryption" = "aws:kms"
        }
      }
    }]
  })
}
```

**EBS Volume Encryption**:

```hcl
# Enable EBS encryption by default for region
resource "aws_ebs_encryption_by_default" "main" {
  enabled = true
}

# All new volumes automatically encrypted
resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"
  
  root_block_device {
    encrypted   = true
    kms_key_id  = aws_kms_key.ebs.arn
    volume_size = 20
  }
}

# Encrypt existing unencrypted volume
# 1. Create snapshot
# 2. Copy snapshot with encryption
# 3. Create volume from encrypted snapshot
# 4. Detach old volume, attach new volume
```

**RDS Encryption**:

```hcl
resource "aws_db_instance" "main" {
  identifier     = "mydb"
  engine         = "postgres"
  instance_class = "db.t3.medium"
  
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn
  
  # Enable encryption for backups
  backup_retention_period = 7
  # Backups automatically encrypted with same key
}

# Note: Cannot enable encryption on existing unencrypted DB
# Must create encrypted snapshot and restore to new encrypted instance
```

**KMS Key Management**:

```hcl
# Customer-managed key with rotation
resource "aws_kms_key" "main" {
  description             = "Application encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true  # Automatic yearly rotation
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::123456789012:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow services to use key"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "rds.amazonaws.com",
            "ec2.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/application-key"
  target_key_id = aws_kms_key.main.key_id
}
```

### Encryption in Transit

**Enforce HTTPS/TLS**:

```hcl
# S3 bucket policy requiring TLS
resource "aws_s3_bucket_policy" "require_tls" {
  bucket = aws_s3_bucket.data.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyNonHTTPS"
      Effect = "Deny"
      Principal = "*"
      Action = "s3:*"
      Resource = [
        aws_s3_bucket.data.arn,
        "${aws_s3_bucket.data.arn}/*"
      ]
      Condition = {
        Bool = {
          "aws:SecureTransport" = "false"
        }
      }
    }]
  })
}

# ALB with HTTPS listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"  # TLS 1.2+
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Redirect HTTP to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

**RDS Force SSL**:

```hcl
resource "aws_db_instance" "main" {
  identifier     = "mydb"
  engine         = "postgres"
  instance_class = "db.t3.medium"
  
  # PostgreSQL: require SSL
  parameter_group_name = aws_db_parameter_group.ssl_required.name
}

resource "aws_db_parameter_group" "ssl_required" {
  name   = "postgres-ssl-required"
  family = "postgres15"
  
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

# MySQL: require SSL
resource "aws_db_parameter_group" "mysql_ssl" {
  name   = "mysql-ssl-required"
  family = "mysql8.0"
  
  parameter {
    name  = "require_secure_transport"
    value = "ON"
  }
}
```

**Application TLS**:

```nginx
# Nginx with strong TLS configuration
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # TLS 1.2 and 1.3 only
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Strong ciphers
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers on;
    
    # HSTS (force HTTPS for 1 year)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    location / {
        proxy_pass http://backend;
        
        # Secure headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}
```

---

## Network Security

### Security Groups (Stateful Firewall)

**Principle**: Default deny, explicit allow

```hcl
# Web tier security group
resource "aws_security_group" "web" {
  name        = "web-tier"
  description = "Allow inbound HTTPS from internet"
  vpc_id      = aws_vpc.main.id
  
  # HTTPS from internet
  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # All outbound allowed (for pulling dependencies, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "web-tier"
  }
}

# Application tier security group
resource "aws_security_group" "app" {
  name        = "app-tier"
  description = "Allow traffic from web tier"
  vpc_id      = aws_vpc.main.id
  
  # Only from web tier
  ingress {
    description     = "HTTP from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "app-tier"
  }
}

# Database tier security group
resource "aws_security_group" "db" {
  name        = "db-tier"
  description = "Allow traffic from app tier only"
  vpc_id      = aws_vpc.main.id
  
  # PostgreSQL only from app tier
  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  
  # No outbound internet access
  egress {
    description = "Allow to VPC only"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  
  tags = {
    Name = "db-tier"
  }
}
```

**Security Group Anti-Patterns to Avoid**:

❌ SSH/RDP open to 0.0.0.0/0:
```hcl
# NEVER do this
ingress {
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # Anyone on internet can try to SSH
}
```

✅ SSH from bastion only:
```hcl
ingress {
  description     = "SSH from bastion"
  from_port       = 22
  to_port         = 22
  protocol        = "tcp"
  security_groups = [aws_security_group.bastion.id]
}
```

### Network ACLs (Stateless Firewall)

Additional layer of defense at subnet level:

```hcl
# Public subnet NACL
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id
  
  # Allow HTTPS inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  
  # Allow HTTP inbound (for Let's Encrypt challenges)
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  
  # Allow ephemeral ports inbound (for responses)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
  
  # Allow all outbound
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  tags = {
    Name = "public-nacl"
  }
}

# Private subnet NACL (deny all inbound from internet)
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id
  
  # Allow from VPC CIDR only
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 0
  }
  
  # Deny all other inbound
  ingress {
    protocol   = "-1"
    rule_no    = 999
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  # Allow all outbound
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  tags = {
    Name = "private-nacl"
  }
}
```

### VPC Flow Logs

Capture all network traffic for analysis:

```hcl
# Flow logs to CloudWatch
resource "aws_flow_log" "main" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"  # ALL, ACCEPT, or REJECT
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs"
  retention_in_days = 30
}

# Query flow logs with CloudWatch Insights
# Example: Find rejected connections
# fields @timestamp, srcAddr, dstAddr, dstPort, action
# | filter action = "REJECT"
# | sort @timestamp desc
# | limit 100

# Flow logs to S3 for long-term storage
resource "aws_flow_log" "s3" {
  vpc_id               = aws_vpc.main.id
  traffic_type         = "ALL"
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs.arn
  
  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }
}

# Query with Athena
resource "aws_athena_database" "flow_logs" {
  name   = "vpc_flow_logs"
  bucket = aws_s3_bucket.athena_results.bucket
}

resource "aws_athena_workgroup" "flow_logs" {
  name = "flow-logs-analysis"
}
```

Query flow logs with Athena:
```sql
-- Top talkers by bytes
SELECT srcaddr, dstaddr, SUM(bytes) as total_bytes
FROM flow_logs
WHERE date = DATE('2026-01-30')
GROUP BY srcaddr, dstaddr
ORDER BY total_bytes DESC
LIMIT 10;

-- Rejected connections (potential attacks)
SELECT srcaddr, dstport, COUNT(*) as attempts
FROM flow_logs
WHERE date = DATE('2026-01-30') AND action = 'REJECT'
GROUP BY srcaddr, dstport
HAVING attempts > 100
ORDER BY attempts DESC;
```

### AWS WAF (Web Application Firewall)

Protect against common web exploits:

```hcl
# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "main-waf"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # Rate limiting (prevent DDoS)
  rule {
    name     = "rate-limit"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL injection protection
  rule {
    name     = "sql-injection"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      sqli_match_statement {
        field_to_match {
          body {}
        }
        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRule"
      sampled_requests_enabled   = true
    }
  }
  
  # XSS protection
  rule {
    name     = "xss-protection"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      xss_match_statement {
        field_to_match {
          body {}
        }
        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "XSSRule"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules
  rule {
    name     = "aws-managed-rules"
    priority = 4
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRules"
      sampled_requests_enabled   = true
    }
  }
  
  # Geo-blocking (optional)
  rule {
    name     = "geo-blocking"
    priority = 5
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = ["CN", "RU"]  # Block traffic from specific countries
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockRule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "MainWAF"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

---

## Threat Detection

### AWS GuardDuty

Continuous threat detection service:

```hcl
resource "aws_guardduty_detector" "main" {
  enable = true
  
  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
  }
}

# Send findings to SNS for alerts
resource "aws_guardduty_publishing_destination" "main" {
  detector_id     = aws_guardduty_detector.main.id
  destination_arn = aws_sns_topic.security_alerts.arn
  destination_type = "SNS"
}

resource "aws_sns_topic" "security_alerts" {
  name = "security-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = "security-team@example.com"
}
```

**GuardDuty Finding Types**:
- **Recon**: Reconnaissance activity (port scanning, unusual API calls)
- **InstanceCredentialExfiltration**: Credentials used from outside AWS
- **CryptoCurrency**: EC2 instance mining cryptocurrency
- **Backdoor**: Malware communication
- **Trojan**: Trojan activity detected
- **UnauthorizedAccess**: Unusual API activity, password brute force

**Automated Response to GuardDuty Findings**:

```python
# Lambda function triggered by GuardDuty via EventBridge
import boto3
import json

ec2 = boto3.client('ec2')
sns = boto3.client('sns')

def lambda_handler(event, context):
    finding = event['detail']
    finding_type = finding['type']
    severity = finding['severity']
    
    # High severity findings require immediate action
    if severity >= 7:
        if 'UnauthorizedAccess:EC2/MaliciousIPCaller' in finding_type:
            # Isolate compromised instance
            instance_id = finding['resource']['instanceDetails']['instanceId']
            
            # Create forensic security group (deny all)
            forensic_sg = ec2.create_security_group(
                GroupName=f'forensic-{instance_id}',
                Description='Quarantine security group',
                VpcId=finding['resource']['instanceDetails']['networkInterfaces'][0]['vpcId']
            )
            
            # Remove all rules (default deny)
            sg_id = forensic_sg['GroupId']
            
            # Apply to instance
            ec2.modify_instance_attribute(
                InstanceId=instance_id,
                Groups=[sg_id]
            )
            
            # Snapshot volume for forensics
            volumes = ec2.describe_volumes(
                Filters=[{'Name': 'attachment.instance-id', 'Values': [instance_id]}]
            )
            for volume in volumes['Volumes']:
                ec2.create_snapshot(
                    VolumeId=volume['VolumeId'],
                    Description=f'Forensic snapshot - GuardDuty finding {finding["id"]}'
                )
            
            # Alert security team
            sns.publish(
                TopicArn='arn:aws:sns:us-east-1:123456789012:security-alerts',
                Subject=f'CRITICAL: Instance {instance_id} quarantined',
                Message=json.dumps(finding, indent=2)
            )
    
    return {'statusCode': 200}
```

Deploy automated response:
```hcl
resource "aws_lambda_function" "guardduty_response" {
  filename      = "guardduty_response.zip"
  function_name = "guardduty-automated-response"
  role          = aws_iam_role.guardduty_response.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60
}

resource "aws_cloudwatch_event_rule" "guardduty" {
  name        = "guardduty-findings"
  description = "Capture GuardDuty findings"
  
  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
  })
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.guardduty.name
  target_id = "GuardDutyResponse"
  arn       = aws_lambda_function.guardduty_response.arn
}
```

---

## Security Hub

Centralized security findings from multiple services:

```hcl
resource "aws_securityhub_account" "main" {}

# Enable standards
resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:us-east-1::standards/cis-aws-foundations-benchmark/v/1.4.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  standards_arn = "arn:aws:securityhub:us-east-1::standards/pci-dss/v/3.2.1"
  depends_on    = [aws_securityhub_account.main]
}

# Aggregate findings from GuardDuty, Inspector, Macie, etc.
# View in Console: Security Hub → Findings
```

**Security Hub Insights**:

Custom filters for common security issues:

```bash
# CLI to create insight
aws securityhub create-insight \
  --filters file://filters.json \
  --group-by-attribute "ResourceType" \
  --name "Publicly Accessible Resources"

# filters.json
{
  "ResourceType": [{"Value": "AwsS3Bucket", "Comparison": "EQUALS"}],
  "ComplianceStatus": [{"Value": "FAILED", "Comparison": "EQUALS"}],
  "RecordState": [{"Value": "ACTIVE", "Comparison": "EQUALS"}]
}
```

---

## Secrets Management

### AWS Secrets Manager

```hcl
# Database credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "production/db/password"
  description             = "PostgreSQL database password"
  recovery_window_in_days = 30
  
  rotation_rules {
    automatically_after_days = 90
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db.result
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = "myapp"
  })
}

# Lambda rotation function
resource "aws_secretsmanager_secret_rotation" "db_password" {
  secret_id           = aws_secretsmanager_secret.db_password.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret.arn
  
  rotation_rules {
    automatically_after_days = 90
  }
}
```

**Application Retrieving Secret**:

```python
import boto3
import json

# Application code
secrets_client = boto3.client('secretsmanager')

def get_db_credentials():
    response = secrets_client.get_secret_value(SecretId='production/db/password')
    secret = json.loads(response['SecretString'])
    return secret

# Use credentials
creds = get_db_credentials()
conn = psycopg2.connect(
    host=creds['host'],
    port=creds['port'],
    dbname=creds['dbname'],
    user=creds['username'],
    password=creds['password']
)
```

**Never store secrets in**:
- ❌ Environment variables in Dockerfile
- ❌ Terraform state (use `sensitive = true`)
- ❌ Git repository
- ❌ Application code
- ❌ CloudFormation/Terraform outputs

✅ **Always store secrets in**:
- AWS Secrets Manager (automatic rotation)
- AWS Systems Manager Parameter Store (simple key-value)
- HashiCorp Vault (advanced use cases)
- Kubernetes Secrets (encrypted at rest with KMS)

---

## CloudTrail Logging

Log all API calls for audit and forensics:

```hcl
# Multi-region trail
resource "aws_cloudtrail" "organization" {
  name                          = "organization-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  is_organization_trail         = true
  enable_log_file_validation    = true
  
  # Encrypt logs
  kms_key_id = aws_kms_key.cloudtrail.arn
  
  # Log data events (S3, Lambda)
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/"]
    }
    
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:*:function/*"]
    }
  }
  
  # Send to CloudWatch Logs for real-time monitoring
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn
}

# S3 bucket for trail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "my-organization-cloudtrail"
  force_destroy = false
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  rule {
    id     = "archive-old-logs"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 2555  # 7 years for compliance
    }
  }
}

# CloudWatch Logs for real-time alerts
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/organization"
  retention_in_days = 90
}

# Alert on root account usage
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "RootAccountUsage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
  
  metric_transformation {
    name      = "RootAccountUsageCount"
    namespace = "CloudTrail"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "root-account-used"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsageCount"
  namespace           = "CloudTrail"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Root account was used"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
}

# Alert on IAM policy changes
resource "aws_cloudwatch_log_metric_filter" "iam_changes" {
  name           = "IAMPolicyChanges"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = '{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }'
  
  metric_transformation {
    name      = "IAMPolicyChangesCount"
    namespace = "CloudTrail"
    value     = "1"
  }
}
```

**Query CloudTrail with Athena**:

```sql
-- Create table for CloudTrail logs
CREATE EXTERNAL TABLE cloudtrail_logs (
  eventversion STRING,
  useridentity STRUCT<
    type:STRING,
    principalid:STRING,
    arn:STRING,
    accountid:STRING,
    invokedby:STRING,
    accesskeyid:STRING,
    userName:STRING,
    sessioncontext:STRUCT<
      attributes:STRUCT<
        mfaauthenticated:STRING,
        creationdate:STRING
      >,
      sessionissuer:STRUCT<
        type:STRING,
        principalId:STRING,
        arn:STRING,
        accountId:STRING,
        userName:STRING
      >
    >
  >,
  eventtime STRING,
  eventsource STRING,
  eventname STRING,
  awsregion STRING,
  sourceipaddress STRING,
  useragent STRING,
  errorcode STRING,
  errormessage STRING,
  requestparameters STRING,
  responseelements STRING,
  additionaleventdata STRING,
  requestid STRING,
  eventid STRING,
  resources ARRAY<STRUCT<
    ARN:STRING,
    accountId:STRING,
    type:STRING
  >>,
  eventtype STRING,
  apiversion STRING,
  readonly STRING,
  recipientaccountid STRING,
  serviceeventdetails STRING,
  sharedeventid STRING,
  vpcendpointid STRING
)
ROW FORMAT SERDE 'com.amazon.emr.hive.serde.CloudTrailSerde'
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://my-organization-cloudtrail/AWSLogs/123456789012/CloudTrail/';

-- Find all actions by specific user
SELECT eventtime, eventsource, eventname, sourceipaddress
FROM cloudtrail_logs
WHERE useridentity.username = 'john.doe'
  AND eventtime >= '2026-01-01'
ORDER BY eventtime DESC
LIMIT 100;

-- Find failed authentication attempts
SELECT eventtime, sourceipaddress, errorcode, errormessage, COUNT(*) as attempts
FROM cloudtrail_logs
WHERE errorcode IN ('UnauthorizedOperation', 'AccessDenied')
  AND eventtime >= '2026-01-30'
GROUP BY eventtime, sourceipaddress, errorcode, errormessage
HAVING attempts > 10
ORDER BY attempts DESC;

-- Track S3 bucket public access changes
SELECT eventtime, useridentity.username, requestparameters
FROM cloudtrail_logs
WHERE eventsource = 's3.amazonaws.com'
  AND eventname IN ('PutBucketAcl', 'PutBucketPolicy')
  AND eventtime >= '2026-01-01'
ORDER BY eventtime DESC;
```

---

## Compliance as Code

### OPA Policy Enforcement

Prevent non-compliant infrastructure before deployment:

**Terraform Policy** (deny public S3 buckets):

```rego
# policy/s3_public.rego
package terraform

import input as tfplan

deny[msg] {
  resource := tfplan.resource_changes[_]
  resource.type == "aws_s3_bucket_acl"
  resource.change.after.acl == "public-read"
  
  msg := sprintf("S3 bucket %s has public ACL - denied by security policy", [resource.address])
}

deny[msg] {
  resource := tfplan.resource_changes[_]
  resource.type == "aws_s3_bucket_public_access_block"
  resource.change.after.block_public_acls == false
  
  msg := sprintf("S3 bucket %s allows public ACLs - denied by security policy", [resource.address])
}
```

**Terraform Policy** (require encryption):

```rego
# policy/encryption.rego
package terraform

deny[msg] {
  resource := tfplan.resource_changes[_]
  resource.type == "aws_db_instance"
  resource.change.after.storage_encrypted != true
  
  msg := sprintf("RDS instance %s not encrypted - security policy requires encryption", [resource.address])
}

deny[msg] {
  resource := tfplan.resource_changes[_]
  resource.type == "aws_ebs_volume"
  resource.change.after.encrypted != true
  
  msg := sprintf("EBS volume %s not encrypted - security policy requires encryption", [resource.address])
}

deny[msg] {
  resource := tfplan.resource_changes[_]
  resource.type == "aws_instance"
  resource.change.after.root_block_device[_].encrypted != true
  
  msg := sprintf("EC2 instance %s root volume not encrypted", [resource.address])
}
```

**CI/CD Integration**:

```yaml
# GitHub Actions workflow
name: Security Policy Check
on: [pull_request]

jobs:
  policy-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Init
        run: terraform init
      
      - name: Terraform Plan
        run: terraform plan -out=tfplan.binary
      
      - name: Convert plan to JSON
        run: terraform show -json tfplan.binary > tfplan.json
      
      - name: Setup OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
          chmod +x opa
      
      - name: Run Policy Check
        run: |
          ./opa eval -i tfplan.json -d policy/ "data.terraform.deny" --format pretty
          VIOLATIONS=$(./opa eval -i tfplan.json -d policy/ "data.terraform.deny" --format raw)
          if [ "$VIOLATIONS" != "[]" ]; then
            echo "Policy violations detected:"
            echo "$VIOLATIONS"
            exit 1
          fi
```

**Kubernetes Admission Controller** (Gatekeeper):

```yaml
# Require resource limits
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequireresourcelimits
spec:
  crd:
    spec:
      names:
        kind: K8sRequireResourceLimits
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequireresourcelimits
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("Container %s missing memory limit", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container %s missing CPU limit", [container.name])
        }
---
# Apply constraint
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequireResourceLimits
metadata:
  name: require-resource-limits
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["production"]
```

---

## Best Practices Summary

### Security Checklist

**Identity and Access**:
- [ ] MFA enabled for all users (especially root)
- [ ] Root account access keys deleted
- [ ] IAM users follow least privilege
- [ ] Service Control Policies (SCPs) implemented
- [ ] Access keys rotated every 90 days
- [ ] Password policy enforces strong passwords
- [ ] IAM roles used instead of long-term credentials
- [ ] Permission boundaries limit maximum permissions

**Encryption**:
- [ ] S3 buckets encrypted at rest (KMS)
- [ ] EBS volumes encrypted by default
- [ ] RDS databases encrypted
- [ ] Secrets Manager for all credentials
- [ ] TLS 1.2+ enforced for all services
- [ ] Certificate management automated (ACM)

**Network Security**:
- [ ] Security groups default deny
- [ ] No SSH/RDP open to 0.0.0.0/0
- [ ] NACLs configured for subnet protection
- [ ] VPC Flow Logs enabled
- [ ] AWS WAF protecting public endpoints
- [ ] Private subnets for databases

**Monitoring and Detection**:
- [ ] GuardDuty enabled
- [ ] Security Hub aggregating findings
- [ ] CloudTrail logging all API calls
- [ ] CloudWatch alarms for suspicious activity
- [ ] Log aggregation (CloudWatch/S3)
- [ ] Automated incident response

**Compliance**:
- [ ] CIS Benchmark compliance checked (Prowler/Security Hub)
- [ ] Compliance as code with OPA
- [ ] Regular vulnerability scanning
- [ ] Penetration testing scheduled
- [ ] Audit logs retained per policy (7 years typical)

**Data Protection**:
- [ ] Backups encrypted
- [ ] S3 versioning enabled for critical data
- [ ] S3 Object Lock for immutable backups
- [ ] MFA Delete on sensitive buckets
- [ ] Data classification tags

---

## Troubleshooting

### Issue: Security Group Rule Not Working

**Diagnosis**:
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-abc123

# Check if instance actually has security group
aws ec2 describe-instances --instance-ids i-abc123 \
  --query 'Reservations[].Instances[].SecurityGroups'

# Check NACLs (might be blocking)
aws ec2 describe-network-acls \
  --filters Name=association.subnet-id,Values=subnet-xyz789
```

**Common Issues**:
- Security group allows traffic but NACL denies
- Forgot to allow ephemeral ports (1024-65535) for responses
- Application not listening on expected port
- Instance doesn't have public IP/ENI for internet access

### Issue: Cannot Access Secrets Manager Secret

**Error**: `AccessDeniedException: User is not authorized`

**Fix**: Add IAM policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ],
    "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:production/db/password-AbCdEf"
  }]
}
```

### Issue: GuardDuty False Positives

Whitelist known good IPs:

```hcl
resource "aws_guardduty_ipset" "trusted" {
  name        = "trusted-ips"
  detector_id = aws_guardduty_detector.main.id
  format      = "TXT"
  location    = "s3://${aws_s3_bucket.guardduty.bucket}/trusted-ips.txt"
  activate    = true
}

# trusted-ips.txt content:
# 203.0.113.0/24
# 198.51.100.0/24
```

---

## What's Next?

After hardening infrastructure security:

1. **[CI/CD Pipeline Security](../cicd/secure-pipelines)** - Secure software delivery pipeline
2. **[Container Security](../containers/container-best-practices)** - Docker and Kubernetes hardening
3. **[Zero Trust Architecture](../security/zero-trust)** - Implement zero trust networking
4. **[Incident Response](../security/incident-response)** - Build incident response playbooks

---

## Additional Resources

**AWS Documentation**:
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)

**Tools**:
- [Prowler](https://github.com/prowler-cloud/prowler) - CIS compliance scanning
- [ScoutSuite](https://github.com/nccgroup/ScoutSuite) - Multi-cloud security auditing
- [Cloudsploit](https://github.com/aquasecurity/cloudsploit) - Cloud security scanning
- [OPA](https://www.openpolicyagent.org/) - Policy as code

**Standards**:
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html)
- [PCI DSS](https://www.pcisecuritystandards.org/)
- [SOC 2](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html)

---

## Change Log

- **2026-01-30**: Initial version covering CIS benchmarks, IAM least privilege, MFA enforcement, encryption at rest/transit, network security (security groups/NACLs/VPC Flow Logs/WAF), threat detection (GuardDuty), Security Hub centralization, Secrets Manager, CloudTrail logging, and compliance as code with OPA
