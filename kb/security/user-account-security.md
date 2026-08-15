# User Account Security - Least Privilege and Access Control

**Resource Navigation:** [README](README) | [Password Management](password-management) | [SSH Security Hardening](ssh-security-hardening) | [Two-Factor Authentication](two-factor-authentication)

---

## Summary

User account security is the foundation of system security - every breach starts with compromised credentials or excessive privileges. This comprehensive guide covers creating secure user accounts with minimum necessary permissions, implementing sudo access control with fine-grained rules, configuring PAM (Pluggable Authentication Modules) for password policies and account restrictions, setting up centralized authentication with LDAP/FreeIPA, implementing role-based access control (RBAC), auditing user activity, automated account provisioning and deprovisioning, session management, and compliance with security frameworks. Learn production patterns for multi-user systems, jump hosts, development environments, and enterprise infrastructure with complete audit trails and least-privilege enforcement.

**The Golden Rule:** Grant minimum permissions necessary for each user's role; review access regularly.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Create user accounts with appropriate permissions
- ✅ Implement least privilege access control
- ✅ Configure sudo for fine-grained privilege escalation
- ✅ Set up PAM for password policies and restrictions
- ✅ Implement account expiration and password aging
- ✅ Configure centralized authentication (LDAP/FreeIPA)
- ✅ Audit user activity and system access
- ✅ Manage SSH key-based authentication securely
- ✅ Implement role-based access control (RBAC)
- ✅ Automate user provisioning and deprovisioning

---

## Prerequisites

Before implementing user account security, you should have:

- **Linux fundamentals**: [Linux Fundamentals](../basics/linux-fundamentals) completed
- **SSH knowledge**: [SSH Basics](../basics/ssh-basics) and [SSH Security](ssh-security-hardening)
- **Password management**: [Password Management](password-management) understanding
- **Basic security awareness**: Understanding of authentication and authorization
- **Root access**: Ability to create users and modify system configuration

---

## User Account Fundamentals

### User Types

**Root (UID 0)**:
- Superuser with unlimited permissions
- Should NEVER be used for daily tasks
- Direct login should be disabled
- Use sudo for administrative tasks

**System Users (UID 1-999)**:
- Service accounts (nginx, postgres, redis)
- No login shell (/usr/sbin/nologin)
- Minimal permissions
- Managed by package managers

**Regular Users (UID 1000+)**:
- Human users with login access
- Limited system permissions
- Sudo for administrative tasks
- Home directory isolation

**Service Accounts (application-specific)**:
- Dedicated accounts for applications
- No interactive login
- API keys and automation only
- Principle of least privilege

### User Information Files

```bash
# /etc/passwd - User account information
# Format: username:x:UID:GID:comment:homedir:shell
root:x:0:0:root:/root:/bin/bash
alice:x:1000:1000:Alice Admin:/home/alice:/bin/bash
bob:x:1001:1001:Bob Developer:/home/bob:/bin/bash
nginx:x:33:33:www-data:/var/www:/usr/sbin/nologin

# /etc/shadow - Encrypted passwords and aging
# Format: username:password:lastchange:min:max:warn:inactive:expire
alice:$6$rounds=5000$...:19000:0:90:7:30:

# /etc/group - Group memberships
# Format: groupname:x:GID:members
sudo:x:27:alice,bob
docker:x:999:alice

# /etc/gshadow - Group passwords (rarely used)
sudo:*::alice,bob
```

---

## Creating Secure User Accounts

### Basic User Creation

```bash
# Create user
sudo useradd -m -s /bin/bash alice

# Set password
sudo passwd alice

# Create user with all options
sudo useradd \
    --create-home \
    --shell /bin/bash \
    --comment "Alice Admin - DevOps Team" \
    --expiredate 2026-12-31 \
    --groups sudo,docker \
    alice

# Set secure password
sudo passwd alice
```

### User Creation Best Practices

