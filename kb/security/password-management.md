# Password Management - Self-Hosted Bitwarden

**Resource Navigation:** [README](README) | [Two-Factor Authentication](two-factor-authentication) | [User Account Security](user-account-security) | [Secrets Management](../infrastructure/secrets-in-iac)

---

## Summary

Strong, unique passwords for every service are the foundation of security, but managing hundreds of complex passwords is impossible without a password manager. This comprehensive guide covers self-hosting Bitwarden (vaultwarden) for complete control over your password vault, implementing zero-knowledge encryption, setting up secure sharing for teams, configuring hardware key authentication, emergency access planning, password auditing, and integration with infrastructure automation. Learn production deployment patterns with Docker and Kubernetes, backup strategies, high availability configurations, and migration from other password managers. Every pattern includes security best practices, disaster recovery, and compliance considerations.

**The Golden Rule:** One strong master password protects all others; never reuse passwords across services.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Self-host Bitwarden (vaultwarden) securely
- ✅ Generate and manage strong unique passwords
- ✅ Implement zero-knowledge encryption architecture
- ✅ Configure secure password sharing for teams
- ✅ Set up two-factor authentication for vault access
- ✅ Use hardware security keys (YubiKey) with Bitwarden
- ✅ Implement emergency access and recovery procedures
- ✅ Audit passwords for weak/reused/compromised credentials
- ✅ Deploy high-availability password vault infrastructure
- ✅ Integrate password management with CI/CD pipelines

---

## Prerequisites

Before setting up password management, you should have:

- **Docker fundamentals**: [Docker Basics](../containers/docker-basics) completed
- **Web server**: Nginx or Apache for reverse proxy ([Firewall Basics](firewall-basics))
- **SSL/TLS certificate**: Let's Encrypt or valid certificate
- **Domain name**: For HTTPS access to vault
- **Backup strategy**: [Disaster Recovery](../infrastructure/disaster-recovery) understanding
- **Basic security knowledge**: Understanding of encryption and authentication

---

## Why Self-Host Password Management?

### Commercial vs. Self-Hosted

**Commercial (LastPass, 1Password, Dashlane):**
✅ Easy setup, no maintenance
✅ Mobile apps and browser extensions
❌ Subscription costs ($36-60/year)
❌ Trust third party with encrypted data
❌ Potential breach targets (LastPass 2022)
❌ Limited control over security policies

**Self-Hosted (Bitwarden/vaultwarden):**
✅ Complete control over data
✅ No subscription fees
✅ On-premises or cloud deployment
✅ Audit logs and compliance
✅ Compatible with Bitwarden clients
❌ Requires setup and maintenance
❌ You're responsible for backups

### vaultwarden vs. Official Bitwarden

**vaultwarden** (formerly bitwarden_rs):
- Lightweight Rust implementation
- 100% compatible with Bitwarden clients
- Lower resource usage (1 GB RAM vs 4+ GB)
- All premium features free
- Single container deployment
- Perfect for self-hosting

**Official Bitwarden**:
- Multiple containers (8+ services)
- Higher resource requirements
- Enterprise support available
- More complex setup

**We'll focus on vaultwarden** for cost-effective self-hosting.

---

## Installation - Docker

### Prerequisites Setup

```bash
# Create directory structure
sudo mkdir -p /opt/vaultwarden/{data,logs}
cd /opt/vaultwarden

# Create docker-compose.yml
sudo nano docker-compose.yml
```

### Basic Docker Compose

