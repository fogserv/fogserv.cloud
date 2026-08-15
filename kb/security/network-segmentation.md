# Network Segmentation - VLANs and Security Zones

**Resource Navigation:** [README](README) | [Firewall Basics](firewall-basics) | [WireGuard VPN](wireguard-vpn) | [Intrusion Detection](intrusion-detection)

---

## Summary

Network segmentation divides your infrastructure into isolated security zones, limiting lateral movement after a breach and containing damage to compromised segments. This comprehensive guide covers VLAN configuration with Linux bridges and Open vSwitch, network security zones (DMZ, internal, management), micro-segmentation for containers and Kubernetes, subnet design, inter-VLAN routing with access control, firewall rules between zones, monitoring segmented networks, and compliance with PCI-DSS, HIPAA, and zero-trust architectures. Learn production patterns for multi-tier applications, development/staging/production isolation, multi-tenant environments, and defense-in-depth strategies.

**The Golden Rule:** Assume breach - segment networks so compromised systems can't access everything.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Design secure network segmentation architectures
- ✅ Configure VLANs with Linux networking
- ✅ Implement network security zones (DMZ, internal, management)
- ✅ Set up inter-VLAN routing with ACLs
- ✅ Create firewall rules between network segments
- ✅ Implement micro-segmentation for containers
- ✅ Design subnet allocation strategies
- ✅ Monitor traffic between network zones
- ✅ Implement zero-trust network segmentation
- ✅ Meet compliance requirements (PCI-DSS, HIPAA)

---

## Prerequisites

Before implementing network segmentation, you should have:

- **Networking fundamentals**: Understanding of IP addressing, subnets, routing
- **Linux networking**: [Linux Fundamentals](../basics/linux-fundamentals) networking section
- **Firewall knowledge**: [Firewall Basics](firewall-basics) completed
- **VLAN understanding**: Basic knowledge of VLANs and 802.1Q tagging
- **Switch access**: Managed switch supporting VLANs (for physical networks)

---

## Why Network Segmentation?

### Traditional Flat Network (Insecure)

```
┌─────────────────────────────────────────────────────┐
│         Single Flat Network (192.168.1.0/24)        │
│                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │  Web   │  │  DB    │  │ Admin  │  │ User   │   │
│  │ Server │  │ Server │  │  PC    │  │ Device │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
│       │          │          │          │            │
│       └──────────┴──────────┴──────────┘            │
│              Everyone can talk to everyone          │
└─────────────────────────────────────────────────────┘

Problems:
❌ User laptop compromised = access to databases
❌ Web server breach = lateral movement to everything
❌ No containment of incidents
❌ Cannot enforce principle of least privilege
❌ Compliance failures (PCI-DSS, HIPAA)
```

### Segmented Network (Secure)

```
┌──────────────────────────────────────────────────────┐
│                    Internet                           │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────▼──────────────┐
        │      Firewall/Router       │
        └────────────┬───────────────┘
                     │
        ┌────────────┴────────────┬────────────┬────────┐
        │                         │            │        │
   ┌────▼─────┐          ┌───────▼──────┐ ┌───▼────┐ ┌▼────┐
   │   DMZ    │          │   Internal   │ │  Mgmt  │ │Guest│
   │(Public)  │          │  (Private)   │ │ (Admin)│ │VLAN │
   │          │          │              │ │        │ │     │
   │  ┌────┐  │          │   ┌────┐    │ │ ┌────┐ │ │User │
   │  │Web │  │          │   │ DB │    │ │ │Jump│ │ │Devs │
   │  │Srv │  │          │   │Srv │    │ │ │Host│ │ │     │
   │  └────┘  │          │   └────┘    │ │ └────┘ │ │     │
   │  ┌────┐  │          │   ┌────┐    │ │        │ │     │
   │  │API │  │          │   │App │    │ │        │ │     │
   │  └────┘  │          │   └────┘    │ │        │ │     │
   └──────────┘          └──────────────┘ └────────┘ └─────┘
 VLAN 10              VLAN 20        VLAN 30      VLAN 40
 10.0.10.0/24        10.0.20.0/24   10.0.30.0/24 10.0.40.0/24

Firewall Rules:
✅ Internet → DMZ (web/API only)
✅ DMZ → Internal (database queries only)
✅ Management → Internal (admin access)
❌ DMZ → Management (blocked)
❌ Guest → Internal (blocked)
❌ Internet → Internal (blocked)
```

