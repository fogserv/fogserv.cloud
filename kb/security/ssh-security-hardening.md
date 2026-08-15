# SSH Security Hardening

**Resource Navigation:** [README](README) | [SSH Basics](../basics/ssh-basics) | [Firewall Basics](firewall-basics) | [Password Management](password-management) | [User Account Security](user-account-security)

---

## Summary

SSH is the primary access method for remote server management, making it a critical attack surface that requires comprehensive hardening. This guide covers production-grade SSH security from disabling password authentication through advanced patterns like port knocking, bastion hosts, certificate authentication, and zero-trust SSH access. Learn how to configure SSH to resist brute-force attacks, prevent unauthorized access, implement multi-factor authentication, audit all SSH activity, and build secure SSH architectures for everything from single servers to large fleets. Every pattern is production-tested and includes real-world examples from enterprise environments, cloud platforms, and security-conscious organizations.

**The Golden Rule:** If SSH is compromised, your entire infrastructure is compromised. Harden it relentlessly.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Disable password authentication and enforce key-only access
- ✅ Configure SSH keys with passphrases and proper permissions
- ✅ Harden sshd_config with industry best practices
- ✅ Implement SSH certificate authorities for fleet management
- ✅ Set up multi-factor authentication for SSH
- ✅ Configure port knocking for stealth SSH access
- ✅ Build bastion/jump host architectures
- ✅ Audit SSH access with comprehensive logging
- ✅ Restrict SSH access by IP, user, and time
- ✅ Implement automated SSH key rotation
- ✅ Troubleshoot SSH security configurations

---

## Prerequisites

Before diving into SSH hardening, you should have:

- **SSH fundamentals**: Completed [SSH Basics](../basics/ssh-basics) or equivalent
- **Linux proficiency**: Understanding of file permissions, users, and services
- **Basic security awareness**: Understanding of public key cryptography
- **Root/sudo access**: Ability to modify SSH server configuration
- **Backup access method**: Console access or alternative login method before locking yourself out

---

## Why SSH Security Matters

### The Threat Landscape

**Real-world SSH attacks:**

```bash
# Typical SSH brute-force attack from logs
Jan 30 12:34:56 sshd[1234]: Failed password for root from 203.0.113.42 port 48923 ssh2
Jan 30 12:34:58 sshd[1235]: Failed password for root from 203.0.113.42 port 48924 ssh2
Jan 30 12:35:00 sshd[1236]: Failed password for root from 203.0.113.42 port 48925 ssh2
# ... thousands of attempts per hour
```

**Common attack vectors:**
- **Brute-force password attacks**: Automated login attempts with common passwords
- **Credential stuffing**: Using leaked passwords from other breaches
- **SSH key theft**: Compromised private keys from developer machines
- **Weak passphrases**: Unprotected SSH keys
- **Default credentials**: root/admin/test accounts with weak passwords
- **Exposed management ports**: SSH on port 22 visible to internet
- **Vulnerable SSH versions**: Unpatched SSH servers with known exploits

**Consequences of SSH compromise:**
- Complete server takeover
- Lateral movement to other systems
- Data exfiltration
- Ransomware deployment
- Cryptomining installations
- Backdoor persistence
- Supply chain attacks (compromised CI/CD)

### Defense in Depth for SSH

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Network (Firewall, Port Knocking)     │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Layer 2: Authentication (Key-Only, MFA)        │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Layer 3: Authorization (User Restrictions)     │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Layer 4: Monitoring (Audit Logs, Alerts)       │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Layer 5: Architecture (Bastion, Segmentation)  │
└─────────────────────────────────────────────────┘
```

---

## Key-Only Authentication

### Disable Password Authentication

**The single most important SSH hardening step:**

```bash
# Edit SSH server configuration
sudo vi /etc/ssh/sshd_config

# Disable password authentication
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM no  # Or yes if using PAM for other purposes

# Disable empty passwords (should already be no)
PermitEmptyPasswords no

# Disable root login entirely
PermitRootLogin no

# Or allow root only with keys (less secure, not recommended)
# PermitRootLogin prohibit-password
```

**Test configuration before restarting:**

```bash
# Validate sshd_config syntax
sudo sshd -t

# If no errors, restart SSH service
sudo systemctl restart sshd

# Ubuntu/Debian
sudo systemctl restart ssh
```

**CRITICAL: Test before logging out!**

```bash
# Open a NEW terminal session while keeping current session open
# Try to SSH in with your key
ssh user@server

# If it works, you're safe to close the old session
# If it doesn't work, fix it in the old session before closing
```

### SSH Key Best Practices

**Generate strong SSH keys:**

```bash
# ED25519 (recommended - fastest, most secure)
ssh-keygen -t ed25519 -C "user@hostname-$(date +%Y%m%d)"

