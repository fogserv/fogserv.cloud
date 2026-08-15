# Ansible Patterns - Production Best Practices

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Configuration Management  
**Prerequisites**: [ansible-roles](ansible-roles), [ansible-vault](ansible-vault)  
**Time**: 3-4 hours  
**Tags**: ansible, patterns, best-practices, production, deployment

## Summary

Master production-ready Ansible patterns for reliable, maintainable infrastructure automation. Learn rolling deployments, blue-green patterns, immutable infrastructure, testing strategies, and organizational best practices used by successful engineering teams.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Implement rolling deployments
- ✅ Execute blue-green deployments
- ✅ Build immutable infrastructure patterns
- ✅ Organize large Ansible projects
- ✅ Test your automation
- ✅ Implement proper error handling
- ✅ Optimize playbook performance

## 🔄 Rolling Deployments

### Basic Rolling Update

```yaml
---
- name: Rolling update web servers
  hosts: webservers
  serial: 2  # Update 2 servers at a time
  
  pre_tasks:
    - name: Remove from load balancer
      haproxy:
        state: disabled
        host: "{{ inventory_hostname }}"
        backend: web_backend
      delegate_to: "{{ item }}"
      loop: "{{ groups['loadbalancers'] }}"
  
  tasks:
    - name: Pull latest code
      git:
        repo: https://github.com/company/app.git
        dest: /opt/app
        version: "{{ app_version }}"
    
    - name: Install dependencies
      pip:
        requirements: /opt/app/requirements.txt
    
    - name: Restart application
      systemd:
        name: myapp
        state: restarted
    
    - name: Wait for app to be ready
      uri:
        url: "http://localhost:8080/health"
        status_code: 200
      register: result
      until: result.status == 200
      retries: 30
      delay: 2
  
  post_tasks:
    - name: Add back to load balancer
      haproxy:
        state: enabled
        host: "{{ inventory_hostname }}"
        backend: web_backend
      delegate_to: "{{ item }}"
      loop: "{{ groups['loadbalancers'] }}"
```

---

### Serial with Percentage

```yaml
---
- name: Rolling update (25% at a time)
  hosts: webservers
  serial: "25%"  # Update quarter of fleet at once
  
  tasks:
    - name: Deploy application
      include_role:
        name: app_deploy
```

---

### Serial with Max Failure

```yaml
---
- name: Rolling update with failure threshold
  hosts: webservers
  serial: 3
  max_fail_percentage: 20  # Stop if >20% fail
  
  tasks:
    - name: Deploy
      include_tasks: deploy.yaml
```

---

## 🔵🟢 Blue-Green Deployments

### Blue-Green Pattern

**Inventory**:
```yaml
# inventories/production/hosts.yaml
all:
  children:
    webservers_blue:
      hosts:
        web1:
          ansible_host: 10.0.1.10
          app_version: v1.0.0
        web2:
          ansible_host: 10.0.1.11
          app_version: v1.0.0
    
    webservers_green:
      hosts:
        web3:
          ansible_host: 10.0.1.20
          app_version: v1.1.0
        web4:
          ansible_host: 10.0.1.21
          app_version: v1.1.0
    
    loadbalancers:
      hosts:
        lb1:
          ansible_host: 10.0.1.100
```

---

**Playbook**:
```yaml
---
- name: Deploy to green environment
  hosts: webservers_green
  
  tasks:
    - name: Deploy new version
      include_role:
        name: app_deploy
      vars:
        app_version: "{{ new_version }}"
    
    - name: Run smoke tests
      uri:
        url: "http://{{ ansible_host }}:8080/health"
        status_code: 200
      register: health_check
      failed_when: health_check.status != 200

- name: Switch traffic to green
  hosts: loadbalancers
  
  tasks:
    - name: Update load balancer config
      template:
        src: haproxy.cfg.j2
        dest: /etc/haproxy/haproxy.cfg
      vars:
        active_backend: green
      notify: Reload HAProxy
    
    - name: Wait for traffic switch
      pause:
        seconds: 10
  
  handlers:
    - name: Reload HAProxy
      systemd:
        name: haproxy
        state: reloaded

- name: Verify green is healthy
  hosts: webservers_green
  
  tasks:
    - name: Check application logs
      command: tail -n 100 /var/log/app/error.log
      register: logs
      failed_when: "'ERROR' in logs.stdout"
    
    - name: Check error rate
      uri:
        url: "http://{{ ansible_host }}:8080/metrics"
      register: metrics
      failed_when: metrics.json.error_rate > 0.01

- name: Decommission blue (optional)
  hosts: webservers_blue
  
  tasks:
    - name: Stop old version
      systemd:
        name: myapp
        state: stopped
    
    - name: Keep blue for rollback
      debug:
        msg: "Blue environment kept for 24h rollback window"
```

