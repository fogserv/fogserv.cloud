# WireGuard VPN - Secure Remote Access

**Resource Navigation:** [README](README) | [Firewall Basics](firewall-basics) | [Network Segmentation](network-segmentation) | [SSH Security Hardening](ssh-security-hardening)

---

## Summary

WireGuard is a modern, fast, and secure VPN protocol that provides encrypted remote access to your infrastructure with minimal configuration complexity. This comprehensive guide covers WireGuard installation and configuration for point-to-point connections, road warrior setups, site-to-site VPNs, multi-peer configurations, integration with firewalls and routing, DNS configuration, mobile client deployment, automated key management, high-availability VPN gateways, and monitoring. Learn production patterns for securing remote teams, jump host access, Kubernetes cluster connectivity, and zero-trust network architectures. Every pattern includes performance optimization, security hardening, and troubleshooting guides.

**The Golden Rule:** All remote access should go through encrypted VPN tunnels; never expose services directly to the internet.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Install and configure WireGuard on Linux, Windows, macOS
- ✅ Set up point-to-point VPN connections
- ✅ Configure road warrior (mobile) VPN access
- ✅ Implement site-to-site VPN tunnels
- ✅ Manage WireGuard keys and peer configurations
- ✅ Integrate WireGuard with firewalls and routing
- ✅ Configure split-tunnel and full-tunnel modes
- ✅ Deploy WireGuard on mobile devices
- ✅ Monitor VPN connections and bandwidth
- ✅ Troubleshoot WireGuard connectivity issues

---

## Prerequisites

Before setting up WireGuard, you should have:

- **Linux fundamentals**: [Linux Fundamentals](../basics/linux-fundamentals) completed
- **Networking basics**: Understanding of IP addresses, subnets, routing
- **Firewall knowledge**: [Firewall Basics](firewall-basics) for securing VPN
- **SSH access**: [SSH Security](ssh-security-hardening) to configure servers
- **Root access**: Ability to install packages and modify network configuration

---

## Why WireGuard?

### WireGuard vs. Traditional VPNs

**WireGuard:**
✅ Modern cryptography (Curve25519, ChaCha20, Poly1305)
✅ Minimal codebase (~4,000 lines vs. 400,000+ for OpenVPN)
✅ Fast (kernel space implementation)
✅ Simple configuration (vs. complex OpenVPN configs)
✅ Built into Linux kernel 5.6+
✅ Low overhead (great for mobile)
✅ Roaming support (seamless network switching)
❌ Less mature than OpenVPN/IPSec
❌ No built-in user management (use peer keys)

**OpenVPN:**
✅ Mature and battle-tested
✅ Built-in user management
✅ Extensive features
✅ Works on any port/protocol
❌ Complex configuration
❌ Slower than WireGuard
❌ Large codebase (more attack surface)
❌ Higher CPU overhead

**IPSec:**
✅ Industry standard
✅ Hardware acceleration support
✅ Built into most OSes
❌ Complex configuration
❌ NAT traversal issues
❌ Large codebase
❌ Multiple competing implementations

**Recommendation**: WireGuard for modern infrastructure, OpenVPN for legacy/enterprise requirements.

---

## Installation

### Linux (Kernel 5.6+)

```bash
# Check kernel version
uname -r

# If kernel >= 5.6, WireGuard is built-in
# Just install tools

# Debian/Ubuntu
sudo apt update
sudo apt install wireguard wireguard-tools

# RHEL/CentOS 8+
sudo dnf install wireguard-tools

# Verify installation
which wg
wg --version
```

### Linux (Older Kernels)

```bash
# Kernel < 5.6 requires kernel module

# Debian/Ubuntu
sudo apt install wireguard

# RHEL/CentOS 7
sudo yum install epel-release
sudo yum install kmod-wireguard wireguard-tools

# Load module
sudo modprobe wireguard
lsmod | grep wireguard
```

### Windows

```
Download: https://www.wireguard.com/install/

1. Download WireGuard installer
2. Run installer (requires admin)
3. Launch WireGuard application
4. Import configuration or add tunnel manually
```

### macOS