# RSA 4096-bit (for compatibility with older systems)
ssh-keygen -t rsa -b 4096 -C "user@hostname-$(date +%Y%m%d)"

# Always use a strong passphrase!
# Enter passphrase (empty for no passphrase): [type strong passphrase]
# Enter same passphrase again: [type strong passphrase]
```

**Key storage and permissions:**

```bash
# Private key must be readable only by owner
chmod 600 ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_rsa

# Public key can be readable by all
chmod 644 ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/id_rsa.pub

# .ssh directory must be restricted
chmod 700 ~/.ssh

# authorized_keys must be restricted
chmod 600 ~/.ssh/authorized_keys
```

**Verify key permissions:**

```bash
# Check permissions
ls -la ~/.ssh/

# Output should look like:
# drwx------   2 user user  4096 Jan 30 12:00 .
# -rw-------   1 user user   464 Jan 30 12:00 id_ed25519
# -rw-r--r--   1 user user   102 Jan 30 12:00 id_ed25519.pub
# -rw-------   1 user user   733 Jan 30 12:00 authorized_keys
```

### SSH Agent with Passphrase

Use SSH agent to avoid typing passphrase repeatedly:

```bash
# Start SSH agent (usually auto-started)
eval "$(ssh-agent -s)"

# Add key to agent (will prompt for passphrase once)
ssh-add ~/.ssh/id_ed25519

# List loaded keys
ssh-add -l

# Remove all keys from agent (when done)
ssh-add -D

# Kill agent
ssh-agent -k
```

**Automatic agent startup (add to ~/.bashrc or ~/.zshrc):**

```bash
# Start SSH agent if not running
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)" > /dev/null
    ssh-add ~/.ssh/id_ed25519 2>/dev/null
fi
```

### SSH Key Management for Multiple Servers

```bash
# ~/.ssh/config - Client-side SSH configuration
Host webserver
    HostName 192.168.1.10
    User webadmin
    IdentityFile ~/.ssh/id_ed25519_webserver
    Port 22

Host database
    HostName 192.168.1.20
    User dbadmin
    IdentityFile ~/.ssh/id_ed25519_database
    Port 2222

Host bastion
    HostName bastion.example.com
    User admin
    IdentityFile ~/.ssh/id_ed25519_bastion
    Port 22
    
Host private-server
    HostName 10.0.1.50
    User sysadmin
    IdentityFile ~/.ssh/id_ed25519
    ProxyJump bastion  # Access through bastion

# Wildcard configuration for all servers in domain
Host *.example.com
    User deploy
    IdentityFile ~/.ssh/id_ed25519_company
    ForwardAgent no
    StrictHostKeyChecking accept-new
```

**Usage:**

```bash
# Connect using host alias
ssh webserver
ssh database
ssh private-server  # Automatically jumps through bastion
```

---

## Hardened sshd_config

### Complete Production Configuration

```bash
# /etc/ssh/sshd_config - Comprehensive hardened configuration

# ============================================================
# NETWORK
# ============================================================

# Listen on specific IP only (not 0.0.0.0)
ListenAddress 192.168.1.10
# Or multiple IPs
# ListenAddress 10.0.0.10
# ListenAddress 192.168.1.10

# Use non-standard port (security through obscurity, minor benefit)
Port 2222  # Or keep 22 if using port knocking/firewall

# Protocol version (2 only, never 1)
Protocol 2

# ============================================================
# AUTHENTICATION
# ============================================================

# Disable password authentication
PasswordAuthentication no
ChallengeResponseAuthentication no
PermitEmptyPasswords no

# Key-only authentication
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Disable root login
PermitRootLogin no

# Limit authentication attempts
MaxAuthTries 3
MaxSessions 2

# Authentication timeout
LoginGraceTime 30

# ============================================================
# CRYPTOGRAPHY
# ============================================================

# Strong key exchange algorithms (disable weak ones)
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256

# Strong ciphers (AES-GCM preferred)
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# Strong MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256

# Host keys (prefer Ed25519)
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

# ============================================================
# ACCESS CONTROL
# ============================================================

# Restrict users (whitelist approach)
AllowUsers admin deploy webmaster
# Or use groups
AllowGroups sshusers wheel

# Deny specific users
DenyUsers root guest test

# Restrict by IP (source restriction)
# In Match blocks below

# ============================================================
# FEATURES & HARDENING
# ============================================================

# Disable X11 forwarding (unless needed)
X11Forwarding no

# Disable agent forwarding (unless needed)
AllowAgentForwarding no

