# Cloud-Init Basics - Automated VM Configuration

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Configuration Management  
**Prerequisites**: [linux-fundamentals](../basics/linux-fundamentals), [terraform-proxmox](terraform-proxmox)  
**Time**: 2-3 hours  
**Tags**: cloud-init, automation, vm-configuration, initialization

## Summary

Automate VM initialization with cloud-init for consistent, repeatable deployments. Learn user-data configuration, network setup, package installation, and script execution for cloud and self-hosted environments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand cloud-init concepts
- ✅ Write user-data configurations
- ✅ Configure users and SSH keys
- ✅ Install packages automatically
- ✅ Run initialization scripts
- ✅ Configure networking
- ✅ Debug cloud-init issues

## ☁️ What is Cloud-Init?

### The Problem

**Manual VM setup**:
```bash
# Every new VM requires:
1. SSH in with default credentials
2. Change password
3. Create users
4. Add SSH keys
5. Update packages
6. Install software
7. Configure networking
8. Run setup scripts
# ... 30 minutes per VM
```

**Issues**:
- ⏱️ Time-consuming
- ❌ Error-prone
- 🔄 Not repeatable
- 📝 No documentation
- 🏗️ Can't automate

---

### The Solution: Cloud-Init

**Cloud-init** automates VM initialization:
- 👤 User creation
- 🔑 SSH key deployment
- 📦 Package installation
- 🌐 Network configuration
- 📝 File creation
- 🔧 Script execution

**One config file** → **Ready-to-use VM**

---

### How It Works

```
VM Boots
   ↓
Cloud-Init Runs (first boot only)
   ↓
1. Read data source (cloud provider, file, NoCloud)
2. Parse user-data configuration
3. Execute modules (users, packages, scripts)
4. Mark as complete (/var/lib/cloud/instance)
   ↓
VM Ready
```

---

### Supported Platforms

- ☁️ AWS, Azure, GCP
- 🖥️ Proxmox, VMware
- 📦 OpenStack
- 🐳 LXD containers
- 💿 NoCloud (ISO/file)

---

## 📄 User-Data Format

### YAML Format

**Most common** - `user-data.yml`:
```yaml
#cloud-config

# Users
users:
  - name: admin
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...

# Packages
packages:
  - nginx
  - git

# Commands
runcmd:
  - systemctl start nginx
  - echo "Hello World" > /var/www/html/index.html
```

**First line must be**: `#cloud-config`

---

### Script Format

**Shell script** - `user-data.sh`:
```bash
#!/bin/bash

# This runs as root
apt-get update
apt-get install -y nginx
echo "Hello from script" > /var/www/html/index.html
systemctl start nginx
```

**First line must be**: `#!/bin/bash` (or other shebang)

---

### MIME Multi-Part

**Combine multiple formats**:
```
Content-Type: multipart/mixed; boundary="BOUNDARY"
MIME-Version: 1.0

--BOUNDARY
Content-Type: text/cloud-config; charset="us-ascii"

#cloud-config
packages:
  - nginx

--BOUNDARY
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
echo "Custom script"

--BOUNDARY--
```

---

## 👤 User Management

### Create Users

**Single user**:
```yaml
#cloud-config

users:
  - name: john
    gecos: John Doe
    groups: sudo, docker
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...
```

---

### Multiple Users

```yaml
#cloud-config

users:
  - name: admin
    gecos: Administrator
    groups: sudo
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...
  
  - name: deploy
    gecos: Deployment User
    groups: docker
    shell: /bin/bash
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...
  
  - name: readonly
    gecos: Read Only User
    groups: users
    shell: /bin/bash
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...
```

---

### User Options

```yaml
users:
  - name: myuser
    gecos: "Full Name,Room,Work Phone,Home Phone"  # User info
    groups: sudo, docker, users                    # Groups
    shell: /bin/bash                               # Shell
    sudo: ALL=(ALL) NOPASSWD:ALL                   # Sudo access
    lock_passwd: true                              # Disable password login
    passwd: "$6$rounds=4096$..."                   # Hashed password
    ssh_authorized_keys:                           # SSH keys
      - ssh-rsa AAAAB3...
      - ssh-ed25519 AAAAC3...
    ssh_import_id:                                 # Import from GitHub
      - gh:username
```

