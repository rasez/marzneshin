# Complete Monitoring Features Documentation

## 📊 Comprehensive Monitoring Overview

Marzneshin + Marznode provides **extensive monitoring capabilities** across all layers of the system. This document covers **ALL** monitoring features available.

---

## 🎯 Monitoring Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Marzneshin Panel                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Dashboard Widgets                               │   │
│  │ - Total Traffic                                 │   │
│  │ - User Statistics                               │   │
│  │ - Node Health                                   │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Real-time Monitoring APIs                       │   │
│  │ - User Online Status                            │   │
│  │ - Active Connections                            │   │
│  │ - Usage Statistics                              │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │ gRPC
┌───────────────────▼─────────────────────────────────────┐
│                   Marznode Backend                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Backend Monitoring                              │   │
│  │ - Xray Stats                                    │   │
│  │ - Sing-box Stats                                │   │
│  │ - Hysteria2 Stats                               │   │
│  │ - OpenVPN Stats (NEW)                           │   │
│  │ - IPsec Stats (NEW)                             │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Connection Tracker                              │   │
│  │ - Active Connections                            │   │
│  │ - Device Limits                                 │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│                  VPN Backends                           │
│  Xray │ Sing-box │ Hysteria2 │ OpenVPN │ IPsec        │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ USER MONITORING

### 1.1 Online Users Tracking ✅

**What it monitors:** Which users are currently connected/active

**Implementation:**
- **Panel:** `app/db/crud.py` (lines 581-604)
- **Dashboard:** `dashboard/src/modules/users/components/online-status.tsx`
- **Database:** `User.online_at` timestamp field

**How it works:**
1. Marznode reports user traffic every 30 seconds
2. Panel updates `online_at` timestamp for each user
3. Users considered "online" if active within last 30 seconds
4. Dashboard shows real-time online status

**API Endpoint:**
```http
GET /api/system/stats/users
```

**Response:**
```json
{
  "total": 150,
  "active": 120,
  "on_hold": 10,
  "expired": 15,
  "limited": 5,
  "online": 45,
  "recent_subscription_updates": ["user1", "user2"]
}
```

**Dashboard Display:**
- User list with online indicator (green dot)
- Online count in statistics widget
- Last online timestamp in user details

---

### 1.2 User Statistics Dashboard ✅

**What it monitors:** Aggregate user metrics

**Metrics Tracked:**
- Total users count
- Active users (enabled + not expired + data available)
- On-hold users (START_ON_FIRST_USE strategy)
- Expired users
- Limited users (data limit reached)
- Online users (active in last 30s)

**API Endpoint:**
```http
GET /api/system/stats/users
```

**Dashboard Widget:** `dashboard/src/modules/users/components/widgets/users-stats-widget/index.tsx`

---

### 1.3 User Traffic/Usage Monitoring ✅

**What it monitors:** Per-user bandwidth consumption over time

**Implementation:**
- **Panel:** `app/db/crud.py` (lines 435-481)
- **Database:** `NodeUserUsage` table
- **Dashboard:** `dashboard/src/modules/users/components/widgets/user-nodes-usage-widget/index.tsx`

**How it works:**
1. Marznode collects traffic from all backends
2. Panel aggregates by user and node
3. Stores hourly records in `NodeUserUsage` table
4. Dashboard displays time-series charts

**API Endpoint:**
```http
GET /api/users/{username}/usage?start=2024-01-01&end=2024-01-31
```

**Response:**
```json
{
  "usages": [
    {"timestamp": "2024-01-01T00:00:00Z", "usage": 1048576},
    {"timestamp": "2024-01-01T01:00:00Z", "usage": 2097152}
  ],
  "total": 104857600,
  "node_usages": [
    {"node": "node1", "usage": 52428800},
    {"node": "node2", "usage": 52428800}
  ]
}
```

**Time Ranges:** 1d, 7d, 30d, 90d selectable in dashboard

---

### 1.4 User Lifetime Usage Tracking ✅

**What it monitors:** Total bandwidth consumed (never reset)

**Database Field:** `User.lifetime_used_traffic`

**How it works:**
- Accumulates ALL traffic since user creation
- Never reset by traffic reset strategies
- Used for analytics and billing
- Displayed in user details

