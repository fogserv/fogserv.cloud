# Immutable Infrastructure - Replace, Don't Modify

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Architecture Patterns  
**Prerequisites**: [packer-introduction](packer-introduction), [terraform-basics](terraform-basics)  
**Time**: 2-3 hours  
**Tags**: immutable-infrastructure, packer, terraform, automation, devops

## Summary

Build reliable infrastructure with immutable patterns. Learn the philosophy of replacing servers instead of modifying them, implement with Packer and Terraform, and understand the benefits for security, reliability, and operations.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand immutable infrastructure
- ✅ Compare mutable vs immutable patterns
- ✅ Build immutable images with Packer
- ✅ Deploy with Terraform
- ✅ Implement blue-green deployments
- ✅ Handle configuration changes
- ✅ Manage stateful services
- ✅ Adopt incrementally

## 🏗️ What is Immutable Infrastructure?

### Traditional (Mutable) Approach

**Server lifecycle**:
```bash
# Day 1: Provision server
terraform apply

# Day 30: Update packages
ssh server
sudo apt-get update && sudo apt-get upgrade

# Day 60: Install new software
ansible-playbook update.yml

# Day 90: Apply security patch
ssh server
sudo apt-get install package-with-fix

# Day 120: Configuration drift
# Different servers have different versions
# Manual changes not tracked
# "Works on my machine" syndrome
```

**Problems**:
- 🔄 **Configuration Drift**: Servers diverge over time
- 🐛 **Hard to Debug**: Each server is unique
- ❌ **Risky Updates**: In-place updates can fail
- 📝 **No Audit Trail**: Manual changes untracked
- 🔙 **Difficult Rollback**: Can't easily revert

---

### Immutable Approach

**Server lifecycle**:
```bash
# Day 1: Build image
packer build app-v1.0.0.pkr.hcl
# Creates: app-v1.0.0 image

# Deploy servers
terraform apply
# Deploys: 5 servers from app-v1.0.0

# Day 30: Update needed
# 1. Build new image
packer build app-v1.1.0.pkr.hcl

# 2. Deploy new servers
terraform apply
# Creates: 5 new servers from app-v1.1.0
# Destroys: 5 old servers from app-v1.0.0

# Never SSH in to modify!
```

**Benefits**:
- ✅ **Consistent**: All servers identical
- ✅ **Reliable**: Tested images
- ✅ **Traceable**: All changes in code
- ✅ **Easy Rollback**: Redeploy old image
- ✅ **Simple**: Replace, don't modify

---

### Core Principle

> **"Servers are cattle, not pets"**

**Pets** (mutable):
- 🐕 Named servers (web1, web2)
- 🏥 Nursed back to health
- 😢 Painful when lost

**Cattle** (immutable):
- 🐄 Numbered servers (web-001, web-002)
- 🔄 Replaced when sick
- ☑️ Expected to be replaced

---

## 🆚 Mutable vs Immutable

### Mutable Infrastructure

```bash
# Initial deployment
ansible-playbook deploy.yml

# Later update (modifies existing servers)
ansible-playbook update.yml

# Security patch (modifies existing servers)
ansible-playbook patch.yml

# Problem: Each server has different history
# Server 1: Deploy → Update1 → Patch1 → Update2
# Server 2: Deploy → Update1 → Patch2 → Update2
# Server 3: Deploy → Update1 → Update2 (missed patch!)
```

**Diagram**:
```
Time →
Server 1: [Deploy] → [Update] → [Patch] → [Update]
Server 2: [Deploy] → [Update] → [Patch] → [Update]
Server 3: [Deploy] → [Update] → ❌      → [Update]
                                  ^
                          Configuration Drift!
```

---

### Immutable Infrastructure

```bash
# Version 1.0.0
packer build app-v1.0.0.pkr.hcl
terraform apply  # Deploy v1.0.0

# Version 1.1.0 (new image)
packer build app-v1.1.0.pkr.hcl
terraform apply  # Replace all with v1.1.0

# Version 1.2.0 (new image)
packer build app-v1.2.0.pkr.hcl
terraform apply  # Replace all with v1.2.0

# All servers always identical!
```

**Diagram**:
```
Time →
Version 1.0.0: [All servers identical]
               ↓ Replace
Version 1.1.0: [All servers identical]
               ↓ Replace
Version 1.2.0: [All servers identical]

No drift possible!
```

---

## 🔧 Implementation with Packer

### Application Image

