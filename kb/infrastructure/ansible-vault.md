# Ansible Vault - Securing Your Secrets

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure - Security  
**Prerequisites**: [ansible-playbooks](ansible-playbooks), [ansible-roles](ansible-roles)  
**Time**: 2-3 hours  
**Tags**: ansible, vault, encryption, secrets, security

## Summary

Master Ansible Vault to encrypt sensitive data like passwords, API keys, and certificates in your automation code. Learn vault file management, encryption strategies, password management, and integration patterns for secure infrastructure automation.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Encrypt and decrypt files with Ansible Vault
- ✅ Manage vault passwords securely
- ✅ Encrypt specific variables in files
- ✅ Use multiple vault passwords
- ✅ Integrate vault with CI/CD
- ✅ Implement vault best practices

## 🔐 Why Vault?

### The Problem

```yaml
# playbook.yaml - DON'T DO THIS!
vars:
  db_password: super_secret_password  # Visible in Git!
  api_key: abc123xyz789                # Everyone can see!
  aws_secret: AKIAIOSFODNN7EXAMPLE     # Security breach!
```

**Issues**:
- ❌ Secrets visible in version control
- ❌ Anyone with repo access sees passwords
- ❌ Hard to rotate credentials
- ❌ Compliance violations

---

### The Solution: Ansible Vault

```yaml
# encrypted_vars.yaml (encrypted!)
db_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          66386439653730386531653...
api_key: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          39653730386531653765666...
```

**Benefits**:
- ✅ Secrets encrypted at rest
- ✅ Safe to commit to Git
- ✅ Auditable changes
- ✅ Easy credential rotation

---

## 🔑 Creating Encrypted Files

### Create New Encrypted File

```bash
# Create new encrypted file
ansible-vault create secret_vars.yaml
```

**Prompts for**:
1. Vault password
2. Confirm password
3. Opens editor (default: vim)

**Edit the file**:
```yaml
---
db_password: my_secure_password
api_key: abc123xyz
aws_secret_key: super_secret
```

**Save and exit**. File is now encrypted.

---

### View Encrypted File

```bash
# View contents
ansible-vault view secret_vars.yaml

# Outputs:
# ---
# db_password: my_secure_password
# api_key: abc123xyz
```

---

### Edit Encrypted File

```bash
# Edit encrypted file
ansible-vault edit secret_vars.yaml
```

Opens editor with decrypted content. Saves as encrypted.

---

## 🔒 Encrypt Existing Files

### Encrypt a File

```bash
# Encrypt existing file
ansible-vault encrypt vars/production.yaml

# Encrypt multiple files
ansible-vault encrypt vars/*.yaml
```

---

### Decrypt a File

```bash
# Decrypt file (makes it plaintext!)
ansible-vault decrypt secret_vars.yaml

# BE CAREFUL: File is now unencrypted!
```

**Warning**: Only decrypt temporarily, then re-encrypt!

---

### Rekey (Change Password)

```bash
# Change vault password
ansible-vault rekey secret_vars.yaml

# Prompts for:
# 1. Current password
# 2. New password
# 3. Confirm new password
```

---

## 🎯 Using Vaulted Variables

### In Playbooks

**secret_vars.yaml** (encrypted):
```yaml
---
db_password: super_secret
api_key: abc123
```

**playbook.yaml**:
```yaml
---
- name: Deploy application
  hosts: webservers
  vars_files:
    - secret_vars.yaml
  
  tasks:
    - name: Configure database
      template:
        src: db_config.j2
        dest: /etc/app/db.conf
      vars:
        password: "{{ db_password }}"
```

**Run**:
```bash
# Prompts for vault password
ansible-playbook playbook.yaml --ask-vault-pass

# Or use password file
ansible-playbook playbook.yaml --vault-password-file ~/.vault_pass
```

---

### Encrypt Single Variables

**group_vars/production.yaml**:
```yaml
---
# Regular variables
app_name: myapp
app_port: 8080

# Encrypted variables
db_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          66386439653238396430653866643361363461326633626339636630356430383038656238303862
          3762363136316464663036343832353364346666643735620a383938373439373066643432643761
          35333733303632623263636366626435616463366432373733643234393431303630313937656536
          6165326338323334650a353637303466306664663562346561313661613832636135653634343437
          3635
```