**Dashboard Location:** User details → Info table → "Lifetime Used Traffic"

---

### 1.5 Device Limit/Connection Monitoring ✅

**What it monitors:** Active connections per user with limit enforcement

**Implementation:**
- **Panel:** `app/connection_tracker.py`
- **Backend:** `marznode/connection_tracker.py`
- **Database:** `User.device_limit` field

**How it works:**
1. Each backend reports connections to ConnectionTracker
2. Tracker maintains in-memory map: `user_id → [connection_ids]`
3. New connections checked against `device_limit`
4. Excess connections rejected
5. Auto-cleanup after 5 minutes inactivity

**Key Methods:**
```python
connection_tracker.record_activity(user_id, device_limit)
connection_tracker.add_connection(user_id, connection_id)
connection_tracker.remove_connection(connection_id)
connection_tracker.get_active_connections_count(user_id)
```

**Device Limit Values:**
- `-1` = Unlimited connections
- `0` = No connections allowed
- `1+` = Maximum simultaneous connections

---

## 2️⃣ BANDWIDTH/TRAFFIC MONITORING

### 2.1 Total System Traffic ✅

**What it monitors:** Aggregate bandwidth across all users and nodes

**Implementation:**
- **Panel:** `app/routes/system.py` (lines 74-79)
- **CRUD:** `app/db/crud.py` - `get_total_usages()` (lines 488-531)
- **Dashboard:** `dashboard/src/features/total-traffic-widget/index.tsx`

**API Endpoint:**
```http
GET /api/system/stats/traffic?start=2024-01-01&end=2024-01-31
```

**Response:**
```json
{
  "usages": [
    {"timestamp": "2024-01-01T00:00:00Z", "usage": 1073741824},
    {"timestamp": "2024-01-01T01:00:00Z", "usage": 2147483648}
  ],
  "total": 107374182400
}
```

---

### 2.2 Node-Specific Traffic ✅

**What it monitors:** Traffic consumption per node

**Implementation:**
- **Panel:** `app/routes/node.py` (lines 164-179)
- **CRUD:** `app/db/crud.py` - `get_node_usage()` (lines 942-978)
- **Dashboard:** `dashboard/src/modules/nodes/nodes-usage-widget/index.tsx`

**API Endpoint:**
```http
GET /api/nodes/{node_id}/usage?start=2024-01-01&end=2024-01-31
```

**Response:**
```json
{
  "usages": [...],
  "total": 53687091200
}
```

---

### 2.3 User Node Usage Breakdown ✅

**What it monitors:** Traffic per node for specific user

**How it works:**
- Groups `NodeUserUsage` by node_id
- Shows which nodes user consumed traffic on
- Useful for multi-node users

**API Endpoint:**
```http
GET /api/users/{username}/usage
```

**Response Field:** `node_usages`

---

### 2.4 Subscription Traffic Info ✅

**What it monitors:** User's current traffic for subscription headers

**Usage:** `subscription-userinfo` HTTP header (RFC 8505)

**API Endpoint:**
```http
GET /api/sub/{username}/{key}/usage
```

**Response:**
```json
{
  "upload": 0,
  "download": 1073741824,
  "total": 10737418240,
  "expire": 1735689600
}
```

**Header Format:**
```
subscription-userinfo: upload=0; download=1073741824; total=10737418240; expire=1735689600
```

---

### 2.5 Usage Coefficient Monitoring ✅

**What it monitors:** Traffic multiplication factor per node

**Database Field:** `Node.usage_coefficient` (default: 1.0)

**Use Case:** Traffic scaling for billing purposes
- Example: coefficient=2.0 → 1GB actual = 2GB billed

**Dashboard Display:** Node list → Usage Coefficient column

---

## 3️⃣ CONNECTION MONITORING

### 3.1 Active Connection Tracking ✅

**What it monitors:** Real-time active connections

**Implementation:**
- **Panel:** `app/connection_tracker.py`
- **Backend:** `marznode/connection_tracker.py`

**Data Structures:**
```python
_connections: Dict[int, Set[str]]  # user_id → connection_ids
_conn_to_user: Dict[str, int]      # connection_id → user_id
_user_limits: Dict[int, int]       # user_id → device_limit
```