**`app.pkr.hcl`**:
```hcl
packer {
  required_plugins {
    amazon = {
      version = "~> 1.2"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "app_version" {
  type = string
}

variable "git_commit" {
  type = string
}

locals {
  timestamp = formatdate("YYYY-MM-DD-hhmm", timestamp())
  ami_name  = "myapp-${var.app_version}-${var.git_commit}-${local.timestamp}"
}

source "amazon-ebs" "app" {
  region        = "us-east-1"
  ami_name      = local.ami_name
  instance_type = "t3.small"
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  
  ssh_username = "ubuntu"
  
  tags = {
    Name        = local.ami_name
    AppVersion  = var.app_version
    GitCommit   = var.git_commit
    BuildDate   = local.timestamp
    Immutable   = "true"
  }
}

build {
  sources = ["source.amazon-ebs.app"]
  
  # Update system
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y"
    ]
  }
  
  # Install application dependencies
  provisioner "shell" {
    inline = [
      "sudo apt-get install -y nginx nodejs npm postgresql-client",
      "sudo systemctl enable nginx"
    ]
  }
  
  # Copy application code
  provisioner "file" {
    source      = "app/"
    destination = "/tmp/app"
  }
  
  # Install application
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/app",
      "sudo cp -r /tmp/app/* /opt/app/",
      "cd /opt/app && sudo npm install --production",
      "sudo chown -R www-data:www-data /opt/app"
    ]
  }
  
  # Configure systemd service
  provisioner "file" {
    source      = "app.service"
    destination = "/tmp/app.service"
  }
  
  provisioner "shell" {
    inline = [
      "sudo mv /tmp/app.service /etc/systemd/system/",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable app"
    ]
  }
  
  # Embed configuration (immutable!)
  provisioner "shell" {
    environment_vars = [
      "APP_VERSION=${var.app_version}",
      "GIT_COMMIT=${var.git_commit}"
    ]
    inline = [
      "echo 'APP_VERSION=${APP_VERSION}' | sudo tee /etc/app-version",
      "echo 'GIT_COMMIT=${GIT_COMMIT}' | sudo tee -a /etc/app-version"
    ]
  }
  
  # Cleanup
  provisioner "shell" {
    inline = [
      "sudo apt-get clean",
      "sudo rm -rf /var/lib/apt/lists/*",
      "sudo cloud-init clean --logs --seed",
      "history -c"
    ]
  }
}
```

---

### Build Script

**`build.sh`**:
```bash
#!/bin/bash
set -e

# Get version from git tag
APP_VERSION=$(git describe --tags --abbrev=0)
GIT_COMMIT=$(git rev-parse --short HEAD)

echo "Building image for version $APP_VERSION (commit: $GIT_COMMIT)"

# Build image
packer build \
  -var "app_version=$APP_VERSION" \
  -var "git_commit=$GIT_COMMIT" \
  app.pkr.hcl

# Save AMI ID
AMI_ID=$(jq -r '.builds[0].artifact_id' manifest.json | cut -d':' -f2)

echo "Built AMI: $AMI_ID"
echo "$AMI_ID" > ami-id.txt
```

---

## 🚀 Deployment with Terraform

### Infrastructure Code

**`main.tf`**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "ami_id" {
  description = "Immutable AMI ID"
  type        = string
}

variable "app_version" {
  description = "Application version"
  type        = string
}

# Auto Scaling Group (automatically replaces instances)
resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = var.ami_id
  instance_type = "t3.small"
  
  vpc_security_group_ids = [aws_security_group.app.id]
  
  user_data = base64encode(templatefile("user-data.sh", {
    environment = "production"
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name       = "app-server"
      Version    = var.app_version
      Immutable  = "true"
    }
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "app-asg-${var.app_version}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  
  min_size         = 3
  max_size         = 10
  desired_capacity = 5
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  # Replace instances gradually
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 80
      max_healthy_percentage = 120
    }
  }
  
  tag {
    key                 = "Name"
    value               = "app-server"
    propagate_at_launch = true
  }
  
  lifecycle {
    create_before_destroy = true
  }
}
```

---

### Deployment Process

**`deploy.sh`**:
```bash
#!/bin/bash
set -e

# Read AMI ID from Packer output
AMI_ID=$(cat ami-id.txt)
APP_VERSION=$(git describe --tags --abbrev=0)

echo "Deploying AMI: $AMI_ID (version: $APP_VERSION)"

