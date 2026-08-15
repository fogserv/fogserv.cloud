# Terraform Providers - Multi-Cloud Infrastructure

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Infrastructure as Code  
**Prerequisites**: [terraform-basics](terraform-basics), [terraform-state](terraform-state)  
**Time**: 3-4 hours  
**Tags**: terraform, providers, aws, azure, proxmox, multi-cloud

## Summary

Master Terraform providers to manage infrastructure across multiple clouds and platforms. Learn provider configuration, version management, and practical examples for AWS, Azure, Proxmox, and other popular providers for hybrid and multi-cloud deployments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Configure multiple providers
- ✅ Manage provider versions
- ✅ Use provider aliases
- ✅ Provision AWS infrastructure
- ✅ Provision Azure infrastructure
- ✅ Manage Proxmox VMs
- ✅ Combine multiple providers

## 🔌 What are Providers?

### Provider Concept

**Providers** are plugins that enable Terraform to interact with:
- ☁️ Cloud platforms (AWS, Azure, GCP)
- 🖥️ Infrastructure (Proxmox, VMware)
- 🐳 Containers (Docker, Kubernetes)
- 🔧 Services (GitHub, Cloudflare)
- 📊 Monitoring (Datadog, Grafana)

**3000+ providers available** at [registry.terraform.io](https://registry.terraform.io/)

---

### Provider Architecture

```
Terraform Core
     ↓
Provider Plugin (e.g., AWS)
     ↓
AWS API
     ↓
AWS Infrastructure
```

---

## 📦 Provider Configuration

### Basic Provider Setup

**versions.tf**:
```hcl
terraform {
  required_version = ">= 1.7.0"
  
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
```

---

### Version Constraints

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"     # >= 5.0, < 6.0
    }
    
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0, < 4.0"  # Range
    }
    
    random = {
      source  = "hashicorp/random"
      version = "= 3.5.1"    # Exact version
    }
    
    local = {
      source  = "hashicorp/local"
      version = ">= 2.0"     # Minimum
    }
  }
}
```

**Version operators**:
- `=` - Exact version
- `!=` - Exclude version
- `>`, `>=`, `<`, `<=` - Comparisons
- `~>` - Pessimistic constraint (allows rightmost version component to increment)

---

### Provider Source

```hcl
terraform {
  required_providers {
    # Official HashiCorp provider
    aws = {
      source = "hashicorp/aws"
    }
    
    # Community provider
    proxmox = {
      source = "telmate/proxmox"
    }
    
    # Custom/private provider
    custom = {
      source = "example.com/myorg/custom"
    }
  }
}
```

---

## ☁️ AWS Provider

### Basic Configuration

**provider.tf**:
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
  
  # Credentials from:
  # 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  # 2. ~/.aws/credentials
  # 3. IAM role (EC2, ECS, Lambda)
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = var.project_name
    }
  }
}
```

---

### AWS Resources Example

**main.tf**:
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  count = 2
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
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
  count = 2
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Allow HTTP/HTTPS"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
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
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = var.key_name
  
  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y nginx
              systemctl start nginx
              EOF
  
  tags = {
    Name = "${var.project_name}-web"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier        = "${var.project_name}-db"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot = true
  
  tags = {
    Name = "${var.project_name}-db"
  }
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}
```

---

## 🔷 Azure Provider

### Basic Configuration

**provider.tf**:
```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  
  # Credentials from:
  # 1. Environment variables (ARM_SUBSCRIPTION_ID, ARM_TENANT_ID, etc.)
  # 2. Azure CLI (az login)
  # 3. Managed Identity (Azure VM, AKS)
  
  subscription_id = var.azure_subscription_id
}
```

---

### Azure Resources Example

**main.tf**:
```hcl
# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-rg"
  location = var.azure_location
  
  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