```bash
# Install via Homebrew
brew install wireguard-tools

# Or download from App Store:
# "WireGuard" by WireGuard Development Team

# Or download from website:
# https://www.wireguard.com/install/
```

### Mobile

```
iOS: App Store → "WireGuard"
Android: Play Store → "WireGuard"

Free, open source, official clients
```

---

## Key Generation

### Generate Server Keys

```bash
# Create directory for keys
sudo mkdir -p /etc/wireguard/keys
cd /etc/wireguard/keys

# Generate server private key
wg genkey | sudo tee server_private.key
sudo chmod 600 server_private.key

# Generate server public key from private
sudo cat server_private.key | wg pubkey | sudo tee server_public.key

# View keys
cat server_private.key
cat server_public.key
```

### Generate Client Keys

```bash
# For each client, generate key pair

# Client 1 (laptop)
wg genkey | sudo tee laptop_private.key
sudo cat laptop_private.key | wg pubkey | sudo tee laptop_public.key

# Client 2 (phone)
wg genkey | sudo tee phone_private.key
sudo cat phone_private.key | wg pubkey | sudo tee phone_public.key

# Client 3 (tablet)
wg genkey | sudo tee tablet_private.key
sudo cat tablet_private.key | wg pubkey | sudo tee tablet_public.key

# Secure permissions
sudo chmod 600 /etc/wireguard/keys/*_private.key
```

---

## Point-to-Point VPN

### Server Configuration

```ini
# /etc/wireguard/wg0.conf - Server configuration

[Interface]
# Server IP address within VPN
Address = 10.10.0.1/24

# Server private key
PrivateKey = <SERVER_PRIVATE_KEY>

# VPN listen port
ListenPort = 51820

# Enable IP forwarding and NAT (if routing traffic)
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Or with nftables:
# PostUp = nft add rule inet filter forward iifname wg0 accept; nft add rule inet nat postrouting oifname eth0 masquerade
# PostDown = nft delete rule inet filter forward iifname wg0 accept; nft delete rule inet nat postrouting oifname eth0 masquerade

# For routing only (no NAT):
# PostUp = sysctl -w net.ipv4.ip_forward=1
# PostDown = sysctl -w net.ipv4.ip_forward=0

# Clients
[Peer]
# Client (laptop) public key
PublicKey = <LAPTOP_PUBLIC_KEY>

# IP address assigned to client
AllowedIPs = 10.10.0.2/32

# Keep alive (for NAT traversal)
PersistentKeepalive = 25
```

### Client Configuration

```ini
# laptop.conf - Client configuration

[Interface]
# Client IP address within VPN
Address = 10.10.0.2/24

# Client private key
PrivateKey = <LAPTOP_PRIVATE_KEY>

# DNS servers (optional)
DNS = 10.10.0.1, 1.1.1.1

[Peer]
# Server public key
PublicKey = <SERVER_PUBLIC_KEY>

# Server endpoint (public IP and port)
Endpoint = vpn.example.com:51820

# Routes through VPN (specific subnet only - split tunnel)
AllowedIPs = 10.10.0.0/24, 192.168.1.0/24

# Or route all traffic through VPN (full tunnel):
# AllowedIPs = 0.0.0.0/0, ::/0

# Keep connection alive (NAT traversal)
PersistentKeepalive = 25
```

### Start VPN

```bash
# Server: Start WireGuard
sudo wg-quick up wg0

# Enable on boot
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Check status
sudo wg show

# Client: Import configuration
sudo cp laptop.conf /etc/wireguard/
sudo wg-quick up laptop

# Or on systemd:
sudo systemctl enable wg-quick@laptop
sudo systemctl start wg-quick@laptop

# Verify connection
ping 10.10.0.1
sudo wg show
```

---

## Road Warrior (Multi-Client) Setup

### Server Configuration with Multiple Peers

