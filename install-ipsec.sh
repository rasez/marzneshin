#!/usr/bin/env bash
#
# IPsec/IKEv2/L2TP Installation Script for Marzneshin/Marznode
# Automatically installs and configures StrongSwan (IKEv2) and xl2tpd (L2TP)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
IPSEC_PORT=${IPSEC_PORT:-500}
L2TP_PORT=${L2TP_PORT:-1701}
IPSEC_NETWORK=${IPSEC_NETWORK:-10.10.0.0}
IPSEC_NETMASK=${IPSEC_NETMASK:-255.255.255.0}
IPSEC_DNS=${IPSEC_DNS:-"8.8.8.8,8.8.4.4"}
IPSEC_DATA_DIR="/var/lib/marznode/ipsec"
IPSEC_CONFIG_DIR="/etc/ipsec.d"
L2TP_ENABLED=${L2TP_ENABLED:-true}
L2TP_SHARED_SECRET=${L2TP_SHARED_SECRET:-"marzneshin-l2tp-secret-$(openssl rand -hex 8)"}

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$(id -u)" != "0" ]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    elif [ -f /etc/lsb-release ]; then
        OS=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
    else
        log_error "Cannot detect operating system"
        exit 1
    fi
    
    log_info "Detected OS: $OS"
}

install_package() {
    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y "$1"
            ;;
        centos|almalinux|rocky)
            yum install -y "$1"
            ;;
        fedora)
            dnf install -y "$1"
            ;;
        arch)
            pacman -S --noconfirm "$1"
            ;;
        *)
            log_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac
}

check_ipsec_installed() {
    if command -v ipsec &> /dev/null; then
        log_warning "IPsec/StrongSwan is already installed"
        read -p "Do you want to reinstall? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
}

install_ipsec_packages() {
    log_info "Installing IPsec packages..."
    
    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y strongswan xl2tpd ppp libstrongswan-standard-plugins
            ;;
        centos|almalinux|rocky)
            yum install -y epel-release
            yum install -y strongswan xl2tpd ppp
            ;;
        fedora)
            dnf install -y strongswan xl2tpd ppp
            ;;
        arch)
            pacman -S --noconfirm strongswan xl2tpd ppp
            ;;
        *)
            log_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac
    
    log_success "IPsec packages installed"
}

create_directories() {
    log_info "Creating directories..."
    
    mkdir -p "$IPSEC_DATA_DIR"/{certs,configs,ccd}
    mkdir -p "$IPSEC_CONFIG_DIR"/{cacerts,certs,private,conf.d}
    mkdir -p /etc/ppp
    
    log_success "Directories created"
}

generate_ca_certificate() {
    log_info "Generating CA certificate..."
    
    # Generate CA private key
    openssl genrsa -out "$IPSEC_CONFIG_DIR/private/ca.key" 4096
    
    # Generate CA certificate
    openssl req -new -x509 -days 3650 -key "$IPSEC_CONFIG_DIR/private/ca.key" \
        -out "$IPSEC_CONFIG_DIR/cacerts/ca.crt" \
        -subj "/C=US/ST=State/L=City/O=Marzneshin/CN=Marzneshin CA"
    
    log_success "CA certificate generated"
}

generate_server_certificate() {
    log_info "Generating server certificate..."
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    
    # Generate server private key
    openssl genrsa -out "$IPSEC_CONFIG_DIR/private/server.key" 2048
    
    # Generate server certificate request
    openssl req -new -key "$IPSEC_CONFIG_DIR/private/server.key" \
        -out "$IPSEC_CONFIG_DIR/certs/server.csr" \
        -subj "/C=US/ST=State/L=City/O=Marzneshin/CN=$SERVER_IP"
    
    # Sign server certificate with CA
    openssl x509 -req -days 3650 -in "$IPSEC_CONFIG_DIR/certs/server.csr" \
        -CA "$IPSEC_CONFIG_DIR/cacerts/ca.crt" \
        -CAkey "$IPSEC_CONFIG_DIR/private/ca.key" \
        -CAcreateserial -out "$IPSEC_CONFIG_DIR/certs/server.crt"
    
    # Generate DH parameters (use pre-generated for speed)
    log_info "Using pre-generated DH parameters..."
    if [ ! -f "$IPSEC_CONFIG_DIR/dh2048.pem" ]; then
        openssl dhparam -out "$IPSEC_CONFIG_DIR/dh2048.pem" 2048
    fi
    
    log_success "Server certificate generated"
    echo "Server IP: $SERVER_IP"
}

