# Terraform Workspaces - Multi-Environment Management

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Infrastructure as Code  
**Prerequisites**: [terraform-basics](terraform-basics), [terraform-modules](terraform-modules)  
**Time**: 2-3 hours  
**Tags**: terraform, workspaces, environments, multi-tenancy

## Summary

Manage multiple environments (dev, staging, production) with Terraform workspaces. Learn workspace commands, variable strategies, state isolation, and when to use workspaces versus separate state files for safe multi-environment deployments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand workspace concepts
- ✅ Create and switch workspaces
- ✅ Use workspace-specific variables
- ✅ Manage state per environment
- ✅ Choose workspace strategy
- ✅ Implement safe deployments
- ✅ Handle workspace limitations

## 🏢 What are Workspaces?

### Workspace Concept

**Workspaces** allow multiple **state files** from the same configuration.

**Use case**: Same infrastructure, different environments:
- 💻 Development
- 🧪 Staging
- 🚀 Production

**One codebase** → **Multiple states**

---

### How Workspaces Work

```
terraform/
├── main.tf           # Same config
├── variables.tf
└── terraform.tfstate.d/
    ├── dev/
    │   └── terraform.tfstate
    ├── staging/
    │   └── terraform.tfstate
    └── production/
        └── terraform.tfstate
```

---

### Default Workspace

**Always exists**: `default`

```bash
# Check current workspace
terraform workspace show
# Output: default
```

---

## 🚀 Workspace Commands

### List Workspaces

```bash
terraform workspace list

# Output:
# * default
#   dev
#   staging
#   production
```

`*` indicates current workspace.

---

### Create Workspace

```bash
# Create and switch to dev
terraform workspace new dev

# Create staging
terraform workspace new staging

# Create production
terraform workspace new production
```

---

### Switch Workspace

```bash
# Switch to staging
terraform workspace select staging

# Verify
terraform workspace show
# Output: staging
```

---

### Delete Workspace

```bash
# Switch away first
terraform workspace select default

# Delete
terraform workspace delete dev

# Cannot delete current workspace
terraform workspace delete staging
# Error: can't delete current workspace
```

---

## 🔧 Using Workspaces

### Basic Example

**main.tf**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC with workspace name
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  
  tags = {
    Name        = "${terraform.workspace}-vpc"
    Environment = terraform.workspace
  }
}

# EC2 instance
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
  
  tags = {
    Name        = "${terraform.workspace}-web"
    Environment = terraform.workspace
  }
}
```

**variables.tf**:
```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type = string
}
```

**terraform.tfvars**:
```hcl
ami_id        = "ami-0c55b159cbfafe1f0"
instance_type = "t3.micro"
```

**Deploy to different environments**:
```bash
# Development
terraform workspace new dev
terraform plan
terraform apply

# Staging
terraform workspace new staging
terraform plan
terraform apply

# Production
terraform workspace new production
terraform plan
terraform apply
```

**Result**:
- `dev-vpc`, `dev-web`
- `staging-vpc`, `staging-web`
- `production-vpc`, `production-web`

---

### Workspace-Specific Variables

**Use `terraform.workspace` variable**:
```hcl
locals {
  # Different sizes per environment
  instance_type = {
    dev        = "t3.micro"
    staging    = "t3.small"
    production = "t3.large"
  }
  
  # Different counts
  instance_count = {
    dev        = 1
    staging    = 2
    production = 5
  }
  
  # Different CIDR blocks
  vpc_cidr = {
    dev        = "10.0.0.0/16"
    staging    = "10.1.0.0/16"
    production = "10.2.0.0/16"
  }
}

resource "aws_instance" "web" {
  count = local.instance_count[terraform.workspace]
  
  ami           = var.ami_id
  instance_type = local.instance_type[terraform.workspace]
  
  tags = {
    Name        = "${terraform.workspace}-web-${count.index + 1}"
    Environment = terraform.workspace
  }
}

resource "aws_vpc" "main" {
  cidr_block = local.vpc_cidr[terraform.workspace]
  
  tags = {
    Name        = "${terraform.workspace}-vpc"
    Environment = terraform.workspace
  }
}
```

---

### Conditional Resources

**Enable features per environment**:
```hcl
# Monitoring only in staging/production
resource "aws_cloudwatch_dashboard" "main" {
  count = terraform.workspace != "dev" ? 1 : 0
  
  dashboard_name = "${terraform.workspace}-dashboard"
  # ... config
}

# Backup only in production
resource "aws_backup_plan" "main" {
  count = terraform.workspace == "production" ? 1 : 0
  
  name = "${terraform.workspace}-backup"
  # ... config
}

