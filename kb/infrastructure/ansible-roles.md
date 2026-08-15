# Ansible Roles - Organizing Your Automation

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Configuration Management  
**Prerequisites**: [ansible-playbooks](ansible-playbooks), [ansible-inventory](ansible-inventory)  
**Time**: 3-4 hours  
**Tags**: ansible, roles, organization, reusability, galaxy

## Summary

Master Ansible roles to create reusable, maintainable automation code. Learn role structure, dependencies, variables, defaults, and how to leverage Ansible Galaxy for community roles. Build production-ready role-based infrastructure automation.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand role structure and components
- ✅ Create custom roles
- ✅ Use role variables and defaults
- ✅ Manage role dependencies
- ✅ Share roles via Ansible Galaxy
- ✅ Use community roles effectively
- ✅ Organize complex playbooks with roles

## 🤔 Why Roles?

### Without Roles (Messy!)

```yaml
# site.yaml - 1000+ lines, hard to maintain
- name: Configure everything
  hosts: webservers
  tasks:
    - name: Install Nginx
      apt: ...
    - name: Configure Nginx
      template: ...
    - name: Install PostgreSQL
      apt: ...
    - name: Configure PostgreSQL
      template: ...
    # ... 100 more tasks
```

---

### With Roles (Clean!)

```yaml
# site.yaml - clean and organized
- name: Configure web servers
  hosts: webservers
  roles:
    - common
    - nginx
    - postgresql
    - monitoring
```

**Benefits**:
- ✅ Reusable across playbooks
- ✅ Shareable with team/community
- ✅ Easier to test
- ✅ Clear organization
- ✅ Version controllable

---

## 📁 Role Structure

### Standard Role Directory

```
roles/
└── nginx/
    ├── tasks/
    │   └── main.yaml          # Main tasks
    ├── handlers/
    │   └── main.yaml          # Handlers (service restarts, etc.)
    ├── templates/
    │   └── nginx.conf.j2      # Jinja2 templates
    ├── files/
    │   └── index.html         # Static files
    ├── vars/
    │   └── main.yaml          # Variables (high priority)
    ├── defaults/
    │   └── main.yaml          # Default variables (low priority)
    ├── meta/
    │   └── main.yaml          # Role metadata and dependencies
    ├── tests/
    │   ├── inventory          # Test inventory
    │   └── test.yaml          # Test playbook
    └── README.md              # Documentation
```

**Only create directories you need!** Empty directories are fine to skip.

---

## 🏗️ Creating Your First Role

### Generate Role Skeleton

```bash
# Create role structure
ansible-galaxy init roles/nginx

# Or in specific directory
ansible-galaxy init --init-path roles nginx
```

**Generated structure**:
```
roles/nginx/
├── README.md
├── defaults/
│   └── main.yml
├── files/
├── handlers/
│   └── main.yml
├── meta/
│   └── main.yml
├── tasks/
│   └── main.yml
├── templates/
├── tests/
│   ├── inventory
│   └── test.yml
└── vars/
    └── main.yml
```

---

### Build Nginx Role

**roles/nginx/defaults/main.yaml**:
```yaml
---
# Default variables (can be overridden)
nginx_port: 80
nginx_worker_processes: auto
nginx_worker_connections: 1024
nginx_keepalive_timeout: 65

nginx_sites:
  - name: default
    template: default.conf.j2
    enabled: true
```

---

**roles/nginx/vars/main.yaml**:
```yaml
---
# High-priority variables (harder to override)
nginx_user: www-data
nginx_config_dir: /etc/nginx
nginx_log_dir: /var/log/nginx
```

---

