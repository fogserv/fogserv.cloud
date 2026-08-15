# Day 1: New Developer Onboarding

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Basics - Onboarding  
**Prerequisites**: None (absolute beginner)  
**Time**: 4-8 hours (Day 1), 1-2 weeks (complete basics)  
**Tags**: onboarding, getting-started, beginner, checklist, tools, environment-setup

## Summary

Your complete first-day guide to server management and infrastructure work. This orchestrates all basics articles into a progressive learning path, gets your tools installed, and provides the foundation for everything else in the knowledge base.

## 🎯 What You'll Accomplish Today

By the end of Day 1, you'll have:
- ✅ Development environment configured
- ✅ SSH access to servers
- ✅ Basic Linux command proficiency
- ✅ Git repository access
- ✅ Understanding of next steps
- ✅ Confidence to explore further

## 🚀 The Learning Philosophy

**Zero to Productive**:
```
Complete Beginner → CLI Comfortable → Infrastructure Ready
(Day 1)            (Week 1)          (Month 1)
```

This knowledge base assumes **ZERO prior knowledge**. Every concept builds on previous ones. You can't break anything by following along - that's what test environments are for!

## 📋 Day 1 Checklist

### Morning: Environment Setup (2-3 hours)

#### 1. **Get Your Hardware Ready** ⏱️ 30 minutes

**Local Development Machine**:
- [ ] Windows, Mac, or Linux workstation
- [ ] 8GB+ RAM (16GB recommended)
- [ ] Stable internet connection
- [ ] Admin/sudo access to install software

**Optional but Helpful**:
- [ ] Second monitor (makes learning easier)
- [ ] External SSH access to a server (or use free tier: AWS, Azure, GCP)

---

#### 2. **Install Essential Tools** ⏱️ 1 hour

