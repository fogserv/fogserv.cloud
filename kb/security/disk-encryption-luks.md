# Disk Encryption with LUKS - Data at Rest Security

**Resource Navigation:** [README](README) | [Certificate Fundamentals](certificate-fundamentals) | [Encrypted Backups](encrypted-backups) | [Password Management](password-management)

---

## Summary

Linux Unified Key Setup (LUKS) is the standard disk encryption specification for Linux, providing strong encryption for data at rest. This comprehensive guide covers LUKS architecture and cryptographic foundations, full disk encryption setup during installation and post-installation, encrypting existing partitions and volumes, LUKS header backup and recovery procedures, key management with multiple key slots and passphrase rotation, automated unlock with key files and TPM, encrypted LVM and RAID configurations, performance impact and optimization, remote unlock over SSH, encrypted swap and hibernation, disaster recovery procedures, and production patterns for database servers, application data, and compliance requirements (GDPR, HIPAA). Learn complete workflows for securing sensitive data at rest.

**The Golden Rule:** Encrypt data at rest - protect against physical theft and unauthorized access.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Understand LUKS architecture and encryption layers
- ✅ Encrypt disks during and after installation
- ✅ Manage LUKS keys and passphrases
- ✅ Implement automated unlocking with key files
- ✅ Configure encrypted LVM and RAID
- ✅ Back up and restore LUKS headers
- ✅ Set up remote unlock over SSH
- ✅ Optimize encryption performance
- ✅ Implement encrypted swap and hibernation
- ✅ Execute disaster recovery procedures

---

## Prerequisites

Before implementing LUKS encryption, you should have:

- **Linux fundamentals**: [Linux Fundamentals](../basics/linux-fundamentals) completed
- **Storage basics**: Understanding of partitions, LVM, filesystems
- **Backup strategy**: [Encrypted Backups](encrypted-backups) recommended
- **Password management**: [Password Management](password-management) for key storage
- **Command line**: Comfortable with disk operations

---

## LUKS Architecture

### Encryption Layers

```
┌──────────────────────────────────────────────────────┐
│              LUKS Encryption Stack                    │
└──────────────────────────────────────────────────────┘

Application Layer:
  ┌───────────────────────────────────────┐
  │      Files and Directories            │
  │     (Plain text to application)       │
  └───────────────┬───────────────────────┘
                  │
Filesystem Layer:
  ┌───────────────▼───────────────────────┐
  │      ext4 / xfs / btrfs               │
  │      (Filesystem operations)          │
  └───────────────┬───────────────────────┘
                  │
Device Mapper:
  ┌───────────────▼───────────────────────┐
  │      /dev/mapper/encrypted            │
  │   (Decrypted block device)            │
  └───────────────┬───────────────────────┘
                  │ Transparent encryption/decryption
LUKS Layer:      ▲ │ ▼
  ┌───────────────┴───────────────────────┐
  │          dm-crypt (kernel)            │
  │    AES-XTS-256 encryption             │
  │    Real-time encrypt/decrypt          │
  └───────────────┬───────────────────────┘
                  │
Physical Storage:
  ┌───────────────▼───────────────────────┐
  │        /dev/sda1 (encrypted)          │
  │       [Encrypted data on disk]        │
  └───────────────────────────────────────┘

Key Management:
┌─────────────────────────────────────────────┐
│           LUKS Header (on disk)             │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Master Key (encrypted)            │    │
│  │  - Never stored in plain text      │    │
│  │  - 256-bit random key              │    │
│  └────────────────────────────────────┘    │
│                                             │
│  Key Slot 0: [User Passphrase] ────────────┼─→ Unlocks
│  Key Slot 1: [Key File]        ────────────┼─→ Master
│  Key Slot 2: [Recovery Key]    ────────────┼─→ Key
│  Key Slot 3-7: [Empty]                     │
└─────────────────────────────────────────────┘

How It Works:
1. User provides passphrase
2. LUKS derives key from passphrase (PBKDF2)
3. Derived key unlocks Master Key from key slot
4. Master Key unlocks actual disk encryption
5. dm-crypt transparently encrypts/decrypts I/O
```

