# Secrets Management in Infrastructure as Code

**Resource Navigation:** [README](README) | [Ansible Vault](ansible-vault) | [Terraform Basics](terraform-basics) | [GitOps Principles](gitops-principles) | [Security Basics](../security/README)

---

## Summary

Managing secrets in Infrastructure as Code is one of the most critical security challenges in modern DevOps. This comprehensive guide covers industry best practices for handling passwords, API keys, certificates, and sensitive configuration across Ansible, Terraform, and cloud-native environments. Learn how to use Ansible Vault, Terraform sensitive variables, external secret stores like HashiCorp Vault, SOPS, and dotenvx, plus complete patterns for GitOps workflows with encrypted secrets. Includes real-world examples from multi-environment deployments, CI/CD pipelines, and zero-trust architectures.

**The Golden Rule:** Never commit secrets to version control in plaintext. Ever. This article shows you how.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Understand the fundamental principles of secret management in IaC
- ✅ Use Ansible Vault to encrypt sensitive playbook variables
- ✅ Manage Terraform sensitive variables and prevent accidental exposure
- ✅ Integrate external secret stores (HashiCorp Vault, AWS Secrets Manager)
- ✅ Implement encrypted secrets in Git using SOPS and age
- ✅ Use dotenvx for application-level secret management
- ✅ Design secure GitOps workflows with encrypted secrets
- ✅ Rotate secrets safely across infrastructure
- ✅ Audit secret access and detect leaks
- ✅ Build production-ready secret management pipelines

---

## Prerequisites

Before diving into secrets management, you should have:

- **Infrastructure as Code experience**: Completed [Ansible Basics](ansible-basics) and [Terraform Basics](terraform-basics)
- **Git proficiency**: Understanding of version control and branching strategies
- **Linux fundamentals**: File permissions, environment variables, and shell basics
- **Security awareness**: Basic understanding of encryption, PKI, and authentication
- **Optional**: [GitOps Principles](gitops-principles) for CI/CD integration

---

## The Secret Management Problem

### Why This Matters

Infrastructure code needs secrets:
- Database passwords
- API keys and tokens
- TLS certificates and private keys
- SSH keys
- Cloud provider credentials
- Encryption keys
- OAuth secrets
- SMTP passwords
- Service account credentials

**The dilemma:**
- ✅ Code should be in version control (Git)
- ❌ Secrets should NOT be in version control
- ✅ Infrastructure should be reproducible
- ❌ Secrets hardcoded = security breach

### Common Anti-Patterns (What NOT to Do)

```yaml
# ❌ NEVER DO THIS: Secrets in plaintext
---
# ansible/group_vars/production.yml
database_password: "SuperSecret123!"
api_key: "sk_live_abc123def456"
aws_access_key: "AKIAIOSFODNN7EXAMPLE"

# This gets committed to Git
# Now every developer, CI system, and Git history has your secrets
# If your repo is public or ever leaked, you're compromised
```

```hcl
# ❌ NEVER DO THIS: Secrets in Terraform files
# terraform/database.tf
resource "aws_db_instance" "main" {
  engine               = "postgres"
  instance_class       = "db.t3.micro"
  username             = "admin"
  password             = "MyDatabasePassword123!"  # EXPOSED!
}

# Committed to Git, visible in terraform plan output, stored in state file
```

```bash
# ❌ NEVER DO THIS: Secrets in shell scripts
#!/bin/bash
# scripts/deploy.sh
export DB_PASSWORD="secret123"
export API_KEY="sk_live_abc123"

# Visible in process list, command history, logs
```

### The Cost of Secret Leaks

**Real-world breach scenarios:**
1. **GitHub commit with AWS keys** → $50,000 cryptocurrency mining bill in 2 hours
2. **Database password in Docker image** → Complete customer data exfiltration
3. **API key in public repo** → Unauthorized access to production services
4. **Certificate private key committed** → Man-in-the-middle attacks on HTTPS traffic

**Once a secret is compromised:**
- Immediate rotation required (costly, complex)
- Potential data breach (legal liability)
- Compliance violations (GDPR, PCI-DSS, SOC2)
- Loss of customer trust
- May be undetectable in Git history forever

---

## Fundamental Principles

### Secret Management Best Practices

1. **Separation of Code and Configuration**
   - Code (logic) → Version control
   - Configuration (env-specific) → External config
   - Secrets (sensitive) → Secret store

2. **Principle of Least Privilege**
   - Services get only the secrets they need
   - Time-limited credentials where possible
   - Role-based access control

3. **Defense in Depth**
   - Multiple layers of protection
   - Encryption at rest and in transit
   - Audit logging
   - Regular rotation

4. **Zero Trust**
   - Never trust, always verify
   - Authenticate every access
   - Minimize secret lifetime

5. **Auditability**
   - Log all secret access
   - Track secret changes
   - Alert on suspicious activity

### The Secret Lifecycle

```
┌─────────────┐
│  Creation   │  Generate or obtain secret
└──────┬──────┘
       ↓
┌─────────────┐
│   Storage   │  Store encrypted in secret store
└──────┬──────┘
       ↓
┌─────────────┐
│ Distribution│  Inject at runtime (never hardcode)
└──────┬──────┘
       ↓
┌─────────────┐
│    Usage    │  Application uses secret
└──────┬──────┘
       ↓
┌─────────────┐
│  Rotation   │  Periodic or on-demand renewal
└──────┬──────┘
       ↓
┌─────────────┐
│ Revocation  │  Invalidate and remove old secrets
└─────────────┘
```

---

## Ansible Vault: Encrypted Variables

### Basic Ansible Vault Usage

Ansible Vault encrypts YAML files with AES256:

