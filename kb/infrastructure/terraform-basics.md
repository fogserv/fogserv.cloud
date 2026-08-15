# Terraform Basics - Infrastructure as Code

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Infrastructure as Code  
**Prerequisites**: [ansible-basics](ansible-basics), [linux-fundamentals](../basics/linux-fundamentals)  
**Time**: 3-4 hours  
**Tags**: terraform, iac, infrastructure-as-code, provisioning, hcl

## Summary

Master Terraform fundamentals to provision and manage infrastructure as code. Learn HCL syntax, resource management, state concepts, and build your first infrastructure with Terraform across multiple providers.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Infrastructure as Code principles
- ✅ Write Terraform configurations in HCL
- ✅ Provision resources with Terraform
- ✅ Manage Terraform state
- ✅ Use variables and outputs
- ✅ Plan and apply changes safely
- ✅ Destroy infrastructure when needed

## 🤔 What is Terraform?

### Infrastructure as Code (IaC)

**Traditional Infrastructure**:
```bash
# Manual clicks in cloud console
# 1. Login to AWS console
# 2. Navigate to EC2
# 3. Click "Launch Instance"
# 4. Fill out 20 fields
# 5. Click through 5 pages
# 6. Repeat for each server

# Problems:
# ❌ Not reproducible
# ❌ Error-prone
# ❌ No version control
# ❌ Hard to document
# ❌ Team can't collaborate
```

**Terraform Way**:
```hcl
# main.tf
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  
  tags = {
    Name = "web-server"
  }
}

# Apply once, works every time
# ✅ Reproducible
# ✅ Version controlled
# ✅ Documented in code
# ✅ Team collaboration
# ✅ Easy to review
```

---

### Terraform vs Configuration Management

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Terraform** | Provision infrastructure | Create servers, networks, databases |
| **Ansible** | Configure infrastructure | Install software, manage configs |
| **Together** | Complete automation | Terraform creates, Ansible configures |

**Example**:
```
Terraform: Create 3 EC2 instances + VPC + Load Balancer
    ↓
Ansible: Install Nginx + Deploy app + Configure monitoring
```

---

## 📥 Installation

### Linux

```bash
# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Fedora/RHEL
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://rpm.releases.hashicorp.com/fedora/hashicorp.repo
sudo dnf install terraform

# Arch
sudo pacman -S terraform
```

---

### macOS

```bash
# Homebrew
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

---

### Windows

```powershell
# Chocolatey
choco install terraform