```bash
#!/bin/bash
# create-user.sh - Secure user creation script

USERNAME="$1"
FULLNAME="$2"
EXPIRE_DATE="$3"  # Optional: YYYY-MM-DD

if [ -z "$USERNAME" ] || [ -z "$FULLNAME" ]; then
    echo "Usage: $0 <username> <fullname> [expire-date]"
    exit 1
fi

# Create user with secure defaults
sudo useradd \
    --create-home \
    --shell /bin/bash \
    --comment "$FULLNAME" \
    --groups users \
    ${EXPIRE_DATE:+--expiredate $EXPIRE_DATE} \
    "$USERNAME"

# Set password (force change on first login)
sudo passwd --expire "$USERNAME"

# Set strict home directory permissions
sudo chmod 750 "/home/$USERNAME"

# Create .ssh directory with proper permissions
sudo mkdir -p "/home/$USERNAME/.ssh"
sudo chmod 700 "/home/$USERNAME/.ssh"
sudo touch "/home/$USERNAME/.ssh/authorized_keys"
sudo chmod 600 "/home/$USERNAME/.ssh/authorized_keys"
sudo chown -R "$USERNAME:$USERNAME" "/home/$USERNAME/.ssh"

# Send welcome email (optional)
# echo "Welcome!" | mail -s "Account Created" "$USERNAME@example.com"

echo "User $USERNAME created successfully"
echo "Password must be changed on first login"
echo "SSH key can be added to: /home/$USERNAME/.ssh/authorized_keys"
```

### Service Account Creation

```bash
# Create service account (no login)
sudo useradd \
    --system \
    --no-create-home \
    --shell /usr/sbin/nologin \
    --comment "MyApp Service Account" \
    myapp

# Create with home directory (for application data)
sudo useradd \
    --system \
    --create-home \
    --home-dir /var/lib/myapp \
    --shell /usr/sbin/nologin \
    --comment "MyApp Service" \
    myapp

# Set ownership for application directories
sudo mkdir -p /var/log/myapp /var/lib/myapp
sudo chown -R myapp:myapp /var/log/myapp /var/lib/myapp
sudo chmod 750 /var/log/myapp /var/lib/myapp
```

---

## Sudo Configuration

### Understanding Sudo

```
┌──────────────────────────────────────────┐
│            User: alice                    │
│         (Regular User)                    │
└──────────────┬───────────────────────────┘
               │
               │ sudo systemctl restart nginx
               ↓
    ┌────────────────────────┐
    │    Check /etc/sudoers   │
    │    Is alice allowed?    │
    └────────────┬───────────┘
                 │
           Yes   │
                 ↓
    ┌────────────────────────┐
    │   Prompt for password   │
    │   (alice's password)    │
    └────────────┬───────────┘
                 │
           Valid │
                 ↓
    ┌────────────────────────┐
    │   Execute as root:      │
    │   systemctl restart     │
    │   nginx                 │
    └────────────────────────┘
```

### Basic Sudo Access

```bash
# Add user to sudo group (Debian/Ubuntu)
sudo usermod -aG sudo alice

# Add user to wheel group (RHEL/CentOS)
sudo usermod -aG wheel alice

# Verify groups
groups alice

# Test sudo access
su - alice
sudo whoami  # Should output: root
```

### Sudoers File Configuration

```bash
# NEVER edit /etc/sudoers directly!
# Always use visudo (validates syntax)
sudo visudo

# Default sudoers configuration
# /etc/sudoers

# Allow sudo group members to run any command
%sudo   ALL=(ALL:ALL) ALL

# Allow wheel group (RHEL)
%wheel  ALL=(ALL:ALL) ALL

# Syntax: WHO WHERE=(AS_WHO) WHAT
# WHO: User or %group
# WHERE: Hosts (ALL = all hosts)
# AS_WHO: Run as user:group (ALL:ALL = any user/group)
# WHAT: Commands (ALL = any command)
```

### Fine-Grained Sudo Rules