---

### Disable Default User

```yaml
#cloud-config

# Disable ubuntu/debian/centos default user
users:
  - name: admin
    # ... config
    
# Remove default user
system_info:
  default_user:
    name: none
```

---

## 🔑 SSH Keys

### Add Keys

```yaml
#cloud-config

ssh_authorized_keys:
  - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB...== user@laptop
  - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...== deploy@server
```

---

### Import from GitHub

```yaml
#cloud-config

users:
  - name: admin
    ssh_import_id:
      - gh:yourusername
```

**Fetches** all public keys from `https://github.com/yourusername.keys`

---

### Disable Password Auth

```yaml
#cloud-config

ssh_pwauth: false  # Disable password authentication

users:
  - name: admin
    lock_passwd: true  # No password login
    ssh_authorized_keys:
      - ssh-rsa AAAAB3...
```

---

## 📦 Package Management

### Install Packages

```yaml
#cloud-config

# Update package cache
package_update: true

# Upgrade installed packages
package_upgrade: true

# Install packages
packages:
  - nginx
  - postgresql
  - redis-server
  - git
  - curl
  - vim
  - htop
```

---

### Add Repositories

**APT (Ubuntu/Debian)**:
```yaml
#cloud-config

apt:
  sources:
    docker:
      source: "deb [arch=amd64] https://download.docker.com/linux/ubuntu $RELEASE stable"
      keyid: 9DC858229FC7DD38854AE2D88D81803C0EBFCD88
      
packages:
  - docker-ce
  - docker-ce-cli
  - containerd.io
```

**YUM (RHEL/CentOS)**:
```yaml
#cloud-config

yum_repos:
  docker-ce-stable:
    name: Docker CE Stable
    baseurl: https://download.docker.com/linux/centos/7/x86_64/stable
    enabled: true
    gpgcheck: true
    gpgkey: https://download.docker.com/linux/centos/gpg

packages:
  - docker-ce
```

---

## 🔧 Running Commands

### runcmd

**Executed after packages installed**:
```yaml
#cloud-config

runcmd:
  - echo "Starting setup..."
  - systemctl enable nginx
  - systemctl start nginx
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
  - echo "Setup complete"
```

**Array format**:
```yaml
runcmd:
  - [systemctl, enable, nginx]
  - [systemctl, start, nginx]
```

---

### bootcmd

**Runs every boot** (not just first):
```yaml
#cloud-config

bootcmd:
  - echo "Booting at $(date)" >> /var/log/boot.log
  - ntpdate -s time.nist.gov
```

---

### Execute Script from URL

```yaml
#cloud-config

runcmd:
  - curl -sSL https://example.com/setup.sh | bash
  - wget -O /tmp/install.sh https://example.com/install.sh
  - bash /tmp/install.sh
```

---

## 📝 Writing Files

### Create Files

```yaml
#cloud-config

write_files:
  - path: /etc/nginx/sites-available/myapp
    content: |
      server {
        listen 80;
        server_name myapp.local;
        root /var/www/myapp;
        index index.html;
      }
    owner: root:root
    permissions: '0644'
  
  - path: /var/www/myapp/index.html
    content: |
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Hello from Cloud-Init!</h1>
      </body>
      </html>
    owner: www-data:www-data
    permissions: '0644'
  
  - path: /usr/local/bin/backup.sh
    content: |
      #!/bin/bash
      tar -czf /backup/$(date +%Y%m%d).tar.gz /var/www
    owner: root:root
    permissions: '0755'
```

---

### Encoding

**Base64 encoded content**:
```yaml
#cloud-config

write_files:
  - path: /etc/ssl/private/server.key
    content: !!binary |
      LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...
      (base64 encoded)
      LS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQ==
    owner: root:root
    permissions: '0600'
```

