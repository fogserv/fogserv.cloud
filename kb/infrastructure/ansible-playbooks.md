# Ansible Playbooks - Advanced Automation Techniques

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Configuration Management  
**Prerequisites**: [ansible-basics](ansible-basics), [ansible-inventory](ansible-inventory)  
**Time**: 4-5 hours  
**Tags**: ansible, playbooks, tasks, handlers, conditionals, loops, error-handling

## Summary

Master advanced Ansible playbook techniques to build robust, maintainable automation. Learn conditionals, loops, error handling, delegation, async tasks, blocks, and playbook organization patterns for production-ready infrastructure code.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Write advanced playbooks with conditionals and loops
- ✅ Handle errors gracefully
- ✅ Use blocks for error handling and task grouping
- ✅ Delegate tasks to specific hosts
- ✅ Run tasks asynchronously
- ✅ Use tags effectively
- ✅ Import and include playbooks/tasks
- ✅ Optimize playbook performance

## 🔁 Loops

### Basic Loop

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
```

---

### Loop with Dictionary

```yaml
- name: Create users
  user:
    name: "{{ item.name }}"
    groups: "{{ item.groups }}"
    state: present
  loop:
    - { name: 'alice', groups: 'sudo' }
    - { name: 'bob', groups: 'docker' }
    - { name: 'charlie', groups: 'www-data' }
```

---

### Loop with Complex Data

```yaml
- name: Configure websites
  template:
    src: "{{ item.template }}"
    dest: "/etc/nginx/sites-available/{{ item.name }}"
  loop:
    - name: example.com
      template: website.conf.j2
      port: 80
      ssl: true
    - name: api.example.com
      template: api.conf.j2
      port: 8080
      ssl: false
  notify: Restart Nginx
```

---

### Loop Control

```yaml
- name: Install packages with index
  apt:
    name: "{{ item }}"
    state: present
  loop:
    - nginx
    - postgresql
    - redis
  loop_control:
    index_var: package_index
    label: "{{ item }}"  # Only show item in output (not full dict)
    pause: 2  # Pause 2 seconds between iterations

- name: Show progress
  debug:
    msg: "Installing package {{ package_index + 1 }}: {{ item }}"
```

---

### Loop Until

```yaml
- name: Wait for service to be ready
  uri:
    url: "http://localhost:8080/health"
    status_code: 200
  register: result
  until: result.status == 200
  retries: 10
  delay: 5
```

---

### Loop with Register

```yaml
- name: Check service status
  systemd:
    name: "{{ item }}"
  register: service_status
  loop:
    - nginx
    - postgresql
    - redis

- name: Show results
  debug:
    msg: "{{ item.name }} is {{ item.status.ActiveState }}"
  loop: "{{ service_status.results }}"
```

---

## 🔀 Conditionals

### Basic When

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
```

---

### Multiple Conditions

```yaml
# AND conditions
- name: Run on production web servers
  command: /usr/local/bin/deploy.sh
  when:
    - env == "production"
    - inventory_hostname in groups['webservers']
    - ansible_distribution == "Ubuntu"

# OR conditions
- name: Install on Ubuntu or Debian
  apt:
    name: nginx
    state: present
  when: ansible_distribution == "Ubuntu" or ansible_distribution == "Debian"

# Complex logic
- name: Complex condition
  command: /usr/local/bin/script.sh
  when: (ansible_distribution == "Ubuntu" and ansible_distribution_version == "22.04") or
        (ansible_distribution == "Debian" and ansible_distribution_major_version == "11")
```

---

### Conditionals with Variables

```yaml
- name: Check if variable is defined
  debug:
    msg: "Database URL is set"
  when: database_url is defined

- name: Check if variable is undefined
  debug:
    msg: "No database URL configured"
  when: database_url is not defined

- name: Check if list is empty
  debug:
    msg: "No servers in list"
  when: server_list | length == 0

- name: Check variable content
  debug:
    msg: "SSL is enabled"
  when: ssl_enabled | bool
```

---

### Conditionals with Facts

