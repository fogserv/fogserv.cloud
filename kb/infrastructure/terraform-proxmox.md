# Terraform Proxmox Provider - Self-Hosted Infrastructure

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Infrastructure as Code  
**Prerequisites**: [terraform-basics](terraform-basics), [terraform-providers](terraform-providers)  
**Time**: 3-4 hours  
**Tags**: terraform, proxmox, virtualization, self-hosted, homelab

## Summary

Provision and manage Proxmox VMs with Terraform for self-hosted infrastructure. Learn VM templates, cloud-init configuration, resource management, and complete infrastructure automation on Proxmox VE without cloud provider costs.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Configure Proxmox provider
- ✅ Create VM templates
- ✅ Provision VMs with Terraform
- ✅ Use cloud-init for configuration
- ✅ Manage storage and networking
- ✅ Build complete infrastructure
- ✅ Automate Proxmox deployments

## 🖥️ Proxmox Overview

### What is Proxmox?

**Proxmox VE** (Virtual Environment):
- 🖥️ Open-source virtualization platform
- 🐧 Based on Debian Linux
- 🔄 KVM (VMs) + LXC (containers)
- 🌐 Web UI for management
- 💰 Free (subscription optional)

**Use cases**:
- 🏠 Homelabs
- 🏢 SMB infrastructure
- 🧪 Development environments
- 🎓 Learning platform

---

## 🔧 Prerequisites

### Proxmox Setup

**Install Proxmox VE** (on bare metal):
```bash
# Download from https://www.proxmox.com/en/downloads
# Install ISO, follow wizard
```

**Post-install**:
```bash
# Update system
apt update && apt full-upgrade -y

# Remove enterprise repo (if no subscription)
rm /etc/apt/sources.list.d/pve-enterprise.list

# Add no-subscription repo
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list

apt update
```

---

### Create Terraform User

**On Proxmox host**:
```bash
# Create user
pveum user add terraform@pve

# Create role
pveum role add TerraformRole -privs "Datastore.AllocateSpace Datastore.Audit Pool.Allocate Sys.Audit Sys.Console Sys.Modify VM.Allocate VM.Audit VM.Clone VM.Config.CDROM VM.Config.Cloudinit VM.Config.CPU VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Migrate VM.Monitor VM.PowerMgmt SDN.Use"

# Assign role to user
pveum aclmod / -user terraform@pve -role TerraformRole

# Set password
pveum passwd terraform@pve
# Enter password when prompted
```

---

### API Token (Recommended)

**Create API token**:
```bash
# Create token
pveum user token add terraform@pve mytoken --privsep=0

# Output:
# ┌──────────────┬──────────────────────────────────────┐
# │ key          │ value                                │
# ╞══════════════╪══════════════════════════════════════╡
# │ full-tokenid │ terraform@pve!mytoken                │
# ├──────────────┼──────────────────────────────────────┤
# │ info         │ {"privsep":"0"}                      │
# ├──────────────┼──────────────────────────────────────┤
# │ value        │ 12345678-1234-1234-1234-123456789abc │
# └──────────────┴──────────────────────────────────────┘

# Save this token! Can't retrieve later
```

---

## 🔌 Terraform Provider Configuration

### Provider Setup

**versions.tf**:
```hcl
terraform {
  required_version = ">= 1.7.0"
  
  required_providers {
    proxmox = {
      source  = "telmate/proxmox"
      version = "~> 2.9"
    }
  }
}

provider "proxmox" {
  pm_api_url = "https://proxmox.local:8006/api2/json"
  
  # Option 1: API Token (recommended)
  pm_api_token_id     = "terraform@pve!mytoken"
  pm_api_token_secret = var.proxmox_token
  
  # Option 2: Username/password
  # pm_user     = "terraform@pve"
  # pm_password = var.proxmox_password
  
  # Skip TLS verification (self-signed cert)
  pm_tls_insecure = true
  
  # Logging
  pm_log_enable = true
  pm_log_file   = "terraform-plugin-proxmox.log"
  pm_log_levels = {
    _default    = "debug"
    _capturelog = ""
  }
}
```

**variables.tf**:
```hcl
variable "proxmox_token" {
  description = "Proxmox API token secret"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
```

