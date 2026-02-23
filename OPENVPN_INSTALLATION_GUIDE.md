# Automatic OpenVPN Installation Guide

## Quick Installation

### Option 1: Install with Marzneshin (Recommended)

Install Marzneshin with OpenVPN support in one command:

```bash
# Download and run installation script
curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/script.sh | bash -s -- --openvpn
```

Or with all options:

```bash
curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/script.sh | bash -s -- --database sqlite --openvpn
```

### Option 2: Install OpenVPN Separately

If Marzneshin is already installed:

```bash
# Download OpenVPN installation script
curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/install-openvpn.sh | bash
```

Then restart Marznode:

```bash
docker restart marzneshin-marznode-1
```

---

## Installation Script Options

### `install-openvpn.sh` Script

The script automatically:
1. ✅ Installs OpenVPN and Easy-RSA
2. ✅ Generates PKI certificates
3. ✅ Creates server configuration
4. ✅ Sets up firewall rules
5. ✅ Configures systemd service
6. ✅ Creates management scripts
7. ✅ Configures Marznode integration

### Manual Usage

```bash
# Install OpenVPN
sudo bash install-openvpn.sh install

# Check status
sudo bash install-openvpn.sh status

# View logs
sudo bash install-openvpn.sh logs

# Uninstall
sudo bash install-openvpn.sh uninstall
```

---

## Configuration

### Environment Variables

You can customize the installation with environment variables:

```bash
OPENVPN_PORT=1194 \
OPENVPN_PROTO=udp \
OPENVPN_NETWORK=10.8.0.0 \
OPENVPN_NETMASK=255.255.255.0 \
sudo bash install-openvpn.sh
```

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENVPN_PORT` | 1194 | Server listening port |
| `OPENVPN_PROTO` | udp | Protocol (udp or tcp) |
| `OPENVPN_NETWORK` | 10.8.0.0 | VPN subnet |
| `OPENVPN_NETMASK` | 255.255.255.0 | Subnet mask |

---

## Post-Installation Steps

### 1. Verify Installation

```bash
# Check OpenVPN status
sudo systemctl status openvpn@server

# Check if status file exists
cat /var/lib/marznode/openvpn/openvpn-status.log

# Check logs
sudo tail -f /var/log/openvpn.log
```

### 2. Configure Marznode

Edit Marznode environment file:

```bash
# For Docker installation
nano /var/lib/marznode/.env

# Add or update:
OPENVPN_ENABLED=true
OPENVPN_EXECUTABLE_PATH=/usr/sbin/openvpn
OPENVPN_CONFIG_PATH=/etc/openvpn/server.conf
OPENVPN_DATA_DIR=/var/lib/marznode/openvpn
```

Restart Marznode:

```bash
# Docker
docker restart marzneshin-marznode-1

# Or standalone
systemctl restart marznode
```

### 3. Add OpenVPN Inbound in Panel

1. Login to Marzneshin panel
2. Go to **Inbounds** → **Add Inbound**
3. Select **Protocol**: OpenVPN
4. Configure:
   ```json
   {
     "tag": "openvpn-server",
     "protocol": "openvpn",
     "config": {
       "network": "udp",
       "port": 1194,
       "address": "your.server.ip"
     }
   }
   ```
5. Save

### 4. Create Users

1. Go to **Users** → **Create User**
2. Assign to OpenVPN inbound
3. Set device limit (optional)
4. Save

### 5. Download Client Config

Users can download their `.ovpn` config:

```
GET /api/subscription/{username}/{key}/openvpn
```

Or from the panel's user page.

---

## Docker Installation

### Using Docker Compose

The `compose.yml` has been updated to support OpenVPN:

```yaml
services:
  marznode:
    image: dawsh/marznode:latest
    environment:
      OPENVPN_ENABLED: "true"
      OPENVPN_EXECUTABLE_PATH: "/usr/sbin/openvpn"
      OPENVPN_CONFIG_PATH: "/etc/openvpn/server.conf"
      OPENVPN_DATA_DIR: "/var/lib/marznode/openvpn"
    volumes:
      - /var/lib/marznode:/var/lib/marznode
      - /etc/openvpn:/etc/openvpn:ro