```yaml
- name: Increase memory limit on large servers
  lineinfile:
    path: /etc/app/config.ini
    line: "memory_limit=4G"
  when: ansible_memtotal_mb > 8192

- name: Configure for SSD
  lineinfile:
    path: /etc/postgresql/postgresql.conf
    line: "random_page_cost=1.1"
  when: "'ssd' in ansible_devices.sda.model | lower"

- name: Install 32-bit libraries
  apt:
    name: libc6-i386
    state: present
  when: ansible_architecture == "x86_64"
```

---

### Conditionals in Loops

```yaml
- name: Install production packages only
  apt:
    name: "{{ item.name }}"
    state: present
  loop:
    - { name: 'nginx', env: 'both' }
    - { name: 'postgresql', env: 'both' }
    - { name: 'debug-tools', env: 'dev' }
  when: item.env == 'both' or item.env == env
```

---

## 🎯 Blocks and Error Handling

### Basic Block

```yaml
- name: Configure web server
  block:
    - name: Install Nginx
      apt:
        name: nginx
        state: present
    
    - name: Copy config
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
    
    - name: Start Nginx
      service:
        name: nginx
        state: started
  when: ansible_distribution == "Ubuntu"
```

---

### Block with Rescue

```yaml
- name: Deploy application
  block:
    - name: Pull latest code
      git:
        repo: https://github.com/user/app.git
        dest: /opt/app
        version: main
    
    - name: Install dependencies
      pip:
        requirements: /opt/app/requirements.txt
    
    - name: Restart application
      systemd:
        name: myapp
        state: restarted
  
  rescue:
    - name: Rollback to previous version
      command: /usr/local/bin/rollback.sh
    
    - name: Send alert
      mail:
        to: ops@example.com
        subject: "Deployment failed on {{ inventory_hostname }}"
        body: "Rollback initiated"
```

---

### Block with Always

```yaml
- name: Database maintenance
  block:
    - name: Stop application
      systemd:
        name: myapp
        state: stopped
    
    - name: Backup database
      postgresql_db:
        name: mydb
        state: dump
        target: /backup/db.sql
    
    - name: Run maintenance
      command: pg_repack mydb
  
  rescue:
    - name: Log error
      debug:
        msg: "Maintenance failed!"
  
  always:
    - name: Start application
      systemd:
        name: myapp
        state: started
```

---

## 🚨 Error Handling

### Ignore Errors

```yaml
- name: Try to install optional package
  apt:
    name: optional-package
    state: present
  ignore_errors: yes

- name: Continue even if this fails
  command: /usr/local/bin/might_fail.sh
  ignore_errors: yes
  register: result

- name: Show if it failed
  debug:
    msg: "Script failed but we continued"
  when: result is failed
```

---

### Failed When

```yaml
- name: Check disk space
  shell: df -h / | awk 'NR==2 {print $5}' | sed 's/%//'
  register: disk_usage
  failed_when: disk_usage.stdout | int > 90

- name: Run command
  command: /usr/local/bin/script.sh
  register: result
  failed_when:
    - result.rc != 0
    - "'expected error' not in result.stderr"
```

---

### Changed When

```yaml
- name: Check if restart needed
  command: /usr/local/bin/check_restart.sh
  register: result
  changed_when: result.stdout == "restart_needed"

- name: Custom change detection
  shell: echo "{{ config_content }}" > /etc/app/config.ini
  register: result
  changed_when: false  # Never report as changed
```

---

### Assert

```yaml
- name: Verify prerequisites
  assert:
    that:
      - ansible_distribution == "Ubuntu"
      - ansible_distribution_version >= "20.04"
      - ansible_memtotal_mb >= 2048
    fail_msg: "System does not meet requirements"
    success_msg: "Prerequisites met"
```

---

## 🏃 Delegation and Local Actions

### Delegate To

```yaml
- name: Update load balancer
  command: /usr/local/bin/update_lb.sh {{ inventory_hostname }}
  delegate_to: loadbalancer.example.com

- name: Run on database server
  postgresql_db:
    name: mydb
    state: present
  delegate_to: "{{ groups['databases'][0] }}"
```

---

### Local Action

```yaml
- name: Create backup locally
  local_action:
    module: copy
    src: /tmp/backup.sql
    dest: /backups/{{ inventory_hostname }}-{{ ansible_date_time.date }}.sql

# Or using delegate_to
- name: Run locally
  command: echo "Running on Ansible controller"
  delegate_to: localhost
```