# Auto-scaling only in production
resource "aws_autoscaling_group" "web" {
  count = terraform.workspace == "production" ? 1 : 0
  
  name             = "${terraform.workspace}-asg"
  min_size         = 3
  max_size         = 10
  desired_capacity = 5
  # ... config
}
```

---

## 📁 Workspace Variable Files

### Per-Workspace tfvars

**Structure**:
```
terraform/
├── main.tf
├── variables.tf
├── terraform.tfvars       # Shared defaults
├── dev.tfvars             # Dev overrides
├── staging.tfvars         # Staging overrides
└── production.tfvars      # Production overrides
```

**terraform.tfvars** (shared):
```hcl
aws_region = "us-east-1"
ami_id     = "ami-0c55b159cbfafe1f0"
```

**dev.tfvars**:
```hcl
instance_type  = "t3.micro"
instance_count = 1
enable_backup  = false
```

**staging.tfvars**:
```hcl
instance_type  = "t3.small"
instance_count = 2
enable_backup  = true
```

**production.tfvars**:
```hcl
instance_type  = "t3.large"
instance_count = 5
enable_backup  = true
```

**Usage**:
```bash
# Dev
terraform workspace select dev
terraform apply -var-file="dev.tfvars"

# Staging
terraform workspace select staging
terraform apply -var-file="staging.tfvars"

# Production
terraform workspace select production
terraform apply -var-file="production.tfvars"
```

---

## 🔒 Remote Backend with Workspaces

### S3 Backend

**backend.tf**:
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

**State organization**:
```
S3 Bucket: my-terraform-state
└── infrastructure/
    └── env:/
        ├── default/
        │   └── terraform.tfstate
        ├── dev/
        │   └── terraform.tfstate
        ├── staging/
        │   └── terraform.tfstate
        └── production/
            └── terraform.tfstate
```

**Keys automatically scoped** by workspace!

---

### Terraform Cloud

**backend.tf**:
```hcl
terraform {
  backend "remote" {
    organization = "myorg"
    
    workspaces {
      prefix = "infrastructure-"
    }
  }
}
```

**Creates workspaces**:
- `infrastructure-dev`
- `infrastructure-staging`
- `infrastructure-production`

---

## 🎯 Workspace Strategies

### Strategy 1: Single Config, Multiple Workspaces

**Good for**:
- ✅ Nearly identical environments
- ✅ Small differences (size, count)
- ✅ Quick prototyping

**Example**:
```
terraform/
├── main.tf
├── variables.tf
└── Workspaces: dev, staging, production
```

---

### Strategy 2: Separate Directories

**Good for**:
- ✅ Different architectures
- ✅ Production isolation
- ✅ Different teams

**Example**:
```
terraform/
├── dev/
│   ├── main.tf
│   ├── backend.tf
│   └── variables.tf
├── staging/
│   ├── main.tf
│   ├── backend.tf
│   └── variables.tf
└── production/
    ├── main.tf
    ├── backend.tf
    └── variables.tf
```

---

### Strategy 3: Hybrid (Modules + Workspaces)

**Good for**:
- ✅ Shared modules
- ✅ Environment-specific config
- ✅ Best of both worlds

**Example**:
```
terraform/
├── modules/
│   ├── networking/
│   ├── compute/
│   └── database/
└── environments/
    ├── dev/
    │   └── main.tf (uses modules)
    ├── staging/
    │   └── main.tf (uses modules)
    └── production/
        └── main.tf (uses modules)
```

**environments/production/main.tf**:
```hcl
module "networking" {
  source = "../../modules/networking"
  
  environment = "production"
  vpc_cidr    = "10.2.0.0/16"
}

module "compute" {
  source = "../../modules/compute"
  
  environment    = "production"
  instance_type  = "t3.large"
  instance_count = 5
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.subnet_ids
}

module "database" {
  source = "../../modules/database"
  
  environment    = "production"
  instance_class = "db.t3.large"
  multi_az       = true
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.database_subnet_ids
}
```

---

## ⚠️ Workspace Limitations

### 1. Easy to Make Mistakes

```bash
# Accidentally in wrong workspace
terraform workspace show
# Output: production

# Meant to test in dev!
terraform destroy
# ❌ DESTROYED PRODUCTION!
```

**Solution**: Always verify workspace first.

---

### 2. No Workspace Switching in apply

```bash
# This does NOT work
terraform apply -workspace=staging

# Must switch first
terraform workspace select staging
terraform apply
```

---

### 3. All Environments in Same Account

**Workspaces don't change provider credentials**.

**Problem**:
```hcl
provider "aws" {
  region = "us-east-1"
  # Same account for all workspaces!
}
```

**Solution for separate accounts**:
```hcl
# Use separate directories with different provider configs
# environments/production/provider.tf
provider "aws" {
  region  = "us-east-1"
  profile = "production-account"
}

# environments/dev/provider.tf
provider "aws" {
  region  = "us-east-1"
  profile = "dev-account"
}
```

---

### 4. Module Path Issues

**Problem**:
```hcl
# Doesn't work with workspaces
module "webserver" {
  source = "./modules/${terraform.workspace}/webserver"
}
```

**Solution**: Use variables instead.

---

## 🛡️ Safe Deployment Practices

### 1. Verify Workspace First

```bash
# Script wrapper
#!/bin/bash
WORKSPACE=$(terraform workspace show)