```yaml
# /opt/vaultwarden/docker-compose.yml

version: '3.8'

services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    
    environment:
      # Domain where vault will be accessible
      DOMAIN: "https://vault.example.com"
      
      # Admin panel token (generate with: openssl rand -base64 48)
      ADMIN_TOKEN: "YOUR_RANDOM_SECURE_TOKEN_HERE"
      
      # Disable signups (after creating your account)
      SIGNUPS_ALLOWED: "true"  # Set to false after registration
      
      # Email verification
      SIGNUPS_VERIFY: "true"
      
      # Invitations allowed
      INVITATIONS_ALLOWED: "true"
      
      # Show password hints
      SHOW_PASSWORD_HINT: "false"
      
      # Websocket enabled (for sync)
      WEBSOCKET_ENABLED: "true"
      
      # SMTP settings (for email notifications)
      SMTP_HOST: "smtp.example.com"
      SMTP_FROM: "vault@example.com"
      SMTP_PORT: "587"
      SMTP_SECURITY: "starttls"
      SMTP_USERNAME: "vault@example.com"
      SMTP_PASSWORD: "your_smtp_password"
      
      # Log level
      LOG_LEVEL: "info"
      EXTENDED_LOGGING: "true"
      
    volumes:
      - ./data:/data
      - ./logs:/logs
    
    ports:
      - "127.0.0.1:8080:80"  # Only expose to localhost
      - "127.0.0.1:3012:3012"  # Websocket
    
    networks:
      - vaultwarden

networks:
  vaultwarden:
    name: vaultwarden
```

### Generate Admin Token

```bash
# Generate secure admin token
openssl rand -base64 48

# Add to docker-compose.yml ADMIN_TOKEN
```

### Start Vaultwarden

```bash
# Start container
sudo docker-compose up -d

# Check logs
sudo docker-compose logs -f

# Verify running
sudo docker-compose ps

# Test access (should show web interface)
curl -I http://localhost:8080
```

---

## Nginx Reverse Proxy

### SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d vault.example.com