# Disable TCP forwarding (unless needed for tunnels)
AllowTcpForwarding no

# Disable StreamLocal forwarding
AllowStreamLocalForwarding no

# Disable gateway ports
GatewayPorts no

# Disable permission for users to set environment options
PermitUserEnvironment no

# Use privilege separation (already default)
UsePrivilegeSeparation sandbox

# Strict mode (check file permissions)
StrictModes yes

# Disable .rhosts authentication
IgnoreRhosts yes
RhostsRSAAuthentication no
HostbasedAuthentication no

# ============================================================
# LOGGING
# ============================================================

# Verbose logging for security auditing
LogLevel VERBOSE  # Or INFO for less verbosity
SyslogFacility AUTH

# ============================================================
# TIMEOUTS
# ============================================================

# Client alive interval (keep connection alive, detect dead clients)
ClientAliveInterval 300  # Send keepalive every 5 minutes
ClientAliveCountMax 2    # Disconnect after 2 failed keepalives (10 min total)

# Idle timeout (disconnect inactive sessions)
# Note: This is handled by ClientAlive* settings above

# ============================================================
# BANNER & LEGAL
# ============================================================

# Display banner before authentication
Banner /etc/ssh/banner.txt

# Print MOTD after login
PrintMotd no  # Let PAM handle it

# Print last log on login
PrintLastLog yes

# ============================================================
# PAM
# ============================================================

# Use PAM for additional authentication/session management
UsePAM yes

# ============================================================
# CONDITIONAL ACCESS
# ============================================================

# Restrict specific users to specific sources
Match User backup
    AllowUsers backup
    PasswordAuthentication no
    AllowTcpForwarding no
    X11Forwarding no
    PermitTunnel no
    ForceCommand /usr/local/bin/backup-only.sh

# Admin access only from specific IPs
Match User admin Address 10.0.0.0/8,192.168.1.0/24
    PasswordAuthentication no
    AllowTcpForwarding yes

# Restricted access for automation accounts
Match User deploy
    PasswordAuthentication no
    AllowTcpForwarding no
    X11Forwarding no
    ForceCommand /usr/local/bin/deploy.sh

# ============================================================
# SUBSYSTEMS
# ============================================================

# SFTP subsystem (internal server recommended)
Subsystem sftp internal-sftp

# Chroot SFTP users
Match Group sftponly
    ChrootDirectory /home/%u
    ForceCommand internal-sftp
    AllowTcpForwarding no
    X11Forwarding no
```

### Banner Configuration

```bash
# /etc/ssh/banner.txt
#############################################################################
#                                                                           #
#  WARNING: AUTHORIZED ACCESS ONLY                                          #
#                                                                           #
#  This system is for authorized use only. All activity is logged and      #
#  monitored. Unauthorized access or use is prohibited and may result      #
#  in criminal and/or civil prosecution.                                   #
#                                                                           #
#  By accessing this system, you consent to monitoring and recording.      #
#                                                                           #
#############################################################################
```

### Apply and Test Configuration

```bash
# Validate configuration syntax
sudo sshd -t

# Check for specific configuration issues
sudo sshd -T | grep -i "passwordauthentication\|permitrootlogin\|port"

# Restart SSH service (keep current session open!)
sudo systemctl restart sshd

# Test from another terminal
ssh -p 2222 user@server

# View SSH service status
sudo systemctl status sshd

# Check SSH logs for errors
sudo journalctl -u sshd -n 50 --no-pager
```

---

## Multi-Factor Authentication (MFA)

### Google Authenticator TOTP

Install and configure TOTP-based MFA:

```bash
# Install Google Authenticator PAM module
# Ubuntu/Debian
sudo apt install libpam-google-authenticator

# RHEL/CentOS
sudo yum install google-authenticator

# Arch
sudo pacman -S libpam-google-authenticator
```

**Configure for user:**

```bash
# Run as the user who will use MFA (not root!)
su - username
google-authenticator

# Answer questions:
# Do you want authentication tokens to be time-based? y
# [QR code displayed - scan with authenticator app]
# Your new secret key is: ABCD1234EFGH5678
# Your emergency scratch codes are:
#   12345678
#   87654321
#   [more codes]
# 
# Do you want to disallow multiple uses of same token? y
# Do you want to increase time window to 3 intervals? n
# Do you want to enable rate-limiting? y
```

**Configure PAM:**

```bash
# Edit PAM SSH configuration
sudo vi /etc/pam.d/sshd

# Add at the top (before @include common-auth)
auth required pam_google_authenticator.so nullok

# nullok allows users without MFA configured to still login
# Remove nullok after all users have configured MFA
```

**Update sshd_config:**

```bash
# Enable challenge-response (for MFA)
ChallengeResponseAuthentication yes