```bash
# /etc/sudoers.d/custom-rules
# (Create separate files in sudoers.d/)

# Allow alice to restart nginx without password
alice ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx

# Allow webadmin group to manage web services
%webadmin ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, \
                               /usr/bin/systemctl reload nginx, \
                               /usr/bin/systemctl status nginx, \
                               /usr/bin/systemctl restart apache2

# Allow dbadmin to manage databases
%dbadmin ALL=(postgres) NOPASSWD: /usr/bin/psql, \
                                   /usr/bin/pg_dump

# Allow developers to read logs (no password)
%developers ALL=(ALL) NOPASSWD: /usr/bin/tail -f /var/log/myapp/*.log, \
                                /usr/bin/less /var/log/myapp/*.log, \
                                /usr/bin/grep * /var/log/myapp/*.log

# Restrict to specific hosts
alice webserver1,webserver2=(ALL) ALL

# Allow user to run commands as specific user
deployer ALL=(www-data) NOPASSWD: /usr/local/bin/deploy.sh

# Require password for dangerous commands
%operators ALL=(ALL) /usr/bin/systemctl restart *, \
                     /usr/bin/reboot

# Disable specific commands
alice ALL=(ALL) ALL, !/usr/bin/passwd root, !/usr/bin/su root
```

### Sudo Aliases for Complex Rules

```bash
# /etc/sudoers.d/aliases

# Command aliases
Cmnd_Alias WEB_RESTART = /usr/bin/systemctl restart nginx, \
                         /usr/bin/systemctl reload nginx
Cmnd_Alias DB_ADMIN = /usr/bin/psql, /usr/bin/pg_dump, \
                      /usr/bin/pg_restore
Cmnd_Alias LOG_READ = /usr/bin/tail, /usr/bin/less, \
                      /usr/bin/grep, /usr/bin/cat

# User aliases
User_Alias WEBADMINS = alice, bob, charlie
User_Alias DBADMINS = dave, eve

# Host aliases
Host_Alias WEBSERVERS = web01, web02, web03
Host_Alias DBSERVERS = db01, db02

# Use aliases in rules
WEBADMINS WEBSERVERS=(ALL) NOPASSWD: WEB_RESTART
DBADMINS DBSERVERS=(postgres) NOPASSWD: DB_ADMIN
```

### Sudo Security Options

```bash
# /etc/sudoers

# Require password (default)
Defaults    authenticate

# Password timeout (minutes)
Defaults    timestamp_timeout=5

# Require password every time (no timeout)
Defaults    timestamp_timeout=0

# Log all sudo commands
Defaults    log_input, log_output
Defaults    logfile="/var/log/sudo.log"

# Send email on sudo use
Defaults    mail_always
Defaults    mailto="security@example.com"

# Restrict environment variables (security)
Defaults    env_reset
Defaults    env_keep="COLORS DISPLAY HOSTNAME HISTSIZE KDEDIR LS_COLORS"
Defaults    env_keep+="MAIL PS1 PS2 QTDIR USERNAME LANG LC_ADDRESS LC_CTYPE"

# Require sudo to preserve environment
Defaults    !setenv

# Lecture users on first sudo use
Defaults    lecture="always"

# Use custom insults on wrong password (fun but professional?)
Defaults    insults

# Require root password instead of user password
Defaults    rootpw

# SELinux support
Defaults    use_pty
Defaults    setype=unconfined_t
```

---

## PAM (Pluggable Authentication Modules)

### PAM Configuration Files

```bash
# PAM configuration directory
/etc/pam.d/

# Common PAM files:
/etc/pam.d/common-auth       # Authentication
/etc/pam.d/common-account    # Account validation
/etc/pam.d/common-password   # Password changing
/etc/pam.d/common-session    # Session setup
/etc/pam.d/sshd              # SSH authentication
/etc/pam.d/sudo              # Sudo authentication
/etc/pam.d/login             # Console login

# PAM module syntax:
# type  control  module  arguments
```

### Password Quality Requirements

```bash
# Install password quality module
sudo apt install libpam-pwquality  # Debian/Ubuntu
sudo yum install pam_pwquality     # RHEL/CentOS

# Configure password requirements
sudo nano /etc/security/pwquality.conf

# /etc/security/pwquality.conf
# Minimum password length
minlen = 14

# Require at least one digit
dcredit = -1

# Require at least one uppercase
ucredit = -1

# Require at least one lowercase
lcredit = -1

# Require at least one special character
ocredit = -1

# Maximum consecutive repeated characters
maxrepeat = 3

# Maximum consecutive characters from same class
maxclassrepeat = 4

# Minimum different characters from old password
difok = 5

# Check against dictionary
dictcheck = 1

# Reject usernames in passwords
usercheck = 1

# Reject passwords containing username
gecoscheck = 1

# Enable in PAM
# /etc/pam.d/common-password
password  requisite  pam_pwquality.so retry=3
```

