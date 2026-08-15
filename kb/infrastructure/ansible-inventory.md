# Ansible Inventory - Managing Your Infrastructure

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Configuration Management  
**Prerequisites**: [ansible-basics](ansible-basics), [kb/basics/ssh-basics](../basics/ssh-basics)  
**Time**: 2-3 hours  
**Tags**: ansible, inventory, hosts, groups, variables, dynamic-inventory

## Summary

Master Ansible inventory management to organize and scale your infrastructure. Learn static inventory, dynamic inventory, host/group variables, patterns, and advanced inventory techniques for complex environments.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Create static inventory files (INI and YAML)
- ✅ Organize hosts into groups
- ✅ Use host and group variables
- ✅ Apply inventory patterns for targeting
- ✅ Implement dynamic inventory
- ✅ Structure inventory for multiple environments
- ✅ Use inventory plugins

## 📋 Inventory Basics Recap

**Inventory**: List of hosts Ansible manages.

**Simple inventory** (`hosts.ini`):
```ini
web1.example.com
web2.example.com
db1.example.com
```

**Run playbook**:
```bash
ansible-playbook -i hosts.ini playbook.yaml
```

---

## 📝 Static Inventory - INI Format

### Basic INI Inventory

```ini
# Individual hosts
mail.example.com

# Hosts with aliases
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11

# Group of hosts
[webservers]
web1.example.com
web2.example.com

[databases]
db1.example.com
db2.example.com

[monitoring]
prometheus.example.com
grafana.example.com
```

---

### Host Variables

```ini
[webservers]
web1 ansible_host=192.168.1.10 ansible_user=ubuntu http_port=80
web2 ansible_host=192.168.1.11 ansible_user=ubuntu http_port=8080
web3 ansible_host=192.168.1.12 ansible_user=admin http_port=80
```

---

### Group Variables

```ini
[webservers]
web1.example.com
web2.example.com

[webservers:vars]
ansible_user=ubuntu
ansible_port=22
http_port=80
deploy_path=/var/www/html

[databases]
db1.example.com
db2.example.com

[databases:vars]
ansible_user=postgres
db_port=5432
```

---

### Groups of Groups (Parent/Child)

```ini
[web_frontend]
web1.example.com
web2.example.com

[web_backend]
api1.example.com
api2.example.com

[webservers:children]
web_frontend
web_backend

[webservers:vars]
ansible_user=ubuntu
```

---

### Ranges

```ini
# Numeric range
[webservers]
web[01:10].example.com
# Expands to: web01, web02, ..., web10

# Alphabetic range
[databases]
db-[a:c].example.com
# Expands to: db-a, db-b, db-c

# With padding
[servers]
server[001:100].example.com
# Expands to: server001, server002, ..., server100
```

---

## 📄 Static Inventory - YAML Format

### Basic YAML Inventory

```yaml
all:
  hosts:
    mail.example.com:
  children:
    webservers:
      hosts:
        web1.example.com:
        web2.example.com:
    databases:
      hosts:
        db1.example.com:
        db2.example.com:
```

---

### With Host Variables

```yaml
all:
  children:
    webservers:
      hosts:
        web1.example.com:
          ansible_host: 192.168.1.10
          ansible_user: ubuntu
          http_port: 80
        web2.example.com:
          ansible_host: 192.168.1.11
          ansible_user: ubuntu
          http_port: 8080
```

---

### With Group Variables

```yaml
all:
  children:
    webservers:
      hosts:
        web1.example.com:
        web2.example.com:
      vars:
        ansible_user: ubuntu
        http_port: 80
        deploy_path: /var/www/html
    
    databases:
      hosts:
        db1.example.com:
        db2.example.com:
      vars:
        ansible_user: postgres
        db_port: 5432
```

---

### Nested Groups

```yaml
all:
  children:
    production:
      children:
        prod_web:
          hosts:
            web1.prod.example.com:
            web2.prod.example.com:
        prod_db:
          hosts:
            db1.prod.example.com:
      vars:
        env: production
        
    staging:
      children:
        stage_web:
          hosts:
            web1.stage.example.com:
        stage_db:
          hosts:
            db1.stage.example.com:
      vars:
        env: staging
```

---

## 📂 Variable Files

**Better Practice**: Store variables in separate files.

**Directory Structure**:
```
inventory/
├── hosts.yaml
├── group_vars/
│   ├── all.yaml
│   ├── webservers.yaml
│   └── databases.yaml
└── host_vars/
    ├── web1.example.com.yaml
    └── db1.example.com.yaml
```