```ini
# /etc/wireguard/wg0.conf - Road warrior server

[Interface]
Address = 10.10.0.1/24
PrivateKey = <SERVER_PRIVATE_KEY>
ListenPort = 51820

# Enable IP forwarding and NAT
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE; iptables -A INPUT -p udp --dport 51820 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE; iptables -D INPUT -p udp --dport 51820 -j ACCEPT

# Peer 1: Alice's laptop
[Peer]
PublicKey = <ALICE_LAPTOP_PUBLIC_KEY>
AllowedIPs = 10.10.0.2/32
PersistentKeepalive = 25

# Peer 2: Alice's phone
[Peer]
PublicKey = <ALICE_PHONE_PUBLIC_KEY>
AllowedIPs = 10.10.0.3/32
PersistentKeepalive = 25

# Peer 3: Bob's laptop
[Peer]
PublicKey = <BOB_LAPTOP_PUBLIC_KEY>
AllowedIPs = 10.10.0.4/32
PersistentKeepalive = 25

# Peer 4: Bob's phone
[Peer]
PublicKey = <BOB_PHONE_PUBLIC_KEY>
AllowedIPs = 10.10.0.5/32
PersistentKeepalive = 25

# Add more peers as needed (up to ~200 comfortable)
```

### Enable IP Forwarding

```bash
# Enable IP forwarding permanently
sudo nano /etc/sysctl.conf

# Add or uncomment:
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1

# Apply immediately
sudo sysctl -p

# Verify
cat /proc/sys/net/ipv4/ip_forward  # Should output: 1
```

### Firewall Configuration

```bash
# Allow WireGuard port
sudo ufw allow 51820/udp

# Or with iptables
sudo iptables -A INPUT -p udp --dport 51820 -j ACCEPT

# Or with nftables
sudo nft add rule inet filter input udp dport 51820 accept

# See [Firewall Basics](firewall-basics) for details
```

---

## Mobile Client Configuration

### Generate QR Code

```bash
# Install qrencode
sudo apt install qrencode

# Create client config file
cat > phone.conf <<EOF
[Interface]
Address = 10.10.0.3/24
PrivateKey = <PHONE_PRIVATE_KEY>
DNS = 10.10.0.1, 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
EOF

# Generate QR code
qrencode -t ansiutf8 < phone.conf

# Or save to file
qrencode -o phone-qr.png -r phone.conf

# Display in terminal
cat phone.conf | qrencode -t ansiutf8
```

### Mobile Setup

```
1. Open WireGuard app on phone
2. Tap "+" to add tunnel
3. Select "Create from QR code"
4. Scan QR code displayed on server
5. Name the tunnel (e.g., "Office VPN")
6. Toggle switch to connect
7. Verify connection

Android: May require "Always-on VPN" in settings
iOS: May require VPN configuration profile
```

---

## Site-to-Site VPN

### Scenario

```
Site A (Office)                    Site B (Data Center)
192.168.1.0/24                     10.0.0.0/24
         │                                │
         │                                │
    ┌────┴────┐                      ┌────┴────┐
    │ Gateway │ ←──── WireGuard ────→ │ Gateway │
    │ wg0:    │       (encrypted)     │ wg0:    │
    │10.10.0.1│                       │10.10.0.2│
    └─────────┘                       └─────────┘
         │                                │
         ↓                                ↓
  Devices can access ←────────────→ Devices can access
  10.0.0.0/24                       192.168.1.0/24
```

### Site A Configuration

```ini
# /etc/wireguard/wg0.conf - Site A gateway

[Interface]
Address = 10.10.0.1/30
PrivateKey = <SITE_A_PRIVATE_KEY>
ListenPort = 51820

# Enable routing between networks
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# Site B gateway
PublicKey = <SITE_B_PUBLIC_KEY>
Endpoint = site-b.example.com:51820

# Allow Site B VPN IP and LAN subnet
AllowedIPs = 10.10.0.2/32, 10.0.0.0/24
PersistentKeepalive = 25
```

### Site B Configuration

```ini
# /etc/wireguard/wg0.conf - Site B gateway

[Interface]
Address = 10.10.0.2/30
PrivateKey = <SITE_B_PRIVATE_KEY>
ListenPort = 51820

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# Site A gateway
PublicKey = <SITE_A_PUBLIC_KEY>
Endpoint = site-a.example.com:51820

# Allow Site A VPN IP and LAN subnet
AllowedIPs = 10.10.0.1/32, 192.168.1.0/24
PersistentKeepalive = 25
```