---

### Rollback Playbook

```yaml
---
- name: Rollback to blue
  hosts: loadbalancers
  
  tasks:
    - name: Switch traffic back to blue
      template:
        src: haproxy.cfg.j2
        dest: /etc/haproxy/haproxy.cfg
      vars:
        active_backend: blue
      notify: Reload HAProxy
  
  handlers:
    - name: Reload HAProxy
      systemd:
        name: haproxy
        state: reloaded

- name: Restart blue servers
  hosts: webservers_blue
  
  tasks:
    - name: Ensure blue is running
      systemd:
        name: myapp
        state: started
```

---

## 📦 Immutable Infrastructure

### Build AMI/Image Pattern

```yaml
---
- name: Build application image
  hosts: localhost
  connection: local
  
  tasks:
    - name: Launch temporary instance
      ec2_instance:
        name: "image-builder-{{ ansible_date_time.epoch }}"
        image_id: ami-ubuntu-22.04
        instance_type: t3.medium
        wait: yes
      register: build_instance
    
    - name: Add to inventory
      add_host:
        name: "{{ build_instance.instances[0].public_ip }}"
        groups: image_builders
        ansible_ssh_private_key_file: ~/.ssh/aws.pem

- name: Configure image
  hosts: image_builders
  become: yes
  
  roles:
    - common
    - app_install
    - monitoring
  
  post_tasks:
    - name: Clean up
      command: cloud-init clean
    
    - name: Remove SSH keys
      file:
        path: /home/ubuntu/.ssh/authorized_keys
        state: absent

- name: Create AMI
  hosts: localhost
  connection: local
  
  tasks:
    - name: Create image
      ec2_ami:
        instance_id: "{{ build_instance.instances[0].instance_id }}"
        name: "myapp-{{ app_version }}-{{ ansible_date_time.epoch }}"
        wait: yes
      register: new_ami
    
    - name: Tag AMI
      ec2_tag:
        resource: "{{ new_ami.image_id }}"
        tags:
          Name: "myapp-{{ app_version }}"
          Version: "{{ app_version }}"
          BuildDate: "{{ ansible_date_time.iso8601 }}"
    
    - name: Terminate build instance
      ec2_instance:
        instance_ids: "{{ build_instance.instances[0].instance_id }}"
        state: absent

- name: Deploy new instances
  hosts: localhost
  connection: local
  
  tasks:
    - name: Update Auto Scaling Group
      ec2_asg:
        name: myapp-asg
        launch_config_name: "myapp-lc-{{ app_version }}"
        min_size: 3
        max_size: 10
        desired_capacity: 3
        health_check_type: ELB
        health_check_period: 300
        replace_all_instances: yes
        wait_for_instances: yes
```

---

## 📂 Project Organization

### Large Project Structure

```
ansible-project/
├── ansible.cfg
├── requirements.yaml              # Galaxy roles
├── .gitignore
├── .ansible-lint
│
├── inventories/
│   ├── production/
│   │   ├── hosts.yaml
│   │   ├── group_vars/
│   │   │   ├── all/
│   │   │   │   ├── vars.yaml
│   │   │   │   └── vault.yaml
│   │   │   ├── webservers.yaml
│   │   │   └── databases.yaml
│   │   └── host_vars/
│   │       └── web1.yaml
│   ├── staging/
│   │   └── ...
│   └── development/
│       └── ...
│
├── playbooks/
│   ├── site.yaml                  # Master playbook
│   ├── webservers.yaml            # Web server playbook
│   ├── databases.yaml             # Database playbook
│   ├── deploy.yaml                # Deployment playbook
│   └── rollback.yaml              # Rollback playbook
│
├── roles/
│   ├── common/                    # Base configuration
│   ├── nginx/                     # Web server
│   ├── postgresql/                # Database
│   ├── monitoring/                # Monitoring agents
│   └── security/                  # Security hardening
│
├── group_vars/                    # Shared group vars
│   └── all.yaml
│
├── library/                       # Custom modules
│   └── my_custom_module.py
│
├── filter_plugins/                # Custom filters
│   └── my_filters.py
│
├── tasks/                         # Reusable task files
│   ├── ssl_setup.yaml
│   └── backup.yaml
│
├── templates/                     # Shared templates
│   └── maintenance.html.j2
│
├── files/                         # Shared files
│   └── company_ca.crt
│
└── scripts/                       # Helper scripts
    ├── deploy.sh
    └── vault-pass.sh
```

