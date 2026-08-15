# Fail2ban Setup - Automated Intrusion Prevention

**Resource Navigation:** [README](README) | [Firewall Basics](firewall-basics) | [SSH Security Hardening](ssh-security-hardening) | [Intrusion Detection](intrusion-detection)

---

## Summary

Fail2ban is an intrusion prevention tool that monitors log files for suspicious activity (brute-force attacks, authentication failures, exploit attempts) and automatically bans offending IP addresses by creating firewall rules. This comprehensive guide covers fail2ban installation, configuration, jail creation for SSH, web servers (Nginx/Apache), mail servers, databases, and custom applications. Learn to write custom filters, configure actions, integrate with CloudFlare, implement geographic blocking, and build enterprise-grade security automation. Every pattern includes production examples, performance tuning, and integration with monitoring systems.

**The Golden Rule:** Automate defense against repeated attacks before they succeed.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Install and configure fail2ban on Linux systems
- ✅ Protect SSH from brute-force attacks
- ✅ Secure web servers (Nginx, Apache) from exploit attempts
- ✅ Create custom jails for any application
- ✅ Write custom filters using regex patterns
- ✅ Configure actions (ban, email, Slack notifications)
- ✅ Integrate fail2ban with iptables and nftables
- ✅ Implement CloudFlare ban actions for DDoS protection
- ✅ Monitor and analyze fail2ban statistics
- ✅ Troubleshoot and test fail2ban configurations

---

## Prerequisites

Before setting up fail2ban, you should have:

- **Linux fundamentals**: Basic system administration knowledge
- **Firewall configured**: [Firewall Basics](firewall-basics) with iptables or nftables
- **SSH hardened**: [SSH Security Hardening](ssh-security-hardening) completed
- **Log familiarity**: Understanding of system logs (/var/log/)
- **Regex basics**: Basic regular expression knowledge helpful
- **Root access**: Ability to modify system configuration

---

## What is Fail2ban?

### How Fail2ban Works

```
┌─────────────────────────────────────────────────────┐
│                Application Logs                      │
│  /var/log/auth.log (SSH failures)                   │
│  /var/log/nginx/access.log (HTTP exploits)          │
│  /var/log/mail.log (SMTP attacks)                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │   Fail2ban Daemon      │
        │   - Monitors logs      │
        │   - Applies filters    │
        │   - Counts failures    │
        └────────────┬───────────┘
                     │
           Match attack pattern?
                     │
                     ↓
            ┌────────────────┐
            │  Threshold Met? │ ← maxretry exceeded?
            │  (e.g., 5 fails │    within findtime?
            │   in 10 min)    │
            └────────┬─────────┘
                     │
                Yes  │
                     ↓
         ┌───────────────────────┐
         │   Execute Action      │
         │   - Ban IP (firewall) │
         │   - Send alert        │
         │   - Log event         │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │   Firewall Rule       │
         │   iptables -I INPUT   │
         │   -s 203.0.113.42     │
         │   -j DROP             │
         └───────────────────────┘
                     │
              After bantime (e.g., 1 hour)
                     │
                     ↓
         ┌───────────────────────┐
         │   Unban IP           │
         │   (remove rule)       │
         └───────────────────────┘
```

### Key Concepts

**Jail**: Configuration for monitoring a specific service (SSH, Nginx, etc.)

**Filter**: Regex patterns that match malicious log entries

**Action**: What to do when threshold is met (ban IP, send email)

**Ban**: Temporarily block IP address via firewall

**Thresholds**:
- `maxretry`: Number of failures before ban (default: 5)
- `findtime`: Time window to count failures (default: 10m)
- `bantime`: How long to ban (default: 10m)

---

## Installation

### Debian/Ubuntu

```bash
# Update package lists
sudo apt update

# Install fail2ban
sudo apt install fail2ban

# Install optional dependencies
sudo apt install whois  # for reverse DNS lookups
sudo apt install python3-systemd  # for systemd journal integration

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Verify installation
sudo systemctl status fail2ban
fail2ban-client version
```