# Enable PAM
UsePAM yes

# Enable public key + MFA (both required)
AuthenticationMethods publickey,keyboard-interactive
```

**Restart SSH:**

```bash
sudo systemctl restart sshd
```

**Test MFA login:**

```bash
# SSH will now require:
# 1. SSH key
# 2. TOTP code from authenticator app

ssh user@server
# Enter your SSH key passphrase (if set)
# Verification code: [enter 6-digit TOTP code]
```

### YubiKey Hardware Authentication

```bash
# Install YubiKey PAM module
sudo apt install libpam-yubico

# Configure YubiKey authentication
sudo vi /etc/pam.d/sshd

# Add YubiKey auth
auth required pam_yubico.so mode=challenge-response

# Update sshd_config
AuthenticationMethods publickey,keyboard-interactive:pam
```

---

## Port Knocking

Port knocking provides "stealth mode" SSH by hiding the SSH port until a secret knock sequence is received.

### knockd Configuration

```bash
# Install knock daemon
sudo apt install knockd  # Debian/Ubuntu
sudo yum install knock-server  # RHEL/CentOS

# Configure knock sequences
sudo vi /etc/knockd.conf
```

**knockd.conf:**

```ini
[options]
    UseSyslog
    LogLevel = info

[openSSH]
    sequence      = 7000,8000,9000  # Knock sequence (TCP ports)
    seq_timeout   = 10               # Seconds to complete sequence
    command       = /usr/sbin/iptables -I INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
    tcpflags      = syn
    cmd_timeout   = 30               # Keep port open for 30 seconds
    stop_command  = /usr/sbin/iptables -D INPUT -s %IP% -p tcp --dport 22 -j ACCEPT

[closeSSH]
    sequence      = 9000,8000,7000  # Reverse sequence to close
    seq_timeout   = 10
    command       = /usr/sbin/iptables -D INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
    tcpflags      = syn
```

**Enable and start knockd:**

```bash
# Enable knockd in startup config
sudo vi /etc/default/knockd
# Set: START_KNOCKD=1

# Start knockd service
sudo systemctl enable knockd
sudo systemctl start knockd

# Verify running
sudo systemctl status knockd
```

### Using Port Knocking (Client Side)

```bash
# Install knock client
sudo apt install knockd

# Knock to open SSH port
knock -v server.example.com 7000 8000 9000

# Wait a moment, then SSH
ssh user@server.example.com

# After session, knock to close (optional)
knock -v server.example.com 9000 8000 7000
```

**Automated knocking with SSH:**

```bash
# Create knock wrapper script
# ~/.local/bin/ssh-knock.sh
#!/bin/bash
HOST=$1
shift  # Remove first argument

# Knock to open
knock -v $HOST 7000 8000 9000
sleep 1

# SSH to server
ssh "$@" $HOST

# Knock to close on exit
knock -v $HOST 9000 8000 7000
```

```bash
chmod +x ~/.local/bin/ssh-knock.sh

# Usage
ssh-knock.sh server.example.com
```

**SSH config integration:**

```bash
# ~/.ssh/config
Host secure-server
    HostName server.example.com
    User admin
    ProxyCommand bash -c 'knock -v %h 7000 8000 9000 && sleep 1 && nc %h %p'
```

---

## Bastion / Jump Hosts

### Bastion Host Architecture

```
┌──────────────┐
│   Internet   │
└──────┬───────┘
       │
       ↓
┌─────────────────┐
│  Bastion Host   │  ← Only SSH accessible from internet
│  (Hardened)     │     Jump host for internal servers
└──────┬──────────┘
       │
       ↓
┌──────────────────────────────────┐
│     Internal Network             │
│  ┌─────────┐  ┌─────────┐       │
│  │ Server1 │  │ Server2 │  ...  │
│  └─────────┘  └─────────┘       │
└──────────────────────────────────┘
  (Not directly accessible)
```

### Configure Bastion Host

**Bastion sshd_config:**

```bash
# Extra hardening for bastion
# /etc/ssh/sshd_config

# Only allow specific jump users
AllowUsers jumpuser1 jumpuser2

# Force key authentication
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable forwarding features (users jump, don't tunnel)
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
PermitTunnel no

# Restrict commands
ForceCommand /usr/local/bin/jump-only.sh

# Short timeout
ClientAliveInterval 300
ClientAliveCountMax 1

# Aggressive logging
LogLevel VERBOSE
```

**Jump-only script:**

```bash
# /usr/local/bin/jump-only.sh
#!/bin/bash

# Only allow SSH to internal network
case "$SSH_ORIGINAL_COMMAND" in
  ""|*[!a-zA-Z0-9\ \.\-\_]*)
    echo "Only SSH connections to internal network allowed"
    exit 1
    ;;
  ssh\ *)
    # Allow SSH commands
    exec $SSH_ORIGINAL_COMMAND
    ;;
  *)
    echo "Command not allowed: $SSH_ORIGINAL_COMMAND"
    exit 1
    ;;
