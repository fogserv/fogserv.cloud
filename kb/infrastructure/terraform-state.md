# Terraform State Management

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Infrastructure as Code  
**Prerequisites**: [terraform-basics](terraform-basics)  
**Time**: 2-3 hours  
**Tags**: terraform, state, backend, locking, collaboration

## Summary

Master Terraform state management for team collaboration and production deployments. Learn state backends, locking mechanisms, state manipulation, and best practices for managing infrastructure state safely across teams.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Terraform state structure
- ✅ Configure remote backends
- ✅ Implement state locking
- ✅ Manage state safely
- ✅ Handle state disasters
- ✅ Collaborate with teams on state

## 🤔 What is State?

### The State Problem

**Terraform needs to know**:
- What resources exist?
- What are their current attributes?
- How do they map to your configuration?

**terraform.tfstate** answers these questions.

---

### State File Example

**terraform.tfstate**:
```json
{
  "version": 4,
  "terraform_version": "1.7.0",
  "serial": 3,
  "lineage": "abc123...",
  "outputs": {
    "instance_id": {
      "value": "i-0123456789abcdef",
      "type": "string"
    }
  },
  "resources": [
    {
      "mode": "managed",
      "type": "aws_instance",
      "name": "web",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [
        {
          "schema_version": 1,
          "attributes": {
            "id": "i-0123456789abcdef",
            "ami": "ami-0c55b159cbfafe1f0",
            "instance_type": "t3.micro",
            "public_ip": "54.123.45.67"
          }
        }
      ]
    }
  ]
}
```

---

### Why State Matters

**State enables**:
- 🗺️ Mapping: Config → Real resources
- 📊 Planning: What will change?
- ⚡ Performance: Cache resource attributes
- 🤝 Collaboration: Share infrastructure state

---

## 🏠 Local State (Default)

### How Local State Works

```
terraform-project/
├── main.tf
├── terraform.tfstate        # Current state
└── terraform.tfstate.backup # Previous state
```

**Commands**:
```bash
# Apply creates/updates state
terraform apply

# State stored locally
cat terraform.tfstate

# Backup created automatically
cat terraform.tfstate.backup
```

---

### Local State Problems

❌ **Single point of failure**:
```bash
# Laptop dies = state lost!
rm terraform.tfstate
# Now Terraform has no idea what exists
```

❌ **No team collaboration**:
```bash
# Developer A applies
terraform apply

# Developer B doesn't see changes
terraform apply  # Conflicts!
```

❌ **No locking**:
```bash
# Two people run apply simultaneously
# Race conditions, corrupted state!
```

❌ **Secrets in plaintext**:
```json
{
  "resources": [{
    "attributes": {
      "password": "super_secret_password"  // Visible!
    }
  }]
}
```

---

## ☁️ Remote State Backends

### Why Remote State?

✅ **Shared state**: Team collaboration  
✅ **Locking**: Prevent conflicts  
✅ **Backup**: Cloud storage durability  
✅ **Encryption**: Secrets protected  
✅ **Version history**: State snapshots  

---

### S3 Backend (AWS)

**backend.tf**:
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

**Setup S3 bucket**:
```hcl
# setup/main.tf (run once)
provider "aws" {
  region = "us-east-1"
}

# S3 bucket for state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "my-terraform-state"
  
  lifecycle {
    prevent_destroy = true
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "terraform-state-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

**Apply setup**:
```bash
cd setup
terraform init
terraform apply

# Now configure backend in main project
cd ../main-project
# Add backend.tf (shown above)
terraform init  # Migrate to S3
```

---

### Azure Blob Storage Backend

**backend.tf**:
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstateaccount"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}
```

**Setup Azure storage**:
```bash
# Create resource group
az group create --name terraform-state-rg --location eastus

# Create storage account
az storage account create \
  --name tfstateaccount \
  --resource-group terraform-state-rg \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name tfstate \
  --account-name tfstateaccount
```

---

### Terraform Cloud Backend

**backend.tf**:
```hcl
terraform {
  cloud {
    organization = "my-company"
    
    workspaces {
      name = "production"
    }
  }
}
```

**Benefits**:
- Free for small teams
- Built-in locking
- State versioning
- Policy as code
- Cost estimation
- Private registry

**Setup**:
```bash
# Login
terraform login

# Initialize
terraform init
```

---

### HTTP Backend (Generic)

**backend.tf**:
```hcl
terraform {
  backend "http" {
    address        = "https://terraform.example.com/state/prod"
    lock_address   = "https://terraform.example.com/state/prod/lock"
    unlock_address = "https://terraform.example.com/state/prod/lock"
    username       = "terraform"
    password       = "secret"  # Use env var!
  }
}
```

---

### PostgreSQL Backend

**backend.tf**:
```hcl
terraform {
  backend "pg" {
    conn_str = "postgres://user:pass@db.example.com/terraform_backend"
    schema_name = "terraform_remote_state"
  }
}
```