### Password Aging

```bash
# Set password aging for new users
sudo nano /etc/login.defs

# /etc/login.defs
PASS_MAX_DAYS   90      # Password expires after 90 days
PASS_MIN_DAYS   7       # Can't change password for 7 days
PASS_WARN_AGE   14      # Warn 14 days before expiration

# Set for existing user
sudo chage alice
# Or with flags:
sudo chage -M 90 -m 7 -W 14 alice

# View password status
sudo chage -l alice

# Force password change on next login
sudo chage -d 0 alice

# Set account expiration
sudo chage -E 2026-12-31 alice

# Lock account after 30 days of inactivity
sudo chage -I 30 alice
```

### Account Lockout (Failed Login Attempts)

```bash
# Configure account lockout
sudo nano /etc/pam.d/common-auth

# /etc/pam.d/common-auth
# Lock account after 5 failed attempts for 10 minutes
auth required pam_tally2.so deny=5 unlock_time=600 onerr=fail audit

# Or use faillock (newer)
auth required pam_faillock.so preauth silent audit deny=5 unlock_time=600
auth [default=die] pam_faillock.so authfail audit deny=5 unlock_time=600
auth sufficient pam_unix.so nullok try_first_pass
auth requisite pam_deny.so

# Account validation
account required pam_faillock.so

# View failed attempts
sudo faillock --user alice

# Unlock user manually
sudo faillock --user alice --reset

# View all locked accounts
sudo faillock
```

### Time-Based Access Restrictions

```bash
# Restrict login times
sudo nano /etc/security/time.conf

# /etc/security/time.conf
# Format: services;ttys;users;times

# Allow alice login only during business hours
login;*;alice;Mo-Fr0800-1800

# Allow after-hours access for oncall group
login;*;%oncall;Al0000-2400

# Restrict SSH to specific hours
sshd;*;*;!Al1800-0800

# Enable in PAM
# /etc/pam.d/common-account
account  required  pam_time.so
```

### Access Control Lists

```bash
# Configure user access restrictions
sudo nano /etc/security/access.conf

# /etc/security/access.conf
# Format: permission:users:origins

# Deny all except specific users from SSH
- : ALL EXCEPT alice bob : ALL

# Allow only from specific networks
+ : alice : 10.0.0.0/8 192.168.0.0/16
- : alice : ALL

# Allow root only from console
+ : root : LOCAL
- : root : ALL

# Deny specific user
- : baduser : ALL

# Enable in PAM
# /etc/pam.d/sshd
account  required  pam_access.so
```

### Two-Factor Authentication (PAM)

```bash
# Install Google Authenticator PAM module
sudo apt install libpam-google-authenticator

# Configure for user
google-authenticator
# - Scan QR code with authenticator app
# - Save emergency codes
# - Answer configuration questions

# Enable in PAM
sudo nano /etc/pam.d/sshd

# /etc/pam.d/sshd (add at top)
auth required pam_google_authenticator.so

# Configure SSH to use PAM
sudo nano /etc/ssh/sshd_config

# /etc/ssh/sshd_config
ChallengeResponseAuthentication yes
UsePAM yes
AuthenticationMethods publickey,keyboard-interactive

# Restart SSH
sudo systemctl restart sshd

# See [SSH Security Hardening](ssh-security-hardening) for details
```

---

## Centralized Authentication

### LDAP Integration (Basic)