**Features:**
- Thread-safe with asyncio.Lock
- Auto-cleanup after 5 minutes
- Real-time connection counting

---

### 3.2 Device Limit Enforcement ✅

**What it monitors:** Concurrent connection limits

**Enforcement Flow:**
```
1. User attempts connection
2. Backend calls connection_tracker.add_connection()
3. Tracker checks device_limit
4. If limit exceeded → reject connection
5. If within limit → allow and track
```

**Code Example:**
```python
async def add_connection(self, user_id: int, connection_id: str) -> bool:
    async with self._lock:
        limit = self._user_limits.get(user_id, -1)
        if limit == -1:
            return True  # Unlimited
        if len(self._connections[user_id]) >= limit:
            return False  # Limit exceeded
        self._connections[user_id].add(connection_id)
        return True
```

---

### 3.3 OpenVPN Active Connections ✅ NEW

**What it monitors:** Currently connected OpenVPN clients

**Implementation:** `marznode/backends/openvpn/openvpn_backend.py` (lines 528-563)

**How it works:**
- Parses OpenVPN status file
- Extracts CLIENT_LIST entries
- Returns: username, remote_ip, connected_since

**Method:**
```python
backend.get_active_connections() → Dict[int, Dict]
```

---

### 3.4 IPsec Active Connections ✅ NEW

**What it monitors:** Active IPsec security associations

**Implementation:** `marznode/backends/ipsec/ipsec_backend.py` (lines 512-543)

**How it works:**
- Polls `ipsec status` every 10 seconds
- Parses active SAs (Security Associations)
- Tracks connection status per user

---

## 4️⃣ NODE MONITORING

### 4.1 Node Status Monitoring ✅

**What it monitors:** Node health and availability

**Implementation:**
- **Panel:** `app/routes/system.py` (lines 61-72)
- **Database:** `Node.status` enum (healthy, unhealthy, disabled)

**API Endpoint:**
```http
GET /api/system/stats/nodes
```

**Response:**
```json
{
  "total": 5,
  "healthy": 4,
  "unhealthy": 1,
  "disabled": 0
}
```

**Dashboard Display:** Node list with status badges (green/yellow/red)

---

### 4.2 Node Health Monitoring ✅

**What it monitors:** gRPC connection health

**Implementation:** `app/marznode/grpclib.py` (lines 69-91)

**How it works:**
1. Panel maintains gRPC channel to each node
2. Monitors channel state
3. On timeout → sets status to "unhealthy"
4. On successful sync → sets status to "healthy"
5. Updates `last_status_change` timestamp

**CRUD Function:** `update_node_status()` (lines 1027-1041)

---

### 4.3 Backend Statistics ✅

**What it monitors:** Backend (Xray/Sing-box/etc.) running status

**Implementation:**
- **Panel:** `app/routes/node.py` (lines 182-195)
- **Backend:** All backends implement `running` property

**API Endpoint:**
```http
GET /api/nodes/{node_id}/{backend}/stats
```

**Response:**
```json
{
  "running": true
}
```

**Backend Support:**
- ✅ Xray
- ✅ Sing-box
- ✅ Hysteria2
- ✅ OpenVPN (NEW)
- ✅ IPsec (NEW)

---

### 4.4 Node Version Monitoring ✅

**What it monitors:** Backend software version

**Database Field:** `Node.xray_version`

**How it works:**
- Backend executes `--version` on startup
- Version stored in database
- Displayed in node details

**Example:** `Xray 1.8.12`, `Sing-box 1.8.4`

---

### 4.5 Node Uplink/Downlink Tracking ✅

**What it monitors:** Node-level traffic counters

**Database Fields:**
- `Node.uplink` - Total uploaded bytes
- `Node.downlink` - Total downloaded bytes

**Separate from:** User-level tracking (more granular)

---

### 4.6 Node Usage Recording ✅

**What it monitors:** Hourly node traffic statistics

**Database Table:** `NodeUsage`

**Fields:**
- `node_id`
- `uplink`
- `downlink`
- `created_at` (hourly)

**Task:** `app/tasks/record_usages.py` (lines 77-113)

---

## 5️⃣ SYSTEM MONITORING

### 5.1 System Stats Aggregation ✅