### Benefits

**Security:**
- Contain breaches to single segment
- Limit lateral movement
- Enforce least privilege network access
- Easier incident response

**Compliance:**
- PCI-DSS Requirement 1.2.1 (segment cardholder data)
- HIPAA Security Rule (isolate PHI)
- SOC 2 Type II (network controls)

**Operations:**
- Separate production from dev/staging
- Isolate management traffic
- QoS per segment
- Easier troubleshooting

---

## Network Security Zones

### Standard Zone Architecture

**DMZ (Demilitarized Zone):**
- Public-facing services (web, email, DNS)
- Directly exposed to internet
- Strict egress filtering
- No trust relationships

**Internal Zone:**
- Application servers
- Database servers
- File servers
- Private services

**Management Zone:**
- Jump hosts / bastion servers
- Configuration management (Ansible, etc.)
- Monitoring tools
- Admin workstations

**Guest Zone:**
- Visitor WiFi
- Contractor access
- No access to internal resources
- Heavy monitoring

**Secure Zone (optional):**
- Highly sensitive data
- Additional authentication required
- Audit logging
- Encryption required

### Zone Trust Relationships

```
Trust Level: Lower ──────────────────→ Higher

┌────────┐     ┌─────┐     ┌──────────┐     ┌────────┐
│Internet│ ──→ │ DMZ │ ──→ │ Internal │ ──→ │ Secure │
└────────┘     └─────┘     └──────────┘     └────────┘
   │             │             │                │
   │             │             │                │
   └─────────────┴─────────────┴────────────────┘
                      │
                 ┌────▼─────┐
                 │   Mgmt   │
                 │   Zone   │
                 └──────────┘

Rules:
- Lower trust → Higher trust: Controlled (firewall rules)
- Higher trust → Lower trust: Allowed (egress)
- Same level: Usually allowed within zone
- Management → Any: Allowed (admin access)
- Any → Management: Denied (except specific ports)
```

---

## VLAN Configuration (Linux)

### VLAN Basics

```bash
# Install VLAN package
sudo apt install vlan

# Load 8021q module
sudo modprobe 8021q

# Make permanent
echo "8021q" | sudo tee -a /etc/modules

# Verify
lsmod | grep 8021q
```

### Create VLANs with systemd-networkd

```ini
# /etc/systemd/network/10-eth0.network
# Physical interface

[Match]
Name=eth0

[Network]
VLAN=vlan10
VLAN=vlan20
VLAN=vlan30

# /etc/systemd/network/20-vlan10.netdev
# VLAN 10 (DMZ)

[NetDev]
Name=vlan10
Kind=vlan

[VLAN]
Id=10

# /etc/systemd/network/20-vlan10.network
# VLAN 10 network config

[Match]
Name=vlan10

[Network]
Address=10.0.10.1/24
Gateway=10.0.10.254

# /etc/systemd/network/21-vlan20.netdev
# VLAN 20 (Internal)

[NetDev]
Name=vlan20
Kind=vlan

[VLAN]
Id=20

# /etc/systemd/network/21-vlan20.network

[Match]
Name=vlan20

[Network]
Address=10.0.20.1/24

# Restart networking
sudo systemctl restart systemd-networkd

# Verify VLANs
ip link show
ip addr show
```

### Create VLANs with Netplan (Ubuntu)

```yaml
# /etc/netplan/01-network-config.yaml

network:
  version: 2
  renderer: networkd
  
  ethernets:
    eth0:
      dhcp4: no
  
  vlans:
    vlan10:
      id: 10
      link: eth0
      addresses:
        - 10.0.10.1/24
    
    vlan20:
      id: 20
      link: eth0
      addresses:
        - 10.0.20.1/24
    
    vlan30:
      id: 30
      link: eth0
      addresses:
        - 10.0.30.1/24

# Apply configuration
sudo netplan apply

# Verify
ip addr show
```

### Create VLANs Manually (Traditional)