**roles/nginx/tasks/main.yaml**:
```yaml
---
- name: Install Nginx
  apt:
    name: nginx
    state: present
    update_cache: yes

- name: Create config directory
  file:
    path: "{{ nginx_config_dir }}/sites-available"
    state: directory
    mode: '0755'

- name: Configure Nginx main config
  template:
    src: nginx.conf.j2
    dest: "{{ nginx_config_dir }}/nginx.conf"
    validate: 'nginx -t -c %s'
  notify: Restart Nginx

- name: Configure sites
  template:
    src: "{{ item.template }}"
    dest: "{{ nginx_config_dir }}/sites-available/{{ item.name }}"
  loop: "{{ nginx_sites }}"
  when: item.enabled | default(true)
  notify: Reload Nginx

- name: Enable sites
  file:
    src: "{{ nginx_config_dir }}/sites-available/{{ item.name }}"
    dest: "{{ nginx_config_dir }}/sites-enabled/{{ item.name }}"
    state: link
  loop: "{{ nginx_sites }}"
  when: item.enabled | default(true)
  notify: Reload Nginx

- name: Start and enable Nginx
  service:
    name: nginx
    state: started
    enabled: yes
```

---

**roles/nginx/handlers/main.yaml**:
```yaml
---
- name: Restart Nginx
  service:
    name: nginx
    state: restarted

- name: Reload Nginx
  service:
    name: nginx
    state: reloaded

- name: Test Nginx config
  command: nginx -t
  changed_when: false
```

---

**roles/nginx/templates/nginx.conf.j2**:
```jinja
user {{ nginx_user }};
worker_processes {{ nginx_worker_processes }};
pid /run/nginx.pid;

events {
    worker_connections {{ nginx_worker_connections }};
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout {{ nginx_keepalive_timeout }};
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log {{ nginx_log_dir }}/access.log;
    error_log {{ nginx_log_dir }}/error.log;

    gzip on;

    include /etc/nginx/sites-enabled/*;
}
```

---

**roles/nginx/templates/default.conf.j2**:
```jinja
server {
    listen {{ nginx_port }};
    server_name _;

    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

---

**roles/nginx/meta/main.yaml**:
```yaml
---
galaxy_info:
  author: Your Name
  description: Nginx web server role
  company: Your Company
  license: MIT
  min_ansible_version: '2.9'
  
  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
    - name: Debian
      versions:
        - bullseye

  galaxy_tags:
    - nginx
    - web
    - webserver

dependencies: []
```

---

### Use the Role

**playbook.yaml**:
```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  
  roles:
    - nginx
```

**With variable overrides**:
```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  
  roles:
    - role: nginx
      vars:
        nginx_port: 8080
        nginx_sites:
          - name: mysite
            template: mysite.conf.j2
            enabled: true
```

---

## 🔗 Role Dependencies

### Define Dependencies

**roles/webapp/meta/main.yaml**:
```yaml
---
dependencies:
  - role: common
  - role: nginx
    vars:
      nginx_port: 80
  - role: postgresql
    vars:
      postgres_version: 15
```

**When webapp role runs, it automatically includes common, nginx, and postgresql roles first.**

---

### Conditional Dependencies

```yaml
dependencies:
  - role: ssl
    when: ssl_enabled | bool
  
  - role: monitoring
    when: env == "production"
```

---

## 📦 Multiple Roles Example

**Project structure**:
```
ansible-project/
├── ansible.cfg
├── inventory/
│   └── hosts.yaml
├── playbooks/
│   ├── site.yaml
│   ├── webservers.yaml
│   └── databases.yaml
└── roles/
    ├── common/
    ├── nginx/
    ├── postgresql/
    ├── monitoring/
    └── security/
```

---

### Common Role

**roles/common/tasks/main.yaml**:
```yaml
---
- name: Update apt cache
  apt:
    update_cache: yes
    cache_valid_time: 3600

- name: Install common packages
  apt:
    name:
      - curl
      - wget
      - vim
      - git
      - htop
      - tmux
    state: present

- name: Configure timezone
  timezone:
    name: "{{ timezone | default('UTC') }}"

- name: Configure NTP
  apt:
    name: systemd-timesyncd
    state: present

- name: Start timesyncd
  service:
    name: systemd-timesyncd
    state: started
    enabled: yes

- name: Create admin users
  user:
    name: "{{ item.name }}"
    groups: "{{ item.groups | default([]) }}"
    shell: /bin/bash
    state: present
  loop: "{{ admin_users | default([]) }}"

