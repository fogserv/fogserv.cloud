# Infrastructure Testing - Test Your IaC

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Testing & Validation  
**Prerequisites**: [terraform-basics](terraform-basics), [ansible-basics](ansible-basics)  
**Time**: 3-4 hours  
**Tags**: testing, terratest, infrastructure, iac, validation, quality

## Summary

Learn to test infrastructure code like application code. Master Terratest for Terraform, Molecule for Ansible, policy validation, and complete testing strategies for production infrastructure.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Write Terratest tests for Terraform
- ✅ Test Ansible playbooks with Molecule
- ✅ Validate configurations
- ✅ Implement testing strategies
- ✅ Use policy as code
- ✅ Run tests in CI/CD
- ✅ Test disaster recovery
- ✅ Validate security compliance

## 🧪 Why Test Infrastructure?

### Traditional Problems

**Without testing**:
```bash
# Developer makes change
terraform apply

# In production...
# 💥 Network misconfigured
# 💥 Wrong instance type
# 💥 Security group too permissive
# 💥 Database not accessible
```

**Manual validation**:
```bash
# SSH into every server
ssh server-1
# Check everything manually
systemctl status nginx
curl localhost
netstat -tulpn

# Time consuming
# Error prone
# Not repeatable
```

---

### Testing Benefits

```
┌──────────────────────────────────────────────┐
│         Infrastructure Testing                │
│                                              │
│  Unit Tests     → Test small parts           │
│  Integration    → Test components together   │
│  E2E Tests      → Test complete workflow     │
│  Policy Tests   → Enforce standards          │
│  Security Tests → Check vulnerabilities      │
│                                              │
│  Benefits:                                   │
│  ✓ Catch errors before production           │
│  ✓ Faster feedback                           │
│  ✓ Confident deployments                     │
│  ✓ Documentation via tests                   │
│  ✓ Regression prevention                     │
└──────────────────────────────────────────────┘
```

---

## 🔬 Terratest - Testing Terraform

### Installation

**Install Go** (Terratest is Go):
```bash
# Ubuntu
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# macOS
brew install go

# Windows
scoop install go

# Verify
go version
```

**Project structure**:
```
terraform-project/
├── main.tf
├── variables.tf
├── outputs.tf
└── test/
    ├── go.mod
    ├── go.sum
    └── basic_test.go
```

**Initialize Go module**:
```bash
cd test
go mod init github.com/myorg/terraform-project/test
go get github.com/gruntwork-io/terratest/modules/terraform
go get github.com/stretchr/testify/assert
```

---

### Basic Test

**Terraform module** (`main.tf`):
```hcl
variable "instance_name" {
  type = string
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  
  tags = {
    Name = var.instance_name
  }
}

output "instance_id" {
  value = aws_instance.web.id
}

output "public_ip" {
  value = aws_instance.web.public_ip
}
```

---

**Terratest** (`test/basic_test.go`):
```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestTerraformBasic(t *testing.T) {
    // Arrange
    terraformOptions := &terraform.Options{
        // Path to Terraform code
        TerraformDir: "../",
        
        // Variables to pass
        Vars: map[string]interface{}{
            "instance_name": "test-server",
        },
        
        // Disable color output for CI
        NoColor: true,
    }
    
    // Clean up resources after test
    defer terraform.Destroy(t, terraformOptions)
    
    // Act
    terraform.InitAndApply(t, terraformOptions)
    
    // Assert
    instanceID := terraform.Output(t, terraformOptions, "instance_id")
    assert.NotEmpty(t, instanceID)
    
    publicIP := terraform.Output(t, terraformOptions, "public_ip")
    assert.NotEmpty(t, publicIP)
}
```

---

**Run test**:
```bash
cd test
go test -v -timeout 30m

# Output:
# === RUN   TestTerraformBasic
# Initializing Terraform...
# Applying Terraform...
# Validating outputs...
# Destroying resources...
# --- PASS: TestTerraformBasic (245.32s)
# PASS
```

---