```bash
# Create new encrypted file
ansible-vault create secrets.yml

# Edit encrypted file
ansible-vault edit secrets.yml

# Encrypt existing file
ansible-vault encrypt plaintext-secrets.yml

# Decrypt file (for viewing)
ansible-vault decrypt secrets.yml --output=-

# View encrypted file without decrypting
ansible-vault view secrets.yml

# Change vault password
ansible-vault rekey secrets.yml
```

### Vault-Encrypted Variables

**Production secrets file (encrypted):**

```yaml
# group_vars/production/vault.yml (encrypted with ansible-vault)
---
vault_database_password: "ProductionDBPass123!"
vault_api_key: "sk_live_prod_abc123def456"
vault_smtp_password: "smtpSecurePass789"
vault_ssl_cert_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
  -----END PRIVATE KEY-----
```

**Variable references (unencrypted):**

```yaml
# group_vars/production/vars.yml (plaintext, references vault vars)
---
database_password: "{{ vault_database_password }}"
api_key: "{{ vault_api_key }}"
smtp_password: "{{ vault_smtp_password }}"
ssl_cert_key: "{{ vault_ssl_cert_key }}"

# Additional non-secret config
database_host: "db.production.example.com"
database_port: 5432
database_name: "production_db"
```

**Playbook usage:**

```yaml
---
# playbooks/deploy-app.yml
- name: Deploy application with secrets
  hosts: webservers
  become: yes
  
  tasks:
    - name: Create database configuration
      template:
        src: database.conf.j2
        dest: /etc/app/database.conf
        owner: appuser
        group: appuser
        mode: '0400'  # Read-only for owner
    
    - name: Deploy SSL certificate
      copy:
        content: "{{ ssl_cert_key }}"
        dest: /etc/nginx/ssl/server.key
        owner: root
        group: root
        mode: '0400'
      notify: reload nginx
```

**Running playbooks with vault:**

```bash
# Prompt for vault password
ansible-playbook playbooks/deploy-app.yml --ask-vault-pass

# Use password file
ansible-playbook playbooks/deploy-app.yml --vault-password-file=~/.vault-pass.txt

# Use password from environment
echo "$ANSIBLE_VAULT_PASSWORD" | ansible-playbook playbooks/deploy-app.yml --vault-password-file=/dev/stdin

# Multiple vault passwords (different vaults)
ansible-playbook playbooks/deploy-app.yml \
  --vault-id dev@prompt \
  --vault-id prod@~/.vault-pass-prod.txt
```

### Vault Password Management

```bash
# Store vault password securely (NOT in Git)
# Option 1: Password file with restricted permissions
echo "my-vault-password" > ~/.vault-pass.txt
chmod 600 ~/.vault-pass.txt

# Option 2: Use system keyring
ansible-vault create secrets.yml --vault-id @keyring

# Option 3: AWS Secrets Manager integration
#!/bin/bash
# scripts/vault-pass-from-aws.sh
aws secretsmanager get-secret-value \
  --secret-id ansible-vault-password \
  --query SecretString \
  --output text

chmod +x scripts/vault-pass-from-aws.sh
ansible-playbook playbook.yml --vault-password-file=scripts/vault-pass-from-aws.sh
```

### Encrypting Specific Variables (Inline Vault)

```bash
# Encrypt single string
ansible-vault encrypt_string 'MySecretPassword' --name 'database_password'
```

**Output:**

```yaml
database_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          36353939343463656632316264623965663166326135623239643639303962643237656334353130
          3733633337653366326466613932353834343665653239620a323535386437333539316437336334
          37353538653138653966383533623439623239636566383064353432646564393963386564313433
          6235323363636461620a613037376438653663623531313233386565313832396336663362303533
          3433
```

**Use in vars file:**

```yaml
# group_vars/production/vars.yml
---
database_host: "postgres.example.com"
database_port: 5432
database_user: "appuser"

# Encrypted inline
database_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          36353939343463656632316264623965663166326135623239643639303962643237656334353130
          3733633337653366326466613932353834343665653239620a323535386437333539316437336334
          37353538653138653966383533623439623239636566383064353432646564393963386564313433
          6235323363636461620a613037376438653663623531313233386565313832396336663362303533
          3433
```

### Ansible Vault Best Practices

```yaml
# ✅ GOOD: Separate vault files per environment
group_vars/
  dev/
    vars.yml        # Plaintext config
    vault.yml       # Encrypted secrets (dev vault password)
  staging/
    vars.yml
    vault.yml       # Encrypted secrets (staging vault password)
  production/
    vars.yml
    vault.yml       # Encrypted secrets (production vault password)

# Reference pattern
# vars.yml
database_password: "{{ vault_database_password }}"

# vault.yml (encrypted)
vault_database_password: "actual-secret-here"
```

```yaml
# ✅ GOOD: Use different vault passwords per environment
ansible-playbook deploy.yml \
  --vault-id dev@~/.vault-pass-dev \
  --vault-id prod@~/.vault-pass-prod
```

```bash
# ✅ GOOD: Never commit vault passwords
# .gitignore
.vault-pass*
*.vault-pass
vault-password.txt
```

---

## Terraform: Sensitive Variables

### Marking Variables as Sensitive

```hcl
# variables.tf
variable "database_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true  # Prevents display in plan/apply output
}

variable "api_key" {
  description = "Third-party API key"
  type        = string
  sensitive   = true
}

variable "tls_private_key" {
  description = "TLS certificate private key"
  type        = string
  sensitive   = true
}
```

### Providing Sensitive Values

**Option 1: Environment Variables (Recommended for CI/CD)**

```bash
# Set environment variables
export TF_VAR_database_password="ProductionDBPass123!"
export TF_VAR_api_key="sk_live_abc123"

# Run terraform (reads from environment)
terraform plan
terraform apply
```

**Option 2: Variable Files (Encrypted, NOT in Git)**

```hcl
# secrets.tfvars (NEVER commit this file)
database_password = "ProductionDBPass123!"
api_key           = "sk_live_abc123"
```

