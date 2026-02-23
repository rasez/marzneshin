# IPsec/IKEv2/L2TP Implementation Guide

## ✅ Implementation Complete

IPsec/IKEv2 and L2TP/IPsec support has been successfully implemented for both Marzneshin (panel) and Marznode (backend).

---

## 📋 Features

### **IKEv2 (Internet Key Exchange v2)**
- ✅ EAP-MSCHAPv2 authentication (username/password)
- ✅ Certificate-based server authentication
- ✅ AES-256-GCM encryption
- ✅ Perfect Forward Secrecy (PFS)
- ✅ Native support on iOS, macOS, Android, Windows
- ✅ Automatic certificate generation
- ✅ User management (add/remove)
- ✅ Bandwidth tracking
- ✅ Connection monitoring
- ✅ Device limit enforcement

### **L2TP/IPsec (Layer 2 Tunnel Protocol)**
- ✅ PSK (Pre-Shared Key) authentication
- ✅ CHAP credentials for users
- ✅ AES-256 encryption
- ✅ Wide client support (all platforms)
- ✅ Shared secret management
- ✅ User management
- ✅ Bandwidth tracking
- ✅ Connection monitoring

---

## 🚀 Quick Installation

### **Option 1: Install with Marzneshin (Recommended)**

```bash
# Install Marzneshin with IPsec/IKEv2/L2TP
curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/script.sh | bash -s -- --ipsec
```

### **Option 2: Install Separately**

```bash
# Install IPsec/IKEv2/L2TP only
curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/install-ipsec.sh | bash
```

### **Option 3: Install All VPN Protocols**

```bash
# Install with OpenVPN AND IPsec
curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/script.sh | bash -s -- --openvpn --ipsec
```

---

## 📦 What the Installation Script Does

The `install-ipsec.sh` script automatically:

1. ✅ Detects operating system
2. ✅ Installs StrongSwan (IKEv2) and xl2tpd (L2TP)
3. ✅ Generates CA certificate
4. ✅ Generates server certificate
5. ✅ Creates IPsec configuration
6. ✅ Creates L2TP configuration
7. ✅ Sets up firewall rules
8. ✅ Enables IP forwarding
9. ✅ Configures systemd services
10. ✅ Integrates with Marznode

---

## 🔧 Configuration

### **Environment Variables**

```bash
# Enable IPsec
IPSEC_ENABLED=true

# IKEv2 settings
IPSEC_STRONGSWAN_PATH=/usr/sbin/ipsec
IPSEC_CONFIG_DIR=/etc/ipsec.d
IPSEC_DATA_DIR=/var/lib/marznode/ipsec

# L2TP settings
IPSEC_L2TP_ENABLED=true
IPSEC_XL2TPD_PATH=/usr/sbin/xl2tpd
IPSEC_PPP_PATH=/usr/sbin/pppd
L2TP_IPSEC_SHARED_SECRET=your-secret-here

# Network settings
IPSEC_NETWORK=10.10.0.0
IPSEC_NETMASK=255.255.255.0
IPSEC_DNS=8.8.8.8,8.8.4.4
```

### **Custom Installation**

```bash
# Custom network and DNS
IPSEC_NETWORK=10.9.0.0 \
IPSEC_DNS="1.1.1.1,1.0.0.1" \
L2TP_ENABLED=false \
sudo bash install-ipsec.sh
```

---

## 📁 File Locations

| File/Directory | Purpose |
|----------------|---------|
| `/etc/ipsec.d/conf.d/marzneshin.conf` | IPsec config |
| `/etc/ipsec.d/cacerts/ca.crt` | CA certificate |
| `/etc/ipsec.d/certs/server.crt` | Server certificate |
| `/etc/ipsec.d/private/server.key` | Server key |
| `/etc/ipsec.d/ipsec.secrets` | IPsec secrets |
| `/etc/xl2tpd/xl2tpd.conf` | L2TP config |
| `/etc/ppp/chap-secrets` | L2TP credentials |
| `/var/lib/marznode/ipsec/configs/` | User configs |

---

## 🎯 Post-Installation Steps

### **1. Verify Installation**

```bash
# Check StrongSwan status
sudo systemctl status strongswan

# Check L2TP status
sudo systemctl status xl2tpd

# Check IPsec status
sudo ipsec status
```

### **2. Restart Marznode**

```bash
# Docker
docker restart marzneshin-marznode-1

# Or check logs
docker logs -f marzneshin-marznode-1
```

### **3. Add Inbounds in Panel**

**IKEv2 Inbound:**
1. Go to Inbounds → Add Inbound
2. Protocol: IKEv2
3. Tag: `ipsec-ikev2`
4. Config:
   ```json
   {
     "protocol": "ipsec-ikev2",
     "port": 500,
     "network": "udp"
   }
   ```

**L2TP Inbound:**
1. Go to Inbounds → Add Inbound
2. Protocol: L2TP
3. Tag: `ipsec-l2tp`
4. Config:
   ```json
   {
     "protocol": "ipsec-l2tp",
     "port": 1701,
     "network": "udp",
     "shared_secret": "your-secret-here"
   }
   ```

### **4. Create Users**

1. Create user in panel
2. Assign to IKEv2 or L2TP inbound
3. Set device limit
4. Save

### **5. Download Configs**

- **IKEv2**: `/api/subscription/{username}/{key}/ikev2` (Apple .mobileconfig)
- **L2TP**: `/api/subscription/{username}/{key}/l2tp` (text instructions)

---

## 📱 Client Configuration

### **iOS/macOS (IKEv2)**

1. Download `.mobileconfig` from subscription
2. Install profile
3. Go to Settings → General → VPN
4. Connect to IKEv2 VPN

### **Android (IKEv2)**

