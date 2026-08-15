# Packer Introduction - Automated Image Building

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Image Management  
**Prerequisites**: [cloud-init-basics](cloud-init-basics), [terraform-proxmox](terraform-proxmox)  
**Time**: 2-3 hours  
**Tags**: packer, automation, images, templates, immutable-infrastructure

## Summary

Build automated VM and container images with HashiCorp Packer. Learn template creation, provisioning, multi-cloud builds, and integration with Terraform for immutable infrastructure.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand Packer concepts
- ✅ Write Packer templates
- ✅ Build VM images
- ✅ Use provisioners
- ✅ Create multi-cloud images
- ✅ Integrate with Terraform
- ✅ Implement CI/CD pipelines
- ✅ Build container images

## 📦 What is Packer?

### The Problem

**Manual image creation**:
```bash
# Every time you need a new VM template:
1. Install base OS
2. Update packages
3. Install software
4. Configure system
5. Remove sensitive data
6. Create template
# ... 1-2 hours per image
# ... Different steps per platform (AWS, Azure, Proxmox)
# ... Not repeatable
# ... No version control
```

**Issues**:
- ⏱️ Time-consuming
- ❌ Error-prone
- 🔄 Not repeatable
- 📝 No documentation
- 🌐 Different for each platform

---

### The Solution: Packer

**Packer** automates image creation:
- 📝 **Code**: Images as code (HCL/JSON)
- 🔄 **Repeatable**: Same process every time
- 🌐 **Multi-cloud**: AWS, Azure, GCP, Proxmox, VMware
- 🚀 **Fast**: Parallel builds
- 📦 **Versioned**: Git-tracked

**One template** → **Multiple platforms**

---

### How It Works

```
Packer Template (.pkr.hcl)
   ↓
Builder (Creates temporary VM)
   ↓
Provisioners (Install software)
   ↓
Post-processors (Create image)
   ↓
Output (AMI, Azure Image, Proxmox Template, Docker Image)
```

---

### Key Concepts

**Builder**: Creates temporary instance
- `amazon-ebs` - AWS AMI
- `azure-arm` - Azure Image
- `proxmox-iso` - Proxmox template
- `docker` - Docker image

**Provisioner**: Configures instance
- `shell` - Run scripts
- `ansible` - Run playbooks
- `file` - Copy files
- `cloud-init` - Cloud-init config

**Post-processor**: Process output
- `manifest` - Save metadata
- `docker-tag` - Tag Docker image
- `compress` - Compress image

---

## 📥 Installation

### Linux

```bash
# Download
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"

# Install
sudo apt-get update
sudo apt-get install packer

# Verify
packer version
# Output: Packer v1.10.0
```

---

### macOS

```bash
# Install with Homebrew
brew tap hashicorp/tap
brew install hashicorp/tap/packer

# Verify
packer version
```

---

### Windows

```powershell
# Install with Chocolatey
choco install packer

# Or with Scoop
scoop install packer

# Verify
packer version
```

---

## 🎯 First Template

### Simple Ubuntu Template

**`ubuntu.pkr.hcl`**:
```hcl
packer {
  required_plugins {
    virtualbox = {
      version = "~> 1.0"
      source  = "github.com/hashicorp/virtualbox"
    }
  }
}

source "virtualbox-iso" "ubuntu" {
  # Boot settings
  iso_url          = "https://releases.ubuntu.com/22.04/ubuntu-22.04.3-live-server-amd64.iso"
  iso_checksum     = "sha256:a4acfda10b18da50e2ec50ccaf860d7f20b389df8765611142305c0e911d16fd"
  
  # VM settings
  vm_name          = "ubuntu-22.04"
  guest_os_type    = "Ubuntu_64"
  cpus             = 2
  memory           = 2048
  disk_size        = 20480  # 20GB
  
  # SSH settings
  ssh_username     = "ubuntu"
  ssh_password     = "ubuntu"
  ssh_timeout      = "20m"
  
  # Boot command (autoinstall)
  boot_command = [
    "<esc><wait>",
    "<esc><wait>",
    "<enter><wait>",
    "/casper/vmlinuz ",
    "root=/dev/sr0 ",
    "initrd=/casper/initrd ",
    "autoinstall ",
    "ds=nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/",
    "<enter>"
  ]
  
  # HTTP directory for autoinstall files
  http_directory   = "http"
  
  # Shutdown command
  shutdown_command = "sudo shutdown -P now"
}

build {
  sources = ["source.virtualbox-iso.ubuntu"]
  
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y nginx",
      "sudo systemctl enable nginx"
    ]
  }
}
```

