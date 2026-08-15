# Docker Installation - Getting Started with Containers

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Setup  
**Prerequisites**: [docker-concepts](docker-concepts), [kb/basics/linux-fundamentals](../basics/linux-fundamentals)  
**Time**: 1-2 hours  
**Tags**: docker, podman, installation, setup, linux, macos, windows

## Summary

Install Docker and Podman on Linux, macOS, and Windows. Complete setup including post-installation configuration, verification, and troubleshooting. Choose between Docker Desktop, Docker Engine, or Podman based on your needs.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Choose the right Docker/Podman installation for your OS
- ✅ Install Docker Engine (Linux)
- ✅ Install Docker Desktop (Windows/Mac)
- ✅ Install Podman as Docker alternative
- ✅ Configure Docker for non-root access
- ✅ Verify installation
- ✅ Troubleshoot common issues

## 🤔 Choosing Your Path

### Docker vs Podman Decision

**Quick Recommendation**:
- **Learning/Development**: Docker Desktop (easiest)
- **Linux Server**: Docker Engine or Podman
- **Security Priority**: Podman (rootless)
- **Windows/Mac**: Docker Desktop
- **Team Standard**: Whatever your team uses

---

## 🐧 Linux Installation

### Option 1: Docker Engine (Most Popular)

**Supports**: Ubuntu, Debian, Fedora, RHEL, CentOS, Arch

#### Ubuntu/Debian Installation

```bash
# 1. Remove old versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc

# 2. Update package index
sudo apt update

# 3. Install prerequisites
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 4. Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 5. Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 6. Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 7. Verify installation
sudo docker run hello-world
```

**For Debian**: Replace `ubuntu` with `debian` in step 5.

---

#### Fedora/RHEL/CentOS Installation

```bash
# 1. Remove old versions
sudo dnf remove docker docker-client docker-client-latest docker-common \
    docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 2. Install dependencies
sudo dnf -y install dnf-plugins-core

# 3. Add repository
sudo dnf config-manager --add-repo \
    https://download.docker.com/linux/fedora/docker-ce.repo

# 4. Install Docker Engine
sudo dnf install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

# 5. Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# 6. Verify
sudo docker run hello-world
```

---

#### Arch Linux Installation

```bash
# Install from official repos
sudo pacman -S docker docker-compose

# Start and enable service
sudo systemctl start docker.service
sudo systemctl enable docker.service

# Verify
sudo docker run hello-world
```

---

### Option 2: Podman (Rootless Alternative)

**Why Podman?**
- Daemonless architecture
- Rootless by default
- Drop-in Docker replacement
- Better systemd integration

#### Podman on Ubuntu/Debian

```bash
# Ubuntu 20.10+
sudo apt update
sudo apt install -y podman

# Verify
podman --version
podman run hello-world
```

#### Podman on Fedora/RHEL

```bash
# Pre-installed on Fedora 32+
# Or install:
sudo dnf install -y podman podman-compose

# Verify
podman --version
podman run hello-world
```

#### Podman on Arch

```bash
sudo pacman -S podman podman-compose

# Verify
podman --version
```

---

### Post-Installation: Run Docker Without Sudo

**Problem**: `docker` commands require `sudo` by default.

**Solution**: Add your user to `docker` group.

```bash
# Create docker group (usually exists)
sudo groupadd docker

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group changes (log out/in or run)
newgrp docker

# Verify non-root access
docker run hello-world

# If still fails, check Docker socket permissions
sudo chmod 666 /var/run/docker.sock  # Quick fix
# Or properly:
sudo chown root:docker /var/run/docker.sock
```

**Security Note**: Users in `docker` group have root-equivalent privileges. Be cautious in multi-user systems.

---

### Docker as Systemd Service

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Start Docker service
sudo systemctl start docker

# Check status
sudo systemctl status docker

