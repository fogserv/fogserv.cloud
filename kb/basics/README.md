# Basics - Foundational Knowledge

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Fundamentals  
**Prerequisites**: None - Start here if you're new  
**Tags**: beginner, fundamentals, linux, ssh, command-line, onboarding

## Summary

Foundational knowledge for developers and system administrators starting from absolute zero. This directory contains guides that assume no prior knowledge of Linux, command-line tools, or infrastructure concepts.

## 🎯 Learning Path

Start here if you're asking yourself:
- "I've never used Linux before, where do I start?"
- "What is SSH and why does everyone keep mentioning it?"
- "How do I use the command line effectively?"
- "I just joined the team, what do I need to set up?"

```
Day 1: New Developer Guide
    ↓
Linux Fundamentals ──→ SSH Basics ──→ Command Line Essentials
    ↓                      ↓                   ↓
Git Fundamentals    Bash Scripting      Text Editors
    ↓                      ↓                   ↓
        Ready for kb/containers/ (Docker) →
```

## 📚 Articles in This Directory

### 🟢 Absolute Beginner (Start Here)

**Essential First Steps**:
1. **[day1-new-developer](day1-new-developer)** - Complete onboarding checklist for new team members
   - Workstation setup
   - Tool installation
   - First connection to servers
   - Where to find help
   - **Prerequisites**: None
   - **Time**: 2-4 hours

2. **[linux-fundamentals](linux-fundamentals)** - Everything you need to know about Linux basics
   - Filesystem structure and navigation
   - File permissions and ownership
   - Users and groups
   - Process management
   - **Prerequisites**: None
   - **Time**: 4-6 hours to read, weeks to master

3. **[ssh-basics](ssh-basics)** - Secure Shell fundamentals
   - What is SSH and why it matters
   - Key generation and management
   - SSH config file
   - Tunneling and port forwarding
   - Security best practices
   - **Prerequisites**: Basic Linux knowledge
   - **Time**: 2-3 hours

### 🟡 Building Skills

**Command Line Mastery**:
4. **[command-line-essentials](command-line-essentials)** - Essential CLI tools
   - grep, awk, sed, find
   - Pipes and redirection
   - Text processing
   - Practical examples
   - **Prerequisites**: Linux fundamentals
   - **Time**: 3-4 hours

5. **[bash-scripting](bash-scripting)** - Introduction to shell scripting
   - Variables and data types
   - Control structures (if, loops)
   - Functions
   - Error handling
   - Best practices
   - **Prerequisites**: Command line essentials
   - **Time**: 4-6 hours

6. **[git-fundamentals](git-fundamentals)** - Version control basics
   - What is Git and why use it
   - Basic commands (clone, add, commit, push, pull)
   - Branching and merging
   - .gitignore and common workflows
   - **Prerequisites**: Command line essentials
   - **Time**: 3-4 hours

7. **[text-editors](text-editors)** - Editing files on the command line
   - nano basics (easiest)
   - vim fundamentals (powerful)
   - VS Code remote editing
   - When to use which editor
   - **Prerequisites**: Linux fundamentals
   - **Time**: 1-2 hours

8. **[package-managers](package-managers)** - Installing software on Linux
   - apt (Debian/Ubuntu)
   - dnf/yum (RHEL/Fedora)
   - Package repositories
   - Security updates
   - **Prerequisites**: Linux fundamentals
   - **Time**: 1-2 hours

## 🔗 What Comes Next?

After completing the basics, you're ready to progress to:

**For Developers**:
- **[kb/containers/](../containers/)** - Learn Docker and containerization
- **[kb/cicd/](../cicd/)** - Understand CI/CD pipelines with Forgejo

**For System Administrators**:
- **[kb/sysadmin/](../sysadmin/)** - Deep dive into system administration
- **[kb/infrastructure/](../infrastructure/)** - Infrastructure as Code with Ansible

**For Security-Focused**:
- **[kb/security/](../security/)** - Security fundamentals and best practices

## 📊 Resource Requirements

All basics topics require:
- **Hardware**: Any computer with terminal access `[█░░░░░░░░░]` 10% - Very light
- **Server**: Optional for SSH practice `[██░░░░░░░░]` 20% - Minimal VM
- **Time Investment**: 20-40 hours total for mastery `[████████░░]` 80% - Significant but essential

## 🛠️ Recommended Tools

**Text Editors** (choose one):
- **nano** `[██░░░░░░░░]` - Easiest for beginners
- **vim** `[████████░░]` - Powerful but steeper learning curve
- **VS Code** `[████░░░░░░]` - GUI with remote SSH extension

**Terminal Emulators**:
- **Windows**: Windows Terminal, PuTTY
- **macOS**: iTerm2, built-in Terminal
- **Linux**: GNOME Terminal, Terminator, Alacritty

**SSH Clients**:
- Built-in OpenSSH (Linux/macOS/Windows 10+)
- PuTTY (Windows legacy)

## 📖 Learning Resources

### Official Documentation
- [Linux Documentation Project](https://tldp.org/) - Comprehensive Linux guides
- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/) - Official bash reference
- [OpenSSH Manual](https://www.openssh.com/manual.html) - SSH documentation

### Community Tutorials (Beginner)
- [Linux Journey](https://linuxjourney.com/) - Interactive Linux learning
- [The Missing Semester](https://missing.csail.mit.edu/) - MIT course on command-line tools
- [Bash Guide for Beginners](https://tldp.org/LDP/Bash-Beginners-Guide/html/) - Comprehensive bash intro

### Video Content (Beginner)
- [Linux Tutorial for Beginners](https://www.youtube.com/watch?v=BMGixkvJ-6w) - Full course by freeCodeCamp
- [SSH Crash Course](https://www.youtube.com/watch?v=hQWRp-FdTpc) - Quick SSH overview

### Books (Beginner)
- "The Linux Command Line" by William Shotts - Best beginner book
- "Linux Basics for Hackers" by OccupyTheWeb - Practical approach

## 💡 Pro Tips for Beginners

1. **Don't Memorize, Practice**: You'll learn commands by using them, not by reading
2. **Use `man` Pages**: Every command has a manual (`man ls`, `man ssh`)
3. **Tab Completion**: Press Tab to autocomplete filenames and commands
4. **History**: Use up/down arrows to navigate command history
5. **Google is Your Friend**: "how to [task] in linux" is a perfectly valid search
6. **Ask for Help**: Nobody knows everything, asking questions is how you learn
7. **Start Simple**: Master the basics before moving to advanced topics
8. **Build Muscle Memory**: Repetition is key for command-line fluency

## 🔄 Related KB Sections

- **[kb/sysadmin/](../sysadmin/)** - Advanced system administration (builds on basics)
- **[kb/gitops/](../gitops/)** - Git workflows for operations
- **[kb/research/sysadmin](../research/sysadmin)** - Research notes on system administration

## 📝 Change Log

### 2026-01-30
- Created basics directory structure
- Defined learning path for absolute beginners
- Established prerequisite chain
- Listed planned articles with time estimates
- Added resource requirements with ASCII bars
- Compiled learning resources organized by type and skill level

---

**Remember**: Everyone starts somewhere. These basics are the foundation for everything else in this knowledge base. Take your time, practice consistently, and don't skip ahead until you're comfortable with each topic.