**Encrypt a string**:
```bash
# Encrypt a string
ansible-vault encrypt_string 'super_secret_password' --name 'db_password'

# Output:
# db_password: !vault |
#           $ANSIBLE_VAULT;1.1;AES256
#           66386439653238396430653866643361363461326633626339636630356430383038656238303862
```

---

### Inline Encryption

```bash
# Encrypt string and copy to clipboard
echo -n 'my_secret' | ansible-vault encrypt_string --stdin-name 'api_key'

# Or interactive
ansible-vault encrypt_string --ask-vault-pass
# Prompts for vault password
# Then prompts for string to encrypt
```

---

## 🗝️ Managing Vault Passwords

### Password File

**~/.vault_pass**:
```
my_vault_password_123
```

**Secure it**:
```bash
chmod 600 ~/.vault_pass
```

**Use it**:
```bash
ansible-playbook playbook.yaml --vault-password-file ~/.vault_pass
```

---

### Configure in ansible.cfg

**ansible.cfg**:
```ini
[defaults]
vault_password_file = ~/.vault_pass
```

**Now just run**:
```bash
ansible-playbook playbook.yaml
# No password prompt!
```

---

### Password Script

**~/vault_pass.sh**:
```bash
#!/bin/bash
# Retrieve password from secure location

# From environment variable
echo "$ANSIBLE_VAULT_PASSWORD"

# Or from 1Password
# op read "op://vault/ansible-vault/password"

# Or from AWS Secrets Manager
# aws secretsmanager get-secret-value \
#   --secret-id ansible-vault-password \
#   --query SecretString \
#   --output text
```

**Make executable**:
```bash
chmod +x ~/vault_pass.sh
```

**Use it**:
```bash
ansible-playbook playbook.yaml --vault-password-file ~/vault_pass.sh
```

---

## 🏷️ Multiple Vault Passwords

### Why Multiple Passwords?

**Use cases**:
- Different passwords per environment (dev, prod)
- Different teams own different secrets
- Separate application vs infrastructure secrets

---

### Vault IDs

**Create with vault ID**:
```bash
# Create with production vault ID
ansible-vault create --vault-id prod@prompt group_vars/production.yaml

# Create with development vault ID
ansible-vault create --vault-id dev@prompt group_vars/development.yaml
```

---

### Password Files with IDs

**Directory structure**:
```
~/.ansible/
├── vault_pass_prod
└── vault_pass_dev
```

**ansible.cfg**:
```ini
[defaults]
vault_identity_list = prod@~/.ansible/vault_pass_prod, dev@~/.ansible/vault_pass_dev
```

---

### Mixed Vault IDs

**group_vars/all.yaml**:
```yaml
---
# Encrypted with prod vault
db_password: !vault |
          $ANSIBLE_VAULT;1.2;AES256;prod
          66386439653238396430653866643361363461326633626339636630356430383038656238303862

# Encrypted with dev vault
test_api_key: !vault |
          $ANSIBLE_VAULT;1.2;AES256;dev
          35333733303632623263636366626435616463366432373733643234393431303630313937656536
```

**Run**:
```bash
# Provides both passwords
ansible-playbook playbook.yaml \
  --vault-id prod@~/.ansible/vault_pass_prod \
  --vault-id dev@~/.ansible/vault_pass_dev
```

---

## 📂 Organizing Vaulted Variables

### Pattern 1: Separate Vault Files

**Directory structure**:
```
group_vars/
├── production/
│   ├── vars.yaml          # Regular variables
│   └── vault.yaml         # Encrypted variables
└── development/
    ├── vars.yaml
    └── vault.yaml
```

**group_vars/production/vars.yaml**:
```yaml
---
app_name: myapp
app_port: 8080
db_host: db.example.com
```

**group_vars/production/vault.yaml** (encrypted):
```yaml
---
db_password: super_secret
api_key: abc123xyz
```