# Or download from terraform.io
```

---

### Verify Installation

```bash
terraform version
# Terraform v1.7.0
```

---

## 🏗️ First Terraform Project

### Project Structure

```
terraform-project/
├── main.tf          # Main configuration
├── variables.tf     # Input variables
├── outputs.tf       # Output values
├── terraform.tfvars # Variable values (don't commit secrets!)
└── .gitignore       # Ignore terraform state
```

---

### Simple Example (Local)

**main.tf**:
```hcl
# Create a local file
resource "local_file" "example" {
  filename = "${path.module}/hello.txt"
  content  = "Hello from Terraform!"
}
```

**Initialize**:
```bash
# Download providers
terraform init
```

**Plan** (preview changes):
```bash
# See what will be created
terraform plan
```

**Output**:
```
Terraform will perform the following actions:

  # local_file.example will be created
  + resource "local_file" "example" {
      + content  = "Hello from Terraform!"
      + filename = "./hello.txt"
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

**Apply** (create resources):
```bash
# Actually create the file
terraform apply
```

**Verify**:
```bash
cat hello.txt
# Hello from Terraform!
```

---

## 📝 HCL Syntax

### Resources

**Basic syntax**:
```hcl
resource "TYPE" "NAME" {
  argument = "value"
  argument = "value"
}
```

**Example**:
```hcl
resource "local_file" "readme" {
  filename = "README.md"
  content  = "# My Project"
}
```

---

### Variables

**variables.tf**:
```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 1
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {
    Environment = "dev"
  }
}
```

**Use variables**:
```hcl
resource "aws_instance" "web" {
  count         = var.instance_count
  instance_type = var.instance_type
  
  tags = var.tags
}
```

---

### Variable Types

```hcl
# String
variable "region" {
  type    = string
  default = "us-east-1"
}

# Number
variable "port" {
  type    = number
  default = 80
}

# Bool
variable "enabled" {
  type    = bool
  default = true
}

# List
variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

# Map
variable "ami_ids" {
  type = map(string)
  default = {
    us-east-1 = "ami-123456"
    us-west-2 = "ami-789012"
  }
}

# Object
variable "server_config" {
  type = object({
    instance_type = string
    disk_size     = number
  })
  default = {
    instance_type = "t3.micro"
    disk_size     = 20
  }
}
```

---

### Outputs

**outputs.tf**:
```hcl
output "instance_id" {
  description = "ID of the created instance"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IP address"
  value       = aws_instance.web.public_ip
}

output "connection_string" {
  description = "How to connect"
  value       = "ssh ubuntu@${aws_instance.web.public_ip}"
}
```

**View outputs**:
```bash
# After terraform apply
terraform output

# Specific output
terraform output public_ip

# JSON format
terraform output -json
```

---

### Locals

**Computed values used multiple times**:

```hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = "MyApp"
    ManagedBy   = "Terraform"
  }
  
  instance_name = "${var.project_name}-${var.environment}-web"
}

resource "aws_instance" "web" {
  tags = merge(
    local.common_tags,
    {
      Name = local.instance_name
    }
  )
}
```

---

## 🌍 Providers

### What are Providers?

**Providers** connect Terraform to APIs:
- AWS, Azure, GCP (cloud providers)
- Docker, Kubernetes (container platforms)
- GitHub, GitLab (VCS providers)
- 3000+ providers available

---

### Configure Provider

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
  region = "us-east-1"
  
  # Credentials from environment variables or ~/.aws/credentials
}
```

---

### Multiple Providers

```hcl
# Default provider
provider "aws" {
  region = "us-east-1"
}

# Additional provider (different region)
provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

# Use specific provider
resource "aws_instance" "east" {
  # Uses default provider (us-east-1)
  ami           = "ami-123456"
  instance_type = "t3.micro"
}

resource "aws_instance" "west" {
  provider = aws.west  # Uses west provider (us-west-2)
  
  ami           = "ami-789012"
  instance_type = "t3.micro"
}
```

---

## 🎯 Real-World Example: AWS Infrastructure

### Complete AWS Setup

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

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Route Table Association
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Allow HTTP and SSH"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict in production!
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

# EC2 Instance
resource "aws_instance" "web" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = var.key_name
  
  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y nginx
              echo "<h1>Hello from Terraform!</h1>" > /var/www/html/index.html
              systemctl start nginx
              EOF
  
  tags = {
    Name = "${var.project_name}-web-server"
  }
}
```

---

**variables.tf**:
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "myapp"
}

variable "ami_id" {
  description = "AMI ID for EC2 instance"
  type        = string
  default     = "ami-0c55b159cbfafe1f0"  # Ubuntu 22.04
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
}
```

---

**outputs.tf**:
```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IP of web server"
  value       = aws_instance.web.public_ip
}

output "website_url" {
  description = "Website URL"
  value       = "http://${aws_instance.web.public_ip}"
}
```

---

**terraform.tfvars**:
```hcl
aws_region    = "us-east-1"
project_name  = "mywebapp"
instance_type = "t3.micro"
key_name      = "my-ssh-key"  # Your AWS key pair name
```

---

### Deploy Infrastructure

```bash
# Initialize
terraform init

# Plan (dry run)
terraform plan

# Apply
terraform apply

# View outputs
terraform output