---

## 🌐 Network Configuration

### Static IP

**Netplan (Ubuntu 18.04+)**:
```yaml
#cloud-config

write_files:
  - path: /etc/netplan/50-cloud-init.yaml
    content: |
      network:
        version: 2
        ethernets:
          eth0:
            addresses:
              - 10.0.1.10/24
            gateway4: 10.0.1.1
            nameservers:
              addresses:
                - 8.8.8.8
                - 8.8.4.4
    owner: root:root
    permissions: '0644'

runcmd:
  - netplan apply
```

---

### Hostname

```yaml
#cloud-config

hostname: webserver
fqdn: webserver.example.com

# Update /etc/hosts
manage_etc_hosts: true
```

---

### DNS

```yaml
#cloud-config

manage_resolv_conf: true

resolv_conf:
  nameservers:
    - 8.8.8.8
    - 8.8.4.4
  searchdomains:
    - example.com
  domain: example.com
```

---

## 🎯 Complete Examples

### Web Server

```yaml
#cloud-config

hostname: webserver
fqdn: webserver.example.com

users:
  - name: admin
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...

package_update: true
package_upgrade: true

packages:
  - nginx
  - git
  - ufw

write_files:
  - path: /var/www/html/index.html
    content: |
      <!DOCTYPE html>
      <html>
      <head><title>Welcome</title></head>
      <body>
        <h1>Web Server Ready!</h1>
        <p>Configured with cloud-init</p>
      </body>
      </html>
    owner: www-data:www-data
    permissions: '0644'

runcmd:
  - systemctl enable nginx
  - systemctl start nginx
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
  - echo "Setup complete" | logger

final_message: "System ready after $UPTIME seconds"
```

---

### Database Server

```yaml
#cloud-config

hostname: database
fqdn: database.example.com

users:
  - name: dba
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    groups: postgres
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...

package_update: true
package_upgrade: true

packages:
  - postgresql
  - postgresql-contrib

write_files:
  - path: /etc/postgresql/15/main/pg_hba.conf
    content: |
      # TYPE  DATABASE        USER            ADDRESS                 METHOD
      local   all             postgres                                peer
      local   all             all                                     peer
      host    all             all             10.0.0.0/8              md5
      host    all             all             127.0.0.1/32            md5
    owner: postgres:postgres
    permissions: '0640'
    append: true

runcmd:
  - sudo -u postgres psql -c "CREATE DATABASE myapp;"
  - sudo -u postgres psql -c "CREATE USER myapp_user WITH PASSWORD 'secret123';"
  - sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE myapp TO myapp_user;"
  - systemctl restart postgresql
  - ufw allow from 10.0.0.0/8 to any port 5432
  - ufw --force enable

final_message: "Database server ready after $UPTIME seconds"
```

---

### Docker Host

```yaml
#cloud-config

hostname: docker-host
fqdn: docker-host.example.com

users:
  - name: admin
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    groups: docker
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...

package_update: true
package_upgrade: true

packages:
  - apt-transport-https
  - ca-certificates
  - curl
  - gnupg
  - lsb-release

runcmd:
  # Install Docker
  - curl -fsSL https://get.docker.com -o get-docker.sh
  - sh get-docker.sh
  - systemctl enable docker
  - systemctl start docker
  
  # Install Docker Compose
  - curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  - chmod +x /usr/local/bin/docker-compose
  
  # Verify
  - docker --version
  - docker-compose --version

final_message: "Docker host ready after $UPTIME seconds"
```

---

## 🔍 Debugging Cloud-Init

### Check Status

```bash
# Overall status
cloud-init status

# Output:
# status: done

# Detailed status
cloud-init status --long

# Wait for completion
cloud-init status --wait
```

---

### View Logs

```bash
# Cloud-init log
sudo cat /var/log/cloud-init.log

# Output log
sudo cat /var/log/cloud-init-output.log

# Follow logs
sudo tail -f /var/log/cloud-init.log
```