---

## 🔒 State Locking

### Why Locking?

**Without locking**:
```
Developer A:                Developer B:
terraform apply            terraform apply
  ↓                          ↓
Reading state...           Reading state...
  ↓                          ↓
Planning changes...        Planning changes...
  ↓                          ↓
Applying...                Applying...
  ↓                          ↓
Writing state...           Writing state... (CORRUPTED!)
```

**With locking**:
```
Developer A:                Developer B:
terraform apply            terraform apply
  ↓                          ↓
Acquiring lock... ✅        Acquiring lock... ❌
  ↓                          ↓
Reading state...           "State locked by Developer A"
  ↓                          (waits...)
Applying...
  ↓
Releasing lock... ✅
                             ↓
                           Acquiring lock... ✅
                             ↓
                           Reading state...
```

---

### Lock Providers

| Backend | Lock Support | Lock Method |
|---------|--------------|-------------|
| S3 | ✅ | DynamoDB |
| Azure | ✅ | Blob lease |
| Terraform Cloud | ✅ | Built-in |
| PostgreSQL | ✅ | pg_advisory_lock |
| Consul | ✅ | KV store |
| etcd | ✅ | Distributed lock |
| Local | ❌ | None |

---

### Manual Lock Management

```bash
# Force unlock (DANGEROUS!)
terraform force-unlock LOCK_ID

# Example: Unlock if teammate's laptop died
terraform force-unlock abc123-def456-789012
```

**⚠️ Only use if you're SURE no one else is applying!**

---

## 🛠️ State Commands

### List Resources

```bash
# List all resources in state
terraform state list

# Output:
# aws_vpc.main
# aws_subnet.public
# aws_instance.web
```

---

### Show Resource

```bash
# Show resource details
terraform state show aws_instance.web

# Output:
# resource "aws_instance" "web" {
#     id            = "i-0123456789abcdef"
#     ami           = "ami-0c55b159cbfafe1f0"
#     instance_type = "t3.micro"
#     public_ip     = "54.123.45.67"
# }
```

---

### Move Resource

```bash
# Rename resource in state
terraform state mv aws_instance.old aws_instance.new

# Move to module
terraform state mv aws_instance.web module.webserver.aws_instance.web

# Move from module
terraform state mv module.old.aws_instance.web aws_instance.web
```

---

### Remove Resource

```bash
# Remove from state (doesn't destroy resource!)
terraform state rm aws_instance.web

# Resource still exists in AWS!
# Terraform just forgets about it

# Useful for:
# - Moving resource to different state file
# - Importing into another Terraform project
# - Manually managing resource
```

---

### Import Resource

```bash
# Import existing AWS instance
terraform import aws_instance.web i-0123456789abcdef

# Import with module
terraform import module.webserver.aws_instance.web i-0123456789abcdef

# Terraform adds to state, but doesn't have config yet!
# You still need to write matching configuration
```

---

### Pull/Push State

```bash
# Download current state
terraform state pull > terraform.tfstate.backup

# Upload state (DANGEROUS!)
terraform state push terraform.tfstate.backup
```

---

## 🔄 Migrating State

### Local to Remote

**Step 1: Configure backend**:
```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}
```

**Step 2: Initialize**:
```bash
terraform init

# Prompt:
# Do you want to copy existing state to the new backend?
# yes

# State migrated! ✅
```

**Step 3: Verify**:
```bash
# Check S3
aws s3 ls s3://my-terraform-state/prod/

# Local state is now backup
ls terraform.tfstate*
```

---

### Remote to Remote

**Change backend**:
```hcl
# OLD backend
terraform {
  backend "s3" {
    bucket = "old-state-bucket"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

# NEW backend
terraform {
  backend "s3" {
    bucket = "new-state-bucket"
    key    = "terraform.tfstate"
    region = "us-west-2"
  }
}
```

**Migrate**:
```bash
terraform init -migrate-state
```

---

## 🚨 State Disasters

### Disaster 1: State Lost

**Symptoms**:
```bash
terraform apply
# Error: state file not found
```

**Recovery options**:

**Option A: Restore from backup**
```bash
# S3 versioning enabled?
aws s3api list-object-versions --bucket my-terraform-state --prefix terraform.tfstate

# Restore previous version
aws s3api get-object --bucket my-terraform-state --key terraform.tfstate --version-id VERSION_ID terraform.tfstate
```

**Option B: Rebuild state**
```bash
# Import every resource (tedious!)
terraform import aws_instance.web i-0123456789abcdef
terraform import aws_vpc.main vpc-abc123
# ... repeat for all resources
```

**Option C: Nuclear option**
```bash
# Destroy all resources manually
# Delete state
# Start fresh
terraform apply
```

---

### Disaster 2: State Corrupted