# Deploy with Terraform
terraform apply \
  -var "ami_id=$AMI_ID" \
  -var "app_version=$APP_VERSION" \
  -auto-approve

# Wait for new instances to be healthy
echo "Waiting for instances to be healthy..."
aws autoscaling wait group-in-service \
  --auto-scaling-group-names "app-asg-${APP_VERSION}"

echo "Deployment complete!"
```

---

## 🔵🟢 Blue-Green Deployment

### Two Environments

```hcl
# Blue environment (current production)
resource "aws_autoscaling_group" "app_blue" {
  name                = "app-asg-blue"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = var.active_env == "blue" ? [aws_lb_target_group.app.arn] : []
  
  min_size         = var.active_env == "blue" ? 5 : 0
  desired_capacity = var.active_env == "blue" ? 5 : 0
  max_size         = 10
  
  launch_template {
    id      = aws_launch_template.app_blue.id
    version = "$Latest"
  }
}

# Green environment (new version)
resource "aws_autoscaling_group" "app_green" {
  name                = "app-asg-green"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = var.active_env == "green" ? [aws_lb_target_group.app.arn] : []
  
  min_size         = var.active_env == "green" ? 5 : 0
  desired_capacity = var.active_env == "green" ? 5 : 0
  max_size         = 10
  
  launch_template {
    id      = aws_launch_template.app_green.id
    version = "$Latest"
  }
}
```

---

### Deployment Steps

```bash
# 1. Build new image
packer build app-v2.0.0.pkr.hcl

# 2. Update green environment
terraform apply -var 'green_ami=ami-newversion'

# 3. Green environment spins up (blue still serving traffic)

# 4. Test green environment
curl https://green.example.com/health

# 5. Switch traffic to green
terraform apply -var 'active_env=green'

# 6. Monitor for issues
# If problems: terraform apply -var 'active_env=blue'  # Instant rollback!

# 7. After validation, destroy blue
terraform apply -var 'blue_ami=ami-newversion'
```

---

## ⚙️ Configuration Management

### Problem: Environments

**How to handle dev/staging/production?**

---

### Solution 1: Baked Configuration

**Build separate images**:
```bash
# Build dev image
packer build -var 'environment=dev' app.pkr.hcl

# Build staging image
packer build -var 'environment=staging' app.pkr.hcl

# Build production image
packer build -var 'environment=production' app.pkr.hcl
```

**Pros**: Truly immutable  
**Cons**: Multiple images to build

---

### Solution 2: Runtime Configuration

**Inject config via user-data**:
```hcl
resource "aws_launch_template" "app" {
  # Same image for all environments
  image_id = var.ami_id
  
  # Different configuration
  user_data = base64encode(templatefile("config.sh", {
    environment     = var.environment
    database_url    = var.database_url
    api_key         = var.api_key
  }))
}
```

**Pros**: One image, flexible  
**Cons**: Not fully immutable

---

### Solution 3: Hybrid Approach

**Base image + environment config**:
```hcl
# Base application (no secrets)
packer build base-app.pkr.hcl

# Deploy with environment-specific config
resource "aws_instance" "app" {
  ami = data.aws_ami.base_app.id
  
  user_data = templatefile("config.sh", {
    env = var.environment
  })
}
```

**Retrieve secrets at boot**:
```bash
#!/bin/bash
# user-data script

# Get secrets from Vault/SSM
export DATABASE_URL=$(aws ssm get-parameter --name /prod/db-url --query Parameter.Value)

# Start application
systemctl start app
```

---

## 💾 Handling State

### Stateless Services

**Easy to make immutable**:
- Web servers
- API servers
- Load balancers
- Caching layers (read replicas)

**Replace anytime!**

---

### Stateful Services

**Harder to make immutable**:
- Databases
- File storage
- Message queues

---

### Strategy 1: External State

**Separate compute and state**:
```
┌─────────────────┐
│  App Servers    │ ← Immutable
│  (Replace often)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  RDS Database   │ ← Stateful (managed service)
│  (Rarely change)│
└─────────────────┘
```

**App servers**: Immutable, replaced frequently  
**Database**: Managed, upgraded in-place

---

### Strategy 2: Data Volumes

```hcl
resource "aws_instance" "app" {
  ami = var.immutable_ami
  
  # Attach persistent EBS volume
  ebs_block_device {
    device_name = "/dev/sdf"
    volume_id   = aws_ebs_volume.data.id
  }
}

