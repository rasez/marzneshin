# OpenVPN Quick Reference

## 🚀 Quick Setup (5 Minutes)

```bash
# 1. Install OpenVPN
sudo apt-get install openvpn easy-rsa

# 2. Setup directories
sudo mkdir -p /etc/openvpn /var/lib/marznode/openvpn/{certs,configs,ccd}

# 3. Enable in Marznode
echo "OPENVPN_ENABLED=true" >> marznode/.env
echo "OPENVPN_EXECUTABLE_PATH=/usr/sbin/openvpn" >> marznode/.env
echo "OPENVPN_CONFIG_PATH=/etc/openvpn/server.conf" >> marznode/.env
echo "OPENVPN_DATA_DIR=/var/lib/marznode/openvpn" >> marznode/.env

# 4. Copy server config
sudo cp marznode/openvpn-server.conf /etc/openvpn/server.conf

# 5. Start services
sudo systemctl start openvpn@server
python marznode/marznode.py
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `/etc/openvpn/server.conf` | Server configuration |
| `/var/lib/marznode/openvpn/configs/` | User configs (.ovpn) |
| `/var/lib/marznode/openvpn/certs/` | User certificates |
| `/var/lib/marznode/openvpn/openvpn-status.log` | Connection status |
| `/var/log/openvpn-connections.log` | Connection tracking |

## 🔧 Common Commands

```bash
# Check OpenVPN status
sudo systemctl status openvpn@server

# View active connections
cat /var/lib/marznode/openvpn/openvpn-status.log

# View Marznode logs
tail -f /var/log/openvpn.log

# Test server config
sudo openvpn --config /etc/openvpn/server.conf --test-crypto

# Restart OpenVPN
sudo systemctl restart openvpn@server
```

## 📊 User Management

### Add User (via Panel)
1. Go to Users → Create User
2. Select OpenVPN inbound
3. Set device limit (optional)
4. Save

### Get User Config
```
GET /api/subscription/{username}/{key}/openvpn
```

### Remove User (via Panel)
1. Go to Users → Select user
2. Click Delete
3. Certificates revoked automatically

## 🔐 PKI Quick Setup

```bash
# Copy Easy-RSA
sudo cp -r /usr/share/easy-rsa /etc/openvpn/easy-rsa
cd /etc/openvpn/easy-rsa

# Initialize
sudo ./easyrsa init-pki
sudo ./easyrsa build-ca

# Server cert
sudo ./easyrsa build-server-full server nopass
sudo ./easyrsa gen-dh

# Copy files
sudo cp pki/ca.crt /etc/openvpn/
sudo cp pki/issued/server.crt /etc/openvpn/
sudo cp pki/private/server.key /etc/openvpn/
sudo cp pki/dh.pem /etc/openvpn/dh2048.pem

# TLS key
sudo openvpn --genkey --secret /etc/openvpn/ta.key
```

## 🐛 Troubleshooting

### Can't Connect
```bash
# Check firewall
sudo ufw allow 1194/udp

# Check routing
sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Bandwidth Not Tracking
```bash
# Fix permissions
sudo chmod 666 /var/log/openvpn-connections.log
sudo chmod +x /var/lib/marznode/openvpn/client-connect.sh
sudo chmod +x /var/lib/marznode/openvpn/client-disconnect.sh
```

### Certificate Errors
```bash
# Regenerate user cert (manual)
cd /etc/openvpn/easy-rsa
sudo ./easyrsa build-client-full {userid.username} nopass
```

## 📈 Monitoring

```bash
# Real-time connections
watch -n 5 'cat /var/lib/marznode/openvpn/openvpn-status.log'

# Bandwidth usage
tail -f /var/log/openvpn-connections.log

# System resources
top -u openvpn
```

## 🔒 Security Checklist

- [ ] Change default port (1194)
- [ ] Use strong cipher (AES-256-GCM)
- [ ] Enable firewall
- [ ] Regular certificate rotation
- [ ] Monitor logs daily
- [ ] Set device limits per user
- [ ] Disable unused protocols

## 📞 Support

- **Docs**: `OPENVPN_IMPLEMENTATION.md`
- **Issues**: GitHub Issues
- **Community**: Telegram @marzneshins