echo "Current workspace: $WORKSPACE"
read -p "Continue with $WORKSPACE? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 1
fi

terraform apply
```

---

### 2. Production Approval

```bash
# Require explicit approval for production
#!/bin/bash
WORKSPACE=$(terraform workspace show)

if [ "$WORKSPACE" == "production" ]; then
  read -p "⚠️  PRODUCTION deployment. Type 'DEPLOY PRODUCTION' to confirm: " confirm
  
  if [ "$confirm" != "DEPLOY PRODUCTION" ]; then
    echo "Aborted"
    exit 1
  fi
fi

terraform apply
```

---

### 3. Prevent Accidental Deletion

**Lifecycle rules**:
```hcl
resource "aws_instance" "web" {
  # ... config
  
  lifecycle {
    prevent_destroy = terraform.workspace == "production" ? true : false
  }
}

resource "aws_db_instance" "main" {
  # ... config
  
  # Always protect database
  lifecycle {
    prevent_destroy = true
  }
}
```

---

### 4. Separate State Files for Production

**Best practice**: Don't use workspaces for production.

**Separate production**:
```
terraform/
├── development/
│   ├── main.tf
│   └── Workspaces: dev, test, qa
└── production/
    ├── main.tf
    └── backend.tf (different S3 bucket)
```

---

## 📊 Workspace Information

### Current Workspace

```hcl
# In resources
resource "aws_instance" "web" {
  tags = {
    Workspace = terraform.workspace
  }
}

# In outputs
output "workspace" {
  value = terraform.workspace
}

# In locals
locals {
  is_production = terraform.workspace == "production"
}
```

---

### Workspace Count

**Can't get list programmatically**, but can check current:

```hcl
locals {
  environments = ["dev", "staging", "production"]
  
  # Validate workspace
  valid_workspace = contains(local.environments, terraform.workspace)
}

# Fail if invalid workspace
resource "null_resource" "validate_workspace" {
  count = local.valid_workspace ? 0 : 1
  
  provisioner "local-exec" {
    command = "echo 'Invalid workspace: ${terraform.workspace}' && exit 1"
  }
}
```

---

## 💡 Best Practices

### 1. Use Workspaces for Similar Environments

```bash
# Good: Dev/test/staging (same account, similar size)
terraform workspace new dev
terraform workspace new test
terraform workspace new staging

# Bad: Production (use separate directory)
# terraform workspace new production  ❌
```

---

### 2. Always Tag with Workspace

```hcl
# In provider defaults
provider "aws" {
  default_tags {
    tags = {
      Workspace   = terraform.workspace
      Environment = terraform.workspace
      ManagedBy   = "Terraform"
    }
  }
}
```

---

### 3. Validate Workspace

```hcl
variable "expected_workspace" {
  description = "Expected workspace name"
  type        = string
  default     = ""
}

locals {
  workspace_match = var.expected_workspace == "" || var.expected_workspace == terraform.workspace
}

# Fail if mismatch
resource "null_resource" "validate" {
  count = local.workspace_match ? 0 : 1
  
  provisioner "local-exec" {
    command = "echo 'Workspace mismatch!' && exit 1"
  }
}
```

**Usage**:
```bash
terraform apply -var="expected_workspace=staging"
```

---

### 4. Document Workspaces

**README.md**:
```markdown
# Workspaces

## Available Workspaces

- `dev`: Development environment (1 t3.micro)
- `staging`: Staging environment (2 t3.small)

## Usage

```bash
# Switch to dev
terraform workspace select dev
terraform apply -var-file="dev.tfvars"

# Switch to staging
terraform workspace select staging
terraform apply -var-file="staging.tfvars"
```

## Production

Production uses separate directory: `../production/`
```

---

## 🔗 What's Next?

**Proxmox**:
- **[terraform-proxmox](terraform-proxmox)** - Self-hosted infrastructure

**Testing**:
- **[infrastructure-testing](infrastructure-testing)** - Testing strategies

**GitOps**:
- **[gitops-principles](gitops-principles)** - Git-driven deployments

---

## 📚 Resources

**Terraform Workspaces**:
- [Workspace Documentation](https://developer.hashicorp.com/terraform/language/state/workspaces)
- [When to Use Workspaces](https://developer.hashicorp.com/terraform/cloud-docs/workspaces)

**Best Practices**:
- [Environment Strategy](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices/part1)

---

## 📝 Change Log

### 2026-01-30
- Created workspaces guide
- Explained workspace concepts
- Covered workspace commands
- Demonstrated variable strategies
- Showed remote backend integration
- Explained workspace strategies
- Covered limitations
- Added safety practices
- Included best practices

---

**Next Article**: [terraform-proxmox](terraform-proxmox) - Self-hosted VM provisioning!