### Add Routes

```bash
# Site A: Route 10.0.0.0/24 through VPN
sudo ip route add 10.0.0.0/24 via 10.10.0.2 dev wg0

# Make persistent
echo "PostUp = ip route add 10.0.0.0/24 via 10.10.0.2 dev wg0" | sudo tee -a /etc/wireguard/wg0.conf
echo "PostDown = ip route del 10.0.0.0/24 via 10.10.0.2 dev wg0" | sudo tee -a /etc/wireguard/wg0.conf

# Site B: Route 192.168.1.0/24 through VPN
sudo ip route add 192.168.1.0/24 via 10.10.0.1 dev wg0

# Make persistent
echo "PostUp = ip route add 192.168.1.0/24 via 10.10.0.1 dev wg0" | sudo tee -a /etc/wireguard/wg0.conf
echo "PostDown = ip route del 192.168.1.0/24 via 10.10.0.1 dev wg0" | sudo tee -a /etc/wireguard/wg0.conf

# Test connectivity
# From Site A:
ping 10.0.0.10  # Server in Site B

# From Site B:
ping 192.168.1.10  # Server in Site A
```

---

## Advanced Configuration

### Split Tunnel vs. Full Tunnel

**Split Tunnel** (route only specific traffic through VPN):

```ini
# Client configuration - Split tunnel
[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = vpn.example.com:51820

# Only route internal networks through VPN
AllowedIPs = 10.10.0.0/24, 192.168.0.0/16, 172.16.0.0/12

# Internet traffic goes direct (not through VPN)
PersistentKeepalive = 25
```

**Full Tunnel** (route all traffic through VPN):

```ini
# Client configuration - Full tunnel
[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = vpn.example.com:51820

# Route all IPv4 and IPv6 traffic through VPN
AllowedIPs = 0.0.0.0/0, ::/0

PersistentKeepalive = 25
```

### DNS Configuration

```ini
# /etc/wireguard/wg0.conf - Client with DNS

[Interface]
Address = 10.10.0.2/24
PrivateKey = <CLIENT_PRIVATE_KEY>

# Use VPN server's DNS
DNS = 10.10.0.1

# Or use multiple DNS servers
DNS = 10.10.0.1, 1.1.1.1, 8.8.8.8

# Or specify search domain
DNS = 10.10.0.1, example.com

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

### Peer-to-Peer (Mesh) Network

```ini
# Each peer can connect to multiple other peers

# Peer A configuration
[Interface]
Address = 10.10.0.1/24
PrivateKey = <PEER_A_PRIVATE>
ListenPort = 51820

[Peer]
# Peer B
PublicKey = <PEER_B_PUBLIC>
Endpoint = peer-b.example.com:51820
AllowedIPs = 10.10.0.2/32

[Peer]
# Peer C
PublicKey = <PEER_C_PUBLIC>
Endpoint = peer-c.example.com:51820
AllowedIPs = 10.10.0.3/32

# Peer A can now communicate with both B and C
# B and C can also peer with each other for full mesh
```

### Dynamic Peer Management

```bash
# Add peer without restarting
sudo wg set wg0 peer <PUBLIC_KEY> allowed-ips 10.10.0.10/32

# Remove peer
sudo wg set wg0 peer <PUBLIC_KEY> remove

# Update endpoint
sudo wg set wg0 peer <PUBLIC_KEY> endpoint newserver.example.com:51820

# Save current configuration
sudo wg showconf wg0 > /etc/wireguard/wg0.conf
```

---

## Monitoring and Management

### Check VPN Status

```bash
# Show all WireGuard interfaces
sudo wg show

# Show specific interface
sudo wg show wg0

# Show detailed information
sudo wg show all dump

# Example output:
# interface: wg0
#   public key: <SERVER_PUBLIC_KEY>
#   private key: (hidden)
#   listening port: 51820
#
# peer: <CLIENT_1_PUBLIC_KEY>
#   endpoint: 203.0.113.42:54321
#   allowed ips: 10.10.0.2/32
#   latest handshake: 1 minute, 23 seconds ago
#   transfer: 15.2 MiB received, 8.7 MiB sent
#   persistent keepalive: every 25 seconds
```

### Monitor Bandwidth

```bash
# Real-time bandwidth monitoring
watch -n 1 sudo wg show wg0