# Volume persists across instance replacements
resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
}
```

**Instance**: Replaced  
**Volume**: Persists

---

### Strategy 3: Replication

**Database with replicas**:
```
Master DB (mutable, upgraded in-place)
   ↓ Replicate
Read Replica 1 (immutable, replaced on update)
Read Replica 2 (immutable, replaced on update)
Read Replica 3 (immutable, replaced on update)
```

**Master**: Traditional upgrade  
**Replicas**: Immutable replacement

---

## 📈 Adoption Strategy

### Phase 1: Start Simple

**Pick stateless services**:
```bash
# Start with web tier
1. Dockerize application
2. Build immutable images
3. Deploy to staging
4. Monitor
5. Deploy to production
```

**Learn without risk.**

---

### Phase 2: Automate

**CI/CD pipeline**:
```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    tags: ['v*']

jobs:
  build-image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Packer image
        run: |
          packer build \
            -var "app_version=${{ github.ref_name }}" \
            -var "git_commit=${{ github.sha }}" \
            app.pkr.hcl
      
      - name: Save AMI ID
        run: |
          AMI_ID=$(jq -r '.builds[0].artifact_id' manifest.json | cut -d':' -f2)
          echo "ami_id=$AMI_ID" >> $GITHUB_OUTPUT
  
  deploy:
    needs: build-image
    runs-on: ubuntu-latest
    steps:
      - name: Deploy with Terraform
        run: |
          terraform apply \
            -var "ami_id=${{ needs.build-image.outputs.ami_id }}" \
            -auto-approve
```

---

### Phase 3: Expand

**Add more services**:
1. ✅ Web tier (done)
2. ✅ API tier (done)
3. 🔄 Background workers
4. 🔄 Batch jobs
5. 📅 Databases (managed services or careful migration)

---

## 💡 Best Practices

### 1. Version Everything

```bash
# Image naming
myapp-v1.2.3-abc123def-20260130-1430

# Components:
# - v1.2.3: Semantic version
# - abc123def: Git commit
# - 20260130-1430: Build timestamp
```

**Always know what's deployed.**

---

### 2. Test Images

```bash
# After building, test before deploying
packer build app.pkr.hcl

# Launch test instance
terraform apply -var 'ami_id=ami-new'

# Run tests
./integration-tests.sh

# If pass, deploy to production
# If fail, discard image
```

---

### 3. Keep Images Small

```bash
# In Packer provisioner
provisioner "shell" {
  inline = [
    # Install only what's needed
    "sudo apt-get install -y nginx nodejs",
    
    # Clean up
    "sudo apt-get clean",
    "sudo rm -rf /var/lib/apt/lists/*",
    "sudo rm -rf /tmp/*"
  ]
}
```

**Smaller** = faster deployment.

---

### 4. Gradual Rollout

```hcl
# Instance refresh with gradual replacement
resource "aws_autoscaling_group" "app" {
  # ...
  
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90  # Keep 90% healthy
      instance_warmup        = 60  # Wait 60s between batches
    }
  }
}
```

---

### 5. Monitoring and Rollback

```bash
# After deployment
./deploy.sh

# Monitor metrics
watch -n 5 'aws cloudwatch get-metric-statistics ...'

# If error rate increases:
terraform apply -var 'ami_id=ami-previous'  # Instant rollback
```

---

## 🔗 What's Next?

**GitOps**:
- **[gitops-principles](gitops-principles)** - Git as source of truth

**Testing**:
- **[infrastructure-testing](infrastructure-testing)** - Test infrastructure code

**CI/CD**:
- **[../cicd/pipeline-patterns](../cicd/pipeline-patterns)** - Automated pipelines

---

## 📚 Resources

**Concepts**:
- [Immutable Infrastructure by Martin Fowler](https://martinfowler.com/bliki/ImmutableServer.html)
- [The Twelve-Factor App](https://12factor.net/)

**Tools**:
- [Packer Documentation](https://www.packer.io/docs)
- [Terraform Documentation](https://www.terraform.io/docs)

---

## 📝 Change Log

### 2026-01-30
- Created immutable infrastructure guide
- Explained mutable vs immutable
- Demonstrated Packer image building
- Showed Terraform deployment
- Implemented blue-green pattern
- Covered configuration strategies
- Addressed stateful services
- Provided adoption roadmap
- Best practices
- Rollback strategies

---

**Next Article**: [gitops-principles](gitops-principles) - Git-driven operations!
