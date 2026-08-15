#!/bin/bash
#
# Enterprise Infrastructure Bootstrap Script
# This script bootstraps the K3s cluster and core infrastructure on grove.shire.one
#
# Usage: sudo ./bootstrap.sh [command]
# Commands:
#   init       - Initialize K3s cluster
#   deploy     - Deploy core services (Vault, Forgejo, AI Agent)
#   reset      - Reset cluster state (destructive!)
#   status     - Show cluster status
#   help       - Show this help message
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="fogserv-cloud"
VERSION="1.0.0"
LOG_FILE="/var/log/enterprise-bootstrap.log"
ANSIBLE_DIR="$(dirname "$0")/ansible"

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    log "INFO" "$1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    log "WARN" "$1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR" "$1"
}

log_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root"
        log_error "Use: sudo $0 $1"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking infrastructure prerequisites..."
    
    local missing=0
    
    # Check for required commands
    for cmd in curl git ansible kubectl helm; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            missing=1
        fi
    done
    
    # Check for SSH access to grove.shire.one
    if [ -f "$ANSIBLE_DIR/inventory.yml" ]; then
        log_info "Ansible inventory found"
    else
        log_error "Ansible inventory not found at $ANSIBLE_DIR/inventory.yml"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        log_error "Prerequisites check failed"
        exit 1
    fi
    
    log_info "All infrastructure prerequisites met"
}

# Initialize K3s cluster
init_k3s() {
    log_header "Initializing K3s Cluster"
    
    # Update system
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    
    # Install prerequisites
    log_info "Installing prerequisite packages..."
    apt install -y curl git open-iscsi nfs-common
    
    # Enable iscsid for Longhorn
    log_info "Enabling iSCSI daemon..."
    systemctl enable iscsid
    systemctl start iscsid
    
    # Install K3s
    log_info "Installing K3s..."
    if [ ! -f /usr/local/bin/k3s ]; then
        curl -sfL https://get.k3s.io | sh -s - server --cluster-init
        
        # Wait for K3s to be ready
        log_info "Waiting for K3s to be ready..."
        sleep 10
        
        # Create kubectl symlink
        ln -sf /usr/local/bin/k3s /usr/local/bin/kubectl
    else
        log_info "K3s is already installed"
    fi
    
    # Configure kubectl
    if [ ! -f ~/.kube/config ]; then
        mkdir -p ~/.kube
        cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
        chown $(whoami):$(whoami) ~/.kube/config
    fi
    
    # Install Helm
    if ! command -v helm &> /dev/null; then
        log_info "Installing Helm..."
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    fi
    
    log_info "K3s cluster initialized"
}

# Deploy core services
deploy_services() {
    log_header "Deploying Core Services"
    
    # Check if K3s is running
    if ! systemctl is-active --quiet k3s; then
        log_error "K3s is not running. Starting K3s..."
        systemctl start k3s
    fi
    
    # Wait for cluster to be ready
    log_info "Waiting for cluster to be ready..."
    kubectl wait --for=condition=ready nodes --all --timeout=300s
    
    # Deploy Vault
    log_info "Deploying HashiCorp Vault..."
    if [ -f "$ANSIBLE_DIR/playbooks/deploy_vault.yml" ]; then
        cd "$ANSIBLE_DIR"
        ansible-playbook -i inventory.yml playbooks/deploy_vault.yml
        cd - > /dev/null
    else
        log_warn "Vault deployment playbook not found"
    fi
    
    # Deploy Forgejo
    log_info "Deploying Forgejo..."
    if [ -f "$ANSIBLE_DIR/playbooks/deploy_forgejo.yml" ]; then
        cd "$ANSIBLE_DIR"
        ansible-playbook -i inventory.yml playbooks/deploy_forgejo.yml
        cd - > /dev/null
    else
        log_warn "Forgejo deployment playbook not found"
    fi
    
    # Deploy AI Agent
    log_info "Deploying AI Agent..."
    if [ -f "$ANSIBLE_DIR/playbooks/deploy_ai_agent.yml" ]; then
        cd "$ANSIBLE_DIR"
        ansible-playbook -i inventory.yml playbooks/deploy_ai_agent.yml
        cd - > /dev/null
    else
        log_warn "AI Agent deployment playbook not found"
    fi
    
    log_info "Core services deployment complete"
}