- name: Add SSH keys for admins
  authorized_key:
    user: "{{ item.name }}"
    key: "{{ item.ssh_key }}"
    state: present
  loop: "{{ admin_users | default([]) }}"
  when: item.ssh_key is defined
```

---

### Security Role

**roles/security/tasks/main.yaml**:
```yaml
---
- name: Install fail2ban
  apt:
    name: fail2ban
    state: present

- name: Configure fail2ban
  template:
    src: jail.local.j2
    dest: /etc/fail2ban/jail.local
  notify: Restart fail2ban

- name: Configure UFW defaults
  ufw:
    direction: "{{ item.direction }}"
    policy: "{{ item.policy }}"
  loop:
    - { direction: 'incoming', policy: 'deny' }
    - { direction: 'outgoing', policy: 'allow' }

- name: Allow SSH
  ufw:
    rule: allow
    port: "{{ ssh_port | default('22') }}"
    proto: tcp

- name: Allow HTTP/HTTPS
  ufw:
    rule: allow
    port: "{{ item }}"
    proto: tcp
  loop:
    - '80'
    - '443'
  when: allow_web | default(false)

- name: Enable UFW
  ufw:
    state: enabled

- name: Disable root SSH login
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: '^#?PermitRootLogin'
    line: 'PermitRootLogin no'
  notify: Restart SSH

- name: Disable password authentication
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: '^#?PasswordAuthentication'
    line: 'PasswordAuthentication no'
  notify: Restart SSH
  when: disable_password_auth | default(false)
```

---

### Site Playbook

**playbooks/site.yaml**:
```yaml
---
- name: Configure all servers
  hosts: all
  become: yes
  
  roles:
    - common
    - security

- name: Configure web servers
  hosts: webservers
  become: yes
  
  roles:
    - nginx
    - monitoring

- name: Configure database servers
  hosts: databases
  become: yes
  
  roles:
    - postgresql
    - monitoring
```

---

## 🌍 Ansible Galaxy

**Ansible Galaxy**: Public repository of community roles.

### Search Galaxy

```bash
# Search for roles
ansible-galaxy search nginx

# Search with filters
ansible-galaxy search nginx --platforms Ubuntu

# Search by author
ansible-galaxy search --author geerlingguy
```

---

### Install Role from Galaxy

```bash
# Install role
ansible-galaxy install geerlingguy.nginx

# Install specific version
ansible-galaxy install geerlingguy.nginx,2.8.0

# Install to specific path
ansible-galaxy install geerlingguy.nginx -p ./roles

# Install from requirements file
ansible-galaxy install -r requirements.yaml
```

---

### Requirements File

**requirements.yaml**:
```yaml
---
# From Galaxy
- name: geerlingguy.nginx
  version: 2.8.0

- name: geerlingguy.postgresql
  version: 3.4.0

# From Git repository
- src: https://github.com/company/ansible-role-custom
  version: main
  name: custom

# From GitHub
- src: git+https://github.com/company/ansible-role-app.git
  version: v1.0.0
  name: app
```

**Install all**:
```bash
ansible-galaxy install -r requirements.yaml
```

---

### Use Galaxy Role

```yaml
---
- name: Configure servers
  hosts: webservers
  become: yes
  
  roles:
    - geerlingguy.nginx
    - geerlingguy.postgresql
```

---

### Publish Your Role

**1. Create role on Galaxy** (GitHub integration)

**2. Push to GitHub**:
```bash
cd roles/my-role
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/user/ansible-role-my-role.git
git push -u origin main
```

**3. Import to Galaxy**:
- Login to galaxy.ansible.com
- My Content → Import
- Select repository

---

## 🎯 Advanced Role Patterns

### Role with Multiple Task Files

**roles/app/tasks/main.yaml**:
```yaml
---
- import_tasks: install.yaml
- import_tasks: configure.yaml
- import_tasks: deploy.yaml
- import_tasks: monitoring.yaml
```

**roles/app/tasks/install.yaml**:
```yaml
---
- name: Install dependencies
  apt:
    name:
      - python3
      - python3-pip
    state: present