# Access website
curl http://$(terraform output -raw public_ip)
```

---

## 📦 State Management

### What is State?

**terraform.tfstate** tracks:
- Resources created
- Resource IDs
- Resource attributes
- Dependencies

**Never edit state file manually!**

---

### State Commands

```bash
# List resources in state
terraform state list

# Show resource details
terraform state show aws_instance.web

# Move resource in state
terraform state mv aws_instance.old aws_instance.new

# Remove from state (doesn't destroy resource!)
terraform state rm aws_instance.web

# Pull remote state
terraform state pull

# Push state
terraform state push
```

---

### State Storage

**.gitignore**:
```
# Never commit state!
*.tfstate
*.tfstate.*
.terraform/
```

**Why not commit state?**:
- Contains sensitive data
- Can be large
- Team conflicts
- Better to use remote state

---

## 🔄 Terraform Workflow

### 1. Write Configuration

```hcl
# main.tf
resource "aws_instance" "web" {
  ami           = "ami-123456"
  instance_type = "t3.micro"
}
```

---

### 2. Initialize

```bash
terraform init
```

Downloads providers, prepares backend.

---

### 3. Plan

```bash
terraform plan

# Save plan for review
terraform plan -out=tfplan
```

Shows what will change.

---

### 4. Apply

```bash
terraform apply

# Apply saved plan
terraform apply tfplan

# Auto-approve (use carefully!)
terraform apply -auto-approve
```

Creates/updates resources.

---

### 5. Modify

```hcl
# Change instance type
resource "aws_instance" "web" {
  ami           = "ami-123456"
  instance_type = "t3.small"  # Changed!
}
```

```bash
# Plan shows update
terraform plan
# Shows: ~ instance_type: "t3.micro" -> "t3.small"

# Apply update
terraform apply
```

---

### 6. Destroy

```bash
# Destroy all resources
terraform destroy

# Destroy specific resource
terraform destroy -target=aws_instance.web

# Plan destruction
terraform plan -destroy
```

---

## 💡 Best Practices

### 1. Use Version Control

```bash
git init
git add *.tf
git commit -m "Initial infrastructure"
```

---

### 2. Use Variables

```hcl
# Bad: Hardcoded
resource "aws_instance" "web" {
  instance_type = "t3.micro"
}

# Good: Variable
resource "aws_instance" "web" {
  instance_type = var.instance_type
}
```

---

### 3. Tag Everything

```hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
  }
}

resource "aws_instance" "web" {
  # ... other config ...
  tags = local.common_tags
}
```

---

### 4. Use Modules (Next Level)

```hcl
# Use community module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  
  name = "my-vpc"
  cidr = "10.0.0.0/16"
}
```

---

### 5. Validate Configuration

```bash
# Format code
terraform fmt

# Validate syntax
terraform validate

# Check for issues
terraform plan
```

---

## 🔗 What's Next?

**State Management**:
- **[terraform-state](terraform-state)** - Remote state, locking

**Providers**:
- **[terraform-providers](terraform-providers)** - AWS, Azure, Proxmox

**Advanced**:
- **[terraform-modules](terraform-modules)** - Reusable infrastructure
- **[terraform-workspaces](terraform-workspaces)** - Multi-environment

---

## 📚 Resources

**Official Docs**:
- [Terraform Documentation](https://www.terraform.io/docs)
- [Terraform Registry](https://registry.terraform.io/)
- [HCL Syntax](https://www.terraform.io/docs/language/syntax/configuration.html)

**Learning**:
- [HashiCorp Learn](https://learn.hashicorp.com/terraform)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

**Providers**:
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [All Providers](https://registry.terraform.io/browse/providers)

---

## 📝 Change Log

### 2026-01-30
- Created Terraform basics guide
- Explained Infrastructure as Code
- Covered installation on multiple platforms
- Demonstrated HCL syntax
- Provided complete AWS infrastructure example
- Explained state management
- Showed Terraform workflow
- Included best practices

---

**Next Article**: [terraform-state](terraform-state) - Master state management!

