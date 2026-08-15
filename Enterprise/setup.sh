#!/bin/bash

# Ensure the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or use sudo)"
  exit
fi

start_iscsi_service() {
    for svc in iscsid.service iscsi.service; do
        if systemctl list-unit-files "$svc" --no-legend 2>/dev/null | grep -q "^$svc"; then
            systemctl enable --now "$svc"
            return 0
        fi
    done

    echo "Error: Could not find an iSCSI service unit (tried iscsid.service and iscsi.service)."
    return 1
}

install_dependencies() {
    if command -v apt-get >/dev/null 2>&1; then
        echo "--> Detected Debian/Ubuntu family. Installing storage dependencies (Longhorn prep)..."
        apt-get update && apt-get install -y curl open-iscsi nfs-common util-linux git
        start_iscsi_service || exit 1
    elif command -v pacman >/dev/null 2>&1; then
        echo "--> Detected Arch family (Arch/Manjaro). Installing storage dependencies (Longhorn prep)..."
        pacman -Sy --noconfirm --needed curl open-iscsi nfs-utils util-linux git
        start_iscsi_service || exit 1
    else
        echo "Unsupported distro: this script currently supports Debian/Ubuntu and Arch-based systems."
        exit 1
    fi
}

echo "=========================================="
echo " Homelab GitOps Universal Node Setup      "
echo "=========================================="
echo "What role will this VPS play?"
echo "1) The First Node (Control Plane / Master)"
echo "2) An Additional Node (Worker)"
read -p "Enter 1 or 2: " NODE_TYPE

install_dependencies

if [ "$NODE_TYPE" == "1" ]; then
    echo "--> Initializing NEW K3s Control Plane..."
    curl -sfL https://get.k3s.io | sh -s - --disable traefik
    
    echo "--> Waiting for K3s to start (15 seconds)..."
    sleep 15
    
    # Automatically grab the token and IP so you don't have to search for them
    NODE_TOKEN=$(cat /var/lib/rancher/k3s/server/node-token)
    MY_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    
    echo "=================================================================="
    echo " MASTER NODE SETUP COMPLETE!                                      "
    echo " Save these details to paste into your worker nodes:              "
    echo " MASTER_IP: $MY_IP                                                "
    echo " K3S_TOKEN: $NODE_TOKEN                                           "
    echo "=================================================================="
    
    # Auto-start the GitOps core if the folder is present
    if [ -d "./core" ]; then
        echo "--> Applying core manifests from ./core..."
        # Using -R to ensure it recursively applies the ingress, storage, and forgejo subdirectories
        kubectl apply -R -f ./core/
        echo "--> Forgejo, Longhorn, SeaweedFS, and Caddy are spinning up!"
    else
        echo "--> 'core' directory not found. Skipping initial manifest deployment."
    fi

elif [ "$NODE_TYPE" == "2" ]; then
    echo "--> Joining EXISTING K3s Cluster..."
    read -p "Enter the MASTER_IP (from VPS #1): " MASTER_IP
    read -p "Enter the K3S_TOKEN (from VPS #1): " K3S_TOKEN
    
    if [ -z "$MASTER_IP" ] || [ -z "$K3S_TOKEN" ]; then
        echo "Error: Master IP and Token are required. Exiting."
        exit 1
    fi

    echo "--> Connecting to Master and joining cluster..."
    curl -sfL https://get.k3s.io | K3S_URL=https://${MASTER_IP}:6443 K3S_TOKEN=${K3S_TOKEN} sh -
    
    echo "=================================================================="
    echo " WORKER NODE SETUP COMPLETE!                                      "
    echo " This VPS is now offering its storage and compute to the cluster. "
    echo "=================================================================="
else
    echo "Invalid selection. Exiting."
    exit 1
fi