# Log bandwidth usage
#!/bin/bash
# /usr/local/bin/wg-monitor.sh

while true; do
    echo "$(date) - WireGuard Stats:"
    sudo wg show wg0 | grep -A 2 "peer:" | grep "transfer"
    sleep 60
done >> /var/log/wireguard-bandwidth.log
```

### Automated Peer Management Script

```bash
#!/bin/bash
# wg-add-client.sh - Add new WireGuard client

CLIENT_NAME="$1"

if [ -z "$CLIENT_NAME" ]; then
    echo "Usage: $0 <client_name>"
    exit 1
fi

# Generate keys
CLIENT_PRIVATE=$(wg genkey)
CLIENT_PUBLIC=$(echo "$CLIENT_PRIVATE" | wg pubkey)

# Get next available IP
LAST_IP=$(sudo wg show wg0 allowed-ips | grep -oE '10\.10\.0\.[0-9]+' | cut -d. -f4 | sort -n | tail -1)
NEXT_IP=$((LAST_IP + 1))
CLIENT_IP="10.10.0.$NEXT_IP"

# Get server public key
SERVER_PUBLIC=$(sudo cat /etc/wireguard/keys/server_public.key)

# Add peer to server
sudo wg set wg0 peer "$CLIENT_PUBLIC" allowed-ips "$CLIENT_IP/32"

# Save configuration
sudo wg showconf wg0 > /etc/wireguard/wg0.conf

# Generate client configuration
cat > "/etc/wireguard/clients/$CLIENT_NAME.conf" <<EOF
[Interface]
Address = $CLIENT_IP/24
PrivateKey = $CLIENT_PRIVATE
DNS = 10.10.0.1, 1.1.1.1

[Peer]
PublicKey = $SERVER_PUBLIC
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
EOF

echo "✓ Client $CLIENT_NAME created"
echo "  IP: $CLIENT_IP"
echo "  Config: /etc/wireguard/clients/$CLIENT_NAME.conf"
echo ""
echo "Generate QR code:"
echo "  qrencode -t ansiutf8 < /etc/wireguard/clients/$CLIENT_NAME.conf"
```

---

## Security Hardening

### Restrict Access by Source IP

```ini
# Only allow connections from specific countries/networks

# In firewall rules (before WireGuard starts)
PostUp = iptables -A INPUT -p udp --dport 51820 -s 203.0.113.0/24 -j ACCEPT
PostUp = iptables -A INPUT -p udp --dport 51820 -j DROP
```

### Key Rotation

```bash
#!/bin/bash
# rotate-server-key.sh - Rotate WireGuard server key

# Generate new server key
NEW_PRIVATE=$(wg genkey)
NEW_PUBLIC=$(echo "$NEW_PRIVATE" | wg pubkey)

echo "New server public key: $NEW_PUBLIC"
echo ""
echo "⚠️  Update all client configurations with new server public key!"
echo ""
read -p "Press Enter after updating clients..."

# Backup old config
sudo cp /etc/wireguard/wg0.conf /etc/wireguard/wg0.conf.backup

# Update server private key
sudo sed -i "s/^PrivateKey = .*/PrivateKey = $NEW_PRIVATE/" /etc/wireguard/wg0.conf

# Restart WireGuard
sudo systemctl restart wg-quick@wg0

echo "✓ Server key rotated successfully"
echo "  Backup saved to: /etc/wireguard/wg0.conf.backup"
```

### Rate Limiting

```bash
# Limit connection attempts to prevent DoS
sudo iptables -A INPUT -p udp --dport 51820 -m state --state NEW -m recent --set
sudo iptables -A INPUT -p udp --dport 51820 -m state --state NEW -m recent --update --seconds 60 --hitcount 10 -j DROP
```

---

## High Availability

### Multiple VPN Servers (Failover)

```ini
# Client configuration with multiple servers