# Subnet
resource "azurerm_subnet" "public" {
  name                 = "public-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Public IP
resource "azurerm_public_ip" "main" {
  name                = "${var.project_name}-ip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# Network Security Group
resource "azurerm_network_security_group" "main" {
  name                = "${var.project_name}-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  security_rule {
    name                       = "HTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "HTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Network Interface
resource "azurerm_network_interface" "main" {
  name                = "${var.project_name}-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.public.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.main.id
  }
}

# Virtual Machine
resource "azurerm_linux_virtual_machine" "main" {
  name                = "${var.project_name}-vm"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = "Standard_B1s"
  
  admin_username                  = "azureuser"
  disable_password_authentication = true
  
  admin_ssh_key {
    username   = "azureuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }
  
  network_interface_ids = [
    azurerm_network_interface.main.id,
  ]
  
  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }
  
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
  
  custom_data = base64encode(<<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y nginx
              systemctl start nginx
              EOF
  )
}

# PostgreSQL Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.project_name}-pg"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  administrator_login    = var.db_username
  administrator_password = var.db_password
  
  storage_mb = 32768
  sku_name   = "B_Standard_B1ms"
}
```

---

## 🖥️ Proxmox Provider

### Configuration

**provider.tf**:
```hcl
terraform {
  required_providers {
    proxmox = {
      source  = "telmate/proxmox"
      version = "~> 2.9"
    }
  }
}

provider "proxmox" {
  pm_api_url      = "https://proxmox.example.com:8006/api2/json"
  pm_user         = "terraform@pam"
  pm_password     = var.proxmox_password
  # Or use API token:
  # pm_api_token_id     = "terraform@pam!mytoken"
  # pm_api_token_secret = var.proxmox_token
  
  pm_tls_insecure = true  # For self-signed certs
}
```

---

### Proxmox VM Example

**main.tf**:
```hcl
# VM Template (create once)
resource "proxmox_vm_qemu" "template" {
  name        = "ubuntu-2204-template"
  target_node = "pve"
  clone       = "ubuntu-2204-cloudinit"  # Pre-existing template
  
  # Template configuration
  agent    = 1
  os_type  = "cloud-init"
  cores    = 2
  sockets  = 1
  cpu      = "host"
  memory   = 2048
  scsihw   = "virtio-scsi-pci"
  bootdisk = "scsi0"
  
  disk {
    slot    = 0
    size    = "20G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  lifecycle {
    ignore_changes = [
      network,
    ]
  }
}

# Production VMs
resource "proxmox_vm_qemu" "web" {
  count = 3
  
  name        = "web-${count.index + 1}"
  target_node = "pve"
  clone       = proxmox_vm_qemu.template.name
  
  cores   = 2
  memory  = 4096
  
  disk {
    slot    = 0
    size    = "50G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  # Cloud-init
  ipconfig0 = "ip=10.0.1.${10 + count.index}/24,gw=10.0.1.1"
  
  sshkeys = file("~/.ssh/id_rsa.pub")
  
  tags = "web,production,terraform"
}

# Database VM
resource "proxmox_vm_qemu" "db" {
  name        = "database"
  target_node = "pve"
  clone       = proxmox_vm_qemu.template.name
  
  cores   = 4
  memory  = 8192
  
  disk {
    slot    = 0
    size    = "100G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  # Additional disk for data
  disk {
    slot    = 1
    size    = "200G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.20/24,gw=10.0.1.1"
  sshkeys   = file("~/.ssh/id_rsa.pub")
  
  tags = "database,production,terraform"
}
```

---

## 🔀 Multiple Providers

### Provider Aliases

**provider.tf**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Default provider (us-east-1)
provider "aws" {
  region = "us-east-1"
}

# Additional provider (us-west-2)
provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

# Additional provider (eu-west-1)
provider "aws" {
  alias  = "eu"
  region = "eu-west-1"
}
```

**Use specific provider**:
```hcl
# Uses default provider (us-east-1)
resource "aws_instance" "east" {
  ami           = "ami-123456"
  instance_type = "t3.micro"
}

# Uses west provider (us-west-2)
resource "aws_instance" "west" {
  provider = aws.west
  
  ami           = "ami-789012"
  instance_type = "t3.micro"
}

# Uses eu provider (eu-west-1)
resource "aws_s3_bucket" "eu" {
  provider = aws.eu
  
  bucket = "my-eu-bucket"
}
```

---

### Multi-Cloud Setup

**providers.tf**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    proxmox = {
      source  = "telmate/proxmox"
      version = "~> 2.9"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "azurerm" {
  features {}
}

provider "proxmox" {
  pm_api_url = "https://proxmox.example.com:8006/api2/json"
  pm_user    = "terraform@pam"
  pm_password = var.proxmox_password
}
```

**main.tf**:
```hcl
# AWS Resources
resource "aws_s3_bucket" "backups" {
  bucket = "my-backups"
}

# Azure Resources
resource "azurerm_storage_account" "logs" {
  name                     = "mylogsstorage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = "eastus"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# Proxmox Resources
resource "proxmox_vm_qemu" "app" {
  name        = "app-server"
  target_node = "pve"
  # ... config
}
```

---

## 🔧 Useful Providers

### Docker Provider

```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

resource "docker_image" "nginx" {
  name = "nginx:latest"
}

resource "docker_container" "nginx" {
  name  = "nginx"
  image = docker_image.nginx.image_id
  
  ports {
    internal = 80
    external = 8080
  }
}
```

---

### Kubernetes Provider

```hcl
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "app" {
  metadata {
    name = "myapp"
  }
}

resource "kubernetes_deployment" "app" {
  metadata {
    name      = "myapp"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  
  spec {
    replicas = 3
    
    selector {
      match_labels = {
        app = "myapp"
      }
    }
    
    template {
      metadata {
        labels = {
          app = "myapp"
        }
      }
      
      spec {
        container {
          name  = "myapp"
          image = "myapp:latest"
          
          port {
            container_port = 8080
          }
        }
      }
    }
  }
}
```

---

### CloudFlare Provider

```hcl
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_zone" "example" {
  zone = "example.com"
}

resource "cloudflare_record" "www" {
  zone_id = cloudflare_zone.example.id
  name    = "www"
  value   = aws_instance.web.public_ip
  type    = "A"
  ttl     = 3600
}
```

---

### GitHub Provider

```hcl
terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

provider "github" {
  token = var.github_token
}

resource "github_repository" "example" {
  name        = "myrepo"
  description = "My infrastructure repo"
  visibility  = "private"
  
  has_issues   = true
  has_wiki     = false
  auto_init    = true
}

resource "github_branch_protection" "main" {
  repository_id = github_repository.example.node_id
  pattern       = "main"
  
  required_pull_request_reviews {
    required_approving_review_count = 2
  }
}
```

---

## 💡 Best Practices

### 1. Pin Provider Versions

```hcl
# Good: Pinned version
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Any 5.x version
    }
  }
}

# Bad: No version constraint
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      # No version! Can break unexpectedly
    }
  }
}
```

---

### 2. Use Variables for Credentials

```hcl
# Good: Use variables
provider "proxmox" {
  pm_api_url  = var.proxmox_url
  pm_password = var.proxmox_password
}