**Both files automatically loaded!**

---

### Pattern 2: Inline with Prefix

**group_vars/production.yaml**:
```yaml
---
# Regular variables
app_name: myapp
app_port: 8080

# Vaulted variables (with vault_ prefix)
vault_db_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          66386439653238396430653866643361363461326633626339636630356430383038656238303862

vault_api_key: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          35333733303632623263636366626435616463366432373733643234393431303630313937656536

# Reference vaulted variables
db_password: "{{ vault_db_password }}"
api_key: "{{ vault_api_key }}"
```

**Benefits**:
- Clear what's vaulted
- Easy to find encrypted values
- Can mix encrypted/unencrypted in same file

---

### Pattern 3: Role-Specific Vaults

```
roles/
└── database/
    ├── tasks/
    │   └── main.yaml
    ├── defaults/
    │   └── main.yaml
    └── vars/
        ├── main.yaml       # Regular vars
        └── vault.yaml      # Encrypted vars
```

**roles/database/vars/vault.yaml** (encrypted):
```yaml
---
postgres_password: super_secret
replication_password: another_secret
```

---

## 🎯 Real-World Example

### Complete Production Setup

**Project structure**:
```
ansible-project/
├── ansible.cfg
├── inventories/
│   ├── production/
│   │   ├── hosts.yaml
│   │   └── group_vars/
│   │       ├── all/
│   │       │   ├── vars.yaml
│   │       │   └── vault.yaml
│   │       └── webservers/
│   │           ├── vars.yaml
│   │           └── vault.yaml
│   └── staging/
│       └── ...
├── playbooks/
│   └── deploy.yaml
└── .vault_pass_prod
```

---

**ansible.cfg**:
```ini
[defaults]
inventory = inventories/production/hosts.yaml
vault_password_file = .vault_pass_prod
host_key_checking = False
```

---

**inventories/production/group_vars/all/vars.yaml**:
```yaml
---
env: production
domain: example.com
backup_enabled: true
monitoring_enabled: true
```

---

**inventories/production/group_vars/all/vault.yaml** (encrypted):
```yaml
---
# Database credentials
vault_db_admin_password: super_secret_admin_pass
vault_db_app_password: app_user_password

# API keys
vault_aws_access_key: AKIAIOSFODNN7EXAMPLE
vault_aws_secret_key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# SSL certificates
vault_ssl_cert: |
  -----BEGIN CERTIFICATE-----
  MIIDXTCCAkWgAwIBAgIJAKL0UG...
  -----END CERTIFICATE-----

vault_ssl_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQ...
  -----END PRIVATE KEY-----

# Reference variables
db_admin_password: "{{ vault_db_admin_password }}"
db_app_password: "{{ vault_db_app_password }}"
aws_access_key: "{{ vault_aws_access_key }}"
aws_secret_key: "{{ vault_aws_secret_key }}"
ssl_cert: "{{ vault_ssl_cert }}"
ssl_key: "{{ vault_ssl_key }}"
```

---

**playbooks/deploy.yaml**:
```yaml
---
- name: Deploy application
  hosts: webservers
  become: yes
  
  tasks:
    - name: Configure application
      template:
        src: app_config.j2
        dest: /etc/app/config.yaml
        mode: '0600'
      vars:
        database_url: "postgresql://app:{{ db_app_password }}@db.{{ domain }}:5432/myapp"
    
    - name: Install SSL certificate
      copy:
        content: "{{ ssl_cert }}"
        dest: /etc/ssl/certs/app.crt
        mode: '0644'
    
    - name: Install SSL key
      copy:
        content: "{{ ssl_key }}"
        dest: /etc/ssl/private/app.key
        mode: '0600'
```

---

## 🔄 CI/CD Integration

### GitLab CI

**.gitlab-ci.yml**:
```yaml
deploy:
  stage: deploy
  script:
    - echo "$ANSIBLE_VAULT_PASSWORD" > .vault_pass
    - chmod 600 .vault_pass
    - ansible-playbook playbooks/deploy.yaml --vault-password-file .vault_pass
  after_script:
    - rm -f .vault_pass
  only:
    - main
```