**Terminal Emulator**:
- [ ] **Windows**: Install [Windows Terminal](https://aka.ms/terminal) from Microsoft Store
- [ ] **Mac**: Built-in Terminal.app or install [iTerm2](https://iterm2.com/)
- [ ] **Linux**: Built-in terminal (GNOME Terminal, Konsole, etc.)

**SSH Client**:
- [ ] **Windows**: OpenSSH is built-in (Windows 10+), or install [PuTTY](https://www.putty.org/)
- [ ] **Mac/Linux**: openssh-client is already installed
- [ ] Test: Open terminal and run `ssh -V` - you should see version info

**Text Editor** (Pick ONE to start):
- [ ] **Visual Studio Code** `[██████████]` Recommended - Download from [code.visualstudio.com](https://code.visualstudio.com/)
  - Install "Remote - SSH" extension
  - Install "Docker" extension
- [ ] **Sublime Text** `[████████░░]` Alternative
- [ ] **nano** `[██████░░░░]` Already installed on most Linux systems (CLI only)

**Version Control**:
- [ ] Install **Git** - [git-scm.com](https://git-scm.com/downloads)
- [ ] Configure Git:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- [ ] Test: `git --version`

**Docker** (Optional for Day 1, but you'll need it soon):
- [ ] **Windows/Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [ ] **Linux**: Follow [official Docker installation](https://docs.docker.com/engine/install/)
- [ ] Test: `docker --version` and `docker ps`

---

#### 3. **Get Server Access** ⏱️ 30 minutes

**If you have a server**:
- [ ] Get SSH credentials from your team lead
- [ ] Get server IP address or hostname
- [ ] Generate SSH key pair (see below)
- [ ] Send public key to admin for server access

**If you're learning solo**:
- [ ] Option A: Use free cloud tier (AWS EC2 t2.micro, GCP e2-micro)
- [ ] Option B: Run VM locally (VirtualBox, VMware, Hyper-V)
- [ ] Option C: Use WSL2 on Windows as your "server"

**Generate SSH Key**:
```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "your.email@example.com"

# Accept default location (~/.ssh/id_ed25519)
# Set a strong passphrase (recommended)

# Display your public key to send to admin
cat ~/.ssh/id_ed25519.pub
```

**Test SSH Connection**:
```bash
# Replace user and hostname with your info
ssh username@server-ip-or-hostname

# Example:
ssh john@192.168.1.100
# or
ssh john@dev-server.example.com
```

---

### Afternoon: Linux Fundamentals (2-3 hours)

#### 4. **Master the Terminal** ⏱️ 2 hours

**START HERE**: Read [linux-fundamentals](linux-fundamentals)

**Key Concepts to Understand**:
- [ ] Directory structure (`/`, `/home`, `/etc`, `/var`)
- [ ] Navigation: `cd`, `pwd`, `ls`
- [ ] File operations: `cp`, `mv`, `rm`, `mkdir`
- [ ] Viewing files: `cat`, `less`, `head`, `tail`
- [ ] Permissions: `chmod`, `chown`, `ls -l`
- [ ] Process management: `ps`, `top`, `htop`, `kill`
- [ ] System services: `systemctl status`, `journalctl`

**Practice Exercises** (on your server):
```bash
# 1. Create a test directory
mkdir ~/learning
cd ~/learning

# 2. Create some test files
echo "Hello World" > test.txt
echo "Day 1 learning" > notes.txt

# 3. Check file permissions
ls -lh

# 4. Make a file executable
chmod +x test.txt

# 5. View system information
uname -a                    # System info
df -h                       # Disk usage
free -h                     # Memory usage
uptime                      # System uptime

# 6. Check running processes
ps aux | grep ssh           # Find SSH processes
top                         # Real-time process viewer (press q to quit)

# 7. View service status
systemctl status sshd       # SSH daemon status
journalctl -u sshd -n 20    # Last 20 SSH log entries
```

---

#### 5. **SSH Deep Dive** ⏱️ 1 hour

**READ**: [ssh-basics](ssh-basics)

**Key Concepts**:
- [ ] Public key authentication
- [ ] SSH config file (`~/.ssh/config`)
- [ ] SSH agent for key management
- [ ] Port forwarding / tunneling
- [ ] Security best practices

**Practice: Create SSH Config**:
```bash
# Edit your SSH config
nano ~/.ssh/config

# Add an entry (replace with your server details):
Host devserver
    HostName 192.168.1.100
    User your-username
    IdentityFile ~/.ssh/id_ed25519
    Port 22
    ServerAliveInterval 60

# Now you can connect with just:
ssh devserver
```

**Advanced SSH Tasks**:
```bash
# Copy files to server
scp local-file.txt devserver:~/remote-file.txt

# Copy directory recursively
scp -r local-directory/ devserver:~/remote-dir/

# Create SSH tunnel (forward local port 8080 to remote port 80)
ssh -L 8080:localhost:80 devserver
```

---

### Evening: Command-Line Power Tools (1-2 hours)

#### 6. **Text Processing Essentials** ⏱️ 1-2 hours

**READ**: [command-line-essentials](command-line-essentials)

**Key Tools to Learn**:
- [ ] `grep` - Search for patterns
- [ ] `awk` - Field extraction and processing
- [ ] `sed` - Stream editing and substitution
- [ ] `find` - File searching
- [ ] Pipes `|` and redirection `>`, `>>`

**Practice Exercises**:
```bash
# 1. Search system logs
journalctl -u sshd | grep "Failed"              # Find failed SSH attempts
grep -r "TODO" ~/projects/                      # Find TODO comments in code

# 2. Extract specific fields with awk
ps aux | awk '{print $1, $11}'                  # Print user and command
cat /etc/passwd | awk -F: '{print $1, $3}'      # Print username and UID

# 3. Text replacement with sed
sed 's/old/new/g' file.txt                      # Replace in file (preview)
sed -i 's/old/new/g' file.txt                   # Replace in-place

# 4. Find files
find /var/log -name "*.log" -mtime -7           # Logs modified in last 7 days
find ~ -type f -size +100M                      # Files larger than 100MB

# 5. Combine tools with pipes
cat access.log | grep "404" | awk '{print $1}' | sort | uniq -c | sort -rn
# Translation: Find 404 errors, extract IPs, count occurrences, sort by frequency
```

---

#### 7. **Bash Scripting Basics** ⏱️ 30 minutes (skim for now)

**SKIM**: [bash-scripting](bash-scripting)

**Goal**: Understand that bash scripts exist and you'll learn them soon.

**Simple First Script**:
```bash
#!/bin/bash
# Save as hello.sh

echo "Hello, $(whoami)!"
echo "Today is $(date)"
echo "You are on $(hostname)"
```

**Make it executable and run**:
```bash
chmod +x hello.sh
./hello.sh
```

**Day 1 Takeaway**: Scripts automate repetitive tasks. You'll dive deep into this later.

---

## 🎓 End-of-Day Review

### You've Accomplished:
✅ Development environment configured  
✅ SSH access working  
✅ Basic Linux CLI navigation  
✅ Text processing fundamentals  
✅ Understanding of system basics  

### Skills Acquired:
- Navigate Linux filesystem
- Manage files and permissions
- Connect to servers via SSH
- Search and process text
- Monitor system resources
- Read logs

### Confidence Check:
**Can you do these without looking them up?**
- [ ] SSH into a server
- [ ] Navigate to a directory
- [ ] Create, edit, and delete files
- [ ] Search for a file
- [ ] Check disk space
- [ ] View running processes
- [ ] Search log files for errors

**If YES**: Congratulations! You're ready for Week 1 content!  
**If NO**: That's okay! Review the sections where you're uncertain.

---

## 🗓️ Week 1: Continuing Your Journey

### Day 2: Git Fundamentals ⏱️ 4-6 hours
**READ**: [git-fundamentals](git-fundamentals)

**Key Concepts**:
- Version control basics
- Git workflow: clone, commit, push, pull
- Branching and merging
- GitHub/GitLab/Forgejo basics
- Collaboration patterns

**Goal**: Clone a repository, make changes, commit, push.

---

### Day 3: Text Editors ⏱️ 2-3 hours
**READ**: [text-editors](text-editors)

**Choose Your Path**:
- VSCode (graphical, beginner-friendly)
- Vim (terminal-based, powerful)
- Nano (simple terminal editor)

**Goal**: Edit files comfortably in your chosen editor.

---

### Day 4: Package Managers ⏱️ 2-3 hours
**READ**: [package-managers](package-managers)

**Key Systems**:
- `apt` (Debian/Ubuntu)
- `dnf` (Fedora/RHEL)
- `pacman` (Arch)
- `brew` (macOS)

**Goal**: Install, update, remove packages confidently.

---

### Day 5: Deep Dive - Bash Scripting ⏱️ 6-8 hours
**READ**: [bash-scripting](bash-scripting) (in-depth)

**Key Skills**:
- Variables and quoting
- Loops and conditionals
- Functions
- Error handling
- Real-world automation scripts

**Goal**: Write your first automation script.

---

## 🧭 After Week 1: Where to Go Next

### Path 1: Container Orchestration 🐳
**Goal**: Run Docker containers, deploy to k0s

**Learning Path**:
1. [kb/containers/README](../containers/README) - Start here
2. Docker basics → docker-compose → k0s
3. **Time**: 2-4 weeks
4. **Outcome**: Deploy containerized applications

---

### Path 2: Infrastructure as Code 🏗️
**Goal**: Automate server provisioning

**Learning Path**:
1. [kb/infrastructure/README](../infrastructure/README) - Start here
2. Manual → Bash scripts → Ansible → Terraform
3. **Time**: 3-6 weeks
4. **Outcome**: Provision infrastructure from code

---

### Path 3: CI/CD Pipelines 🔄
**Goal**: Automate build and deployment

**Learning Path**:
1. [kb/cicd/README](../cicd/README) - Start here
2. Git → Forgejo → Woodpecker CI → GitOps
3. **Time**: 2-4 weeks
4. **Outcome**: Automated deployment pipelines

---

### Path 4: Security Hardening 🔒
**Goal**: Secure your infrastructure

**Learning Path**:
1. [kb/security/README](../security/README) - Start here
2. Passwords → Firewalls → VPN → Secrets → Zero Trust
3. **Time**: 3-6 weeks
4. **Outcome**: Production-grade security

---

### Path 5: Monitoring & Observability 📊
**Goal**: See everything happening in your systems

**Learning Path**:
1. [kb/observability/README](../observability/README) - Start here
2. Uptime checks → Prometheus/Grafana → Loki → Alerting
3. **Time**: 2-4 weeks
4. **Outcome**: Complete observability stack

---

## 🛠️ Essential Bookmarks

**Quick Reference**:
- [Linux Command Cheat Sheet](https://github.com/LeCoupa/awesome-cheatsheets/blob/master/languages/bash.sh)
- [SSH Config Examples](https://www.ssh.com/academy/ssh/config)
- [Vim Cheat Sheet](https://vim.rtorr.com/)

**Documentation**:
- [Docker Docs](https://docs.docker.com/)
- [Git Book](https://git-scm.com/book/en/v2)
- [Ubuntu Manual Pages](https://manpages.ubuntu.com/)

**Community**:
- [r/homelab](https://reddit.com/r/homelab) - Self-hosting community
- [r/selfhosted](https://reddit.com/r/selfhosted) - Self-hosted alternatives
- [Awesome Self-Hosted](https://github.com/awesome-selfhosted/awesome-selfhosted)

---

## 💡 Learning Tips

### Learning Strategies:
1. **Hands-On Practice**: Reading isn't enough - type commands, break things, fix them
2. **Document as You Learn**: Keep notes, you'll forget details
3. **Ask Questions**: No question is stupid in infrastructure
4. **Start Simple**: Don't jump to Kubernetes on day 2
5. **Iterate**: Manual first, automate later
6. **Test in Dev**: Never test in production first

### When You're Stuck:
1. **Read the Error Message**: It usually tells you what's wrong
2. **Google the Error**: Someone has seen it before
3. **Check Logs**: `journalctl`, `docker logs`, application logs
4. **Ask for Help**: Team chat, forums, Reddit
5. **Take a Break**: Fresh eyes solve problems faster

### Common Beginner Mistakes:
- ❌ Using root for everything (use sudo instead)
- ❌ Not backing up before changes
- ❌ Forgetting to test commands before running
- ❌ Not reading documentation
- ❌ Copying commands without understanding them
- ❌ Giving up too easily - infrastructure is hard, that's normal!

---

## 📊 Your Learning Progress Tracker

### Basics (Week 1)
- [x] Day 1 onboarding completed
- [ ] Linux fundamentals mastered
- [ ] SSH configured and comfortable
- [ ] Command-line text processing
- [ ] Git fundamentals
- [ ] Text editor proficiency
- [ ] Package management
- [ ] Bash scripting basics

### Intermediate (Weeks 2-8)
- [ ] Docker containers
- [ ] Infrastructure automation
- [ ] CI/CD pipelines
- [ ] Security hardening
- [ ] Monitoring setup

### Advanced (Months 2-6)
- [ ] Kubernetes/k0s orchestration
- [ ] Production infrastructure
- [ ] Advanced security (Zero Trust)
- [ ] Complete observability
- [ ] Complex migrations

---

## 🎯 30-60-90 Day Goals

### 30 Days:
- Comfortable with Linux CLI
- Can deploy Docker containers
- Basic Ansible playbooks
- SSH and Git workflow mastered
- Simple monitoring (Uptime Kuma, Netdata)

### 60 Days:
- Deploy to k0s cluster
- Write Terraform modules
- CI/CD pipelines working
- Prometheus + Grafana dashboards
- Security best practices implemented

### 90 Days:
- Run production workloads
- Infrastructure as code mastery
- Complete observability stack
- Zero Trust security posture
- Mentor new team members

---

## 🚀 Welcome to Infrastructure!

You're at the beginning of an exciting journey. Infrastructure engineering combines system administration, software development, and problem-solving. It's challenging but incredibly rewarding.

**Remember**:
- Everyone was a beginner once
- Breaking things is how you learn (in dev, not prod!)
- The learning never stops - that's what makes it fun
- The community is incredibly helpful
- Your Day 1 confusion will be Day 90 confidence

**You've got this!** 💪

Now go complete your Day 1 checklist, and I'll see you in Week 1!

---

## 📝 Change Log

### 2026-01-30
- Created Day 1 onboarding guide
- Defined 4-8 hour Day 1 checklist
- Linked all basics articles
- Provided clear learning paths
- Added tool installation instructions
- Included practical exercises
- Defined 30-60-90 day goals
- Added learning tips and common pitfalls

---

**🎓 Next Article**: [git-fundamentals](git-fundamentals) - Version control for beginners