### LUKS vs LUKS2

```
LUKS1 (Legacy):
- Default in older systems
- Argon2 not supported (uses PBKDF2)
- Single iteration count for all key slots
- Maximum 8 key slots

LUKS2 (Modern - Recommended):
✅ Argon2id support (better password stretching)
✅ Per-key-slot iteration counts
✅ Up to 32 key slots
✅ Better header resilience
✅ Support for future features

Check LUKS version:
sudo cryptsetup luksDump /dev/sda1 | grep "Version"
```

---

## Full Disk Encryption (Installation)

### Ubuntu/Debian Installation

```
During Ubuntu installation:

1. Select "Erase disk and install Ubuntu"
2. Check "Use LVM with the new installation"
3. Check "Encrypt the new Ubuntu installation for security"
4. Choose strong passphrase (20+ characters recommended)
5. Installer will:
   - Create encrypted partition
   - Set up LVM on encrypted volume
   - Configure GRUB to prompt for passphrase at boot

Result:
/boot     → Unencrypted (contains kernel, initrd)
/         → Encrypted (root filesystem)
/home     → Encrypted (user data)
swap      → Encrypted (swap space)

Partition layout:
/dev/sda1  → /boot (ext4, unencrypted)
/dev/sda2  → LUKS container
  └─ LVM Physical Volume
     ├─ root  → /
     ├─ home  → /home
     └─ swap  → swap
```

### Manual Installation Setup

```bash
# Partitioning
sudo fdisk /dev/sda

# Create partitions:
# /dev/sda1 - 512MB (boot)
# /dev/sda2 - Remaining space (encrypted)

# Format boot partition
sudo mkfs.ext4 /dev/sda1

# Encrypt main partition
sudo cryptsetup luksFormat --type luks2 /dev/sda2
# Enter passphrase (twice)

# Open encrypted partition
sudo cryptsetup luksOpen /dev/sda2 cryptroot

# Create LVM on encrypted device
sudo pvcreate /dev/mapper/cryptroot
sudo vgcreate vg0 /dev/mapper/cryptroot

# Create logical volumes
sudo lvcreate -L 50G -n root vg0
sudo lvcreate -L 100G -n home vg0
sudo lvcreate -L 8G -n swap vg0

# Format logical volumes
sudo mkfs.ext4 /dev/vg0/root
sudo mkfs.ext4 /dev/vg0/home
sudo mkswap /dev/vg0/swap

# Mount for installation
sudo mount /dev/vg0/root /mnt
sudo mkdir /mnt/{boot,home}
sudo mount /dev/sda1 /mnt/boot
sudo mount /dev/vg0/home /mnt/home
sudo swapon /dev/vg0/swap

# Continue with OS installation...
```

---

## Post-Installation Encryption

### Encrypt Existing Partition

```bash
# ⚠️  WARNING: This will ERASE all data on the partition!
# Backup data first!

# Example: Encrypt /dev/sdb1

# 1. Backup data
sudo rsync -av /mnt/data/ /backup/data/

# 2. Unmount partition
sudo umount /dev/sdb1

# 3. Encrypt partition
sudo cryptsetup luksFormat /dev/sdb1
# Enter strong passphrase

# 4. Open encrypted partition
sudo cryptsetup luksOpen /dev/sdb1 encrypted_data

# 5. Create filesystem
sudo mkfs.ext4 /dev/mapper/encrypted_data

# 6. Mount and restore data
sudo mount /dev/mapper/encrypted_data /mnt/data
sudo rsync -av /backup/data/ /mnt/data/

# 7. Add to /etc/crypttab for auto-unlock
echo "encrypted_data /dev/sdb1 none luks" | sudo tee -a /etc/crypttab

# 8. Add to /etc/fstab for auto-mount
echo "/dev/mapper/encrypted_data /mnt/data ext4 defaults 0 2" | sudo tee -a /etc/fstab
```

### Encrypt Root Partition (In-Place)