# Certificates will be in:
# /etc/letsencrypt/live/vault.example.com/fullchain.pem
# /etc/letsencrypt/live/vault.example.com/privkey.pem
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/vaultwarden

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name vault.example.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vault.example.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/vault.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.example.com/privkey.pem;
    
    # Strong SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # HSTS (6 months)
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "same-origin" always;
    
    # Logging
    access_log /var/log/nginx/vaultwarden-access.log;
    error_log /var/log/nginx/vaultwarden-error.log;
    
    # Client max body size (for attachments)
    client_max_body_size 525M;
    
    # Proxy to vaultwarden
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Websocket proxy (for real-time sync)
    location /notifications/hub {
        proxy_pass http://127.0.0.1:3012;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /notifications/hub/negotiate {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable and Test

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vaultwarden /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Test HTTPS access
curl -I https://vault.example.com

# Should now access web interface
# Open browser: https://vault.example.com
```

---

## Initial Setup and Configuration

### Create Admin Account

```bash
# Open web vault
# https://vault.example.com

# Create account:
# - Enter email address
# - Create strong master password (20+ characters, mixed case, numbers, symbols)
# - Master password hint (don't make it obvious!)

# CRITICAL: Write master password in secure location
# - Physical safe
# - Safety deposit box
# - Multiple secure locations
```

### Disable Public Registrations

```yaml
# /opt/vaultwarden/docker-compose.yml
# After creating your account:

environment:
  SIGNUPS_ALLOWED: "false"  # Disable public signups
  INVITATIONS_ALLOWED: "true"  # Keep for team members
```

```bash
# Restart container
cd /opt/vaultwarden
sudo docker-compose restart
```

### Admin Panel

```bash
# Access admin panel
# https://vault.example.com/admin

# Use ADMIN_TOKEN from docker-compose.yml

# Admin panel features:
# - View users
# - Disable/delete users
# - View diagnostics
# - Configure settings
# - Force password resets
```

### Configure Organization (Teams)

```
Web Vault → Organizations → New Organization

1. Create organization:
   - Name: "MyCompany IT"
   - Billing email: admin@example.com
   - Collection: Create default collections

2. Invite users:
   - Settings → Manage → People
   - Invite User
   - Enter email address
   - Select collections
   - Set access level (Manager/User/Custom)

3. Create collections:
   - Tab: Collections
   - New Collection: "Production Servers"
   - New Collection: "Staging Servers"
   - New Collection: "Cloud Services"
   - Assign users to collections
```

---

## Client Applications

### Browser Extensions

```bash
# Install browser extensions:
# Chrome/Edge: https://chrome.google.com/webstore
# Firefox: https://addons.mozilla.org
# Safari: https://apps.apple.com

# Search: "Bitwarden"

# Configure extension:
# 1. Click Bitwarden icon
# 2. Settings (gear icon)
# 3. Self-hosted Environment
# 4. Server URL: https://vault.example.com
# 5. Save
# 6. Log in with email/master password
```

### Desktop Applications

```bash
# Download from: https://bitwarden.com/download/

# Linux (AppImage)
wget https://vault.bitwarden.com/download/?app=desktop&platform=linux
chmod +x Bitwarden-*.AppImage
./Bitwarden-*.AppImage

# Configure server:
# File → Settings → Self-hosted
# Server URL: https://vault.example.com
```

### Mobile Apps

```
iOS: App Store → "Bitwarden"
Android: Play Store → "Bitwarden"

Configuration:
1. Open app
2. Settings (gear icon)
3. Self-hosted
4. Server URL: https://vault.example.com
5. Save
6. Log in
```

### CLI Tool

```bash
# Install Bitwarden CLI
npm install -g @bitwarden/cli

# Or with snap
sudo snap install bw

# Configure server
bw config server https://vault.example.com

# Log in
bw login your-email@example.com

# Unlock vault (returns session key)
export BW_SESSION=$(bw unlock --raw)

# List items
bw list items

# Get password
bw get password "GitHub"

# Generate password
bw generate -ulns --length 20
```

---

## Password Best Practices

### Master Password Requirements

```
✅ Minimum 16 characters (20+ recommended)
✅ Mix uppercase, lowercase, numbers, symbols
✅ Not a dictionary word or common phrase
✅ Never reused from other services
✅ Memorable but not guessable
✅ Written down in secure physical location

❌ No personal information (birthdays, names)
❌ No keyboard patterns (qwerty, 123456)
❌ No common substitutions (P@ssw0rd)
❌ Never shared with anyone
❌ Never typed on untrusted devices
```

### Example Master Password Strategy

**Passphrase method** (Diceware):
- Use 6-7 random words: `correct-horse-battery-staple-purple-monkey-7`
- Add numbers and symbols: `correct-horse-battery!staple23purple`
- ~80+ bits entropy

**Random method**:
- Generate: `K9mP!xQ7vL#2wR8bN$5cF`
- Store in safe place (physical only)
- Practice typing regularly

### Password Generation Rules

```
For passwords stored in Bitwarden:
✅ Length: 20+ characters
✅ Include: Uppercase, lowercase, numbers, symbols
✅ Unique for every service
✅ Generated by Bitwarden (don't create manually)

For service accounts (infrastructure):
✅ Length: 32+ characters
✅ Store in Bitwarden + secret management (Vault)
✅ Rotate regularly (90 days)
```

---

## Two-Factor Authentication

### Enable 2FA for Vault

```
Web Vault → Settings → Two-step Login

Options:
1. Authenticator app (TOTP) - Free
2. Email - Free
3. YubiKey - Free (vaultwarden premium features)
4. Duo - Requires Duo account
5. FIDO2 WebAuthn - Free (hardware keys)
```

### Authenticator App (TOTP)

```
1. Settings → Two-step Login → Authenticator App
2. Scan QR code with authenticator:
   - Authy
   - Google Authenticator
   - Microsoft Authenticator
   - andOTP (open source)
3. Enter 6-digit code to confirm
4. Save recovery code (CRITICAL!)
5. Enable

⚠️  Store recovery code in multiple secure locations:
   - Encrypted backup
   - Safe deposit box
   - Print and secure physically
```

### Hardware Security Keys (YubiKey)

```
Supported keys:
- YubiKey 5 Series
- YubiKey 5C
- YubiKey Security Key (FIDO2)

Setup:
1. Settings → Two-step Login → YubiKey
2. Insert YubiKey
3. Click in "Key 1" field
4. Touch YubiKey button
5. Repeat for Key 2 (backup key)
6. Enable

⚠️  Always configure 2 keys:
   - Primary (on keychain)
   - Backup (in safe location)
```

### FIDO2 WebAuthn

```
1. Settings → Two-step Login → FIDO2 WebAuthn
2. Name your key: "YubiKey Blue"
3. Insert key and follow browser prompts
4. Touch key when it blinks
5. Add additional keys (backups)

Advantages:
- Phishing resistant
- No codes to type
- Hardware-backed security
- Works with YubiKey, Titan, SoloKey
```

### Recovery Codes

```
⚠️  CRITICAL: Save recovery code!

Without recovery code:
- Lost 2FA device = locked out permanently
- No master password reset
- Vault data unrecoverable

Storage recommendations:
1. Print physical copy → safe
2. Encrypted file → separate vault
3. Safety deposit box
4. Trusted family member (sealed envelope)

NEVER store in same location as master password!
```

---

## Secure Password Sharing

### Organization Collections

```
Organization → Collections → New Collection

Structure example:
├── Production
│   ├── AWS Root Account
│   ├── Database Master Passwords
│   └── SSL/TLS Certificates
├── Development
│   ├── Staging Servers
│   └── API Keys (dev)
├── SaaS Applications
│   ├── GitHub Organization
│   ├── CloudFlare Account
│   └── Slack Workspace
└── Shared Accounts
    ├── Company LinkedIn
    └── Domain Registrar
```

### User Access Control

```
Users and access levels:

Read Only:
- View passwords
- Cannot edit or delete
- Good for: Junior staff, contractors

User:
- View passwords
- Add new items
- Cannot manage collections
- Good for: Standard users

Manager:
- All User permissions
- Manage collection membership
- Assign/remove users
- Good for: Team leads

Admin:
- All Manager permissions
- Create/delete collections
- Manage billing
- Good for: IT administrators
```

### Secure Sharing Example

```
Sharing database password with team:

1. Create item in Bitwarden:
   Name: PostgreSQL Production Master
   Username: postgres
   Password: (generate 32 characters)
   URI: postgresql://prod-db.example.com:5432
   
2. Add to Collection: "Production Databases"

3. Assign users to collection:
   - alice@example.com: Manager
   - bob@example.com: User
   - charlie@example.com: Read Only

4. Users receive invitation email

5. Password changes sync automatically

Benefits:
- No password sent via Slack/email
- Centralized rotation
- Audit trail of access
- Automatic revocation on user removal
```

---

## Emergency Access

### Set Up Emergency Access

```
Web Vault → Settings → Emergency Access

Purpose:
- Trusted person can access vault if you're incapacitated
- Configurable wait time (7-90 days)
- You're notified and can reject request

Setup:
1. Add emergency contact (email)
2. Set wait time: 7 days (minimum recommended)
3. Set access level:
   - View: Can see passwords
   - Takeover: Can reset master password
4. Contact receives invitation
5. They create Bitwarden account
```

### Request Emergency Access

```
Trusted user initiates:
1. Log into Bitwarden
2. Emergency Access → View
3. Request Access

Process:
1. You receive email notification
2. If you don't respond in wait time (7 days):
   - Access automatically granted
3. If responsive, you can:
   - Approve immediately
   - Reject request
   - Extend wait time

Trusted user receives:
- Read-only access to vault (View)
- OR ability to reset master password (Takeover)
```

### Emergency Access Best Practices

```
✅ Choose trusted person:
   - Spouse/partner
   - Parent/sibling
   - Lawyer/executor
   
✅ Set appropriate wait time:
   - Too short: Accidental/malicious access
   - Too long: Defeats purpose
   - 7-14 days recommended

✅ Document process:
   - Include in will/estate plan
   - Inform trusted person
   - Update contact info regularly

✅ Test annually:
   - Verify contact still has access
   - Ensure they remember process
   - Update wait time if needed

❌ Don't use for:
   - Convenience ("I forgot my password")
   - Sharing with co-workers
   - Shortcuts around 2FA
```

---

## Backup and Disaster Recovery

### Automated Backups

```bash
#!/bin/bash
# /opt/vaultwarden/backup.sh - Automated vault backup

BACKUP_DIR="/backup/vaultwarden"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Stop vaultwarden (or use database backup while running)
cd /opt/vaultwarden
docker-compose stop

# Backup data directory
tar -czf "$BACKUP_DIR/vaultwarden-data-$DATE.tar.gz" ./data

# Backup docker-compose configuration
cp docker-compose.yml "$BACKUP_DIR/docker-compose-$DATE.yml"

# Restart vaultwarden
docker-compose start

# Remove backups older than retention period
find "$BACKUP_DIR" -name "vaultwarden-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Encrypt backup (optional but recommended)
gpg --encrypt --recipient admin@example.com "$BACKUP_DIR/vaultwarden-data-$DATE.tar.gz"
rm "$BACKUP_DIR/vaultwarden-data-$DATE.tar.gz"  # Remove unencrypted

# Copy to offsite location
rclone sync "$BACKUP_DIR" remote:vaultwarden-backups

echo "Backup completed: vaultwarden-data-$DATE.tar.gz"
```

### Schedule Backups

```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/vaultwarden/backup.sh >> /var/log/vaultwarden-backup.log 2>&1

# Weekly backup on Sunday at 3 AM (longer retention)
0 3 * * 0 /opt/vaultwarden/backup-weekly.sh >> /var/log/vaultwarden-backup.log 2>&1
```

### Export Vault Data

```
Manual export (encrypted):

1. Web Vault → Tools → Export Vault
2. File Format: Encrypted JSON (.json)
3. Master Password Verification
4. Download file
5. Store in secure location (not on same server!)

Unencrypted export (for migration):
1. Export Vault → .json or .csv
2. WARNING: Plaintext passwords!
3. Use immediately for migration
4. Securely delete after migration
5. Never store unencrypted exports
```

### Restore from Backup

```bash
# Stop vaultwarden
cd /opt/vaultwarden
docker-compose stop

# Restore data
tar -xzf /backup/vaultwarden/vaultwarden-data-20260130-020000.tar.gz -C ./

# Start vaultwarden
docker-compose start

# Verify
docker-compose logs -f
```

---

## Kubernetes Deployment

### Kubernetes Manifests

```yaml
# vaultwarden-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: vaultwarden

---
# vaultwarden-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: vaultwarden-data
  namespace: vaultwarden
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: longhorn  # or your storage class

---
# vaultwarden-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: vaultwarden-secrets
  namespace: vaultwarden
type: Opaque
stringData:
  ADMIN_TOKEN: "your-secure-admin-token-here"
  SMTP_PASSWORD: "your-smtp-password"

---
# vaultwarden-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vaultwarden-config
  namespace: vaultwarden
data:
  DOMAIN: "https://vault.example.com"
  SIGNUPS_ALLOWED: "false"
  INVITATIONS_ALLOWED: "true"
  WEBSOCKET_ENABLED: "true"
  SMTP_HOST: "smtp.example.com"
  SMTP_FROM: "vault@example.com"
  SMTP_PORT: "587"
  SMTP_SECURITY: "starttls"
  SMTP_USERNAME: "vault@example.com"
  LOG_LEVEL: "info"

---
# vaultwarden-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vaultwarden
  namespace: vaultwarden
spec:
  replicas: 1  # Don't scale >1 (SQLite single-writer)
  selector:
    matchLabels:
      app: vaultwarden
  template:
    metadata:
      labels:
        app: vaultwarden
    spec:
      containers:
      - name: vaultwarden
        image: vaultwarden/server:latest
        imagePullPolicy: Always
        
        envFrom:
        - configMapRef:
            name: vaultwarden-config
        - secretRef:
            name: vaultwarden-secrets
        
        ports:
        - containerPort: 80
          name: http
        - containerPort: 3012
          name: websocket
        
        volumeMounts:
        - name: data
          mountPath: /data
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /alive
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 30
        
        readinessProbe:
          httpGet:
            path: /alive
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
      
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: vaultwarden-data

---
# vaultwarden-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: vaultwarden
  namespace: vaultwarden
spec:
  selector:
    app: vaultwarden
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: websocket
    port: 3012
    targetPort: 3012
  type: ClusterIP

---
# vaultwarden-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vaultwarden
  namespace: vaultwarden
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "525m"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - vault.example.com
    secretName: vaultwarden-tls
  rules:
  - host: vault.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vaultwarden
            port:
              number: 80
      - path: /notifications/hub
        pathType: Prefix
        backend:
          service:
            name: vaultwarden
            port:
              number: 3012
```

### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f vaultwarden-namespace.yaml
kubectl apply -f vaultwarden-pvc.yaml
kubectl apply -f vaultwarden-secret.yaml
kubectl apply -f vaultwarden-configmap.yaml
kubectl apply -f vaultwarden-deployment.yaml
kubectl apply -f vaultwarden-service.yaml
kubectl apply -f vaultwarden-ingress.yaml

# Verify deployment
kubectl get pods -n vaultwarden
kubectl logs -f deployment/vaultwarden -n vaultwarden

# Check ingress
kubectl get ingress -n vaultwarden

# Access web vault
# https://vault.example.com
```

---

## Password Auditing

### Built-in Audit Tools

```
Web Vault → Tools → Vault Health Reports

Reports:
1. Exposed Passwords
   - Checks against haveibeenpwned.com
   - Passwords found in data breaches
   - Action: Change immediately

2. Reused Passwords
   - Same password used multiple places
   - Risk: One breach compromises all
   - Action: Generate unique for each

3. Weak Passwords
   - Short or simple passwords
   - Low entropy/easily guessed
   - Action: Generate strong 20+ char

4. Unsecured Websites
   - Login items using HTTP (not HTTPS)
   - Credentials sent in plaintext
   - Action: Use HTTPS only

5. Inactive 2FA
   - Sites supporting 2FA but not enabled
   - Missing additional security layer
   - Action: Enable 2FA everywhere possible

6. Data Breach Report
   - Email addresses found in breaches
   - Action: Change passwords, enable 2FA
```

### CLI Audit Script

```bash
#!/bin/bash
# audit-passwords.sh - Automated password audit

export BW_SESSION=$(bw unlock --raw)

echo "=== Bitwarden Vault Audit ==="
echo

# Count total items
TOTAL=$(bw list items | jq length)
echo "Total vault items: $TOTAL"
echo

# Items with weak passwords (< 12 chars)
WEAK=$(bw list items | jq '[.[] | select(.login.password != null) | select((.login.password | length) < 12)] | length')
echo "Weak passwords (< 12 chars): $WEAK"

# Items without 2FA
NO_2FA=$(bw list items | jq '[.[] | select(.login.totp == null)] | length')
echo "Items without 2FA configured: $NO_2FA"

# Items with HTTP (not HTTPS)
HTTP=$(bw list items | jq '[.[] | select(.login.uris != null) | select(.login.uris[0].uri | startswith("http://"))] | length')
echo "Insecure HTTP items: $HTTP"

# List items needing attention
echo
echo "=== Items Requiring Action ==="
bw list items | jq -r '.[] | select(.login.password != null) | select((.login.password | length) < 12) | .name'

# Export detailed report
bw list items | jq '[.[] | {name, username: .login.username, password_length: (.login.password | length), has_2fa: (.login.totp != null), uri: .login.uris[0].uri}]' > vault-audit-report.json

echo
echo "Detailed report saved: vault-audit-report.json"
```

---

## Integration with Infrastructure

### Ansible Integration

```yaml
# playbook.yml - Retrieve secrets from Bitwarden

---
- name: Deploy application with Bitwarden secrets
  hosts: webservers
  tasks:
    - name: Get database password from Bitwarden
      shell: |
        export BW_SESSION=$(bw unlock --raw <<< "{{ vault_master_password }}")
        bw get password "Production PostgreSQL"
      register: db_password
      no_log: true
    
    - name: Configure application
      template:
        src: app-config.j2
        dest: /etc/myapp/config.yml
      vars:
        database_password: "{{ db_password.stdout }}"
```

### Terraform Integration

```bash
# Use Bitwarden CLI in Terraform

# data.tf
data "external" "db_password" {
  program = ["bash", "-c", <<EOT
    export BW_SESSION=$(bw unlock --raw)
    PASSWORD=$(bw get password "Terraform DB Password")
    echo "{\"password\": \"$PASSWORD\"}"
EOT
  ]
}

# main.tf
resource "postgresql_role" "app" {
  name     = "appuser"
  password = data.external.db_password.result.password
  login    = true
}
```

### Docker Secrets

```yaml
# docker-compose.yml - Load secrets from Bitwarden

version: '3.8'

services:
  app:
    image: myapp:latest
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt

# Generate secret file:
# bw get password "App Database" > ./secrets/db_password.txt
```

---

## Troubleshooting

### Cannot Access Web Vault

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs -f vaultwarden

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/vaultwarden-error.log

# Check SSL certificate
openssl s_client -connect vault.example.com:443

# Test direct container access
curl -I http://localhost:8080

# Check firewall
sudo iptables -L INPUT -n -v | grep 443
```

### Forgot Master Password

```
⚠️  NO PASSWORD RESET OPTION

If you forget master password:
1. Check physical backup locations
2. Use emergency access (if configured)
3. If no backup/emergency access:
   → Data is PERMANENTLY LOST

Zero-knowledge encryption means:
- Bitwarden cannot reset password
- No backdoor or recovery
- This is a feature, not a bug

Prevention:
✅ Write master password in safe
✅ Configure emergency access
✅ Practice typing regularly
✅ Store hint (not password!)
```

### Lost 2FA Device

```
Use recovery code:
1. Login page → "Use another two-step login method"
2. Select "Recovery code"
3. Enter recovery code
4. Disable lost 2FA method
5. Configure new 2FA

Without recovery code:
- Contact admin (if organization)
- Check backup locations (safe/print)
- If self-hosted: Access database directly (advanced)

For database recovery (last resort):
docker-compose exec vaultwarden sqlite3 /data/db.sqlite3
sqlite> UPDATE users SET totp_secret = NULL WHERE email = 'you@example.com';
sqlite> .quit
```

### Sync Issues

```bash
# Check websocket connection
# Browser DevTools → Network → WS tab
# Should see connection to wss://vault.example.com/notifications/hub

# Verify websocket proxy in Nginx
sudo grep -A 10 "notifications/hub" /etc/nginx/sites-available/vaultwarden

# Check container websocket port
docker-compose ps
# Should show 3012:3012

# Force sync in client
# Browser extension → Settings → Sync vault now
```

---

## Security Best Practices

### Password Management Checklist

```
☑ Master password 20+ characters
☑ Master password written in safe
☑ Two-factor authentication enabled (hardware key)
☑ Backup 2FA recovery codes
☑ Emergency access configured
☑ Public signups disabled
☑ HTTPS with valid certificate
☑ Regular backups (daily automated)
☑ Offsite backup storage
☑ Password audit performed quarterly
☑ Weak/reused passwords eliminated
☑ Admin token secured
☑ SMTP notifications enabled
☑ Firewall rules configured
☑ Fail2ban enabled
☑ Regular security updates
☑ Access logs monitored
☑ Organization collections structured
☑ User access reviewed quarterly
☑ Documentation maintained
```

---

## What's Next?

After setting up password management:

**Authentication Security:**
- [Two-Factor Authentication](two-factor-authentication) - TOTP, hardware keys
- [User Account Security](user-account-security) - Least privilege, sudo hardening
- [SSH Security Hardening](ssh-security-hardening) - SSH key management

**Infrastructure Secrets:**
- [Secrets Management](../infrastructure/secrets-in-iac) - Vault, SOPS, sealed secrets
- [HashiCorp Vault](vault-introduction) - Dynamic secrets, PKI

**Advanced Security:**
- [Certificate Management](certificate-fundamentals) - PKI, certificate rotation
- [Zero Trust Principles](zero-trust-principles) - Never trust, always verify

---

## Additional Resources

### Official Documentation
- [Bitwarden Official](https://bitwarden.com/)
- [vaultwarden GitHub](https://github.com/dani-garcia/vaultwarden)
- [vaultwarden Wiki](https://github.com/dani-garcia/vaultwarden/wiki)

### Tutorials & Guides
- [Self-Hosting Bitwarden](https://www.linuxbabe.com/ubuntu/install-bitwarden-server-ubuntu-20-04-docker-compose)
- [Bitwarden Security Whitepaper](https://bitwarden.com/images/resources/security-white-paper-download.pdf)

### Tools
- [Bitwarden CLI](https://bitwarden.com/help/cli/)
- [haveibeenpwned](https://haveibeenpwned.com/) - Check for breached passwords
- [Diceware](https://diceware.dmuth.org/) - Passphrase generator

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive password management guide covering self-hosted Bitwarden (vaultwarden) deployment with Docker and Kubernetes, master password strategies, zero-knowledge encryption, two-factor authentication (TOTP/YubiKey/FIDO2), hardware security keys, secure password sharing with organizations and collections, emergency access procedures, automated backup strategies, disaster recovery, password auditing tools, integration with Ansible/Terraform/Docker, CLI automation, troubleshooting, and complete security best practices for production environments.