esac
```

### ProxyJump Configuration

**Client ~/.ssh/config:**

```bash
# Bastion/Jump host
Host bastion
    HostName bastion.example.com
    User jumpuser
    IdentityFile ~/.ssh/id_ed25519_bastion
    Port 22

# Internal servers (accessed via bastion)
Host internal-*.example.com
    User admin
    IdentityFile ~/.ssh/id_ed25519_internal
    ProxyJump bastion
    StrictHostKeyChecking accept-new

# Specific servers
Host db-server
    HostName db-internal.example.com
    User dbadmin
    ProxyJump bastion

Host web-server
    HostName web-internal.example.com
    User webadmin
    ProxyJump bastion
```

**Usage:**

```bash
# SSH automatically jumps through bastion
ssh db-server
ssh web-server

# Or explicit proxy jump
ssh -J jumpuser@bastion.example.com admin@internal-server.example.com

# Multiple jumps
ssh -J bastion1,bastion2 admin@internal-server
```

**Copy files through bastion:**

```bash
# SCP through jump host
scp -o "ProxyJump bastion" file.txt user@internal-server:/tmp/

# Using rsync
rsync -avz -e "ssh -J bastion" /local/path/ user@internal-server:/remote/path/
```

---

## SSH Certificates

SSH certificates scale authentication better than authorized_keys files.

### Certificate Authority Setup

```bash
# Create CA key pair
ssh-keygen -t ed25519 -f ~/.ssh/ca_user_key -C "User CA"

# Create CA for hosts
ssh-keygen -t ed25519 -f ~/.ssh/ca_host_key -C "Host CA"
```

### Issue User Certificate

```bash
# Sign user's public key with CA
ssh-keygen -s ~/.ssh/ca_user_key \
  -I "user@example.com" \
  -n admin,deploy \
  -V +52w \
  ~/.ssh/id_ed25519.pub

# This creates id_ed25519-cert.pub
```

**Certificate options:**
- `-I`: Certificate identifier (for logging)
- `-n`: Principals (usernames) this cert is valid for
- `-V`: Validity period (+52w = 52 weeks)
- `-O`: Options (force-command, source-address, etc.)

**Advanced certificate:**

```bash
# Certificate with restrictions
ssh-keygen -s ~/.ssh/ca_user_key \
  -I "deploy-bot@ci-system" \
  -n deploy \
  -V +1w \
  -O source-address=10.0.0.0/8 \
  -O force-command="/usr/local/bin/deploy.sh" \
  ~/.ssh/deploy_key.pub
```

### Configure Server to Trust CA

```bash
# /etc/ssh/sshd_config

# Trust CA for user certificates
TrustedUserCAKeys /etc/ssh/ca_user_key.pub

# Optionally use principals
AuthorizedPrincipalsFile /etc/ssh/auth_principals/%u
```

**Setup principals file:**

```bash
# /etc/ssh/auth_principals/admin
admin
root
wheel

# /etc/ssh/auth_principals/deploy
deploy
www-data
```

**Restart SSH:**

```bash
sudo systemctl restart sshd
```

### Use Certificate

```bash
# Client automatically uses certificate if present
ssh -i ~/.ssh/id_ed25519 admin@server

# View certificate details
ssh-keygen -L -f ~/.ssh/id_ed25519-cert.pub
```

---

## SSH Auditing and Logging

### Comprehensive SSH Logging

```bash
# /etc/ssh/sshd_config
LogLevel VERBOSE

# Log to specific file
# /etc/rsyslog.d/ssh.conf
auth,authpriv.*                 /var/log/ssh.log

# Restart rsyslog
sudo systemctl restart rsyslog
```

### Monitor SSH Access

```bash
# View SSH login attempts
sudo journalctl -u sshd -n 100 --no-pager

# View successful logins
sudo grep "Accepted" /var/log/auth.log

# View failed logins
sudo grep "Failed" /var/log/auth.log

# View active SSH sessions
who
w

# Kill specific SSH session
sudo pkill -u username

# View connection details
sudo ss -tnp | grep sshd
```

### SSH Session Recording (Advanced)

**Using script command:**

```bash
# Force session recording for specific users
# /etc/ssh/sshd_config
Match User admin
    ForceCommand /usr/local/bin/record-session.sh