```bash
# Install LDAP client
sudo apt install libnss-ldap libpam-ldap ldap-utils

# Configure LDAP server connection
sudo nano /etc/ldap.conf

# /etc/ldap.conf
uri ldap://ldap.example.com
base dc=example,dc=com
ldap_version 3
binddn cn=readonly,dc=example,dc=com
bindpw readonly_password

# Configure NSS to use LDAP
sudo nano /etc/nsswitch.conf

# /etc/nsswitch.conf
passwd:         files ldap
group:          files ldap
shadow:         files ldap

# Configure PAM for LDAP
sudo pam-auth-update
# Enable "LDAP Authentication"

# Test LDAP connectivity
ldapsearch -x -H ldap://ldap.example.com -b "dc=example,dc=com"

# Create home directories automatically
sudo nano /etc/pam.d/common-session

# Add:
session required pam_mkhomedir.so skel=/etc/skel umask=0077
```

### FreeIPA Integration

```bash
# Install FreeIPA client
sudo apt install freeipa-client

# Join FreeIPA domain
sudo ipa-client-install \
    --domain=example.com \
    --server=ipa.example.com \
    --realm=EXAMPLE.COM \
    --principal=admin \
    --password='IPA_ADMIN_PASSWORD' \
    --mkhomedir \
    --unattended

# Test FreeIPA authentication
kinit admin
klist

# List IPA users
ipa user-find

# Add sudo rules from FreeIPA
sudo ipa sudorule-show webadmins

# Automatic home directory creation enabled
# Sudo rules managed centrally in FreeIPA
```

### Active Directory Integration

```bash
# Install required packages
sudo apt install realmd sssd sssd-tools adcli krb5-user

# Discover AD domain
sudo realm discover example.com

# Join AD domain
sudo realm join --user=Administrator example.com

# Configure home directories
sudo nano /etc/sssd/sssd.conf

# /etc/sssd/sssd.conf
[sssd]
domains = example.com
config_file_version = 2
services = nss, pam

[domain/example.com]
default_shell = /bin/bash
krb5_store_password_if_offline = True
cache_credentials = True
krb5_realm = EXAMPLE.COM
realmd_tags = manages-system joined-with-adcli
id_provider = ad
fallback_homedir = /home/%u@%d
ad_domain = example.com
use_fully_qualified_names = False
ldap_id_mapping = True
access_provider = ad

# Restart SSSD
sudo systemctl restart sssd

# Test AD authentication
id 'alice@example.com'
su - alice

# Configure sudo for AD groups
sudo visudo

%Domain\ Admins ALL=(ALL) ALL
```

---

## Auditing and Monitoring

### Audit User Activity (auditd)

```bash
# Install audit daemon
sudo apt install auditd audispd-plugins

# Configure audit rules
sudo nano /etc/audit/rules.d/user-activity.rules

# /etc/audit/rules.d/user-activity.rules

# Audit all commands executed by users
-a always,exit -F arch=b64 -S execve -k user_commands
-a always,exit -F arch=b32 -S execve -k user_commands

# Audit sudo usage
-a always,exit -F path=/usr/bin/sudo -F perm=x -k sudo_usage

# Audit user additions/removals
-w /usr/sbin/useradd -p x -k user_modification
-w /usr/sbin/userdel -p x -k user_modification
-w /usr/sbin/usermod -p x -k user_modification
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/group -p wa -k group_changes
-w /etc/gshadow -p wa -k gshadow_changes

# Audit SSH logins
-w /var/log/auth.log -p wa -k auth_log_changes

# Audit file access by specific user
-a always,exit -F arch=b64 -S open -S openat -F auid=1000 -k alice_file_access

# Make rules immutable (can't be changed without reboot)
-e 2

# Reload rules
sudo augenrules --load

# Restart auditd
sudo systemctl restart auditd

# Search audit logs
sudo ausearch -k user_commands --start recent
sudo ausearch -k sudo_usage -i

# Generate audit report
sudo aureport --summary
sudo aureport --auth --summary
sudo aureport --executable --summary
```

### Session Recording (tlog)

```bash
# Install tlog for session recording
sudo apt install tlog

# Configure for specific users
sudo nano /etc/tlog/tlog-rec-session.conf

# Record all sessions for users in 'recorded' group
# Create group
sudo groupadd recorded
sudo usermod -aG recorded alice

# Configure PAM to use tlog
sudo nano /etc/pam.d/system-auth

# Add before pam_unix.so:
session required pam_exec.so seteuid /usr/bin/tlog-rec-session

# View recorded sessions
sudo journalctl -o verbose --output-fields=MESSAGE TLOG_REC

# Play back session
sudo tlog-play -r journal -M TLOG_REC=<session-id>
```