```bash
# Create VLAN interface
sudo ip link add link eth0 name eth0.10 type vlan id 10

# Bring interface up
sudo ip link set dev eth0.10 up

# Assign IP address
sudo ip addr add 10.0.10.1/24 dev eth0.10

# Verify
ip addr show eth0.10

# Make permanent (/etc/network/interfaces on Debian)
auto eth0.10
iface eth0.10 inet static
    address 10.0.10.1
    netmask 255.255.255.0
    vlan-raw-device eth0

# Or with NetworkManager
nmcli connection add type vlan con-name vlan10 ifname eth0.10 dev eth0 id 10 ip4 10.0.10.1/24
```

---

## Inter-VLAN Routing

### Router on a Stick

```
┌───────────────────────────────────────────┐
│            Managed Switch                  │
│                                            │
│  [Port 1]  [Port 2]  [Port 3]  [Trunk]   │
│   VLAN10   VLAN20    VLAN30     All       │
└─────┴────────┴────────┴─────────┴─────────┘
      │        │        │         │
      │        │        │         │ Tagged traffic
      │        │        │         │ (802.1Q)
  ┌───▼──┐ ┌───▼──┐ ┌───▼──┐     │
  │ Web  │ │  DB  │ │Admin │     │
  │Server│ │Server│ │  PC  │     │
  └──────┘ └──────┘ └──────┘     │
                                  │
                        ┌─────────▼────────┐
                        │  Router/Firewall  │
                        │  (Linux)          │
                        │                   │
                        │  eth0.10 (VLAN10)│
                        │  eth0.20 (VLAN20)│
                        │  eth0.30 (VLAN30)│
                        └───────────────────┘
```

### Configure Router

```bash
# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# Create VLAN interfaces
sudo ip link add link eth0 name eth0.10 type vlan id 10
sudo ip link add link eth0 name eth0.20 type vlan id 20
sudo ip link add link eth0 name eth0.30 type vlan id 30

# Assign IPs (router is gateway for each VLAN)
sudo ip addr add 10.0.10.254/24 dev eth0.10
sudo ip addr add 10.0.20.254/24 dev eth0.20
sudo ip addr add 10.0.30.254/24 dev eth0.30

# Bring interfaces up
sudo ip link set dev eth0.10 up
sudo ip link set dev eth0.20 up
sudo ip link set dev eth0.30 up

# Routing is automatic (connected routes)
ip route show
```

### Firewall Rules Between VLANs

```bash
#!/bin/bash
# /etc/firewall/inter-vlan-rules.sh

# Clear existing rules
iptables -F
iptables -X

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established connections
iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# VLAN 10 (DMZ) → VLAN 20 (Internal)
# Allow web servers to query database on port 5432
iptables -A FORWARD -i eth0.10 -o eth0.20 -p tcp --dport 5432 -s 10.0.10.0/24 -d 10.0.20.10 -j ACCEPT

# VLAN 30 (Management) → VLAN 20 (Internal)
# Allow SSH from management to internal
iptables -A FORWARD -i eth0.30 -o eth0.20 -p tcp --dport 22 -j ACCEPT

# VLAN 30 (Management) → VLAN 10 (DMZ)
# Allow SSH from management to DMZ
iptables -A FORWARD -i eth0.30 -o eth0.10 -p tcp --dport 22 -j ACCEPT

# Block everything else between VLANs
iptables -A FORWARD -j LOG --log-prefix "VLAN-BLOCK: "
iptables -A FORWARD -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### nftables Version

```bash
#!/usr/sbin/nft -f
# /etc/nftables.conf - Inter-VLAN routing

flush ruleset

