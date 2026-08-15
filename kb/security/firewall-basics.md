# Firewall Basics - iptables and nftables

**Resource Navigation:** [README](README) | [SSH Security Hardening](ssh-security-hardening) | [Fail2ban Setup](fail2ban-setup) | [Network Segmentation](network-segmentation)

---

## Summary

Firewalls are the first line of defense in network security, controlling what traffic can enter and leave your systems. This comprehensive guide covers both iptables (traditional Linux firewall) and nftables (modern replacement) from fundamentals through production-grade configurations. Learn packet filtering, stateful firewalls, NAT, port forwarding, logging, and complete firewall architectures for web servers, databases, Kubernetes clusters, and multi-tier applications. Every pattern is battle-tested in production environments and includes troubleshooting, performance optimization, and migration strategies from iptables to nftables.

**The Golden Rule:** Default deny everything, explicitly allow only what's needed.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Understand firewall fundamentals and packet filtering concepts
- ✅ Configure iptables rules for common services (SSH, HTTP, DNS)
- ✅ Implement stateful firewalls with connection tracking
- ✅ Master nftables syntax and modern firewall patterns
- ✅ Set up NAT and port forwarding
- ✅ Configure logging and monitoring for security events
- ✅ Build production firewall architectures for web apps
- ✅ Implement defense-in-depth with multiple firewall layers
- ✅ Troubleshoot firewall issues and test configurations
- ✅ Migrate from iptables to nftables

---

## Prerequisites

Before diving into firewall configuration, you should have:

- **Linux fundamentals**: Understanding of networking basics (TCP/IP, ports, protocols)
- **Command line proficiency**: Comfortable with terminal and text editors
- **Basic networking**: Know the difference between TCP and UDP, understand IP addresses and subnets
- **SSH access**: [SSH Basics](../basics/ssh-basics) and [SSH Security](ssh-security-hardening) completed
- **Root access**: Ability to run commands with sudo

---

## Firewall Fundamentals

### What is a Firewall?

A firewall inspects network packets and decides whether to:
- **ACCEPT**: Allow the packet through
- **DROP**: Silently discard the packet
- **REJECT**: Discard and send error response

### Packet Flow Through Linux Firewall

```
┌─────────────────────────────────────────────────────────┐
│                    Incoming Packet                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │   PREROUTING Chain     │  ← NAT, port forwarding
        │   (mangle, nat)        │
        └────────────┬───────────┘
                     │
                     ↓
          ┌──────────────────┐
          │  Routing Decision │  ← For this host or forward?
          └──────────┬────┬──┘
                     │    │
         For this host    Forward to another host
                     │    │
                     ↓    ↓
        ┌─────────────┐  ┌─────────────┐
        │   INPUT     │  │   FORWARD   │
        │   Chain     │  │   Chain     │
        └──────┬──────┘  └──────┬──────┘
               │                │
               ↓                ↓
        ┌──────────────┐  ┌──────────────┐
        │ Local Process│  │   Routing    │
        └──────┬───────┘  └──────┬───────┘
               │                │
               ↓                ↓
        ┌─────────────┐  ┌──────────────┐
        │   OUTPUT    │  │ POSTROUTING  │  ← NAT (SNAT/MASQUERADE)
        │   Chain     │  │  Chain       │
        └──────┬──────┘  └──────┬───────┘
               │                │
               └────────┬───────┘
                        │
                        ↓
           ┌────────────────────────┐
           │   Outgoing Packet      │
           └────────────────────────┘
```

### Tables and Chains

**Tables** (priority order):
1. **raw**: Connection tracking exceptions
2. **mangle**: Packet alteration (QoS, TTL)
3. **nat**: Network Address Translation
4. **filter**: Packet filtering (default)
5. **security**: SELinux rules

**Chains** in filter table:
- **INPUT**: Packets destined for local processes
- **OUTPUT**: Packets originating from local processes  
- **FORWARD**: Packets routed through the system

### Default Policy

```bash
# Set default policies (drop everything by default)
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT  # Usually allow outgoing

# nftables equivalent
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
nft add chain inet filter forward { type filter hook forward priority 0 \; policy drop \; }
nft add chain inet filter output { type filter hook output priority 0 \; policy accept \; }
```

---

## iptables Basics

### Installation and Setup

