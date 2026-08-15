# Homelab GitOps (K3s + FluxCD + Forgejo)

## Overview
This repository is the Absolute Source of Truth for the multi-node K3s cluster. It relies on Ansible for node bootstrapping and FluxCD for continuous GitOps deployments.
Full breakdown in: [[ARCHITECTURE.md]]

## Directory Structure
- `/ansible`: Infrastructure as Code. Run these playbooks to bootstrap new K3s master/worker nodes.
- `/core`: Essential cluster services (Forgejo, Longhorn, Nginx Proxy Manager).
- `/apps`: User-deployed applications.

## Quick Start

On a fresh node, run:

```bash
sudo bash setup.sh
```

## Full Node Reset / Uninstall

Use `remove.sh` to completely remove local K3s, Longhorn, and CNI state before a clean reinstall:

```bash
sudo bash remove.sh --yes
```

The `--yes` flag is required because this operation permanently removes local cluster state.

This script will:
- Run `k3s-uninstall.sh` when present (control-plane/server install), otherwise `k3s-agent-uninstall.sh` (worker/agent install).
- Remove local state directories:
   - `/var/lib/longhorn`
   - `/var/lib/rancher/k3s`
   - `/etc/rancher/k3s`
   - `/etc/cni/net.d`
   - `/var/lib/cni`

If networking behaves unexpectedly after reinstall, reboot once, then rerun setup.

## Migration & Scaling Logic (Joining a new VPS)

To scale out or migrate your setup to a new remote VPS and have it automatically pull its state:

1. **Provision the VPS**: Install Debian/Ubuntu Linux and ensure SSH access is available via keys.
2. **Update Inventory**: Add the new VPS IP address to `ansible/inventory.yml` under `[k3s_workers]` or `[k3s_masters]`.
3. **Run Bootstrap**:
   ```bash
   cd ansible
   ansible-playbook -i inventory.yml playbooks/bootstrap_k3s.yml
   ```
4. **GitOps Sync**: The new node will join the K3s cluster. If it's a replacement master node, FluxCD will pull the latest state from your Forgejo instance and ensure Longhorn replicates the persistent volumes to the new node.
5. **Decommission Old Node** (If migrating): Once Longhorn finishes rebuilding replicas on the new node, you can safely drain and delete the old dev machine.