```

**record-session.sh:**

```bash
#!/bin/bash
SESSION_LOG="/var/log/ssh-sessions/$(date +%Y%m%d-%H%M%S)-$USER-$$.log"
mkdir -p /var/log/ssh-sessions
script -q -f $SESSION_LOG
```

**Using tlog for professional session recording:**

```bash
# Install tlog
sudo apt install tlog

# Configure in /etc/tlog/tlog-rec-session.conf
# Sessions recorded to journal or files
```

---

## Access Restrictions

### Time-Based Access

```bash
# Install pam_time
sudo apt install libpam-modules

# Configure PAM
sudo vi /etc/security/time.conf

# Format: services;ttys;users;times
# Allow admin SSH only during business hours
sshd;*;admin;Mo-Fr0800-1800

# Allow deploy 24/7
sshd;*;deploy;Al0000-2400

# Emergency access only
sshd;*;emergency;Wk0000-2400
```

**Enable in PAM:**

```bash
# /etc/pam.d/sshd
account required pam_time.so
```

### IP-Based Restrictions

```bash
# /etc/ssh/sshd_config

# Allow admin only from specific IPs
Match User admin Address 10.0.0.0/8,192.168.1.0/24
    PasswordAuthentication no

# Deny from blacklisted IPs
Match Address 203.0.113.0/24,198.51.100.0/24
    DenyUsers *
```

**Using hosts.allow/hosts.deny:**

```bash
# /etc/hosts.allow
sshd: 10.0.0.0/8 192.168.1.0/24

# /etc/hosts.deny
sshd: ALL
```

### Firewall-Based Restrictions

```bash
# iptables - Allow SSH only from specific IPs
sudo iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j DROP

# Save rules
sudo iptables-save | sudo tee /etc/iptables/rules.v4

# nftables equivalent
sudo nft add rule inet filter input tcp dport 22 ip saddr { 10.0.0.0/8, 192.168.1.0/24 } accept
sudo nft add rule inet filter input tcp dport 22 drop
```

---

## SSH Key Rotation

### Automated Key Rotation Strategy

**Rotation workflow:**
1. Generate new key pair
2. Distribute new public key to all servers
3. Verify new key works
4. Remove old key
5. Update key inventory

**Ansible playbook for key rotation:**

```yaml
---
# playbooks/rotate-ssh-keys.yml
- name: Rotate SSH keys across fleet
  hosts: all
  become: yes
  vars:
    new_public_key: "{{ lookup('file', '~/.ssh/id_ed25519_new.pub') }}"
    old_key_fingerprint: "SHA256:abc123..."
  
  tasks:
    - name: Add new SSH key
      authorized_key:
        user: admin
        key: "{{ new_public_key }}"
        state: present
    
    - name: Verify new key works
      wait_for:
        timeout: 10
      delegate_to: localhost
      changed_when: false
    
    - name: Test connection with new key
      shell: ssh -i ~/.ssh/id_ed25519_new admin@{{ inventory_hostname }} echo "success"
      delegate_to: localhost
      register: test_result
      failed_when: test_result.stdout != "success"
    
    - name: Remove old SSH key
      authorized_key:
        user: admin
        key: "{{ old_public_key }}"
        state: absent
      when: test_result is succeeded
    
    - name: Log key rotation
      lineinfile:
        path: /var/log/ssh-key-rotation.log
        line: "{{ ansible_date_time.iso8601 }} - SSH key rotated for admin"
        create: yes
```

**Run rotation:**

```bash
# Generate new key
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_new

# Run rotation playbook
ansible-playbook playbooks/rotate-ssh-keys.yml

# After verification, replace old key
mv ~/.ssh/id_ed25519 ~/.ssh/id_ed25519_old
mv ~/.ssh/id_ed25519_new ~/.ssh/id_ed25519
```

---

## Troubleshooting

### SSH Connection Issues

```bash
# Verbose SSH output (debug levels 1-3)
ssh -v user@server     # Level 1
ssh -vv user@server    # Level 2
ssh -vvv user@server   # Level 3 (most verbose)

# Test SSH server config
sudo sshd -t

# Test SSH connection without executing login shell
ssh -T user@server

# Check SSH port is listening
sudo ss -tlnp | grep sshd
sudo netstat -tlnp | grep sshd

# Test connectivity to SSH port
nc -zv server.example.com 22
telnet server.example.com 22

# Check firewall rules
sudo iptables -L -n -v | grep 22
sudo nft list ruleset | grep 22
```

### Permission Issues

```bash
# Common permission problems and fixes

# Fix .ssh directory permissions
chmod 700 ~/.ssh