# View logs
sudo journalctl -u docker.service -f
```

---

## 🪟 Windows Installation

### Docker Desktop for Windows

**Requirements**:
- Windows 10/11 64-bit: Pro, Enterprise, or Education
- WSL 2 or Hyper-V enabled
- 4GB RAM minimum (8GB+ recommended)

#### Installation Steps

1. **Download Docker Desktop**:
   - Visit [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Download Windows installer

2. **Run Installer**:
   - Double-click `Docker Desktop Installer.exe`
   - Follow wizard (enable WSL 2 option)

3. **Enable WSL 2** (if not already):
   ```powershell
   # Run PowerShell as Administrator
   wsl --install
   wsl --set-default-version 2
   ```

4. **Start Docker Desktop**:
   - Launch from Start menu
   - Wait for Docker engine to start (whale icon in system tray)

5. **Verify Installation**:
   ```powershell
   # In PowerShell or CMD
   docker --version
   docker run hello-world
   ```

#### Docker Desktop Settings

**Recommended Configurations**:
- **General**: Enable WSL 2 based engine
- **Resources**: Allocate CPU and RAM
  - CPUs: 2-4
  - Memory: 4-8GB
  - Disk: 100GB+
- **Docker Engine**: Default settings usually fine
- **Kubernetes**: Enable if needed (optional)

---

### Alternative: Podman on Windows

**Podman Desktop** (newer, experimental):

1. **Download**: [podman-desktop.io](https://podman-desktop.io/)
2. **Install**: Run installer
3. **Verify**:
   ```powershell
   podman --version
   podman run hello-world
   ```

**Note**: Podman on Windows uses a Linux VM internally (like Docker Desktop).

---

## 🍎 macOS Installation

### Docker Desktop for macOS

**Requirements**:
- macOS 11+ (Big Sur or later)
- Apple Silicon (M1/M2) or Intel chip
- 4GB RAM minimum

#### Installation Steps

1. **Download Docker Desktop**:
   - [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Choose: Apple Silicon or Intel chip

2. **Install**:
   - Open `.dmg` file
   - Drag Docker to Applications folder
   - Launch Docker from Applications

3. **Grant Permissions**:
   - First run asks for privileged access (approve)
   - Required for network and filesystem access

4. **Verify**:
   ```bash
   docker --version
   docker run hello-world
   ```

#### Docker Desktop Settings (macOS)

**Resources**:
- **CPUs**: 2-4
- **Memory**: 4-8GB
- **Disk**: 100GB+
- **File Sharing**: Add directories as needed

---

### Alternative: Podman on macOS

**Using Homebrew**:

```bash
# Install Podman
brew install podman

# Initialize Podman machine (Linux VM)
podman machine init

# Start Podman machine
podman machine start

# Verify
podman --version
podman run hello-world

# Alias docker → podman (optional)
echo 'alias docker=podman' >> ~/.zshrc
source ~/.zshrc
```

---

## ✅ Verification and Testing

### Basic Verification

```bash
# Check Docker version
docker --version
# Should show: Docker version 25.0.x, build xxxxx

# Check Docker info
docker info
# Shows: containers, images, storage driver, etc.

# Run test container
docker run hello-world
# Should pull image and show success message

# Check running containers
docker ps

# Check all containers (including stopped)
docker ps -a

# List downloaded images
docker images
```

---

### Test Real Container

```bash
# Run Nginx web server
docker run -d -p 8080:80 --name test-nginx nginx:latest

# Verify it's running
docker ps

# Test web server
curl http://localhost:8080
# Should show "Welcome to nginx!"

# Or open browser: http://localhost:8080

# View logs
docker logs test-nginx

# Stop and remove
docker stop test-nginx
docker rm test-nginx
```

---

### Podman Verification

```bash
# Same commands work!
podman --version
podman info
podman run hello-world
podman ps
podman images

# Test Nginx
podman run -d -p 8080:80 --name test-nginx nginx:latest
curl http://localhost:8080

# Cleanup
podman stop test-nginx
podman rm test-nginx
```

---

## 🔧 Configuration

### Docker Configuration File

**Location**: `/etc/docker/daemon.json` (Linux) or Docker Desktop settings (Win/Mac)

**Example Configuration**:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-address-pools": [
    {
      "base": "172.17.0.0/12",
      "size": 24
    }
  ],
  "dns": ["8.8.8.8", "8.8.4.4"],
  "insecure-registries": [],
  "registry-mirrors": []
}
```

**Apply Changes**:
```bash
# Linux
sudo systemctl restart docker

# Or Docker Desktop: Restart from GUI
```

---

### Useful Docker Settings

**Log Rotation** (prevent huge logs):
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

**Storage Driver** (Linux):
```json
{
  "storage-driver": "overlay2"
}
```

**Custom DNS**:
```json
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
```

---

### Podman Configuration

**Location**: `~/.config/containers/containers.conf` (rootless)
or `/etc/containers/containers.conf` (root)