```bash
# .gitignore
secrets.tfvars
*.secret.tfvars
*.secrets.tfvars
```

```bash
# Use encrypted variable file
terraform apply -var-file="secrets.tfvars"
```

**Option 3: Interactive Prompt**

```bash
# Terraform prompts for sensitive variables
terraform apply
# var.database_password
#   PostgreSQL admin password
#   Enter a value: 
```

**Option 4: External Data Source (Production Pattern)**

```hcl
# Fetch from AWS Secrets Manager
data "aws_secretsmanager_secret_version" "database_password" {
  secret_id = "production/database/password"
}

resource "aws_db_instance" "main" {
  engine               = "postgres"
  instance_class       = "db.t3.micro"
  username             = "admin"
  password             = data.aws_secretsmanager_secret_version.database_password.secret_string
}
```

### Terraform State and Secrets

**THE PROBLEM:** Terraform state files contain secret values in plaintext!

```json
// terraform.tfstate (contains secrets!)
{
  "version": 4,
  "terraform_version": "1.6.0",
  "resources": [
    {
      "type": "aws_db_instance",
      "name": "main",
      "instances": [
        {
          "attributes": {
            "password": "ProductionDBPass123!",  // SECRET EXPOSED!
            "username": "admin"
          }
        }
      ]
    }
  ]
}
```

