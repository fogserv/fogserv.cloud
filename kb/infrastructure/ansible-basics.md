# Ansible Basics - Infrastructure Automation Fundamentals

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Configuration Management  
**Prerequisites**: [kb/basics/linux-fundamentals](../basics/linux-fundamentals), [kb/basics/ssh-basics](../basics/ssh-basics)  
**Time**: 3-4 hours  
**Tags**: ansible, automation, configuration-management, iac, agentless

## Summary

Learn infrastructure automation with Ansible, an agentless configuration management tool. Master playbooks, inventory, and ad-hoc commands to automate server provisioning, configuration, and application deployment without writing complex scripts.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand what Ansible is and when to use it
- ✅ Install Ansible on control node
- ✅ Create and manage inventory files
- ✅ Write basic playbooks
- ✅ Use modules for common tasks
- ✅ Run ad-hoc commands
- ✅ Understand Ansible architecture

## 🤔 What is Ansible?

**Ansible**: Open-source IT automation tool for configuration management, application deployment, and orchestration.

**Key Characteristics**:
- **Agentless**: No software on managed nodes (uses SSH)
- **Declarative**: Describe desired state, Ansible makes it happen
- **Idempotent**: Safe to run multiple times
- **Simple**: YAML-based, human-readable
- **Powerful**: Thousands of modules for everything

---

## 🏗️ Ansible Architecture

**Components**:
```
┌─────────────────────────────────────────────────────────┐
│  Control Node (Your Laptop/Server)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ansible (installed here)                         │  │
│  │ - Playbooks (YAML files)                        │  │
│  │ - Inventory (list of hosts)                     │  │
│  │ - Modules (tasks to execute)                    │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────┬─────────────────────────────────────────┘
                │ SSH (no agent needed!)
        ┌───────┴───────┬────────────┬────────────┐
        │               │            │            │
┌───────▼───────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
│ Managed Node  │ │ Node 2  │ │ Node 3  │ │ Node N  │
│ (web-01)      │ │ (web-02)│ │ (db-01) │ │ ...     │
│               │ │         │ │         │ │         │
│ Python only!  │ │         │ │         │ │         │
└───────────────┘ └─────────┘ └─────────┘ └─────────┘
```

**No Agents!**: Ansible uses SSH to connect and execute tasks. Managed nodes only need Python installed.

---

## 🆚 Ansible vs Alternatives

| Feature           | Ansible | Puppet | Chef | SaltStack |
|-------------------|---------|--------|------|-----------|
| **Agent**         | No      | Yes    | Yes  | Optional  |
| **Language**      | YAML    | Ruby   | Ruby | YAML      |
| **Learning Curve**| Low     | High   | High | Medium    |
| **Speed**         | Medium  | Medium | Medium| Fast      |
| **State**         | Push    | Pull   | Pull | Push/Pull |
| **Complexity**    | Simple  | Complex| Complex| Medium   |

**When to Use Ansible**:
- Quick setup (no agents!)
- Small to medium infrastructure
- Ad-hoc tasks frequently needed
- Team prefers simple YAML
- Agentless requirement

**When to Consider Alternatives**:
- Very large scale (thousands of nodes) → SaltStack
- Complex compliance requirements → Puppet
- Need guaranteed state enforcement → Puppet/Chef (pull model)

---

## 📦 Installation

### Control Node (Where Ansible Runs)

**Requirements**:
- Linux/macOS/WSL (not Windows natively)
- Python 3.8+

#### Ubuntu/Debian

```bash
# Add Ansible PPA
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository --yes --update ppa:ansible/ansible

# Install Ansible
sudo apt install -y ansible

# Verify
ansible --version
```

---

#### Fedora/RHEL/CentOS

```bash
# Install from dnf
sudo dnf install -y ansible

# Or use EPEL on RHEL/CentOS
sudo dnf install -y epel-release
sudo dnf install -y ansible

# Verify
ansible --version
```

---

#### macOS