```bash
# Install iptables (usually pre-installed)
# Debian/Ubuntu
sudo apt install iptables iptables-persistent

# RHEL/CentOS
sudo yum install iptables-services

# Enable and start
sudo systemctl enable iptables
sudo systemctl start iptables
```

### Basic iptables Commands

```bash
# List all rules
sudo iptables -L -n -v

# List rules with line numbers
sudo iptables -L INPUT --line-numbers

# List rules in specific table
sudo iptables -t nat -L -n -v

# Flush all rules (careful!)
sudo iptables -F

# Flush specific chain
sudo iptables -F INPUT

# Delete specific rule by number
sudo iptables -D INPUT 3

# Insert rule at specific position
sudo iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT
```

### Rule Syntax

```bash
# Basic rule structure
iptables -A CHAIN -p PROTOCOL --dport PORT -s SOURCE -d DESTINATION -j TARGET

# Examples:
# Allow SSH from anywhere
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP from specific subnet
iptables -A INPUT -p tcp --dport 80 -s 192.168.1.0/24 -j ACCEPT

# Drop packets from specific IP
iptables -A INPUT -s 203.0.113.42 -j DROP

# Allow ICMP (ping)
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT
```

### Essential Rules for Every Server

```bash
#!/bin/bash
# basic-firewall.sh - Essential iptables rules

# Flush existing rules
iptables -F
iptables -X

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback (essential for local services)
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related connections (stateful firewall)
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (change port if non-standard)
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -j ACCEPT

# Allow ICMP ping (optional, security vs. convenience)
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Log dropped packets (before final drop)
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables-dropped: " --log-level 7

# Default drop (implicit by policy, but can be explicit)
# iptables -A INPUT -j DROP
```

### Web Server Rules

```bash
# Allow HTTP and HTTPS
iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW -j ACCEPT

# Complete web server firewall
#!/bin/bash
# web-server-firewall.sh

# Flush
iptables -F
iptables -X

# Defaults
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Loopback
iptables -A INPUT -i lo -j ACCEPT

# Established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# SSH (restricted to management network)
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -m conntrack --ctstate NEW -j ACCEPT

# HTTP/HTTPS (public)
iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW -j ACCEPT

# ICMP
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Logging
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "web-fw-drop: "

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### Database Server Rules

```bash
# PostgreSQL (only from app servers)
iptables -A INPUT -p tcp --dport 5432 -s 10.0.1.0/24 -m conntrack --ctstate NEW -j ACCEPT

# MySQL/MariaDB (only from app servers)
iptables -A INPUT -p tcp --dport 3306 -s 10.0.1.0/24 -m conntrack --ctstate NEW -j ACCEPT

# Redis (only from localhost and app servers)
iptables -A INPUT -p tcp --dport 6379 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 6379 -s 10.0.1.0/24 -m conntrack --ctstate NEW -j ACCEPT

# Complete database server firewall
#!/bin/bash
# database-firewall.sh

iptables -F
iptables -X
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Loopback
iptables -A INPUT -i lo -j ACCEPT

# Established
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# SSH (management network only)
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/16 -m conntrack --ctstate NEW -j ACCEPT

# PostgreSQL (app servers only)
iptables -A INPUT -p tcp --dport 5432 -s 10.0.1.0/24 -m conntrack --ctstate NEW -j ACCEPT

# Monitoring (Prometheus/Node Exporter from monitoring server)
iptables -A INPUT -p tcp --dport 9100 -s 10.0.2.50 -m conntrack --ctstate NEW -j ACCEPT

# Logging
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "db-fw-drop: "

# Save
iptables-save > /etc/iptables/rules.v4
```

### Rate Limiting

Protect against brute-force and DoS attacks:

```bash
# Limit SSH connections (max 3 new connections per minute from same IP)
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 4 -j DROP
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -j ACCEPT

# Limit HTTP requests (protect against HTTP flood)
iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW -m limit --limit 100/second --limit-burst 200 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW -j DROP

# Limit ICMP ping (prevent ping flood)
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/second -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP

# SYN flood protection
iptables -N syn_flood
iptables -A INPUT -p tcp --syn -j syn_flood
iptables -A syn_flood -m limit --limit 1/s --limit-burst 3 -j RETURN
iptables -A syn_flood -j DROP
```

### Port Knocking with iptables

```bash
# Port knocking sequence: 7000, 8000, 9000 to open SSH