### RHEL/CentOS/Rocky

```bash
# Enable EPEL repository
sudo yum install epel-release

# Install fail2ban
sudo yum install fail2ban fail2ban-systemd

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Verify
sudo systemctl status fail2ban
```

### Configuration File Structure

```bash
# System defaults (DO NOT EDIT)
/etc/fail2ban/fail2ban.conf
/etc/fail2ban/jail.conf

# Your customizations (ALWAYS EDIT THESE)
/etc/fail2ban/fail2ban.local  # daemon settings
/etc/fail2ban/jail.local      # jail configurations

# Filters (regex patterns)
/etc/fail2ban/filter.d/

# Actions (ban commands)
/etc/fail2ban/action.d/

# Custom jails
/etc/fail2ban/jail.d/*.conf
```

---

## Basic Configuration

### Create jail.local

```bash
# Copy default config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Or create from scratch
sudo nano /etc/fail2ban/jail.local
```

### Essential Global Settings

```ini
# /etc/fail2ban/jail.local

[DEFAULT]
# Ban IP for 1 hour
bantime  = 3600

# 10-minute time window for counting failures
findtime  = 600

# Ban after 5 failed attempts
maxretry = 5

# Backend for log file monitoring
backend = auto

# Email settings (optional)
destemail = admin@example.com
sendername = Fail2ban
sender = fail2ban@example.com
mta = sendmail

# Ban action (iptables is default)
banaction = iptables-multiport
banaction_allports = iptables-allports

# Protocol (tcp, udp, or all)
protocol = tcp

# Chain for iptables rules
chain = INPUT

# Whitelist your own IPs (IMPORTANT!)
ignoreip = 127.0.0.1/8 ::1 10.0.0.0/8 192.168.0.0/16
```

### nftables Configuration

```ini
# /etc/fail2ban/jail.local - For nftables

[DEFAULT]
bantime  = 3600
findtime  = 600
maxretry = 5

# Use nftables actions
banaction = nftables-multiport
banaction_allports = nftables-allports

# nftables table and chain
nftables_family = inet
nftables_table = filter
chain = input

ignoreip = 127.0.0.1/8 ::1 10.0.0.0/8
```

---

## SSH Protection

### Enable SSH Jail

```ini
# /etc/fail2ban/jail.local

[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log  # Debian/Ubuntu
# logpath = /var/log/secure   # RHEL/CentOS
maxretry = 3
bantime  = 1h
findtime = 10m
```

### SSH with systemd Journal

```ini
# /etc/fail2ban/jail.local - Modern systems using journald

[sshd]
enabled = true
port    = ssh
filter  = sshd
backend = systemd
maxretry = 3
bantime  = 1h
```

### Aggressive SSH Protection

```ini
# /etc/fail2ban/jail.local - Stricter SSH security

[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 2              # Ban after 2 attempts
bantime  = 86400          # Ban for 24 hours
findtime = 600            # 10-minute window

[sshd-ddos]
enabled  = true
port     = ssh
filter   = sshd-ddos
logpath  = /var/log/auth.log
maxretry = 10
bantime  = 600
findtime = 60             # Ban rapid connection attempts
```

### Test SSH Jail

```bash
# Restart fail2ban
sudo systemctl restart fail2ban

# Check jail status
sudo fail2ban-client status sshd

# Trigger ban (from another machine)
# Try wrong password 3 times
ssh wronguser@server.example.com

# Verify ban
sudo fail2ban-client status sshd
# Should show banned IP

# View iptables rule
sudo iptables -L f2b-sshd -n -v

# Manually unban if needed
sudo fail2ban-client unban 203.0.113.42
```

---

## Web Server Protection

### Nginx Jails

