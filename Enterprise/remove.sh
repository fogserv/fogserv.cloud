#!/bin/bash
set -euo pipefail

if [ "${1:-}" != "--yes" ]; then
  echo "Usage: sudo bash remove.sh --yes"
  echo "This script permanently removes local K3s, Longhorn, and CNI state."
  exit 1
fi

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Please run as root (or use sudo)"
  exit 1
fi

echo "=========================================="
echo " Enterprise K3s Node Reset                "
echo "=========================================="

if [ -x /usr/local/bin/k3s-uninstall.sh ]; then
  echo "--> Running k3s-uninstall.sh (server/control-plane)"
  /usr/local/bin/k3s-uninstall.sh
elif [ -x /usr/local/bin/k3s-agent-uninstall.sh ]; then
  echo "--> Running k3s-agent-uninstall.sh (worker/agent)"
  /usr/local/bin/k3s-agent-uninstall.sh
else
  echo "--> No K3s uninstall script found in /usr/local/bin, continuing with filesystem cleanup"
fi

echo "--> Removing K3s/Longhorn/CNI state directories"
for path in \
  /var/lib/longhorn \
  /var/lib/rancher/k3s \
  /etc/rancher/k3s \
  /etc/cni/net.d \
  /var/lib/cni
 do
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo "   removed: $path"
  else
    echo "   not present: $path"
  fi
done

echo "--> Reset complete"
echo "If you are about to reinstall K3s and networking behaves unexpectedly, reboot once before setup."