# Fix private key permissions
chmod 600 ~/.ssh/id_*

# Fix public key permissions
chmod 644 ~/.ssh/id_*.pub

# Fix authorized_keys permissions
chmod 600 ~/.ssh/authorized_keys

# Fix ownership
chown -R $USER:$USER ~/.ssh

# Check for SELinux issues (RHEL/CentOS)
sudo restorecon -R -v ~/.ssh
```

### "Permission denied (publickey)" Error

```bash
# Check authorized_keys on server
cat ~/.ssh/authorized_keys

# Verify key fingerprint matches
ssh-keygen -lf ~/.ssh/id_ed25519
ssh-keygen -lf ~/.ssh/authorized_keys

# Check SSH logs on server
sudo tail -f /var/log/auth.log  # Debian/Ubuntu
sudo tail -f /var/log/secure    # RHEL/CentOS

# Ensure key is loaded in agent
ssh-add -l

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Bypass SSH config
ssh -F /dev/null -i ~/.ssh/id_ed25519 user@server
```

### "Too many authentication failures"

```bash
# Caused by SSH agent offering too many keys
# Solution 1: Specify exact key
ssh -i ~/.ssh/id_ed25519 user@server

# Solution 2: Disable agent forwarding
ssh -o IdentitiesOnly=yes user@server

# Solution 3: Limit agent keys
ssh-add -D  # Remove all keys
ssh-add ~/.ssh/id_ed25519  # Add only needed key
```

### Locked Out Scenarios

```bash
# Prevention: Always keep a backup access method!

# Recovery method 1: Console access (VPS/cloud)
# Login via web console and fix SSH config

# Recovery method 2: Rescue mode
# Boot into rescue/recovery mode and mount filesystem

# Recovery method 3: Backup user
# Create emergency user before hardening
sudo useradd -m -s /bin/bash emergency
sudo usermod -aG sudo emergency
sudo passwd emergency  # Set strong password

# Recovery method 4: Serial console (physical server)
# Access via IPMI/iLO/iDRAC
```

---

## Production Patterns

### Multi-Tier SSH Architecture

```
┌─────────────────────────────────────────────────┐
│  Internet                                        │
└──────────────┬──────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────┐
│  Public Bastion (DMZ)                           │
│  - MFA required                                  │
│  - IP whitelist                                  │
│  - Session recording                            │
│  - Certificate authentication                    │
└──────────────┬──────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────┐
│  Internal Bastion (Management Network)          │
│  - Key-based auth                                │
│  - Jump-only restrictions                        │
└──────────────┬──────────────────────────────────┘
               │
               ├───────────┬─────────────┬─────────┤
               ↓           ↓             ↓         ↓
         ┌─────────┐ ┌─────────┐  ┌─────────┐ ┌───────┐
         │ Web     │ │ App     │  │Database │ │ ...   │
         │ Servers │ │ Servers │  │ Servers │ │       │
         └─────────┘ └─────────┘  └─────────┘ └───────┘
```

### SSH Config for Large Fleets

```bash
# ~/.ssh/config - Enterprise configuration

# Global defaults
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ConnectTimeout 10
    StrictHostKeyChecking accept-new
    ForwardAgent no
    HashKnownHosts yes
    VerifyHostKeyDNS yes

# Bastion hosts (multiple for redundancy)
Host bastion1 bastion2 bastion3
    HostName bastion%h.example.com
    User jumpuser
    IdentityFile ~/.ssh/id_ed25519_bastion
    Port 2222

# Production environment (via bastion1)
Host prod-*
    User prodadmin
    IdentityFile ~/.ssh/id_ed25519_prod
    ProxyJump bastion1
    StrictHostKeyChecking yes

# Staging environment (via bastion2)
Host staging-*
    User stagingadmin
    IdentityFile ~/.ssh/id_ed25519_staging
    ProxyJump bastion2

# Development environment (direct access)
Host dev-*
    User devadmin
    IdentityFile ~/.ssh/id_ed25519_dev

# Database servers (special restrictions)
Host *-db-*
    User dbadmin
    IdentityFile ~/.ssh/id_ed25519_db
    RequestTTY no
    RemoteCommand /usr/local/bin/db-console

# Wildcard for all company servers
Host *.example.com
    IdentityFile ~/.ssh/id_ed25519_company
    CertificateFile ~/.ssh/id_ed25519_company-cert.pub
```

### Automation Account SSH

```bash
# CI/CD system SSH configuration
# Dedicated key with restrictions

# Server side: /etc/ssh/sshd_config
Match User deploy Address 10.0.0.0/8
    PasswordAuthentication no
    PubkeyAuthentication yes
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no
    PermitTunnel no
    ForceCommand /usr/local/bin/deploy-wrapper.sh
    AuthenticationMethods publickey