```ini
# /etc/fail2ban/jail.local

[nginx-http-auth]
enabled  = true
port     = http,https
filter   = nginx-http-auth
logpath  = /var/log/nginx/error.log
maxretry = 3
bantime  = 1h

[nginx-noscript]
enabled  = true
port     = http,https
filter   = nginx-noscript
logpath  = /var/log/nginx/access.log
maxretry = 6
bantime  = 1h

[nginx-badbots]
enabled  = true
port     = http,https
filter   = nginx-badbots
logpath  = /var/log/nginx/access.log
maxretry = 2
bantime  = 24h

[nginx-noproxy]
enabled  = true
port     = http,https
filter   = nginx-noproxy
logpath  = /var/log/nginx/access.log
maxretry = 2
bantime  = 24h

[nginx-limit-req]
enabled  = true
port     = http,https
filter   = nginx-limit-req
logpath  = /var/log/nginx/error.log
maxretry = 10
findtime = 60
bantime  = 3600
```

### Apache Jails

```ini
# /etc/fail2ban/jail.local

[apache-auth]
enabled  = true
port     = http,https
filter   = apache-auth
logpath  = /var/log/apache2/error.log  # Debian
# logpath = /var/log/httpd/error_log   # RHEL
maxretry = 3
bantime  = 1h

[apache-badbots]
enabled  = true
port     = http,https
filter   = apache-badbots
logpath  = /var/log/apache2/access.log
maxretry = 2
bantime  = 24h

[apache-noscript]
enabled  = true
port     = http,https
filter   = apache-noscript
logpath  = /var/log/apache2/access.log
maxretry = 6

[apache-overflows]
enabled  = true
port     = http,https
filter   = apache-overflows
logpath  = /var/log/apache2/error.log
maxretry = 2
bantime  = 24h

[apache-nohome]
enabled  = true
port     = http,https
filter   = apache-nohome
logpath  = /var/log/apache2/error.log
maxretry = 2

[apache-botsearch]
enabled  = true
port     = http,https
filter   = apache-botsearch
logpath  = /var/log/apache2/access.log
maxretry = 2
```

### WordPress Protection

```ini
# /etc/fail2ban/jail.local

[wordpress-hard]
enabled  = true
port     = http,https
filter   = wordpress-hard
logpath  = /var/log/nginx/access.log
# logpath = /var/log/apache2/access.log
maxretry = 3
findtime = 300
bantime  = 1h

[wordpress-soft]
enabled  = true
port     = http,https
filter   = wordpress-soft
logpath  = /var/log/nginx/access.log
maxretry = 5
findtime = 300
bantime  = 1h
```

Create WordPress filter:

```bash
# /etc/fail2ban/filter.d/wordpress-hard.conf

[Definition]
failregex = ^<HOST> .* "POST /wp-login.php
            ^<HOST> .* "POST /xmlrpc.php
            ^<HOST> .* "GET /wp-admin
ignoreregex =

# /etc/fail2ban/filter.d/wordpress-soft.conf

[Definition]
failregex = ^<HOST> .* "GET /wp-login.php
            ^<HOST> .* "POST /wp-comments-post.php
ignoreregex =
```

---

## Custom Filters

### Filter Anatomy

```ini
# /etc/fail2ban/filter.d/myapp.conf

[INCLUDES]
# Include common prefixes (optional)
before = common.conf

[Definition]
# Regex pattern to match failures
failregex = ^%(__prefix_line)s.* authentication failure.* from <HOST>$
            ^%(__prefix_line)s.* failed login from <HOST>$
            ^<HOST> .* "POST /api/login.*" 401

# Patterns to ignore (false positives)
ignoreregex =

# Additional named regexes
datepattern = {^LN-BEG}%%Y-%%m-%%d %%H:%%M:%%S

[Init]
# Default values
maxlines = 1
```

### SSH Brute-Force Filter Example