# Create chains for knocking states
iptables -N KNOCKING
iptables -N GATE1
iptables -N GATE2
iptables -N GATE3

# First knock (7000)
iptables -A GATE1 -p tcp --dport 7000 -m recent --name AUTH1 --set -j DROP

# Second knock (8000) within 10 seconds
iptables -A GATE2 -m recent --name AUTH1 --rcheck --seconds 10 -j GATE2_CHECK
iptables -A GATE2 -j DROP
iptables -A GATE2_CHECK -p tcp --dport 8000 -m recent --name AUTH2 --set -j DROP
iptables -A GATE2_CHECK -m recent --name AUTH1 --remove

# Third knock (9000) within 10 seconds
iptables -A GATE3 -m recent --name AUTH2 --rcheck --seconds 10 -j GATE3_CHECK
iptables -A GATE3 -j DROP
iptables -A GATE3_CHECK -p tcp --dport 9000 -m recent --name AUTH3 --set -j DROP
iptables -A GATE3_CHECK -m recent --name AUTH2 --remove

# Allow SSH from authenticated IPs (for 30 minutes)
iptables -A INPUT -p tcp --dport 22 -m recent --name AUTH3 --rcheck --seconds 1800 -j ACCEPT

# Direct knocking attempts to chains
iptables -A INPUT -p tcp --dport 7000 -j GATE1
iptables -A INPUT -p tcp --dport 8000 -j GATE2
iptables -A INPUT -p tcp --dport 9000 -j GATE3
```

### Saving and Restoring Rules

```bash
# Save current rules
sudo iptables-save > /etc/iptables/rules.v4
sudo ip6tables-save > /etc/iptables/rules.v6

# Restore rules
sudo iptables-restore < /etc/iptables/rules.v4
sudo ip6tables-restore < /etc/iptables/rules.v6

# Automatic persistence (Ubuntu/Debian with iptables-persistent)
sudo apt install iptables-persistent
# Rules automatically saved to /etc/iptables/rules.v4 and rules.v6

# Manually save with iptables-persistent
sudo netfilter-persistent save

# RHEL/CentOS
sudo service iptables save
sudo systemctl enable iptables
```

---

## nftables - Modern Firewall

### Why nftables?

**Advantages over iptables:**
- Unified syntax for IPv4 and IPv6
- Better performance (fewer kernel modules)
- Cleaner syntax (less verbose)
- Atomic rule updates (all-or-nothing)
- Built-in sets and maps (efficient IP lists)
- Better scriptability

### Installation and Setup

```bash
# Install nftables
# Debian/Ubuntu
sudo apt install nftables

# RHEL/CentOS 8+
sudo yum install nftables

# Enable and start
sudo systemctl enable nftables
sudo systemctl start nftables

# Disable iptables if running
sudo systemctl stop iptables
sudo systemctl disable iptables
```

### Basic nftables Commands

```bash
# List all rules
sudo nft list ruleset

# List specific table
sudo nft list table inet filter

# List specific chain
sudo nft list chain inet filter input

# Flush all rules
sudo nft flush ruleset

# Flush specific table
sudo nft flush table inet filter

# Delete table
sudo nft delete table inet filter

# Add rule
sudo nft add rule inet filter input tcp dport 22 accept

# Insert rule at position
sudo nft insert rule inet filter input position 0 tcp dport 80 accept
```

### nftables Syntax

```bash
# Table structure
nft add table inet filter

# Chains (input, forward, output)
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
nft add chain inet filter forward { type filter hook forward priority 0 \; policy drop \; }
nft add chain inet filter output { type filter hook output priority 0 \; policy accept \; }

# Rules
nft add rule inet filter input tcp dport 22 accept
nft add rule inet filter input tcp dport { 80, 443 } accept
nft add rule inet filter input ip saddr 10.0.0.0/8 tcp dport 5432 accept
```

### Complete nftables Configuration

```bash
# /etc/nftables.conf - Production firewall

#!/usr/sbin/nft -f

# Flush existing rules
flush ruleset

