# OpenVPN Implementation Guide for Marzneshin

This document provides comprehensive instructions for setting up and using OpenVPN with Marzneshin.

## Overview

OpenVPN support has been added to both Marzneshin (panel) and Marznode (backend). The implementation includes:

- ✅ **User Management**: Automatic creation/removal of OpenVPN users
- ✅ **Bandwidth Tracking**: Per-user traffic monitoring
- ✅ **Connection Monitoring**: Real-time connection tracking
- ✅ **Device Limits**: Enforce simultaneous connection limits per user
- ✅ **Automatic Config Generation**: Client configuration files (.ovpn)

## Architecture

```
┌─────────────────┐
│  Marzneshin     │  ← Panel: User management, UI, API
│     Panel       │
└────────┬────────┘
         │ gRPC
┌────────▼────────┐
│   Marznode      │  ← Backend: OpenVPN server management
│   (OpenVPN)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  OpenVPN        │  ← VPN Server: Actual VPN connections
│   Server        │
└─────────────────┘
```

## Prerequisites

1. **OpenVPN Installation**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install openvpn easy-rsa

   # CentOS/RHEL
   sudo yum install openvpn easy-rsa
   ```

2. **Directory Structure**:
   ```bash
   sudo mkdir -p /etc/openvpn
   sudo mkdir -p /var/lib/marznode/openvpn/{certs,configs,ccd}
   sudo mkdir -p /var/log
   sudo touch /var/log/openvpn.log
   sudo touch /var/log/openvpn-connections.log
   ```

## Setup Guide

### Step 1: Generate PKI (Public Key Infrastructure)

OpenVPN requires certificates for secure communication. Use Easy-RSA:

```bash
# Copy Easy-RSA to OpenVPN directory
sudo cp -r /usr/share/easy-rsa /etc/openvpn/easy-rsa
cd /etc/openvpn/easy-rsa

# Initialize PKI
sudo ./easyrsa init-pki

# Build Certificate Authority (CA)
sudo ./easyrsa build-ca

# Generate server certificate
sudo ./easyrsa build-server-full server nopass

# Generate Diffie-Hellman parameters (may take several minutes)
sudo ./easyrsa gen-dh

# Copy certificates to OpenVPN directory
sudo cp pki/ca.crt /etc/openvpn/
sudo cp pki/issued/server.crt /etc/openvpn/
sudo cp pki/private/server.key /etc/openvpn/
sudo cp pki/dh.pem /etc/openvpn/dh2048.pem

# Generate TLS auth key
sudo openvpn --genkey --secret /etc/openvpn/ta.key
```

### Step 2: Configure OpenVPN Server

Use the provided template:

```bash
sudo cp /path/to/marznode/openvpn-server.conf /etc/openvpn/server.conf
sudo nano /etc/openvpn/server.conf  # Adjust settings as needed
```

**Important Settings**:
- `port`: OpenVPN listening port (default: 1194)
- `proto`: Protocol (udp or tcp)
- `server`: VPN subnet (default: 10.8.0.0/24)

### Step 3: Configure Marznode

Edit Marznode environment variables:

```bash
# In marznode/.env or docker-compose
OPENVPN_ENABLED=true
OPENVPN_EXECUTABLE_PATH=/usr/sbin/openvpn
OPENVPN_CONFIG_PATH=/etc/openvpn/server.conf
OPENVPN_DATA_DIR=/var/lib/marznode/openvpn
```

### Step 4: Start OpenVPN Server

```bash
# Start OpenVPN
sudo systemctl start openvpn@server

# Enable on boot
sudo systemctl enable openvpn@server

# Check status
sudo systemctl status openvpn@server
```

### Step 5: Start Marznode

```bash
cd marznode
python marznode.py
```

### Step 6: Add OpenVPN Inbound in Marzneshin Panel

1. Login to Marzneshin panel
2. Go to **Inbounds** → **Add Inbound**
3. Select **Protocol**: OpenVPN
4. Configure:
   - **Tag**: `openvpn-server`
   - **Config**: JSON with server details
   ```json
   {
     "protocol": "openvpn",
     "network": "udp",
     "port": 1194,
     "address": "your.server.ip"
   }
   ```
5. Save

### Step 7: Create Users

1. Go to **Users** → **Create User**
2. Fill in user details
3. Assign to OpenVPN inbound
4. Set device limit (optional)
5. Save

User's OpenVPN config will be automatically generated and available via:
- Subscription link: `http://panel/username/key/openvpn`
- Direct download from panel

## Features

### 1. User Management

**Add User**:
- Automatically generates certificates
- Creates client configuration (.ovpn)
- Stores in `/var/lib/marznode/openvpn/configs/`

**Remove User**:
- Revokes certificates
- Removes configuration files
- Clears connection tracking