```ini
# /etc/fail2ban/filter.d/sshd.conf (simplified)

[Definition]

failregex = ^%(__prefix_line)sFailed (?:password|publickey) for .* from <HOST>(?: port \d+)?(?: ssh\d*)?$
            ^%(__prefix_line)sConnection (?:closed|reset) by (?:authenticating )?user .* <HOST> port \d+(?: \[preauth\])?$
            ^%(__prefix_line)sReceived disconnect from <HOST>: 11: .* \[preauth\]$
            ^%(__prefix_line)sInvalid user .* from <HOST>$
            ^%(__prefix_line)sUser .+ from <HOST> not allowed because .+$

ignoreregex =
```

### Create Custom Filter for API

```ini
# /etc/fail2ban/filter.d/myapi-auth.conf

[Definition]

# Match failed API authentication
failregex = ^\[<HOST>\] API authentication failed for user: .*$
            ^<HOST> .* "POST /api/v1/auth" 401
            ^ERROR: Authentication failed from IP <HOST>

ignoreregex =

# Test with:
# fail2ban-regex /path/to/log /etc/fail2ban/filter.d/myapi-auth.conf
```

### Nginx Rate Limit Filter

```ini
# /etc/fail2ban/filter.d/nginx-rate-limit.conf

[Definition]

# Match Nginx rate limiting messages
failregex = limiting requests, excess:.* by zone.*client: <HOST>

ignoreregex =

# Nginx config must have:
# limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
# limit_req_log_level warn;
```

### Test Filters

```bash
# Test filter against log file
fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf

# Test with verbose output
fail2ban-regex -v /var/log/nginx/access.log /etc/fail2ban/filter.d/nginx-badbots.conf

# Test specific log line
echo 'Failed password for root from 203.0.113.42 port 22 ssh2' | \
  fail2ban-regex --print-all-matched - /etc/fail2ban/filter.d/sshd.conf
```

---

## Custom Actions

### Action Anatomy

```ini
# /etc/fail2ban/action.d/myaction.conf

[INCLUDES]
before = iptables-common.conf

[Definition]

# Command to ban IP
actionstart = 

# Command to unban IP
actionstop = 

# Command to check if IP is banned
actioncheck = 

# Ban action
actionban = 

# Unban action
actionunban = 

[Init]
# Default parameters
name = default
```

### Email Notification Action

```ini
# /etc/fail2ban/jail.local - Enable email alerts

[sshd]
enabled  = true
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 1h

# Email on ban
action = %(action_mwl)s

# action_mw = ban + email with whois
# action_mwl = ban + email with whois + log lines
```

### Slack Notification Action

```bash
# /etc/fail2ban/action.d/slack.conf

[Definition]

actionstart = 
actionstop = 
actioncheck = 
actionban = curl -X POST -H 'Content-type: application/json' \
              --data '{"text":"[Fail2ban] <name> jail: banned <ip> from `<fq-hostname>`"}' \
              <slack_webhook_url>
actionunban = 

[Init]
name = default
slack_webhook_url = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Use in jail:

```ini
# /etc/fail2ban/jail.local

[sshd]
enabled = true
filter  = sshd
logpath = /var/log/auth.log
maxretry = 3
action = iptables-multiport[name=sshd, port=ssh]
         slack[name=sshd]
```

### CloudFlare Ban Action

```bash
# /etc/fail2ban/action.d/cloudflare.conf

[Definition]

actionstart =
actionstop =
actioncheck =
actionban = curl -s -X POST "https://api.cloudflare.com/client/v4/user/firewall/access_rules/rules" \
              -H "X-Auth-Email: <cfuser>" \
              -H "X-Auth-Key: <cftoken>" \
              -H "Content-Type: application/json" \
              --data '{"mode":"block","configuration":{"target":"ip","value":"<ip>"},"notes":"Fail2ban <name>"}'
actionunban = curl -s -X DELETE "https://api.cloudflare.com/client/v4/user/firewall/access_rules/rules/$( \
                curl -s -X GET "https://api.cloudflare.com/client/v4/user/firewall/access_rules/rules?mode=block&configuration_target=ip&configuration_value=<ip>&page=1&per_page=1" \
                -H "X-Auth-Email: <cfuser>" \
                -H "X-Auth-Key: <cftoken>" \
                | jq -r '.result[0].id')" \
              -H "X-Auth-Email: <cfuser>" \
              -H "X-Auth-Key: <cftoken>"