---

### group_vars/all.yaml

```yaml
# Variables for ALL hosts
ansible_user: ubuntu
ansible_ssh_private_key_file: ~/.ssh/id_rsa
ansible_python_interpreter: /usr/bin/python3

# Common settings
ntp_server: pool.ntp.org
timezone: America/New_York
```

---

### group_vars/webservers.yaml

```yaml
# Variables for webservers group
http_port: 80
https_port: 443
max_connections: 1000
worker_processes: 4

nginx_version: 1.24
```

---

### host_vars/web1.example.com.yaml

```yaml
# Variables specific to web1
ansible_host: 192.168.1.10
server_id: web01
backup_enabled: true
disk_path: /dev/sdb1
```

---

## 🎯 Inventory Patterns

**Patterns**: Target specific hosts or groups.

### Basic Patterns

```bash
# All hosts
ansible all -i inventory.ini -m ping

# Single host
ansible web1.example.com -i inventory.ini -m ping

# Single group
ansible webservers -i inventory.ini -m ping

# Multiple groups (OR)
ansible 'webservers:databases' -i inventory.ini -m ping

# Intersection (AND)
ansible 'webservers:&production' -i inventory.ini -m ping
# Only hosts in BOTH webservers AND production

# Exclusion (NOT)
ansible 'webservers:!staging' -i inventory.ini -m ping
# Webservers EXCEPT those in staging
```

---

### Wildcard Patterns

```bash
# All hosts starting with web
ansible 'web*' -i inventory.ini -m ping

# All .com hosts
ansible '*.com' -i inventory.ini -m ping

# Range
ansible 'web[1:5]' -i inventory.ini -m ping
```

---

### Complex Patterns

```bash
# Webservers in production, but not web1
ansible 'webservers:&production:!web1' -i inventory.ini -m ping

# All hosts except databases
ansible 'all:!databases' -i inventory.ini -m ping

# Multiple wildcards
ansible 'web*:db*' -i inventory.ini -m ping
```

---

## 🏢 Multi-Environment Inventory

**Directory Structure**:
```
inventories/
├── production/
│   ├── hosts.yaml
│   ├── group_vars/
│   │   ├── all.yaml
│   │   └── webservers.yaml
│   └── host_vars/
│       └── web1.prod.yaml
│
├── staging/
│   ├── hosts.yaml
│   ├── group_vars/
│   │   ├── all.yaml
│   │   └── webservers.yaml
│   └── host_vars/
│       └── web1.stage.yaml
│
└── development/
    ├── hosts.yaml
    └── group_vars/
        └── all.yaml
```

---

### production/hosts.yaml

```yaml
all:
  children:
    webservers:
      hosts:
        web1.prod.example.com:
        web2.prod.example.com:
    databases:
      hosts:
        db1.prod.example.com:
        db2.prod.example.com:
```

---

### production/group_vars/all.yaml

```yaml
env: production
domain: example.com
backup_enabled: true
monitoring_enabled: true
log_level: warning
```

---

### staging/group_vars/all.yaml

```yaml
env: staging
domain: stage.example.com
backup_enabled: false
monitoring_enabled: true
log_level: debug
```

---

### Usage

```bash
# Deploy to production
ansible-playbook -i inventories/production site.yaml

# Deploy to staging
ansible-playbook -i inventories/staging site.yaml

# Deploy to development
ansible-playbook -i inventories/development site.yaml
```

---

## 🔄 Dynamic Inventory

**Dynamic Inventory**: Generate inventory from external sources (cloud providers, CMDBs, etc.).

### Dynamic Inventory Script

**File**: `inventory.py`
```python
#!/usr/bin/env python3
import json

# Simple dynamic inventory
inventory = {
    "webservers": {
        "hosts": ["web1.example.com", "web2.example.com"],
        "vars": {
            "ansible_user": "ubuntu",
            "http_port": 80
        }
    },
    "databases": {
        "hosts": ["db1.example.com"],
        "vars": {
            "ansible_user": "postgres"
        }
    },
    "_meta": {
        "hostvars": {
            "web1.example.com": {
                "ansible_host": "192.168.1.10"
            },
            "web2.example.com": {
                "ansible_host": "192.168.1.11"
            },
            "db1.example.com": {
                "ansible_host": "192.168.1.20"
            }
        }
    }
}

print(json.dumps(inventory, indent=2))
```