### 2. Bandwidth Tracking

Bandwidth is tracked via:
- OpenVPN status file (`openvpn-status.log`)
- Connection log (`/var/log/openvpn-connections.log`)
- Client connect/disconnect scripts

Usage is reported to Marzneshin panel for:
- Data limit enforcement
- Statistics dashboard
- User usage reports

### 3. Connection Monitoring

Active connections are tracked in real-time:
- Connection time
- Remote IP address
- Bandwidth per session

**View Active Connections**:
```bash
# Via Marzneshin API
curl http://panel/api/nodes/{node_id}/connections

# Via OpenVPN status file
cat /var/lib/marznode/openvpn/openvpn-status.log
```

### 4. Device Limits

Device limits are enforced per user:
- Set in user creation/edit
- Tracked by connection tracker
- New connections rejected if limit exceeded

**Example**: User with device_limit=2 can only have 2 simultaneous connections.

## Configuration Files

### Server Configuration (`/etc/openvpn/server.conf`)

```conf
port 1194
proto udp
dev tun

ca /etc/openvpn/ca.crt
cert /etc/openvpn/server.crt
key /etc/openvpn/server.key
dh /etc/openvpn/dh2048.pem

server 10.8.0.0 255.255.255.0
topology subnet

client-config-dir /var/lib/marznode/openvpn/ccd

status /var/lib/marznode/openvpn/openvpn-status.log
log-append /var/log/openvpn.log

cipher AES-256-GCM
auth SHA256
```

### Client Configuration (Auto-generated)

```conf
client
dev tun
proto udp
remote your.server.ip 1194
resolv-retry infinite
nobind

cipher AES-256-GCM
auth SHA256

<ca>
-----BEGIN CERTIFICATE-----
...
</ca>

<cert>
-----BEGIN CERTIFICATE-----
...
</cert>

<key>
-----BEGIN PRIVATE KEY-----
...
</key>
```

## Troubleshooting

### OpenVPN Won't Start

```bash
# Check logs
sudo journalctl -u openvpn@server -f
sudo tail -f /var/log/openvpn.log

# Test config
sudo openvpn --config /etc/openvpn/server.conf --test-crypto
```

### Users Can't Connect

1. **Check certificates**:
   ```bash
   ls -la /var/lib/marznode/openvpn/certs/
   ```

2. **Verify firewall**:
   ```bash
   sudo ufw allow 1194/udp
   sudo iptables -L -n | grep 1194
   ```

3. **Check routing**:
   ```bash
   sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
   ```

### Bandwidth Not Tracking

1. **Verify scripts are executable**:
   ```bash
   chmod +x /var/lib/marznode/openvpn/client-connect.sh
   chmod +x /var/lib/marznode/openvpn/client-disconnect.sh
   ```

2. **Check log permissions**:
   ```bash
   sudo chmod 666 /var/log/openvpn-connections.log
   ```

3. **Test connection logging**:
   ```bash
   tail -f /var/log/openvpn-connections.log
   ```

## API Endpoints

### Get User Subscription (OpenVPN format)

```bash
GET /api/subscription/{username}/{key}/openvpn
```

Returns `.ovpn` configuration file.

### Get Node Statistics

```bash
GET /api/nodes/{node_id}/usage
```

Returns bandwidth usage including OpenVPN users.

## Security Considerations

1. **Use Strong Encryption**:
   - AES-256-GCM (recommended)
   - SHA256 for authentication

2. **Regular Key Rotation**:
   - Regenerate DH parameters annually
   - Rotate server certificates periodically

3. **Firewall Rules**:
   ```bash
   # Allow OpenVPN port
   sudo ufw allow 1194/udp
   
   # Enable IP forwarding
   echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

4. **Log Monitoring**:
   ```bash
   # Monitor connections
   watch -n 5 'cat /var/lib/marznode/openvpn/openvpn-status.log'
   ```

## Performance Tuning

For high-load scenarios:

```conf
# In server.conf
max-clients 1000
sndbuf 393216
rcvbuf 393216
push "sndbuf 393216"
push "rcvbuf 393216"

# Use UDP for better performance
proto udp

# Hardware acceleration (if available)
engine auto
```

## Migration from Other Panels

If migrating from other OpenVPN panels:

1. Export user list
2. Import to Marzneshin
3. Regenerate certificates for all users
4. Distribute new configs

## Support

For issues or questions:
- GitHub Issues: https://github.com/marzneshin/marzneshin/issues
- Telegram: https://t.me/marzneshins

## Future Enhancements

Planned improvements:
- [ ] Web-based certificate management
- [ ] One-click certificate renewal
- [ ] Advanced routing rules
- [ ] Multi-hop OpenVPN chains
- [ ] Compression options in UI