```bash
# Using Homebrew
brew install ansible

# Verify
ansible --version
```

---

#### Python pip (Any Platform)

```bash
# Install via pip (in virtual environment recommended)
python3 -m venv ~/ansible-venv
source ~/ansible-venv/bin/activate

pip install ansible

# Verify
ansible --version
```

---

### Managed Nodes (Target Servers)

**Requirements**:
- **SSH access** from control node
- **Python 3.5+** installed
- **User with sudo** (for privilege escalation)

**Prepare Managed Node**:
```bash
# On managed node
# Install Python (usually already installed)
sudo apt install -y python3  # Ubuntu/Debian
sudo dnf install -y python3  # Fedora/RHEL

# Configure SSH key-based auth (from control node)
ssh-copy-id user@managed-node
```

---

## 📋 Inventory Basics

**Inventory**: List of managed nodes (hosts) Ansible controls.

### Simple Inventory

**File**: `inventory.ini`
```ini
# Single host
web1.example.com

# Multiple hosts
web1.example.com
web2.example.com
db1.example.com

# Hosts with IP addresses
192.168.1.10
192.168.1.11
```

---

### Inventory with Groups

```ini
# Web servers
[webservers]
web1.example.com
web2.example.com
192.168.1.10

# Database servers
[databases]
db1.example.com
db2.example.com

# Monitoring servers
[monitoring]
monitor.example.com

# Group of groups
[production:children]
webservers
databases
monitoring
```

---

### Inventory with Variables

```ini
[webservers]
web1.example.com ansible_host=192.168.1.10 ansible_user=ubuntu
web2.example.com ansible_host=192.168.1.11 ansible_user=ubuntu

[webservers:vars]
ansible_port=22
ansible_python_interpreter=/usr/bin/python3
http_port=80

[databases]
db1.example.com

[databases:vars]
ansible_user=postgres
db_port=5432
```

---

### YAML Inventory

**File**: `inventory.yaml`
```yaml
all:
  children:
    webservers:
      hosts:
        web1.example.com:
          ansible_host: 192.168.1.10
        web2.example.com:
          ansible_host: 192.168.1.11
      vars:
        ansible_user: ubuntu
        http_port: 80
    
    databases:
      hosts:
        db1.example.com:
          ansible_host: 192.168.1.20
      vars:
        ansible_user: postgres
        db_port: 5432
```

---

### Test Inventory

```bash
# List all hosts
ansible all -i inventory.ini --list-hosts

# List specific group
ansible webservers -i inventory.ini --list-hosts

# Ping all hosts
ansible all -i inventory.ini -m ping
```

---

## 🎯 Ad-Hoc Commands

**Ad-Hoc**: One-line commands for quick tasks (no playbook needed).

**Syntax**:
```bash
ansible [hosts] -i [inventory] -m [module] -a "[arguments]"
```

---

### Ping Hosts

```bash
# Ping all hosts
ansible all -i inventory.ini -m ping

# Ping specific group
ansible webservers -i inventory.ini -m ping

# Output (success):
web1.example.com | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

---

### Run Commands

```bash
# Execute shell command
ansible all -i inventory.ini -m shell -a "uptime"

# Check disk usage
ansible all -i inventory.ini -m shell -a "df -h"

# View memory
ansible all -i inventory.ini -m shell -a "free -m"

# With sudo (become)
ansible all -i inventory.ini -m shell -a "systemctl status nginx" --become
```

---

### Install Packages

```bash
# Install package (Ubuntu/Debian)
ansible webservers -i inventory.ini -m apt -a "name=nginx state=present" --become

# Install multiple packages
ansible webservers -i inventory.ini -m apt -a "name=nginx,git,curl state=present" --become

# Update all packages
ansible all -i inventory.ini -m apt -a "upgrade=dist" --become

# On RHEL/Fedora (use dnf module)
ansible webservers -i inventory.ini -m dnf -a "name=nginx state=present" --become
```

---

### Manage Services

```bash
# Start service
ansible webservers -i inventory.ini -m service -a "name=nginx state=started" --become