### Advanced Test - Web Server

**Terraform** (`main.tf`):
```hcl
variable "name" {
  type = string
}

resource "aws_security_group" "web" {
  name = "${var.name}-sg"
  
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

resource "aws_instance" "web" {
  ami             = "ami-0c55b159cbfafe1f0"
  instance_type   = "t3.micro"
  security_groups = [aws_security_group.web.name]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y nginx
    systemctl start nginx
    echo "Hello from $(hostname)" > /var/www/html/index.html
  EOF
  
  tags = {
    Name = var.name
  }
}

output "public_ip" {
  value = aws_instance.web.public_ip
}

output "url" {
  value = "http://${aws_instance.web.public_ip}"
}
```

---

**Test** (`test/web_server_test.go`):
```go
package test

import (
    "fmt"
    "testing"
    "time"
    
    http_helper "github.com/gruntwork-io/terratest/modules/http-helper"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestWebServer(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../",
        Vars: map[string]interface{}{
            "name": "test-web",
        },
    }
    
    defer terraform.Destroy(t, terraformOptions)
    
    // Deploy infrastructure
    terraform.InitAndApply(t, terraformOptions)
    
    // Get outputs
    publicIP := terraform.Output(t, terraformOptions, "public_ip")
    url := terraform.Output(t, terraformOptions, "url")
    
    // Verify outputs
    assert.NotEmpty(t, publicIP)
    assert.Contains(t, url, publicIP)
    
    // Wait for web server to start (user_data takes time)
    maxRetries := 30
    sleepBetweenRetries := 10 * time.Second
    
    // Test HTTP endpoint
    http_helper.HttpGetWithRetry(
        t,
        url,
        nil,
        200,
        "Hello from",
        maxRetries,
        sleepBetweenRetries,
    )
    
    // Additional assertions
    response := http_helper.HttpGet(t, url, nil)
    assert.Contains(t, response, "Hello from")
}
```

---

### Multiple Environments Test

**Test staging and production configs**:
```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestStagingEnvironment(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../environments/staging",
    }
    
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)
    
    // Verify staging has 2 instances
    instanceCount := terraform.OutputList(t, terraformOptions, "instance_ids")
    assert.Len(t, instanceCount, 2)
}

func TestProductionEnvironment(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../environments/production",
    }
    
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)
    
    // Verify production has 5 instances
    instanceCount := terraform.OutputList(t, terraformOptions, "instance_ids")
    assert.Len(t, instanceCount, 5)
    
    // Verify production has backups enabled
    backupEnabled := terraform.Output(t, terraformOptions, "backup_enabled")
    assert.Equal(t, "true", backupEnabled)
}
```

---

### Test Helpers

**Reusable functions** (`test/helpers.go`):
```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
)

// ApplyAndGetOutputs deploys Terraform and returns outputs
func ApplyAndGetOutputs(t *testing.T, dir string, vars map[string]interface{}) map[string]interface{} {
    options := &terraform.Options{
        TerraformDir: dir,
        Vars:         vars,
    }
    
    defer terraform.Destroy(t, options)
    terraform.InitAndApply(t, options)
    
    return terraform.OutputAll(t, options)
}

// ValidateSecurityGroup checks security group rules
func ValidateSecurityGroup(t *testing.T, sgID string, expectedPorts []int) {
    // Implementation using AWS SDK
    // ... check ingress rules match expectedPorts
}
```

**Use in tests**:
```go
func TestWebServerSimple(t *testing.T) {
    outputs := ApplyAndGetOutputs(t, "../", map[string]interface{}{
        "name": "test",
    })
    
    assert.NotEmpty(t, outputs["public_ip"])
}
```

---

## 🧬 Molecule - Testing Ansible

### Installation

```bash
# Install Molecule
pip install molecule molecule-docker ansible-lint

# Verify
molecule --version
```

---

### Initialize Molecule

**In Ansible role directory**:
```bash
cd roles/nginx
molecule init scenario

# Creates:
# molecule/
#   default/
#     molecule.yml
#     converge.yml
#     verify.yml
```