**Symptoms**:
```bash
terraform plan
# Error: state data is corrupted
```

**Recovery**:
```bash
# Restore from backup
mv terraform.tfstate terraform.tfstate.broken
cp terraform.tfstate.backup terraform.tfstate

# Or from S3 versioning
aws s3api list-object-versions --bucket my-terraform-state
aws s3api get-object --bucket my-terraform-state --key terraform.tfstate --version-id GOOD_VERSION terraform.tfstate
```

---

### Disaster 3: Drift Detected

**Symptoms**:
```bash
terraform plan
# ~ aws_instance.web will be updated in-place
#   ~ instance_type: "t3.small" -> "t3.micro"
# 
# Someone changed the instance outside Terraform!
```

**Solutions**:

**Option A: Accept changes**
```bash
# Refresh state to match reality
terraform apply -refresh-only
```

**Option B: Revert changes**
```bash
# Apply to force back to config
terraform apply
```

**Option C: Update config**
```hcl
# Update config to match reality
resource "aws_instance" "web" {
  instance_type = "t3.small"  # Match what exists
}
```

---

## 🔐 State Security

### Encrypt State

**S3 with encryption**:
```hcl
terraform {
  backend "s3" {
    bucket  = "my-state"
    key     = "terraform.tfstate"
    encrypt = true  # Server-side encryption
    
    # Or use KMS
    kms_key_id = "arn:aws:kms:us-east-1:123456789012:key/abc123"
  }
}
```

---

### Sensitive Data in State

**Problem**: Passwords stored in plaintext!

```json
{
  "resources": [{
    "attributes": {
      "password": "super_secret"  // Anyone with state access sees this!
    }
  }]
}
```

**Solutions**:

**1. Mark as sensitive** (hides in plan/apply output):
```hcl
variable "db_password" {
  sensitive = true
}

output "db_password" {
  value     = var.db_password
  sensitive = true
}
```

**2. Use secret manager**:
```hcl
# Don't store in Terraform at all
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "production/db/password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db.secret_string
}
```

**3. Restrict state access**:
```bash
# S3 bucket policy
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::123456789012:user/terraform"},
    "Action": "s3:*",
    "Resource": "arn:aws:s3:::my-state/*"
  }]
}
```

---

## 💡 Best Practices

### 1. Never Edit State Manually

```bash
# DON'T
vim terraform.tfstate  # ❌

# DO
terraform state mv ...  # ✅
terraform state rm ...  # ✅
```

---

### 2. Always Use Remote State

```hcl
# Development
terraform {
  backend "s3" {
    bucket = "dev-terraform-state"
    key    = "terraform.tfstate"
  }
}

# Production
terraform {
  backend "s3" {
    bucket = "prod-terraform-state"
    key    = "terraform.tfstate"
  }
}
```

---

### 3. Enable State Locking

```hcl
# S3 + DynamoDB for locking
terraform {
  backend "s3" {
    bucket         = "my-state"
    key            = "terraform.tfstate"
    dynamodb_table = "terraform-locks"  # Required for locking!
  }
}
```

---

### 4. Use State Versioning

```hcl
# S3 versioning enabled
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.terraform_state.id
  
  versioning_configuration {
    status = "Enabled"
  }
}
```

---

### 5. Separate State Per Environment

```
s3://terraform-state/
├── dev/terraform.tfstate
├── staging/terraform.tfstate
└── production/terraform.tfstate
```

---

### 6. Never Commit State to Git

**.gitignore**:
```
# Local state
*.tfstate
*.tfstate.*

# Backup files
*.backup

# Terraform directory
.terraform/
.terraform.lock.hcl
```

---

## 🔗 What's Next?

**Providers**:
- **[terraform-providers](terraform-providers)** - AWS, Azure, Proxmox

**Modules**:
- **[terraform-modules](terraform-modules)** - Reusable infrastructure

**Workspaces**:
- **[terraform-workspaces](terraform-workspaces)** - Multi-environment

---

## 📚 Resources

**Official Docs**:
- [State Management](https://www.terraform.io/docs/language/state/index.html)
- [Backends](https://www.terraform.io/docs/language/settings/backends/index.html)
- [State Commands](https://www.terraform.io/docs/cli/commands/state/index.html)

**Backend Types**:
- [S3 Backend](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [Azure Backend](https://www.terraform.io/docs/language/settings/backends/azurerm.html)
- [Terraform Cloud](https://www.terraform.io/docs/cloud/index.html)

---

## 📝 Change Log

### 2026-01-30
- Created state management guide
- Explained state structure and purpose
- Covered local vs remote state
- Demonstrated backend configuration
- Explained state locking
- Provided state manipulation commands
- Covered state migration
- Included disaster recovery
- Added security best practices

---

**Next Article**: [terraform-providers](terraform-providers) - Multi-cloud infrastructure!