# Stop service
ansible webservers -i inventory.ini -m service -a "name=nginx state=stopped" --become

# Restart service
ansible webservers -i inventory.ini -m service -a "name=nginx state=restarted" --become

# Enable service on boot
ansible webservers -i inventory.ini -m service -a "name=nginx enabled=yes" --become
```

---

### Copy Files

```bash
# Copy file to remote host
ansible webservers -i inventory.ini -m copy -a "src=/local/file.txt dest=/remote/file.txt" --become

# Copy with permissions
ansible webservers -i inventory.ini -m copy -a "src=app.conf dest=/etc/app/app.conf owner=root mode=0644" --become
```

---

### Manage Users

```bash
# Create user
ansible all -i inventory.ini -m user -a "name=john state=present" --become

# Create user with sudo access
ansible all -i inventory.ini -m user -a "name=john groups=sudo append=yes" --become

# Remove user
ansible all -i inventory.ini -m user -a "name=john state=absent remove=yes" --become
```

---

## 📝 Playbooks Basics

**Playbook**: YAML file defining automation tasks.

### First Playbook

**File**: `webserver.yaml`
```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes  # Use sudo
  
  tasks:
    - name: Install Nginx
      apt:
        name: nginx
        state: present
        update_cache: yes
    
    - name: Start Nginx service
      service:
        name: nginx
        state: started
        enabled: yes
    
    - name: Copy index.html
      copy:
        content: "<h1>Hello from Ansible!</h1>"
        dest: /var/www/html/index.html
        mode: '0644'
```

**Run Playbook**:
```bash
ansible-playbook -i inventory.ini webserver.yaml
```

---

### Playbook Structure

```yaml
---
# Play 1
- name: Play description
  hosts: target_hosts
  become: yes  # Optional: use sudo
  vars:        # Optional: variables
    var1: value1
  
  tasks:
    - name: Task description
      module_name:
        parameter1: value1
        parameter2: value2

# Play 2 (multiple plays in one file)
- name: Another play
  hosts: other_hosts
  tasks:
    - name: Another task
      module_name:
        param: value
```

---

### Multiple Plays Example

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  
  tasks:
    - name: Install Nginx
      apt:
        name: nginx
        state: present

- name: Configure database servers
  hosts: databases
  become: yes
  
  tasks:
    - name: Install PostgreSQL
      apt:
        name: postgresql
        state: present
```

---

## 🧩 Common Modules

### apt/dnf - Package Management

```yaml
- name: Install packages (Ubuntu/Debian)
  apt:
    name: 
      - nginx
      - git
      - curl
    state: present
    update_cache: yes

- name: Install packages (RHEL/Fedora)
  dnf:
    name: nginx
    state: present
```

---

### service/systemd - Service Management

```yaml
- name: Manage service
  service:
    name: nginx
    state: started      # started, stopped, restarted, reloaded
    enabled: yes        # Start on boot
```

---

### copy - Copy Files

```yaml
- name: Copy file
  copy:
    src: /local/path/file.txt     # File on control node
    dest: /remote/path/file.txt   # Destination on managed node
    owner: www-data
    group: www-data
    mode: '0644'

- name: Copy with inline content
  copy:
    content: "Hello World"
    dest: /tmp/hello.txt
```

---

### template - Jinja2 Templates

```yaml
- name: Deploy config from template
  template:
    src: nginx.conf.j2        # Template file
    dest: /etc/nginx/nginx.conf
    owner: root
    mode: '0644'
  notify: Restart Nginx      # Trigger handler
```

**Template Example** (`nginx.conf.j2`):
```jinja
server {
    listen {{ http_port }};
    server_name {{ server_name }};
    
    location / {
        root {{ web_root }};
    }
}
```

---

### file - Manage Files/Directories