**Example Configuration**:
```ini
[engine]
# Number of parallel image pulls
image_parallel_copies = 3

[containers]
# Default network mode
netns = "bridge"

# Log driver
log_driver = "journald"
```

---

## 🚨 Troubleshooting

### Issue 1: "Permission Denied" on Linux

**Symptom**:
```
Got permission denied while trying to connect to the Docker daemon socket
```

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or:
newgrp docker

# Verify
docker run hello-world
```

---

### Issue 2: Docker Service Not Running

**Symptom**:
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution**:
```bash
# Check service status
sudo systemctl status docker

# Start if stopped
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Check for errors
sudo journalctl -u docker.service -n 50
```

---

### Issue 3: WSL 2 Not Installed (Windows)

**Symptom**: Docker Desktop fails to start, mentions WSL 2

**Solution**:
```powershell
# Run as Administrator in PowerShell
wsl --install
wsl --set-default-version 2

# Restart computer
# Then start Docker Desktop
```

---

### Issue 4: VT-x/AMD-V Not Enabled

**Symptom**: Virtualization error on Windows/Mac

**Solution**:
1. Enter BIOS/UEFI settings (reboot, press F2/Del/F12)
2. Find "Virtualization Technology" or "VT-x" or "AMD-V"
3. Enable it
4. Save and exit
5. Restart Docker Desktop

---

### Issue 5: Podman Cannot Pull Images

**Symptom**: `Error: short-name "nginx" did not resolve to an alias`

**Solution**:
```bash
# Specify full registry
podman run docker.io/nginx:latest

# Or configure default registry
echo 'unqualified-search-registries=["docker.io"]' | \
    sudo tee -a /etc/containers/registries.conf

# Restart Podman machine (macOS)
podman machine stop
podman machine start
```

---

### Issue 6: Storage Space Issues

**Check Docker Disk Usage**:
```bash
docker system df
```

**Clean Up**:
```bash
# Remove unused data
docker system prune

# Remove everything (be careful!)
docker system prune -a --volumes
```

---

## 🔒 Security Considerations

### Docker Socket Permissions

**Understand the Risk**: Access to Docker socket = root access!

**Best Practices**:
1. Don't expose Docker socket over network
2. Limit who is in `docker` group
3. Consider rootless Docker (experimental)
4. Use Podman for rootless by default

---

### Rootless Docker (Advanced)

**Install Rootless Docker**:
```bash
# Install rootless Docker
curl -fsSL https://get.docker.com/rootless | sh

# Add to PATH
export PATH=/home/$USER/bin:$PATH
export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock

# Add to .bashrc or .zshrc
echo 'export PATH=/home/$USER/bin:$PATH' >> ~/.bashrc
echo 'export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock' >> ~/.bashrc
```

**Limitations**:
- Cannot bind to ports < 1024 (use port mapping)
- Some network features limited
- Performance slightly lower

---

## 💡 Quick Tips

**Alias for Podman Users**:
```bash
# Make podman respond to docker commands
echo 'alias docker=podman' >> ~/.bashrc
source ~/.bashrc
```

**Docker Compose Alias** (older systems):
```bash
# If docker-compose not installed
alias docker-compose='docker compose'
```

**Check What's Using Disk**:
```bash
docker system df -v
```

**Fast Cleanup**:
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune
```

---

## 🔗 What's Next?

Installation complete! Now learn to use Docker:

**Hands-On**:
- **[docker-basics](docker-basics)** - Your first containers, essential commands

**Building Images**:
- **[dockerfile-guide](dockerfile-guide)** - Create custom images

**Storage**:
- **[docker-volumes](docker-volumes)** - Persistent data

---

## 📚 Resources

**Official Docs**:
- [Docker Installation](https://docs.docker.com/engine/install/)
- [Podman Installation](https://podman.io/getting-started/installation)
- [Docker Desktop](https://docs.docker.com/desktop/)

**Troubleshooting**:
- [Docker Post-Installation Steps](https://docs.docker.com/engine/install/linux-postinstall/)
- [Docker Troubleshooting](https://docs.docker.com/config/daemon/troubleshoot/)

---

## 📝 Change Log

### 2026-01-30
- Created Docker installation guide
- Covered Linux, Windows, macOS
- Included Podman installation steps
- Added post-installation configuration
- Provided troubleshooting section
- Included security considerations

---

**Next Article**: [docker-basics](docker-basics) - Learn essential Docker commands!