# Main filter table (IPv4 and IPv6)
table inet filter {
    # Drop invalid packets
    chain prerouting {
        type filter hook prerouting priority -300; policy accept;
        ct state invalid drop
    }
    
    # Input chain (incoming traffic)
    chain input {
        type filter hook input priority 0; policy drop;
        
        # Allow loopback
        iif lo accept
        
        # Allow established/related connections
        ct state established,related accept
        
        # Drop invalid
        ct state invalid drop
        
        # ICMP (ping)
        ip protocol icmp icmp type echo-request limit rate 1/second accept
        ip6 nexthdr icmpv6 icmpv6 type echo-request limit rate 1/second accept
        
        # SSH (restricted to management network)
        tcp dport 22 ip saddr 10.0.0.0/8 ct state new accept
        
        # HTTP/HTTPS (public)
        tcp dport { 80, 443 } ct state new accept
        
        # Log dropped packets
        limit rate 5/minute log prefix "nft-input-drop: "
    }
    
    # Forward chain (routed traffic)
    chain forward {
        type filter hook forward priority 0; policy drop;
        
        # Allow established/related
        ct state established,related accept
        
        # Log dropped
        limit rate 5/minute log prefix "nft-forward-drop: "
    }
    
    # Output chain (outgoing traffic)
    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

### Web Server nftables

```bash
#!/usr/sbin/nft -f
# /etc/nftables.conf - Web server

flush ruleset

table inet filter {
    # Rate limiting sets
    set ratelimit_ssh {
        type ipv4_addr
        flags timeout
        timeout 1m
    }
    
    chain input {
        type filter hook input priority 0; policy drop;
        
        # Loopback
        iif lo accept
        
        # Established
        ct state established,related accept
        ct state invalid drop
        
        # SSH with rate limiting
        tcp dport 22 update @ratelimit_ssh { ip saddr limit rate 3/minute } accept
        tcp dport 22 drop
        
        # HTTP/HTTPS
        tcp dport 80 accept
        tcp dport 443 accept
        
        # ICMP
        ip protocol icmp icmp type echo-request limit rate 1/second accept
        
        # Logging
        limit rate 5/minute log prefix "web-drop: "
    }
    
    chain forward {
        type filter hook forward priority 0; policy drop;
    }
    
    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

### Database Server nftables

```bash
#!/usr/sbin/nft -f
# /etc/nftables.conf - Database server

flush ruleset

table inet filter {
    # Define allowed application servers
    set app_servers {
        type ipv4_addr
        elements = { 10.0.1.10, 10.0.1.11, 10.0.1.12 }
    }
    
    # Monitoring servers
    set monitoring_servers {
        type ipv4_addr
        elements = { 10.0.2.50 }
    }
    
    chain input {
        type filter hook input priority 0; policy drop;
        
        iif lo accept
        ct state established,related accept
        ct state invalid drop
        
        # SSH (management network)
        tcp dport 22 ip saddr 10.0.0.0/16 accept
        
        # PostgreSQL (app servers only)
        tcp dport 5432 ip saddr @app_servers accept
        
        # Monitoring (Prometheus)
        tcp dport 9100 ip saddr @monitoring_servers accept
        
        # ICMP
        ip protocol icmp icmp type echo-request limit rate 1/second accept
        
        # Logging
        limit rate 5/minute log prefix "db-drop: "
    }
    
    chain forward {
        type filter hook forward priority 0; policy drop;
    }
    
    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

### nftables Sets and Maps

```bash
# IP sets (efficient for large lists)
nft add set inet filter blacklist { type ipv4_addr \; }
nft add element inet filter blacklist { 203.0.113.42, 198.51.100.50 }
nft add rule inet filter input ip saddr @blacklist drop

# Port sets
nft add set inet filter web_ports { type inet_service \; }
nft add element inet filter web_ports { 80, 443, 8080, 8443 }
nft add rule inet filter input tcp dport @web_ports accept

# Maps (port forwarding)
nft add map inet nat dnat_map { type inet_service : ipv4_addr . inet_service \; }
nft add element inet nat dnat_map { 8080 : 10.0.1.10 . 80 }
nft add rule inet nat prerouting dnat tcp dport map @dnat_map

# Named sets in config file
table inet filter {
    set trusted_ips {
        type ipv4_addr
        flags timeout
        elements = {
            10.0.0.0/8,
            192.168.0.0/16,
            172.16.0.0/12
        }
    }
    
    chain input {
        type filter hook input priority 0; policy drop;
        ip saddr @trusted_ips accept
    }
}
```

### Apply and Reload nftables

```bash
# Test configuration
sudo nft -f /etc/nftables.conf

# Reload nftables service
sudo systemctl reload nftables

# Or restart
sudo systemctl restart nftables

# View loaded rules
sudo nft list ruleset

# Save current ruleset
sudo nft list ruleset > /etc/nftables.conf
```

---

## NAT and Port Forwarding

### Source NAT (SNAT / Masquerade)

Share internet connection with internal network:

```bash
# iptables - SNAT (fixed external IP)
iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j SNAT --to-source 203.0.113.10

# iptables - MASQUERADE (dynamic IP)
iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE

# Enable IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward
# Make permanent
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p

# nftables equivalent
table inet nat {
    chain postrouting {
        type nat hook postrouting priority 100; policy accept;
        oifname "eth0" ip saddr 10.0.0.0/24 masquerade
    }
}
```

### Destination NAT (DNAT / Port Forwarding)

Forward external port to internal server:

```bash
# iptables - Port forward 80 to internal web server
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 10.0.1.10:80
iptables -A FORWARD -p tcp -d 10.0.1.10 --dport 80 -j ACCEPT

# Port forward with external IP
iptables -t nat -A PREROUTING -d 203.0.113.10 -p tcp --dport 8080 -j DNAT --to-destination 10.0.1.10:80

# nftables equivalent
table inet nat {
    chain prerouting {
        type nat hook prerouting priority -100; policy accept;
        tcp dport 80 dnat to 10.0.1.10:80
        tcp dport 8080 dnat to 10.0.1.10:80
    }
}

table inet filter {
    chain forward {
        type filter hook forward priority 0; policy drop;
        ct state established,related accept
        tcp dport 80 ip daddr 10.0.1.10 accept
    }
}
```

### Complete NAT Gateway

```bash
#!/usr/sbin/nft -f
# /etc/nftables.conf - NAT gateway/router

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        
        iif lo accept
        ct state established,related accept
        
        # SSH from internal network
        iif "eth1" tcp dport 22 accept
        
        # ICMP
        ip protocol icmp icmp type echo-request accept
    }
    
    chain forward {
        type filter hook forward priority 0; policy drop;
        
        # Allow internal network to internet
        iif "eth1" oif "eth0" accept
        
        # Allow established back
        ct state established,related accept
    }
    
    chain output {
        type filter hook output priority 0; policy accept;
    }
}

table inet nat {
    chain prerouting {
        type nat hook prerouting priority -100; policy accept;
        
        # Port forwarding (external:8080 -> internal:80)
        iif "eth0" tcp dport 8080 dnat to 10.0.1.10:80
    }
    
    chain postrouting {
        type nat hook postrouting priority 100; policy accept;
        
        # Masquerade outgoing traffic
        oif "eth0" masquerade
    }
}

# Enable IP forwarding
# echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
# sysctl -p
```

---

## Logging and Monitoring

### Firewall Logging

```bash
# iptables - Log before drop
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables-dropped: " --log-level 4

# nftables - Log dropped packets
nft add rule inet filter input limit rate 5/minute log prefix \"nft-drop: \" level warn

# Log only specific traffic
# SSH attempts
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -j LOG --log-prefix "ssh-attempt: "

# Invalid packets
iptables -A INPUT -m conntrack --ctstate INVALID -j LOG --log-prefix "invalid-packet: "
```

### View Firewall Logs

```bash
# View kernel logs (where firewall logs go)
sudo dmesg | grep -i "iptables\|nft"

# View syslog
sudo tail -f /var/log/syslog | grep -i "iptables\|nft"

# journalctl
sudo journalctl -k -f | grep -i "iptables\|nft"

# Filter by log prefix
sudo journalctl -k | grep "nft-drop:"

# Count dropped packets by source
sudo dmesg | grep "nft-drop:" | awk '{print $10}' | sort | uniq -c | sort -nr
```

### Firewall Monitoring Script

```bash
#!/bin/bash
# firewall-monitor.sh - Monitor and alert on firewall events

LOG_FILE="/var/log/firewall-monitor.log"
ALERT_THRESHOLD=10
CHECK_INTERVAL=60

while true; do
    # Count dropped packets in last minute
    DROPS=$(journalctl -k --since "1 minute ago" | grep -c "nft-drop:")
    
    if [ $DROPS -gt $ALERT_THRESHOLD ]; then
        echo "$(date): ALERT - $DROPS packets dropped in last minute" >> $LOG_FILE
        
        # Get top attacking IPs
        TOP_IPS=$(journalctl -k --since "1 minute ago" | grep "nft-drop:" | \
                  grep -oP 'SRC=\K[0-9.]+' | sort | uniq -c | sort -nr | head -5)
        
        echo "Top attacking IPs: $TOP_IPS" >> $LOG_FILE
        
        # Send alert (email, Slack, etc.)
        # mail -s "Firewall Alert" admin@example.com < $LOG_FILE
    fi
    
    sleep $CHECK_INTERVAL
done
```

### Connection Tracking Statistics

```bash
# View connection tracking table
sudo conntrack -L

# Count connections
sudo conntrack -L | wc -l

# View conntrack statistics
sudo cat /proc/net/nf_conntrack

# Connection tracking limits
sudo sysctl net.netfilter.nf_conntrack_max
sudo sysctl net.netfilter.nf_conntrack_count

# Increase if needed (high-traffic servers)
sudo sysctl -w net.netfilter.nf_conntrack_max=262144
echo "net.netfilter.nf_conntrack_max=262144" >> /etc/sysctl.conf
```

---

## Production Firewall Architectures

### Three-Tier Web Application

```
┌─────────────────────────────────────────┐
│         Internet (Untrusted)            │
└───────────────┬─────────────────────────┘
                │
                ↓
    ┌───────────────────────┐
    │   Firewall/Router     │  ← Border firewall
    │   (NAT, DDoS protect) │
    └───────────┬───────────┘
                │
                ↓
┌───────────────────────────────────────────┐
│         DMZ / Web Tier                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Web1    │  │ Web2    │  │ Web3    │  │
│  │ Port 443│  │ Port 443│  │ Port 443│  │
│  └────┬────┘  └────┬────┘  └────┬────┘  │
└───────┼───────────┼────────────┼─────────┘
        │           │            │
        └───────────┴────────────┘
                    │
                    ↓ (Firewall: only from web servers)
┌───────────────────────────────────────────┐
│         Application Tier                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ App1    │  │ App2    │  │ App3    │  │
│  │ Port8080│  │ Port8080│  │ Port8080│  │
│  └────┬────┘  └────┬────┘  └────┬────┘  │
└───────┼───────────┼────────────┼─────────┘
        │           │            │
        └───────────┴────────────┘
                    │
                    ↓ (Firewall: only from app servers)
┌───────────────────────────────────────────┐
│         Database Tier                      │
│      ┌──────────────────┐                 │
│      │  PostgreSQL      │                 │
│      │  Port 5432       │                 │
│      └──────────────────┘                 │
└───────────────────────────────────────────┘
```

**Web tier firewall:**

```bash
#!/usr/sbin/nft -f
# Web server firewall

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        
        iif lo accept
        ct state established,related accept
        
        # SSH from management network
        tcp dport 22 ip saddr 10.0.0.0/24 accept
        
        # HTTPS from internet
        tcp dport 443 accept
        
        # Health checks from load balancer
        tcp dport 80 ip saddr 10.0.100.10 accept
    }
    
    chain output {
        type filter hook output priority 0; policy accept;
        
        # Allow connections to app tier only
        tcp dport 8080 ip daddr 10.0.2.0/24 accept
        
        # Allow DNS, NTP, package updates
        udp dport 53 accept
        udp dport 123 accept
        tcp dport { 80, 443 } accept
    }
}
```

**App tier firewall:**

```bash
#!/usr/sbin/nft -f
# Application server firewall

flush ruleset

table inet filter {
    set web_servers {
        type ipv4_addr
        elements = { 10.0.1.10, 10.0.1.11, 10.0.1.12 }
    }
    
    chain input {
        type filter hook input priority 0; policy drop;
        
        iif lo accept
        ct state established,related accept
        
        # SSH from management
        tcp dport 22 ip saddr 10.0.0.0/24 accept
        
        # Application port from web servers only
        tcp dport 8080 ip saddr @web_servers accept
        
        # Monitoring
        tcp dport 9090 ip saddr 10.0.100.20 accept
    }
    
    chain output {
        type filter hook output priority 0; policy accept;
        
        # Database connections only to DB tier
        tcp dport 5432 ip daddr 10.0.3.10 accept
        
        # Redis
        tcp dport 6379 ip daddr 10.0.3.20 accept
        
        # External APIs (if needed)
        tcp dport 443 accept
    }
}
```

**Database tier firewall:**

```bash
#!/usr/sbin/nft -f
# Database server firewall

flush ruleset

table inet filter {
    set app_servers {
        type ipv4_addr
        elements = { 10.0.2.10, 10.0.2.11, 10.0.2.12 }
    }
    
    chain input {
        type filter hook input priority 0; policy drop;
        
        iif lo accept
        ct state established,related accept
        
        # SSH from management only
        tcp dport 22 ip saddr 10.0.0.0/24 accept
        
        # PostgreSQL from app servers only
        tcp dport 5432 ip saddr @app_servers accept
        
        # No other inbound traffic allowed
    }
    
    chain output {
        type filter hook output priority 0; policy drop;
        
        # Established connections
        ct state established,related accept
        
        # DNS only
        udp dport 53 accept
        
        # Replication to standby (if applicable)
        tcp dport 5432 ip daddr 10.0.3.11 accept
        
        # No outbound internet access
    }
}
```

### Kubernetes Cluster Firewall

```bash
#!/usr/sbin/nft -f
# Kubernetes node firewall

flush ruleset

table inet filter {
    # Define node IPs
    set k8s_nodes {
        type ipv4_addr
        elements = {
            10.0.10.10,  # master
            10.0.10.11,  # worker1
            10.0.10.12   # worker2
        }
    }
    
    chain input {
        type filter hook input priority 0; policy drop;
        
        iif lo accept
        ct state established,related accept
        
        # SSH from management
        tcp dport 22 ip saddr 10.0.0.0/24 accept
        
        # Kubernetes API (control plane)
        tcp dport 6443 ip saddr @k8s_nodes accept
        tcp dport 6443 ip saddr 10.0.0.0/24 accept  # kubectl access
        
        # etcd (control plane only)
        tcp dport 2379-2380 ip saddr @k8s_nodes accept
        
        # Kubelet API
        tcp dport 10250 ip saddr @k8s_nodes accept
        
        # NodePort services (30000-32767)
        tcp dport 30000-32767 accept
        udp dport 30000-32767 accept
        
        # Flannel/Calico VXLAN
        udp dport 8472 ip saddr @k8s_nodes accept
        
        # BGP (Calico)
        tcp dport 179 ip saddr @k8s_nodes accept
        
        # Monitoring (Prometheus)
        tcp dport 9100 ip saddr 10.0.100.20 accept
    }
    
    chain forward {
        type filter hook forward priority 0; policy accept;
        # CNI handles pod networking
    }
    
    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

---

## Troubleshooting

### Test Firewall Rules

```bash
# Test if port is open from another machine
nc -zv server.example.com 22
telnet server.example.com 22

# Test from server itself (check if service is listening)
sudo ss -tlnp | grep :22
sudo netstat -tlnp | grep :22

# Test with nmap (from external machine)
nmap -p 22,80,443 server.example.com

# Trace packet through firewall (iptables)
sudo iptables -t raw -A PREROUTING -p tcp --dport 80 -j TRACE
sudo iptables -t raw -A OUTPUT -p tcp --sport 80 -j TRACE
# View trace in dmesg or /var/log/kern.log

# nftables trace
nft add rule inet filter input tcp dport 80 meta nftrace set 1
sudo nft monitor trace
```

### Common Issues

**Issue: Can't connect after applying firewall**

```bash
# Check if service is listening
sudo ss -tlnp

# Check firewall rules
sudo iptables -L -n -v
sudo nft list ruleset

# Check for typos in rules
sudo iptables -L INPUT -v --line-numbers

# Temporarily flush rules to test
sudo iptables -F
# If works, problem is in rules

# Check logs
sudo journalctl -k | grep -i drop

# Verify network connectivity (ping)
ping 8.8.8.8
```

**Issue: Locked out after changing SSH rules**

```bash
# Prevention: Always test in new terminal first!
# Keep existing SSH session open while testing

# Recovery: Console access (VPS/cloud)
# Boot into rescue mode or use web console

# Emergency: Flush all rules
sudo iptables -F
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT
```

**Issue: Firewall rules not persisting after reboot**

```bash
# iptables - Install persistence
sudo apt install iptables-persistent

# Or manually save/restore
sudo iptables-save > /etc/iptables/rules.v4
# Add to /etc/rc.local or systemd service

# nftables - Enable service
sudo systemctl enable nftables
# Rules in /etc/nftables.conf are loaded on boot
```

**Issue: High CPU usage from firewall**

```bash
# Check connection tracking
sudo cat /proc/sys/net/netfilter/nf_conntrack_count
sudo cat /proc/sys/net/netfilter/nf_conntrack_max

# Increase conntrack limit
sudo sysctl -w net.netfilter.nf_conntrack_max=262144

# Reduce logging
# Remove or reduce rate limit on log rules

# Optimize rules (put most-used rules first)
# Avoid wildcards where possible
```

---

## Migration from iptables to nftables

### Translation Script

```bash
# Use iptables-translate
sudo apt install iptables-nftables-compat

# Translate existing rules
sudo iptables-save | iptables-restore-translate -f > /etc/nftables.conf

# Review generated nftables config
cat /etc/nftables.conf

# Test nftables config
sudo nft -f /etc/nftables.conf

# If works, switch to nftables
sudo systemctl stop iptables
sudo systemctl disable iptables
sudo systemctl enable nftables
sudo systemctl start nftables
```

### Side-by-Side Comparison

```bash
# Allow SSH
# iptables:
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# nftables:
nft add rule inet filter input tcp dport 22 accept

# Allow HTTP/HTTPS
# iptables:
iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT

# nftables:
nft add rule inet filter input tcp dport { 80, 443 } accept

# Allow from subnet
# iptables:
iptables -A INPUT -s 10.0.0.0/8 -j ACCEPT

# nftables:
nft add rule inet filter input ip saddr 10.0.0.0/8 accept

# Rate limiting
# iptables:
iptables -A INPUT -p tcp --dport 22 -m limit --limit 3/min -j ACCEPT

# nftables:
nft add rule inet filter input tcp dport 22 limit rate 3/minute accept

# Logging
# iptables:
iptables -A INPUT -j LOG --log-prefix "dropped: "

# nftables:
nft add rule inet filter input log prefix \"dropped: \"
```

---

## Security Best Practices

### Firewall Hardening Checklist

```
☑ Default deny policy (drop by default)
☑ Allow only necessary services
☑ Restrict by source IP where possible
☑ Use rate limiting on public services
☑ Log dropped packets (with rate limit)
☑ Regularly review and audit rules
☑ Keep firewall software updated
☑ Test rules before deploying
☑ Document all firewall changes
☑ Use configuration management (Ansible)
☑ Monitor firewall logs
☑ Have emergency access method
☑ Backup firewall configurations
☑ Use connection tracking (stateful)
☑ Block invalid packets
☑ Implement egress filtering (outbound)
```

---

## What's Next?

After mastering firewall basics, continue your security journey:

**Network Security:**
- [Fail2ban Setup](fail2ban-setup) - Automated intrusion prevention
- [WireGuard VPN](wireguard-vpn) - Secure remote access
- [Network Segmentation](network-segmentation) - VLANs and isolation

**System Hardening:**
- [SSH Security Hardening](ssh-security-hardening) - Secure remote access
- [User Account Security](user-account-security) - Least privilege
- System hardening and compliance

**Advanced Firewall:**
- Application-layer firewalls (WAF)
- DDoS mitigation
- Geo-blocking

---

## Additional Resources

### Official Documentation
- [iptables Man Page](https://linux.die.net/man/8/iptables)
- [nftables Wiki](https://wiki.nftables.org/)
- [Netfilter Documentation](https://www.netfilter.org/documentation/)

### Tutorials & Guides
- [DigitalOcean iptables Essentials](https://www.digitalocean.com/community/tutorials/iptables-essentials-common-firewall-rules-and-commands)
- [Arch Wiki nftables](https://wiki.archlinux.org/title/Nftables)
- [Red Hat nftables Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_and_managing_networking/getting-started-with-nftables_configuring-and-managing-networking)

### Tools
- [ufw](https://wiki.ubuntu.com/UncomplicatedFirewall) - Simplified firewall frontend
- [firewalld](https://firewalld.org/) - Dynamic firewall manager
- [ferm](http://ferm.foo-projects.org/) - Firewall configuration tool

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive firewall guide covering iptables and nftables fundamentals, packet filtering, stateful firewalls, NAT/port forwarding, rate limiting, logging, production architectures (three-tier web apps, Kubernetes), troubleshooting, migration strategies, and complete security best practices. Includes real-world examples for web servers, databases, NAT gateways, and enterprise network security.
