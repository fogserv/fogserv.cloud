# Networking - TCP/IP, DNS, Reverse Proxies & Firewalls

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Networking Fundamentals  
**Prerequisites**: [kb/basics/](../basics/)  
**Tags**: networking, tcp-ip, dns, reverse-proxy, traefik, firewall, load-balancing, self-hosted

## Summary

Complete networking knowledge from TCP/IP fundamentals through production reverse proxy setups. Learn how data flows, DNS resolution, SSL/TLS, and modern service routing using self-hosted tools like Traefik.

## 🎯 Learning Philosophy

**Packets Don't Lie**:
```
Physical → Data Link → Network → Transport → Application
(Wires)    (Frames)     (IP)      (TCP/UDP)   (HTTP/DNS)
```

This directory teaches networking from **"what happens when you ping?"** through production-ready reverse proxy configurations. Progressive understanding from OSI layers through service mesh concepts.

## 📚 Learning Path

```
Prerequisites: Basic Linux, SSH understanding
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: Network Fundamentals         │
│  ├─ OSI model and TCP/IP               │
│  ├─ IP addressing and subnets          │
│  ├─ Routing basics                     │
│  ├─ DNS fundamentals                   │
│  └─ Network troubleshooting tools      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Service Networking           │
│  ├─ Ports and protocols                │
│  ├─ Firewalls (iptables/nftables)      │
│  ├─ NAT and port forwarding            │
│  ├─ Load balancing concepts            │
│  └─ SSL/TLS fundamentals               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Reverse Proxies              │
│  ├─ What is a reverse proxy            │
│  ├─ Traefik setup (modern choice)      │
│  ├─ Automatic SSL with Let's Encrypt   │
│  ├─ Docker labels routing              │
│  └─ Middleware (auth, rate limit)      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: DNS & Certificates           │
│  ├─ Running your own DNS (PiHole)      │
│  ├─ Split-horizon DNS                  │
│  ├─ Let's Encrypt automation           │
│  ├─ Wildcard certificates              │
│  └─ Certificate management             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Advanced & Production        │
│  ├─ Load balancing algorithms          │
│  ├─ Service mesh concepts              │
│  ├─ Zero-trust networking              │
│  ├─ VPN integration                    │
│  └─ Performance optimization           │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: Network Fundamentals (Start Here)

**The Basics - How Networks Work**:
1. **[tcp-ip-fundamentals](tcp-ip-fundamentals)** - How the internet works
   - OSI model layers
   - TCP vs UDP
   - IP addressing (IPv4/IPv6)
   - Subnetting basics
   - Default gateway, routing
   - **Prerequisites**: None
   - **Time**: 3-4 hours
   - **Resources**: `[███░░░░░░░]` 30% - Conceptual

2. **[ip-addressing-subnets](ip-addressing-subnets)** - Understanding IP addresses
   - CIDR notation
   - Public vs private IPs
   - Subnet masks
   - Network calculations
   - IPv6 addressing
   - **Prerequisites**: TCP/IP basics
   - **Time**: 3-4 hours
   - **Resources**: `[███░░░░░░░]` 30%

3. **[dns-fundamentals](dns-fundamentals)** - Domain Name System
   - What is DNS
   - DNS record types (A, AAAA, CNAME, MX, TXT)
   - DNS resolution flow
   - Authoritative vs recursive
   - DNS propagation
   - **Prerequisites**: Networking basics
   - **Time**: 2-3 hours
   - **Resources**: `[███░░░░░░░]` 30%

4. **[network-troubleshooting](network-troubleshooting)** - Debug connectivity
   - ping, traceroute, mtr
   - dig, nslookup, host
   - netstat, ss, lsof
   - tcpdump, wireshark
   - Common issues and fixes
   - **Prerequisites**: Linux CLI
   - **Time**: 4-5 hours
   - **Resources**: `[████░░░░░░]` 40%

### 🟡 Phase 2: Service Networking (Security & Routing)

5. **[ports-and-protocols](ports-and-protocols)** - Well-known ports
   - Port numbers (22, 80, 443, 3306...)
   - TCP vs UDP services
   - Service identification
   - Port scanning (nmap)
   - **Prerequisites**: TCP/IP understanding
   - **Time**: 2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

6. **[firewall-basics](firewall-basics)** - iptables/nftables
   - Firewall concepts
   - iptables chains (INPUT, OUTPUT, FORWARD)
   - Basic rules
   - Allow/deny patterns
   - Stateful firewalls
   - **Prerequisites**: Linux basics
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

7. **[firewall-advanced](firewall-advanced)** - Production firewall configs
   - nftables (modern replacement)
   - Rate limiting
   - GeoIP blocking
   - DDoS protection basics
   - Fail2ban integration
   - **Prerequisites**: Firewall basics
   - **Time**: 4-5 hours
   - **Resources**: `[██████░░░░]` 60%

8. **[nat-port-forwarding](nat-port-forwarding)** - Routing external traffic
   - What is NAT
   - Port forwarding setup
   - DMZ configuration
   - Double NAT issues
   - **Prerequisites**: Routing understanding
   - **Time**: 2-3 hours
   - **Resources**: `[████░░░░░░]` 40%

9. **[ssl-tls-fundamentals](ssl-tls-fundamentals)** - Encrypted connections
   - Public key cryptography
   - Certificates and CAs
   - TLS handshake
   - Certificate chains
   - Self-signed vs CA-signed
   - **Prerequisites**: Basic security
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

### 🟠 Phase 3: Reverse Proxies (Modern Service Routing)

10. **[reverse-proxy-introduction](reverse-proxy-introduction)** - What is a reverse proxy
    - Forward vs reverse proxy
    - Use cases
    - SSL termination
    - Load balancing
    - Architecture patterns
    - **Prerequisites**: Web basics
    - **Time**: 2 hours
    - **Resources**: `[███░░░░░░░]` 30%

11. **[traefik-setup](traefik-setup)** - Modern cloud-native proxy
    - Why Traefik vs Nginx
    - Docker installation
    - Static vs dynamic config
    - Provider setup
    - Dashboard access
    - **Prerequisites**: Docker basics
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40% - 512MB RAM

12. **[traefik-docker-routing](traefik-docker-routing)** - Auto service discovery
    - Docker provider
    - Labels-based routing
    - Dynamic service discovery
    - Multiple domains
    - Path-based routing
    - **Prerequisites**: Traefik basics
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

13. **[traefik-ssl-automation](traefik-ssl-automation)** - Let's Encrypt integration
    - ACME protocol
    - HTTP-01 challenge
    - DNS-01 challenge (wildcard)
    - Certificate storage
    - Auto-renewal
    - **Prerequisites**: Traefik routing
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50%

14. **[traefik-middleware](traefik-middleware)** - Request processing
    - Basic auth
    - Forward auth (SSO)
    - Rate limiting
    - IP whitelisting
    - Headers manipulation
    - Redirect schemes
    - **Prerequisites**: Traefik proficiency
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

15. **[nginx-alternative](nginx-alternative)** - Traditional reverse proxy
    - Nginx setup
    - Virtual hosts
    - SSL configuration
    - Load balancing
    - Caching
    - **Prerequisites**: Web basics
    - **Time**: 4-5 hours
    - **Resources**: `[█████░░░░░]` 50%

### 🔴 Phase 4: DNS & Certificates (Infrastructure Services)

16. **[pihole-setup](pihole-setup)** - Network-wide ad blocking DNS
    - Pi-hole installation
    - DNS server configuration
    - Adblock lists
    - Local DNS records
    - DHCP integration
    - **Prerequisites**: DNS basics
    - **Time**: 2-3 hours
    - **Resources**: `[███░░░░░░░]` 30% - 512MB RAM

17. **[local-dns-records](local-dns-records)** - Internal DNS management
    - Split-horizon DNS
    - Local domain setup
    - Internal service discovery
    - DNS-based service routing
    - **Prerequisites**: DNS understanding
    - **Time**: 2 hours
    - **Resources**: `[███░░░░░░░]` 30%

18. **[letsencrypt-automation](letsencrypt-automation)** - Free SSL certificates
    - Certbot setup
    - Manual certificate generation
    - Automatic renewal
    - DNS plugins
    - Wildcard certificates
    - **Prerequisites**: SSL understanding
    - **Time**: 3-4 hours
    - **Resources**: `[████░░░░░░]` 40%

19. **[certificate-management](certificate-management)** - Production cert handling
    - Certificate lifecycle
    - Monitoring expiration
    - Rotation strategies
    - Certificate pinning
    - **Prerequisites**: Cert experience
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50%

### ⚫ Phase 5: Advanced & Production (High Availability)

20. **[load-balancing-algorithms](load-balancing-algorithms)** - Distribution strategies
    - Round-robin
    - Least connections
    - IP hash
    - Weighted algorithms
    - Health checks
    - **Prerequisites**: Proxy experience
    - **Time**: 3 hours
    - **Resources**: `[██████░░░░]` 60%

21. **[haproxy-setup](haproxy-setup)** - Enterprise load balancer
    - HAProxy installation
    - Frontend/backend config
    - ACLs and routing
    - SSL termination
    - Statistics dashboard
    - **Prerequisites**: Load balancing concepts
    - **Time**: 4-5 hours
    - **Resources**: `[███████░░░]` 70%

22. **[service-mesh-concepts](service-mesh-concepts)** - Modern microservices networking
    - What is a service mesh
    - Sidecar pattern
    - mTLS between services
    - Traffic management
    - Observability integration
    - **Prerequisites**: k8s basics
    - **Time**: 3-4 hours
    - **Resources**: `[████████░░]` 80%

23. **[vpn-integration](vpn-integration)** - Private network access
    - VPN for homelab access
    - WireGuard integration
    - Split tunneling
    - VPN + reverse proxy
    - **Prerequisites**: VPN basics (security section)
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

24. **[network-performance](network-performance)** - Optimization
    - Bandwidth testing
    - Latency optimization
    - TCP tuning
    - Connection pooling
    - CDN concepts
    - **Prerequisites**: Production experience
    - **Time**: 4-5 hours
    - **Resources**: `[███████░░░]` 70%

## 🔗 What Comes Next?

After mastering networking:

**For Containers**:
- **[kb/containers/docker-networking](../containers/docker-networking)** - Container networks

**For Security**:
- **[kb/security/wireguard-vpn](../security/wireguard-vpn)** - VPN setup
- **[kb/security/firewall-hardening](../security/firewall-hardening)** - Security

**For Observability**:
- **[kb/observability/network-monitoring](../observability/network-monitoring)** - Monitor traffic

**For Cloud**:
- **[kb/cloud/object-storage-networking](../cloud/object-storage-networking)** - Storage networking

## 📊 Resource Requirements

**Traefik**:
- **Minimal**: 256MB RAM, 1 CPU `[██░░░░░░░░]` 20%
- **Production**: 512MB RAM, 1 CPU `[███░░░░░░░]` 30%

**Pi-hole**:
- **Single Network**: 512MB RAM, 1 CPU `[███░░░░░░░]` 30%
- **Large Network**: 1GB RAM, 1 CPU `[████░░░░░░]` 40%

**HAProxy**:
- **Small**: 512MB RAM, 2 CPU `[████░░░░░░]` 40%
- **Enterprise**: 2-4GB RAM, 4 CPU `[███████░░░]` 70%

**Complete Networking Stack** (Traefik + Pi-hole + Monitoring):
- **Homelab**: 1-2GB RAM `[████░░░░░░]` 40%
- **Small Production**: 4-6GB RAM `[██████░░░░]` 60%

**Learning Time Investment**:
- **Network Fundamentals**: 2-3 weeks `[████░░░░░░]` 40%
- **Reverse Proxies**: 2 weeks `[█████░░░░░]` 50%
- **Advanced**: 1-2 months `[███████░░░]` 70%
- **Production Mastery**: 6-12 months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**Reverse Proxy** (Pick ONE):
- **Traefik** `[█████████░]` 90% - Modern, auto-config
- **Nginx** `[████████░░]` 80% - Traditional, powerful
- **Caddy** `[███████░░░]` 70% - Simplest, auto-SSL
- **HAProxy** `[██████░░░░]` 60% - Enterprise, performance

**DNS**:
- **Pi-hole** `[█████████░]` 90% - Adblocking + DNS
- **Unbound** `[███████░░░]` 70% - Recursive DNS
- **CoreDNS** `[██████░░░░]` 60% - k8s-native

**Firewall**:
- **nftables** `[████████░░]` 80% - Modern replacement
- **iptables** `[████████░░]` 80% - Traditional, stable
- **UFW** `[███████░░░]` 70% - User-friendly wrapper

**SSL Certificates**:
- **Let's Encrypt** `[██████████]` Required - Free CA
- **Certbot** `[█████████░]` 90% - ACME client
- **Traefik ACME** `[████████░░]` 80% - Built-in

**Monitoring**:
- **Grafana + Prometheus** `[█████████░]` 90% - Network metrics
- **Netdata** `[████████░░]` 80% - Real-time

## 💡 Pro Tips for Networking

1. **Document Your Network**: IP ranges, VLANs, firewall rules
2. **DNS is Critical**: Local DNS makes everything easier
3. **Let's Encrypt is Free**: No excuse for self-signed certs
4. **Reverse Proxy Everything**: Single entry point, easier management
5. **Monitor Network**: Know your baseline, detect anomalies
6. **Test Firewall Rules**: Block everything, open incrementally
7. **Use VLANs**: Segment IoT, servers, management
8. **Plan IP Addressing**: Leave room for growth
9. **Automate Certificate Renewal**: Never let certs expire
10. **Keep It Simple**: Complexity is the enemy of security

## 🔄 Common Networking Pitfalls

**Pitfall 1: No Firewall**
- Everything exposed to internet
- **Fix**: Default deny, whitelist only needed ports

**Pitfall 2: Expired Certificates**
- Manual renewal forgotten, services down
- **Fix**: Automate with Traefik or Certbot

**Pitfall 3: DNS Misconfiguration**
- Services unreachable, hard to debug
- **Fix**: Test DNS with dig, use local DNS server

**Pitfall 4: Port Confusion**
- Services on wrong ports, conflicts
- **Fix**: Document port assignments, use standard ports when possible

**Pitfall 5: Single Point of Failure**
- One proxy/DNS server down = everything down
- **Fix**: HA setup for critical services

**Pitfall 6: No Network Segmentation**
- IoT devices on same network as servers
- **Fix**: VLANs, separate networks

**Pitfall 7: Overcomplicating**
- Too many layers, hard to troubleshoot
- **Fix**: Start simple, add complexity only when needed

**Pitfall 8: Ignoring IPv6**
- Future-proofing neglected
- **Fix**: Learn IPv6 basics, dual-stack where possible

## 🔗 Related KB Sections

- **[kb/basics/](../basics/)** - Linux fundamentals, SSH
- **[kb/containers/](../containers/)** - Docker networking
- **[kb/security/](../security/)** - VPN, firewalls, Zero Trust
- **[kb/observability/](../observability/)** - Network monitoring
- **[kb/cloud/](../cloud/)** - Cloud networking patterns

## 📝 Change Log

### 2026-01-30
- Created networking directory structure
- Defined complete learning path from TCP/IP to service mesh
- Established Traefik as modern reverse proxy choice
- Listed all planned articles with time estimates
- Added resource requirements for networking tools
- Emphasized self-hosted DNS and certificate automation
- Organized by learning phases (1-5)
- Added tool recommendations with popularity ratings
- Cross-referenced related KB sections
- Included production networking patterns

---

**🌐 Remember**: Networking is the foundation of everything! Master TCP/IP fundamentals first, then learn modern reverse proxies like Traefik for automatic SSL and service routing. Pi-hole for DNS + Let's Encrypt for free certificates = production-ready homelab networking!