---

### Run Once

```yaml
- name: Initialize database (only once)
  command: /usr/local/bin/init_db.sh
  run_once: true
  delegate_to: "{{ groups['databases'][0] }}"

- name: Send notification (once for all hosts)
  mail:
    to: ops@example.com
    subject: "Deployment started"
    body: "Deploying to {{ groups['webservers'] | length }} servers"
  run_once: true
  delegate_to: localhost
```

---

## ⏱️ Async and Polling

### Async Tasks

```yaml
- name: Long running task
  command: /usr/local/bin/long_task.sh
  async: 3600  # Max time (seconds)
  poll: 0      # Don't wait (fire and forget)
  register: long_task

- name: Check on async task later
  async_status:
    jid: "{{ long_task.ansible_job_id }}"
  register: job_result
  until: job_result.finished
  retries: 30
  delay: 10
```

---

### Async with Polling

```yaml
- name: Run backup
  shell: /usr/local/bin/backup.sh
  async: 1800
  poll: 30  # Check every 30 seconds
  register: backup_result
```

---

### Multiple Async Tasks

```yaml
- name: Start multiple tasks
  command: "/usr/local/bin/task_{{ item }}.sh"
  async: 300
  poll: 0
  loop:
    - 1
    - 2
    - 3
  register: async_tasks

- name: Wait for all tasks
  async_status:
    jid: "{{ item.ansible_job_id }}"
  loop: "{{ async_tasks.results }}"
  register: async_results
  until: async_results.finished
  retries: 30
  delay: 5
```

---

## 🏷️ Tags

### Basic Tags

```yaml
- name: Install packages
  apt:
    name: nginx
    state: present
  tags:
    - install
    - packages

- name: Configure service
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  tags:
    - config
    - nginx

- name: Start service
  service:
    name: nginx
    state: started
  tags:
    - service
```

**Run specific tags**:
```bash
# Run only install tasks
ansible-playbook site.yaml --tags install

# Run multiple tags
ansible-playbook site.yaml --tags "install,config"

# Skip specific tags
ansible-playbook site.yaml --skip-tags service
```

---

### Special Tags

```yaml
- name: Always run this
  debug:
    msg: "This always runs"
  tags: always

- name: Never run by default
  debug:
    msg: "Only runs with --tags never"
  tags: never

# Block tags
- name: Database setup
  tags: database
  block:
    - name: Install PostgreSQL
      apt:
        name: postgresql
        state: present
    
    - name: Configure PostgreSQL
      template:
        src: postgresql.conf.j2
        dest: /etc/postgresql/postgresql.conf
```

---

## 📥 Import and Include

### Import vs Include

**Import** (static, at parse time):
- Processed when playbook is parsed
- Cannot use variables or conditionals
- Better for debugging (clear flow)
- Faster execution

**Include** (dynamic, at runtime):
- Processed when reached during execution
- Can use variables and conditionals
- More flexible
- Slightly slower

---

### Import Playbook

```yaml
# site.yaml
---
- import_playbook: common.yaml
- import_playbook: webservers.yaml
- import_playbook: databases.yaml
```

---

### Import Tasks

```yaml
# main.yaml
---
- name: Configure server
  hosts: all
  tasks:
    - import_tasks: common_tasks.yaml
    - import_tasks: security_tasks.yaml
    - import_tasks: monitoring_tasks.yaml
```

**common_tasks.yaml**:
```yaml
---
- name: Update apt cache
  apt:
    update_cache: yes

- name: Install common packages
  apt:
    name:
      - curl
      - vim
      - git
    state: present
```

---

### Include Tasks (Dynamic)

```yaml
- name: Include OS-specific tasks
  include_tasks: "{{ ansible_os_family }}.yaml"

# Loads either Debian.yaml or RedHat.yaml

- name: Include with variables
  include_tasks: deploy.yaml
  vars:
    app_name: myapp
    app_version: "1.0"

- name: Conditional include
  include_tasks: ssl_setup.yaml
  when: ssl_enabled | bool
```

---

## 🎯 Real-World Playbook Examples

### Example 1: Complete Web Server Deployment