---

### Configuration

**Molecule config** (`molecule/default/molecule.yml`):
```yaml
---
dependency:
  name: galaxy

driver:
  name: docker

platforms:
  - name: ubuntu-22
    image: geerlingguy/docker-ubuntu2204-ansible:latest
    pre_build_image: true
    privileged: true
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:rw
    cgroupns_mode: host
    command: /lib/systemd/systemd
  
  - name: debian-12
    image: geerlingguy/docker-debian12-ansible:latest
    pre_build_image: true
    privileged: true
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:rw
    cgroupns_mode: host
    command: /lib/systemd/systemd

provisioner:
  name: ansible
  config_options:
    defaults:
      callbacks_enabled: ansible.posix.profile_tasks
  
verifier:
  name: ansible
```

---

**Converge playbook** (`molecule/default/converge.yml`):
```yaml
---
- name: Converge
  hosts: all
  become: true
  
  roles:
    - role: nginx
      vars:
        nginx_port: 8080
        nginx_user: www-data
```

---

**Verify playbook** (`molecule/default/verify.yml`):
```yaml
---
- name: Verify
  hosts: all
  gather_facts: false
  tasks:
    - name: Check nginx is installed
      ansible.builtin.package:
        name: nginx
        state: present
      check_mode: true
      register: package_check
      failed_when: package_check.changed
    
    - name: Check nginx is running
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
      check_mode: true
      register: service_check
      failed_when: service_check.changed
    
    - name: Check nginx is listening
      ansible.builtin.wait_for:
        port: 8080
        timeout: 10
    
    - name: Test HTTP endpoint
      ansible.builtin.uri:
        url: http://localhost:8080
        return_content: true
      register: http_result
      failed_when: "'Welcome to nginx' not in http_result.content"
    
    - name: Verify configuration file
      ansible.builtin.stat:
        path: /etc/nginx/nginx.conf
      register: config_file
      failed_when: not config_file.stat.exists
```

---

### Run Tests

```bash
# Full test sequence
molecule test

# Steps run:
# 1. lint       - Check syntax
# 2. destroy    - Clean old containers
# 3. create     - Create test containers
# 4. converge   - Run playbook
# 5. verify     - Run verification
# 6. destroy    - Clean up

# Individual steps
molecule create    # Create containers
molecule converge  # Run playbook
molecule verify    # Run tests
molecule destroy   # Clean up

# Login to container for debugging
molecule login --host ubuntu-22
```

---

### Advanced Verification with Testinfra

**Install**:
```bash
pip install pytest-testinfra
```

**Configure Molecule** (`molecule.yml`):
```yaml
verifier:
  name: testinfra
  options:
    v: 1  # Verbose
```

---

**Tests** (`molecule/default/tests/test_default.py`):
```python
import os
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']
).get_hosts('all')


def test_nginx_installed(host):
    """Nginx package is installed."""
    nginx = host.package("nginx")
    assert nginx.is_installed


def test_nginx_running(host):
    """Nginx service is running and enabled."""
    nginx = host.service("nginx")
    assert nginx.is_running
    assert nginx.is_enabled


def test_nginx_listening(host):
    """Nginx is listening on port 8080."""
    socket = host.socket("tcp://0.0.0.0:8080")
    assert socket.is_listening


def test_nginx_config(host):
    """Nginx configuration is valid."""
    config = host.file("/etc/nginx/nginx.conf")
    assert config.exists
    assert config.user == "root"
    assert config.mode == 0o644
    
    # Test configuration syntax
    cmd = host.run("nginx -t")
    assert cmd.rc == 0


def test_http_response(host):
    """HTTP endpoint returns 200."""
    cmd = host.run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8080")
    assert cmd.stdout.strip() == "200"


def test_default_page(host):
    """Default page contains expected content."""
    cmd = host.run("curl -s http://localhost:8080")
    assert "Welcome to nginx" in cmd.stdout
```

