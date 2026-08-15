# SSH Basics - Secure Shell Complete Guide

**Status**: Active  
**Last Updated**: 2026-01-30  
**Session**: Infrastructure KB Expansion - Basics Series  
**Tags**: beginner, ssh, security, remote-access, authentication, keys

## Summary

Comprehensive guide to SSH (Secure Shell) - the secure protocol for remote server access. Covers SSH fundamentals, key generation, configuration, tunneling, security best practices, and troubleshooting. Assumes basic Linux knowledge but explains SSH concepts from the ground up.

## 🎯 What You'll Learn

By the end of this guide, you'll understand:
- What SSH is and why it's essential for infrastructure work
- How to generate and manage SSH keys
- How to connect to remote servers securely
- How to configure SSH for convenience and security
- Advanced features like tunneling and port forwarding
- Security best practices and common pitfalls

**Prerequisites**: [kb/basics/linux-fundamentals](linux-fundamentals) - Basic Linux knowledge  
**Time Investment**: 2-3 hours to read, weeks of practice to master  
**Recommended Setup**: Access to two Linux systems (local + remote, or VM)

---

## Table of Contents

1. [What is SSH and Why It Matters](#what-is-ssh-and-why-it-matters)
2. [How SSH Works](#how-ssh-works)
3. [Installing SSH](#installing-ssh)
4. [Generating SSH Keys](#generating-ssh-keys)
5. [Connecting to Remote Servers](#connecting-to-remote-servers)
6. [SSH Configuration File](#ssh-configuration-file)
7. [Copying SSH Keys to Servers](#copying-ssh-keys-to-servers)
8. [SSH Agent - Managing Keys](#ssh-agent---managing-keys)
9. [SSH Tunneling and Port Forwarding](#ssh-tunneling-and-port-forwarding)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting Common Issues](#troubleshooting-common-issues)
12. [SSH Escape Codes](#ssh-escape-codes)
13. [Next Steps](#next-steps)

---

## What is SSH and Why It Matters

SSH (Secure Shell) is a **cryptographic network protocol** for securely accessing and managing remote computers over an insecure network (like the Internet). It replaced older, insecure protocols like Telnet, rlogin, and FTP.

### Why SSH is Everywhere

```
┌─────────────┐    SSH    ┌──────────────┐
│ Your Laptop │ ========> │ Remote Server│
│  (Client)   │ Encrypted │   (Host)     │
└─────────────┘           └──────────────┘
     
Everything sent between them is encrypted:
• Commands you type
• Output you receive  
• Files you transfer
• Passwords and keys
```

**Critical Uses**:
- **Remote Server Management**: Manage Linux servers anywhere in the world
- **Deployments**: Deploy code to production servers
- **Git Operations**: Push/pull code to self-hosted Git servers (Forgejo, GitLab)
- **File Transfers**: Secure file copying with SCP/SFTP
- **Tunneling**: Create secure tunnels for other services
- **Automation**: Scripts and CI/CD pipelines use SSH for deployment

**Without SSH**: Managing infrastructure at scale would be impossible. You'd need physical or console access to every server.

### SSH vs Other Protocols

| Protocol | Security | Use Case | Status |
|----------|----------|----------|--------|
| **SSH** | Encrypted | Remote shell, file transfer | ✅ Modern standard |
| **Telnet** | Plain text! | Remote shell | ❌ Obsolete (insecure) |
| **FTP** | Plain text! | File transfer | ❌ Obsolete (insecure) |
| **SFTP** | Encrypted (uses SSH) | File transfer | ✅ Recommended |
| **SCP** | Encrypted (uses SSH) | File transfer | ✅ Recommended |

---

## How SSH Works

Understanding SSH's security model helps you use it confidently and troubleshoot issues.

### Client-Server Architecture

```
CLIENT (Your Computer)          SERVER (Remote Host)
┌──────────────────┐            ┌───────────────────┐
│  SSH Client      │            │   SSH Daemon      │
│  (ssh command)   │            │   (sshd service)  │
│                  │            │                   │
│  Port: Random    │◄─────────►│   Port: 22        │
│                  │  Encrypted │                   │
│  ~/.ssh/         │  Tunnel    │   ~/.ssh/         │
│    config        │            │     authorized_   │
│    id_rsa        │            │     keys          │
│    known_hosts   │            │   /etc/ssh/       │
│                  │            │     sshd_config   │
└──────────────────┘            └───────────────────┘
```

### Authentication Methods

SSH supports multiple authentication methods (tried in order):

**1. Public Key Authentication** (Recommended - Most Secure)
```
You have:  Private key (~/.ssh/id_rsa) - NEVER share!
Server has: Public key (~/.ssh/authorized_keys) - Safe to share

Server challenges you → Prove you have private key → Access granted
No password needed!
```

**2. Password Authentication** (Simple but Less Secure)
```
Server asks for password → You type password → Server checks → Access granted
```

**3. Other Methods** (Advanced)
- Host-based authentication
- GSSAPI (Kerberos)
- Certificate-based authentication

### Why Public Keys are Better

| Password Auth | Public Key Auth |
|---------------|-----------------|
| Vulnerable to brute force | Mathematically infeasible to guess |
| Can be phished/typed wrong | Key never leaves your computer |
| Humans choose weak passwords | 2048+ bit keys = strong by default |
| Manual typing required | Automatic authentication |
| One password compromised = breach | Revoke one key, others still work |

---

## Installing SSH

Most Linux systems come with SSH pre-installed, but here's how to ensure it's ready.

### Check if SSH is Installed

**Check SSH Client** (your computer):
```bash
$ ssh -V
OpenSSH_9.0p1, OpenSSL 3.0.2 15 Mar 2022
```

**Check SSH Server** (remote hosts you manage):
```bash
# Check if sshd is running
$ systemctl status sshd
# or on older systems:
$ systemctl status ssh

# Check if sshd is installed
$ which sshd
/usr/sbin/sshd
```

### Installing SSH

**Ubuntu/Debian**:
```bash
# Client (usually pre-installed)
$ sudo apt update
$ sudo apt install openssh-client

# Server (if setting up a server for others to connect to)
$ sudo apt install openssh-server
$ sudo systemctl enable ssh
$ sudo systemctl start ssh
```

**RHEL/Rocky/Fedora**:
```bash
# Client
$ sudo dnf install openssh-clients

# Server
$ sudo dnf install openssh-server
$ sudo systemctl enable sshd
$ sudo systemctl start sshd

# Allow SSH through firewall
$ sudo firewall-cmd --permanent --add-service=ssh
$ sudo firewall-cmd --reload
```

**Windows**:
- **Windows 10/11**: OpenSSH client is built-in (since 2018)
- **Older Windows**: Install [PuTTY](https://www.putty.org/) or [Windows Terminal](https://github.com/microsoft/terminal)

Check if available:
```powershell
PS> ssh -V
```

**macOS**:
- SSH client pre-installed
- Open Terminal and use `ssh` command

---

## Generating SSH Keys

SSH keys are the foundation of secure, password-less authentication.

### Creating Your First SSH Key Pair

**Basic Key Generation**:
```bash
$ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/home/yourname/.ssh/id_rsa): [Press ENTER]
Enter passphrase (empty for no passphrase): [Type passphrase or press ENTER]
Enter same passphrase again: [Repeat]

Your identification has been saved in /home/yourname/.ssh/id_rsa
Your public key has been saved in /home/yourname/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 yourname@yourlaptop
The key's randomart image is:
+---[RSA 3072]----+
|        .o+*=    |
|       . o*o+.   |
|        o.=+..   |
|       . +.+o    |
|        S +..    |
|         =.o     |
|        . B.     |
|         = E     |
|        . o      |
+----[SHA256]-----+
```

**What Just Happened?**

Two files were created in `~/.ssh/`:

```bash
$ ls -l ~/.ssh/
-rw-------  1 yourname yourname 2602 Jan 30 10:00 id_rsa       # Private key
-rw-r--r--  1 yourname yourname  571 Jan 30 10:00 id_rsa.pub   # Public key
```

**CRITICAL**: 
- `id_rsa` (private key) = Your digital identity. NEVER share, NEVER put on servers
- `id_rsa.pub` (public key) = Safe to share, put on servers for authentication

### Stronger Key Generation

**Recommended for 2026+** (stronger key):
```bash
# 4096-bit RSA key (more secure)
$ ssh-keygen -t rsa -b 4096 -C "yourname@yourdomain.com"

# ED25519 key (modern, smaller, faster)
$ ssh-keygen -t ed25519 -C "yourname@yourdomain.com"
```

**Key Type Comparison**:
| Type | Bits | Speed | Security | Use Case |
|------|------|-------|----------|----------|
| RSA 2048 | 2048 | Good | Good | Default, widely compatible |
| RSA 4096 | 4096 | Slower | Better | Maximum compatibility + security |
| ED25519 | 256 | Fast | Excellent | Modern (2013+), recommended |

**Recommendation**: Use ED25519 for new keys unless you need compatibility with very old systems.

### Adding a Passphrase

**Should you use a passphrase?**

```
Passphrase = Password that encrypts your private key

WITH passphrase:
✅ Even if someone steals id_rsa, they can't use it
✅ Extra security layer
❌ Must type passphrase when using key (can be cached with ssh-agent)

WITHOUT passphrase:
✅ Fully automatic authentication
❌ Stolen key = instant access to your servers
```

**Best Practice**: Always use a passphrase for production servers, optionally skip for local dev/testing.

### Managing Multiple Keys

**Different keys for different purposes**:
```bash
# Personal GitHub
$ ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_github -C "personal@email.com"

# Work servers
$ ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_work -C "work@company.com"

# Specific project
$ ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_project -C "project@client.com"
```

You'll configure which key to use in `~/.ssh/config` (covered later).

### Viewing Your Public Key

```bash
$ cat ~/.ssh/id_rsa.pub
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... yourname@yourlaptop

# Or for ED25519:
$ cat ~/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... yourname@yourlaptop
```

This is what you'll copy to servers and Git services.

### Viewing Key Fingerprint

```bash
$ ssh-keygen -lf ~/.ssh/id_rsa.pub
3072 SHA256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 yourname@yourlaptop (RSA)
```

Fingerprints help verify you're using the right key.

---

## Connecting to Remote Servers

Now let's actually connect to a remote server!

### Basic Connection

**Simplest form** (if username matches):
```bash
$ ssh hostname
# Example:
$ ssh myserver.example.com
```

**Specify username**:
```bash
$ ssh username@hostname
# Example:
$ ssh alice@192.168.1.100
$ ssh deploy@myserver.example.com
```

**First connection** - You'll see this warning:
```bash
$ ssh alice@newserver.example.com
The authenticity of host 'newserver.example.com (192.168.1.100)' can't be established.
ED25519 key fingerprint is SHA256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'newserver.example.com' (ED25519) to the list of known hosts.
alice@newserver.example.com's password:
```

**What's happening?**
1. Your client doesn't recognize the server yet
2. Server presents its host key fingerprint
3. You verify it's the right server (check with admin/documentation)
4. Type `yes` to accept and remember this server
5. Server's key is saved to `~/.ssh/known_hosts`
6. Future connections won't ask again (unless key changes)

### Connection with Password

```bash
$ ssh alice@myserver.example.com
alice@myserver.example.com's password: [type password]

# Now you have a shell on the remote server:
alice@myserver:~$ whoami
alice
alice@myserver:~$ pwd
/home/alice
alice@myserver:~$ logout
Connection to myserver.example.com closed.

# Back on your local machine
$
```

### Running Single Commands

Instead of opening a shell session, execute one command and return:

```bash
# Check server uptime
$ ssh alice@myserver.example.com uptime
 10:23:45 up 42 days, 3:14, 2 users, load average: 0.15, 0.22, 0.18

# Check disk space
$ ssh alice@myserver.example.com df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   20G   28G  42% /

# Run multiple commands (quote them)
$ ssh alice@myserver.example.com "cd /var/log && tail -n 20 syslog"
```

### Specifying Port

Default SSH port is `22`. If your server uses a different port:

```bash
$ ssh -p 2222 alice@myserver.example.com
```

### Using a Specific Key

```bash
$ ssh -i ~/.ssh/id_ed25519_work alice@workserver.com
```

---

## SSH Configuration File

Typing full connection details every time is tedious. The SSH config file lets you create shortcuts.

### Creating/Editing SSH Config

```bash
$ mkdir -p ~/.ssh
$ chmod 700 ~/.ssh
$ nano ~/.ssh/config
```

### Basic Configuration Example

```ssh-config
# Personal server
Host myserver
    HostName myserver.example.com
    User alice
    Port 22
    IdentityFile ~/.ssh/id_ed25519

# Work server with custom port
Host workserver
    HostName work.company.com
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_work

# Development VM
Host devvm
    HostName 192.168.1.100
    User developer
    ForwardAgent yes

# Wildcard for all company servers
Host *.company.com
    User alice
    IdentityFile ~/.ssh/id_ed25519_work
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Now connect simply**:
```bash
$ ssh myserver       # Instead of: ssh -i ~/.ssh/id_ed25519 alice@myserver.example.com
$ ssh workserver     # Instead of: ssh -p 2222 -i ~/.ssh/id_ed25519_work deploy@work.company.com
$ ssh devvm          # Instead of: ssh developer@192.168.1.100
```

### Useful Configuration Options

```ssh-config
Host *
    # Keep connection alive (prevent timeouts)
    ServerAliveInterval 60
    ServerAliveCountMax 3
    
    # Reuse connections (faster subsequent connections)
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h:%p
    ControlPersist 600
    
    # Security settings
    StrictHostKeyChecking ask
    HashKnownHosts yes
    
    # Prefer public key auth
    PreferredAuthentications publickey,password
    
    # Compression for slow connections
    Compression yes
```

**Create socket directory** for ControlMaster:
```bash
$ mkdir -p ~/.ssh/sockets
```

### Per-Host Advanced Config

```ssh-config
Host jumpbox
    HostName jumpbox.example.com
    User bastion
    ForwardAgent yes

# Connect through jump host
Host internal-server
    HostName 10.0.1.50
    User admin
    ProxyJump jumpbox

# Multiple jump hosts
Host deep-server
    HostName 10.0.2.100
    User admin
    ProxyJump jumpbox,gateway
```

---

## Copying SSH Keys to Servers

To use key-based authentication, your public key must be on the server in `~/.ssh/authorized_keys`.

### Method 1: Using ssh-copy-id (Easiest)

```bash
$ ssh-copy-id username@hostname

# Example:
$ ssh-copy-id alice@myserver.example.com
/usr/bin/ssh-copy-id: INFO: attempting to log in...
alice@myserver.example.com's password: [type password]

Number of key(s) added: 1

Now try logging into the machine with "ssh 'alice@myserver.example.com'"
and check to make sure that only the key(s) you wanted were added.
```

**Specify which key**:
```bash
$ ssh-copy-id -i ~/.ssh/id_ed25519.pub alice@myserver.example.com
```

**Test it works**:
```bash
$ ssh alice@myserver.example.com
# Should NOT ask for password!
```

### Method 2: Manual Copy (if ssh-copy-id unavailable)

**One-liner using cat and ssh**:
```bash
$ cat ~/.ssh/id_ed25519.pub | ssh alice@myserver.example.com "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**Breakdown**:
1. `cat ~/.ssh/id_ed25519.pub` - Read your public key
2. `ssh alice@myserver.example.com` - Connect to server
3. `mkdir -p ~/.ssh` - Ensure .ssh directory exists
4. `chmod 700 ~/.ssh` - Set correct permissions on directory
5. `cat >> ~/.ssh/authorized_keys` - Append key to authorized_keys
6. `chmod 600 ~/.ssh/authorized_keys` - Set correct permissions on file

### Method 3: Fully Manual (console/web panel access)

If you have console or physical access to the server:

**On your local machine**, display your public key:
```bash
$ cat ~/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAbCdEfGhIjKlMnOpQrStUvWxYz yourname@laptop
```

**On the remote server**, create file and paste:
```bash
$ mkdir -p ~/.ssh
$ chmod 700 ~/.ssh
$ nano ~/.ssh/authorized_keys
# Paste your public key (one per line)
# Save and exit

$ chmod 600 ~/.ssh/authorized_keys
```

### Verifying Authorized Keys

**On server**, check what keys are authorized:
```bash
$ cat ~/.ssh/authorized_keys
```

**Test from local machine**:
```bash
$ ssh -v alice@myserver.example.com
# Look for lines like:
# debug1: Offering public key: /home/yourname/.ssh/id_ed25519 ED25519 SHA256:...
# debug1: Server accepts key: /home/yourname/.ssh/id_ed25519 ED25519 SHA256:...
# debug1: Authentication succeeded (publickey).
```

---

## SSH Agent - Managing Keys

SSH Agent caches your decrypted private keys so you only enter passphrases once per session.

### Why Use SSH Agent?

**Without Agent**:
```bash
$ ssh server1
Enter passphrase for key '/home/you/.ssh/id_ed25519': [type passphrase]
$ ssh server2  
Enter passphrase for key '/home/you/.ssh/id_ed25519': [type passphrase again!]
$ ssh server3
Enter passphrase for key '/home/you/.ssh/id_ed25519': [type passphrase again!]
```

**With Agent**:
```bash
$ ssh-add
Enter passphrase for key '/home/you/.ssh/id_ed25519': [type ONCE]
$ ssh server1     # No passphrase!
$ ssh server2     # No passphrase!
$ ssh server3     # No passphrase!
```

### Starting SSH Agent

**Most Linux desktops** start agent automatically. Check if running:
```bash
$ echo $SSH_AUTH_SOCK
/run/user/1000/keyring/ssh
# If you see a path, agent is running

$ ssh-add -l
2048 SHA256:a1b2c3d4... yourname@laptop (RSA)
# Shows loaded keys
```

**If agent not running**, start it:
```bash
$ eval $(ssh-agent)
Agent pid 12345
```

**Add this to `~/.bashrc` or `~/.zshrc`** to auto-start:
```bash
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval $(ssh-agent -s) > /dev/null
    ssh-add ~/.ssh/id_ed25519 2>/dev/null
fi
```

### Adding Keys to Agent

```bash
# Add default key
$ ssh-add
Enter passphrase for /home/you/.ssh/id_rsa: [type passphrase]
Identity added: /home/you/.ssh/id_rsa

# Add specific key
$ ssh-add ~/.ssh/id_ed25519_work
Enter passphrase for /home/you/.ssh/id_ed25519_work: [type passphrase]
Identity added: /home/you/.ssh/id_ed25519_work

# Add all keys in ~/.ssh
$ ssh-add ~/.ssh/id_*
```

### Managing Loaded Keys

```bash
# List loaded keys
$ ssh-add -l
3072 SHA256:a1b2c3d4e5f6... yourname@laptop (RSA)
256 SHA256:x9y8z7w6v5u4... yourname@laptop (ED25519)

# Remove specific key
$ ssh-add -d ~/.ssh/id_rsa.pub

# Remove all keys
$ ssh-add -D
```

### Agent Forwarding

Agent forwarding lets you use your local keys on a remote server without copying them:

```
Your Laptop → Server A → Server B
   (keys)   (no keys)  (no keys)
   
Agent forwarding = Server A can use YOUR keys to connect to Server B
```

**Enable per-connection**:
```bash
$ ssh -A alice@servera.example.com
alice@servera:~$ ssh bob@serverb.example.com  # Uses YOUR keys!
```

**Enable in SSH config**:
```ssh-config
Host jumpbox
    HostName jumpbox.example.com
    ForwardAgent yes
```

**⚠️ Security Warning**: Only use agent forwarding on servers you trust. A compromised server could use your keys while you're connected.

---

## SSH Tunneling and Port Forwarding

SSH can create encrypted tunnels for other services. Incredibly powerful for security and accessing restricted networks.

### Local Port Forwarding

**Access a remote service as if it's local**:

```
Your Laptop:8080 ──SSH Tunnel──> Remote:80

Web browser → localhost:8080 → (encrypted tunnel) → remote-server:80
```

**Example - Access remote web server**:
```bash
$ ssh -L 8080:localhost:80 alice@remote-server.com
# Now open http://localhost:8080 in your browser
# You're accessing remote-server.com:80 through encrypted tunnel
```

**General syntax**:
```bash
ssh -L local_port:destination:destination_port user@ssh-server
```

**Real-world examples**:

```bash
# Access remote database
$ ssh -L 5432:localhost:5432 alice@dbserver.com
# Connect to localhost:5432 with your database tool

# Access remote admin panel (only accessible from server)
$ ssh -L 8080:localhost:8080 alice@server.com
# Open http://localhost:8080

# Access service on private network through jump host
$ ssh -L 3000:10.0.1.50:3000 alice@jumphost.com
# Access private server 10.0.1.50:3000 via jumphost
```

**Run in background**:
```bash
$ ssh -f -N -L 8080:localhost:80 alice@server.com
# -f = background
# -N = don't execute commands (just forward)
```

### Remote Port Forwarding

**Expose your local service to remote server**:

```
Remote:8080 ──SSH Tunnel──> Your Laptop:3000

Remote users → remote-server:8080 → (encrypted tunnel) → localhost:3000
```

**Example - Share local development server**:
```bash
# You're running app on localhost:3000
$ ssh -R 8080:localhost:3000 alice@publicserver.com
# Now publicserver.com:8080 → your localhost:3000
```

**General syntax**:
```bash
ssh -R remote_port:local_host:local_port user@ssh-server
```

**Use case**: Demonstrate local dev work to remote client without deploying.

### Dynamic Port Forwarding (SOCKS Proxy)

**Turn SSH connection into a SOCKS proxy**:

```bash
$ ssh -D 8080 alice@server.com
# Your laptop now has SOCKS proxy on localhost:8080
```

**Configure browser** to use SOCKS proxy `localhost:8080`:
- All browser traffic → encrypted through server.com
- Useful for bypassing firewalls or geo-restrictions

**Firefox configuration**:
```
Preferences → Network Settings → Manual Proxy Configuration
SOCKS Host: localhost
Port: 8080
SOCKS v5: Yes
```

---

## Security Best Practices

SSH is secure by default, but proper configuration makes it bulletproof.

### Server-Side Security (sshd_config)

Edit SSH daemon config:
```bash
$ sudo nano /etc/ssh/sshd_config
```

**Essential security settings**:
```conf
# Disable password authentication (keys only)
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable root login
PermitRootLogin no

# Only allow specific users
AllowUsers alice bob charlie

# Or only allow specific groups
AllowGroups sshusers

# Limit authentication attempts
MaxAuthTries 3

# Use strong encryption only
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Change default port (security through obscurity, but helps reduce bot attacks)
Port 2222

# Protocol 2 only (never use protocol 1)
Protocol 2
```

**After changes, restart SSH**:
```bash
$ sudo systemctl restart sshd   # RHEL/Rocky/Fedora
$ sudo systemctl restart ssh    # Ubuntu/Debian
```

**⚠️ Before disabling password auth**: Make sure key-based auth works! Test in a separate session or you'll lock yourself out.

### Client-Side Security

**Protect your private keys**:
```bash
# Correct permissions
$ chmod 700 ~/.ssh
$ chmod 600 ~/.ssh/id_*
$ chmod 644 ~/.ssh/id_*.pub
$ chmod 600 ~/.ssh/authorized_keys
$ chmod 600 ~/.ssh/config
```

**Check permissions**:
```bash
$ ls -la ~/.ssh/
drwx------   2 alice alice 4096 Jan 30 10:00 .
drwxr-xr-x  25 alice alice 4096 Jan 30 09:00 ..
-rw-------   1 alice alice 3401 Jan 30 10:00 id_ed25519
-rw-r--r--   1 alice alice  751 Jan 30 10:00 id_ed25519.pub
-rw-------   1 alice alice 1234 Jan 30 09:50 authorized_keys
-rw-------   1 alice alice 2345 Jan 30 09:45 config
-rw-r--r--   1 alice alice 5678 Jan 30 09:40 known_hosts
```

### Key Management Best Practices

1. **Use passphrases on private keys** (especially for production)
2. **Separate keys for different purposes** (work, personal, specific projects)
3. **Rotate keys periodically** (annually or when team members leave)
4. **Backup keys securely** (encrypted backup, password manager)
5. **Never commit private keys to Git** (add `id_*` to .gitignore)
6. **Remove old keys from authorized_keys** when no longer needed
7. **Monitor SSH logins** (check `/var/log/auth.log` regularly)

### Fail2Ban - Automated Ban for Brute Force

Install Fail2Ban to automatically block IPs after failed login attempts:

```bash
# Ubuntu/Debian
$ sudo apt install fail2ban

# RHEL/Rocky/Fedora
$ sudo dnf install fail2ban

# Enable and start
$ sudo systemctl enable fail2ban
$ sudo systemctl start fail2ban

# Check status
$ sudo fail2ban-client status sshd
```

Default config usually works well: Ban after 5 failed attempts for 10 minutes.

---

## Troubleshooting Common Issues

### Connection Refused

**Error**:
```
ssh: connect to host myserver.example.com port 22: Connection refused
```

**Causes & Fixes**:
```bash
# 1. SSH server not running
$ sudo systemctl status sshd
$ sudo systemctl start sshd

# 2. Wrong port
$ ssh -p 2222 user@host

# 3. Firewall blocking
$ sudo firewall-cmd --list-all
$ sudo firewall-cmd --permanent --add-service=ssh
$ sudo firewall-cmd --reload

# 4. Network issue - test connectivity
$ ping myserver.example.com
$ telnet myserver.example.com 22
```

### Permission Denied (publickey)

**Error**:
```
Permission denied (publickey).
```

**Debugging steps**:
```bash
# 1. Verbose output to see what's happening
$ ssh -v user@host
# Look for lines about key offers and server responses

# 2. Verify key is offered
debug1: Offering public key: /home/you/.ssh/id_ed25519
debug1: Server accepts key: /home/you/.ssh/id_ed25519
# If "Server accepts key" missing, server doesn't have your public key

# 3. Check permissions on client
$ ls -la ~/.ssh/
# id_rsa should be 600 (rw-------)

# 4. Check authorized_keys on server
$ ssh user@host "cat ~/.ssh/authorized_keys"
# Your public key should be there

# 5. Check permissions on server
$ ssh user@host "ls -la ~/.ssh/"
# .ssh should be 700, authorized_keys should be 600

# 6. Check SELinux (RHEL/Rocky/Fedora)
$ sudo restorecon -Rv ~/.ssh
```

### Host Key Verification Failed

**Error**:
```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
```

**Causes**:
1. Server was rebuilt/reinstalled (new host keys generated)
2. IP address reassigned to different server
3. **Man-in-the-middle attack** (rare but serious!)

**If you KNOW it's legitimate** (server rebuilt):
```bash
$ ssh-keygen -R hostname
# or
$ ssh-keygen -R 192.168.1.100

# Then connect again
$ ssh user@hostname
```

**If unexpected**: Investigate! Contact server admin. Don't ignore this warning.

### Timeout Issues

**Error**:
```
ssh: connect to host myserver.example.com port 22: Connection timed out
```

**Add keepalive to config**:
```ssh-config
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### Too Many Authentication Failures

**Error**:
```
Received disconnect from host: 2: Too many authentication failures
```

**Cause**: Too many keys in ssh-agent

**Fix**:
```bash
# Remove all keys from agent
$ ssh-add -D

# Add only the key you need
$ ssh-add ~/.ssh/id_ed25519

# Or specify key explicitly
$ ssh -i ~/.ssh/id_ed25519 user@host
```

---

## SSH Escape Codes

Control SSH sessions from within using escape codes (start with `~`).

**Must be first thing on new line** (press Enter first):

```bash
# Force disconnect (stuck session)
[ENTER]
~.
# Connection closed

# List forwarded connections
[ENTER]
~#

# Background SSH session
[ENTER]
~[CTRL-Z]
[1]+  Stopped                 ssh user@host
$ fg  # Return to session

# SSH command line (add/remove port forwards)
[ENTER]
~C
ssh> -L 8080:localhost:80
Forwarding port.
ssh> -KL 8080
Canceled forwarding.

# List all escape codes
[ENTER]
~?
```

**Useful for**:
- Killing frozen SSH sessions
- Adding port forwards without reconnecting
- Backgrounding long-running sessions

---

## Resource Requirements

**SSH Client**:
- **CPU**: Negligible `[█░░░░░░░░░]` 10%
- **RAM**: <100MB `[█░░░░░░░░░]` 10%
- **Network**: Minimal (few KB/s idle) `[██░░░░░░░░]` 20%

**SSH Server (sshd)**:
- **Base**: ~10MB RAM per connection `[██░░░░░░░░]` 20%
- **100 concurrent connections**: ~1GB RAM `[████░░░░░░]` 40%
- **CPU**: Minimal unless transferring large files `[██░░░░░░░░]` 20%

**SSH Tunneling**:
- **Overhead**: +5-10% latency `[███░░░░░░░]` 30%
- **Throughput**: Near-native (encryption is fast) `[████████░░]` 80%

**Learning Curve**:
- **Basic usage**: `[███░░░░░░░]` 30% - A few hours
- **Config & keys**: `[█████░░░░░]` 50% - Few days practice
- **Advanced (tunnels, agents)**: `[███████░░░]` 70% - Weeks of experience

---

## Next Steps

### After Mastering SSH Basics

**Immediate Next Steps**:
1. **[kb/security/ssh-hardening](../security/ssh-hardening)** - Advanced security configurations
2. **[kb/basics/bash-scripting](bash-scripting)** - Automate SSH tasks
3. **[kb/infrastructure/ansible-basics](../infrastructure/ansible-basics)** - Use SSH for automation at scale

**Infrastructure Path**:
4. **[kb/cicd/forgejo-setup](../cicd/forgejo-setup)** - Set up self-hosted Git with SSH
5. **[kb/infrastructure/server-provisioning](../infrastructure/server-provisioning)** - Set up new servers
6. **[kb/security/zero-trust-homelab](../security/zero-trust-homelab)** - Build secure infrastructure

**Advanced SSH Topics**:
- SSH certificates (not just keys)
- Jump hosts and bastion servers
- SSH VPN (tun/tap devices)
- ProxyCommand and ProxyJump advanced usage
- Multi-factor authentication with SSH

---

## Community Resources

### 📚 Official Documentation (Type → Skill Level)
**Beginner**:
- [OpenSSH Manual Pages](https://www.openssh.com/manual.html) - Official OpenSSH docs
- [DigitalOcean SSH Essentials](https://www.digitalocean.com/community/tutorials/ssh-essentials-working-with-ssh-servers-clients-and-keys) - Excellent beginner guide

**Intermediate**:
- [SSH.com Academy](https://www.ssh.com/academy/ssh) - Comprehensive SSH resource
- [Arch Wiki - OpenSSH](https://wiki.archlinux.org/title/OpenSSH) - Detailed technical reference

**Advanced**:
- [SSH Protocol Specification - RFC 4251](https://www.rfc-editor.org/rfc/rfc4251) - Protocol internals
- [OpenSSH Release Notes](https://www.openssh.com/releasenotes.html) - Latest features

### 🎓 Tutorials (Type → Skill Level)
**Beginner**:
- [SSH Crash Course - freeCodeCamp](https://www.youtube.com/watch?v=hQWRp-FdTpc) - Video tutorial
- [SSH Tutorial for Beginners](https://www.hostinger.com/tutorials/ssh-tutorial-how-does-ssh-work) - Step-by-step
- [Linux Academy SSH Basics](https://linuxacademy.com/course/ssh-fundamentals/) - Interactive

**Intermediate**:
- [SSH Tips and Tricks](https://www.linuxjournal.com/content/ssh-tricks) - Productivity hacks
- [Advanced SSH Config](https://infosec.mozilla.org/guidelines/openssh) - Mozilla's guide
- [SSH Tunneling Explained](https://www.ssh.com/academy/ssh/tunneling-example) - Port forwarding deep dive

**Advanced**:
- [SSH Certificate Authority Setup](https://engineering.fb.com/2016/09/12/security/scalable-and-secure-access-with-ssh/) - Facebook's approach
- [Hardening SSH](https://stribika.github.io/2015/01/04/secure-secure-shell.html) - Security guide

### 🎥 Video Courses (Type → Skill Level)
**Beginner**:
- [SSH for Beginners - NetworkChuck](https://www.youtube.com/watch?v=qWKK_PNHnnA) - Fun, practical
- [Complete SSH Tutorial - TechWorld with Nana](https://www.youtube.com/watch?v=Atbl7D_yPug) - Comprehensive

**Intermediate**:
- [SSH Deep Dive - CBT Nuggets](https://www.cbtnuggets.com/) - Professional training

### 📖 Books (Type → Skill Level)
**Beginner to Intermediate**:
- "SSH, The Secure Shell: The Definitive Guide" by Barrett, Silverman, Byrnes - Comprehensive
- "Linux Security Cookbook" - Chapter on SSH - Practical recipes

### 💬 Community Help (Type)
**Q&A**:
- [Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/tagged/ssh) - Active SSH tag
- [ServerFault](https://serverfault.com/questions/tagged/ssh) - Sysadmin focus

**Forums**:
- [r/ssh](https://www.reddit.com/r/ssh/) - Reddit community
- [LinuxQuestions.org - Networking Forum](https://www.linuxquestions.org/questions/linux-networking-3/) - Helpful community

### 🔧 Tools & Utilities (Type)
**SSH Clients**:
- [PuTTY](https://www.putty.org/) - Windows classic
- [MobaXterm](https://mobaxterm.mobatek.net/) - Windows with X11
- [Termius](https://termius.com/) - Cross-platform with sync
- [Tabby](https://tabby.sh/) - Modern, feature-rich

**Key Management**:
- [ssh-audit](https://github.com/jtesta/ssh-audit) - Security scanner for SSH
- [ssh-key-confirmer](https://github.com/benjojo/ssh-key-confirmer) - Verify keys visually

**Configuration Generators**:
- [Mozilla SSH Config Generator](https://infosec.mozilla.org/guidelines/openssh.html) - Secure configs
- [SSH Config Editor](https://github.com/jotyGill/quickez) - GUI config tool

### 📜 Cheat Sheets (Type)
- [SSH Commands Cheat Sheet](https://www.cheatography.com/davechild/cheat-sheets/ssh/) - Quick reference
- [OpenSSH Config Cheat Sheet](https://www.cyberciti.biz/faq/ssh-config-file-examples-for-linux-unix/) - Config options
- [SSH Escape Sequences](https://en.wikibooks.org/wiki/OpenSSH/Cookbook/Escape_Sequences) - Control codes

---

## Related KB Articles

**Prerequisites for This Article**:
- **[kb/basics/linux-fundamentals](linux-fundamentals)** - Essential Linux knowledge

**This Article is a Prerequisite For**:
- **[kb/security/ssh-hardening](../security/ssh-hardening)** - Advanced SSH security
- **[kb/infrastructure/server-provisioning](../infrastructure/server-provisioning)** - Server setup
- **[kb/cicd/forgejo-setup](../cicd/forgejo-setup)** - Self-hosted Git with SSH
- **[kb/infrastructure/ansible-basics](../infrastructure/ansible-basics)** - Automation with SSH
- **[kb/basics/bash-scripting](bash-scripting)** - Automate SSH operations

**Related Topics**:
- **[kb/security/zero-trust-homelab](../security/zero-trust-homelab)** - SSH in Zero Trust architecture
- **[kb/sysadmin/systemd-deep-dive](../sysadmin/systemd-deep-dive)** - Managing sshd service
- **[kb/networking/reverse-proxies](../networking/reverse-proxies)** - SSH behind proxies

---

## Change Log

### 2026-01-30 - Initial Creation
- Created comprehensive SSH basics guide
- Covered SSH concepts from absolute zero
- Added key generation and management
- Included connection methods and configuration
- Documented SSH agent and key forwarding
- Explained port forwarding and tunneling in detail
- Added troubleshooting section with common issues
- Compiled learning resources organized by type and skill level
- Added ASCII diagrams for visual learning
- Included resource requirement bars for planning
- Cross-referenced related KB articles

---

**🔐 Remember**: SSH is your lifeline to remote infrastructure. Master it well, protect your keys zealously, and you'll have a secure, convenient way to manage servers anywhere in the world!
