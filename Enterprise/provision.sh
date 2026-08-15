#!/bin/bash

echo "=========================================="
echo " Homelab Control Plane Provisioning       "
echo "=========================================="

if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (or use sudo)"
  exit 1
fi

echo "--> 1. Updating System & Installing Security Essentials..."
apt-get update && apt-get upgrade -y
apt-get install -y fail2ban unattended-upgrades apt-listchanges curl git rsync sqlite3

echo "--> 2. Enabling Automatic Security Updates..."
# This configures Debian to automatically download and install critical security patches 
# without requiring manual intervention, while ignoring feature updates that might break things.
dpkg-reconfigure -f noninteractive unattended-upgrades
systemctl enable unattended-upgrades
systemctl start unattended-upgrades

echo "--> 3. Hardening SSH..."
# Disables password authentication. Only SSH Keys will be allowed.
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh

echo "--> 4. Configuring Fail2ban..."
# Creates a localized jail configuration to ban IPs that fail SSH login 5 times for 24 hours.
cat <<EOF > /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 86400
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo "=========================================="
echo " Provisioning Complete!                   "
echo " Your system is patched, Fail2ban is live,"
echo " and SSH is locked down to keys only.     "
echo " Note: We intentionally bypassed UFW. Use "
echo " your Cloud Provider's external firewall. "
echo " You may now run setup.sh.                "
echo "=========================================="