---

### Master Playbook Pattern

**playbooks/site.yaml**:
```yaml
---
# Master playbook - orchestrates everything
- import_playbook: common.yaml
- import_playbook: security.yaml
- import_playbook: monitoring.yaml
- import_playbook: webservers.yaml
- import_playbook: databases.yaml
- import_playbook: cache.yaml
```

**Run everything**:
```bash
ansible-playbook playbooks/site.yaml -i inventories/production
```

**Run specific parts**:
```bash
ansible-playbook playbooks/webservers.yaml -i inventories/production
```

---

## 🧪 Testing Strategies

### Pre-Flight Checks

```yaml
---
- name: Pre-flight checks
  hosts: all
  gather_facts: yes
  
  tasks:
    - name: Verify connectivity
      ping:
    
    - name: Check disk space
      assert:
        that:
          - ansible_mounts | selectattr('mount', 'equalto', '/') | map(attribute='size_available') | first > 1073741824
        fail_msg: "Less than 1GB free space on /"
    
    - name: Check memory
      assert:
        that:
          - ansible_memfree_mb > 512
        fail_msg: "Less than 512MB free memory"
    
    - name: Verify required ports available
      wait_for:
        port: "{{ item }}"
        state: stopped
        timeout: 1
      loop:
        - 80
        - 443
      when: "'webservers' in group_names"
      ignore_errors: yes
      register: port_check
    
    - name: Fail if ports in use
      fail:
        msg: "Port {{ item.item }} already in use"
      when: item.failed is defined and not item.failed
      loop: "{{ port_check.results }}"
```

---

### Smoke Tests

```yaml
---
- name: Smoke tests
  hosts: webservers
  
  tasks:
    - name: Wait for application
      wait_for:
        port: 8080
        timeout: 60
    
    - name: Check health endpoint
      uri:
        url: "http://localhost:8080/health"
        status_code: 200
      register: health
      retries: 10
      delay: 5
      until: health.status == 200
    
    - name: Verify database connection
      uri:
        url: "http://localhost:8080/health/db"
        status_code: 200
    
    - name: Check application version
      uri:
        url: "http://localhost:8080/version"
      register: version
      failed_when: version.json.version != app_version
```

---

### Integration Tests

```yaml
---
- name: Integration tests
  hosts: localhost
  connection: local
  
  tasks:
    - name: Create test user
      uri:
        url: "https://api.example.com/users"
        method: POST
        body_format: json
        body:
          username: "test_{{ ansible_date_time.epoch }}"
          email: "test@example.com"
        status_code: 201
      register: test_user
    
    - name: Login as test user
      uri:
        url: "https://api.example.com/login"
        method: POST
        body_format: json
        body:
          username: "{{ test_user.json.username }}"
          password: "testpass"
        status_code: 200
      register: login
    
    - name: Create test data
      uri:
        url: "https://api.example.com/data"
        method: POST
        headers:
          Authorization: "Bearer {{ login.json.token }}"
        body_format: json
        body:
          name: "Test Item"
        status_code: 201
      register: test_data
    
    - name: Retrieve test data
      uri:
        url: "https://api.example.com/data/{{ test_data.json.id }}"
        headers:
          Authorization: "Bearer {{ login.json.token }}"
        status_code: 200
      register: retrieved_data
      failed_when: retrieved_data.json.name != "Test Item"
    
    - name: Cleanup test data
      uri:
        url: "https://api.example.com/data/{{ test_data.json.id }}"
        method: DELETE
        headers:
          Authorization: "Bearer {{ login.json.token }}"
        status_code: 204
```

---

## 🎯 Error Handling Patterns

### Graceful Degradation

```yaml
---
- name: Deploy with fallback
  hosts: webservers
  
  tasks:
    - name: Try to pull from primary registry
      docker_image:
        name: "registry1.example.com/myapp:{{ version }}"
        source: pull
      register: primary_pull
      ignore_errors: yes
    
    - name: Fall back to secondary registry
      docker_image:
        name: "registry2.example.com/myapp:{{ version }}"
        source: pull
      when: primary_pull is failed
      register: secondary_pull
      ignore_errors: yes
    
    - name: Use cached image as last resort
      docker_image:
        name: "myapp:latest"
        source: pull
      when:
        - primary_pull is failed
        - secondary_pull is failed
```

---

### Retry Logic