[Init]
cfuser = admin@example.com
cftoken = your_cloudflare_api_token
```

Use with jail:

```ini
# /etc/fail2ban/jail.local

[nginx-badbots]
enabled = true
filter  = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
bantime  = 86400
action = iptables-multiport[name=nginx-badbots, port="http,https"]
         cloudflare[cfuser=admin@example.com, cftoken=YOUR_TOKEN]
```

### Discord Notification

```bash
# /etc/fail2ban/action.d/discord.conf

[Definition]

actionban = curl -X POST "<discord_webhook_url>" \
              -H "Content-Type: application/json" \
              -d '{"embeds": [{"title": "🚨 Fail2ban Alert", "description": "IP **<ip>** banned in jail **<name>**", "color": 16711680, "fields": [{"name": "Hostname", "value": "`<fq-hostname>`"}, {"name": "Failures", "value": "<failures>"}, {"name": "Time", "value": "<time>"}]}]}'

actionunban = curl -X POST "<discord_webhook_url>" \
                -H "Content-Type: application/json" \
                -d '{"embeds": [{"title": "✅ Fail2ban Unban", "description": "IP **<ip>** unbanned from jail **<name>**", "color": 65280}]}'

[Init]
discord_webhook_url = https://discord.com/api/webhooks/YOUR/WEBHOOK
```

---

## Mail Server Protection

### Postfix Jails

```ini
# /etc/fail2ban/jail.local

[postfix-sasl]
enabled  = true
port     = smtp,ssmtp,submission
filter   = postfix-sasl
logpath  = /var/log/mail.log
maxretry = 3
bantime  = 1h

[postfix-rbl]
enabled  = true
port     = smtp,ssmtp
filter   = postfix-rbl
logpath  = /var/log/mail.log
maxretry = 1
bantime  = 24h

[postfix]
enabled  = true
port     = smtp,ssmtp,submission
filter   = postfix
logpath  = /var/log/mail.log
maxretry = 5
```

### Dovecot Jails

```ini
# /etc/fail2ban/jail.local

[dovecot]
enabled  = true
port     = pop3,pop3s,imap,imaps
filter   = dovecot
logpath  = /var/log/mail.log
maxretry = 3
bantime  = 1h

[dovecot-auth]
enabled  = true
port     = pop3,pop3s,imap,imaps,submission
filter   = dovecot
logpath  = /var/log/dovecot.log
maxretry = 3
```

---

## Database Protection

### PostgreSQL Jail

```ini
# /etc/fail2ban/jail.local

[postgresql]
enabled  = true
port     = 5432
filter   = postgresql
logpath  = /var/log/postgresql/postgresql-*-main.log
maxretry = 5
bantime  = 1h
```

Create filter:

```bash
# /etc/fail2ban/filter.d/postgresql.conf

[Definition]
failregex = ^.*FATAL:  password authentication failed for user .* from <HOST>.*$
            ^.*FATAL:  no pg_hba.conf entry for host "<HOST>".*$
            ^.*connection authorized: user=.* database=.* host=<HOST> port=\d+ SSL=off$
ignoreregex =
```

### MySQL/MariaDB Jail

```ini
# /etc/fail2ban/jail.local

[mysqld-auth]
enabled  = true
port     = 3306
filter   = mysqld-auth
logpath  = /var/log/mysql/error.log
maxretry = 5
bantime  = 1h
```

Create filter:

```bash
# /etc/fail2ban/filter.d/mysqld-auth.conf

[Definition]
failregex = ^.*\[Warning\] Access denied for user .+@'<HOST>'.*$
            ^.*\[ERROR\] Access denied for user .+@'<HOST>'.*$
ignoreregex =
```

---

## Monitoring and Management

### Fail2ban Client Commands

```bash
# Check fail2ban status
sudo fail2ban-client status