```bash
# Very risky! Use live USB instead

# From live USB:
# 1. Boot from live USB
# 2. Open terminal

# Install cryptsetup
sudo apt install cryptsetup

# Backup current root
sudo mount /dev/sda2 /mnt
sudo rsync -av /mnt/ /backup/root/

# Unmount
sudo umount /mnt

# Encrypt
sudo cryptsetup luksFormat /dev/sda2
sudo cryptsetup luksOpen /dev/sda2 cryptroot

# Create filesystem and restore
sudo mkfs.ext4 /dev/mapper/cryptroot
sudo mount /dev/mapper/cryptroot /mnt
sudo rsync -av /backup/root/ /mnt/

# Update /etc/crypttab and /etc/fstab
# Reinstall GRUB
sudo mount /dev/sda1 /mnt/boot
sudo mount --bind /dev /mnt/dev
sudo mount --bind /proc /mnt/proc
sudo mount --bind /sys /mnt/sys
sudo chroot /mnt
update-initramfs -u
grub-install /dev/sda
update-grub
exit

# Reboot
sudo reboot
```

---

## LUKS Key Management

### View LUKS Header Information

```bash
# Display LUKS header info
sudo cryptsetup luksDump /dev/sda2

# Output shows:
# - LUKS version
# - Cipher (e.g., aes-xts-plain64)
# - Key size (512 bits = AES-256)
# - Used key slots
# - Iterations (PBKDF2/Argon2)
```

### Add Key Slot (Additional Passphrase)

```bash
# Add second passphrase to key slot 1
sudo cryptsetup luksAddKey /dev/sda2
# Enter existing passphrase
# Enter new passphrase (twice)

# Now you can unlock with either passphrase

# Add key from file
sudo dd if=/dev/urandom of=/root/keyfile bs=1024 count=4
sudo chmod 600 /root/keyfile
sudo cryptsetup luksAddKey /dev/sda2 /root/keyfile
```

### Remove Key Slot

```bash
# Remove specific key
sudo cryptsetup luksRemoveKey /dev/sda2
# Enter passphrase to remove

# Kill specific slot by number
sudo cryptsetup luksKillSlot /dev/sda2 1
# Enter any remaining valid passphrase
```

### Change Passphrase

```bash
# Change passphrase in existing slot
sudo cryptsetup luksChangeKey /dev/sda2
# Enter old passphrase
# Enter new passphrase (twice)
```

### Backup LUKS Header

```bash
# Backup header (CRITICAL - store securely!)
sudo cryptsetup luksHeaderBackup /dev/sda2 --header-backup-file /backup/luks-header-sda2.img

# Store backup securely:
# - Encrypted USB drive
# - Offline storage
# - Password manager (encrypted)

# Encrypt header backup
gpg --symmetric --cipher-algo AES256 /backup/luks-header-sda2.img

# Restore header (if corrupted)
sudo cryptsetup luksHeaderRestore /dev/sda2 --header-backup-file /backup/luks-header-sda2.img
```

---

## Automated Unlocking

### Key File Authentication

```bash
# Create key file
sudo dd if=/dev/urandom of=/root/luks-key bs=1024 count=4
sudo chmod 600 /root/luks-key

# Add key file to LUKS
sudo cryptsetup luksAddKey /dev/sdb1 /root/luks-key

# Update /etc/crypttab
echo "encrypted_data /dev/sdb1 /root/luks-key luks" | sudo tee -a /etc/crypttab

# Now device unlocks automatically at boot
```

### Key File on USB Drive

```bash
# Create key on USB
sudo dd if=/dev/urandom of=/media/usb/luks-key bs=1024 count=4
sudo chmod 600 /media/usb/luks-key

# Add to LUKS
sudo cryptsetup luksAddKey /dev/sda2 /media/usb/luks-key

# Update /etc/crypttab
# encrypted_root /dev/sda2 /media/usb/luks-key luks,keyscript=/lib/cryptsetup/scripts/passdev

# Boot requires USB drive inserted
```

### TPM 2.0 Integration