### Monitoring Active Users

```bash
# Show logged-in users
w
who
users

# Show last logins
last
last alice
lastlog

# Show failed login attempts
lastb
sudo lastb

# Show current user sessions
loginctl list-sessions
loginctl show-session <session-id>

# Monitor in real-time
watch -n 5 'w'

# Monitoring script
#!/bin/bash
# monitor-users.sh

while true; do
    clear
    echo "=== Active Users ==="
    w
    echo
    echo "=== Recent Logins ==="
    last -n 10
    echo
    echo "=== Failed Logins ==="
    sudo lastb -n 5
    sleep 30
done
```

---

## User Provisioning Automation

### Ansible User Management

```yaml
# users.yml - Ansible playbook for user management

---
- name: Manage users
  hosts: all
  become: yes
  
  vars:
    users:
      - name: alice
        fullname: "Alice Admin"
        groups: ["sudo", "docker"]
        ssh_key: "ssh-rsa AAAAB3NzaC1yc2E..."
        state: present
      
      - name: bob
        fullname: "Bob Developer"
        groups: ["docker"]
        ssh_key: "ssh-rsa AAAAB3NzaC1yc2E..."
        state: present
      
      - name: olduser
        state: absent  # Remove user
  
  tasks:
    - name: Manage user accounts
      user:
        name: "{{ item.name }}"
        comment: "{{ item.fullname | default('') }}"
        groups: "{{ item.groups | default([]) }}"
        append: yes
        create_home: yes
        shell: /bin/bash
        state: "{{ item.state }}"
      loop: "{{ users }}"
    
    - name: Set up SSH keys
      authorized_key:
        user: "{{ item.name }}"
        key: "{{ item.ssh_key }}"
        state: present
      loop: "{{ users }}"
      when: item.state == "present" and item.ssh_key is defined
    
    - name: Configure sudo access
      template:
        src: sudoers.j2
        dest: "/etc/sudoers.d/{{ item.name }}"
        mode: '0440'
        validate: 'visudo -cf %s'
      loop: "{{ users }}"
      when: "'sudo' in item.groups"
```

### User Onboarding Script

```bash
#!/bin/bash
# onboard-user.sh - Complete user onboarding

set -e

USERNAME="$1"
FULLNAME="$2"
EMAIL="$3"
ROLE="$4"  # developer, sysadmin, readonly

if [ $# -ne 4 ]; then
    echo "Usage: $0 <username> <fullname> <email> <role>"
    echo "Roles: developer, sysadmin, readonly"
    exit 1
fi

echo "=== Onboarding User: $USERNAME ==="

# Create user
sudo useradd \
    --create-home \
    --shell /bin/bash \
    --comment "$FULLNAME - $EMAIL" \
    "$USERNAME"

# Set temporary password (expires immediately)
TEMP_PASS=$(openssl rand -base64 12)
echo "$USERNAME:$TEMP_PASS" | sudo chpasswd
sudo chage -d 0 "$USERNAME"

# Assign groups based on role
case "$ROLE" in
    sysadmin)
        sudo usermod -aG sudo,docker,adm "$USERNAME"
        ;;
    developer)
        sudo usermod -aG docker "$USERNAME"
        ;;
    readonly)
        sudo usermod -aG adm "$USERNAME"
        ;;
    *)
        echo "Unknown role: $ROLE"
        exit 1
        ;;
esac

# Create SSH directory
sudo mkdir -p "/home/$USERNAME/.ssh"
sudo chmod 700 "/home/$USERNAME/.ssh"
sudo touch "/home/$USERNAME/.ssh/authorized_keys"
sudo chmod 600 "/home/$USERNAME/.ssh/authorized_keys"
sudo chown -R "$USERNAME:$USERNAME" "/home/$USERNAME/.ssh"

# Create sudo rules
if [ "$ROLE" == "sysadmin" ]; then
    echo "$USERNAME ALL=(ALL) ALL" | sudo tee "/etc/sudoers.d/$USERNAME"
    sudo chmod 440 "/etc/sudoers.d/$USERNAME"
fi

# Send welcome email
cat <<EOF | mail -s "Welcome to the Team!" "$EMAIL"
Hello $FULLNAME,

Your account has been created:
Username: $USERNAME
Temporary Password: $TEMP_PASS

You'll be required to change your password on first login.

Please add your SSH public key to: ~/.ssh/authorized_keys

Documentation: https://docs.example.com/onboarding

Regards,
IT Team
EOF

echo "=== User $USERNAME created successfully ==="
echo "Temporary password: $TEMP_PASS"
echo "Password expires on first login"
echo "Role: $ROLE"
```