**SOLUTION: Remote State with Encryption**

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true  # Enable encryption at rest
    dynamodb_table = "terraform-locks"
    kms_key_id     = "arn:aws:kms:us-east-1:123456789:key/abc-def-ghi"
  }
}
```

**Best practices:**

```bash
# ✅ GOOD: Never commit state files
# .gitignore
*.tfstate
*.tfstate.*
.terraform/
```

```hcl
# ✅ GOOD: Use remote backend with encryption
# S3: encrypt = true + KMS
# Terraform Cloud: encrypted by default
# Azure: encryption enabled
```

```bash
# ✅ GOOD: Restrict state file access
# AWS IAM policy for state bucket
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789:role/TerraformRole"
      },
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-terraform-state/*"
    }
  ]
}
```

### Preventing Secret Leaks in Output

```hcl
# outputs.tf

# ❌ BAD: Exposes secret in output
output "database_password" {
  value = aws_db_instance.main.password
}

# ✅ GOOD: Marked as sensitive
output "database_password" {
  value     = aws_db_instance.main.password
  sensitive = true
}

# ✅ BETTER: Don't output secrets at all
output "database_endpoint" {
  value = aws_db_instance.main.endpoint
  description = "Database connection endpoint (password stored in Secrets Manager)"
}
```

### Terraform + External Secret Stores

**HashiCorp Vault Provider:**

```hcl
# providers.tf
terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.20"
    }
  }
}

provider "vault" {
  address = "https://vault.example.com:8200"
  # Token from environment: VAULT_TOKEN
}

# Read secret from Vault
data "vault_generic_secret" "database" {
  path = "secret/database/production"
}

# Use in resource
resource "aws_db_instance" "main" {
  engine         = "postgres"
  instance_class = "db.t3.micro"
  username       = data.vault_generic_secret.database.data["username"]
  password       = data.vault_generic_secret.database.data["password"]
}
```

**AWS Secrets Manager:**

```hcl
# Read from Secrets Manager
data "aws_secretsmanager_secret" "database_credentials" {
  name = "production/database/credentials"
}

data "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id = data.aws_secretsmanager_secret.database_credentials.id
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.database_credentials.secret_string)
}

resource "aws_db_instance" "main" {
  engine         = "postgres"
  instance_class = "db.t3.micro"
  username       = local.db_creds.username
  password       = local.db_creds.password
}
```

---

## SOPS: Encrypted Secrets in Git

### Why SOPS?

**Mozilla SOPS** (Secrets OPerationS) allows you to commit encrypted secrets to Git safely:

- Encrypts values, not keys (YAML/JSON structure visible)
- Supports multiple key management services (AWS KMS, GCP KMS, Azure Key Vault, age, PGP)
- GitOps-friendly (encrypted files can be in version control)
- Decrypts at runtime, not during review

### Installation

```bash
# Install SOPS
# macOS
brew install sops

# Linux
curl -LO https://github.com/mozilla/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64
sudo mv sops-v3.8.1.linux.amd64 /usr/local/bin/sops
sudo chmod +x /usr/local/bin/sops

# Install age (modern encryption tool)
brew install age  # macOS
# OR
sudo apt install age  # Ubuntu/Debian
```

### Using SOPS with age

**Generate age key:**

```bash
# Generate age key pair
age-keygen -o ~/.config/sops/age/keys.txt

# Output:
# Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
# (Save this for .sops.yaml)
```

**Configure SOPS:**

```yaml
# .sops.yaml (commit this to Git)
creation_rules:
  - path_regex: secrets/.*\.ya?ml$
    age: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
  
  - path_regex: environments/production/.*\.ya?ml$
    age: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
  
  - path_regex: environments/dev/.*\.ya?ml$
    age: age1abc123differentkeyfordev456xyz789
```

**Encrypt secrets file:**

```yaml
# secrets/production.yml (plaintext, before encryption)
database_password: "ProductionDBPass123!"
api_key: "sk_live_abc123def456"
smtp_password: "smtpSecurePass789"
aws_access_key: "AKIAIOSFODNN7EXAMPLE"
aws_secret_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

```bash
# Encrypt with SOPS
sops -e secrets/production.yml > secrets/production.encrypted.yml

# Or encrypt in-place
sops -e -i secrets/production.yml
```

**Encrypted file (safe to commit):**

```yaml
# secrets/production.yml (encrypted with SOPS)
database_password: ENC[AES256_GCM,data:8GKJHOjkl789==,iv:abc123,tag:xyz,type:str]
api_key: ENC[AES256_GCM,data:KLMnop456qrs==,iv:def456,tag:uvw,type:str]
smtp_password: ENC[AES256_GCM,data:TUVwxyz789==,iv:ghi789,tag:rst,type:str]
aws_access_key: ENC[AES256_GCM,data:ABCdef123==,iv:jkl012,tag:mno,type:str]
aws_secret_key: ENC[AES256_GCM,data:XYZabc456==,iv:pqr345,tag:stu,type:str]
sops:
    kms: []
    gcp_kms: []
    azure_kv: []
    age:
        - recipient: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
          enc: |
            -----BEGIN AGE ENCRYPTED FILE-----
            YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IFgyNTUxOSB...
            -----END AGE ENCRYPTED FILE-----
    lastmodified: "2026-01-30T12:00:00Z"
    version: 3.8.1
```

**Decrypt and use:**

```bash
# View decrypted content
sops -d secrets/production.yml

# Edit encrypted file (decrypts, opens editor, re-encrypts on save)
sops secrets/production.yml

# Export to environment variables
export $(sops -d secrets/production.yml | grep -v '^#' | xargs)

# Use with Ansible
sops -d secrets/production.yml > /tmp/decrypted-secrets.yml
ansible-playbook deploy.yml -e @/tmp/decrypted-secrets.yml
rm -f /tmp/decrypted-secrets.yml

# Use with Terraform
sops -d secrets/production.yml | yq -r '.database_password' | terraform apply -var="database_password=$(cat -)"
```

### SOPS with AWS KMS (Production Pattern)

```yaml
# .sops.yaml
creation_rules:
  # Production secrets use production KMS key
  - path_regex: environments/production/.*\.ya?ml$
    kms: arn:aws:kms:us-east-1:123456789:key/production-sops-key
    aws_profile: production
  
  # Development secrets use dev KMS key
  - path_regex: environments/dev/.*\.ya?ml$
    kms: arn:aws:kms:us-east-1:123456789:key/dev-sops-key
    aws_profile: development
```

```bash
# Encrypt with KMS (requires AWS credentials)
sops -e environments/production/secrets.yml

# Decrypt (requires appropriate IAM permissions)
sops -d environments/production/secrets.yml
```

**IAM policy for SOPS:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789:key/production-sops-key"
    }
  ]
}
```

---

## HashiCorp Vault: Enterprise Secret Store

### Vault Architecture

```
┌────────────────────────────────────────────────┐
│                 Applications                    │
│  (Ansible, Terraform, Services, CI/CD)         │
└──────────────┬─────────────────────────────────┘
               │ API calls (authenticated)
               ↓
┌────────────────────────────────────────────────┐
│            HashiCorp Vault Server              │
│  ┌──────────────────────────────────────────┐ │
│  │  Secret Engines                          │ │
│  │  - KV (key-value)                        │ │
│  │  - Database (dynamic credentials)        │ │
│  │  - AWS (dynamic IAM)                     │ │
│  │  - PKI (certificates)                    │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │  Auth Methods                            │ │
│  │  - Token                                 │ │
│  │  - AppRole                               │ │
│  │  - Kubernetes                            │ │
│  │  - AWS IAM                               │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │  Audit Logging                           │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
               │
               ↓
┌────────────────────────────────────────────────┐
│       Encrypted Storage Backend                │
│       (Consul, etcd, S3, etc.)                │
└────────────────────────────────────────────────┘
```

### Quick Vault Setup (Development)

```bash
# Install Vault
# macOS
brew install vault

# Linux
curl -fsSL https://rpm.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://rpm.releases.hashicorp.com/ubuntu $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vault

# Start Vault dev server (NOT for production!)
vault server -dev

# Output:
# Root Token: hvs.abc123def456xyz789
# Unseal Key: ... (not needed in dev mode)
# Vault Address: http://127.0.0.1:8200

# Set environment variables
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='hvs.abc123def456xyz789'

# Verify
vault status
```

### Storing Secrets in Vault

```bash
# Enable KV secrets engine (if not enabled)
vault secrets enable -path=secret kv-v2

# Write secret
vault kv put secret/database/production \
  username=dbadmin \
  password=ProductionDBPass123! \
  host=db.example.com \
  port=5432

# Read secret
vault kv get secret/database/production

# Output:
# ====== Data ======
# Key         Value
# ---         -----
# host        db.example.com
# password    ProductionDBPass123!
# port        5432
# username    dbadmin

# Read specific field
vault kv get -field=password secret/database/production
# ProductionDBPass123!

# Write JSON secret
vault kv put secret/api/stripe @stripe-credentials.json

# List secrets
vault kv list secret/database
```

### Using Vault with Ansible

**Install Ansible Vault plugin:**

```bash
ansible-galaxy collection install community.hashi_vault
```

**Lookup secrets in playbooks:**

```yaml
---
# playbooks/deploy-with-vault.yml
- name: Deploy application with HashiCorp Vault secrets
  hosts: webservers
  vars:
    vault_addr: "https://vault.example.com:8200"
    vault_token: "{{ lookup('env', 'VAULT_TOKEN') }}"
  
  tasks:
    - name: Get database credentials from Vault
      set_fact:
        db_username: "{{ lookup('community.hashi_vault.hashi_vault', 'secret=secret/data/database/production:username') }}"
        db_password: "{{ lookup('community.hashi_vault.hashi_vault', 'secret=secret/data/database/production:password') }}"
        db_host: "{{ lookup('community.hashi_vault.hashi_vault', 'secret=secret/data/database/production:host') }}"
    
    - name: Create application config
      template:
        src: app-config.yml.j2
        dest: /etc/myapp/config.yml
        owner: appuser
        group: appuser
        mode: '0400'
```

### Using Vault with Terraform

```hcl
# providers.tf
terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.20"
    }
  }
}

provider "vault" {
  address = "https://vault.example.com:8200"
  token   = var.vault_token  # Or use VAULT_TOKEN env var
}

# Read secret
data "vault_kv_secret_v2" "database" {
  mount = "secret"
  name  = "database/production"
}

# Use in resources
resource "kubernetes_secret" "database" {
  metadata {
    name = "database-credentials"
  }
  
  data = {
    username = data.vault_kv_secret_v2.database.data["username"]
    password = data.vault_kv_secret_v2.database.data["password"]
    host     = data.vault_kv_secret_v2.database.data["host"]
  }
}
```

### Dynamic Secrets (Advanced)

Vault can generate temporary credentials on-demand:

```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/postgresql \
  plugin_name=postgresql-database-plugin \
  allowed_roles="readonly,readwrite" \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/mydb?sslmode=require" \
  username="vaultadmin" \
  password="VaultAdminPass123!"

# Create role for read-only access
vault write database/roles/readonly \
  db_name=postgresql \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Generate dynamic credentials (valid for 1 hour)
vault read database/creds/readonly

# Output:
# Key                Value
# ---                -----
# lease_id           database/creds/readonly/abc123
# lease_duration     1h
# lease_renewable    true
# password           A1a-xy7z9b2c
# username           v-root-readonly-abc123xyz
```

**Terraform with dynamic credentials:**

```hcl
# Request dynamic database credentials
resource "vault_database_secret_backend_connection" "postgres" {
  backend       = "database"
  name          = "postgresql"
  allowed_roles = ["readonly"]
  
  postgresql {
    connection_url = "postgresql://{{username}}:{{password}}@postgres:5432/mydb"
    username       = "vaultadmin"
    password       = "VaultAdminPass123!"
  }
}

data "vault_database_secret_backend_dynamic_creds" "app" {
  backend = vault_database_secret_backend_connection.postgres.backend
  role    = "readonly"
}

# Use temporary credentials
resource "kubernetes_secret" "db_temp_creds" {
  metadata {
    name = "database-credentials"
  }
  
  data = {
    username = data.vault_database_secret_backend_dynamic_creds.app.username
    password = data.vault_database_secret_backend_dynamic_creds.app.password
  }
}
```

---

## dotenvx: Application Secret Management

### Why dotenvx?

**dotenvx** is a modern alternative to traditional `.env` files with encryption support:

- Encrypted `.env` files can be committed to Git
- Multiple environment support (dev, staging, production)
- Compatible with existing `.env` workflows
- No external infrastructure required

See [SECRETS_MANAGEMENT](../../SECRETS_MANAGEMENT) for complete dotenvx documentation.

### Quick Start

```bash
# Install dotenvx
npm install -g @dotenvx/dotenvx

# Or use with your project
npm install @dotenvx/dotenvx --save-dev
```

### Encrypt Environment Files

```bash
# Create plaintext .env file
cat > .env <<EOF
DATABASE_URL=postgresql://user:pass@localhost:5432/db
API_KEY=sk_live_abc123
STRIPE_SECRET=sk_test_xyz789
EOF

# Encrypt it
dotenvx encrypt

# Creates .env.keys (encryption keys - DO NOT COMMIT)
# Modifies .env (now encrypted - SAFE TO COMMIT)
```

**Encrypted `.env` file:**

```bash
#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="034af93e4d44896a1b49c5da6d1ade8065a1039c8ab452a8452f74c8a8f85b8e75"

# .env (encrypted with dotenvx)
DATABASE_URL="encrypted:BE9Y...encrypted-value...LKJz=="
API_KEY="encrypted:ABC1...encrypted-value...XY9Z=="
STRIPE_SECRET="encrypted:GHI4...encrypted-value...MNO7=="
```

**Decryption key file (`.env.keys` - DO NOT COMMIT):**

```bash
#/------------------!!!!!!!DOTENV_PRIVATE_KEYS!!!!!!!!!------------------/
#/ private decryption keys. DO NOT commit to source control /
#/     [how it works](https://dotenvx.com/encryption)       /
#/----------------------------------------------------------/

# .env
DOTENV_PRIVATE_KEY="a4d0c8e1f2b3d5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1"
```

### Running Applications with dotenvx

```bash
# Run application with decryption
dotenvx run -- node server.js
dotenvx run -- python app.py
dotenvx run -- npm start

# Specify environment
dotenvx run -f .env.production -- node server.js

# Multiple environments
dotenvx run -f .env -f .env.local -- node server.js
```

### CI/CD with dotenvx

**GitHub Actions:**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install dotenvx
        run: npm install -g @dotenvx/dotenvx
      
      - name: Run tests with encrypted secrets
        env:
          DOTENV_PRIVATE_KEY: ${{ secrets.DOTENV_PRIVATE_KEY }}
        run: dotenvx run -- npm test
      
      - name: Deploy
        env:
          DOTENV_PRIVATE_KEY: ${{ secrets.DOTENV_PRIVATE_KEY }}
        run: dotenvx run -- npm run deploy
```

**GitLab CI:**

```yaml
# .gitlab-ci.yml
variables:
  DOTENV_PRIVATE_KEY: $DOTENV_PRIVATE_KEY  # From CI/CD variables

deploy:
  script:
    - npm install -g @dotenvx/dotenvx
    - dotenvx run -- npm run deploy
```

### Multiple Environments

```bash
# Development
.env.development (encrypted)
.env.keys (contains DOTENV_PRIVATE_KEY for .env.development)

# Staging
.env.staging (encrypted)
.env.keys (contains DOTENV_PRIVATE_KEY for .env.staging)

# Production
.env.production (encrypted)
.env.keys (contains DOTENV_PRIVATE_KEY for .env.production)
```

**Run with specific environment:**

```bash
# Development
dotenvx run -f .env.development -- npm start

# Staging (get key from environment)
DOTENV_PRIVATE_KEY=$STAGING_KEY dotenvx run -f .env.staging -- npm start

# Production (get key from secrets manager)
DOTENV_PRIVATE_KEY=$(aws secretsmanager get-secret-value --secret-id prod-dotenv-key --query SecretString --output text) \
  dotenvx run -f .env.production -- npm start
```

---

## GitOps Workflows with Secrets

### Sealed Secrets for Kubernetes

**Bitnami Sealed Secrets** encrypts Kubernetes Secrets so they can be stored in Git:

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install kubeseal CLI
brew install kubeseal  # macOS
# OR
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64 -O kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal
```

**Create and seal secret:**

```bash
# Create regular Kubernetes secret (plaintext)
kubectl create secret generic database-credentials \
  --from-literal=username=dbadmin \
  --from-literal=password=ProductionDBPass123! \
  --dry-run=client -o yaml > secret.yaml

# Seal it (encrypts for your cluster)
kubeseal -f secret.yaml -w sealed-secret.yaml

# Delete plaintext secret
rm secret.yaml
```

**Sealed secret (safe to commit to Git):**

```yaml
# sealed-secret.yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  encryptedData:
    username: AgBy3i4O...encrypted-value...J8kL==
    password: AgCQ7s9A...encrypted-value...Pz1Y==
  template:
    metadata:
      name: database-credentials
      namespace: production
```

**Apply sealed secret:**

```bash
# Commit to Git
git add sealed-secret.yaml
git commit -m "Add production database credentials"
git push

# Apply to cluster (controller decrypts automatically)
kubectl apply -f sealed-secret.yaml

# Controller creates regular Secret
kubectl get secret database-credentials -o yaml
```

### ArgoCD with Encrypted Secrets

**Option 1: SOPS with ArgoCD**

```yaml
# Install SOPS plugin for ArgoCD
# argocd-cm ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  # Enable SOPS plugin
  configManagementPlugins: |
    - name: sops
      generate:
        command: ["sh", "-c"]
        args:
          - |
            sops -d $ARGOCD_ENV_FILE > decrypted.yaml && \
            cat decrypted.yaml
```

**Application with SOPS:**

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/myorg/myapp
    targetRevision: main
    path: manifests/production
    plugin:
      name: sops
      env:
        - name: ARGOCD_ENV_FILE
          value: secrets.enc.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
```

**Option 2: External Secrets Operator**

```yaml
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace

# Configure AWS Secrets Manager backend
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-store
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
# External Secret (syncs from AWS)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-store
    kind: SecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
  data:
    - secretKey: username
      remoteRef:
        key: production/database/credentials
        property: username
    - secretKey: password
      remoteRef:
        key: production/database/credentials
        property: password
```

---

## Secret Rotation

### Why Rotate Secrets?

- **Security best practice**: Limit exposure window
- **Compliance**: Many standards require regular rotation
- **Breach response**: Mitigate compromised credentials
- **Employee offboarding**: Revoke access

### Rotation Strategy

```
1. Generate new secret
2. Deploy new secret alongside old
3. Update applications to use new secret
4. Verify applications working
5. Remove old secret
6. Update documentation
```

### Ansible Secret Rotation

```yaml
---
# playbooks/rotate-database-password.yml
- name: Rotate database password
  hosts: localhost
  gather_facts: no
  vars:
    vault_addr: "https://vault.example.com:8200"
  
  tasks:
    - name: Generate new password
      set_fact:
        new_password: "{{ lookup('password', '/dev/null length=32 chars=ascii_letters,digits') }}"
    
    - name: Update password in HashiCorp Vault
      community.hashi_vault.vault_write:
        url: "{{ vault_addr }}"
        path: "secret/database/production"
        data:
          password: "{{ new_password }}"
    
    - name: Update database password
      community.postgresql.postgresql_user:
        name: appuser
        password: "{{ new_password }}"
        login_host: postgres.example.com
        login_user: admin
        login_password: "{{ vault_admin_password }}"
    
    - name: Restart application pods (to pickup new password)
      kubernetes.core.k8s:
        state: restarted
        kind: Deployment
        namespace: production
        name: myapp
    
    - name: Wait for application health
      uri:
        url: https://myapp.example.com/health
        status_code: 200
      retries: 10
      delay: 10
    
    - name: Log rotation
      debug:
        msg: "Database password rotated successfully at {{ ansible_date_time.iso8601 }}"
```

### Terraform Secret Rotation

```hcl
# Generate random password
resource "random_password" "database" {
  length  = 32
  special = true
  
  # Force rotation every 90 days
  keepers = {
    rotation_date = formatdate("YYYY-MM-DD", timeadd(timestamp(), "2160h"))  # 90 days
  }
}

# Store in Secrets Manager
resource "aws_secretsmanager_secret_version" "database_password" {
  secret_id = aws_secretsmanager_secret.database_password.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.database.result
  })
}

# Update database password
resource "postgresql_role" "appuser" {
  name     = "appuser"
  login    = true
  password = random_password.database.result
}

# Trigger application restart (Kubernetes example)
resource "null_resource" "restart_app" {
  triggers = {
    password_version = aws_secretsmanager_secret_version.database_password.version_id
  }
  
  provisioner "local-exec" {
    command = "kubectl rollout restart deployment/myapp -n production"
  }
}
```

---

## Auditing and Leak Detection

### Audit Logging

**Vault audit logs:**

```bash
# Enable audit logging
vault audit enable file file_path=/var/log/vault/audit.log

# View audit logs
tail -f /var/log/vault/audit.log | jq

# Example log entry
{
  "time": "2026-01-30T12:00:00Z",
  "type": "response",
  "auth": {
    "token_type": "service",
    "display_name": "approle"
  },
  "request": {
    "operation": "read",
    "path": "secret/data/database/production"
  },
  "response": {
    "secret": {
      "lease_id": ""
    }
  }
}
```

**AWS Secrets Manager audit:**

```bash
# CloudTrail logs secret access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=production/database/credentials \
  --max-results 100
```

### Git Leak Detection

**git-secrets (prevent commits):**

```bash
# Install git-secrets
brew install git-secrets  # macOS
# OR
git clone https://github.com/awslabs/git-secrets
cd git-secrets && sudo make install

# Initialize in repository
cd /path/to/repo
git secrets --install
git secrets --register-aws  # Scan for AWS keys

# Add custom patterns
git secrets --add 'password\s*=\s*.+'
git secrets --add 'api_key\s*=\s*.+'
git secrets --add --allowed 'example-password'  # Whitelist

# Scan repository
git secrets --scan
git secrets --scan-history  # Scan all commits
```

**TruffleHog (detect leaked secrets):**

```bash
# Install TruffleHog
pip install trufflehog

# Scan repository
trufflehog git https://github.com/myorg/myrepo

# Scan local directory
trufflehog filesystem /path/to/repo

# Output example:
# Found verified result
# Detector Type: AWS
# Raw result: AKIAIOSFODNN7EXAMPLE
# File: config/production.yml
# Commit: abc123def456
```

**GitGuardian (continuous monitoring):**

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: GitGuardian scan
        uses: GitGuardian/ggshield-action@v1
        env:
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

### Responding to Leaked Secrets

**Immediate actions:**

```bash
# 1. Rotate compromised secret immediately
# 2. Revoke old secret
# 3. Update applications
# 4. Remove secret from Git history

# Remove secret from Git history (USE WITH CAUTION)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch config/secrets.yml" \
  --prune-empty --tag-name-filter cat -- --all

# Or use BFG Repo-Cleaner (recommended)
java -jar bfg.jar --delete-files secrets.yml repo.git
cd repo.git && git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push (WARNING: rewrites history)
git push origin --force --all
git push origin --force --tags

# 5. Notify team
# 6. Audit for unauthorized access
# 7. Document incident
```

---

## Production Patterns

### Multi-Environment Secret Management

```
Repository Structure:
.
├── .sops.yaml (encryption config)
├── .gitignore (exclude .env.keys)
├── ansible/
│   ├── group_vars/
│   │   ├── dev/
│   │   │   ├── vars.yml (plaintext config)
│   │   │   └── vault.yml (encrypted secrets)
│   │   ├── staging/
│   │   │   ├── vars.yml
│   │   │   └── vault.yml
│   │   └── production/
│   │       ├── vars.yml
│   │       └── vault.yml (different vault password)
│   └── playbooks/
├── terraform/
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── terraform.tfvars
│   │   │   └── secrets.tfvars (NOT in Git, or SOPS-encrypted)
│   │   ├── staging/
│   │   └── production/
│   └── modules/
└── secrets/
    ├── dev.enc.yml (SOPS-encrypted, in Git)
    ├── staging.enc.yml (SOPS-encrypted, in Git)
    └── production.enc.yml (SOPS-encrypted, in Git)
```

### CI/CD Secret Injection

**GitHub Actions:**

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      # Method 1: GitHub Secrets (for simple secrets)
      - name: Deploy with GitHub Secrets
        env:
          DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          echo "DATABASE_PASSWORD=${DATABASE_PASSWORD}" >> .env
          ./deploy.sh
      
      # Method 2: Vault (for centralized secrets)
      - name: Get secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: https://vault.example.com:8200
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            secret/data/production/database password | DATABASE_PASSWORD ;
            secret/data/production/api key | API_KEY
      
      # Method 3: AWS Secrets Manager
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActions
          aws-region: us-east-1
      
      - name: Get secrets from AWS
        run: |
          aws secretsmanager get-secret-value \
            --secret-id production/database/password \
            --query SecretString \
            --output text > /tmp/db-password
      
      # Method 4: SOPS (encrypted in Git)
      - name: Install SOPS
        run: |
          curl -LO https://github.com/mozilla/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64
          sudo mv sops-v3.8.1.linux.amd64 /usr/local/bin/sops
          sudo chmod +x /usr/local/bin/sops
      
      - name: Decrypt secrets
        env:
          SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
        run: sops -d secrets/production.enc.yml > secrets/production.yml
      
      - name: Deploy
        run: ./deploy.sh
```

### Kubernetes Secret Management

**Complete pattern:**

```yaml
# 1. External Secrets Operator fetches from AWS
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 15m  # Refresh every 15 minutes
  secretStoreRef:
    name: aws-secrets-store
    kind: SecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
    template:
      engineVersion: v2
      data:
        DATABASE_URL: "postgresql://{{ .username }}:{{ .password }}@{{ .host }}:{{ .port }}/{{ .database }}"
  dataFrom:
    - extract:
        key: production/database/credentials
---
# 2. Application uses secret
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  template:
    spec:
      serviceAccountName: myapp
      containers:
      - name: app
        image: myapp:1.2.3
        env:
        # Option A: Environment variable from secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: DATABASE_URL
        # Option B: Mount as file
        volumeMounts:
        - name: secrets
          mountPath: /secrets
          readOnly: true
      volumes:
      - name: secrets
        secret:
          secretName: database-credentials
          defaultMode: 0400
---
# 3. Network policy (restrict secret access)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-secrets
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
```

---

## Troubleshooting

### Ansible Vault Issues

**Issue: Vault password prompt not showing**

```bash
# Solution: Use explicit vault-id
ansible-playbook deploy.yml --vault-id @prompt

# Or use password file
ansible-playbook deploy.yml --vault-password-file=~/.vault-pass
```

**Issue: "Decryption failed" error**

```bash
# Verify file is actually encrypted
head -n 1 group_vars/production/vault.yml
# Should show: $ANSIBLE_VAULT;1.1;AES256

# Try different vault password
ansible-vault view group_vars/production/vault.yml --vault-id @prompt

# Re-encrypt with correct password
ansible-vault decrypt group_vars/production/vault.yml
ansible-vault encrypt group_vars/production/vault.yml
```

**Issue: Mixed encrypted and unencrypted variables**

```bash
# Identify encrypted variables
grep -r '!vault' group_vars/

# Re-encrypt specific strings
ansible-vault encrypt_string 'SecretValue' --name 'variable_name'
```

### Terraform Sensitive Value Warnings

**Issue: Sensitive values in plan output**

```hcl
# Solution: Mark variables as sensitive
variable "database_password" {
  type      = string
  sensitive = true
}

# Mark outputs as sensitive
output "connection_string" {
  value     = "postgresql://${var.database_username}:${var.database_password}@${var.database_host}"
  sensitive = true
}
```

**Issue: Secrets in state file**

```bash
# Solution: Use remote backend with encryption
terraform {
  backend "s3" {
    bucket  = "terraform-state"
    key     = "production.tfstate"
    encrypt = true
    kms_key_id = "arn:aws:kms:us-east-1:123456789:key/abc-def-ghi"
  }
}

# Restrict state file access
# IAM policy for state bucket
```

### SOPS Decryption Failures

**Issue: "no key could decrypt" error**

```bash
# Verify SOPS_AGE_KEY is set
echo $SOPS_AGE_KEY

# Or check key file exists
ls -la ~/.config/sops/age/keys.txt

# Verify file is encrypted for your key
sops -d --verbose secrets.yml

# Re-encrypt for correct key
sops updatekeys secrets.yml
```

**Issue: KMS permissions error**

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check KMS key policy
aws kms describe-key --key-id alias/sops-key

# Test KMS access
aws kms decrypt --ciphertext-blob fileb://test.enc --output text --query Plaintext | base64 -d
```

### Vault Connection Issues

**Issue: "connection refused" to Vault server**

```bash
# Verify Vault address
echo $VAULT_ADDR

# Test connectivity
curl -k $VAULT_ADDR/v1/sys/health

# Check Vault status
vault status

# Verify token
echo $VAULT_TOKEN | vault login -
```

**Issue: "permission denied" reading secrets**

```bash
# Check token capabilities
vault token capabilities secret/database/production

# Should show: read

# If not, update policy
vault policy write myapp-policy - <<EOF
path "secret/data/database/production" {
  capabilities = ["read"]
}
EOF

# Attach policy to token/role
vault write auth/approle/role/myapp policies="myapp-policy"
```

---

## Best Practices Summary

### DO

✅ **Use encryption**: Ansible Vault, SOPS, dotenvx
✅ **External secret stores**: HashiCorp Vault, AWS Secrets Manager
✅ **Environment variables**: For runtime injection
✅ **Least privilege**: Grant minimal necessary access
✅ **Rotate regularly**: Automate secret rotation
✅ **Audit logging**: Track all secret access
✅ **Scan for leaks**: git-secrets, TruffleHog, GitGuardian
✅ **Separate environments**: Different secrets for dev/staging/prod
✅ **Document procedures**: Secret creation, rotation, revocation
✅ **Use .gitignore**: Exclude plaintext secrets

### DON'T

❌ **Commit secrets**: Never plaintext secrets in Git
❌ **Hardcode secrets**: No secrets in code or config files
❌ **Share secrets**: Use secret stores, not email/Slack
❌ **Reuse secrets**: Different secrets per environment
❌ **Long-lived secrets**: Prefer temporary/dynamic credentials
❌ **Broad permissions**: Limit who can access secrets
❌ **Ignore rotation**: Secrets don't expire automatically
❌ **Skip auditing**: Always log secret access
❌ **Trust public repos**: Assume public = compromised
❌ **Forget documentation**: Team needs to know procedures

---

## What's Next?

After mastering secret management, continue your security journey:

**Infrastructure Security:**
- Security hardening and compliance
- Network security and firewalls
- Vulnerability management

**GitOps & CI/CD:**
- [GitOps Principles](gitops-principles) - Implementing GitOps with encrypted secrets
- CI/CD pipeline security
- Automated compliance checks

**Kubernetes Security:**
- [Container Best Practices](../containers/container-best-practices) - Secure container images
- Pod Security Standards
- Network policies and zero-trust

**Advanced Secret Management:**
- Dynamic secrets and short-lived credentials
- Certificate management with cert-manager
- Hardware security modules (HSM)

---

## Additional Resources

### Official Documentation
- [Ansible Vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html)
- [Terraform Sensitive Variables](https://www.terraform.io/language/values/variables#suppressing-values-in-cli-output)
- [SOPS Documentation](https://github.com/mozilla/sops)
- [HashiCorp Vault](https://www.vaultproject.io/docs)
- [dotenvx](https://dotenvx.com)

### Tools
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent secret commits
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Scan for leaked secrets
- [GitGuardian](https://www.gitguardian.com/) - Secret detection service
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) - Kubernetes secret encryption
- [External Secrets Operator](https://external-secrets.io/) - Sync secrets from external stores

### Best Practices
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Special Publication 800-57](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final) - Key Management

### Learning Resources
- [Learn Ansible Vault](https://www.ansible.com/blog/2014/02/19/ansible-vault)
- [Terraform Security Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [HashiCorp Learn](https://learn.hashicorp.com/vault)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive secrets management guide covering Ansible Vault, Terraform sensitive variables, SOPS, HashiCorp Vault, dotenvx, AWS Secrets Manager, GitOps workflows, secret rotation, audit logging, leak detection, Kubernetes patterns, CI/CD integration, troubleshooting, and production best practices. Includes real-world examples for multi-environment deployments, complete encryption strategies, and zero-trust secret architectures.