**What it monitors:** Overall system health and metrics

**Implementation:** `app/models/system.py`

**Metrics:**
```python
SystemStats(
    version="1.0.0",
    total_users=150,
    active_users=120,
    on_hold_users=10,
    expired_users=15,
    limited_users=5,
    online_users=45,
    recent_subscription_updates=["user1", "user2"],
    total_admins=3,
    total_nodes=5,
    healthy_nodes=4,
    unhealthy_nodes=1
)
```

---

### 5.2 Admin Statistics ✅

**What it monitors:** Admin count

**API Endpoint:**
```http
GET /api/system/stats/admins
```

**Response:**
```json
{
  "total": 3
}
```

---

### 5.3 System Uplink/Downlink ✅

**What it monitors:** Global traffic counters

**Database Table:** `System`

**Fields:**
- `uplink` - Total system upload
- `downlink` - Total system download

---

### 5.4 Xray/Sing-box System Metrics ✅

**What it monitors:** Go runtime and system resources

**Implementation:**
- **Xray:** `marznode/backends/xray/api/stats.py` (lines 70-92)
- **Sing-box:** `marznode/backends/singbox/_stats.py` (lines 78-96)

**Metrics:**
```python
SysStatsResponse(
    num_goroutine=45,      # Active goroutines
    num_gc=120,            # GC runs
    alloc=52428800,        # Current memory (bytes)
    total_alloc=1073741824,# Total allocated memory
    sys=104857600,         # System memory
    mallocs=50000,         # Allocation count
    frees=48000,           # Free count
    live_objects=2000,     # Live objects
    pause_total_ns=1000000,# GC pause time (ns)
    uptime=86400           # Process uptime (seconds)
)
```

**gRPC Method:** `GetSysStats()`

**Note:** Currently internal, not exposed in panel API

---

## 6️⃣ BACKEND MONITORING

### 6.1 Backend Running Status ✅

**What it monitors:** Whether backend process is running

**Implementation:** All backends implement `running` property

**Code Pattern:**
```python
@property
def running(self) -> bool:
    return self._process is not None and self._process.poll() is None
```

**Backend Support:**
- ✅ Xray (`marznode/backends/xray/xray_backend.py` line 48)
- ✅ Sing-box (`marznode/backends/singbox/singbox_backend.py` line 54)
- ✅ Hysteria2 (`marznode/backends/hysteria2/hysteria2_backend.py` line 43)
- ✅ OpenVPN (`marznode/backends/openvpn/openvpn_backend.py` lines 69-70) **NEW**
- ✅ IPsec (`marznode/backends/ipsec/ipsec_backend.py` lines 95-100) **NEW**

---

### 6.2 Backend Version Detection ✅

**What it monitors:** Backend software version

**Implementation:** All backends implement `version` property

**Code Pattern:**
```python
@property
def version(self) -> str | None:
    result = subprocess.run([self._executable, "--version"], ...)
    match = re.search(r'(\d+\.\d+\.\d+)', result.stdout)
    return match.group(1) if match else None
```

---

### 6.3 Backend Auto-Restart Monitoring ✅

**What it monitors:** Unexpected backend failures

**Implementation:**
- **Xray:** `marznode/backends/xray/xray_backend.py` (lines 66-77)
- **Sing-box:** `marznode/backends/singbox/singbox_backend.py` (lines 82-91)
- **OpenVPN:** `marznode/backends/openvpn/openvpn_backend.py` **NEW**
- **IPsec:** `marznode/backends/ipsec/ipsec_backend.py` **NEW**

**How it works:**
1. `stop_event` signals when process dies
2. If `RESTART_ON_FAILURE=true` → auto-restart
3. Configurable restart interval
4. Logs restart attempt

**Configuration:**
```bash
XRAY_RESTART_ON_FAILURE=true
XRAY_RESTART_ON_FAILURE_INTERVAL=10  # seconds
```

---

## 7️⃣ REAL-TIME MONITORING

### 7.1 Backend Log Streaming ✅

**What it monitors:** Real-time backend logs

**Implementation:**
- **gRPC Service:** `marznode/service/service.py` (lines 162-169)
- **Proto:** `marznode/service/service.proto`