**Run tests**:
```bash
molecule test

# Output:
# tests/test_default.py::test_nginx_installed[ansible://ubuntu-22] PASSED
# tests/test_default.py::test_nginx_running[ansible://ubuntu-22] PASSED
# tests/test_default.py::test_nginx_listening[ansible://ubuntu-22] PASSED
# tests/test_default.py::test_nginx_config[ansible://ubuntu-22] PASSED
# tests/test_default.py::test_http_response[ansible://ubuntu-22] PASSED
# tests/test_default.py::test_default_page[ansible://ubuntu-22] PASSED
```

---

## ✅ Static Validation

### Terraform Validation

**Built-in checks**:
```bash
# Format check
terraform fmt -check -recursive

# Validate syntax
terraform validate

# Security scanning with tfsec
brew install tfsec
tfsec .

# Output:
# Result #1 HIGH Security group allows ingress from 0.0.0.0/0
# ────────────────────────────────────────────────────────────
#   main.tf:8-12
# ────────────────────────────────────────────────────────────
#    8    ingress {
#    9      from_port   = 22
#   10      to_port     = 22
#   11      cidr_blocks = ["0.0.0.0/0"]
#   12    }
# ────────────────────────────────────────────────────────────
```

**Pre-commit hooks** (`.pre-commit-config.yaml`):
```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
      - id: terraform_tflint
      - id: terraform_tfsec
```

```bash
# Install
pip install pre-commit
pre-commit install

# Now runs on every commit
git commit -m "Add infrastructure"
# Terraform fmt..................Passed
# Terraform validate.............Passed
# Terraform docs.................Passed
# Terraform tfsec................Failed
```

---

### Ansible Validation

**Syntax check**:
```bash
ansible-playbook playbook.yml --syntax-check
```

**Ansible Lint**:
```bash
ansible-lint playbook.yml

# Output:
# WARNING: Listing 3 violation(s) that are fatal
# fqcn[action-core]: Use FQDN for builtin module actions (apt).
# playbook.yml:10 Task/Handler: Install nginx
```

**Configuration** (`.ansible-lint`):
```yaml
skip_list:
  - yaml[line-length]
  - name[casing]

exclude_paths:
  - .github/
  - test/

warn_list:
  - experimental
```

---

## 📋 Policy as Code

### Open Policy Agent (OPA)

**Install**:
```bash
# Ubuntu
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa
sudo mv opa /usr/local/bin/

# macOS
brew install opa

# Verify
opa version
```

---

**Policy** (`policy/terraform.rego`):
```rego
package terraform

import future.keywords.if
import future.keywords.in

# Deny if instance type is too large
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    instance_type := resource.change.after.instance_type
    not instance_type in allowed_instance_types
    msg := sprintf("Instance type %s not allowed", [instance_type])
}

allowed_instance_types := [
    "t3.micro",
    "t3.small",
    "t3.medium"
]

# Deny if no tags
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    not resource.change.after.tags
    msg := "All instances must have tags"
}

# Deny if SSH open to world
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_security_group"
    rule := resource.change.after.ingress[_]
    rule.from_port == 22
    rule.cidr_blocks[_] == "0.0.0.0/0"
    msg := "SSH (port 22) must not be open to 0.0.0.0/0"
}

# Warn if no encryption
warn[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_ebs_volume"
    resource.change.after.encrypted == false
    msg := "EBS volume should be encrypted"
}
```

---

**Test policy**:
```bash
# Generate plan JSON
terraform plan -out=tfplan.binary
terraform show -json tfplan.binary > tfplan.json

# Evaluate policy
opa eval -d policy/ -i tfplan.json "data.terraform.deny"

# Output:
# [
#   "Instance type t3.large not allowed",
#   "SSH (port 22) must not be open to 0.0.0.0/0"
# ]

# Fail if violations
opa eval -d policy/ -i tfplan.json "data.terraform.deny" --fail
# Exit code: 1
```

---

### Conftest