```

### Build Custom Image with OpenVPN

```bash
cd marznode
docker build -t marznode-openvpn:latest .
```

---

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
sudo ufw allow 1194/udp
sudo ufw allow OpenSSH
sudo ufw enable
```

### Firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=1194/udp
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

### iptables

```bash
sudo iptables -A INPUT -p udp --dport 1194 -j ACCEPT
sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
sudo iptables-save > /etc/iptables/rules.v4
```

---

## Troubleshooting

### OpenVPN Won't Start

```bash
# Check status
sudo systemctl status openvpn@server

# View logs
sudo journalctl -u openvpn@server -f
sudo tail -f /var/log/openvpn.log

# Test configuration
sudo openvpn --config /etc/openvpn/server.conf --test-crypto
```

### Certificate Issues

```bash
# Regenerate PKI
sudo bash install-openvpn.sh uninstall
sudo bash install-openvpn.sh install
```

### Marznode Not Detecting OpenVPN

```bash
# Check Marznode logs
docker logs marzneshin-marznode-1

# Verify OpenVPN is running
sudo systemctl is-active openvpn@server

# Check permissions
ls -la /etc/openvpn/
ls -la /var/lib/marznode/openvpn/
```

### Connection Issues

```bash
# Check if port is open
sudo netstat -tulpn | grep 1194

# Test connectivity
nc -zv your.server.ip 1194

# Check firewall
sudo ufw status
```

---

## File Locations

| File/Directory | Purpose |
|----------------|---------|
| `/etc/openvpn/server.conf` | Server configuration |
| `/etc/openvpn/ca.crt` | CA certificate |
| `/etc/openvpn/server.crt` | Server certificate |
| `/etc/openvpn/server.key` | Server private key |
| `/etc/openvpn/ta.key` | TLS auth key |
| `/var/lib/marznode/openvpn/certs/` | User certificates |
| `/var/lib/marznode/openvpn/configs/` | User configs (.ovpn) |
| `/var/lib/marznode/openvpn/ccd/` | Client-specific configs |
| `/var/lib/marznode/openvpn/openvpn-status.log` | Status file |
| `/var/log/openvpn.log` | Server logs |
| `/var/log/openvpn-connections.log` | Connection tracking |

---

## Security Recommendations

1. **Change Default Port**:
   ```bash
   OPENVPN_PORT=443 sudo bash install-openvpn.sh
   ```

2. **Use TCP for Better Firewall Traversal**:
   ```bash
   OPENVPN_PROTO=tcp sudo bash install-openvpn.sh
   ```

3. **Enable Compression** (if needed):
   Edit `/etc/openvpn/server.conf`:
   ```
   comp-lzo
   ```

4. **Run as Unprivileged User**:
   Uncomment in server.conf:
   ```
   user nobody
   group nogroup
   ```

5. **Regular Certificate Rotation**:
   ```bash
   # Regenerate user certificates every 6 months
   cd /etc/openvpn/easy-rsa
   ./easyrsa build-client-full {username} nopass
   ```

---

## Update Instructions

### Update OpenVPN

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install --only-upgrade openvpn

# CentOS/RHEL
sudo yum update openvpn
```

### Update Marzneshin

```bash
marzneshin update
```

### Update Installation Script

```bash
marzneshin install-script
```

---

## Support

- **Documentation**: See `OPENVPN_IMPLEMENTATION.md`
- **Quick Reference**: See `OPENVPN_QUICK_REFERENCE.md`
- **GitHub Issues**: https://github.com/marzneshin/marzneshin/issues
- **Telegram**: https://t.me/marzneshins

---

## Uninstall

```bash
# Stop services
sudo systemctl stop openvpn@server

# Run uninstall script
sudo bash install-openvpn.sh uninstall

# Remove Marznode OpenVPN config
nano /var/lib/marznode/.env
# Remove OPENVPN_* lines

# Restart Marznode
docker restart marzneshin-marznode-1
```

---

**Installation Date**: February 18, 2026  
**Script Version**: 1.0.0