table inet filter {
    chain forward {
        type filter hook forward priority 0; policy drop;
        
        # Allow established
        ct state established,related accept
        
        # DMZ (VLAN 10) → Internal (VLAN 20)
        # Web → Database
        iifname "eth0.10" oifname "eth0.20" ip saddr 10.0.10.0/24 ip daddr 10.0.20.10 tcp dport 5432 accept
        
        # Management (VLAN 30) → Internal (VLAN 20)
        iifname "eth0.30" oifname "eth0.20" tcp dport 22 accept
        
        # Management (VLAN 30) → DMZ (VLAN 10)
        iifname "eth0.30" oifname "eth0.10" tcp dport 22 accept
        
        # Log and drop everything else
        limit rate 5/minute log prefix "VLAN-BLOCK: "
        drop
    }
}
```

---

## Production Network Designs

### Three-Tier Web Application

```
                    ┌──────────────┐
                    │   Internet   │
                    └──────┬───────┘
                           │
                ┌──────────▼──────────┐
                │   Border Firewall   │
                │   (pfSense/Linux)   │
                └──────────┬──────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
     ┌──────▼──────┐               ┌─────▼──────┐
     │  DMZ Zone   │               │   VPN      │
     │  VLAN 10    │               │  VLAN 99   │
     │10.0.10.0/24 │               │10.0.99.0/24│
     │             │               │            │
     │ ┌─────────┐ │               │ Wireguard  │
     │ │ Nginx   │ │               └────────────┘
     │ │ Reverse │ │
     │ │ Proxy   │ │
     │ └─────────┘ │
     └──────┬──────┘
            │ (Firewall: HTTP/S only)
            │
     ┌──────▼──────────────────────┐
     │    Application Zone         │
     │    VLAN 20                  │
     │    10.0.20.0/24             │
     │                             │
     │  ┌────────┐  ┌────────┐    │
     │  │ App 1  │  │ App 2  │    │
     │  │ Server │  │ Server │    │
     │  └────────┘  └────────┘    │
     └──────┬──────────────────────┘
            │ (Firewall: PostgreSQL only)
            │
     ┌──────▼──────────────────────┐
     │    Database Zone            │
     │    VLAN 30                  │
     │    10.0.30.0/24             │
     │                             │
     │    ┌────────────┐           │
     │    │ PostgreSQL │           │
     │    │   Master   │           │
     │    └────────────┘           │
     │    ┌────────────┐           │
     │    │ PostgreSQL │           │
     │    │  Replica   │           │
     │    └────────────┘           │
     └─────────────────────────────┘

Firewall Rules:
- Internet → DMZ: 80, 443 only
- DMZ → Application: Application-specific ports
- Application → Database: 5432 only
- Management (separate VLAN) → All: SSH (22)
- All others: DENIED
```

### Development/Staging/Production

```
┌──────────────────────────────────────────────────────┐
│              Isolated Environments                    │
└──────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐
│  Production     │  │   Staging       │  │  Development   │
│  VLAN 100       │  │   VLAN 200      │  │  VLAN 300      │
│  10.100.0.0/16  │  │   10.200.0.0/16 │  │  10.300.0.0/16 │
│                 │  │                 │  │                │
│  ┌──────────┐   │  │  ┌──────────┐   │  │  ┌──────────┐  │
│  │Production│   │  │  │ Staging  │   │  │  │   Dev    │  │
│  │ Database │   │  │  │ Database │   │  │  │ Database │  │
│  └──────────┘   │  │  └──────────┘   │  │  └──────────┘  │
│  ┌──────────┐   │  │  ┌──────────┐   │  │  ┌──────────┐  │
│  │  Web/App │   │  │  │  Web/App │   │  │  │  Web/App │  │
│  └──────────┘   │  │  └──────────┘   │  │  └──────────┘  │
└─────────────────┘  └─────────────────┘  └────────────────┘
        │                    │                     │
        └────────────────────┴─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Shared CI/CD  │
                    │   VLAN 400      │
                    │   10.400.0.0/24 │
                    │                 │
                    │  Jenkins/GitLab │
                    └─────────────────┘

Rules:
✅ CI/CD → All environments (deploy)
✅ Staging → Production (read-only, for data sync)
❌ Development → Production (blocked)
❌ Production → Staging/Dev (blocked)
```

### Kubernetes Cluster Segmentation

```
┌────────────────────────────────────────────────────┐
│          Kubernetes Cluster Network                 │
└────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
│  Control Plane  │  │   Worker Nodes  │  │   Storage    │
│  VLAN 110       │  │   VLAN 120      │  │   VLAN 130   │
│  10.110.0.0/24  │  │   10.120.0.0/22 │  │  10.130.0.0/24│
│                 │  │                 │  │              │
│  ┌──────────┐   │  │  Pod Network:   │  │  ┌────────┐  │
│  │  API     │   │  │  10.244.0.0/16  │  │  │ Ceph   │  │
│  │  Server  │   │  │                 │  │  │ Cluster│  │
│  └──────────┘   │  │  Service Net:   │  │  └────────┘  │
│  ┌──────────┐   │  │  10.96.0.0/12   │  │  ┌────────┐  │
│  │  etcd    │   │  │                 │  │  │Longhorn│  │
│  │  Cluster │   │  │  ┌──────────┐   │  │  └────────┘  │
│  └──────────┘   │  │  │  Pods    │   │  │              │
│  ┌──────────┐   │  │  │(Namespaces)  │  │              │
│  │ Scheduler│   │  │  └──────────┘   │  │              │
│  └──────────┘   │  │                 │  │              │
└─────────────────┘  └─────────────────┘  └──────────────┘
        │                    │                     │
        └────────────────────┴─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Ingress/LB    │
                    │   VLAN 100      │
                    │   10.100.0.0/24 │
                    └─────────────────┘