create_ipsec_config() {
    log_info "Creating IPsec configuration..."
    
    # Main IPsec config
    cat > "$IPSEC_CONFIG_DIR/conf.d/marzneshin.conf" <<EOF
# Marzneshin IPsec/IKEv2 Configuration

conn %default
    keyexchange=ikev2
    dpdaction=clear
    dpddelay=300s
    rekey=no
    left=%any
    leftid=@marzneshin
    leftcert=server.crt
    leftsendcert=always
    leftsubnet=0.0.0.0/0
    rightauth=eap-mschapv2
    rightsourceip=$IPSEC_NETWORK/$IPSEC_NETMASK
    rightdns=$IPSEC_DNS
    rightsendcert=never
    eap_identity=%identity
    ike=aes256gcm16-sha256-ecp256!
    esp=aes256gcm16-ecp256!

conn ikev2-ikev2
    auto=add
    leftauth=pubkey
    rightauth=eap-mschapv2
    right=%any
    eap_identity=%any
EOF

    if [ "$L2TP_ENABLED" = true ]; then
        cat >> "$IPSEC_CONFIG_DIR/conf.d/marzneshin.conf" <<EOF

# L2TP/IPsec PSK
conn l2tp-psk
    auto=add
    leftauth=psk
    leftsubnet=0.0.0.0/0
    rightauth=psk
    rightauth2=xauth
    right=%any
    rightsubnet=0.0.0.0/0
    rightsourceip=$IPSEC_NETWORK/$IPSEC_NETMASK
    keyingtries=0
    rekey=no
    ikelifetime=8h
    lifetime=1h
    ike=aes256-sha2-modp2048!
    esp=aes256-sha2!
    dpdaction=clear
    dpddelay=300s
    reauth=no
EOF
    fi
    
    # IPsec secrets
    cat > "$IPSEC_CONFIG_DIR/ipsec.secrets" <<EOF
# IPsec secrets for Marzneshin

: RSA server.key
: PSK $L2TP_SHARED_SECRET
EOF
    
    chmod 600 "$IPSEC_CONFIG_DIR/ipsec.secrets"
    
    log_success "IPsec configuration created"
}

create_l2tp_config() {
    if [ "$L2TP_ENABLED" != true ]; then
        return
    fi
    
    log_info "Creating L2TP configuration..."
    
    # xl2tpd config
    cat > /etc/xl2tpd/xl2tpd.conf <<EOF
[global]
port = $L2TP_PORT

[lns default]
local ip = ${IPSEC_NETWORK%.*}.1
ip range = ${IPSEC_NETWORK%.*}.100-${IPSEC_NETWORK%.*}.200
require chap = yes
require authentication = yes
ppp debug = yes
pppoptfile = /etc/ppp/options.xl2tpd
length bit = yes
EOF
    
    # PPP options
    cat > /etc/ppp/options.xl2tpd <<EOF
require-mschap-v2
ms-dns 8.8.8.8
ms-dns 8.8.4.4
auth
hide-password
idle 1800
mtu 1280
mru 1280
nodefaultroute
debug
proxyarp
connect-delay 5000
EOF
    
    # CHAP secrets
    cat > /etc/ppp/chap-secrets <<EOF
# CHAP secrets for L2TP
# client        server  secret                  IP addresses
EOF
    
    chmod 600 /etc/ppp/chap-secrets
    
    log_success "L2TP configuration created"
}

setup_firewall() {
    log_info "Configuring firewall..."
    
    # Enable IP forwarding
    if ! grep -q "net.ipv4.ip_forward=1" /etc/sysctl.conf; then
        echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
        echo "net.ipv4.conf.all.accept_redirects = 0" >> /etc/sysctl.conf
        echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
        sysctl -p
    fi
    
    # Update sysctl for IPsec
    cat >> /etc/sysctl.conf <<EOF
net.ipv4.conf.all.rp_filter = 2
net.ipv4.conf.default.rp_filter = 2
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
EOF
    sysctl -p
    
    # Configure firewall
    if command -v ufw &> /dev/null; then
        ufw allow 500/udp
        ufw allow 4500/udp
        if [ "$L2TP_ENABLED" = true ]; then
            ufw allow 1701/udp
        fi
        ufw allow OpenSSH
        log_success "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=500/udp
        firewall-cmd --permanent --add-port=4500/udp
        if [ "$L2TP_ENABLED" = true ]; then
            firewall-cmd --permanent --add-port=1701/udp
        fi
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --reload
        log_success "Firewalld configured"
    elif command -v iptables &> /dev/null; then
        iptables -A INPUT -p udp --dport 500 -j ACCEPT
        iptables -A INPUT -p udp --dport 4500 -j ACCEPT
        if [ "$L2TP_ENABLED" = true ]; then
            iptables -A INPUT -p udp --dport 1701 -j ACCEPT
        fi
        iptables -t nat -A POSTROUTING -s $IPSEC_NETWORK/$IPSEC_NETMASK -o eth0 -j MASQUERADE
        log_success "iptables configured"
    else
        log_warning "No firewall detected, manual configuration may be needed"
    fi
}