# Check specific jail status
sudo fail2ban-client status sshd

# Banned IPs in all jails
sudo fail2ban-client banned

# Manually ban IP
sudo fail2ban-client set sshd banip 203.0.113.42

# Manually unban IP
sudo fail2ban-client unban 203.0.113.42

# Unban from specific jail
sudo fail2ban-client set sshd unbanip 203.0.113.42

# Reload configuration
sudo fail2ban-client reload

# Reload specific jail
sudo fail2ban-client reload sshd

# Start/stop jail
sudo fail2ban-client start sshd
sudo fail2ban-client stop sshd

# Get config value
sudo fail2ban-client get sshd bantime

# Set config value
sudo fail2ban-client set sshd bantime 7200
```

### View Logs

```bash
# Fail2ban log
sudo tail -f /var/log/fail2ban.log

# Filter for specific jail
sudo grep "sshd" /var/log/fail2ban.log

# Show all bans
sudo grep "Ban" /var/log/fail2ban.log

# Show all unbans
sudo grep "Unban" /var/log/fail2ban.log

# Count bans by jail
sudo grep "Ban" /var/log/fail2ban.log | awk '{print $8}' | sort | uniq -c | sort -nr

# Recent bans
sudo tail -100 /var/log/fail2ban.log | grep "Ban"
```

### Statistics Script

```bash
#!/bin/bash
# fail2ban-stats.sh - Generate fail2ban statistics

echo "=== Fail2ban Statistics ==="
echo

echo "Currently banned IPs:"
sudo fail2ban-client banned | wc -w
echo

echo "Banned IPs by jail:"
for jail in $(sudo fail2ban-client status | grep "Jail list" | sed 's/.*://; s/,//g'); do
    count=$(sudo fail2ban-client status $jail | grep "Currently banned" | awk '{print $NF}')
    echo "$jail: $count"
done
echo

echo "Top 10 banned IPs (all time):"
sudo grep "Ban" /var/log/fail2ban.log | grep -oP '\d+\.\d+\.\d+\.\d+' | sort | uniq -c | sort -nr | head -10
echo

echo "Bans by jail (all time):"
sudo grep "Ban" /var/log/fail2ban.log | awk '{print $8}' | sort | uniq -c | sort -nr
echo

echo "Bans in last 24 hours:"
sudo grep "Ban" /var/log/fail2ban.log | grep "$(date '+%Y-%m-%d')" | wc -l
```

### Monitoring Dashboard

```bash
#!/bin/bash
# fail2ban-monitor.sh - Real-time monitoring

watch -n 5 '
echo "=== Fail2ban Live Monitor ==="
echo
echo "Active Jails:"
sudo fail2ban-client status | grep "Jail list"
echo
echo "Currently Banned IPs:"
sudo fail2ban-client banned | wc -w
echo
echo "Recent Bans (last 10):"
sudo tail -20 /var/log/fail2ban.log | grep "Ban" | tail -10
echo
echo "Jail Status:"
for jail in $(sudo fail2ban-client status | grep "Jail list" | sed "s/.*://; s/,//g"); do
    banned=$(sudo fail2ban-client status $jail | grep "Currently banned" | awk "{print \$NF}")
    total=$(sudo fail2ban-client status $jail | grep "Total banned" | awk "{print \$NF}")
    echo "$jail: $banned currently banned, $total total"
done
'
```

---

## Advanced Configurations

### Persistent Bans (Recidive)

Ban repeat offenders permanently or for extended periods:

```ini
# /etc/fail2ban/jail.local

[recidive]
enabled  = true
filter   = recidive
logpath  = /var/log/fail2ban.log
bantime  = 604800   # 1 week
findtime = 86400    # 1 day
maxretry = 3        # Banned 3 times in 24h = 1 week ban
```

### Geographic Blocking

Block entire countries (requires GeoIP):

```bash
# Install GeoIP
sudo apt install geoip-bin geoip-database

