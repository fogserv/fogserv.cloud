# Infrastructure as Code - Overview

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Infrastructure Automation  
**Prerequisites**: [kb/basics/](../basics/), [kb/containers/docker-basics](../containers/docker-basics)  
**Tags**: infrastructure-as-code, iac, automation, ansible, terraform, configuration-management

## Summary

Complete learning path for Infrastructure as Code (IaC), from manual server setup through declarative automation with Ansible and Terraform. Teaches "why automate," progression from scripts to proper IaC, and self-hosted infrastructure patterns.

## 🎯 Learning Philosophy

**Manual First, Automate Second**:
```
Manual Setup → Scripts → Ansible → Terraform → GitOps
 (Understand)   (Repeat)  (Config)   (Infra)   (Production)
```

This directory teaches **why** infrastructure automation matters before **how** to implement it. You'll learn manual processes first to understand what you're automating, then progress through increasingly sophisticated automation tools.

## 📚 Learning Path

```
Prerequisites: Linux Basics + Docker
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: Manual Infrastructure        │
│  ├─ Manual server provisioning         │
│  ├─ Manual configuration               │
│  ├─ Understanding pain points          │
│  ├─ When automation helps              │
│  └─ Documentation as code              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Shell Script Automation      │
│  ├─ Server setup scripts               │
│  ├─ Configuration management via bash  │
│  ├─ Limitations of shell scripts       │
│  └─ Why proper tools matter            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Ansible (Configuration Mgmt) │
│  ├─ Ansible basics                     │
│  ├─ Playbooks and roles                │
│  ├─ Inventory management               │
│  ├─ Idempotent operations              │
│  └─ Real-world patterns                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: Terraform (Infrastructure)   │
│  ├─ Terraform fundamentals             │
│  ├─ State management                   │
│  ├─ Providers (Proxmox, AWS, etc)      │
│  ├─ Modules and workspaces             │
│  └─ Infrastructure patterns            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Advanced Patterns            │
│  ├─ Cloud-Init for VMs                 │
│  ├─ Immutable infrastructure           │
│  ├─ GitOps workflows                   │
│  ├─ Testing infrastructure             │
│  └─ Production patterns                │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: Manual Infrastructure (Understanding)

**Why Start Manual?**:
1. **[manual-server-setup](manual-server-setup)** - Complete manual VM/server provisioning
   - Ubuntu Server installation
   - Network configuration
   - User management
   - Package installation
   - Service setup
   - **Prerequisites**: Linux basics
   - **Time**: 4-6 hours
   - **Resources**: `[█████░░░░░]` 50% - Test VM

2. **[documentation-as-code](documentation-as-code)** - Runbooks and documentation
   - Why documentation matters
   - Runbook templates
   - Markdown-based docs
   - Keeping docs in sync with reality
   - **Prerequisites**: Manual setup experience
   - **Time**: 2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

3. **[why-infrastructure-as-code](why-infrastructure-as-code)** - The case for automation
   - Pain points of manual ops
   - Benefits of IaC
   - When to automate
   - When NOT to automate
   - Choosing the right tool
   - **Prerequisites**: Manual experience
   - **Time**: 1 hour
   - **Resources**: `[█░░░░░░░░░]` 10% - Conceptual

### 🟡 Phase 2: Shell Script Automation (First Steps)

4. **[bash-provisioning-scripts](bash-provisioning-scripts)** - Server setup with bash
   - User creation scripts
   - Package installation scripts
   - Configuration file templates
   - Limitations and problems
   - **Prerequisites**: Bash scripting
   - **Time**: 3-4 hours
   - **Resources**: `[████░░░░░░]` 40%

5. **[from-scripts-to-config-mgmt](from-scripts-to-config-mgmt)** - Why bash isn't enough
   - Idempotency problem
   - Error handling challenges
   - State management
   - Introduction to declarative tools
   - **Prerequisites**: Bash scripting experience
   - **Time**: 2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

### 🟠 Phase 3: Ansible (Configuration Management)

6. **[ansible-basics](ansible-basics)** - Introduction to Ansible
   - What is Ansible
   - Control node + managed nodes
   - SSH-based, agentless architecture
   - First playbook
   - **Prerequisites**: SSH basics
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

7. **[ansible-inventory](ansible-inventory)** - Managing hosts
   - Static vs dynamic inventory
   - Host groups
   - Variables and group_vars
   - Inventory patterns
   - **Prerequisites**: Ansible basics
   - **Time**: 2-3 hours
   - **Resources**: `[████░░░░░░]` 40%

8. **[ansible-playbooks](ansible-playbooks)** - Ansible playbooks deep dive
   - Playbook structure
   - Tasks and handlers
   - Templates (Jinja2)
   - Variables and facts
   - Conditionals and loops
   - **Prerequisites**: Ansible basics
   - **Time**: 4-6 hours
   - **Resources**: `[██████░░░░]` 60%

9. **[ansible-roles](ansible-roles)** - Reusable Ansible roles
   - What are roles
   - Role directory structure
   - Creating custom roles
   - Using Ansible Galaxy
   - Role dependencies
   - **Prerequisites**: Ansible playbooks
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

10. **[ansible-patterns](ansible-patterns)** - Real-world Ansible
    - Web server stack automation
    - Database server provisioning
    - User management across fleet
    - Security hardening playbooks
    - Docker host configuration
    - **Prerequisites**: Ansible roles
    - **Time**: 6-8 hours
    - **Resources**: `[███████░░░]` 70%

### 🔴 Phase 4: Terraform (Infrastructure Provisioning)

11. **[terraform-basics](terraform-basics)** - Introduction to Terraform
    - What is Terraform
    - HCL syntax
    - Providers
    - Resources
    - First infrastructure
    - **Prerequisites**: Infrastructure concepts
    - **Time**: 4-5 hours
    - **Resources**: `[██████░░░░]` 60%

12. **[terraform-state](terraform-state)** - State management
    - What is state
    - Local vs remote state
    - State backends (S3, Terraform Cloud)
    - State locking
    - Importing existing resources
    - **Prerequisites**: Terraform basics
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

13. **[terraform-modules](terraform-modules)** - Reusable infrastructure
    - Creating modules
    - Module inputs/outputs
    - Module registry
    - Versioning modules
    - Module patterns
    - **Prerequisites**: Terraform basics
    - **Time**: 4-5 hours
    - **Resources**: `[██████░░░░]` 60%

14. **[terraform-proxmox](terraform-proxmox)** - Homelab infrastructure with Proxmox
    - Proxmox provider setup
    - Creating VMs with Terraform
    - Networking configuration
    - Cloud-init integration
    - Complete homelab stack
    - **Prerequisites**: Terraform basics, Proxmox
    - **Time**: 5-6 hours
    - **Resources**: `[████████░░]` 80%

15. **[terraform-workspaces](terraform-workspaces)** - Multiple environments
    - Dev/staging/prod separation
    - Workspace strategies
    - Variable management per environment
    - **Prerequisites**: Terraform modules
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50%

### ⚫ Phase 5: Advanced Patterns (Production-Ready)

16. **[cloud-init-basics](cloud-init-basics)** - VM initialization
    - What is Cloud-Init
    - User-data vs meta-data
    - Cloud-config syntax
    - Package installation
    - Running scripts on first boot
    - **Prerequisites**: Linux basics
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

17. **[cloud-init-advanced](cloud-init-advanced)** - Advanced Cloud-Init
    - Network configuration
    - Disk partitioning
    - Cloud-init modules
    - Debugging cloud-init
    - Integration with Terraform
    - **Prerequisites**: Cloud-init basics
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

18. **[immutable-infrastructure](immutable-infrastructure)** - Immutable servers
    - What is immutable infrastructure
    - Benefits and tradeoffs
    - Packer for image building
    - Deployment strategies
    - Container vs VM immutability
    - **Prerequisites**: IaC experience
    - **Time**: 3-4 hours
    - **Resources**: `[███████░░░]` 70%

19. **[gitops-infrastructure](gitops-infrastructure)** - GitOps for infrastructure
    - GitOps principles
    - Git as source of truth
    - PR-based infrastructure changes
    - Automated testing
    - Rollback strategies
    - Cross-reference: [kb/gitops/](../gitops/)
    - **Prerequisites**: Git, IaC tools
    - **Time**: 4-5 hours
    - **Resources**: `[███████░░░]` 70%

20. **[testing-infrastructure](testing-infrastructure)** - Testing IaC
    - Why test infrastructure
    - Terraform plan validation
    - Ansible lint and testing
    - Test-Kitchen for Ansible
    - Terratest for Terraform
    - **Prerequisites**: IaC proficiency
    - **Time**: 4-6 hours
    - **Resources**: `[████████░░]` 80%

21. **[secrets-in-iac](secrets-in-iac)** - Managing secrets safely
    - Never commit secrets to Git
    - Ansible Vault
    - Terraform sensitive variables
    - External secret stores (Vault)
    - Environment variables
    - Cross-reference: [kb/sysadmin/secrets](../sysadmin/secrets)
    - **Prerequisites**: IaC basics
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

## 🔗 What Comes Next?

After mastering IaC:

**For Container Orchestration**:
- **[kb/containers/k0s-installation](../containers/k0s-installation)** - Automate k0s with Ansible
- **[kb/containers/k0s-multi-node](../containers/k0s-multi-node)** - Terraform + Ansible for clusters

**For CI/CD Integration**:
- **[kb/cicd/forgejo-setup](../cicd/forgejo-setup)** - Self-hosted Git with IaC
- **[kb/cicd/woodpecker-ci](../cicd/woodpecker-ci)** - CI/CD for infrastructure
- **[kb/cicd/gitops-deployment](../cicd/gitops-deployment)** - GitOps pipelines

**For Security**:
- **[kb/security/hardening-automation](../security/hardening-automation)** - Automated security
- **[kb/security/compliance-as-code](../security/compliance-as-code)** - Policy as code

**For Observability**:
- **[kb/observability/monitoring-automation](../observability/monitoring-automation)** - Deploy monitoring with IaC

## 📊 Resource Requirements

**Ansible Control Node**:
- **Minimal**: 1GB RAM, 1 CPU `[██░░░░░░░░]` 20%
- **Comfortable**: 2GB RAM, 2 CPU `[███░░░░░░░]` 30%

**Terraform Workstation**:
- **Minimal**: 2GB RAM, 2 CPU `[███░░░░░░░]` 30%
- **Large Infrastructure**: 4GB RAM, 4 CPU `[█████░░░░░]` 50%

**Lab Environment**:
- **Minimal** (2-3 test VMs): 8GB RAM `[████░░░░░░]` 40%
- **Comfortable** (5-6 VMs): 16GB RAM `[██████░░░░]` 60%
- **Full Lab** (10+ VMs): 32GB RAM `[████████░░]` 80%

**Learning Time Investment**:
- **Manual Setup**: 1 week `[███░░░░░░░]` 30%
- **Bash Automation**: 1-2 weeks `[████░░░░░░]` 40%
- **Ansible Basics**: 2-3 weeks `[██████░░░░]` 60%
- **Terraform Basics**: 2-3 weeks `[██████░░░░]` 60%
- **Production Patterns**: 2-3 months `[█████████░]` 90%
- **IaC Mastery**: 6-12 months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**Essential Tools**:
- **Ansible** `[██████████]` Required - Configuration management
- **Terraform** `[█████████░]` 90% - Infrastructure provisioning
- **Git** `[██████████]` Required - Version control

**Helpful Tools**:
- **Packer** `[███████░░░]` 70% - Image building
- **Cloud-Init** `[████████░░]` 80% - VM initialization
- **Vagrant** `[█████░░░░░]` 50% - Local testing
- **Molecule** `[██████░░░░]` 60% - Ansible testing
- **Terratest** `[█████░░░░░]` 50% - Terraform testing

**Self-Hosted Alternatives**:
- **Forgejo** `[████████░░]` 80% - Git hosting (vs GitHub)
- **Woodpecker CI** `[███████░░░]` 70% - CI/CD (vs Jenkins)
- **Gitea** `[███████░░░]` 70% - Lightweight Git (vs GitLab)

## 💡 Pro Tips for IaC

1. **Start Small**: Automate one server before automating fleet
2. **Version Everything**: Git is mandatory for IaC
3. **Test Locally First**: Use VMs before touching production
4. **Idempotency Matters**: Run twice, same result
5. **Document Assumptions**: What OS? What versions? What prerequisites?
6. **Use Modules/Roles**: Don't repeat yourself
7. **Separate Environments**: Dev/staging/prod in separate states/inventories
8. **Never Commit Secrets**: Use vaults or external secret management
9. **Plan Before Apply**: Review changes before execution
10. **Keep It Simple**: Complex != Better. Simple and working > Clever and broken

## 🔄 Common Learning Pitfalls

**Pitfall 1: Automating Before Understanding**
- Writing Ansible before manual setup
- **Fix**: Do manual first, understand the process, then automate

**Pitfall 2: Over-Engineering**
- Creating overly complex abstractions too early
- **Fix**: Start simple, add complexity only when needed

**Pitfall 3: Not Testing**
- Running against production without testing
- **Fix**: Always test in lab environment first

**Pitfall 4: Ignoring Idempotency**
- Scripts that break when run twice
- **Fix**: Design for repeated execution

**Pitfall 5: Hard-Coding Values**
- Server IPs, passwords in playbooks/modules
- **Fix**: Use variables and external secrets

**Pitfall 6: No Version Control**
- Editing files directly on control node
- **Fix**: Everything in Git, always

**Pitfall 7: Shared State Without Locking**
- Multiple people running Terraform simultaneously
- **Fix**: Use remote state with locking

**Pitfall 8: Forgetting Documentation**
- Code without explanation of why
- **Fix**: Add comments and maintain README files

## 🔗 Related KB Sections

- **[kb/basics/bash-scripting](../basics/bash-scripting)** - Shell automation prerequisite
- **[kb/containers/](../containers/)** - Deploying Docker/k0s with IaC
- **[kb/cicd/](../cicd/)** - CI/CD for infrastructure code
- **[kb/security/](../security/)** - Security automation
- **[kb/gitops/](../gitops/)** - GitOps workflows
- **[kb/sysadmin/](../sysadmin/)** - System administration context

## 📝 Change Log

### 2026-01-30
- Created infrastructure directory structure
- Defined complete learning path from manual to GitOps
- Established manual-first philosophy
- Listed all planned articles with time estimates
- Added resource requirements for each phase
- Included both Ansible and Terraform tracks
- Organized by learning phases (1-5)
- Added tool recommendations and common pitfalls
- Cross-referenced related KB sections
- Emphasized self-hosted alternatives

---

**🏗️ Remember**: Infrastructure as Code isn't about tools—it's about treating infrastructure like software. Version controlled, tested, reviewed, and automated. Start manual to understand, then automate for scale!