# Bad: Hardcoded credentials
provider "proxmox" {
  pm_api_url  = "https://proxmox.example.com:8006/api2/json"
  pm_password = "super_secret"  # ❌ Never do this!
}
```

---

### 3. Organize Provider Files

```
terraform/
├── versions.tf     # Provider versions
├── providers.tf    # Provider configuration
├── main.tf         # Resources
├── variables.tf
└── outputs.tf
```

---

### 4. Use Provider Default Tags

```hcl
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = var.project_name
      CostCenter  = var.cost_center
    }
  }
}

# All AWS resources automatically get these tags!
```

---

## 🔗 What's Next?

**Modules**:
- **[terraform-modules](terraform-modules)** - Reusable components

**Proxmox**:
- **[terraform-proxmox](terraform-proxmox)** - Self-hosted infrastructure

**Advanced**:
- **[terraform-workspaces](terraform-workspaces)** - Multi-environment

---

## 📚 Resources

**Provider Registry**:
- [Terraform Registry](https://registry.terraform.io/)
- [Provider Documentation](https://registry.terraform.io/browse/providers)

**Popular Providers**:
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Proxmox Provider](https://registry.terraform.io/providers/Telmate/proxmox/latest/docs)

---

## 📝 Change Log

### 2026-01-30
- Created providers guide
- Explained provider concept
- Covered version management
- Demonstrated AWS provider
- Demonstrated Azure provider
- Demonstrated Proxmox provider
- Showed multiple provider patterns
- Included useful providers
- Added best practices

---

**Next Article**: [terraform-modules](terraform-modules) - Reusable infrastructure!