```yaml
- name: Create directory
  file:
    path: /app/data
    state: directory
    owner: appuser
    mode: '0755'

- name: Create empty file
  file:
    path: /tmp/myfile
    state: touch

- name: Remove file
  file:
    path: /tmp/oldfile
    state: absent

- name: Create symbolic link
  file:
    src: /app/current
    dest: /app/releases/v1.0
    state: link
```

---

### user - User Management

```yaml
- name: Create user
  user:
    name: appuser
    groups: sudo,docker
    append: yes          # Add to groups (don't replace)
    shell: /bin/bash
    create_home: yes
```

---

### lineinfile - Edit Files

```yaml
- name: Add line to file
  lineinfile:
    path: /etc/hosts
    line: "192.168.1.10 myserver.local"
    state: present

- name: Replace line with regex
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: '^#?PermitRootLogin'
    line: 'PermitRootLogin no'
```

---

### git - Git Operations

```yaml
- name: Clone repository
  git:
    repo: https://github.com/user/repo.git
    dest: /app/repo
    version: main        # Branch/tag/commit

- name: Pull latest changes
  git:
    repo: https://github.com/user/repo.git
    dest: /app/repo
    version: main
    update: yes
```

---

## 🔄 Playbook Features

### Variables

**Define in playbook**:
```yaml
---
- name: Deploy app
  hosts: webservers
  vars:
    app_name: myapp
    app_port: 8080
    app_user: appuser
  
  tasks:
    - name: Create app directory
      file:
        path: "/opt/{{ app_name }}"
        state: directory
        owner: "{{ app_user }}"
```

**Define in separate file** (`vars.yaml`):
```yaml
app_name: myapp
app_port: 8080
app_user: appuser
```

**Use in playbook**:
```yaml
---
- name: Deploy app
  hosts: webservers
  vars_files:
    - vars.yaml
  
  tasks:
    - name: Create directory
      file:
        path: "/opt/{{ app_name }}"
        state: directory
```

---

### Handlers

**Handlers**: Tasks that run only when notified (e.g., restart service only if config changed).

```yaml
---
- name: Configure Nginx
  hosts: webservers
  become: yes
  
  tasks:
    - name: Copy Nginx config
      copy:
        src: nginx.conf
        dest: /etc/nginx/nginx.conf
      notify: Restart Nginx
    
    - name: Copy site config
      copy:
        src: mysite.conf
        dest: /etc/nginx/sites-available/mysite
      notify: Restart Nginx
  
  handlers:
    - name: Restart Nginx
      service:
        name: nginx
        state: restarted
```

**Key Points**:
- Handlers run at end of play
- Only run if notified
- Run once even if notified multiple times

---

### Conditionals

```yaml
- name: Install package on Debian
  apt:
    name: nginx
    state: present
  when: ansible_os_family == "Debian"

- name: Install package on RedHat
  dnf:
    name: nginx
    state: present
  when: ansible_os_family == "RedHat"

- name: Run only on production
  command: /app/deploy.sh
  when: environment == "production"
```

---

### Loops

```yaml
- name: Install multiple packages
  apt:
    name: "{{ item }}"
    state: present
  loop:
    - nginx
    - git
    - curl
    - vim

- name: Create multiple users
  user:
    name: "{{ item }}"
    state: present
  loop:
    - alice
    - bob
    - charlie

- name: Loop with dict
  user:
    name: "{{ item.name }}"
    groups: "{{ item.groups }}"
  loop:
    - { name: 'alice', groups: 'sudo' }
    - { name: 'bob', groups: 'docker' }
```

---

### Tags

**Run specific tasks**:

```yaml
---
- name: Full deployment
  hosts: webservers
  
  tasks:
    - name: Install packages
      apt:
        name: nginx
        state: present
      tags: install
    
    - name: Copy config
      copy:
        src: nginx.conf
        dest: /etc/nginx/
      tags: config
    
    - name: Start service
      service:
        name: nginx
        state: started
      tags: service
```

**Run only tagged tasks**:
```bash
# Run only install tasks
ansible-playbook playbook.yaml --tags install

# Skip specific tags
ansible-playbook playbook.yaml --skip-tags config
```