1. Install **strongSwan VPN Client**
2. Create new VPN connection
3. Server: your.server.ip
4. Username: `{user_id}.{username}`
5. Password: (from panel)

### **Windows (IKEv2)**

```powershell
# PowerShell (Admin)
Add-VpnConnection -Name "Marzneshin IKEv2" `
  -ServerAddress "your.server.ip" `
  -TunnelType IKEv2 `
  -AuthenticationMethod EAP `
  -EncryptionLevel Required `
  -PassThru
```

### **Windows (L2TP)**

1. Settings → Network & Internet → VPN
2. Add VPN connection
3. VPN provider: Windows (built-in)
4. Connection name: Marzneshin L2TP
5. Server name: your.server.ip
6. VPN type: L2TP/IPsec with pre-shared key
7. Pre-shared key: (from panel)
8. Username/Password: (from panel)

### **Linux (IKEv2)**

```bash
# Install strongSwan
sudo apt-get install strongswan libstrongswan-standard-plugins

# Connect
sudo ipsec up ikev2-ikev2
```

---

## 🔒 Security Features

### **IKEv2 Security**
- ✅ AES-256-GCM encryption
- ✅ SHA-256 integrity
- ✅ ECP-256 elliptic curve
- ✅ Perfect Forward Secrecy
- ✅ Certificate-based server auth
- ✅ EAP-MSCHAPv2 user auth

### **L2TP Security**
- ✅ AES-256 encryption
- ✅ SHA-2 integrity
- ✅ Pre-shared key authentication
- ✅ CHAP user authentication

### **Firewall Rules**
```bash
# IKEv2
500/UDP  - IKE key exchange
4500/UDP - NAT traversal

# L2TP
1701/UDP - L2TP traffic
```

---

## 🐛 Troubleshooting

### **StrongSwan Won't Start**

```bash
# Check logs
sudo journalctl -u strongswan -f

# Test config
sudo ipsec verify

# Restart
sudo systemctl restart strongswan
```

### **Certificate Issues**

```bash
# Regenerate certificates
sudo bash install-ipsec.sh uninstall
sudo bash install-ipsec.sh install
```

### **L2TP Connection Fails**

```bash
# Check xl2tpd status
sudo systemctl status xl2tpd

# Check logs
sudo tail -f /var/log/syslog | grep xl2tpd

# Verify shared secret
cat /etc/ipsec.d/ipsec.secrets
```

### **Firewall Blocking**

```bash
# UFW
sudo ufw allow 500/udp
sudo ufw allow 4500/udp
sudo ufw allow 1701/udp

# Firewalld
sudo firewall-cmd --add-port=500/udp --permanent
sudo firewall-cmd --add-port=4500/udp --permanent
sudo firewall-cmd --add-port=1701/udp --permanent
sudo firewall-cmd --reload
```

---

## 📊 Monitoring

### **Active Connections**

```bash
# IKEv2 connections
sudo ipsec status

# All SAs
sudo ipsec statusall

# Real-time monitoring
watch -n 2 'ipsec status'
```

### **Bandwidth Usage**

```bash
# Check Marznode logs
docker logs marzneshin-marznode-1 | grep -i ipsec

# Check user stats in panel
# Users → Select user → Usage statistics
```

---

## 🎓 Advanced Configuration

### **Change IKEv2 Port**

Edit `/etc/ipsec.d/conf.d/marzneshin.conf`:
```
conn ikev2-ikev2
    leftport=8443  # Change from 500 to 8443
```

### **Custom DNS**

Edit `/etc/ipsec.d/conf.d/marzneshin.conf`:
```
rightdns=1.1.1.1,1.0.0.1
```

### **Disable L2TP**

During installation:
```bash
L2TP_ENABLED=false sudo bash install-ipsec.sh
```

Or edit Marznode config:
```bash
IPSEC_L2TP_ENABLED=false
```

---

## 📈 Performance Tuning

### **Optimize for High Load**

Edit `/etc/sysctl.conf`:
```
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.ip_local_port_range = 1024 65535
```

Apply:
```bash
sudo sysctl -p
```

---

## 🔄 Update Instructions

### **Update StrongSwan**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install --only-upgrade strongswan

# CentOS/RHEL
sudo yum update strongswan
```

### **Update Marzneshin**

```bash
marzneshin update
```

---

## 🗑️ Uninstall

```bash
# Stop services
sudo systemctl stop strongswan
sudo systemctl stop xl2tpd

# Uninstall
sudo bash install-ipsec.sh uninstall

# Remove Marznode config
nano /var/lib/marznode/.env
# Remove IPSEC_* lines

# Restart Marznode
docker restart marzneshin-marznode-1
```

---

## 📞 Support

- **Documentation**: See this file
- **Quick Reference**: See `OPENVPN_QUICK_REFERENCE.md`
- **GitHub Issues**: https://github.com/marzneshin/marzneshin/issues
- **Telegram**: https://t.me/marzneshins

---

## 🎉 Summary

You now have **fully automatic IPsec/IKEv2/L2TP installation**!

### **Three Ways to Install:**

1. **One Command**:
   ```bash
   curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/script.sh | bash -s -- --ipsec
   ```

2. **Separate Script**:
   ```bash
   curl -sSL https://raw.githubusercontent.com/rasez/marzneshin/main/install-ipsec.sh | bash
   ```

3. **Manual**:
   ```bash
   wget https://raw.githubusercontent.com/rasez/marzneshin/main/install-ipsec.sh
   chmod +x install-ipsec.sh
   sudo ./install-ipsec.sh
   ```

All methods provide production-ready IPsec/IKEv2/L2TP servers integrated with Marzneshin! 🚀

---

**Implementation Date**: February 18, 2026  
**Status**: ✅ Complete and Production-Ready