**Simpler OPA wrapper**:
```bash
# Install
brew install conftest

# Or
curl -L https://github.com/open-policy-agent/conftest/releases/download/v0.45.0/conftest_0.45.0_Linux_x86_64.tar.gz | tar xz
sudo mv conftest /usr/local/bin/
```

**Policy** (`policy/terraform.rego`):
```rego
package main

import future.keywords.in

deny[msg] {
    resource := input.resource[_]
    resource.type == "aws_instance"
    not resource.values.instance_type in ["t3.micro", "t3.small"]
    msg := sprintf("Instance type %s too large", [resource.values.instance_type])
}

deny[msg] {
    resource := input.resource[_]
    resource.type == "aws_s3_bucket"
    resource.values.acl == "public-read"
    msg := "S3 buckets must not be public"
}
```

**Test**:
```bash
# Test Terraform plan
terraform plan -out=tfplan.binary
terraform show -json tfplan.binary | conftest test -

# Output:
# FAIL - stdin - Instance type t3.large too large
#
# 1 test, 0 passed, 0 warnings, 1 failure, 0 exceptions
```

---

## 🔄 Testing Strategy

### Test Pyramid

```
                 △
                ╱ ╲
               ╱   ╲
              ╱ E2E ╲           Few, slow, expensive
             ╱───────╲          Full system tests
            ╱         ╲
           ╱Integration╲        More, faster
          ╱─────────────╲       Component tests
         ╱               ╲
        ╱   Unit Tests    ╲     Many, fast, cheap
       ╱───────────────────╲    Validation, syntax
      ╱─────────────────────╲
```

---

### Unit Tests

**Fast, cheap, run frequently**:
```bash
# Terraform
terraform fmt -check
terraform validate
tfsec .

# Ansible
ansible-playbook --syntax-check
ansible-lint
```

**When**: Every commit, pre-commit hooks

---

### Integration Tests

**Test components together**:
```go
func TestWebServerWithDatabase(t *testing.T) {
    // Deploy database
    dbOptions := &terraform.Options{
        TerraformDir: "../modules/database",
    }
    defer terraform.Destroy(t, dbOptions)
    terraform.InitAndApply(t, dbOptions)
    
    // Get database endpoint
    dbEndpoint := terraform.Output(t, dbOptions, "endpoint")
    
    // Deploy web server with database
    webOptions := &terraform.Options{
        TerraformDir: "../modules/web",
        Vars: map[string]interface{}{
            "database_endpoint": dbEndpoint,
        },
    }
    defer terraform.Destroy(t, webOptions)
    terraform.InitAndApply(t, webOptions)
    
    // Test connection
    url := terraform.Output(t, webOptions, "url")
    http_helper.HttpGetWithRetry(t, url+"/health", nil, 200, "healthy", 10, 5*time.Second)
}
```

**When**: Before merge, nightly

---

### End-to-End Tests

**Test complete workflow**:
```go
func TestCompleteStack(t *testing.T) {
    // Deploy entire stack
    options := &terraform.Options{
        TerraformDir: "../",
    }
    defer terraform.Destroy(t, options)
    terraform.InitAndApply(t, options)
    
    // Get application URL
    url := terraform.Output(t, options, "app_url")
    
    // Test user workflow
    // 1. Register user
    registerResp := httpPost(t, url+"/register", `{"email":"test@example.com"}`)
    assert.Equal(t, 201, registerResp.StatusCode)
    
    // 2. Login
    loginResp := httpPost(t, url+"/login", `{"email":"test@example.com"}`)
    token := parseJSON(loginResp.Body)["token"]
    
    // 3. Create resource
    createResp := httpPost(t, url+"/items", `{"name":"test"}`, token)
    assert.Equal(t, 201, createResp.StatusCode)
    
    // 4. List resources
    listResp := httpGet(t, url+"/items", token)
    items := parseJSON(listResp.Body)
    assert.Len(t, items, 1)
}
```

**When**: Before release, weekly

---

## 🎯 Complete Example - Web Application

### Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── test/
│       ├── go.mod
│       ├── integration_test.go
│       └── e2e_test.go
├── ansible/
│   ├── playbook.yml
│   └── molecule/
│       └── default/
│           ├── molecule.yml
│           ├── converge.yml
│           └── verify.yml
├── policy/
│   └── terraform.rego
└── .github/
    └── workflows/
        └── test.yml
```

---

### Terraform Module

**main.tf**:
```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  
  tags = {
    Name        = "${var.name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.name}-public-${count.index + 1}"
  }
}

resource "aws_security_group" "web" {
  name   = "${var.name}-web-sg"
  vpc_id = aws_vpc.main.id
  
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
}

resource "aws_instance" "web" {
  count                  = var.instance_count
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[count.index % 2].id
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = templatefile("${path.module}/user-data.sh", {
    app_version = var.app_version
  })
  
  tags = {
    Name        = "${var.name}-web-${count.index + 1}"
    Environment = var.environment
    Version     = var.app_version
  }
}

resource "aws_lb" "web" {
  name               = "${var.name}-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "web" {
  name     = "${var.name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb_target_group_attachment" "web" {
  count            = var.instance_count
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.web[count.index].id
  port             = 80
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "load_balancer_dns" {
  value = aws_lb.web.dns_name
}

output "instance_ids" {
  value = aws_instance.web[*].id
}
```

---

### Integration Test

**test/integration_test.go**:
```go
package test

import (
    "fmt"
    "testing"
    "time"
    
    http_helper "github.com/gruntwork-io/terratest/modules/http-helper"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestWebApplication(t *testing.T) {
    t.Parallel()
    
    terraformOptions := &terraform.Options{
        TerraformDir: "../",
        Vars: map[string]interface{}{
            "name":           "test-app",
            "environment":    "test",
            "vpc_cidr":       "10.0.0.0/16",
            "instance_count": 2,
            "instance_type":  "t3.micro",
            "app_version":    "1.0.0",
        },
    }
    
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)
    
    // Test outputs
    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID)
    
    instanceIDs := terraform.OutputList(t, terraformOptions, "instance_ids")
    assert.Len(t, instanceIDs, 2)
    
    lbDNS := terraform.Output(t, terraformOptions, "load_balancer_dns")
    assert.NotEmpty(t, lbDNS)
    
    // Test load balancer endpoint
    url := fmt.Sprintf("http://%s", lbDNS)
    
    // Wait for instances to become healthy
    maxRetries := 60
    sleepBetweenRetries := 10 * time.Second
    
    http_helper.HttpGetWithRetry(
        t,
        url+"/health",
        nil,
        200,
        "healthy",
        maxRetries,
        sleepBetweenRetries,
    )
    
    // Test application
    response := http_helper.HttpGet(t, url, nil)
    assert.Contains(t, response, "Welcome")
    
    // Test load balancing (should get responses from different instances)
    instancesSeen := make(map[string]bool)
    for i := 0; i < 10; i++ {
        resp := http_helper.HttpGet(t, url, nil)
        // Parse instance ID from response
        // instancesSeen[instanceID] = true
        time.Sleep(1 * time.Second)
    }
    // Should see multiple instances
    assert.GreaterOrEqual(t, len(instancesSeen), 2)
}
```

---

### Policy Validation

**policy/terraform.rego**:
```rego
package terraform

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    not resource.change.after.tags.Environment
    msg := "All instances must have Environment tag"
}

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_security_group"
    rule := resource.change.after.ingress[_]
    rule.from_port == 22
    rule.cidr_blocks[_] == "0.0.0.0/0"
    msg := "SSH must not be open to 0.0.0.0/0"
}