```yaml
---
- name: Deploy web application
  hosts: webservers
  become: yes
  
  vars:
    app_name: myapp
    app_version: "1.2.3"
    app_user: webapp
    deploy_dir: /opt/{{ app_name }}
  
  handlers:
    - name: Restart Nginx
      systemd:
        name: nginx
        state: restarted
    
    - name: Restart Application
      systemd:
        name: "{{ app_name }}"
        state: restarted
  
  tasks:
    - name: Prerequisites
      block:
        - name: Install system packages
          apt:
            name:
              - nginx
              - python3-pip
              - git
            state: present
            update_cache: yes
        
        - name: Create application user
          user:
            name: "{{ app_user }}"
            system: yes
            home: "{{ deploy_dir }}"
            shell: /bin/bash
      tags: setup
    
    - name: Deploy application
      block:
        - name: Create directories
          file:
            path: "{{ item }}"
            state: directory
            owner: "{{ app_user }}"
            group: "{{ app_user }}"
            mode: '0755'
          loop:
            - "{{ deploy_dir }}"
            - "{{ deploy_dir }}/releases"
            - "{{ deploy_dir }}/shared"
            - "{{ deploy_dir }}/shared/logs"
        
        - name: Clone repository
          git:
            repo: "https://github.com/company/{{ app_name }}.git"
            dest: "{{ deploy_dir }}/releases/{{ app_version }}"
            version: "v{{ app_version }}"
          become_user: "{{ app_user }}"
          notify: Restart Application
        
        - name: Install Python dependencies
          pip:
            requirements: "{{ deploy_dir }}/releases/{{ app_version }}/requirements.txt"
            virtualenv: "{{ deploy_dir }}/releases/{{ app_version }}/venv"
          become_user: "{{ app_user }}"
        
        - name: Create symlink to current release
          file:
            src: "{{ deploy_dir }}/releases/{{ app_version }}"
            dest: "{{ deploy_dir }}/current"
            state: link
          notify: Restart Application
      tags: deploy
    
    - name: Configure services
      block:
        - name: Configure systemd service
          template:
            src: templates/app.service.j2
            dest: /etc/systemd/system/{{ app_name }}.service
          notify: Restart Application
        
        - name: Configure Nginx
          template:
            src: templates/nginx.conf.j2
            dest: /etc/nginx/sites-available/{{ app_name }}
          notify: Restart Nginx
        
        - name: Enable Nginx site
          file:
            src: /etc/nginx/sites-available/{{ app_name }}
            dest: /etc/nginx/sites-enabled/{{ app_name }}
            state: link
          notify: Restart Nginx
        
        - name: Enable and start services
          systemd:
            name: "{{ item }}"
            enabled: yes
            state: started
          loop:
            - nginx
            - "{{ app_name }}"
      tags: config
    
    - name: Cleanup old releases
      shell: |
        cd {{ deploy_dir }}/releases
        ls -t | tail -n +4 | xargs rm -rf
      args:
        removes: "{{ deploy_dir }}/releases"
      tags: cleanup
```

---

### Example 2: Database Backup Playbook

```yaml
---
- name: Backup databases
  hosts: databases
  become: yes
  
  vars:
    backup_dir: /backup/postgresql
    retention_days: 7
    s3_bucket: company-backups
  
  tasks:
    - name: Ensure backup directory exists
      file:
        path: "{{ backup_dir }}"
        state: directory
        mode: '0700'
    
    - name: Get list of databases
      postgresql_query:
        query: SELECT datname FROM pg_database WHERE datistemplate = false
      become_user: postgres
      register: databases
    
    - name: Backup each database
      postgresql_db:
        name: "{{ item.datname }}"
        state: dump
        target: "{{ backup_dir }}/{{ item.datname }}-{{ ansible_date_time.date }}.sql.gz"
      become_user: postgres
      loop: "{{ databases.query_result }}"
      async: 3600
      poll: 0
      register: backup_jobs
    
    - name: Wait for backups to complete
      async_status:
        jid: "{{ item.ansible_job_id }}"
      loop: "{{ backup_jobs.results }}"
      register: backup_results
      until: backup_results.finished
      retries: 60
      delay: 10
    
    - name: Upload to S3
      aws_s3:
        bucket: "{{ s3_bucket }}"
        object: "{{ inventory_hostname }}/{{ item.datname }}-{{ ansible_date_time.date }}.sql.gz"
        src: "{{ backup_dir }}/{{ item.datname }}-{{ ansible_date_time.date }}.sql.gz"
        mode: put
      loop: "{{ databases.query_result }}"
      delegate_to: localhost
      run_once: true
    
    - name: Remove old backups
      find:
        paths: "{{ backup_dir }}"
        age: "{{ retention_days }}d"
        patterns: "*.sql.gz"
      register: old_backups
    
    - name: Delete old backups
      file:
        path: "{{ item.path }}"
        state: absent
      loop: "{{ old_backups.files }}"
```