Network Policies:
- Control plane accessible only from management VLAN
- Worker nodes in separate VLAN
- Storage network isolated
- Pod-to-pod communication via CNI (Calico/Flannel)
- Ingress controllers in DMZ-like VLAN
```

---

## Micro-Segmentation

### Container Network Segmentation

```yaml
# docker-compose.yml - Network segmentation

version: '3.8'

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/24
  
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.1.0/24
  
  database:
    driver: bridge
    internal: true  # No external access
    ipam:
      config:
        - subnet: 172.20.2.0/24

services:
  nginx:
    image: nginx:latest
    networks:
      - frontend
    ports:
      - "80:80"
      - "443:443"
  
  app:
    image: myapp:latest
    networks:
      - frontend  # Can talk to nginx
      - backend   # Can talk to database
  
  postgres:
    image: postgres:15
    networks:
      - backend  # Only accessible from app
    environment:
      POSTGRES_PASSWORD: secretpassword

# nginx can only access app
# app can access both nginx and postgres
# postgres isolated from internet (internal: true)
```

### Kubernetes Network Policies

```yaml
# namespace-isolation.yaml - Isolate namespaces

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  # Default deny all traffic

---
# allow-frontend-to-backend.yaml

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080

---
# allow-backend-to-database.yaml

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-database
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432

---
# allow-dns-egress.yaml

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

---

## Monitoring Segmented Networks

### Traffic Analysis

```bash
#!/bin/bash
# monitor-vlan-traffic.sh

echo "=== Inter-VLAN Traffic Monitor ==="
echo

# Capture traffic between VLANs
sudo tcpdump -i any -n \
  '((src net 10.0.10.0/24 and dst net 10.0.20.0/24) or \
    (src net 10.0.20.0/24 and dst net 10.0.10.0/24))' \
  -w /tmp/inter-vlan-$(date +%Y%m%d-%H%M%S).pcap

# Or monitor specific VLAN
sudo tcpdump -i eth0.10 -n

# Traffic statistics by VLAN
watch -n 5 '
echo "VLAN 10 (DMZ) Traffic:"
ifconfig eth0.10 | grep "RX packets\|TX packets"
echo
echo "VLAN 20 (Internal) Traffic:"
ifconfig eth0.20 | grep "RX packets\|TX packets"
echo
echo "VLAN 30 (Management) Traffic:"
ifconfig eth0.30 | grep "RX packets\|TX packets"
'
```

### Firewall Log Analysis

```bash
# View blocked inter-VLAN traffic
sudo grep "VLAN-BLOCK" /var/log/syslog

# Count blocks by source VLAN
sudo grep "VLAN-BLOCK" /var/log/syslog | \
  grep -oP 'SRC=10\.0\.\K[0-9]+' | \
  sort | uniq -c | sort -nr

# Alert on suspicious inter-VLAN traffic
#!/bin/bash
# alert-vlan-violations.sh

THRESHOLD=100
BLOCKS=$(sudo grep "VLAN-BLOCK" /var/log/syslog | \
         grep "$(date '+%b %e')" | wc -l)

if [ $BLOCKS -gt $THRESHOLD ]; then
    echo "⚠️  High VLAN violation rate: $BLOCKS today" | \
        mail -s "Network Segmentation Alert" security@example.com
fi
```

---

## Compliance and Best Practices

### PCI-DSS Requirements

