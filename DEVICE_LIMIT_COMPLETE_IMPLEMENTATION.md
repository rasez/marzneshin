# Device Limit Feature Implementation

## Overview

This document describes the complete implementation of the device limit feature for Marzneshin/Marznode, which allows administrators to limit the number of simultaneous connections per user across all nodes.

## Components Updated

### 1. Marzneshin (Main Panel)

#### Database Schema
- Added `device_limit` column to the `users` table in the database model
- Default value: -1 (unlimited)

#### Pydantic Models
- Updated `User` model in `app/models/user.py` to include `device_limit` field
- Updated `UserResponse` model to include the field in API responses

#### Database Operations
- Updated `create_user()` function in `app/db/crud.py` to handle device_limit
- Updated `update_user()` function to handle device_limit modifications

#### API Endpoints
- Device limit is now exposed through user creation and modification endpoints
- Works with existing service and user management APIs

### 2. Marznode (Node Component)

#### Protobuf Definitions
- Updated `marznode/service/service.proto` to include `device_limit` field in User message
- Field number: 4, Type: int32

#### Data Models
- Updated `marznode/models/user.py` to include `device_limit` field with default value -1

#### Storage Layer
- Updated `MemoryStorage` to properly preserve device_limit when updating user inbounds

#### Service Layer
- Updated `MarzService` to extract and store device_limit when processing user updates

#### Backend Integration
- Updated all three backends (Xray, Sing-box, Hysteria2) to register device limits with the connection tracker
- Added import and usage of connection tracker in each backend's `add_user` method

#### Connection Tracking
- Created `connection_tracker.py` module to track active connections per user
- Implements device limit enforcement logic
- Provides async methods for connection management

## How It Works

### Configuration Flow
1. Administrator sets device_limit for a user via Marzneshin API
2. Marzneshin sends user configuration (including device_limit) to Marznode via gRPC
3. Marznode receives the configuration and stores the device_limit in its internal storage
4. Marznode registers the limit in the connection tracker

### Connection Enforcement
The current implementation stores and manages device limits, but full enforcement requires deeper integration with the proxy backends to track actual connections. The connection tracker module is in place and ready for integration.

## Required Actions for Full Implementation

### 1. Regenerate Protobuf Files
Run the following command in your development environment:
```bash
cd marznode
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. marznode/service/service.proto
```

### 2. Backend-Specific Connection Tracking
For full device limit enforcement, each proxy backend needs to implement connection tracking:

#### Xray Core Integration
- Hook into inbound handlers to detect new connections
- Use Xray's stats API to monitor connection counts
- Potentially modify xray-core to provide connection events

#### Sing-box Integration  
- Similar approach, hook into inbound handlers
- Use sing-box's stats API if available

#### Hysteria Integration
- Leverage Hysteria 2's built-in connection management
- Use available APIs to track active connections

### 3. Connection Event Handling
Implement the following functions in each backend:

```python
async def on_connection_established(user_id: int, connection_id: str) -> bool:
    # Called when a new connection is established for a user
    success = await connection_tracker.add_connection(user_id, connection_id)
    if not success:
        # Reject the connection by closing it
        pass
    return success

async def on_connection_closed(connection_id: str):
    # Called when a connection is closed
    await connection_tracker.remove_connection(connection_id)
```

## Usage Examples

### Setting Device Limits via API

```bash
# Create user with device limit of 3
curl -X POST http://marzneshin/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "device_limit": 3,
    "data_limit": 1073741824,
    "service_ids": [1]
  }'

# Update existing user's device limit
curl -X PUT http://marzneshin/api/users/testuser \
  -H "Content-Type: application/json" \
  -d '{
    "device_limit": 5
  }'
```

### Device Limit Values
- `-1`: Unlimited devices (default)
- `0`: No devices allowed (effectively disables the user)
- `N` (N > 0): Allow up to N simultaneous connections

## Testing Strategy

1. Create a user with device_limit = 2
2. Establish 2 connections - should succeed
3. Attempt 3rd connection - should be rejected (when full enforcement is implemented)
4. Close one connection
5. Establish new connection - should succeed

## Performance Considerations

- Connection tracking uses efficient data structures (dict/set)
- Async operations to avoid blocking
- Memory usage scales linearly with active connections
- Cleanup mechanisms to prevent memory leaks

## Security Considerations

- Device limits are enforced per user ID, not per credential
- Connection IDs should be unique and secure
- Connection tracking occurs server-side to prevent bypass

## Future Enhancements

- Per-service device limits
- Different limits for different protocols
- Connection timeout and cleanup policies
- Monitoring and alerting for limit violations
- Detailed connection analytics