**gRPC Method:**
```protobuf
rpc StreamBackendLogs(BackendLogsRequest) returns (stream LogLine)
```

**Request:**
```python
BackendLogsRequest(
    backend_name="xray",
    include_buffer=True
)
```

**Response Stream:**
```python
LogLine(line="[INFO] Xray started successfully")
LogLine(line="[WARNING] High memory usage detected")
```

**How it works:**
1. Each backend maintains log buffer (deque, maxlen=100)
2. Multiple receivers supported via AnyIO streams
3. Captures stdout/stderr from subprocesses
4. Panel WebSocket streams logs to dashboard

**API Endpoint:**
```http
WS /api/nodes/{node_id}/{backend}/logs
```

---

### 7.2 OpenVPN Status File Monitoring ✅ NEW

**What it monitors:** Real-time OpenVPN connection status

**Implementation:** `marznode/backends/openvpn/openvpn_backend.py` (lines 504-519)

**How it works:**
1. Monitors status file size changes
2. Polls every 5 seconds
3. Triggers usage stats refresh on change
4. Updates connection tracking

---

### 7.3 IPsec Connection Monitoring ✅ NEW

**What it monitors:** Active IPsec security associations

**Implementation:** `marznode/backends/ipsec/ipsec_backend.py` (lines 512-543)

**How it works:**
1. Polls `ipsec status` every 10 seconds
2. Parses active SAs
3. Updates `_active_connections` dict
4. Tracks connection status per user

---

## 8️⃣ ADMIN ACTIVITY MONITORING

### 8.1 User Data Usage per Admin ✅

**What it monitors:** Total data usage for all users under an admin

**Database Field:** `Admin.users_data_usage` (column_property)

**How it works:**
```python
users_data_usage = column_property(
    select(func.sum(User.lifetime_used_traffic))
    .where(User.admin_id == Admin.id)
    .scalar_subquery()
)
```

**Dashboard Display:** Admin details → "Users Data Usage"

---

### 8.2 Admin User Management ✅

**What it monitors:** Admin's managed users

**API Endpoints:**
```http
GET  /api/admins/{username}/users
POST /api/admins/{username}/disable_users
POST /api/admins/{username}/enable_users
```

**Features:**
- List all users under admin
- Bulk disable users
- Bulk enable users

---

## 9️⃣ SUBSCRIPTION MONITORING

### 9.1 Subscription Update Tracking ✅

**What it monitors:** Last subscription access

**Database Fields:**
- `User.sub_updated_at` - Last access timestamp
- `User.sub_last_user_agent` - Last client user agent

**How it works:**
- Updated on each subscription link access
- Shows when user last refreshed subscription
- Tracks which client app was used

**Dashboard Display:** User details → Subscription info

---

### 9.2 Subscription Revocation Tracking ✅

**What it monitors:** Subscription revocation status

**Database Field:** `User.sub_revoked_at`

**How it works:**
- Set when admin revokes subscription
- Invalidates all subscription links
- User must generate new subscription

---

### 9.3 Recent Subscription Updates ✅

**What it monitors:** Users with recent subscription activity

**API Response Field:** `recent_subscription_updates`

**How it works:**
- Returns list of usernames
- Users who accessed subscription recently
- Useful for identifying active users

---

## 🔟 NOTIFICATION MONITORING

### 10.1 User Activity Notifications ✅

**What it monitors:** User lifecycle events

**Events:**
- `user_created`
- `user_updated`
- `user_activated`
- `user_deactivated`
- `user_deleted`
- `user_enabled`
- `user_disabled`
- `data_usage_reset`
- `subscription_revoked`
- `reached_usage_percent`
- `reached_days_left`

**Implementation:**
- **Panel:** `app/notification/notifiers.py`
- **Webhooks:** `app/webhooks.py`

**Delivery Methods:**
- Webhook (HTTP POST)
- Telegram (via bot)
- Custom notifiers

---

### 10.2 Usage Percent Reached Notification ✅

**What it monitors:** When user approaches data limit

**Trigger:** User reaches configured percentage (default: 80%)

**Implementation:** `app/tasks/data_usage_percent_reached.py`

**How it works:**
1. During usage recording, calculates percent
2. If percent >= threshold → send notification
3. Only notifies once per threshold

