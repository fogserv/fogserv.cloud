# Linux Fundamentals - Complete Beginner's Guide

**Status**: Active  
**Last Updated**: 2026-01-30  
**Session**: Infrastructure KB Expansion - Basics Series  
**Tags**: beginner, linux, filesystem, permissions, processes, fundamentals

## Summary

Comprehensive guide to Linux operating system fundamentals, assuming zero prior knowledge. Covers filesystem structure, file permissions, user management, process basics, and essential concepts needed before progressing to containers, servers, or infrastructure work.

## 🎯 What You'll Learn

By the end of this guide, you'll understand:
- How the Linux filesystem is organized
- How to navigate directories and manage files
- What file permissions are and how to use them
- How users and groups work
- Basic process management concepts
- Essential Linux terminology

**Prerequisites**: None - this is the starting point  
**Time Investment**: 4-6 hours to read, weeks to master through practice  
**Recommended Setup**: Access to any Linux system (VM, WSL, or physical machine)

---

## Table of Contents

1. [What is Linux?](#what-is-linux)
2. [The Linux Filesystem](#the-linux-filesystem)
3. [Navigating the Filesystem](#navigating-the-filesystem)
4. [File Permissions](#file-permissions)
5. [Users and Groups](#users-and-groups)
6. [Processes](#processes)
7. [Essential Commands Reference](#essential-commands-reference)
8. [Practical Exercises](#practical-exercises)
9. [Common Gotchas](#common-gotchas)
10. [Next Steps](#next-steps)

---

## What is Linux?

Linux is an **operating system kernel** - the core software that manages your computer's hardware and lets programs run. When people say "Linux," they usually mean a complete operating system (called a **distribution** or "distro") built around the Linux kernel.

### Why Linux Matters for Infrastructure

- **Servers**: Most web servers, databases, and cloud infrastructure run Linux
- **Containers**: Docker containers are Linux-based
- **Cloud**: AWS, Azure, GCP all use Linux extensively
- **Cost**: Free and open-source (no licensing fees)
- **Security**: Transparent code, active security community
- **Automation**: Designed for scripting and automation

### Common Linux Distributions

| Distribution | Best For | Package Manager |
|--------------|----------|-----------------|
| **Ubuntu** | Beginners, servers | apt |
| **Debian** | Stability, servers | apt |
| **Fedora** | Developers, latest features | dnf |
| **RHEL/Rocky/Alma** | Enterprise, stability | dnf/yum |
| **Arch** | Advanced users | pacman |

**For this guide**: Examples work on any distribution, but commands show Ubuntu/Debian (apt) and RHEL/Fedora (dnf).

---

## The Linux Filesystem

Unlike Windows (C:\, D:\), Linux has a **single unified filesystem tree** starting at the root directory `/`.

### Filesystem Hierarchy

```
/                                  Root - everything starts here
├── bin/                          Essential user binaries (commands)
├── boot/                         Boot loader files (kernel)
├── dev/                          Device files (hardware)
├── etc/                          Configuration files
│   ├── nginx/                    nginx configs
│   ├── ssh/                      SSH configs
│   └── systemd/                  System service configs
├── home/                         User home directories
│   ├── alice/                    Alice's files
│   ├── bob/                      Bob's files
│   └── yourname/                 Your files go here
├── opt/                          Optional software
├── root/                         Root user's home (NOT same as /)
├── tmp/                          Temporary files (cleared on reboot)
├── usr/                          User programs and data
│   ├── bin/                      Non-essential user binaries
│   ├── lib/                      Libraries
│   ├── local/                    Locally installed software
│   └── share/                    Shared data (docs, icons)
└── var/                          Variable data
    ├── log/                      Log files (important!)
    ├── www/                      Web server files
    └── lib/                      Application state data
```

### Key Directories Explained

**`/` (Root)**  
The top of the filesystem tree. Not to be confused with `/root` (root user's home).

**`/home/username`**  
Your personal files live here. Similar to `C:\Users\YourName` on Windows.

**`/etc`** (et-see)  
System-wide configuration files. Want to configure a service? Look here first.

**`/var/log`**  
Log files for debugging. When something breaks, check here:
- `/var/log/syslog` or `/var/log/messages` - General system logs
- `/var/log/nginx/` - Web server logs
- `/var/log/auth.log` - Authentication attempts

**`/tmp`**  
Temporary files. Automatically cleaned on reboot. Don't store important data here!

**`/usr/bin` and `/bin`**  
Executable programs (commands). `/bin` has essential commands needed for boot, `/usr/bin` has everything else. In modern systems, often `/bin` is a symlink to `/usr/bin`.

**`/opt`**  
Third-party software installed manually (not via package manager).

---

## Navigating the Filesystem

### Essential Navigation Commands

**`pwd`** - Print Working Directory (where am I?)
```bash
$ pwd
/home/yourname
```

**`ls`** - List files
```bash
# Basic list
$ ls
Documents  Downloads  Music  Pictures

# Detailed list with permissions
$ ls -l
drwxr-xr-x 2 yourname yourname 4096 Jan 30 10:00 Documents
drwxr-xr-x 5 yourname yourname 4096 Jan 30 09:45 Downloads

# Include hidden files (starting with .)
$ ls -la
drwxr-xr-x 15 yourname yourname 4096 Jan 30 10:00 .
drwxr-xr-x  3 root     root     4096 Jan 15 08:30 ..
-rw-------  1 yourname yourname 1234 Jan 30 09:50 .bash_history
drwxr-xr-x  2 yourname yourname 4096 Jan 30 10:00 Documents

# Human-readable file sizes
$ ls -lh
-rw-r--r-- 1 yourname yourname 1.5M Jan 30 10:00 document.pdf
-rw-r--r-- 1 yourname yourname  45K Jan 30 09:55 image.png
```

**`cd`** - Change Directory
```bash
# Go to home directory (multiple ways)
$ cd
$ cd ~
$ cd /home/yourname

# Go to specific directory
$ cd /var/log

# Go up one level
$ cd ..

# Go up two levels
$ cd ../..

# Go to previous directory
$ cd -

# Relative vs Absolute paths
$ cd Documents              # Relative: from current location
$ cd /home/yourname/Documents   # Absolute: from root
```

**`tree`** - Visual directory structure (install: `sudo apt install tree`)
```bash
$ tree -L 2 /etc/nginx/
/etc/nginx/
├── nginx.conf
├── sites-available/
│   ├── default
│   └── mysite.conf
└── sites-enabled/
    └── mysite.conf -> ../sites-available/mysite.conf
```

### File and Directory Manipulation

**Creating**
```bash
# Create empty file
$ touch newfile.txt

# Create file with content
$ echo "Hello World" > hello.txt

# Create directory
$ mkdir my-directory

# Create nested directories
$ mkdir -p projects/website/public
```

**Copying**
```bash
# Copy file
$ cp source.txt destination.txt

# Copy directory recursively
$ cp -r source-directory/ destination-directory/

# Copy with verbose output
$ cp -v file.txt backup.txt
'file.txt' -> 'backup.txt'

# Preserve permissions and timestamps
$ cp -p original.txt copy.txt
```

**Moving/Renaming**
```bash
# Rename file
$ mv oldname.txt newname.txt

# Move file to directory
$ mv file.txt /home/yourname/Documents/

# Move directory
$ mv old-directory/ new-directory/

# Move multiple files
$ mv file1.txt file2.txt file3.txt /destination/
```

**Deleting**
```bash
# Remove file
$ rm file.txt

# Remove directory (must be empty)
$ rmdir empty-directory/

# Remove directory and contents recursively
$ rm -r directory/

# Force remove (no confirmation)
$ rm -rf directory/   # ⚠️ DANGEROUS - no undo!

# Remove with confirmation
$ rm -i important-file.txt
rm: remove regular file 'important-file.txt'? y
```

**⚠️ WARNING**: `rm -rf` is extremely dangerous! There's no recycle bin in Linux. Deleted files are gone forever. Always double-check before using `-f` (force).

---

## File Permissions

Linux is a multi-user system. Permissions control who can read, write, or execute files.

### Understanding Permission Notation

When you run `ls -l`, you see something like:
```bash
-rw-r--r-- 1 alice developers 1234 Jan 30 10:00 document.txt
drwxr-xr-x 2 alice developers 4096 Jan 30 09:00 my-folder/
```

Let's break down `-rw-r--r--`:

```
-  rw-  r--  r--
│   │    │    │
│   │    │    └─ Others: read only
│   │    └────── Group: read only
│   └─────────── Owner: read + write
└─────────────── File type (- = file, d = directory, l = link)
```

### Permission Types

| Symbol | Permission | On Files | On Directories |
|--------|------------|----------|----------------|
| **r** | Read | View file contents | List directory contents |
| **w** | Write | Modify file | Create/delete files in directory |
| **x** | Execute | Run as program | Enter directory (cd into it) |
| **-** | No permission | Cannot access | Cannot access |

### Permission Examples Explained

```bash
-rw-r--r--   file.txt
# Owner can read/write, group can read, others can read

-rwxr-xr-x   script.sh
# Owner can read/write/execute, group can read/execute, others can read/execute
# This is a typical script permission

drwxr-xr-x   my-folder/
# Owner can list/create/enter, group can list/enter, others can list/enter
# This is a typical directory permission

-rw-------   secret.key
# Owner can read/write, nobody else can access
# This is typical for SSH keys or secrets

drwx------   .ssh/
# Owner can list/create/enter, nobody else can access
# This is required for SSH directory
```

### Changing Permissions with `chmod`

**Symbolic Mode (Easier to Remember)**
```bash
# Add execute permission for owner
$ chmod u+x script.sh

# Remove write permission for others
$ chmod o-w file.txt

# Add read permission for group
$ chmod g+r document.txt

# Set exact permissions
$ chmod u=rwx,g=rx,o=r file.txt

# Add execute for everyone
$ chmod a+x script.sh
# a = all (owner + group + others)
```

**Numeric Mode (Common in Documentation)**
```bash
# Permissions as numbers:
# r=4, w=2, x=1
# Add them up for each group:
#   7 = rwx (4+2+1)
#   6 = rw- (4+2+0)
#   5 = r-x (4+0+1)
#   4 = r-- (4+0+0)
#   0 = --- (0+0+0)

# Common patterns:
$ chmod 644 file.txt        # -rw-r--r-- (typical file)
$ chmod 755 script.sh       # -rwxr-xr-x (typical script)
$ chmod 600 secret.key      # -rw------- (private file)
$ chmod 700 .ssh/           # drwx------ (SSH directory)
$ chmod 755 public/         # drwxr-xr-x (public directory)
```

**Recursive Permission Changes**
```bash
# Change permissions for directory and all contents
$ chmod -R 755 /var/www/html/

# Make all .sh files executable
$ find . -name "*.sh" -exec chmod +x {} \;
```

### Changing Ownership with `chown`

```bash
# Change owner
$ sudo chown alice file.txt

# Change owner and group
$ sudo chown alice:developers file.txt

# Change recursively
$ sudo chown -R alice:developers /home/alice/project/

# Change only group
$ sudo chgrp developers file.txt
```

**Why `sudo`?**: Only the root user (or file owner) can change ownership. `sudo` runs commands as root.

---

## Users and Groups

Linux is multi-user. Each person has their own account with permissions and files.

### User Concepts

**User Types**:
- **root**: The superuser (UID 0). Can do anything. Dangerous if misused.
- **Regular users**: Your daily account (UID ≥ 1000). Limited permissions.
- **System users**: Accounts for services (nginx, postgres, etc.). Non-interactive.

**User Information Files**:
- `/etc/passwd`: User account information
- `/etc/shadow`: Encrypted passwords (only root can read)
- `/etc/group`: Group information

### Viewing User Information

```bash
# Who am I?
$ whoami
alice

# My user ID and groups
$ id
uid=1000(alice) gid=1000(alice) groups=1000(alice),27(sudo),999(docker)

# List all users (first field of /etc/passwd)
$ cut -d: -f1 /etc/passwd
root
daemon
bin
...
alice
bob

# Currently logged in users
$ who
alice    tty1         2026-01-30 10:00
bob      pts/0        2026-01-30 09:30

# Detailed user information
$ finger alice   # May need to install: sudo apt install finger
```

### Groups

Groups let you manage permissions for multiple users at once.

```bash
# List groups you belong to
$ groups
alice sudo docker developers

# List all groups
$ cat /etc/group

# List members of a group
$ getent group developers
developers:x:1001:alice,bob,charlie

# Add user to group (requires sudo)
$ sudo usermod -aG docker alice
# -a = append (don't remove from other groups)
# -G = supplementary groups

# Create new group
$ sudo groupadd developers
```

### Common User Commands

```bash
# Create new user
$ sudo useradd -m -s /bin/bash newuser
# -m = create home directory
# -s = set shell

# Set password for user
$ sudo passwd newuser

# Delete user
$ sudo userdel -r username
# -r = remove home directory

# Switch to another user
$ su - alice
Password: 

# Run single command as another user
$ sudo -u alice ls /home/alice

# Run command as root
$ sudo apt update
```

### The `sudo` Command

`sudo` (Super User DO) lets authorized users run commands as root.

```bash
# Configure sudo access (edit sudoers file)
$ sudo visudo   # ALWAYS use visudo, never edit /etc/sudoers directly

# Common sudoers patterns:
# Give user full sudo access:
alice ALL=(ALL:ALL) ALL

# Give user sudo without password (use carefully!):
alice ALL=(ALL) NOPASSWD: ALL

# Give user specific commands only:
alice ALL=(ALL) /usr/bin/systemctl, /usr/bin/docker
```

**Sudo Best Practices**:
- Use `sudo` for individual commands, not `su` for shell sessions
- Don't run everything as root "just in case"
- Check what command will do before adding `sudo`
- Use `sudo -i` if you need a root shell (for multiple root commands)

---

## Processes

Programs running on Linux are called **processes**. Each has a unique Process ID (PID).

### Viewing Processes

**`ps`** - Process Status
```bash
# Your processes
$ ps
  PID TTY          TIME CMD
  1234 pts/0    00:00:00 bash
  5678 pts/0    00:00:00 ps

# All processes (detailed)
$ ps aux
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 169640 13140 ?        Ss   Jan30   0:01 /sbin/init
alice     1234  0.0  0.0  21456  5008 pts/0    Ss   10:00   0:00 -bash
alice     5678  0.0  0.0  38380  3444 pts/0    R+   10:15   0:00 ps aux

# Process tree (shows parent-child relationships)
$ ps auxf
# or better:
$ pstree
systemd─┬─accounts-daemon───2*[{accounts-daemon}]
        ├─cron
        ├─dockerd───10*[{dockerd}]
        ├─sshd───sshd───sshd───bash───pstree
        └─nginx───2*[nginx]
```

**`top`** - Dynamic Process Viewer
```bash
$ top
# Interactive - updates every 3 seconds
# Press 'q' to quit
# Press 'k' to kill a process
# Press 'M' to sort by memory
# Press 'P' to sort by CPU

top - 10:15:23 up 1 day,  2:15,  2 users,  load average: 0.15, 0.22, 0.18
Tasks: 245 total,   1 running, 244 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  0.7 sy,  0.0 ni, 96.8 id,  0.2 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   7842.7 total,   1234.5 free,   3456.2 used,   3152.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   3987.3 avail Mem 

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 alice     20   0 1234567 123456  12345 S   5.0   1.5   1:23.45 node
 5678 postgres  20   0  345678  34567   3456 S   2.5   0.4   0:45.67 postgres
```

**`htop`** - Better than top (install: `sudo apt install htop`)
```bash
$ htop
# Colorful, easier to read, mouse support
# F9 to kill process, F10 to quit
```

### Managing Processes

**Starting Processes**
```bash
# Run in foreground (blocks terminal)
$ ./script.sh

# Run in background (returns control immediately)
$ ./long-running-script.sh &
[1] 12345   # Job number and PID

# Check background jobs
$ jobs
[1]+  Running                 ./long-running-script.sh &

# Bring background job to foreground
$ fg %1
```

**Stopping Processes**
```bash
# Ctrl+C - Interrupt (SIGINT) - graceful stop
# Ctrl+Z - Suspend (pause) process

# After Ctrl+Z, resume in background:
$ bg %1

# Kill by PID
$ kill 12345         # Graceful termination (SIGTERM)
$ kill -9 12345      # Force kill (SIGKILL) - use as last resort

# Kill by name
$ pkill nginx        # Kill all processes matching "nginx"
$ killall nginx      # Same thing

# Kill your own process by name
$ pgrep -u $(whoami) node   # Find PIDs
12345
$ pkill -u $(whoami) node   # Kill them
```

**Process Priority (Nice Values)**
```bash
# Nice values: -20 (highest priority) to 19 (lowest)
# Default is 0

# Start with lower priority (nice)
$ nice -n 10 ./cpu-intensive-task.sh

# Change priority of running process (renice)
$ renice -n 5 -p 12345   # PID 12345 gets priority 5
```

### Background Processes and Daemons

**Running Commands that Survive Logout**
```bash
# nohup - no hangup (keeps running after logout)
$ nohup ./long-script.sh > output.log 2>&1 &

# Redirect output: > stdout.log 2>&1
#   > stdout.log    = redirect output to file
#   2>&1            = redirect errors (2) to same place as output (1)

# Check process later
$ ps aux | grep long-script
```

**Daemons**: Background services (web servers, databases, etc.)
- Managed by **systemd** (modern Linux)
- See [kb/sysadmin/systemd-deep-dive](../sysadmin/systemd-deep-dive) for details

```bash
# Check service status
$ sudo systemctl status nginx

# Start/stop services
$ sudo systemctl start nginx
$ sudo systemctl stop nginx
$ sudo systemctl restart nginx

# Enable service to start on boot
$ sudo systemctl enable nginx
```

---

## Essential Commands Reference

Quick reference for commands covered in this guide:

### Navigation & Files
```bash
pwd                    # Print working directory
ls -la                 # List files (detailed, including hidden)
cd /path/to/dir        # Change directory
cd ..                  # Go up one level
cd ~                   # Go to home directory
mkdir dirname          # Create directory
touch filename         # Create empty file
cp source dest         # Copy file
mv source dest         # Move/rename file
rm filename            # Delete file
rm -r dirname          # Delete directory recursively
```

### Viewing Files
```bash
cat file.txt           # Display entire file
less file.txt          # View file page by page (q to quit)
head file.txt          # First 10 lines
tail file.txt          # Last 10 lines
tail -f logfile        # Follow log file (real-time updates)
```

### Searching
```bash
grep "pattern" file    # Search in file
find /path -name "*.txt"   # Find files by name
which command          # Find command location
```

### Permissions
```bash
chmod 755 file         # Change permissions
chmod +x script.sh     # Make executable
chown user:group file  # Change owner
ls -l                  # View permissions
```

### Users & Processes
```bash
whoami                 # Current user
id                     # User ID and groups
sudo command           # Run as root
ps aux                 # List all processes
top                    # Process monitor
kill PID               # Stop process
```

### System Information
```bash
uname -a               # System information
df -h                  # Disk usage (human-readable)
du -sh directory/      # Directory size
free -h                # Memory usage
uptime                 # System uptime and load
```

---

## Practical Exercises

### Exercise 1: Filesystem Navigation

```bash
# 1. Find out where you are
pwd

# 2. Go to your home directory
cd ~

# 3. List all files including hidden ones
ls -la

# 4. Create a project structure
mkdir -p projects/my-first-project/{src,docs,tests}

# 5. Navigate into it and verify
cd projects/my-first-project
tree   # or: ls -R

# Expected structure:
# my-first-project/
# ├── docs/
# ├── src/
# └── tests/
```

### Exercise 2: File Permissions

```bash
# 1. Create a script file
echo '#!/bin/bash' > hello.sh
echo 'echo "Hello, World!"' >> hello.sh

# 2. Try to run it (will fail)
./hello.sh
# bash: ./hello.sh: Permission denied

# 3. Check permissions
ls -l hello.sh
# -rw-r--r-- ... hello.sh

# 4. Make it executable
chmod +x hello.sh

# 5. Check permissions again
ls -l hello.sh
# -rwxr-xr-x ... hello.sh

# 6. Run it successfully
./hello.sh
# Hello, World!
```

### Exercise 3: Working with Processes

```bash
# 1. Start a long-running process in background
sleep 300 &
# [1] 12345

# 2. Check it's running
jobs
# [1]+  Running                 sleep 300 &

# 3. Find its PID
ps aux | grep sleep

# 4. Kill it
kill 12345   # or: kill %1

# 5. Verify it's gone
jobs
# [1]+  Terminated              sleep 300
```

---

## Common Gotchas

### 🚨 Mistakes Beginners Make

**1. Running Everything as Root**
```bash
# ❌ DON'T DO THIS
sudo su              # Becomes root for entire session
# ... accidentally delete important files

# ✅ DO THIS INSTEAD
sudo command         # Use sudo for individual commands
```

**2. Using `rm -rf` Without Thinking**
```bash
# ❌ DISASTER
sudo rm -rf /home /temporary-files    # Space instead of slash!
# Just deleted everyone's home directories!

# ✅ BETTER
rm -ri directory/    # -i prompts for confirmation
# Even better: move to trash first
mv directory/ /tmp/backup-directory/
```

**3. Forgetting File Permissions**
```bash
# ❌ Script won't run
./deploy.sh
# Permission denied

# ✅ Make it executable
chmod +x deploy.sh
./deploy.sh
```

**4. Not Checking Current Directory**
```bash
# ❌ Accidentally in wrong place
cd /etc
rm *.conf    # Just deleted system configs!

# ✅ Always check where you are
pwd
ls
# Then execute commands
```

**5. Ignoring Hidden Files**
```bash
# ❌ Won't see configuration files
ls

# ✅ Include hidden files
ls -la
# Now you see .bashrc, .ssh/, .gitignore, etc.
```

---

## Resource Requirements

**Learning Linux**:
- **Hardware**: Any computer `[█░░░░░░░░░]` 10% - Very minimal
- **VM Requirements**: 1 CPU, 2GB RAM, 20GB disk `[██░░░░░░░░]` 20%
- **Time to Basic Proficiency**: `[████░░░░░░]` 40% - 2-4 weeks daily practice
- **Time to Competence**: `[████████░░]` 80% - 3-6 months regular use

**Common Server Setups**:
- **Basic Web Server**: 1 CPU, 1GB RAM `[██░░░░░░░░]` 20%
- **Database Server**: 2 CPU, 4GB RAM `[█████░░░░░]` 50%
- **Full Stack Application**: 4 CPU, 8GB RAM `[███████░░░]` 70%

---

## Next Steps

### After Mastering Linux Basics

**Immediate Next Steps**:
1. **[kb/basics/ssh-basics](ssh-basics)** - Learn to connect to remote servers
2. **[kb/basics/command-line-essentials](command-line-essentials)** - Master grep, awk, sed
3. **[kb/basics/bash-scripting](bash-scripting)** - Automate tasks with scripts

**Path to Infrastructure**:
4. **[kb/containers/docker-fundamentals](../containers/docker-fundamentals)** - Learn containerization
5. **[kb/sysadmin/systemd-deep-dive](../sysadmin/systemd-deep-dive)** - Manage system services
6. **[kb/infrastructure/ansible-basics](../infrastructure/ansible-basics)** - Automate server setup

**Path to Development**:
4. **[kb/basics/git-fundamentals](git-fundamentals)** - Version control
5. **[kb/cicd/forgejo-setup](../cicd/forgejo-setup)** - Self-hosted Git server
6. **[kb/cicd/ci-cd-concepts](../cicd/ci-cd-concepts)** - Continuous integration

### Practice Resources

Try these hands-on Linux environments:
- **OverTheWire Bandit**: https://overthewire.org/wargames/bandit/ - Linux challenges
- **Linux Survival**: https://linuxsurvival.com/ - Interactive tutorial
- **Hack The Box**: https://www.hackthebox.com/ - Advanced practice

---

## Community Resources

### 📚 Official Documentation
- [The Linux Documentation Project](https://tldp.org/) - Comprehensive guides
- [Ubuntu Documentation](https://help.ubuntu.com/) - Beginner-friendly
- [Arch Wiki](https://wiki.archlinux.org/) - Best technical reference (works for all distros)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/) - Command reference

### 🎓 Tutorials (Beginner)
- [Linux Journey](https://linuxjourney.com/) - Interactive lessons
- [The Missing Semester](https://missing.csail.mit.edu/) - MIT course
- [Ryan's Tutorials - Linux](https://ryanstutorials.net/linuxtutorial/) - Step-by-step guide
- [DigitalOcean Community](https://www.digitalocean.com/community/tags/linux-basics) - Practical guides

### 🎥 Video Courses (Beginner)
- [Linux for Beginners - freeCodeCamp](https://www.youtube.com/watch?v=sWbUDq4S6Y8) - 1-hour crash course
- [Complete Linux Course - NetworkChuck](https://www.youtube.com/watch?v=wBp0Rb-ZJak) - Hands-on
- [Linux Essentials - CBT Nuggets](https://www.cbtnuggets.com/it-training/linux-essentials) - Professional

### 📖 Books (Beginner to Intermediate)
- "The Linux Command Line" by William Shotts - Best beginner book (free online)
- "Linux Basics for Hackers" by OccupyTheWeb - Practical security focus
- "How Linux Works" by Brian Ward - Understanding the system
- "UNIX and Linux System Administration Handbook" - Comprehensive reference

### 💬 Community Help
- [r/linux4noobs](https://www.reddit.com/r/linux4noobs/) - Reddit for beginners
- [LinuxQuestions.org](https://www.linuxquestions.org/) - Active forum
- [Unix & Linux Stack Exchange](https://unix.stackexchange.com/) - Q&A site
- [Linux.org Forums](https://www.linux.org/forums/) - General discussion

### 🔧 Cheat Sheets
- [Linux Command Cheat Sheet](https://www.linuxtrainingacademy.com/linux-commands-cheat-sheet/)
- [DevHints Bash Cheat Sheet](https://devhints.io/bash)
- [OverAPI Linux](https://overapi.com/linux) - Quick reference

---

## Related KB Articles

**Prerequisites for This Article**:
- None - this is the starting point

**This Article is a Prerequisite For**:
- **[kb/basics/ssh-basics](ssh-basics)** - Remote server access
- **[kb/basics/command-line-essentials](command-line-essentials)** - Advanced CLI tools
- **[kb/basics/bash-scripting](bash-scripting)** - Shell scripting
- **[kb/containers/docker-fundamentals](../containers/docker-fundamentals)** - Containerization
- **[kb/sysadmin/systemd-deep-dive](../sysadmin/systemd-deep-dive)** - Service management

**Related Topics**:
- **[kb/sysadmin/system-admin-basics](../sysadmin/system-admin-basics)** - More advanced system administration
- **[kb/security/ssh-hardening](../security/ssh-hardening)** - Security best practices
- **[kb/basics/day1-new-developer](day1-new-developer)** - Complete onboarding guide

---

## Change Log

### 2026-01-30 - Initial Creation
- Created comprehensive Linux fundamentals guide
- Covered filesystem, permissions, users, processes
- Added ASCII filesystem tree diagram
- Included practical exercises and common gotchas
- Compiled beginner-friendly learning resources organized by type
- Added resource requirement bars for various scenarios
- Established foundation for KB basics series

---

**🎯 Remember**: Linux mastery comes from practice, not memorization. Don't worry about remembering every command - focus on understanding concepts and using `man` pages when needed. Welcome to the Linux world!