### User Offboarding Script

```bash
#!/bin/bash
# offboard-user.sh - Complete user offboarding

set -e

USERNAME="$1"

if [ -z "$USERNAME" ]; then
    echo "Usage: $0 <username>"
    exit 1
fi

echo "=== Offboarding User: $USERNAME ==="

# Lock account immediately
sudo usermod -L "$USERNAME"
echo "✓ Account locked"

# Expire account
sudo chage -E 0 "$USERNAME"
echo "✓ Account expired"

# Kill all user processes
sudo pkill -KILL -u "$USERNAME" || true
echo "✓ Processes terminated"

# Backup home directory
BACKUP_DIR="/backup/offboarded-users"
sudo mkdir -p "$BACKUP_DIR"
sudo tar -czf "$BACKUP_DIR/$USERNAME-$(date +%Y%m%d).tar.gz" "/home/$USERNAME"
echo "✓ Home directory backed up"

# Remove from all groups except primary
USER_GROUPS=$(groups "$USERNAME" | cut -d: -f2)
for group in $USER_GROUPS; do
    if [ "$group" != "$USERNAME" ]; then
        sudo gpasswd -d "$USERNAME" "$group" || true
    fi
done
echo "✓ Removed from supplementary groups"

# Remove sudo access
sudo rm -f "/etc/sudoers.d/$USERNAME"
echo "✓ Sudo access removed"

# Archive SSH keys
sudo cp "/home/$USERNAME/.ssh/authorized_keys" "$BACKUP_DIR/$USERNAME-ssh-keys-$(date +%Y%m%d).txt" || true
echo "✓ SSH keys archived"

# Remove from LDAP/FreeIPA (if applicable)
# ipa user-disable "$USERNAME"

# Log offboarding
logger "User $USERNAME offboarded on $(date) by $(whoami)"

echo "=== User $USERNAME offboarded successfully ==="
echo "Backup location: $BACKUP_DIR/$USERNAME-$(date +%Y%m%d).tar.gz"
echo ""
echo "To completely remove user:"
echo "  sudo userdel -r $USERNAME"
```

---

## Role-Based Access Control (RBAC)

### Define Roles

```bash
# /etc/security/roles.conf - Document roles

# Roles:
# 1. System Administrator (sysadmin)
#    - Full sudo access
#    - All servers
#    - Groups: sudo, docker, adm

# 2. Developer (developer)
#    - Limited sudo (restart services)
#    - Dev/staging servers only
#    - Groups: docker, developers

# 3. Database Administrator (dbadmin)
#    - Database servers only
#    - Run as postgres user
#    - Groups: dbadmin

# 4. Read-Only Auditor (auditor)
#    - View logs and configs
#    - No write access
#    - Groups: adm

# 5. Application Deployer (deployer)
#    - Deploy applications
#    - Restart app services
#    - Groups: deployers
```

### Implement RBAC with Sudo