```
PCI-DSS Requirement 1.2.1:
"Restrict inbound and outbound traffic to that which is 
necessary for the cardholder data environment (CDE), and 
specifically deny all other traffic."

Implementation:
1. Cardholder Data Environment (CDE) in separate VLAN
2. Strict firewall rules (whitelist only)
3. No direct internet access from CDE
4. Jump host for administrative access
5. Log all traffic to/from CDE

Example:
┌────────────────────────────────────┐
│  Cardholder Data Environment (CDE) │
│  VLAN 50                           │
│  10.0.50.0/24                      │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  Payment Processing System   │ │
│  │  (PCI-compliant)             │ │
│  └──────────────────────────────┘ │
│  ┌──────────────────────────────┐ │
│  │  Cardholder Database         │ │
│  │  (encrypted at rest)         │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
         │
         │ Firewall (only payment gateway)
         ↓
   Payment Gateway VLAN
```

### Zero Trust Network

```
Traditional: "Trust but verify"
Zero Trust: "Never trust, always verify"

Principles:
1. Assume breach (segment everything)
2. Verify explicitly (authenticate/authorize every request)
3. Least privilege access (minimal permissions)
4. Micro-segmentation (isolate workloads)

Implementation:
- No trusted network zones
- Application-level segmentation
- Identity-based access (not network-based)
- Encrypt all traffic (mTLS)
- Continuous monitoring and validation

┌───────────────────────────────────────┐
│        Zero Trust Architecture        │
└───────────────────────────────────────┘

         ┌────────────────┐
         │  Identity      │
         │  Provider      │
         │  (Keycloak)    │
         └────────┬───────┘
                  │ Authenticate
         ┌────────▼────────┐
         │  Policy Engine  │
         │  (OPA/Envoy)    │
         └────────┬────────┘
                  │ Authorize
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐   ┌───▼────┐   ┌───▼────┐
│Service │   │Service │   │Service │
│   A    │   │   B    │   │   C    │
│(mTLS)  │   │(mTLS)  │   │(mTLS)  │
└────────┘   └────────┘   └────────┘

Every connection verified, no implicit trust
```

---

## Security Best Practices

### Network Segmentation Checklist

```
☑ Security zones defined (DMZ, internal, management, etc.)
☑ VLANs configured for each zone
☑ Inter-VLAN routing controlled by firewall
☑ Default deny policy between zones
☑ Whitelist only necessary traffic
☑ Management network isolated
☑ Database network restricted to app servers only
☑ Guest network completely isolated
☑ Production/staging/development separated
☑ Monitoring for inter-zone traffic
☑ Regular firewall rule audits
☑ Documentation of network architecture
☑ Compliance requirements met (PCI-DSS, HIPAA)
☑ Incident response procedures for each zone
☑ Network diagrams maintained and current
```

---

## What's Next?

After implementing network segmentation:

**Advanced Network Security:**
- [Intrusion Detection](intrusion-detection) - Snort/Suricata IDS per zone
- [WireGuard VPN](wireguard-vpn) - Secure remote access to segments
- [Firewall Basics](firewall-basics) - Advanced firewall architectures

**Zero Trust:**
- [Zero Trust Principles](zero-trust-principles) - Full zero trust architecture
- [Service Mesh Security](service-mesh-security) - Istio/Linkerd mTLS
- [Identity Management](identity-management) - Centralized authentication

**Container Security:**
- [Container Security](container-security) - Docker/Kubernetes hardening
- [Network Policies](../containers/k0s-networking) - Kubernetes network isolation

---

## Additional Resources

### Official Documentation
- [VLAN on Linux](https://wiki.archlinux.org/title/VLAN)
- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)

### Tutorials & Guides
- [Red Hat VLAN Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_and_managing_networking/configuring-vlan-tagging_configuring-and-managing-networking)
- [Network Segmentation Best Practices](https://www.cisecurity.org/insights/blog/network-segmentation-best-practices)

### Tools
- [Open vSwitch](https://www.openvswitch.org/) - Advanced virtual switching
- [Calico](https://www.tigera.io/project-calico/) - Kubernetes network policies
- [pfSense](https://www.pfsense.org/) - Open source firewall/router

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive network segmentation guide covering security zones (DMZ, internal, management), VLAN configuration with Linux networking and systemd-networkd, inter-VLAN routing with access control, firewall rules between zones, production network designs (three-tier web apps, dev/staging/prod isolation, Kubernetes segmentation), micro-segmentation for containers and Kubernetes with network policies, monitoring segmented networks, compliance (PCI-DSS, HIPAA), zero-trust architecture principles, and complete security best practices for defense-in-depth network security.