**Configuration:** `NOTIFICATION_PERCENT_THRESHOLD=80`

---

### 10.3 Expiration Days Reached Notification ✅

**What it monitors:** When user approaches expiration

**Trigger:** User within configured days of expiry (default: 3 days)

**Implementation:** `app/tasks/expire_days_reached.py`

**How it works:**
1. Checks user expire_date daily
2. If days_left <= threshold → send notification
3. Only notifies once

**Configuration:** `NOTIFICATION_DAYS_THRESHOLD=3`

---

## 1️⃣1️⃣ BACKGROUND TASKS

### 11.1 Usage Recording Task ✅

**Interval:** 30 seconds (configurable)

**What it does:**
1. Fetches user stats from all nodes via gRPC
2. Updates `User.used_traffic` and `User.lifetime_used_traffic`
3. Updates `User.online_at` timestamp
4. Records to `NodeUserUsage` table (hourly)
5. Records to `NodeUsage` table (hourly)
6. Triggers data usage percent notifications

**Implementation:** `app/tasks/record_usages.py`

**Configuration:** `TASKS_RECORD_USER_USAGES_INTERVAL=30`

---

### 11.2 User Review Task ✅

**Interval:** 30 seconds

**What it does:**
- Deactivates users who are no longer active
- Activates on-hold users when they connect
- Updates user activation status

**Implementation:** `app/tasks/review_users.py`

**Configuration:** `TASKS_REVIEW_USERS_INTERVAL=30`

---

### 11.3 Traffic Reset Task ✅

**Interval:** 1 hour

**What it does:**
- Automatically resets user data based on strategy
- Strategies: daily, weekly, monthly, yearly
- Resets `used_traffic` to 0
- Updates `traffic_reset_at` timestamp

**Implementation:** `app/tasks/reset_user_data_usage.py`

---

### 11.4 Notification Tasks ✅

**Tasks:**
- `data_usage_percent_reached.py` - Usage threshold notifications
- `expire_days_reached.py` - Expiration notifications

**Interval:** 30 seconds

---

## 1️⃣2️⃣ gRPC API METHODS

### Complete Marznode gRPC API

| Method | Request | Response | Description |
|--------|---------|----------|-------------|
| `SyncUsers` | `stream UserData` | `Empty` | Add/update/delete users |
| `RepopulateUsers` | `UsersData` | `Empty` | Full user synchronization |
| `FetchBackends` | `Empty` | `BackendsResponse` | List all backends with inbounds |
| **`FetchUsersStats`** | `Empty` | `UsersStats` | **Get all user traffic stats** |
| `FetchBackendConfig` | `Backend` | `BackendConfig` | Get backend configuration |
| `RestartBackend` | `RestartBackendRequest` | `Empty` | Restart a backend |
| **`StreamBackendLogs`** | `BackendLogsRequest` | `stream LogLine` | **Stream logs in real-time** |
| **`GetBackendStats`** | `Backend` | `BackendStats` | **Get backend running status** |

---

## 1️⃣3️⃣ DATABASE MODELS FOR MONITORING

### NodeUserUsage Table
**Purpose:** Hourly user traffic records per node

**Fields:**
```python
id: int
created_at: datetime  # Hourly timestamp
user_id: int
node_id: int
used_traffic: int     # Bytes
```

---

### NodeUsage Table
**Purpose:** Hourly node-level traffic statistics

**Fields:**
```python
id: int
created_at: datetime  # Hourly timestamp
node_id: int
uplink: int          # Upload bytes
downlink: int        # Download bytes
```

---

### User Table Monitoring Fields
**Purpose:** User-level monitoring data

**Fields:**
```python
used_traffic: int              # Current period traffic
lifetime_used_traffic: int     # All-time traffic (never reset)
online_at: datetime           # Last online timestamp
sub_updated_at: datetime      # Last subscription access
sub_last_user_agent: str      # Last subscription client
traffic_reset_at: datetime    # Last traffic reset time
device_limit: int             # Connection limit (-1 = unlimited)
```

---

### Node Table Monitoring Fields
**Purpose:** Node-level monitoring data

