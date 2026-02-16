# Device Limit Feature Implementation Guide

## Overview
This document describes how to implement device limits in the Marzneshin system. The feature allows administrators to limit the number of simultaneous connections per user across all nodes.

## Current Implementation Status

### Backend (Marzneshin)
- ✅ Database: Added `device_limit` column to `users` table
- ✅ Models: Added `device_limit` field to Pydantic models
- ✅ API: Exposed `device_limit` in user creation/modification endpoints
- ⚠️ Enforcement: Partial - requires marznode integration for full functionality

### Frontend (Marznode)
- ❌ Real-time connection tracking: Not implemented
- ❌ Device limit enforcement: Not implemented

## How Device Limits Work

The `device_limit` field in the user model works as follows:
- `device_limit = -1`: Unlimited devices (default)
- `device_limit = 0`: No devices allowed (effectively disables the user)
- `device_limit = N` (N > 0): Allows up to N simultaneous connections

## Required Changes to Marznode

To fully implement device limits, the marznode component needs the following changes:

### 1. Connection Tracking Module
```go
// Example Go-like pseudocode for marznode connection tracking
type ConnectionTracker struct {
    connections map[string][]ConnectionInfo // userID -> list of connections
    mutex       sync.RWMutex
}

type ConnectionInfo struct {
    ID          string
    IPAddress   string
    ConnectedAt time.Time
    Protocol    string
}

func (ct *ConnectionTracker) AddConnection(userID, connID, ipAddr string) bool {
    ct.mutex.Lock()
    defer ct.mutex.Unlock()
    
    // Get user's device limit from the configuration received from Marzneshin
    user := ct.getUserConfig(userID)
    if user.DeviceLimit != -1 && len(ct.connections[userID]) >= user.DeviceLimit {
        return false // Limit exceeded
    }
    
    // Add the connection
    ct.connections[userID] = append(ct.connections[userID], ConnectionInfo{
        ID:          connID,
        IPAddress:   ipAddr,
        ConnectedAt: time.Now(),
        Protocol:    protocol,
    })
    
    return true
}

func (ct *ConnectionTracker) RemoveConnection(userID, connID string) {
    ct.mutex.Lock()
    defer ct.mutex.Unlock()
    
    conns := ct.connections[userID]
    for i, conn := range conns {
        if conn.ID == connID {
            // Remove this connection
            ct.connections[userID] = append(conns[:i], conns[i+1:]...)
            if len(ct.connections[userID]) == 0 {
                delete(ct.connections, userID)
            }
            return
        }
    }
}
```

### 2. Integration with Xray Core
The connection tracker needs to be integrated with Xray's connection lifecycle:

```go
// When a new connection is established
func OnConnectionEstablished(userID, connID, ipAddr string) {
    if !connectionTracker.AddConnection(userID, connID, ipAddr) {
        // Disconnect the connection if limit is exceeded
        xray.Disconnect(connID)
        return
    }
    
    // Monitor connection and remove when closed
    go func() {
        // Wait for connection to close
        waitForConnectionClose(connID)
        connectionTracker.RemoveConnection(userID, connID)
    }()
}
```

### 3. Protocol-Level Support
Different protocols (VMess, VLESS, Trojan, Shadowsocks) may need specific handling to identify unique connections.

### 4. API Updates
The gRPC API between Marzneshin and marznode needs to be updated to include the device_limit field in user configurations:

```protobuf
message User {
  uint32 id = 1;
  string username = 2;
  string key = 3;
  int32 device_limit = 4;  // Add this field
}
```

## Implementation Steps for Full Feature

1. **Update marznode protobuf definitions** to include device_limit
2. **Modify marznode to track active connections** per user
3. **Implement connection acceptance/rejection logic** based on device limits
4. **Integrate with Xray's connection management** to detect new/terminated connections
5. **Update marznode configuration synchronization** to include device limits
6. **Add monitoring and logging** for connection limit enforcement

## Testing Strategy

1. Create a user with device_limit = 2
2. Attempt to establish 3 simultaneous connections
3. Verify that the 3rd connection is rejected
4. Test that when one connection terminates, a new one can be established
5. Test with device_limit = -1 (unlimited) and device_limit = 0 (disabled)

## Notes

- The current Marzneshin implementation stores device limits correctly
- The feature is ready to be activated once marznode implements connection tracking
- Existing IP limit functionality can serve as a reference for implementing device limits
- Consider performance implications of tracking many connections across multiple nodes