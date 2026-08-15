# Terraform Modules - Reusable Infrastructure

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Infrastructure as Code  
**Prerequisites**: [terraform-basics](terraform-basics), [terraform-providers](terraform-providers)  
**Time**: 3-4 hours  
**Tags**: terraform, modules, reusability, composition, registry

## Summary

Master Terraform modules to create reusable, composable infrastructure components. Learn module structure, input/output variables, versioning, and publishing to registries for team collaboration and standardization.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand module concepts
- ✅ Create custom modules
- ✅ Use input and output variables
- ✅ Compose modules together
- ✅ Version and publish modules
- ✅ Use public registry modules
- ✅ Organize large projects

## 📦 What are Modules?

### Module Concept

**Modules** are containers for multiple resources used together. Think of them as **functions** in programming.

**Benefits**:
- 🔄 **Reusability**: Write once, use many times
- 🏗️ **Composition**: Build complex infrastructure from simple parts
- 📏 **Standardization**: Enforce organizational standards
- 🧪 **Testing**: Test modules independently
- 📚 **Documentation**: Self-documenting infrastructure

---

### Module Types

**1. Root Module**:
- Your main Terraform configuration
- The directory where you run `terraform apply`

**2. Child Modules**:
- Called by other modules
- Stored in subdirectories or external sources

**3. Published Modules**:
- Shared via Terraform Registry
- Versioned and documented

---

## 🏗️ Creating Your First Module

### Module Structure

```
terraform/
├── main.tf              # Root module
├── variables.tf
├── outputs.tf
└── modules/
    └── webserver/       # Child module
        ├── main.tf      # Resources
        ├── variables.tf # Input variables
        ├── outputs.tf   # Output values
        └── README.md    # Documentation
```

---

### Simple Webserver Module

**modules/webserver/main.tf**:
```hcl
# Security Group
resource "aws_security_group" "web" {
  name        = "${var.name}-sg"
  description = "Security group for ${var.name}"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name}-sg"
    }
  )
}

# EC2 Instance
resource "aws_instance" "web" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = var.key_name
  
  user_data = var.user_data
  
  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}
```

**modules/webserver/variables.tf**:
```hcl
variable "name" {
  description = "Name of the webserver"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where resources will be created"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for the instance"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for the instance"
  type        = string
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

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access HTTP/HTTPS"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "user_data" {
  description = "User data script"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/webserver/outputs.tf**:
```hcl
output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IP address"
  value       = aws_instance.web.public_ip
}

output "private_ip" {
  description = "Private IP address"
  value       = aws_instance.web.private_ip
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.web.id
}
```

---

### Using the Module

**Root main.tf**:
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
}

# VPC (prerequisite)
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "main-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "public-subnet"
  }
}

# Use webserver module
module "app_server" {
  source = "./modules/webserver"
  
  name          = "app-server"
  vpc_id        = aws_vpc.main.id
  subnet_id     = aws_subnet.public.id
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  key_name      = "mykey"
  
  ssh_cidr_blocks = ["203.0.113.0/24"]  # Your office IP
  
  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y nginx
              systemctl start nginx
              EOF
  
  tags = {
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# Use module multiple times
module "staging_server" {
  source = "./modules/webserver"
  
  name          = "staging-server"
  vpc_id        = aws_vpc.main.id
  subnet_id     = aws_subnet.public.id
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  key_name      = "mykey"
  
  tags = {
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}
```

**Access module outputs**:
```hcl
output "app_server_ip" {
  value = module.app_server.public_ip
}

output "staging_server_ip" {
  value = module.staging_server.public_ip
}
```

---

## 🔗 Module Sources

### Local Path

```hcl
module "webserver" {
  source = "./modules/webserver"
}
```

---

### Git Repository

```hcl
# HTTPS
module "webserver" {
  source = "git::https://github.com/myorg/terraform-modules.git//webserver"
}

# SSH
module "webserver" {
  source = "git::git@github.com:myorg/terraform-modules.git//webserver"
}

# Specific branch
module "webserver" {
  source = "git::https://github.com/myorg/terraform-modules.git//webserver?ref=develop"
}

# Specific tag
module "webserver" {
  source = "git::https://github.com/myorg/terraform-modules.git//webserver?ref=v1.2.3"
}
```

---

### Terraform Registry

```hcl
# Official module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"
  
  name = "my-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
}
```

---