warn[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    instance_type := resource.change.after.instance_type
    not startswith(instance_type, "t3.")
    msg := sprintf("Consider using t3 instances instead of %s", [instance_type])
}
```

---

### CI/CD Pipeline

**.github/workflows/test.yml**:
```yaml
name: Test Infrastructure

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0
      
      - name: Terraform fmt
        run: terraform fmt -check -recursive
        working-directory: terraform
      
      - name: Terraform init
        run: terraform init
        working-directory: terraform
      
      - name: Terraform validate
        run: terraform validate
        working-directory: terraform
      
      - name: Install tfsec
        run: |
          wget -q https://github.com/aquasecurity/tfsec/releases/download/v1.28.0/tfsec-linux-amd64
          chmod +x tfsec-linux-amd64
          sudo mv tfsec-linux-amd64 /usr/local/bin/tfsec
      
      - name: Run tfsec
        run: tfsec terraform/
      
      - name: Setup OPA
        run: |
          wget -q https://openpolicyagent.org/downloads/latest/opa_linux_amd64 -O opa
          chmod +x opa
          sudo mv opa /usr/local/bin/
      
      - name: Policy check
        run: |
          cd terraform
          terraform plan -out=tfplan.binary
          terraform show -json tfplan.binary > tfplan.json
          opa eval -d ../policy/ -i tfplan.json "data.terraform.deny" --fail
  
  test:
    runs-on: ubuntu-latest
    needs: validate
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Run Terratest
        run: |
          cd terraform/test
          go test -v -timeout 30m
```

---

## 💡 Best Practices

### 1. Test Early and Often

```bash
# Pre-commit hooks
terraform fmt
terraform validate
tfsec .

# On every PR
molecule test
go test ./test/...

# Before merge
terraform plan
opa eval
```

---

### 2. Use Test Isolation

```go
// Bad: Shared resources
func TestWebServer(t *testing.T) {
    terraform.Apply(t, options)  // Uses same S3 bucket
}

// Good: Unique names
func TestWebServer(t *testing.T) {
    uniqueID := random.UniqueId()
    options := &terraform.Options{
        Vars: map[string]interface{}{
            "name": fmt.Sprintf("test-%s", uniqueID),
        },
    }
}
```

---

### 3. Clean Up Resources

```go
// Always defer destroy
func TestWebServer(t *testing.T) {
    defer terraform.Destroy(t, options)
    terraform.InitAndApply(t, options)
}

// Or use t.Cleanup
func TestWebServer(t *testing.T) {
    t.Cleanup(func() {
        terraform.Destroy(t, options)
    })
}
```

---

### 4. Test What Matters

```go
// Don't just test Terraform outputs
assert.NotEmpty(t, instanceID)  // ✗ Weak

// Test actual functionality
http_helper.HttpGet(t, url, nil)  // ✓ Strong
validateDatabaseConnection(t, endpoint)  // ✓ Strong
```

---

### 5. Use Parallelization

```go
func TestStaging(t *testing.T) {
    t.Parallel()  // Run tests in parallel
    // ...
}

func TestProduction(t *testing.T) {
    t.Parallel()
    // ...
}
```

---

## 🔗 What's Next?

**Related Topics**:
- **[drift-detection](drift-detection)** - Detect infrastructure drift
- **[gitops-principles](gitops-principles)** - Git-driven infrastructure

**Advanced**:
- **[immutable-infrastructure](immutable-infrastructure)** - Replace not modify
- **Security testing** - Vulnerability scanning

---

## 📚 Resources

**Terratest**:
- [Official Documentation](https://terratest.gruntwork.io/)
- [Examples](https://github.com/gruntwork-io/terratest/tree/master/examples)

**Molecule**:
- [Documentation](https://molecule.readthedocs.io/)
- [Testinfra](https://testinfra.readthedocs.io/)

**Policy as Code**:
- [Open Policy Agent](https://www.openpolicyagent.org/)
- [Conftest](https://www.conftest.dev/)

---

## 📝 Change Log

### 2026-01-30
- Created infrastructure testing guide
- Explained testing pyramid
- Demonstrated Terratest
- Showed Molecule for Ansible
- Policy validation with OPA
- Complete CI/CD integration
- Best practices

---

**Next Article**: [drift-detection](drift-detection) - Catch configuration drift!