```bash
# /etc/sudoers.d/rbac-rules

# System Administrators (full access)
%sudo ALL=(ALL:ALL) ALL

# Developers (restart services, view logs)
Cmnd_Alias DEV_COMMANDS = /usr/bin/systemctl restart myapp, \
                          /usr/bin/systemctl status *, \
                          /usr/bin/docker ps, \
                          /usr/bin/docker logs *
%developers ALL=(ALL) NOPASSWD: DEV_COMMANDS

# Database Administrators
Cmnd_Alias DB_COMMANDS = /usr/bin/psql, /usr/bin/pg_dump, \
                         /usr/bin/systemctl restart postgresql
%dbadmin ALL=(postgres) NOPASSWD: DB_COMMANDS

# Auditors (read-only)
Cmnd_Alias AUDIT_COMMANDS = /usr/bin/tail -f /var/log/*, \
                            /usr/bin/less /var/log/*, \
                            /usr/bin/cat /etc/*
%auditor ALL=(ALL) NOPASSWD: AUDIT_COMMANDS

# Deployers
Cmnd_Alias DEPLOY_COMMANDS = /usr/local/bin/deploy.sh, \
                             /usr/bin/systemctl restart myapp
%deployers ALL=(www-data) NOPASSWD: DEPLOY_COMMANDS
```

### RBAC with File Permissions

```bash
# Create role-based directories

# Developers can read/write app code
sudo mkdir -p /var/www/myapp
sudo chown -R :developers /var/www/myapp
sudo chmod -R 775 /var/www/myapp
sudo chmod g+s /var/www/myapp  # Set SGID

# DBAs can access database backups
sudo mkdir -p /backup/databases
sudo chown -R :dbadmin /backup/databases
sudo chmod 770 /backup/databases
sudo chmod g+s /backup/databases

# Auditors can read logs
sudo chown -R root:adm /var/log/myapp
sudo chmod -R 640 /var/log/myapp
```

---

## Security Best Practices

### User Account Security Checklist

```
☑ Root login disabled (SSH and console)
☑ Regular users use sudo for admin tasks
☑ Sudo configured with least privilege
☑ All sudo commands logged
☑ Strong password policy enforced (PAM)
☑ Password aging configured (90 days max)
☑ Account lockout after failed attempts
☑ Two-factor authentication enabled
☑ Service accounts have no login shell
☑ Unnecessary user accounts removed
☑ User home directories have strict permissions (700/750)
☑ SSH keys managed securely
☑ Centralized authentication (LDAP/FreeIPA) if multi-server
☑ Regular access reviews (quarterly)
☑ Audit logging enabled (auditd)
☑ Failed login attempts monitored
☑ Automated provisioning/deprovisioning
☑ Emergency access procedures documented
☑ Role-based access control implemented
☑ Principle of least privilege enforced
```

---

## What's Next?

After implementing user account security:

**Authentication:**
- [Two-Factor Authentication](two-factor-authentication) - TOTP, hardware keys
- [SSH Security Hardening](ssh-security-hardening) - Key management, bastions
- [Password Management](password-management) - Centralized password vault

**Network Security:**
- [Firewall Basics](firewall-basics) - Restrict access by IP/port
- [VPN Setup](wireguard-vpn) - Secure remote access
- [Network Segmentation](network-segmentation) - Isolate systems

**Advanced Security:**
- [SELinux/AppArmor](mandatory-access-control) - Mandatory access control
- [Secrets Management](../infrastructure/secrets-in-iac) - API keys, certificates
- [Zero Trust Principles](zero-trust-principles) - Never trust, always verify

---

## Additional Resources

### Official Documentation
- [useradd Man Page](https://linux.die.net/man/8/useradd)
- [sudoers Manual](https://www.sudo.ws/man/sudoers.man.html)
- [PAM Documentation](http://www.linux-pam.org/Linux-PAM-html/)

### Tutorials & Guides
- [Red Hat User Management](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_basic_system_settings/managing-users-and-groups_configuring-basic-system-settings)
- [Ubuntu Server Guide - User Management](https://ubuntu.com/server/docs/security-users)

### Tools
- [FreeIPA](https://www.freeipa.org/) - Identity management
- [Keycloak](https://www.keycloak.org/) - SSO and identity management
- [Teleport](https://goteleport.com/) - Infrastructure access platform

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive user account security guide covering secure user creation, least privilege principles, sudo configuration with fine-grained rules, PAM for password policies and restrictions, account lockout and aging, centralized authentication (LDAP/FreeIPA/Active Directory), audit logging with auditd, session recording, user provisioning/deprovisioning automation with Ansible and bash, role-based access control (RBAC), monitoring active users, and complete security best practices for production multi-user environments.