---

### Autoinstall Configuration

**`http/user-data`** (cloud-init):
```yaml
#cloud-config
autoinstall:
  version: 1
  locale: en_US.UTF-8
  keyboard:
    layout: us
  identity:
    hostname: ubuntu
    username: ubuntu
    password: "$6$rounds=4096$saltsalt$hashed..."  # Use: mkpasswd --method=SHA-512 --rounds=4096
  ssh:
    install-server: yes
    allow-pw: yes
  packages:
    - openssh-server
  late-commands:
    - echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /target/etc/sudoers.d/ubuntu
```

**`http/meta-data`**:
```yaml
instance-id: ubuntu-packer
```

---

### Build Image

```bash
# Initialize plugins
packer init ubuntu.pkr.hcl

# Validate template
packer validate ubuntu.pkr.hcl

# Build
packer build ubuntu.pkr.hcl

# Output:
# ==> virtualbox-iso.ubuntu: Creating VM...
# ==> virtualbox-iso.ubuntu: Starting VM...
# ==> virtualbox-iso.ubuntu: Waiting for SSH...
# ==> virtualbox-iso.ubuntu: Connected to SSH!
# ==> virtualbox-iso.ubuntu: Provisioning with shell script...
# ==> virtualbox-iso.ubuntu: Shutting down VM...
# Build 'virtualbox-iso.ubuntu' finished.
```

---

## 🔧 Provisioners

### Shell Provisioner

**Inline commands**:
```hcl
provisioner "shell" {
  inline = [
    "sudo apt-get update",
    "sudo apt-get install -y nginx git curl",
    "sudo systemctl enable nginx"
  ]
}
```

**External script**:
```hcl
provisioner "shell" {
  script = "scripts/setup.sh"
}
```

**`scripts/setup.sh`**:
```bash
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install packages
apt-get install -y \
  nginx \
  postgresql \
  redis-server \
  git \
  curl

# Configure services
systemctl enable nginx
systemctl enable postgresql
systemctl enable redis-server

# Cleanup
apt-get clean
rm -rf /var/lib/apt/lists/*
```

---

### File Provisioner

**Upload files**:
```hcl
provisioner "file" {
  source      = "files/app.conf"
  destination = "/tmp/app.conf"
}

provisioner "shell" {
  inline = [
    "sudo mv /tmp/app.conf /etc/nginx/sites-available/app.conf",
    "sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/",
    "sudo systemctl reload nginx"
  ]
}
```

**Upload directory**:
```hcl
provisioner "file" {
  source      = "files/website/"
  destination = "/tmp/website"
}
```

---

### Ansible Provisioner

```hcl
provisioner "ansible" {
  playbook_file = "ansible/playbook.yml"
  extra_arguments = [
    "--extra-vars", "env=production"
  ]
}
```

**`ansible/playbook.yml`**:
```yaml
---
- hosts: all
  become: yes
  tasks:
    - name: Install NGINX
      apt:
        name: nginx
        state: present
    
    - name: Start NGINX
      service:
        name: nginx
        state: started
        enabled: yes
```

---

### Cloud-Init Provisioner

```hcl
provisioner "shell" {
  inline = [
    "sudo cloud-init clean",
    "sudo rm -rf /var/lib/cloud/instances",
    "sudo rm -rf /var/log/cloud-init*"
  ]
}
```

---

## ☁️ Cloud Providers

### AWS AMI

```hcl
packer {
  required_plugins {
    amazon = {
      version = "~> 1.2"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  # AWS credentials (use environment variables or IAM role)
  region        = "us-east-1"
  
  # Source AMI
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]  # Canonical
  }
  
  # Instance settings
  instance_type = "t3.small"
  ssh_username  = "ubuntu"
  
  # AMI settings
  ami_name      = "my-app-{{timestamp}}"
  ami_description = "My application image"
  
  tags = {
    Name        = "my-app"
    Environment = "production"
  }
}

build {
  sources = ["source.amazon-ebs.ubuntu"]
  
  provisioner "shell" {
    script = "scripts/setup.sh"
  }
}
```

**Build**:
```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"

# Build
packer build aws.pkr.hcl

# Output: ami-0123456789abcdef
```

---

### Azure Image