## 🧩 Module Composition

### Database Module

**modules/database/main.tf**:
```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${var.name}-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name}-subnet-group"
    }
  )
}

resource "aws_security_group" "db" {
  name        = "${var.name}-db-sg"
  description = "Database security group"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = var.port
    to_port         = var.port
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.name}-db-sg"
    }
  )
}

resource "aws_db_instance" "main" {
  identifier     = var.name
  engine         = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class
  
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_encrypted     = var.storage_encrypted
  
  db_name  = var.db_name
  username = var.username
  password = var.password
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window
  
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name}-final-snapshot"
  
  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}
```

**modules/database/variables.tf**:
```hcl
variable "name" {
  description = "Database identifier"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for database"
  type        = list(string)
}

variable "engine" {
  description = "Database engine (postgres, mysql, etc.)"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "Instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum storage for autoscaling"
  type        = number
  default     = 100
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "username" {
  description = "Master username"
  type        = string
}

variable "password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "allowed_security_groups" {
  description = "Security groups allowed to connect"
  type        = list(string)
}

variable "backup_retention_period" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on destroy"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}
```

**modules/database/outputs.tf**:
```hcl
output "endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "Database address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.db.id
}
```

---

### Compose Web + Database

**main.tf**:
```hcl
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "production-vpc"
  cidr = "10.0.0.0/16"
  
  azs              = ["us-east-1a", "us-east-1b"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24"]
  
  enable_nat_gateway = true
}

module "web_servers" {
  source = "./modules/webserver"
  count  = 2
  
  name          = "web-${count.index + 1}"
  vpc_id        = module.vpc.vpc_id
  subnet_id     = module.vpc.public_subnets[count.index]
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  key_name      = var.key_name
  
  allowed_cidr_blocks = ["0.0.0.0/0"]
  ssh_cidr_blocks     = [var.office_cidr]
  
  user_data = templatefile("${path.module}/templates/web-init.sh", {
    db_endpoint = module.database.endpoint
    db_name     = module.database.db_name
  })
  
  tags = {
    Environment = "production"
    Role        = "webserver"
  }
}

module "database" {
  source = "./modules/database"
  
  name       = "production-db"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.database_subnets
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.small"
  
  allocated_storage = 50
  storage_encrypted = true
  
  db_name  = "myapp"
  username = "admin"
  password = var.db_password
  
  # Allow web servers to connect
  allowed_security_groups = [
    for server in module.web_servers : server.security_group_id
  ]
  
  backup_retention_period = 30
  
  tags = {
    Environment = "production"
    Role        = "database"
  }
}

# Load Balancer
resource "aws_lb" "web" {
  name               = "web-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = module.vpc.public_subnets
  
  tags = {
    Environment = "production"
  }
}

resource "aws_lb_target_group" "web" {
  name     = "web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  
  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

resource "aws_lb_target_group_attachment" "web" {
  count = 2
  
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = module.web_servers[count.index].instance_id
  port             = 80
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_security_group" "lb" {
  name   = "lb-sg"
  vpc_id = module.vpc.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

---

## 📝 Module Documentation

### README Template

**modules/webserver/README.md**:
```markdown
# Webserver Module

Creates an EC2 instance configured as a web server with appropriate security groups.

## Usage

```hcl
module "webserver" {
  source = "./modules/webserver"
  
  name          = "my-webserver"
  vpc_id        = "vpc-123456"
  subnet_id     = "subnet-123456"
  ami_id        = "ami-123456"
  instance_type = "t3.small"
  key_name      = "mykey"
  
  allowed_cidr_blocks = ["0.0.0.0/0"]
  ssh_cidr_blocks     = ["203.0.113.0/24"]
  
  tags = {
    Environment = "production"
  }
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.7.0 |
| aws | ~> 5.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| name | Name of the webserver | `string` | n/a | yes |
| vpc_id | VPC ID | `string` | n/a | yes |
| subnet_id | Subnet ID | `string` | n/a | yes |
| ami_id | AMI ID | `string` | n/a | yes |
| instance_type | Instance type | `string` | `t3.micro` | no |
| key_name | SSH key name | `string` | n/a | yes |
| allowed_cidr_blocks | HTTP/HTTPS allowed CIDRs | `list(string)` | `["0.0.0.0/0"]` | no |
| ssh_cidr_blocks | SSH allowed CIDRs | `list(string)` | `["0.0.0.0/0"]` | no |
| user_data | User data script | `string` | `""` | no |
| tags | Resource tags | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| instance_id | EC2 instance ID |
| public_ip | Public IP address |
| private_ip | Private IP address |
| security_group_id | Security group ID |

## Examples

See the [examples](examples/) directory.
```

