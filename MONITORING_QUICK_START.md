# 🎯 Monitoring Menu - Quick Start Guide

## 📍 Navigation

### **Sidebar Menu** → **Monitoring**
- **Overview** → `/monitoring`
- **Nodes** → `/monitoring/nodes`

---

## 📊 Pages Overview

### 1. **Monitoring Dashboard** (`/monitoring`)

**What you see:**
- 4 summary cards (Users, Nodes, Traffic, Protocols)
- Users monitoring widget
- Nodes monitoring widget
- Traffic chart (last 7 days)
- Protocols status
- Activity monitor

**Use it for:**
- Quick system overview
- Real-time user status
- Traffic trends
- Protocol health check

---

### 2. **Nodes List** (`/monitoring/nodes`)

**What you see:**
- Filter tabs (All, Healthy, Unhealthy, Disabled)
- 4 status summary cards
- Grid of node cards

**Each node card shows:**
- Status indicator
- Running backends
- Total traffic
- 24h traffic
- Version
- Usage coefficient

**Click any card** → Go to node details

---

### 3. **Node Detail** (`/monitoring/nodes/{nodeId}`)

**What you see:**
- 4 status cards (Status, Total Traffic, Upload, Download)
- 7-day traffic chart
- Protocol detail cards (one per backend)
- Backend logs viewer

**Protocol card shows:**
- Running status (green/gray)
- Version
- Inbounds count
- Inbounds list

**Logs viewer:**
- Select backend tab
- Click "Start Streaming"
- Watch real-time logs
- Toggle auto-scroll

---

## 🔍 Quick Actions

### View Node Status
1. Go to `/monitoring/nodes`
2. Check status color:
   - 🟢 Green = Healthy
   - 🔴 Red = Unhealthy
   - ⚫ Gray = Disabled

### View Protocol Status
1. Go to node detail
2. Scroll to "Protocols & Backends"
3. Check badges:
   - "Running" (green) = Active
   - "Stopped" (gray) = Inactive

### View Traffic
1. Go to dashboard
2. See "Total Traffic" card
3. Or go to node detail for specific node
4. Change time range: 24h, 7d, 30d, 90d

### View Real-time Logs
1. Go to node detail
2. Scroll to "Backend Logs"
3. Select backend tab
4. Click "Start Streaming"
5. Watch logs appear in real-time

### Refresh Data
- Click "Refresh" button (top-right)
- Or wait for auto-refresh (5-30 seconds)

---

## 📈 Key Metrics

### User Metrics
- **Total**: All users
- **Active**: Enabled + not expired
- **Online**: Active in last 30s
- **On Hold**: Start on first use
- **Expired**: Past expire date
- **Limited**: Data limit reached

### Node Metrics
- **Healthy**: Connected and working
- **Unhealthy**: Connection issues
- **Disabled**: Manually disabled
- **Total Traffic**: All-time bandwidth
- **Uplink**: Upload bytes
- **Downlink**: Download bytes

### Protocol Metrics
- **Running**: Backend is active
- **Stopped**: Backend is down
- **Inbounds**: Number of inbounds
- **Version**: Backend version

---

## 🎨 Color Codes

| Color | Meaning |
|-------|---------|
| 🟢 Green | Healthy/Active/Running |
| 🔴 Red | Unhealthy/Error/Stopped |
| 🔵 Blue | Online/Upload |
| 🟡 Yellow | Warning/On Hold |
| ⚫ Gray | Disabled/Unknown |

---

## ⚡ Real-time Updates

| Data | Updates Every |
|------|---------------|
| User stats | 10 seconds |
| Node stats | 30 seconds |
| Backend status | 5 seconds |
| Traffic chart | 60 seconds |
| Logs | Real-time (WebSocket) |

---

## 🔧 Troubleshooting

### Node Shows "Unhealthy"
1. Check if node is online
2. Check Marznode service
3. Check gRPC connection
4. Click "Refresh" button

### Backend Shows "Stopped"
1. Check backend configuration
2. Check if port is available
3. Check logs for errors
4. Restart backend from panel

### Logs Not Appearing
1. Select correct backend tab
2. Click "Start Streaming"
3. Check WebSocket connection
4. Try different backend

### Traffic Shows 0
1. Wait for next update (60s)
2. Check if users are active
3. Check node connection
4. Click "Refresh"

---

## 📱 Mobile View

All pages are responsive:
- Cards stack vertically
- Charts resize automatically
- Menu in bottom bar
- Touch-friendly buttons

---

## 🎯 Pro Tips

1. **Dashboard first** - Start with overview for quick status
2. **Filter nodes** - Use tabs to find issues quickly
3. **Check logs** - Real-time logs for debugging
4. **Compare traffic** - Use different time ranges
5. **Monitor protocols** - Ensure all backends running
6. **Watch online users** - Track active connections

---

## 🚀 Quick Links

| Page | URL |
|------|-----|
| Dashboard | `/monitoring` |
| Nodes List | `/monitoring/nodes` |
| Node 1 Detail | `/monitoring/nodes/1` |

---

## 📞 Support

- **Documentation**: `MONITORING_IMPLEMENTATION_SUMMARY.md`
- **Full Guide**: `COMPLETE_MONITORING_FEATURES.md`
- **API Docs**: Check `modules/monitoring/api/`

---

**Happy Monitoring! 🎉**