---

## 🚀 Performance Optimization

### Disable Fact Gathering

```yaml
- name: Simple task playbook
  hosts: all
  gather_facts: no  # Skip fact gathering (faster!)
  
  tasks:
    - name: Do something
      command: echo "Hello"
```

---

### Selective Fact Gathering

```yaml
- name: Gather only network facts
  hosts: all
  gather_facts: yes
  gather_subset:
    - '!all'
    - network
```

---

### Pipelining

**ansible.cfg**:
```ini
[defaults]
pipelining = True

[ssh_connection]
pipelining = True
```

---

### Increase Forks

```ini
[defaults]
forks = 20  # Run on 20 hosts in parallel
```

---

### Strategy Plugins

```yaml
- name: Free strategy (don't wait for all hosts)
  hosts: all
  strategy: free
  tasks:
    - name: Task runs as soon as host is ready
      command: /usr/local/bin/task.sh
```

---

## 💡 Best Practices

### 1. Use Descriptive Names

```yaml
# Good
- name: Install Nginx web server for frontend application
  apt:
    name: nginx
    state: present

# Bad
- name: Install
  apt:
    name: nginx
```

---

### 2. Use Variables

```yaml
# Good
vars:
  app_port: 8080
  
tasks:
  - name: Configure app
    template:
      src: app.conf.j2
      dest: /etc/app/config
    vars:
      port: "{{ app_port }}"

# Bad (hardcoded)
tasks:
  - name: Configure app
    lineinfile:
      path: /etc/app/config
      line: "port=8080"
```

---

### 3. Idempotency

```yaml
# Good (idempotent)
- name: Ensure line exists
  lineinfile:
    path: /etc/hosts
    line: "192.168.1.10 myserver"
    state: present

# Bad (runs every time)
- name: Add line
  shell: echo "192.168.1.10 myserver" >> /etc/hosts
```

---

### 4. Error Handling

```yaml
# Always handle failures
- name: Critical deployment
  block:
    - name: Deploy application
      include_tasks: deploy.yaml
  rescue:
    - name: Rollback
      include_tasks: rollback.yaml
    - name: Alert team
      include_tasks: alert.yaml
  always:
    - name: Cleanup
      include_tasks: cleanup.yaml
```

---

## 🔗 What's Next?

Now that you can write advanced playbooks:

**Code Organization**:
- **[ansible-roles](ansible-roles)** - Organize with roles

**Security**:
- **[ansible-vault](ansible-vault)** - Encrypt secrets

**Patterns**:
- **[ansible-patterns](ansible-patterns)** - Production patterns

---

## 📚 Resources

**Official Docs**:
- [Playbooks](https://docs.ansible.com/ansible/latest/user_guide/playbooks.html)
- [Loops](https://docs.ansible.com/ansible/latest/user_guide/playbooks_loops.html)
- [Conditionals](https://docs.ansible.com/ansible/latest/user_guide/playbooks_conditionals.html)
- [Error Handling](https://docs.ansible.com/ansible/latest/user_guide/playbooks_error_handling.html)

---

## 📝 Change Log

### 2026-01-30
- Created advanced playbooks article
- Covered loops with all variants
- Explained conditionals and logic
- Demonstrated blocks and error handling
- Included delegation and async tasks
- Provided tagging strategies
- Showed import/include patterns
- Included real-world deployment examples
- Added performance optimization tips

---

**Next Article**: [ansible-roles](ansible-roles) - Organize your automation!