**GitLab CI/CD Variables**:
- Add `ANSIBLE_VAULT_PASSWORD` as masked variable

---

### GitHub Actions

**.github/workflows/deploy.yaml**:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install Ansible
        run: pip install ansible
      
      - name: Create vault password file
        run: |
          echo "${{ secrets.ANSIBLE_VAULT_PASSWORD }}" > .vault_pass
          chmod 600 .vault_pass
      
      - name: Run playbook
        run: |
          ansible-playbook playbooks/deploy.yaml \
            --vault-password-file .vault_pass
      
      - name: Cleanup
        if: always()
        run: rm -f .vault_pass
```

**GitHub Secrets**:
- Add `ANSIBLE_VAULT_PASSWORD` as repository secret

---

## 💡 Best Practices

### 1. Never Commit Unencrypted Secrets

```bash
# .gitignore
.vault_pass*
*_vault_pass*
*.secret
secrets/
```

---

### 2. Use Separate Vault Files

```
group_vars/
└── production/
    ├── vars.yaml       # Commit this
    └── vault.yaml      # Commit encrypted version
```

---

### 3. Prefix Vaulted Variables

```yaml
# Good
vault_db_password: !vault |...
db_password: "{{ vault_db_password }}"

# Harder to track
db_password: !vault |...
```

---

### 4. Document Required Secrets

**README.md**:
```markdown
## Required Secrets

The following secrets must be defined in `group_vars/production/vault.yaml`:

- `vault_db_password`: PostgreSQL database password
- `vault_api_key`: External API key
- `vault_ssl_cert`: SSL certificate
- `vault_ssl_key`: SSL private key
```

---

### 5. Rotate Vault Passwords Regularly

```bash
# Change vault password
ansible-vault rekey group_vars/*/vault.yaml
```

---

### 6. Use Vault IDs for Separation

```bash
# Different passwords for different concerns
ansible-vault create --vault-id app@prompt app_secrets.yaml
ansible-vault create --vault-id infra@prompt infra_secrets.yaml
```

---

### 7. Test Vault Access

```bash
# Verify vault can be decrypted
ansible-vault view group_vars/production/vault.yaml

# Verify playbook can access vaulted vars
ansible-playbook playbook.yaml --check
```

---

## 🔍 Troubleshooting

### ERROR: Incorrect vault password

```bash
# Check which vault IDs are needed
grep "ANSIBLE_VAULT" group_vars/**/*.yaml

# Try with --ask-vault-pass
ansible-playbook playbook.yaml --ask-vault-pass

# Check vault ID
ansible-vault view --vault-id prod@prompt file.yaml
```

---

### WARNING: Vault file not decrypted

```yaml
# This won't work:
vars:
  some_var: "{{ vault_db_password }}"  # vault_db_password not loaded!

# Fix: Include vault file
vars_files:
  - group_vars/production/vault.yaml
```

---

### Vault file corrupted

```bash
# Check if file is valid vault format
head -n 1 vault.yaml
# Should show: $ANSIBLE_VAULT;1.1;AES256

# Try to view
ansible-vault view vault.yaml
```

---

## 🔗 What's Next?

**Patterns**:
- **[ansible-patterns](ansible-patterns)** - Production automation patterns

**Infrastructure**:
- **[terraform-basics](terraform-basics)** - Infrastructure as code

---

## 📚 Resources

**Official Docs**:
- [Ansible Vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html)
- [Vault IDs](https://docs.ansible.com/ansible/latest/user_guide/vault.html#vault-ids-and-multiple-vault-passwords)

**Tools**:
- [ansible-vault-tools](https://github.com/Building5/ansible-vault-tools)

---

## 📝 Change Log

### 2026-01-30
- Created Ansible Vault guide
- Explained vault creation and management
- Covered encryption/decryption workflows
- Demonstrated password management strategies
- Included vault IDs for multiple passwords
- Provided organization patterns
- Added CI/CD integration examples
- Included best practices and troubleshooting

---

**Next Article**: [ansible-patterns](ansible-patterns) - Production automation patterns!

