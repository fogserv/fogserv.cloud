# Security - From Basics to Zero Trust

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Security & Compliance  
**Prerequisites**: [kb/basics/](../basics/), [kb/sysadmin/](../sysadmin/)  
**Tags**: security, zero-trust, hardening, encryption, compliance, self-hosted, vault

## Summary

Complete security learning path from password management through Zero Trust architecture. Focused on practical, self-hosted security tools and patterns for homelabs and small-medium infrastructure.

## 🎯 Learning Philosophy

**Security in Layers - Defense in Depth**:
```
Passwords → SSH → Firewall → TLS → Secrets → Zero Trust
 (User)     (Access) (Network)  (Transit) (Storage) (Architecture)
```

This directory teaches security assuming **basic system knowledge** but no prior security expertise. Progressive hardening from individual systems through complete infrastructure security.

## 📚 Learning Path

```
Prerequisites: Linux & Networking Basics
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: Foundation Security          │
│  ├─ Password management                │
│  ├─ 2FA/MFA basics                     │
│  ├─ SSH hardening                      │
│  ├─ User account security              │
│  └─ Security mindset                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Network Security             │
│  ├─ Firewall basics (iptables/nftables)│
│  ├─ Fail2ban intrusion prevention      │
│  ├─ VPN setup (WireGuard)              │
│  ├─ Network segmentation               │
│  └─ Port scanning & monitoring         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Encryption & TLS             │
│  ├─ Certificate fundamentals           │
│  ├─ Let's Encrypt automation           │
│  ├─ TLS/SSL configuration              │
│  ├─ Disk encryption (LUKS)             │
│  └─ Encrypted backups                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: Secret & Access Management   │
│  ├─ HashiCorp Vault setup              │
│  ├─ Dynamic secrets                    │
│  ├─ Secret rotation                    │
│  ├─ RBAC (Role-Based Access Control)   │
│  └─ Identity management basics         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Advanced & Zero Trust        │
│  ├─ Container security                 │
│  ├─ Image scanning (Trivy)             │
│  ├─ Service mesh mTLS                  │
│  ├─ Zero Trust principles              │
│  ├─ Policy as Code (OPA)               │
│  └─ Compliance automation              │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: Foundation Security (Start Here)

**Personal Security First**:
1. **[password-management](password-management)** - Strong password practices
   - Password managers (Bitwarden self-hosted)
   - Passphrase generation
   - Password rotation policies
   - Recovery strategies
   - **Prerequisites**: None
   - **Time**: 1-2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

2. **[two-factor-authentication](two-factor-authentication)** - MFA everywhere
   - TOTP basics (Authenticator apps)
   - Hardware keys (YubiKey)
   - Backup codes
   - MFA on all services
   - **Prerequisites**: Password management
   - **Time**: 2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

3. **[ssh-security-hardening](ssh-security-hardening)** - Secure SSH access
   - Disable password authentication
   - Key-only access
   - SSH config hardening
   - Port knocking
   - Bastion hosts
   - Cross-reference: [kb/basics/ssh-basics](../basics/ssh-basics)
   - **Prerequisites**: SSH basics
   - **Time**: 2-3 hours
   - **Resources**: `[███░░░░░░░]` 30%

4. **[user-account-security](user-account-security)** - Secure user management
   - Principle of least privilege
   - sudo configuration
   - Disabling root login
   - Account auditing
   - **Prerequisites**: Linux user management
   - **Time**: 2 hours
   - **Resources**: `[███░░░░░░░]` 30%

### 🟡 Phase 2: Network Security (Perimeter Defense)

5. **[firewall-basics](firewall-basics)** - iptables and nftables
   - Firewall fundamentals
   - iptables rules
   - nftables (modern alternative)
   - Default deny policy
   - Common port configurations
   - **Prerequisites**: Networking basics
   - **Time**: 3-4 hours
   - **Resources**: `[████░░░░░░]` 40%

6. **[fail2ban-setup](fail2ban-setup)** - Automated intrusion prevention
   - Installing fail2ban
   - SSH protection
   - Custom filters and jails
   - Email alerts
   - **Prerequisites**: Firewall basics
   - **Time**: 2-3 hours
   - **Resources**: `[███░░░░░░░]` 30%

7. **[wireguard-vpn](wireguard-vpn)** - Modern VPN setup
   - WireGuard installation
   - Peer configuration
   - Road warrior setup
   - Site-to-site VPN
   - DNS configuration
   - **Prerequisites**: Networking concepts
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

8. **[network-segmentation](network-segmentation)** - VLAN and isolation
   - Network segmentation benefits
   - VLAN basics
   - DMZ setup
   - Firewall zones
   - Isolating services
   - **Prerequisites**: Advanced networking
   - **Time**: 4-5 hours
   - **Resources**: `[██████░░░░]` 60%

9. **[intrusion-detection](intrusion-detection)** - Monitoring for attacks
   - Port scan detection
   - Log analysis
   - OSSEC/Wazuh basics
   - Security alerts
   - **Prerequisites**: Network monitoring
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

### 🟠 Phase 3: Encryption & TLS (Data Protection)

10. **[certificate-fundamentals](certificate-fundamentals)** - PKI basics
    - X.509 certificates explained
    - Certificate authorities (CA)
    - Certificate signing requests (CSR)
    - Self-signed vs CA-signed
    - Certificate chains
    - **Prerequisites**: Cryptography basics
    - **Time**: 2-3 hours
    - **Resources**: `[███░░░░░░░]` 30%

11. **[letsencrypt-automation](letsencrypt-automation)** - Free TLS certificates
    - Let's Encrypt explained
    - Certbot installation
    - DNS-01 challenge
    - Wildcard certificates
    - Auto-renewal
    - **Prerequisites**: Certificate fundamentals
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

12. **[tls-configuration](tls-configuration)** - Secure web servers
    - TLS versions and ciphers
    - Perfect Forward Secrecy
    - HSTS configuration
    - SSL Labs A+ rating
    - Nginx/Apache TLS
    - **Prerequisites**: Web server basics
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

13. **[disk-encryption-luks](disk-encryption-luks)** - Encrypt at rest
    - LUKS explained
    - Full disk encryption
    - Encrypted volumes
    - Key management
    - Remote unlock (Dropbear)
    - **Prerequisites**: Linux storage
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

14. **[encrypted-backups](encrypted-backups)** - Secure backup strategies
    - Encryption at rest
    - Borgbackup setup
    - Restic alternative
    - Offsite encrypted backups
    - Recovery testing
    - **Prerequisites**: Backup basics
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

### 🔴 Phase 4: Secret & Access Management (Identity)

15. **[vault-introduction](vault-introduction)** - HashiCorp Vault basics
    - Why Vault?
    - Vault architecture
    - Installation (docker-compose)
    - Initialization and unsealing
    - **Prerequisites**: Docker basics
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

16. **[vault-secrets](vault-secrets)** - Storing and retrieving secrets
    - KV secrets engine
    - Dynamic secrets
    - Database credentials
    - API integration
    - **Prerequisites**: Vault basics
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

17. **[vault-authentication](vault-authentication)** - Vault auth methods
    - Token authentication
    - AppRole for automation
    - LDAP/AD integration
    - Kubernetes auth
    - **Prerequisites**: Vault setup
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

18. **[rbac-basics](rbac-basics)** - Role-Based Access Control
    - RBAC principles
    - Policies and roles
    - Least privilege
    - Audit logging
    - **Prerequisites**: Security concepts
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

19. **[identity-management](identity-management)** - Centralized identity
    - SSO concepts
    - Keycloak setup
    - LDAP integration
    - OAuth2/OIDC
    - **Prerequisites**: Auth concepts
    - **Time**: 4-5 hours
    - **Resources**: `[███████░░░]` 70%

### ⚫ Phase 5: Advanced & Zero Trust (Enterprise)

20. **[container-security](container-security)** - Securing Docker
    - Container isolation
    - User namespaces
    - Read-only containers
    - Capabilities and seccomp
    - AppArmor/SELinux profiles
    - **Prerequisites**: Docker proficiency
    - **Time**: 4-5 hours
    - **Resources**: `[██████░░░░]` 60%

21. **[image-scanning](image-scanning)** - Vulnerability scanning
    - Trivy installation
    - Scanning Docker images
    - CI/CD integration
    - Harbor with Trivy
    - Remediation workflows
    - **Prerequisites**: Docker, CI/CD
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50%

22. **[service-mesh-security](service-mesh-security)** - mTLS with Linkerd
    - Service mesh concepts
    - Linkerd mTLS
    - Zero Trust networking
    - Traffic policies
    - **Prerequisites**: k0s cluster
    - **Time**: 4-5 hours
    - **Resources**: `[████████░░]` 80%

23. **[zero-trust-principles](zero-trust-principles)** - Never trust, always verify
    - Zero Trust explained
    - Micro-segmentation
    - Identity-based access
    - Continuous verification
    - Implementation roadmap
    - **Prerequisites**: Advanced security
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50% - Conceptual

24. **[policy-as-code](policy-as-code)** - Open Policy Agent (OPA)
    - Policy as Code benefits
    - OPA introduction
    - Rego language basics
    - Kubernetes admission control
    - CI/CD policy enforcement
    - **Prerequisites**: Programming basics
    - **Time**: 4-6 hours
    - **Resources**: `[███████░░░]` 70%

25. **[compliance-automation](compliance-automation)** - CIS, PCI-DSS, etc.
    - Compliance frameworks
    - Automated scanning (OpenSCAP)
    - InSpec tests
    - Audit logging
    - Reporting
    - **Prerequisites**: Security mastery
    - **Time**: 4-6 hours
    - **Resources**: `[████████░░]` 80%

## 🔗 What Comes Next?

After mastering security:

**For Infrastructure**:
- **[kb/infrastructure/secrets-in-iac](../infrastructure/secrets-in-iac)** - Secure IaC
- **[kb/infrastructure/hardening-automation](../infrastructure/hardening-automation)** - Automated hardening

**For Containers**:
- **[kb/containers/k0s-security](../containers/k0s-security)** - Kubernetes security
- **[kb/containers/pod-security](../containers/pod-security)** - Pod security standards

**For CI/CD**:
- **[kb/cicd/secrets-management](../cicd/secrets-management)** - Secrets in pipelines
- **[kb/cicd/security-scanning](../cicd/security-scanning)** - Scanning in CI

**For Observability**:
- **[kb/observability/security-monitoring](../observability/security-monitoring)** - Security metrics

## 📊 Resource Requirements

**Password Manager** (Bitwarden self-hosted):
- **Minimal**: 512MB RAM, 1 CPU `[██░░░░░░░░]` 20%
- **Comfortable**: 1GB RAM, 1 CPU `[███░░░░░░░]` 30%

**Firewall/Fail2ban**:
- **Overhead**: <100MB RAM `[█░░░░░░░░░]` 10%

**HashiCorp Vault**:
- **Development**: 512MB RAM, 1 CPU `[███░░░░░░░]` 30%
- **Production**: 2GB RAM, 2 CPU, HA cluster `[███████░░░]` 70%

**Full Security Stack**:
- **Homelab**: 4GB RAM `[█████░░░░░]` 50%
- **Small Team**: 8GB RAM `[███████░░░]` 70%
- **Production**: 16GB+ RAM `[█████████░]` 90%

**Learning Time Investment**:
- **Foundation Security**: 1-2 weeks `[████░░░░░░]` 40%
- **Network Security**: 2-3 weeks `[█████░░░░░]` 50%
- **Encryption & TLS**: 2-3 weeks `[█████░░░░░]` 50%
- **Secret Management**: 3-4 weeks `[██████░░░░]` 60%
- **Zero Trust**: 2-3 months `[████████░░]` 80%
- **Security Mastery**: 12+ months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**Essential Tools**:
- **Bitwarden** `[████████░░]` 80% - Password manager
- **iptables/nftables** `[██████████]` Required - Firewall
- **Fail2ban** `[████████░░]` 80% - Intrusion prevention
- **Let's Encrypt** `[██████████]` Required - Free TLS

**Secret Management**:
- **HashiCorp Vault** `[█████████░]` 90% - Industry standard
- **SOPS** `[██████░░░░]` 60% - Encrypted files alternative
- **Sealed Secrets** `[███████░░░]` 70% - Kubernetes secrets

**Security Tools**:
- **Trivy** `[████████░░]` 80% - Vulnerability scanning
- **OpenSCAP** `[██████░░░░]` 60% - Compliance scanning
- **OPA** `[███████░░░]` 70% - Policy as Code
- **Wazuh** `[██████░░░░]` 60% - SIEM/IDS

**Self-Hosted Alternatives**:
- **WireGuard** `[█████████░]` 90% - vs commercial VPN
- **Keycloak** `[████████░░]` 80% - vs Auth0/Okta
- **Harbor** `[████████░░]` 80% - Registry with scanning

## 💡 Pro Tips for Security

1. **Defense in Depth**: Never rely on single layer
2. **Least Privilege**: Minimum permissions needed, always
3. **Assume Breach**: Plan for when, not if, compromised
4. **Automate Hardening**: Manual security = eventual mistakes
5. **Audit Everything**: Logs, logs, logs - then monitor
6. **Test Restores**: Backups are useless until restored
7. **Update Regularly**: Patch management is security
8. **Encrypt by Default**: Transit and at rest, always
9. **Separate Secrets**: Never in code, never in Git
10. **Document Decisions**: Why you chose each security control

## 🔄 Common Security Pitfalls

**Pitfall 1: Security Through Obscurity**
- Relying on non-standard ports, hidden services
- **Fix**: Real security controls, assume discovery

**Pitfall 2: Weak Passwords**
- Human-memorable passwords, no MFA
- **Fix**: Password manager + 2FA everywhere

**Pitfall 3: No Backups**
- Ransomware = total loss
- **Fix**: 3-2-1 backup rule, test restores

**Pitfall 4: Secrets in Git**
- API keys, passwords committed
- **Fix**: Vault, encrypted secrets, git-secrets

**Pitfall 5: No Monitoring**
- Breached but don't know for months
- **Fix**: Log aggregation, alerts, SIEM

**Pitfall 6: Trusting Internal Network**
- No internal security
- **Fix**: Zero Trust, segment everything

**Pitfall 7: No Update Strategy**
- Old vulnerable software
- **Fix**: Automated patching, LTS versions

**Pitfall 8: Over-Permissive Access**
- Everyone is admin
- **Fix**: RBAC, least privilege

## 🔗 Related KB Sections

- **[kb/basics/ssh-basics](../basics/ssh-basics)** - SSH foundation
- **[kb/containers/](../containers/)** - Container security
- **[kb/infrastructure/](../infrastructure/)** - IaC security
- **[kb/cicd/](../cicd/)** - Pipeline security
- **[kb/sysadmin/dotenvx](../sysadmin/dotenvx)** - Environment secrets
- **[kb/networking/](../networking/)** - Network hardening

## 📝 Change Log

### 2026-01-30
- Created security directory structure
- Defined complete learning path from passwords to Zero Trust
- Established self-hosted security tool focus
- Listed all planned articles with time estimates
- Added resource requirements for security tools
- Emphasized practical, homelab-friendly approach
- Organized by learning phases (1-5)
- Added tool recommendations and alternatives
- Cross-referenced related KB sections
- Included compliance automation path

---

**🔒 Remember**: Security is not a product - it's a process. Layer defenses, assume breach, automate hardening, monitor everything, and never stop learning. Start with foundations (passwords, SSH, firewall) and build toward Zero Trust!

