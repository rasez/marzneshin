#!/bin/bash
set -e

# Marzneshin Complete Uninstall Script
# This script removes marzneshin, marznode, and all related data from your server

APP_NAME="marzneshin"
NODE_NAME="marznode"
CONFIG_DIR="/etc/opt/$APP_NAME"
DATA_DIR="/var/lib/$APP_NAME"
NODE_DATA_DIR="/var/lib/$NODE_NAME"
COMPOSE_FILE="$CONFIG_DIR/docker-compose.yml"

colorized_echo() {
    local color=$1
    local text=$2

    case $color in
        "red")
        printf "\e[91m${text}\e[0m\n";;
        "green")
        printf "\e[92m${text}\e[0m\n";;
        "yellow")
        printf "\e[93m${text}\e[0m\n";;
        "blue")
        printf "\e[94m${text}\e[0m\n";;
        "magenta")
        printf "\e[95m${text}\e[0m\n";;
        "cyan")
        printf "\e[96m${text}\e[0m\n";;
        *)
            echo "${text}"
        ;;
    esac
}

check_running_as_root() {
    if [ "$(id -u)" != "0" ]; then
        colorized_echo red "This script must be run as root."
        exit 1
    fi
}

show_warning() {
    colorized_echo red "========================================"
    colorized_echo red "⚠️  WARNING: This will completely remove Marzneshin!"
    colorized_echo red "========================================"
    echo
    colorized_echo yellow "The following will be removed:"
    echo "  - Marzneshin Docker containers"
    echo "  - Marznode Docker containers"
    echo "  - All configuration files ($CONFIG_DIR)"
    echo "  - All data files ($DATA_DIR)"
    echo "  - All Marznode data ($NODE_DATA_DIR)"
    echo "  - Docker images (optional)"
    echo "  - Marzneshin script (/usr/local/bin/marzneshin)"
    echo
    colorized_echo red "⚠️  ALL USER DATA WILL BE LOST!"
    echo
    read -p "Are you sure you want to continue? Type 'yes' to confirm: " confirm
    if [[ "$confirm" != "yes" ]]; then
        colorized_echo yellow "Uninstall cancelled."
        exit 0
    fi
}

stop_services() {
    colorized_echo blue "Stopping Marzneshin services..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        cd "$CONFIG_DIR"
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose down
        elif docker compose version >/dev/null 2>&1; then
            docker compose down
        else
            colorized_echo yellow "Docker compose not found, skipping..."
        fi
        colorized_echo green "Services stopped."
    else
        colorized_echo yellow "Compose file not found, skipping..."
    fi
}

remove_containers() {
    colorized_echo blue "Removing Docker containers..."
    
    # Remove marzneshin containers
    docker ps -a --filter "name=marzneshin" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    docker ps -a --filter "name=marznode" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    
    colorized_echo green "Containers removed."
}

remove_images() {
    echo
    read -p "Do you want to remove Docker images? (y/n): " remove_images
    
    if [[ "$remove_images" == "y" || "$remove_images" == "Y" ]]; then
        colorized_echo blue "Removing Docker images..."
        
        # Remove marzneshin images
        docker images --filter "reference=dawsh/marzneshin*" --format "{{.ID}}" | xargs -r docker rmi -f 2>/dev/null || true
        docker images --filter "reference=dawsh/marznode*" --format "{{.ID}}" | xargs -r docker rmi -f 2>/dev/null || true
        docker images --filter "reference=marzneshin:*" --format "{{.ID}}" | xargs -r docker rmi -f 2>/dev/null || true
        
        colorized_echo green "Images removed."
    else
        colorized_echo yellow "Keeping Docker images."
    fi
}

remove_config_files() {
    colorized_echo blue "Removing configuration files..."
    
    if [ -d "$CONFIG_DIR" ]; then
        rm -rf "$CONFIG_DIR"
        colorized_echo green "Configuration directory removed: $CONFIG_DIR"
    else
        colorized_echo yellow "Configuration directory not found: $CONFIG_DIR"
    fi
}