```bash
# Install systemd-cryptenroll (systemd 248+)
sudo apt install systemd tpm2-tools

# Enroll TPM
sudo systemd-cryptenroll --tpm2-device=auto /dev/sda2

# Device will auto-unlock using TPM
# Secure boot required for full security

# Remove TPM enrollment
sudo systemd-cryptenroll --wipe-slot=tpm2 /dev/sda2
```

---

## Remote Unlock (Dropbear SSH)

### Setup Remote Unlock

```bash
# Install dropbear (lightweight SSH for initramfs)
sudo apt install dropbear-initramfs

# Configure dropbear
sudo nano /etc/dropbear/initramfs/dropbear.conf

# Add:
DROPBEAR_OPTIONS="-p 2222 -s -j -k"

# Add SSH key for remote access
sudo nano /etc/dropbear/initramfs/authorized_keys
# Paste your public SSH key

# Update initramfs
sudo update-initramfs -u

# Reboot - server will wait for unlock on port 2222
```

### Unlock from Remote Client

```bash
# Connect to server
ssh -p 2222 root@server-ip

# Run unlock script
cryptroot-unlock

# Enter passphrase
# Server continues booting
```

### Automated Remote Unlock Script

```bash
#!/bin/bash
# unlock-remote.sh - Unlock remote encrypted server

SERVER="server-ip"
PORT="2222"
PASSPHRASE_FILE="/secure/location/passphrase.txt"

# Wait for server to be reachable
while ! nc -z $SERVER $PORT; do
    echo "Waiting for server..."
    sleep 5
done

# Unlock
ssh -p $PORT root@$SERVER "echo '$(cat $PASSPHRASE_FILE)' | cryptroot-unlock"

echo "Server unlocked!"
```

---

## Encrypted LVM Configuration

### Complete Encrypted LVM Setup

```bash
# Create encrypted partition
sudo cryptsetup luksFormat /dev/sdb

# Open
sudo cryptsetup luksOpen /dev/sdb cryptlvm

# Create LVM
sudo pvcreate /dev/mapper/cryptlvm
sudo vgcreate vg_encrypted /dev/mapper/cryptlvm

# Create logical volumes
sudo lvcreate -L 100G -n lv_data vg_encrypted
sudo lvcreate -L 50G -n lv_backup vg_encrypted
sudo lvcreate -l 100%FREE -n lv_archive vg_encrypted

# Format
sudo mkfs.ext4 /dev/vg_encrypted/lv_data
sudo mkfs.ext4 /dev/vg_encrypted/lv_backup
sudo mkfs.ext4 /dev/vg_encrypted/lv_archive

# Mount
sudo mkdir -p /mnt/{data,backup,archive}
sudo mount /dev/vg_encrypted/lv_data /mnt/data
sudo mount /dev/vg_encrypted/lv_backup /mnt/backup
sudo mount /dev/vg_encrypted/lv_archive /mnt/archive

# Make permanent
echo "cryptlvm /dev/sdb none luks" | sudo tee -a /etc/crypttab
echo "/dev/vg_encrypted/lv_data /mnt/data ext4 defaults 0 2" | sudo tee -a /etc/fstab
echo "/dev/vg_encrypted/lv_backup /mnt/backup ext4 defaults 0 2" | sudo tee -a /etc/fstab
echo "/dev/vg_encrypted/lv_archive /mnt/archive ext4 defaults 0 2" | sudo tee -a /etc/fstab
```

---

## Encrypted RAID

### LUKS on RAID

```bash
# Create RAID array
sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc

# Encrypt RAID device
sudo cryptsetup luksFormat /dev/md0
sudo cryptsetup luksOpen /dev/md0 cryptraid

# Create filesystem
sudo mkfs.ext4 /dev/mapper/cryptraid

# Mount
sudo mount /dev/mapper/cryptraid /mnt/raid

# Make permanent
echo "cryptraid /dev/md0 none luks" | sudo tee -a /etc/crypttab
echo "/dev/mapper/cryptraid /mnt/raid ext4 defaults 0 2" | sudo tee -a /etc/fstab
```

---

## Encrypted Swap

### Configure Encrypted Swap