```hcl
packer {
  required_plugins {
    azure = {
      version = "~> 2.0"
      source  = "github.com/hashicorp/azure"
    }
  }
}

source "azure-arm" "ubuntu" {
  # Azure credentials
  client_id       = var.azure_client_id
  client_secret   = var.azure_client_secret
  tenant_id       = var.azure_tenant_id
  subscription_id = var.azure_subscription_id
  
  # Image settings
  os_type         = "Linux"
  image_publisher = "Canonical"
  image_offer     = "0001-com-ubuntu-server-jammy"
  image_sku       = "22_04-lts"
  
  # Build settings
  location        = "East US"
  vm_size         = "Standard_B2s"
  
  # Output image
  managed_image_resource_group_name = "images-rg"
  managed_image_name               = "my-app-{{timestamp}}"
  
  azure_tags = {
    Environment = "production"
  }
}

build {
  sources = ["source.azure-arm.ubuntu"]
  
  provisioner "shell" {
    script = "scripts/setup.sh"
  }
}
```

---

### Proxmox Template

```hcl
packer {
  required_plugins {
    proxmox = {
      version = "~> 1.1"
      source  = "github.com/hashicorp/proxmox"
    }
  }
}

source "proxmox-iso" "ubuntu" {
  # Proxmox connection
  proxmox_url              = "https://proxmox.local:8006/api2/json"
  username                 = "root@pam"
  password                 = var.proxmox_password
  insecure_skip_tls_verify = true
  
  # Node and storage
  node                 = "pve"
  iso_file             = "local:iso/ubuntu-22.04.3-live-server-amd64.iso"
  iso_storage_pool     = "local"
  
  # VM settings
  vm_name              = "ubuntu-22.04-template"
  vm_id                = 9000
  cores                = 2
  memory               = 2048
  
  # Disk
  disks {
    type              = "scsi"
    disk_size         = "20G"
    storage_pool      = "local-lvm"
    storage_pool_type = "lvm"
  }
  
  # Network
  network_adapters {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  # SSH
  ssh_username = "ubuntu"
  ssh_password = "ubuntu"
  ssh_timeout  = "20m"
  
  # Boot command
  boot_command = [
    "<esc><wait>",
    "linux /casper/vmlinuz autoinstall ds=nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/ ---",
    "<enter><wait>",
    "initrd /casper/initrd<enter><wait>",
    "boot<enter>"
  ]
  
  http_directory = "http"
  
  # Create template
  template = true
}

build {
  sources = ["source.proxmox-iso.ubuntu"]
  
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y qemu-guest-agent cloud-init",
      "sudo systemctl enable qemu-guest-agent",
      "sudo cloud-init clean"
    ]
  }
}
```

---

## 🐳 Docker Images

### Simple Docker Image

```hcl
source "docker" "ubuntu" {
  image  = "ubuntu:22.04"
  commit = true
}

build {
  sources = ["source.docker.ubuntu"]
  
  provisioner "shell" {
    inline = [
      "apt-get update",
      "apt-get install -y nginx",
      "apt-get clean"
    ]
  }
  
  post-processor "docker-tag" {
    repository = "myapp"
    tags       = ["latest", "1.0.0"]
  }
}
```

**Build**:
```bash
packer build docker.pkr.hcl

# Output: Docker image myapp:latest
```

---

### Multi-Stage Docker Build

```hcl
source "docker" "builder" {
  image  = "node:18"
  commit = true
}

source "docker" "runtime" {
  image  = "node:18-alpine"
  commit = true
}

build {
  name = "build-stage"
  sources = ["source.docker.builder"]
  
  provisioner "file" {
    source      = "package.json"
    destination = "/app/package.json"
  }
  
  provisioner "shell" {
    inline = [
      "cd /app",
      "npm install"
    ]
  }
}

build {
  name = "runtime-stage"
  sources = ["source.docker.runtime"]
  
  provisioner "shell" {
    inline = [
      "apk add --no-cache tini"
    ]
  }
  
  post-processor "docker-tag" {
    repository = "myapp"
    tags       = ["latest"]
  }
}
```

---

## 🔄 Variables

### Input Variables

```hcl
variable "version" {
  type    = string
  default = "1.0.0"
}

variable "environment" {
  type = string
}

variable "region" {
  type    = string
  default = "us-east-1"
}
```

**Use in template**:
```hcl
source "amazon-ebs" "app" {
  region   = var.region
  ami_name = "my-app-${var.version}-${var.environment}"
  
  tags = {
    Version     = var.version
    Environment = var.environment
  }
}
```

---

### Variable Files

**`variables.pkrvars.hcl`**:
```hcl
version     = "2.1.0"
environment = "production"
region      = "us-west-2"
```