```yaml
---
- name: Deploy with retries
  hosts: webservers
  
  tasks:
    - name: Download artifact
      get_url:
        url: "https://releases.example.com/app-{{ version }}.tar.gz"
        dest: "/tmp/app-{{ version }}.tar.gz"
      register: download
      retries: 5
      delay: 10
      until: download is succeeded
    
    - name: Extract with verification
      unarchive:
        src: "/tmp/app-{{ version }}.tar.gz"
        dest: /opt/app
        remote_src: yes
      register: extract
      retries: 3
      delay: 5
      until: extract is succeeded
```

---

### Atomic Operations

```yaml
---
- name: Atomic deployment
  hosts: webservers
  
  tasks:
    - name: Create temporary directory
      tempfile:
        state: directory
        suffix: deploy
      register: temp_dir
    
    - block:
        - name: Deploy to temporary location
          synchronize:
            src: /local/app/
            dest: "{{ temp_dir.path }}/"
        
        - name: Verify deployment
          command: "{{ temp_dir.path }}/bin/verify.sh"
        
        - name: Atomic switch
          command: "mv {{ temp_dir.path }} /opt/app-new && mv /opt/app /opt/app-old && mv /opt/app-new /opt/app"
          args:
            removes: "{{ temp_dir.path }}"
      
      rescue:
        - name: Cleanup on failure
          file:
            path: "{{ temp_dir.path }}"
            state: absent
        
        - name: Rollback if needed
          command: "mv /opt/app-old /opt/app"
          when: app_old_exists
      
      always:
        - name: Remove old version
          file:
            path: /opt/app-old
            state: absent
          ignore_errors: yes
```

---

## ⚡ Performance Optimization

### Parallel Execution

```yaml
---
- name: Fast deployment
  hosts: webservers
  strategy: free  # Don't wait for all hosts
  
  tasks:
    - name: Download (runs immediately when host is ready)
      get_url:
        url: "{{ artifact_url }}"
        dest: /tmp/artifact.tar.gz
```

---

### Fact Caching

**ansible.cfg**:
```ini
[defaults]
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts
fact_caching_timeout = 3600

# Or use Redis
# fact_caching = redis
# fact_caching_connection = localhost:6379:0
```

---

### Minimize Fact Gathering

```yaml
---
- name: Quick tasks
  hosts: all
  gather_facts: no  # Skip if not needed
  
  tasks:
    - name: Simple command
      command: echo "Hello"
```

---

### Pipeline Optimization

**ansible.cfg**:
```ini
[ssh_connection]
pipelining = True
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

---

## 📋 Deployment Checklist

### Pre-Deployment

```yaml
---
- name: Pre-deployment checklist
  hosts: localhost
  connection: local
  
  tasks:
    - name: Verify version tag exists
      uri:
        url: "https://github.com/company/app/releases/tag/{{ version }}"
        status_code: 200
    
    - name: Check artifact is built
      uri:
        url: "https://releases.example.com/app-{{ version }}.tar.gz"
        method: HEAD
        status_code: 200
    
    - name: Verify database migrations
      command: "git diff {{ current_version }}..{{ version }} -- migrations/"
      register: migration_check
      changed_when: false
    
    - name: Alert if migrations exist
      debug:
        msg: "WARNING: Database migrations detected!"
      when: migration_check.stdout != ""
    
    - name: Check production load
      uri:
        url: "https://monitoring.example.com/api/v1/query?query=rate(http_requests_total[5m])"
      register: load_check
    
    - name: Warn if high load
      fail:
        msg: "High load detected. Consider deploying off-peak."
      when: load_check.json.data.result[0].value[1] | float > 1000
      ignore_errors: yes
```

---

## 🔗 What's Next?

**Infrastructure as Code**:
- **[terraform-basics](terraform-basics)** - Provision infrastructure
- **[terraform-providers](terraform-providers)** - Cloud providers

**Testing**:
- **[infrastructure-testing](infrastructure-testing)** - Test your automation

**GitOps**:
- **[gitops-principles](gitops-principles)** - Git as source of truth

---

## 📚 Resources

**Books**:
- "Ansible for DevOps" by Jeff Geerling
- "Ansible: Up and Running" by Lorin Hochstein

**Best Practices**:
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)
- [Ansible Tips and Tricks](https://docs.ansible.com/ansible/latest/user_guide/playbooks_strategies.html)

**Testing**:
- [Molecule](https://molecule.readthedocs.io/)
- [Ansible Lint](https://ansible-lint.readthedocs.io/)

---

## 📝 Change Log

### 2026-01-30
- Created production patterns guide
- Covered rolling deployments
- Demonstrated blue-green deployments
- Included immutable infrastructure
- Provided project organization
- Added testing strategies
- Showed error handling patterns
- Included performance optimization
- Provided deployment checklist

---

**Next Article**: [terraform-basics](terraform-basics) - Infrastructure as Code!