# /etc/fail2ban/action.d/geoip-block.conf
[Definition]
actionban = country=$(geoiplookup <ip> | awk -F ": " '{print $2}')
            if [ "$country" = "CN" ] || [ "$country" = "RU" ]; then
                iptables -I INPUT -s <ip> -j DROP
            fi
actionunban = iptables -D INPUT -s <ip> -j DROP

[Init]
```

### CloudFlare + Firewall Combined

```ini
# /etc/fail2ban/jail.local

[nginx-badbots]
enabled  = true
filter   = nginx-badbots
logpath  = /var/log/nginx/access.log
maxretry = 2
bantime  = 86400
action   = iptables-multiport[name=nginx-badbots, port="http,https"]
           cloudflare[cfuser=%(cfemail)s, cftoken=%(cftoken)s]
           sendmail-whois[name=nginx-badbots, dest=%(destemail)s]

# CloudFlare credentials
cfemail = admin@example.com
cftoken = your_cf_api_token
```

### Whitelist Trusted Networks

```ini
# /etc/fail2ban/jail.local

[DEFAULT]
# Whitelist (never ban these IPs)
ignoreip = 127.0.0.1/8 
           ::1
           10.0.0.0/8           # Private network
           172.16.0.0/12        # Private network
           192.168.0.0/16       # Private network
           203.0.113.0/24       # Your office IP range
           198.51.100.50        # Your home IP

# Can also whitelist per jail
[sshd]
enabled = true
ignoreip = 127.0.0.1/8 10.0.0.0/8 203.0.113.100
```

### Dynamic Thresholds

Different thresholds for different services:

```ini
# /etc/fail2ban/jail.local

# Strict for SSH
[sshd]
enabled  = true
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 2
bantime  = 86400  # 24 hours
findtime = 600

# More lenient for web
[nginx-http-auth]
enabled  = true
filter   = nginx-http-auth
logpath  = /var/log/nginx/error.log
maxretry = 5
bantime  = 3600   # 1 hour
findtime = 600

# Very strict for API
[myapi-auth]
enabled  = true
filter   = myapi-auth
logpath  = /var/log/myapp/api.log
maxretry = 3
bantime  = 604800  # 1 week
findtime = 300
```

---

## Troubleshooting

### Jail Not Starting

```bash
# Check configuration syntax
sudo fail2ban-client -t

# Check jail configuration
sudo fail2ban-client -d | grep "myja il"

# View detailed error
sudo systemctl status fail2ban -l

# Check fail2ban log
sudo tail -50 /var/log/fail2ban.log

# Test filter manually
fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf
```

### IP Not Getting Banned

```bash
# Check jail is enabled
sudo fail2ban-client status

# Check if filter is matching
fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf -v

# Check if IP is in ignore list
grep "ignoreip" /etc/fail2ban/jail.local

# Verify log path is correct
sudo tail /var/log/auth.log

# Check threshold settings
sudo fail2ban-client get sshd maxretry
sudo fail2ban-client get sshd findtime

# Manual test ban
sudo fail2ban-client set sshd banip 203.0.113.42
sudo iptables -L f2b-sshd -n -v
```

### Firewall Rules Not Working

```bash
# Check iptables rules created
sudo iptables -L -n -v | grep f2b

# Check nftables rules
sudo nft list ruleset | grep f2b

# Verify action is correct
sudo fail2ban-client get sshd action

# Test action manually
sudo fail2ban-client get sshd actionban

# Check if banned IP can still connect
# From banned IP
nc -zv server.example.com 22

# Should see DROP in iptables counter
sudo iptables -L f2b-sshd -n -v
```

### Performance Issues

```bash
# Check if fail2ban is using too much CPU
top -p $(pgrep -f fail2ban-server)

# Reduce log parsing frequency
# /etc/fail2ban/jail.local
[DEFAULT]
findtime = 600    # Increase from 300
maxretry = 5      # Increase from 3

# Use journald backend (faster)
backend = systemd

# Limit number of jails (disable unused)
[jail-name]
enabled = false