setup_systemd() {
    log_info "Setting up systemd services..."
    
    # Enable StrongSwan
    systemctl enable strongswan
    systemctl start strongswan
    
    # Enable L2TP if configured
    if [ "$L2TP_ENABLED" = true ]; then
        systemctl enable xl2tpd
        systemctl start xl2tpd
    fi
    
    log_success "Systemd services configured"
}

configure_marznode() {
    log_info "Configuring Marznode for IPsec..."
    
    MARZNODE_ENV_FILE="/var/lib/marznode/.env"
    
    # Create or update Marznode .env file
    if [ ! -f "$MARZNODE_ENV_FILE" ]; then
        mkdir -p "$(dirname "$MARZNODE_ENV_FILE")"
        touch "$MARZNODE_ENV_FILE"
    fi
    
    # Add IPsec configuration if not present
    if ! grep -q "IPSEC_ENABLED" "$MARZNODE_ENV_FILE"; then
        cat >> "$MARZNODE_ENV_FILE" <<EOF

# IPsec/IKEv2/L2TP Configuration (added by install-ipsec.sh)
IPSEC_ENABLED=true
IPSEC_STRONGSWAN_PATH=/usr/sbin/ipsec
IPSEC_CONFIG_DIR=/etc/ipsec.d
IPSEC_DATA_DIR=/var/lib/marznode/ipsec
IPSEC_L2TP_ENABLED=$L2TP_ENABLED
IPSEC_XL2TPD_PATH=/usr/sbin/xl2tpd
IPSEC_PPP_PATH=/usr/sbin/pppd
L2TP_IPSEC_SHARED_SECRET=$L2TP_SHARED_SECRET
EOF
        log_success "Marznode environment configured"
    else
        log_warning "Marznode already has IPsec configuration"
    fi
}

verify_installation() {
    log_info "Verifying installation..."
    
    # Check if StrongSwan is running
    if systemctl is-active --quiet strongswan; then
        log_success "StrongSwan service is running"
    else
        log_warning "StrongSwan service is not running"
        log_info "Starting StrongSwan service..."
        systemctl start strongswan
    fi
    
    # Check L2TP if enabled
    if [ "$L2TP_ENABLED" = true ]; then
        if systemctl is-active --quiet xl2tpd; then
            log_success "L2TP service is running"
        else
            log_warning "L2TP service is not running"
            systemctl start xl2tpd
        fi
    fi
    
    # Show server info
    echo ""
    log_success "IPsec/IKEv2/L2TP installation complete!"
    echo ""
    echo "Server Configuration:"
    echo "  IKEv2 Port: 500/UDP, 4500/UDP"
    if [ "$L2TP_ENABLED" = true ]; then
        echo "  L2TP Port: 1701/UDP"
        echo "  L2TP Shared Secret: $L2TP_SHARED_SECRET"
    fi
    echo "  VPN Network: $IPSEC_NETWORK/$IPSEC_NETMASK"
    echo "  DNS: $IPSEC_DNS"
    echo ""
    echo "Important Files:"
    echo "  IPsec Config: $IPSEC_CONFIG_DIR/conf.d/marzneshin.conf"
    echo "  CA Certificate: $IPSEC_CONFIG_DIR/cacerts/ca.crt"
    echo "  Server Certificate: $IPSEC_CONFIG_DIR/certs/server.crt"
    echo ""
    echo "Next Steps:"
    echo "  1. Restart Marznode to enable IPsec backend"
    echo "  2. Add IKEv2/L2TP inbounds in Marzneshin panel"
    echo "  3. Create users and download configs"
    echo ""
}

# Main installation function
main() {
    echo "=========================================="
    echo "  IPsec/IKEv2/L2TP Installation for Marzneshin"
    echo "=========================================="
    echo ""
    
    check_root
    detect_os
    check_ipsec_installed
    install_ipsec_packages
    create_directories
    generate_ca_certificate
    generate_server_certificate
    create_ipsec_config
    create_l2tp_config
    setup_firewall
    setup_systemd
    configure_marznode
    verify_installation
    
    log_success "Installation completed successfully!"
}

# Parse command line arguments
case "${1:-install}" in
    install)
        main
        ;;
    uninstall)
        log_info "Uninstalling IPsec..."
        systemctl stop strongswan || true
        systemctl stop xl2tpd || true
        systemctl disable strongswan || true
        systemctl disable xl2tpd || true
        rm -rf "$IPSEC_CONFIG_DIR"
        rm -rf "$IPSEC_DATA_DIR"
        apt-get remove --purge -y strongswan xl2tpd ppp 2>/dev/null || yum remove -y strongswan xl2tpd ppp 2>/dev/null || true
        log_success "IPsec uninstalled"
        ;;
    status)
        systemctl status strongswan
        if [ "$L2TP_ENABLED" = true ]; then
            systemctl status xl2tpd
        fi
        ;;
    logs)
        journalctl -u strongswan -f
        ;;
    *)
        echo "Usage: $0 {install|uninstall|status|logs}"
        exit 1
        ;;
esac