**Build with variables**:
```bash
packer build -var-file=variables.pkrvars.hcl template.pkr.hcl
```

**Command-line variables**:
```bash
packer build \
  -var 'version=2.1.0' \
  -var 'environment=staging' \
  template.pkr.hcl
```

---

### Local Variables

```hcl
locals {
  timestamp = formatdate("YYYY-MM-DD-hhmm", timestamp())
  image_name = "my-app-${var.version}-${local.timestamp}"
}

source "amazon-ebs" "app" {
  ami_name = local.image_name
}
```

---

## 🎯 Complete Example

### Web Application Image

**Directory structure**:
```
packer/
├── web-app.pkr.hcl
├── variables.pkr.hcl
├── scripts/
│   ├── setup.sh
│   └── cleanup.sh
├── files/
│   ├── nginx.conf
│   └── app.service
└── http/
    ├── user-data
    └── meta-data
```

---

**`web-app.pkr.hcl`**:
```hcl
packer {
  required_plugins {
    proxmox = {
      version = "~> 1.1"
      source  = "github.com/hashicorp/proxmox"
    }
  }
}

variable "proxmox_url" {
  type = string
}

variable "proxmox_token_id" {
  type = string
}

variable "proxmox_token_secret" {
  type      = string
  sensitive = true
}

variable "app_version" {
  type    = string
  default = "1.0.0"
}

locals {
  timestamp = formatdate("YYYY-MM-DD-hhmm", timestamp())
}

source "proxmox-iso" "web-app" {
  proxmox_url              = var.proxmox_url
  token                    = "${var.proxmox_token_id}!${var.proxmox_token_secret}"
  insecure_skip_tls_verify = true
  
  node             = "pve"
  iso_file         = "local:iso/ubuntu-22.04.3-live-server-amd64.iso"
  iso_storage_pool = "local"
  
  vm_name = "web-app-${var.app_version}"
  vm_id   = 9100
  cores   = 2
  memory  = 4096
  
  disks {
    type              = "scsi"
    disk_size         = "20G"
    storage_pool      = "local-lvm"
    storage_pool_type = "lvm"
  }
  
  network_adapters {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ssh_username = "ubuntu"
  ssh_password = "ubuntu"
  ssh_timeout  = "20m"
  
  boot_command = [
    "<esc><wait>",
    "linux /casper/vmlinuz autoinstall ds=nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/ ---",
    "<enter><wait>",
    "initrd /casper/initrd<enter><wait>",
    "boot<enter>"
  ]
  
  http_directory = "http"
  template       = true
}

build {
  sources = ["source.proxmox-iso.web-app"]
  
  # Copy configuration files
  provisioner "file" {
    source      = "files/nginx.conf"
    destination = "/tmp/nginx.conf"
  }
  
  provisioner "file" {
    source      = "files/app.service"
    destination = "/tmp/app.service"
  }
  
  # Install and configure
  provisioner "shell" {
    script = "scripts/setup.sh"
    environment_vars = [
      "APP_VERSION=${var.app_version}"
    ]
  }
  
  # Cleanup
  provisioner "shell" {
    script = "scripts/cleanup.sh"
  }
  
  # Generate manifest
  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}
```

---

**`scripts/setup.sh`**:
```bash
#!/bin/bash
set -e

echo "==> Installing packages..."
apt-get update
apt-get upgrade -y
apt-get install -y \
  nginx \
  nodejs \
  npm \
  postgresql-client \
  redis-tools \
  git \
  curl \
  htop

echo "==> Configuring NGINX..."
mv /tmp/nginx.conf /etc/nginx/sites-available/app
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "==> Setting up application..."
useradd -r -s /bin/bash -d /opt/app app
mkdir -p /opt/app
chown app:app /opt/app

echo "==> Installing systemd service..."
mv /tmp/app.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable app

echo "==> Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Image version: $APP_VERSION"
echo "$APP_VERSION" > /etc/app-version
```

---

**`scripts/cleanup.sh`**:
```bash
#!/bin/bash
set -e

echo "==> Cleaning up..."

# Remove SSH host keys (regenerated on first boot)
rm -f /etc/ssh/ssh_host_*

# Clean cloud-init
cloud-init clean --logs --seed

# Clean package cache
apt-get clean
rm -rf /var/lib/apt/lists/*

# Clear logs
find /var/log -type f -exec truncate -s 0 {} \;

# Clear bash history
history -c
rm -f /home/ubuntu/.bash_history
rm -f /root/.bash_history

echo "==> Cleanup complete"
```

---