```bash
# Check current swap
sudo swapon --show

# Disable current swap
sudo swapoff -a

# Remove from /etc/fstab
sudo nano /etc/fstab
# Comment out or remove swap line

# Create encrypted swap
# Option 1: Random key (recreated each boot - no hibernation)
echo "swap /dev/sda3 /dev/urandom swap,cipher=aes-xts-plain64,size=256" | sudo tee -a /etc/crypttab
echo "/dev/mapper/swap none swap sw 0 0" | sudo tee -a /etc/fstab

# Option 2: Persistent key (enables hibernation)
sudo dd if=/dev/urandom of=/root/swap-key bs=1024 count=4
sudo chmod 600 /root/swap-key
sudo cryptsetup luksFormat /dev/sda3
sudo cryptsetup luksAddKey /dev/sda3 /root/swap-key
echo "swap /dev/sda3 /root/swap-key luks" | sudo tee -a /etc/crypttab
sudo cryptsetup luksOpen /dev/sda3 swap
sudo mkswap /dev/mapper/swap
echo "/dev/mapper/swap none swap sw 0 0" | sudo tee -a /etc/fstab

# Enable swap
sudo swapon -a

# Verify
sudo swapon --show
```

### Hibernate with Encryption

```bash
# Update GRUB with resume device
sudo nano /etc/default/grub

# Add:
GRUB_CMDLINE_LINUX="resume=/dev/mapper/swap"

# Update GRUB
sudo update-grub

# Update initramfs
sudo update-initramfs -u

# Test hibernation
sudo systemctl hibernate
```

---

## Performance Optimization

### Check Encryption Performance

```bash
# Benchmark cryptsetup
sudo cryptsetup benchmark

# Output shows throughput for different algorithms:
# aes-cbc        256 bit:  500 MiB/s
# aes-xts        256 bit:  550 MiB/s (recommended)
# aes-xts        512 bit:  450 MiB/s

# Check if AES-NI (hardware acceleration) is available
grep -m1 aes /proc/cpuinfo

# If "aes" appears, hardware acceleration is supported
```

### Optimize Cipher

```bash
# Use AES-XTS with 256-bit key (most compatible and fast with AES-NI)
sudo cryptsetup luksFormat --cipher aes-xts-plain64 --key-size 512 /dev/sdb

# For extreme performance (less tested):
# sudo cryptsetup luksFormat --cipher aes-xts-plain64 --key-size 256 /dev/sdb
```

### I/O Scheduler Optimization

```bash
# Check current scheduler
cat /sys/block/sda/queue/scheduler

# Set to none (for NVMe) or mq-deadline (for SATA/SAS)
echo "mq-deadline" | sudo tee /sys/block/sda/queue/scheduler

# Make permanent
cat << EOF | sudo tee /etc/udev/rules.d/60-scheduler.rules
ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/scheduler}="mq-deadline"
ACTION=="add|change", KERNEL=="nvme[0-9]n[0-9]", ATTR{queue/scheduler}="none"
EOF
```

---

## Disaster Recovery

### Recovery Procedure

```bash
# Boot from live USB

# List partitions
sudo fdisk -l

# Restore LUKS header (if corrupted)
sudo cryptsetup luksHeaderRestore /dev/sda2 --header-backup-file /backup/luks-header.img

# Open encrypted device
sudo cryptsetup luksOpen /dev/sda2 cryptroot

# Check filesystem
sudo fsck /dev/mapper/cryptroot

# Mount
sudo mount /dev/mapper/cryptroot /mnt

# Access data
ls /mnt
```

### Emergency Access

```bash
# If passphrase forgotten:
# 1. Try all key slots (0-7)
# 2. Use recovery key if configured
# 3. Use header backup + old passphrase

# If header corrupted and no backup:
# ❌ Data is UNRECOVERABLE
# This is why header backups are CRITICAL!
```

---

## Production Patterns

### Database Server Encryption