**terraform.tfvars**:
```hcl
proxmox_token = "12345678-1234-1234-1234-123456789abc"
```

**Initialize**:
```bash
terraform init
```

---

## 📦 Creating VM Template

### Ubuntu Cloud Image Template

**Manual steps** (on Proxmox host):
```bash
# Download Ubuntu cloud image
cd /var/lib/vz/template/iso
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img

# Create VM (ID 9000 for template)
qm create 9000 \
  --name ubuntu-2204-template \
  --memory 2048 \
  --cores 2 \
  --net0 virtio,bridge=vmbr0

# Import disk
qm importdisk 9000 jammy-server-cloudimg-amd64.img local-lvm

# Attach disk
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0

# Add cloud-init drive
qm set 9000 --ide2 local-lvm:cloudinit

# Boot from disk
qm set 9000 --boot c --bootdisk scsi0

# Add serial console
qm set 9000 --serial0 socket --vga serial0

# Enable agent
qm set 9000 --agent enabled=1

# Convert to template
qm template 9000
```

---

### Automate Template Creation

**Ansible playbook** - `create-template.yml`:
```yaml
---
- name: Create Proxmox VM template
  hosts: proxmox
  become: yes
  
  vars:
    template_id: 9000
    template_name: ubuntu-2204-template
    image_url: "https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
    storage: local-lvm
  
  tasks:
    - name: Download cloud image
      get_url:
        url: "{{ image_url }}"
        dest: "/var/lib/vz/template/iso/ubuntu-2204.img"
    
    - name: Create VM
      command: >
        qm create {{ template_id }}
        --name {{ template_name }}
        --memory 2048
        --cores 2
        --net0 virtio,bridge=vmbr0
      args:
        creates: "/etc/pve/qemu-server/{{ template_id }}.conf"
    
    - name: Import disk
      command: >
        qm importdisk {{ template_id }}
        /var/lib/vz/template/iso/ubuntu-2204.img
        {{ storage }}
      args:
        creates: "/dev/pve/vm-{{ template_id }}-disk-0"
    
    - name: Configure VM
      command: "{{ item }}"
      loop:
        - "qm set {{ template_id }} --scsihw virtio-scsi-pci --scsi0 {{ storage }}:vm-{{ template_id }}-disk-0"
        - "qm set {{ template_id }} --ide2 {{ storage }}:cloudinit"
        - "qm set {{ template_id }} --boot c --bootdisk scsi0"
        - "qm set {{ template_id }} --serial0 socket --vga serial0"
        - "qm set {{ template_id }} --agent enabled=1"
    
    - name: Convert to template
      command: "qm template {{ template_id }}"
```

---

## 🚀 Provisioning VMs