# deploy-wrapper.sh validates commands
#!/bin/bash
case "$SSH_ORIGINAL_COMMAND" in
  "deploy prod")
    exec /usr/local/bin/deploy-to-prod.sh
    ;;
  "deploy staging")
    exec /usr/local/bin/deploy-to-staging.sh
    ;;
  "rollback")
    exec /usr/local/bin/rollback.sh
    ;;
  *)
    echo "Unauthorized command: $SSH_ORIGINAL_COMMAND"
    exit 1
    ;;
esac
```

---

## Security Checklist

### SSH Hardening Checklist

```
Authentication:
☑ Password authentication disabled
☑ Root login disabled
☑ Key-only authentication enabled
☑ Keys have passphrases
☑ MFA/2FA configured (if applicable)
☑ SSH keys are ED25519 or RSA 4096-bit

Configuration:
☑ Non-standard port (optional but recommended)
☑ Weak ciphers disabled
☑ Protocol 2 only
☑ MaxAuthTries set to 3
☑ LoginGraceTime set to 30 seconds
☑ ClientAliveInterval configured
☑ Disable unnecessary features (X11, TCP forwarding if not needed)

Access Control:
☑ AllowUsers/AllowGroups configured
☑ IP-based restrictions in place
☑ Firewall rules restrict SSH access
☑ Fail2ban or similar intrusion prevention active

Logging & Monitoring:
☑ LogLevel set to VERBOSE
☑ SSH logs being collected
☑ Failed login alerts configured
☑ Session recording for privileged accounts

Architecture:
☑ Bastion hosts for production access
☑ Network segmentation in place
☑ Jump host restrictions configured
☑ No direct SSH from internet to internal servers

Maintenance:
☑ SSH server kept up-to-date
☑ Regular security audits
☑ Key rotation policy in place
☑ Emergency access method documented
☑ Backup admin account exists
```

---

## What's Next?

After mastering SSH security, continue hardening your infrastructure:

**Network Security:**
- [Firewall Basics](firewall-basics) - iptables/nftables configuration
- [Fail2ban Setup](fail2ban-setup) - Automated intrusion prevention
- [WireGuard VPN](wireguard-vpn) - Secure remote access

**System Hardening:**
- [User Account Security](user-account-security) - Least privilege and sudo
- System hardening and compliance
- Security monitoring and alerting

**Advanced SSH:**
- SSH tunneling and port forwarding
- SSH escape sequences
- SSHFS for remote filesystem mounting

**Infrastructure Security:**
- [Secrets in IaC](../infrastructure/secrets-in-iac) - Managing SSH keys at scale
- Certificate authorities for SSH at scale
- Zero Trust SSH access

---

## Additional Resources

### Official Documentation
- [OpenSSH Manual](https://www.openssh.com/manual.html)
- [SSH.com Best Practices](https://www.ssh.com/academy/ssh/best-practices)
- [NIST SSH Guidelines](https://nvlpubs.nist.gov/nistpubs/ir/2015/NIST.IR.7966.pdf)

### Security Guides
- [Mozilla SSH Guidelines](https://infosec.mozilla.org/guidelines/openssh)
- [CIS SSH Benchmark](https://www.cisecurity.org/benchmark/distribution_independent_linux)
- [Hardening SSH (ArchWiki)](https://wiki.archlinux.org/title/OpenSSH#Security)

### Tools
- [ssh-audit](https://github.com/jtesta/ssh-audit) - SSH server auditing
- [Mosh](https://mosh.org/) - Mobile shell (alternative to SSH for unreliable connections)
- [Teleport](https://goteleport.com/) - Modern SSH alternative with certificates
- [Boundary](https://www.boundaryproject.io/) - HashiCorp's identity-based access

### Learning Resources
- [SSH Academy](https://www.ssh.com/academy/ssh)
- [Secure Shell (SSH) - SANS](https://www.sans.org/blog/using-ssh-through-a-bastion-host-transparently/)
- [SSH Mastery](https://www.tiltedwindmillpress.com/product/ssh-mastery-2nd-edition/) - Book by Michael W. Lucas

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive SSH security hardening guide covering key-only authentication, sshd_config hardening, multi-factor authentication (TOTP/YubiKey), port knocking, bastion/jump hosts, SSH certificates, extensive logging and auditing, access restrictions (time/IP-based), automated key rotation, troubleshooting scenarios, production patterns for multi-tier architectures, automation account configuration, and complete security checklists. Includes real-world examples from enterprise environments, cloud platforms, and security-conscious organizations.