```bash
# Encrypt database partition
sudo cryptsetup luksFormat /dev/sdb
sudo cryptsetup luksOpen /dev/sdb db_encrypted
sudo mkfs.ext4 /dev/mapper/db_encrypted
sudo mount /dev/mapper/db_encrypted /var/lib/postgresql

# Add key file for auto-unlock
sudo dd if=/dev/urandom of=/root/db-key bs=1024 count=4
sudo chmod 600 /root/db-key
sudo cryptsetup luksAddKey /dev/sdb /root/db-key

# Update /etc/crypttab
echo "db_encrypted /dev/sdb /root/db-key luks" | sudo tee -a /etc/crypttab
echo "/dev/mapper/db_encrypted /var/lib/postgresql ext4 defaults 0 2" | sudo tee -a /etc/fstab

# Restart database
sudo systemctl restart postgresql
```

### Container Storage Encryption

```bash
# Encrypt Docker volume directory
sudo systemctl stop docker

# Backup Docker data
sudo rsync -av /var/lib/docker/ /backup/docker/

# Create encrypted volume
sudo cryptsetup luksFormat /dev/sdc
sudo cryptsetup luksOpen /dev/sdc docker_encrypted
sudo mkfs.ext4 /dev/mapper/docker_encrypted
sudo mount /dev/mapper/docker_encrypted /var/lib/docker

# Restore data
sudo rsync -av /backup/docker/ /var/lib/docker/

# Configure auto-unlock
echo "docker_encrypted /dev/sdc /root/docker-key luks" | sudo tee -a /etc/crypttab

# Start Docker
sudo systemctl start docker
```

---

## Compliance and Best Practices

### Security Checklist

```
☑ Use LUKS2 (not LUKS1)
☑ AES-XTS-256 encryption
☑ Strong passphrase (20+ characters)
☑ Multiple key slots (passphrase + key file + recovery)
☑ LUKS header backed up (encrypted, offline storage)
☑ Key files secured (chmod 600, root-only)
☑ Encrypted swap enabled
☑ Regular passphrase rotation
☑ Documented recovery procedures
☑ Tested disaster recovery
☑ Compliance requirements met (GDPR, HIPAA, PCI-DSS)
☑ Performance monitoring
☑ Regular security audits
```

---

## What's Next?

After mastering LUKS encryption:

**Backup & Recovery:**
- [Encrypted Backups](encrypted-backups) - Secure backup encryption
- [Disaster Recovery](../infrastructure/disaster-recovery) - Complete DR plan

**Secrets Management:**
- [Vault Introduction](vault-introduction) - Centralized secrets
- [Password Management](password-management) - Password vault integration

**Advanced Security:**
- [Zero Trust Principles](zero-trust-principles) - Defense in depth
- [Compliance Automation](compliance-automation) - Automated compliance

---

## Additional Resources

### Official Documentation
- [LUKS Specification](https://gitlab.com/cryptsetup/cryptsetup)
- [dm-crypt Documentation](https://www.kernel.org/doc/html/latest/admin-guide/device-mapper/dm-crypt.html)
- [Arch Wiki - dm-crypt](https://wiki.archlinux.org/title/Dm-crypt)

### Tools
- [cryptsetup](https://gitlab.com/cryptsetup/cryptsetup) - LUKS management
- [VeraCrypt](https://www.veracrypt.fr/) - Cross-platform encryption (Windows/Linux/Mac)
- [Tomb](https://www.dyne.org/software/tomb/) - File encryption with LUKS

### Security Standards
- [NIST SP 800-111](https://csrc.nist.gov/publications/detail/sp/800-111/rev-1/final) - Guide to Storage Encryption
- [FIPS 140-2](https://csrc.nist.gov/publications/detail/fips/140/2/final) - Cryptographic module standards

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive LUKS disk encryption guide covering LUKS1 vs LUKS2 architecture, full disk encryption during installation and post-installation, encrypting existing partitions with data migration, LUKS header management and critical backup procedures, key slot management with multiple passphrases and key files, automated unlocking with key files and TPM 2.0, remote unlock over SSH with dropbear, encrypted LVM and RAID configurations, encrypted swap with hibernation support, performance optimization with AES-NI and I/O schedulers, disaster recovery procedures, production patterns for database and container storage, compliance requirements (GDPR, HIPAA, PCI-DSS), and complete security best practices for protecting data at rest.