**Make Executable**:
```bash
chmod +x inventory.py
```

**Use**:
```bash
ansible-playbook -i inventory.py playbook.yaml
```

---

### AWS EC2 Dynamic Inventory

**Install boto3**:
```bash
pip install boto3
```

**Create**: `aws_ec2.yaml`
```yaml
plugin: amazon.aws.aws_ec2
regions:
  - us-east-1
  - us-west-2

keyed_groups:
  # Create groups based on tags
  - key: tags.Environment
    prefix: env
  - key: tags.Role
    prefix: role

hostnames:
  - tag:Name
  - private-ip-address

compose:
  ansible_host: public_ip_address
```

**Use**:
```bash
# List hosts
ansible-inventory -i aws_ec2.yaml --list

# Run playbook
ansible-playbook -i aws_ec2.yaml playbook.yaml
```

---

### Digital Ocean Dynamic Inventory

**File**: `digitalocean.yaml`
```yaml
plugin: community.digitalocean.digitalocean
oauth_token: "{{ lookup('env', 'DO_API_TOKEN') }}"

keyed_groups:
  - key: tags
    prefix: tag
  - key: region.slug
    prefix: region

compose:
  ansible_host: networks.v4[0].ip_address
```

---

### Docker Dynamic Inventory

**File**: `docker.yaml`
```yaml
plugin: community.docker.docker_containers

connection: docker
docker_host: unix://var/run/docker.sock

keyed_groups:
  - key: docker_name
    prefix: container
```

**Use**:
```bash
# List running containers
ansible-inventory -i docker.yaml --list

# Run against containers
ansible-playbook -i docker.yaml playbook.yaml
```

---

## 🛠️ Inventory Plugins

**Ansible 2.4+**: Inventory plugins (better than scripts).

### Enable Plugin

**File**: `ansible.cfg`
```ini
[inventory]
enable_plugins = host_list, yaml, ini, auto, script, amazon.aws.aws_ec2
```

---

### Create Custom Inventory Plugin

**File**: `plugins/inventory/custom.py`
```python
from ansible.plugins.inventory import BaseInventoryPlugin

class InventoryModule(BaseInventoryPlugin):
    NAME = 'custom'

    def verify_file(self, path):
        return path.endswith('custom.yaml')

    def parse(self, inventory, loader, path, cache=True):
        super(InventoryModule, self).parse(inventory, loader, path, cache)
        
        # Add hosts
        self.inventory.add_host('web1')
        self.inventory.add_host('web2')
        
        # Add group
        self.inventory.add_group('webservers')
        self.inventory.add_child('webservers', 'web1')
        self.inventory.add_child('webservers', 'web2')
        
        # Set variables
        self.inventory.set_variable('web1', 'ansible_host', '192.168.1.10')
        self.inventory.set_variable('web2', 'ansible_host', '192.168.1.11')
```

---

## 🔍 Inventory Inspection

### List All Hosts

```bash
# List all hosts
ansible all -i inventory.ini --list-hosts

# List hosts in group
ansible webservers -i inventory.ini --list-hosts

# With pattern
ansible 'webservers:&production' -i inventory.ini --list-hosts
```

---

### Show Inventory Graph

```bash
# Show inventory structure
ansible-inventory -i inventory.ini --graph

# Output:
@all:
  |--@ungrouped:
  |--@webservers:
  |  |--web1.example.com
  |  |--web2.example.com
  |--@databases:
  |  |--db1.example.com
```

---

### Show Host Variables

```bash
# Show variables for host
ansible-inventory -i inventory.ini --host web1.example.com

# Output (JSON):
{
    "ansible_host": "192.168.1.10",
    "ansible_user": "ubuntu",
    "http_port": 80
}
```

---

### Export Inventory

```bash
# Export to JSON
ansible-inventory -i inventory.ini --list > inventory.json

# Export to YAML
ansible-inventory -i inventory.ini --list --yaml > inventory.yaml
```

---

## 🎯 Real-World Example

**Directory Structure**:
```
ansible/
├── ansible.cfg
├── inventories/
│   ├── production/
│   │   ├── hosts.yaml
│   │   ├── group_vars/
│   │   │   ├── all.yaml
│   │   │   ├── webservers.yaml
│   │   │   └── databases.yaml
│   │   └── host_vars/
│   │       ├── web1.prod.yaml
│   │       └── db1.prod.yaml
│   └── staging/
│       ├── hosts.yaml
│       └── group_vars/
│           └── all.yaml
└── playbooks/
    └── site.yaml
```