---

## 🎬 Complete Example: LAMP Stack

**Playbook**: `lamp.yaml`
```yaml
---
- name: Install LAMP stack
  hosts: webservers
  become: yes
  vars:
    mysql_root_password: "secret123"
  
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
    
    - name: Install Apache
      apt:
        name: apache2
        state: present
    
    - name: Install MySQL
      apt:
        name: 
          - mysql-server
          - python3-pymysql
        state: present
    
    - name: Install PHP
      apt:
        name:
          - php
          - php-mysql
          - libapache2-mod-php
        state: present
    
    - name: Start and enable Apache
      service:
        name: apache2
        state: started
        enabled: yes
    
    - name: Start and enable MySQL
      service:
        name: mysql
        state: started
        enabled: yes
    
    - name: Deploy test PHP page
      copy:
        content: |
          <?php
          phpinfo();
          ?>
        dest: /var/www/html/info.php
        mode: '0644'
    
    - name: Configure firewall
      ufw:
        rule: allow
        port: "{{ item }}"
      loop:
        - "80"
        - "443"
```

**Run**:
```bash
ansible-playbook -i inventory.ini lamp.yaml
```

---

## 🔍 Debugging

### Check Syntax

```bash
# Validate playbook syntax
ansible-playbook playbook.yaml --syntax-check
```

---

### Dry Run (Check Mode)

```bash
# See what would change (don't actually change)
ansible-playbook playbook.yaml --check

# With diff output
ansible-playbook playbook.yaml --check --diff
```

---

### Verbose Output

```bash
# Normal
ansible-playbook playbook.yaml

# Verbose
ansible-playbook playbook.yaml -v

# More verbose
ansible-playbook playbook.yaml -vv

# Very verbose
ansible-playbook playbook.yaml -vvv
```

---

### Debug Module

```yaml
- name: Show variable
  debug:
    var: ansible_hostname

- name: Show message
  debug:
    msg: "The server is {{ ansible_hostname }}"

- name: Show all facts
  debug:
    var: ansible_facts
```

---

## ⚙️ Configuration

**File**: `/etc/ansible/ansible.cfg` or `~/.ansible.cfg` or `./ansible.cfg`

**Example Configuration**:
```ini
[defaults]
# Inventory location
inventory = ./inventory.ini

# Don't check host keys (lab only!)
host_key_checking = False

# Number of parallel processes
forks = 10

# Timeout for SSH connections
timeout = 30

# Gathering facts (slow, can disable if not needed)
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts

# Roles path
roles_path = ./roles

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False
```

---

## 🔗 What's Next?

You've learned Ansible basics! Continue with:

**Inventory Management**:
- **[ansible-inventory](ansible-inventory)** - Advanced inventory patterns

**Playbook Mastery**:
- **[ansible-playbooks](ansible-playbooks)** - Advanced playbook techniques

**Reusable Content**:
- **[ansible-roles](ansible-roles)** - Organize code with roles

**Secrets**:
- **[ansible-vault](ansible-vault)** - Encrypt sensitive data

---

## 📚 Resources

**Official Docs**:
- [Ansible Documentation](https://docs.ansible.com/)
- [Module Index](https://docs.ansible.com/ansible/latest/collections/index_module.html)
- [Best Practices](https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html)

**Learning**:
- [Ansible for DevOps (Book)](https://www.ansiblefordevops.com/)
- [Learn Ansible](https://www.ansible.com/resources/get-started)

**Community**:
- [Ansible Galaxy](https://galaxy.ansible.com/) - Shared roles
- [Ansible GitHub](https://github.com/ansible/ansible)

---

## 📝 Change Log

### 2026-01-30
- Created Ansible basics article
- Covered installation and setup
- Explained inventory management
- Introduced ad-hoc commands
- Demonstrated playbook creation
- Covered common modules
- Included LAMP stack complete example
- Added debugging and configuration sections

---

**Next Article**: [ansible-inventory](ansible-inventory) - Master inventory management!