### Basic VM

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "web" {
  name        = "web-server"
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  # VM resources
  cores   = 2
  sockets = 1
  memory  = 4096
  
  # Network
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  # Disk
  disk {
    slot    = 0
    size    = "20G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  # Cloud-init
  os_type      = "cloud-init"
  ipconfig0    = "ip=10.0.1.10/24,gw=10.0.1.1"
  nameserver   = "8.8.8.8"
  searchdomain = "local"
  
  # SSH key
  sshkeys = file("~/.ssh/id_rsa.pub")
  
  # QEMU agent
  agent = 1
  
  # Tags
  tags = "terraform,web,production"
}
```

**Deploy**:
```bash
terraform plan
terraform apply

# Get IP
terraform output
```

---

### Multiple VMs with Count

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "web" {
  count = 3
  
  name        = "web-${count.index + 1}"
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  cores  = 2
  memory = 4096
  
  disk {
    slot    = 0
    size    = "30G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.${10 + count.index}/24,gw=10.0.1.1"
  sshkeys   = file("~/.ssh/id_rsa.pub")
  
  tags = "terraform,web,cluster"
}
```

**Creates**: `web-1`, `web-2`, `web-3`

---

### Dynamic Sizing with For_Each

**variables.tf**:
```hcl
variable "vms" {
  description = "VM definitions"
  type = map(object({
    cores  = number
    memory = number
    disk   = string
    ip     = string
  }))
  
  default = {
    web = {
      cores  = 2
      memory = 4096
      disk   = "30G"
      ip     = "10.0.1.10"
    }
    db = {
      cores  = 4
      memory = 8192
      disk   = "100G"
      ip     = "10.0.1.20"
    }
    cache = {
      cores  = 2
      memory = 2048
      disk   = "20G"
      ip     = "10.0.1.30"
    }
  }
}
```

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "vm" {
  for_each = var.vms
  
  name        = each.key
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  cores  = each.value.cores
  memory = each.value.memory
  
  disk {
    slot    = 0
    size    = each.value.disk
    type    = "scsi"
    storage = "local-lvm"
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=${each.value.ip}/24,gw=10.0.1.1"
  sshkeys   = file("~/.ssh/id_rsa.pub")
  
  tags = "terraform,${each.key}"
}
```

---

## ☁️ Cloud-Init Configuration

### User Data

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "web" {
  name        = "web-server"
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  # ... other config
  
  # Cloud-init IP config
  ipconfig0 = "ip=10.0.1.10/24,gw=10.0.1.1"
  
  # Cloud-init user
  ciuser     = "ubuntu"
  cipassword = "changeme"  # Use vault!
  
  # SSH keys
  sshkeys = <<-EOF
    ${file("~/.ssh/id_rsa.pub")}
    ${file("~/.ssh/deploy_key.pub")}
  EOF
  
  # Custom cloud-init
  cicustom = "user=local:snippets/user-data.yml"
}
```

---

### Custom Cloud-Init Script

**Create snippet on Proxmox** (`/var/lib/vz/snippets/user-data.yml`):
```yaml
#cloud-config
hostname: web-server
fqdn: web-server.local

users:
  - name: ubuntu
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1...

packages:
  - nginx
  - git
  - curl

runcmd:
  - systemctl start nginx
  - systemctl enable nginx
  - echo "Hello from Terraform!" > /var/www/html/index.html

write_files:
  - path: /etc/nginx/sites-available/app
    content: |
      server {
        listen 80;
        server_name _;
        root /var/www/html;
        index index.html;
      }

final_message: "System ready after $UPTIME seconds"
```

**Use in Terraform**:
```hcl
resource "proxmox_vm_qemu" "web" {
  # ... config
  
  cicustom = "user=local:snippets/user-data.yml"
}
```

---

## 💾 Storage Management

### Multiple Disks

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "db" {
  name        = "database"
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  cores  = 4
  memory = 8192
  
  # OS disk
  disk {
    slot    = 0
    size    = "50G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  # Data disk
  disk {
    slot    = 1
    size    = "200G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  # Log disk
  disk {
    slot    = 2
    size    = "100G"
    type    = "scsi"
    storage = "local-lvm"
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.20/24,gw=10.0.1.1"
  sshkeys   = file("~/.ssh/id_rsa.pub")
}
```

---

### Different Storage Types

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "app" {
  name        = "app-server"
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  # Fast SSD for OS
  disk {
    slot    = 0
    size    = "30G"
    type    = "scsi"
    storage = "local-lvm"  # SSD
    ssd     = 1
    discard = "on"
  }
  
  # Slower storage for data
  disk {
    slot    = 1
    size    = "500G"
    type    = "scsi"
    storage = "slow-storage"  # HDD array
  }
  
  # ... rest of config
}
```

---

## 🌐 Networking

### Multiple Network Interfaces

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "router" {
  name        = "router"
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  # WAN interface
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  # LAN interface
  network {
    model  = "virtio"
    bridge = "vmbr1"
  }
  
  # DMZ interface
  network {
    model  = "virtio"
    bridge = "vmbr2"
  }
  
  # IP config for first interface
  ipconfig0 = "ip=dhcp"
  
  # Static IPs for other interfaces
  ipconfig1 = "ip=192.168.1.1/24"
  ipconfig2 = "ip=10.10.10.1/24"
  
  # ... rest of config
}
```

---

### VLAN Configuration

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "vlan_vm" {
  name        = "vlan-test"
  target_node = "pve"
  clone       = "ubuntu-2204-template"
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
    tag    = 100  # VLAN tag
  }
  
  ipconfig0 = "ip=10.100.1.10/24,gw=10.100.1.1"
  
  # ... rest of config
}
```

---

## 🏗️ Complete Infrastructure

### 3-Tier Application

**main.tf**:
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
  pm_api_url          = var.proxmox_api_url
  pm_api_token_id     = var.proxmox_token_id
  pm_api_token_secret = var.proxmox_token_secret
  pm_tls_insecure     = true
}

# Load Balancer
resource "proxmox_vm_qemu" "lb" {
  name        = "loadbalancer"
  target_node = var.proxmox_node
  clone       = var.template_name
  
  cores  = 2
  memory = 2048
  
  disk {
    slot    = 0
    size    = "20G"
    type    = "scsi"
    storage = var.storage
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.5/24,gw=10.0.1.1"
  sshkeys   = file(var.ssh_public_key)
  
  tags = "terraform,loadbalancer,production"
}

# Web Servers
resource "proxmox_vm_qemu" "web" {
  count = 3
  
  name        = "web-${count.index + 1}"
  target_node = var.proxmox_node
  clone       = var.template_name
  
  cores  = 2
  memory = 4096
  
  disk {
    slot    = 0
    size    = "30G"
    type    = "scsi"
    storage = var.storage
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.${10 + count.index}/24,gw=10.0.1.1"
  sshkeys   = file(var.ssh_public_key)
  
  tags = "terraform,web,production"
}

# Application Servers
resource "proxmox_vm_qemu" "app" {
  count = 2
  
  name        = "app-${count.index + 1}"
  target_node = var.proxmox_node
  clone       = var.template_name
  
  cores  = 4
  memory = 8192
  
  disk {
    slot    = 0
    size    = "50G"
    type    = "scsi"
    storage = var.storage
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.${20 + count.index}/24,gw=10.0.1.1"
  sshkeys   = file(var.ssh_public_key)
  
  tags = "terraform,app,production"
}

# Database Server
resource "proxmox_vm_qemu" "db" {
  name        = "database"
  target_node = var.proxmox_node
  clone       = var.template_name
  
  cores  = 4
  memory = 16384
  
  # OS disk
  disk {
    slot    = 0
    size    = "50G"
    type    = "scsi"
    storage = var.storage
  }
  
  # Data disk
  disk {
    slot    = 1
    size    = "200G"
    type    = "scsi"
    storage = var.storage
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.30/24,gw=10.0.1.1"
  sshkeys   = file(var.ssh_public_key)
  
  tags = "terraform,database,production"
}

# Cache Server
resource "proxmox_vm_qemu" "cache" {
  name        = "redis"
  target_node = var.proxmox_node
  clone       = var.template_name
  
  cores  = 2
  memory = 4096
  
  disk {
    slot    = 0
    size    = "20G"
    type    = "scsi"
    storage = var.storage
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  ipconfig0 = "ip=10.0.1.40/24,gw=10.0.1.1"
  sshkeys   = file(var.ssh_public_key)
  
  tags = "terraform,cache,production"
}
```

**variables.tf**:
```hcl
variable "proxmox_api_url" {
  description = "Proxmox API URL"
  type        = string
  default     = "https://proxmox.local:8006/api2/json"
}

variable "proxmox_token_id" {
  description = "Proxmox API token ID"
  type        = string
}

variable "proxmox_token_secret" {
  description = "Proxmox API token secret"
  type        = string
  sensitive   = true
}

variable "proxmox_node" {
  description = "Proxmox node name"
  type        = string
  default     = "pve"
}

variable "template_name" {
  description = "VM template to clone"
  type        = string
  default     = "ubuntu-2204-template"
}

variable "storage" {
  description = "Storage location"
  type        = string
  default     = "local-lvm"
}

variable "ssh_public_key" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
```

**outputs.tf**:
```hcl
output "loadbalancer_ip" {
  value = proxmox_vm_qemu.lb.default_ipv4_address
}

output "web_ips" {
  value = [for vm in proxmox_vm_qemu.web : vm.default_ipv4_address]
}

output "app_ips" {
  value = [for vm in proxmox_vm_qemu.app : vm.default_ipv4_address]
}

output "database_ip" {
  value = proxmox_vm_qemu.db.default_ipv4_address
}

output "cache_ip" {
  value = proxmox_vm_qemu.cache.default_ipv4_address
}
```

**Deploy**:
```bash
terraform init
terraform plan
terraform apply

# Get IPs
terraform output
```

---

## 🔧 Advanced Features

### Boot Order

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "vm" {
  # ... config
  
  boot       = "order=scsi0;ide2;net0"
  bootdisk   = "scsi0"
  onboot     = true  # Start on Proxmox boot
  
  # ... rest
}
```

---

### CPU Type

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "vm" {
  # ... config
  
  cpu    = "host"  # or "kvm64", "Haswell", etc.
  numa   = true
  hotplug = "network,disk,usb"
  
  # ... rest
}
```

---

### Resource Limits

**main.tf**:
```hcl
resource "proxmox_vm_qemu" "vm" {
  # ... config
  
  # CPU limit (percentage)
  cpulimit = 2  # 200% = 2 cores max
  
  # CPU units (relative weight)
  cpuunits = 1024  # Default
  
  # ... rest
}
```

---

## 💡 Best Practices

### 1. Use Templates

```bash
# Create once, clone many times
qm template 9000

# In Terraform
resource "proxmox_vm_qemu" "vm" {
  clone = "ubuntu-2204-template"  # Fast cloning
}
```

---

### 2. Tag Resources

```hcl
resource "proxmox_vm_qemu" "vm" {
  tags = "terraform,production,web"
}
```

**View in Proxmox UI** - filterable by tags.

---

### 3. Use Variables for IPs

```hcl
variable "vm_ips" {
  default = {
    web = "10.0.1.10"
    db  = "10.0.1.20"
  }
}

resource "proxmox_vm_qemu" "web" {
  ipconfig0 = "ip=${var.vm_ips.web}/24,gw=10.0.1.1"
}
```

---

### 4. Protect Production VMs

```hcl
resource "proxmox_vm_qemu" "db" {
  # ... config
  
  lifecycle {
    prevent_destroy = true
  }
}
```

---

### 5. Wait for Cloud-Init

```hcl
resource "proxmox_vm_qemu" "vm" {
  # ... config
  
  # Wait for QEMU agent
  agent = 1
  
  # Terraform waits for VM ready
}
```

---

## 🔍 Troubleshooting

### VM Won't Start

**Check Proxmox logs**:
```bash
journalctl -u pveproxy -f
```

**Check VM config**:
```bash
cat /etc/pve/qemu-server/<vmid>.conf
```

---

### Cloud-Init Not Working

**Check cloud-init status** (inside VM):
```bash
sudo cloud-init status
sudo cloud-init analyze show
sudo cat /var/log/cloud-init.log
```

**Verify drive attached**:
```bash
# On Proxmox
qm config <vmid> | grep ide2
# Should show: ide2: local-lvm:vm-<vmid>-cloudinit
```

---

### IP Not Assigned

**Check network config** (inside VM):
```bash
ip addr show
sudo cat /etc/netplan/50-cloud-init.yaml
```

**Reapply cloud-init**:
```bash
sudo cloud-init clean
sudo cloud-init init
sudo reboot
```

---

## 🔗 What's Next?

**Cloud-Init**:
- **[cloud-init-basics](cloud-init-basics)** - VM initialization

**Packer**:
- **[packer-introduction](packer-introduction)** - Automated template building

**Immutable Infrastructure**:
- **[immutable-infrastructure](immutable-infrastructure)** - VM replacement patterns

---

## 📚 Resources

**Proxmox**:
- [Proxmox VE Documentation](https://pve.proxmox.com/wiki/Main_Page)
- [Cloud-Init Support](https://pve.proxmox.com/wiki/Cloud-Init_Support)

**Terraform Provider**:
- [Telmate Proxmox Provider](https://registry.terraform.io/providers/Telmate/proxmox/latest/docs)
- [GitHub Repository](https://github.com/Telmate/terraform-provider-proxmox)

---

## 📝 Change Log

### 2026-01-30
- Created Proxmox provider guide
- Explained Proxmox setup
- Covered template creation
- Demonstrated VM provisioning
- Showed cloud-init configuration
- Covered storage and networking
- Complete infrastructure example
- Added troubleshooting

---

**Next Article**: [cloud-init-basics](cloud-init-basics) - Automated VM configuration!