# ... more install tasks
```

---

### Conditional Task Inclusion

```yaml
---
- name: Include OS-specific tasks
  include_tasks: "{{ ansible_os_family }}.yaml"

- name: Include environment-specific tasks
  include_tasks: "{{ env }}.yaml"
  when: env is defined
```

---

### Role Variables Priority

**Priority order** (highest to lowest):
1. Extra vars (`-e` on command line)
2. Task vars
3. Block vars
4. Role vars (`roles/x/vars/main.yaml`)
5. Play vars
6. Host facts
7. Host vars
8. Group vars
9. Role defaults (`roles/x/defaults/main.yaml`)

---

## 🧪 Testing Roles

### Molecule

**Install**:
```bash
pip install molecule molecule-docker
```

**Initialize**:
```bash
cd roles/nginx
molecule init scenario
```

**Test**:
```bash
# Create test instance
molecule create

# Run converge (apply role)
molecule converge

# Run tests
molecule verify

# Destroy instance
molecule destroy

# Full test cycle
molecule test
```

---

### Simple Test Playbook

**roles/nginx/tests/test.yaml**:
```yaml
---
- name: Test nginx role
  hosts: localhost
  remote_user: root
  
  roles:
    - nginx
  
  post_tasks:
    - name: Check if Nginx is running
      service:
        name: nginx
        state: started
      check_mode: yes
      register: result
      failed_when: result.changed

    - name: Check if Nginx responds
      uri:
        url: http://localhost
        status_code: 200
```

---

## 💡 Best Practices

### 1. Use Defaults

```yaml
# roles/app/defaults/main.yaml
---
app_port: 8080
app_workers: 4
app_log_level: info
```

Users can override easily:
```yaml
roles:
  - role: app
    vars:
      app_port: 9000
```

---

### 2. Document Your Role

**README.md**:
```markdown
# Nginx Role

Installs and configures Nginx web server.

## Requirements

- Ansible 2.9+
- Ubuntu 20.04+

## Role Variables

- `nginx_port`: Port to listen on (default: 80)
- `nginx_worker_processes`: Number of worker processes (default: auto)

## Dependencies

None

## Example Playbook

\`\`\`yaml
- hosts: webservers
  roles:
    - role: nginx
      nginx_port: 8080
\`\`\`

## License

MIT
```

---

### 3. Keep Roles Focused

```bash
# Good: Focused roles
roles/
├── nginx/
├── postgresql/
└── redis/

# Bad: God role
roles/
└── everything/  # Does too much!
```

---

### 4. Use Meta Dependencies

```yaml
# roles/webapp/meta/main.yaml
dependencies:
  - common  # Always needed
  - nginx   # Web server
```

---

### 5. Version Your Roles

**Git tags**:
```bash
git tag v1.0.0
git push --tags
```

**Semantic versioning**: major.minor.patch
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

---

## 🔗 What's Next?

Now that you can create and use roles:

**Security**:
- **[ansible-vault](ansible-vault)** - Encrypt sensitive data

**Advanced Patterns**:
- **[ansible-patterns](ansible-patterns)** - Production patterns

**Testing**:
- **[ansible-testing](ansible-testing)** - Test your automation

---

## 📚 Resources

**Official Docs**:
- [Roles](https://docs.ansible.com/ansible/latest/user_guide/playbooks_reuse_roles.html)
- [Ansible Galaxy](https://galaxy.ansible.com/)
- [Galaxy CLI](https://docs.ansible.com/ansible/latest/cli/ansible-galaxy.html)

**Popular Roles**:
- [geerlingguy roles](https://galaxy.ansible.com/geerlingguy)
- [Ansible Community](https://galaxy.ansible.com/ansible)

**Testing**:
- [Molecule](https://molecule.readthedocs.io/)

---

## 📝 Change Log

### 2026-01-30
- Created Ansible roles guide
- Explained role structure and components
- Demonstrated role creation process
- Covered variables and defaults
- Included role dependencies
- Introduced Ansible Galaxy
- Provided multi-role examples
- Added testing overview
- Included best practices

---

**Next Article**: [ansible-vault](ansible-vault) - Secure your secrets!