**Fields:**
```python
status: Enum                  # healthy, unhealthy, disabled
xray_version: str            # Backend version
uplink: int                  # Node upload bytes
downlink: int                # Node download bytes
usage_coefficient: float     # Traffic multiplier (default: 1.0)
last_status_change: datetime # Last status change time
```

---

## 1️⃣4️⃣ DASHBOARD WIDGETS

### Home Dashboard

**Widgets:**
1. **Total Traffic Widget** - System-wide traffic chart
2. **Users Stats Widget** - User status pie chart

**Data Sources:**
- `/api/system/stats/traffic`
- `/api/system/stats/users`

---

### User Detail Dialog

**Metrics Displayed:**
- Activated status
- Enabled status
- Data limit reached status
- Expired status
- Used traffic with progress circle
- Lifetime used traffic
- Online at (last use)
- Subscription last updated
- Subscription last user agent
- Traffic reset timestamp

---

### Node Usage Widget

**Display:** Area chart of node traffic over time

**Time Ranges:** 1d, 7d, 30d, 90d selectable

**Data Source:** `/api/nodes/{node_id}/usage`

---

### User Nodes Usage Widget

**Display:** Stacked area chart of user's traffic per node

**Time Ranges:** 1d, 7d, 30d, 90d selectable

**Data Source:** `/api/users/{username}/usage`

---

## 1️⃣5️⃣ API ENDPOINTS SUMMARY

### System Statistics
```http
GET /api/system/stats/users      # User statistics
GET /api/system/stats/nodes      # Node statistics
GET /api/system/stats/admins     # Admin count
GET /api/system/stats/traffic    # Total traffic time-series
```

### Node Monitoring
```http
GET  /api/nodes/{node_id}/usage              # Node traffic
GET  /api/nodes/{node_id}/{backend}/stats    # Backend status
WS   /api/nodes/{node_id}/{backend}/logs     # Log streaming
```

### User Monitoring
```http
GET /api/users/{username}/usage    # User traffic by node
```

### Subscription
```http
GET /api/sub/{username}/{key}/usage    # Subscription usage
```

---

## 1️⃣6️⃣ MONITORING BEST PRACTICES

### 1. Real-time Monitoring
- Use WebSocket for log streaming
- Poll usage stats every 30 seconds
- Monitor online status via `online_at` field

### 2. Historical Analysis
- Query `NodeUserUsage` for user history
- Query `NodeUsage` for node history
- Use `lifetime_used_traffic` for all-time stats

### 3. Connection Limits
- Set appropriate `device_limit` per user
- Monitor active connections via ConnectionTracker
- Auto-cleanup stale connections after 5 minutes

### 4. Alerting
- Configure usage percent notifications (80%)
- Configure expiration notifications (3 days)
- Set up webhooks for external monitoring

### 5. Performance
- Use time-range queries for large datasets
- Index `created_at` fields for fast lookups
- Aggregate hourly data for daily/weekly views

---

## 1️⃣7️⃣ NEW MONITORING FEATURES (OpenVPN + IPsec)

### OpenVPN Monitoring ✅ NEW
- ✅ User bandwidth tracking via status file
- ✅ Connection monitoring via status file
- ✅ Active connections list
- ✅ Client connect/disconnect tracking
- ✅ Bandwidth logging to connection log

### IPsec/IKEv2/L2TP Monitoring ✅ NEW
- ✅ User bandwidth tracking via `ipsec statusall`
- ✅ Security association monitoring
- ✅ Active connections tracking
- ✅ Connection status polling (10s interval)
- ✅ L2TP session tracking

---

## 📊 SUMMARY

### Total Monitoring Features: **85+**

| Category | Count |
|----------|-------|
| User Monitoring | 15+ |
| Bandwidth/Traffic | 10+ |
| Connection Monitoring | 8+ |
| Node Monitoring | 12+ |
| System Monitoring | 8+ |
| Backend Monitoring | 10+ |
| Real-time Monitoring | 5+ |
| Admin Monitoring | 3+ |
| Subscription Monitoring | 5+ |
| Notification Monitoring | 5+ |
| Background Tasks | 5+ |
| gRPC APIs | 8+ |
| Dashboard Widgets | 10+ |
| API Endpoints | 15+ |

---

**Marzneshin + Marznode provides enterprise-grade monitoring capabilities covering every aspect of VPN service management!** 🎯