---

## 🏷️ Module Versioning

### Git Tags

```bash
# Tag a release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# Use specific version
module "webserver" {
  source = "git::https://github.com/myorg/terraform-modules.git//webserver?ref=v1.0.0"
}
```

---

### Version Constraints

```hcl
module "webserver" {
  source  = "myorg/webserver/aws"
  version = "~> 1.0"  # >= 1.0.0, < 2.0.0
}

module "database" {
  source  = "myorg/database/aws"
  version = ">= 1.2.0, < 2.0.0"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "= 5.1.2"  # Exact version
}
```

---

## 🌐 Publishing to Registry

### Private Registry (Terraform Cloud)

**1. Create repository**: `terraform-<PROVIDER>-<NAME>`
```bash
# Example: terraform-aws-webserver
```

**2. Tag release**:
```bash
git tag v1.0.0
git push origin v1.0.0
```

**3. Terraform Cloud detects and publishes automatically**

**4. Use**:
```hcl
module "webserver" {
  source  = "app.terraform.io/myorg/webserver/aws"
  version = "1.0.0"
}
```

---

### Public Registry

**Requirements**:
- Repository name: `terraform-<PROVIDER>-<NAME>`
- Public GitHub repository
- Git tags for versions (v1.0.0)
- README.md
- LICENSE

**Publish**:
1. Go to [registry.terraform.io](https://registry.terraform.io/)
2. Sign in with GitHub
3. Publish → Module
4. Select repository
5. Terraform syncs tags automatically

---

## 💡 Best Practices

### 1. Keep Modules Focused

```hcl
# Good: Single purpose
module "webserver" { }
module "database" { }
module "cache" { }

# Bad: Does too much
module "entire_application" { }
```

---

### 2. Use Semantic Versioning

```
v1.0.0 - Initial release
v1.1.0 - Add feature (backward compatible)
v1.1.1 - Bug fix
v2.0.0 - Breaking change
```

---

### 3. Validate Inputs

```hcl
variable "instance_type" {
  type = string
  
  validation {
    condition     = can(regex("^t[23]\\.", var.instance_type))
    error_message = "Instance type must be t2 or t3 series."
  }
}

variable "allocated_storage" {
  type = number
  
  validation {
    condition     = var.allocated_storage >= 20 && var.allocated_storage <= 1000
    error_message = "Storage must be between 20 and 1000 GB."
  }
}
```

---

### 4. Provide Examples

```
modules/webserver/
├── main.tf
├── variables.tf
├── outputs.tf
├── README.md
└── examples/
    ├── basic/
    │   └── main.tf
    ├── with-load-balancer/
    │   └── main.tf
    └── high-availability/
        └── main.tf
```

---

### 5. Use Count for Optional Resources

```hcl
# Optional elastic IP
resource "aws_eip" "web" {
  count = var.enable_elastic_ip ? 1 : 0
  
  instance = aws_instance.web.id
}

output "elastic_ip" {
  value = var.enable_elastic_ip ? aws_eip.web[0].public_ip : null
}
```

---

## 🔗 What's Next?

**Workspaces**:
- **[terraform-workspaces](terraform-workspaces)** - Multi-environment

**Proxmox**:
- **[terraform-proxmox](terraform-proxmox)** - Self-hosted infrastructure

**Testing**:
- **[infrastructure-testing](infrastructure-testing)** - Testing patterns

---

## 📚 Resources

**Module Registry**:
- [Terraform Registry](https://registry.terraform.io/)
- [AWS Modules](https://registry.terraform.io/namespaces/terraform-aws-modules)

**Documentation**:
- [Module Basics](https://developer.hashicorp.com/terraform/language/modules)
- [Publishing Modules](https://developer.hashicorp.com/terraform/registry/modules/publish)

---

## 📝 Change Log

### 2026-01-30
- Created modules guide
- Explained module concepts
- Showed module creation
- Covered module sources
- Demonstrated composition
- Explained versioning
- Covered registry publishing
- Added best practices

---

**Next Article**: [terraform-workspaces](terraform-workspaces) - Multi-environment management!