# Check for excessive logging
sudo du -h /var/log/fail2ban.log

# Rotate logs if too large
sudo logrotate -f /etc/logrotate.d/fail2ban
```

---

## Security Best Practices

### Fail2ban Hardening Checklist

```
☑ Set reasonable thresholds (not too sensitive)
☑ Whitelist your own IPs (prevent self-lockout)
☑ Enable email/chat notifications
☑ Use persistent bans for repeat offenders (recidive)
☑ Regularly review banned IPs
☑ Monitor fail2ban logs
☑ Test filters before deploying
☑ Backup configurations
☑ Use multiple ban actions (local + CloudFlare)
☑ Document custom filters and jails
☑ Keep fail2ban updated
☑ Integrate with monitoring (Prometheus, Grafana)
☑ Have emergency access method (console/KVM)
☑ Review and tune thresholds quarterly
☑ Use systemd backend when available
```

### Emergency Access

Always have a backup access method:

```bash
# Console access (physical or VPS web console)
# Cloud provider web terminal
# Jump host from different network
# Recovery mode boot

# Temporarily disable fail2ban if locked out
# Via console:
sudo systemctl stop fail2ban
sudo iptables -F f2b-sshd

# Whitelist your IP
sudo fail2ban-client set sshd unbanip YOUR_IP
```

---

## Integration with Monitoring

### Prometheus Exporter

```bash
# Install fail2ban-prometheus-exporter
# https://github.com/jangrewe/prometheus-fail2ban-exporter

sudo pip3 install prometheus-fail2ban-exporter

# Run exporter
fail2ban-exporter --port 9191

# Prometheus config
# prometheus.yml
scrape_configs:
  - job_name: 'fail2ban'
    static_configs:
      - targets: ['localhost:9191']
```

### Grafana Dashboard

Import dashboard for fail2ban metrics:
- Banned IPs over time
- Bans by jail
- Top attacking IPs
- Ban/unban events

---

## What's Next?

After mastering fail2ban, continue your security journey:

**Network Security:**
- [Intrusion Detection](intrusion-detection) - Snort/Suricata IDS
- [WireGuard VPN](wireguard-vpn) - Secure remote access
- [Network Segmentation](network-segmentation) - VLANs and isolation

**Advanced Security:**
- [Web Application Firewall](waf-modsecurity) - ModSecurity/OWASP rules
- [DDoS Protection](ddos-mitigation) - Advanced traffic filtering
- [Security Monitoring](security-monitoring) - SIEM and log analysis

**System Hardening:**
- [User Account Security](user-account-security) - Least privilege
- [SELinux/AppArmor](mandatory-access-control) - MAC systems

---

## Additional Resources

### Official Documentation
- [Fail2ban Official Wiki](https://github.com/fail2ban/fail2ban/wiki)
- [Fail2ban Manual](https://fail2ban.readthedocs.io/)

### Tutorials & Guides
- [DigitalOcean Fail2ban Guide](https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-20-04)
- [Linode Fail2ban Tutorial](https://www.linode.com/docs/guides/using-fail2ban-to-secure-your-server/)

### Filter Collections
- [Fail2ban Filter Collection](https://github.com/fail2ban/fail2ban/tree/master/config/filter.d)
- [Custom Fail2ban Filters](https://github.com/mitchellkrogza/fail2ban)

### Tools
- [fail2ban-report](https://github.com/fabiogermann/fail2ban-report) - Analytics tool
- [fail2ban-dashboard](https://github.com/sean-/fail2ban-dashboard) - Web UI

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive fail2ban guide covering installation, SSH/web server/database/mail server protection, custom filters and actions, CloudFlare integration, monitoring, statistics, troubleshooting, production architectures, geographic blocking, persistent bans (recidive), email/Slack/Discord notifications, and complete security best practices. Includes real-world examples for Nginx, Apache, WordPress, PostgreSQL, MySQL, and integration with iptables/nftables firewalls.