# Reset cluster state (destructive!)
reset_cluster() {
    log_header "Resetting Cluster State"
    
    echo -e "${RED}WARNING: This will destroy all cluster data!${NC}"
    echo "This includes:"
    echo "  - All K3s clusters and configurations"
    echo "  - All persistent volumes"
    echo "  - All deployed services (Vault, Forgejo, AI Agent)"
    echo ""
    echo "Type 'YES' to continue:"
    read confirmation
    
    if [ "$confirmation" != "YES" ]; then
        log_info "Reset cancelled"
        exit 0
    fi
    
    # Run uninstall script if it exists
    if [ -f "$(dirname "$0")/remove.sh" ]; then
        log_info "Running remove.sh..."
        bash "$(dirname "$0")/remove.sh" --yes
    else
        log_error "remove.sh not found"
        exit 1
    fi
    
    # Clean up additional state
    log_info "Cleaning up additional state..."
    rm -rf /var/lib/longhorn
    rm -rf /var/lib/rancher/k3s
    rm -rf /etc/rancher/k3s
    rm -rf /etc/cni/net.d
    rm -rf /var/lib/cni
    
    # Remove kubectl config
    rm -rf ~/.kube/config
    
    log_info "Cluster reset complete"
    log_info "Reboot recommended before reinitialization"
}

# Show cluster status
show_status() {
    log_header "Cluster Status"
    
    echo -e "${GREEN}K3s Service:${NC}"
    systemctl status k3s --no-pager | head -n 5
    
    echo -e "\n${GREEN}Cluster Information:${NC}"
    kubectl cluster-info 2>/dev/null || echo "Cluster not accessible"
    
    echo -e "\n${GREEN}Nodes:${NC}"
    kubectl get nodes 2>/dev/null || echo "Cluster not accessible"
    
    echo -e "\n${GREEN}Namespaces:${NC}"
    kubectl get namespaces 2>/dev/null || echo "Cluster not accessible"
    
    echo -e "\n${GREEN}Deployments:${NC}"
    kubectl get deployments --all-namespaces 2>/dev/null || echo "Cluster not accessible"
    
    echo -e "\n${GREEN}Services:${NC}"
    kubectl get services --all-namespaces 2>/dev/null || echo "Cluster not accessible"
    
    echo -e "\n${GREEN}Persistent Volumes:${NC}"
    kubectl get pv,pvc --all-namespaces 2>/dev/null || echo "Cluster not accessible"
}

# Show help
show_help() {
    echo "Enterprise Infrastructure Bootstrap Script v$VERSION"
    echo ""
    echo "Usage: sudo $0 [command]"
    echo ""
    echo "Commands:"
    echo "  init       - Initialize K3s cluster on this node"
    echo "  deploy     - Deploy core services (Vault, Forgejo, AI Agent)"
    echo "  reset      - Reset cluster state (destructive!)"
    echo "  status     - Show cluster status"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  sudo $0 init     # Initialize K3s cluster"
    echo "  sudo $0 deploy   # Deploy all core services"
    echo "  sudo $0 status   # Show current cluster status"
    echo "  sudo $0 reset    # Reset entire cluster (requires confirmation)"
    echo ""
    echo "Note: This script is designed for grove.shire.one"
    echo "For application-level bootstrap, use: ./bootstrap.sh"
}

# Main command handler
case "${1:-help}" in
    init)
        check_root
        check_prerequisites
        init_k3s
        log_info "K3s initialization complete!"
        log_info "Run 'sudo $0 deploy' to deploy core services"
        ;;
    deploy)
        check_root
        check_prerequisites
        deploy_services
        log_info "Services deployment complete!"
        log_info "Run 'sudo $0 status' to check status"
        ;;
    reset)
        check_root
        reset_cluster
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