[Interface]
Address = 10.10.0.2/24
PrivateKey = <CLIENT_PRIVATE_KEY>
DNS = 10.10.0.1

# Primary server
[Peer]
PublicKey = <SERVER1_PUBLIC_KEY>
Endpoint = vpn1.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

# Backup server (manual failover)
# Uncomment if primary fails
# [Peer]
# PublicKey = <SERVER2_PUBLIC_KEY>
# Endpoint = vpn2.example.com:51820
# AllowedIPs = 0.0.0.0/0
# PersistentKeepalive = 25
```

### Automated Failover Script

```bash
#!/bin/bash
# wireguard-failover.sh - Automatic VPN failover

PRIMARY="vpn1.example.com"
BACKUP="vpn2.example.com"
INTERFACE="wg0"

while true; do
    # Check if primary is reachable
    if ping -c 1 -W 5 $PRIMARY > /dev/null 2>&1; then
        # Primary is up, ensure we're using it
        CURRENT=$(sudo wg show $INTERFACE | grep endpoint | awk '{print $2}' | cut -d: -f1)
        if [ "$CURRENT" != "$PRIMARY" ]; then
            echo "Failing back to primary: $PRIMARY"
            sudo wg set $INTERFACE peer <PUBLIC_KEY> endpoint $PRIMARY:51820
        fi
    else
        # Primary is down, switch to backup
        echo "Primary down, failing over to: $BACKUP"
        sudo wg set $INTERFACE peer <PUBLIC_KEY> endpoint $BACKUP:51820
    fi
    
    sleep 30
done
```

---

## Troubleshooting

### Connection Not Establishing

```bash
# Check WireGuard is running
sudo systemctl status wg-quick@wg0
sudo wg show

# Check firewall allows UDP 51820
sudo iptables -L INPUT -n | grep 51820
sudo ufw status | grep 51820

# Check IP forwarding enabled
cat /proc/sys/net/ipv4/ip_forward  # Should be: 1

# Check routing
ip route show
ip addr show wg0

# Test connectivity to server
ping vpn.example.com
nc -u -v vpn.example.com 51820

# Check logs
sudo journalctl -u wg-quick@wg0 -f
sudo dmesg | grep wireguard
```

### No Handshake

```bash
# Check peer configuration
sudo wg show wg0

# "latest handshake" should show recent time
# If "never" or old timestamp:

# 1. Verify public keys match
#    Server config peer = client public key
#    Client config peer = server public key

# 2. Check endpoint is correct
#    Client must have correct server IP:port

# 3. Verify firewall allows UDP traffic

# 4. Check time synchronization
date  # Must be accurate for handshake

# Force handshake
ping 10.10.0.1  # Ping server through VPN
```

### Can't Reach Internal Networks

```bash
# Verify AllowedIPs includes target subnet
sudo wg show wg0 | grep "allowed ips"

# Check routing
ip route | grep wg0

# Verify IP forwarding on server
ssh vpn-server "cat /proc/sys/net/ipv4/ip_forward"

# Check NAT/firewall rules on server
ssh vpn-server "sudo iptables -L FORWARD -n -v"
ssh vpn-server "sudo iptables -t nat -L POSTROUTING -n -v"

# Test from server to internal network
ssh vpn-server "ping 192.168.1.10"
```

### Performance Issues

```bash
# Check MTU settings
ip link show wg0

# Reduce MTU if needed (default 1420)
sudo ip link set wg0 mtu 1400

# Make permanent in config
# [Interface]
# MTU = 1400

# Check bandwidth usage
sudo wg show wg0 | grep transfer

# Monitor latency
ping -i 0.2 10.10.0.1

# Check CPU usage
top -p $(pgrep wireguard)
```

---

## Integration with Infrastructure

### Kubernetes Cluster Access

```ini
# Access Kubernetes cluster through VPN

[Interface]
Address = 10.10.0.2/24
PrivateKey = <CLIENT_PRIVATE_KEY>
DNS = 10.10.0.1

[Peer]
PublicKey = <VPN_SERVER_PUBLIC_KEY>
Endpoint = vpn.example.com:51820