remove_data_files() {
    colorized_echo blue "Removing data files..."
    
    if [ -d "$DATA_DIR" ]; then
        rm -rf "$DATA_DIR"
        colorized_echo green "Data directory removed: $DATA_DIR"
    else
        colorized_echo yellow "Data directory not found: $DATA_DIR"
    fi
    
    if [ -d "$NODE_DATA_DIR" ]; then
        rm -rf "$NODE_DATA_DIR"
        colorized_echo green "Marznode data directory removed: $NODE_DATA_DIR"
    else
        colorized_echo yellow "Marznode data directory not found: $NODE_DATA_DIR"
    fi
}

remove_marzneshin_script() {
    colorized_echo blue "Removing marzneshin script..."
    
    if [ -f "/usr/local/bin/marzneshin" ]; then
        rm -f "/usr/local/bin/marzneshin"
        colorized_echo green "Marzneshin script removed."
    else
        colorized_echo yellow "Marzneshin script not found."
    fi
}

remove_openvpn() {
    echo
    read -p "Do you want to remove OpenVPN? (y/n): " remove_openvpn
    
    if [[ "$remove_openvpn" == "y" || "$remove_openvpn" == "Y" ]]; then
        colorized_echo blue "Removing OpenVPN..."
        
        # Stop OpenVPN service
        systemctl stop openvpn 2>/dev/null || true
        systemctl disable openvpn 2>/dev/null || true
        
        # Remove OpenVPN packages
        if command -v apt-get >/dev/null 2>&1; then
            apt-get remove --purge -y openvpn openvpn-systemd 2>/dev/null || true
        elif command -v yum >/dev/null 2>&1; then
            yum remove -y openvpn 2>/dev/null || true
        fi
        
        # Remove OpenVPN config
        rm -rf /etc/openvpn 2>/dev/null || true
        
        colorized_echo green "OpenVPN removed."
    fi
}

remove_ipsec() {
    echo
    read -p "Do you want to remove IPsec/IKEv2? (y/n): " remove_ipsec
    
    if [[ "$remove_ipsec" == "y" || "$remove_ipsec" == "Y" ]]; then
        colorized_echo blue "Removing IPsec/IKEv2..."
        
        # Stop IPsec service
        systemctl stop ipsec 2>/dev/null || true
        systemctl disable ipsec 2>/dev/null || true
        
        # Remove IPsec packages
        if command -v apt-get >/dev/null 2>&1; then
            apt-get remove --purge -y strongswan xl2tpd 2>/dev/null || true
        elif command -v yum >/dev/null 2>&1; then
            yum remove -y strongswan xl2tpd 2>/dev/null || true
        fi
        
        # Remove IPsec config
        rm -rf /etc/ipsec.d 2>/dev/null || true
        rm -rf /etc/ipsec.conf 2>/dev/null || true
        rm -rf /etc/xl2tpd 2>/dev/null || true
        
        colorized_echo green "IPsec/IKEv2 removed."
    fi
}

cleanup_network() {
    colorized_echo blue "Cleaning up Docker networks..."
    
    # Remove unused networks
    docker network prune -f 2>/dev/null || true
    
    colorized_echo green "Network cleanup complete."
}

show_summary() {
    echo
    colorized_echo green "========================================"
    colorized_echo green "✅ Uninstall Complete!"
    colorized_echo green "========================================"
    echo
    colorized_echo yellow "The following have been removed:"
    echo "  ✓ Marzneshin containers and services"
    echo "  ✓ Marznode containers and services"
    echo "  ✓ Configuration files"
    echo "  ✓ Data files (database, users, etc.)"
    echo "  ✓ Marzneshin CLI script"
    
    if [[ "$remove_images" == "y" || "$remove_images" == "Y" ]]; then
        echo "  ✓ Docker images"
    fi
    
    if [[ "$remove_openvpn" == "y" || "$remove_openvpn" == "Y" ]]; then
        echo "  ✓ OpenVPN"
    fi
    
    if [[ "$remove_ipsec" == "y" || "$remove_ipsec" == "Y" ]]; then
        echo "  ✓ IPsec/IKEv2"
    fi
    
    echo
    colorized_echo cyan "To reinstall Marzneshin, run:"
    echo "  curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/script.sh | bash -s install"
    echo
}

# Main execution
main() {
    check_running_as_root
    show_warning
    stop_services
    remove_containers
    remove_config_files
    remove_data_files
    remove_images
    remove_marzneshin_script
    remove_openvpn
    remove_ipsec
    cleanup_network
    show_summary
}

main