---

### inventories/production/hosts.yaml

```yaml
all:
  children:
    webservers:
      hosts:
        web1.prod.example.com:
        web2.prod.example.com:
        web3.prod.example.com:
    
    loadbalancers:
      hosts:
        lb1.prod.example.com:
    
    databases:
      hosts:
        db1.prod.example.com:
        db2.prod.example.com:
    
    cache:
      hosts:
        redis1.prod.example.com:
        redis2.prod.example.com:
    
    monitoring:
      hosts:
        prometheus.prod.example.com:
        grafana.prod.example.com:
```

---

### inventories/production/group_vars/all.yaml

```yaml
# Global variables
env: production
domain: example.com
datacenter: us-east-1

# SSH settings
ansible_user: deploy
ansible_ssh_private_key_file: ~/.ssh/prod_key
ansible_python_interpreter: /usr/bin/python3

# Monitoring
monitoring_enabled: true
prometheus_server: prometheus.prod.example.com

# Backup
backup_enabled: true
backup_schedule: "0 2 * * *"

# Logging
log_level: info
syslog_server: syslog.prod.example.com
```

---

### inventories/production/group_vars/webservers.yaml

```yaml
# Nginx configuration
nginx_worker_processes: 4
nginx_worker_connections: 2048
nginx_keepalive_timeout: 65

# SSL
ssl_enabled: true
ssl_certificate: /etc/ssl/certs/example.com.crt
ssl_certificate_key: /etc/ssl/private/example.com.key

# Application
app_port: 8080
app_workers: 4
app_max_memory: 512m

# Load balancer
upstream_servers:
  - web1.prod.example.com:8080
  - web2.prod.example.com:8080
  - web3.prod.example.com:8080
```

---

### inventories/production/host_vars/web1.prod.yaml

```yaml
# Host-specific overrides
ansible_host: 10.0.1.10
server_id: 1
primary: true
```

---

## 💡 Best Practices

### 1. Use Group/Host Variable Files

```bash
# Good: Variables in files
inventories/
├── hosts.yaml
└── group_vars/
    └── webservers.yaml

# Bad: Variables in inventory
[webservers:vars]
var1=value1
var2=value2
...
```

---

### 2. Organize by Environment

```bash
inventories/
├── production/
├── staging/
└── development/
```

---

### 3. Use Descriptive Group Names

```ini
# Good
[web_frontend]
[api_backend]
[database_primary]

# Bad
[group1]
[servers]
[db]
```

---

### 4. Leverage Group Hierarchy

```yaml
all:
  children:
    production:
      children:
        prod_web:
        prod_db:
    staging:
      children:
        stage_web:
        stage_db:
```

---

### 5. Document Your Inventory

```yaml
# inventories/production/hosts.yaml
# Production environment inventory
# Last updated: 2026-01-30
# Contact: ops@example.com

all:
  children:
    webservers:  # Frontend web servers
      hosts:
        # Primary web server
        web1.prod.example.com:
```

---

## 🔗 What's Next?

Now that you can manage inventory:

**Advanced Playbooks**:
- **[ansible-playbooks](ansible-playbooks)** - Advanced playbook techniques

**Reusable Code**:
- **[ansible-roles](ansible-roles)** - Organize with roles

**Secrets Management**:
- **[ansible-vault](ansible-vault)** - Encrypt sensitive data

---

## 📚 Resources

**Official Docs**:
- [Inventory Guide](https://docs.ansible.com/ansible/latest/user_guide/intro_inventory.html)
- [Inventory Plugins](https://docs.ansible.com/ansible/latest/plugins/inventory.html)
- [Patterns](https://docs.ansible.com/ansible/latest/user_guide/intro_patterns.html)

**Dynamic Inventory**:
- [AWS EC2 Plugin](https://docs.ansible.com/ansible/latest/collections/amazon/aws/aws_ec2_inventory.html)
- [Digital Ocean Plugin](https://docs.ansible.com/ansible/latest/collections/community/digitalocean/digitalocean_inventory.html)

---

## 📝 Change Log

### 2026-01-30
- Created Ansible inventory guide
- Covered static inventory (INI and YAML formats)
- Explained host and group variables
- Included variable file organization
- Demonstrated inventory patterns
- Provided multi-environment structure
- Introduced dynamic inventory
- Included real-world production example
- Added best practices

---

**Next Article**: [ansible-playbooks](ansible-playbooks) - Master advanced playbook techniques!