---

### Analyze Boot

```bash
# Show boot stages and timing
sudo cloud-init analyze show

# Output:
# -- Boot Record 01 --
# The total time elapsed since completing an event is printed after the "@" character.
# The time the event takes is printed after the "+" character.
#
# Starting stage: init-local
# |`->no cache found @00.00400s +00.00100s
# |`->found local data from DataSourceNoCloud @00.00800s +00.12300s
```

---

### Blame (Find Slow Modules)

```bash
sudo cloud-init analyze blame

# Output:
# -- Boot Record 01 --
#      03.12300s (modules-config/config-runcmd)
#      00.89200s (modules-config/config-package-update-upgrade-install)
#      00.45100s (modules-final/config-scripts-user)
```

---

### Dump Config

```bash
# Show actual configuration used
sudo cloud-init query -a

# Show specific key
sudo cloud-init query userdata
```

---

### Re-run Cloud-Init

**For testing** (destructive):
```bash
# Clean and re-run
sudo cloud-init clean
sudo cloud-init init

# Or reboot (runs automatically)
sudo reboot
```

---

## 💡 Best Practices

### 1. Always Test

```bash
# Validate YAML syntax
yamllint user-data.yml

# Test with cloud-init
cloud-init devel schema --config-file user-data.yml

# Output: Valid cloud-config: user-data.yml
```

---

### 2. Use Comments

```yaml
#cloud-config

# Users configuration
users:
  - name: admin
    # Grant full sudo access
    sudo: ALL=(ALL) NOPASSWD:ALL
    # Use bash shell
    shell: /bin/bash
```

---

### 3. Handle Failures

```yaml
#cloud-config

runcmd:
  - |
    # Retry on failure
    for i in {1..5}; do
      apt-get update && break
      sleep 5
    done
  - apt-get install -y nginx || echo "NGINX install failed" >&2
```

---

### 4. Log Everything

```yaml
#cloud-config

runcmd:
  - echo "Starting custom setup" | logger -t cloud-init
  - ./setup.sh 2>&1 | logger -t custom-setup
  - echo "Setup complete" | logger -t cloud-init
```

---

### 5. Use Variables

```yaml
#cloud-config

# Not directly supported, but can use scripts
runcmd:
  - |
    export APP_ENV=production
    export DB_HOST=10.0.1.20
    echo "APP_ENV=$APP_ENV" >> /etc/environment
    echo "DB_HOST=$DB_HOST" >> /etc/environment
```

---

### 6. Keep It Simple

```yaml
# Good: Simple, clear
#cloud-config
packages:
  - nginx
runcmd:
  - systemctl start nginx

# Avoid: Too complex for cloud-init
# Use configuration management (Ansible) instead
```

---

## 🔗 What's Next?

**Packer**:
- **[packer-introduction](packer-introduction)** - Build VM templates with cloud-init

**Terraform**:
- **[terraform-proxmox](terraform-proxmox)** - Use cloud-init with VMs

**Ansible**:
- **[ansible-basics](ansible-basics)** - Post-boot configuration

---

## 📚 Resources

**Cloud-Init Documentation**:
- [Official Documentation](https://cloudinit.readthedocs.io/)
- [Examples](https://cloudinit.readthedocs.io/en/latest/reference/examples.html)
- [Module Reference](https://cloudinit.readthedocs.io/en/latest/reference/modules.html)

**Testing**:
- [Cloud-Init Schema](https://cloudinit.readthedocs.io/en/latest/reference/cli.html#schema)
- [YAML Validator](https://www.yamllint.com/)

---

## 📝 Change Log

### 2026-01-30
- Created cloud-init guide
- Explained concepts
- Covered user-data formats
- Demonstrated user management
- Showed package installation
- Covered file creation
- Explained network configuration
- Complete server examples
- Added debugging guide
- Included best practices

---

**Next Article**: [packer-introduction](packer-introduction) - Automated image building!