# Route to Kubernetes pod and service networks
AllowedIPs = 10.10.0.0/24, 10.244.0.0/16, 10.96.0.0/16
PersistentKeepalive = 25

# Now kubectl works through VPN
# kubectl --server=https://10.244.0.1:6443 get nodes
```

### Jump Host Access

```bash
# SSH through VPN to jump host, then to internal servers

# ~/.ssh/config
Host jumphost
    HostName 10.10.0.1
    User admin
    IdentityFile ~/.ssh/id_ed25519

Host internal-*
    ProxyJump jumphost
    User admin
    IdentityFile ~/.ssh/id_ed25519

Host internal-web
    HostName 192.168.1.10

Host internal-db
    HostName 192.168.1.20

# Usage:
# Connect to VPN first
# Then: ssh internal-web
```

### Docker Network

```yaml
# docker-compose.yml - WireGuard container

version: '3.8'

services:
  wireguard:
    image: linuxserver/wireguard:latest
    container_name: wireguard
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - SERVERURL=vpn.example.com
      - SERVERPORT=51820
      - PEERS=5
      - PEERDNS=auto
    volumes:
      - ./config:/config
      - /lib/modules:/lib/modules
    ports:
      - 51820:51820/udp
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
    restart: unless-stopped
```

---

## Security Best Practices

### WireGuard Security Checklist

```
☑ Strong key management (rotate annually)
☑ Firewall restricts WireGuard port (UDP 51820)
☑ Rate limiting on VPN port
☑ PersistentKeepalive for NAT traversal
☑ Minimal AllowedIPs (split tunnel when possible)
☑ DNS through VPN (prevent leaks)
☑ Regular key rotation
☑ Inactive peers removed promptly
☑ Audit logs enabled
☑ Monitoring for unauthorized access
☑ Backup VPN server for failover
☑ Documentation for peer onboarding/offboarding
☑ Mobile device policies (MDM integration)
☑ Fail2ban protecting WireGuard (optional)
```

---

## What's Next?

After setting up WireGuard VPN:

**Network Security:**
- [Network Segmentation](network-segmentation) - VLANs and subnet isolation
- [Intrusion Detection](intrusion-detection) - Snort/Suricata IDS
- [Firewall Basics](firewall-basics) - Secure VPN endpoints

**Access Control:**
- [Zero Trust Principles](zero-trust-principles) - Never trust, always verify
- [SSH Security Hardening](ssh-security-hardening) - Secure jump hosts
- [Two-Factor Authentication](two-factor-authentication) - Additional auth layer

**Advanced:**
- [Certificate Management](certificate-fundamentals) - Client certificates
- [Service Mesh Security](service-mesh-security) - Kubernetes mTLS
- [Identity Management](identity-management) - Centralized auth

---

## Additional Resources

### Official Documentation
- [WireGuard Official](https://www.wireguard.com/)
- [WireGuard Quickstart](https://www.wireguard.com/quickstart/)
- [WireGuard Protocol](https://www.wireguard.com/protocol/)

### Tutorials & Guides
- [DigitalOcean WireGuard Guide](https://www.digitalocean.com/community/tutorials/how-to-set-up-wireguard-on-ubuntu-20-04)
- [Linode WireGuard Tutorial](https://www.linode.com/docs/guides/set-up-wireguard-vpn-on-ubuntu/)

### Tools
- [wg-easy](https://github.com/WeeJeWel/wg-easy) - Web UI for WireGuard
- [WireGuard Manager](https://github.com/complexorganizations/wireguard-manager) - Management script
- [Tailscale](https://tailscale.com/) - WireGuard-based mesh VPN service

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive WireGuard VPN guide covering installation on Linux/Windows/macOS/mobile, point-to-point and road warrior configurations, site-to-site VPN tunnels, key management, split vs. full tunnel modes, DNS configuration, mobile client setup with QR codes, dynamic peer management, monitoring and bandwidth tracking, security hardening with rate limiting and key rotation, high-availability failover, troubleshooting connection and routing issues, Kubernetes cluster access, Docker integration, and complete security best practices for production VPN infrastructure.