**Build**:
```bash
# Create variables file
cat > variables.pkrvars.hcl <<EOF
proxmox_url          = "https://proxmox.local:8006/api2/json"
proxmox_token_id     = "packer@pve!packer-token"
proxmox_token_secret = "your-secret-here"
app_version          = "2.1.0"
EOF

# Build
packer build -var-file=variables.pkrvars.hcl web-app.pkr.hcl
```

---

## 🚀 CI/CD Integration

### GitHub Actions

**`.github/workflows/build-image.yml`**:
```yaml
name: Build VM Image

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Packer
      uses: hashicorp/setup-packer@main
      with:
        version: 'latest'
    
    - name: Initialize Packer
      run: packer init .
    
    - name: Validate Template
      run: packer validate .
    
    - name: Build Image
      env:
        PROXMOX_URL: ${{ secrets.PROXMOX_URL }}
        PROXMOX_TOKEN_ID: ${{ secrets.PROXMOX_TOKEN_ID }}
        PROXMOX_TOKEN_SECRET: ${{ secrets.PROXMOX_TOKEN_SECRET }}
      run: |
        packer build \
          -var "proxmox_url=$PROXMOX_URL" \
          -var "proxmox_token_id=$PROXMOX_TOKEN_ID" \
          -var "proxmox_token_secret=$PROXMOX_TOKEN_SECRET" \
          -var "app_version=${GITHUB_REF#refs/tags/v}" \
          web-app.pkr.hcl
    
    - name: Upload Manifest
      uses: actions/upload-artifact@v3
      with:
        name: manifest
        path: manifest.json
```

---

## 🔗 Terraform Integration

### Use Packer Image in Terraform

**After building with Packer**:
```hcl
# Terraform configuration
data "proxmox_vm_qemu" "template" {
  name = "web-app-2.1.0"
  node = "pve"
}

resource "proxmox_vm_qemu" "web" {
  count = 3
  
  name        = "web-${count.index + 1}"
  target_node = "pve"
  clone       = data.proxmox_vm_qemu.template.name
  
  cores  = 2
  memory = 4096
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  disk {
    size    = 20
    storage = "local-lvm"
  }
  
  ipconfig0 = "ip=10.0.1.${count.index + 10}/24,gw=10.0.1.1"
}
```

---

## 💡 Best Practices

### 1. Use Version Tags

```hcl
ami_name = "my-app-${var.version}-{{timestamp}}"
```

**Always include timestamp** for uniqueness.

---

### 2. Clean Up Secrets

```bash
# scripts/cleanup.sh
rm -f /root/.ssh/authorized_keys
rm -f /home/ubuntu/.ssh/authorized_keys
rm -f /etc/ssh/ssh_host_*
```

---

### 3. Test Images

```bash
# After building, test the image
terraform apply -auto-approve
ssh ubuntu@<new-vm-ip>
# Verify application works
terraform destroy -auto-approve
```

---

### 4. Use Parallel Builds

```hcl
build {
  sources = [
    "source.amazon-ebs.us-east",
    "source.amazon-ebs.us-west",
    "source.azure-arm.eastus"
  ]
  # Builds all sources in parallel
}
```

---

### 5. Validate Before Build

```bash
# Always validate
packer validate template.pkr.hcl

# Format code
packer fmt template.pkr.hcl
```

---

## 🔗 What's Next?

**Immutable Infrastructure**:
- **[immutable-infrastructure](immutable-infrastructure)** - Replace, don't modify

**GitOps**:
- **[gitops-principles](gitops-principles)** - Git as source of truth

**Terraform**:
- **[terraform-basics](terraform-basics)** - Use Packer images

---

## 📚 Resources

**Packer**:
- [Official Documentation](https://www.packer.io/docs)
- [HCL Templates](https://www.packer.io/guides/hcl)
- [Builders](https://www.packer.io/docs/builders)
- [Provisioners](https://www.packer.io/docs/provisioners)

**Tutorials**:
- [AWS AMI](https://learn.hashicorp.com/tutorials/packer/aws-get-started)
- [Azure Image](https://learn.hashicorp.com/tutorials/packer/azure-get-started)

---

## 📝 Change Log

### 2026-01-30
- Created Packer guide
- Explained automation concepts
- Covered template syntax
- Demonstrated provisioners
- Multi-cloud examples
- Docker image building
- Complete web app example
- CI/CD integration
- Terraform integration
- Best practices

---

**Next Article**: [immutable-infrastructure](immutable-infrastructure) - Immutable patterns!
