import asyncio
import time
from collections import defaultdict, deque
from typing import Dict, Set, Optional
from threading import Lock

from app.db import get_user_by_id


class ConnectionTracker:
    """
    Tracks active connections per user across all nodes.
    Maintains a mapping of user_id to set of connection IDs (device identifiers).
    """
    
    def __init__(self, cleanup_interval: int = 300):  # 5 minutes default
        # Dictionary mapping user_id to set of active connection IDs
        self._connections: Dict[int, Set[str]] = defaultdict(set)
        # Dictionary mapping user_id to timestamp of last activity
        self._last_activity: Dict[int, float] = {}
        # Time threshold for considering a connection inactive (in seconds)
        self._activity_timeout = 300  # 5 minutes
        self._lock = Lock()  # Thread-safe operations
        self._cleanup_interval = cleanup_interval
        
        # Start cleanup task
        asyncio.create_task(self._periodic_cleanup())
    
    async def _periodic_cleanup(self):
        """Periodically clean up inactive connections."""
        while True:
            await asyncio.sleep(self._cleanup_interval)
            self._cleanup_inactive_connections()
    
    def _cleanup_inactive_connections(self):
        """Remove connections that have been inactive for too long."""
        current_time = time.time()
        with self._lock:
            inactive_users = []
            
            for user_id, last_activity in self._last_activity.items():
                if current_time - last_activity > self._activity_timeout:
                    inactive_users.append(user_id)
            
            for user_id in inactive_users:
                if user_id in self._last_activity:
                    del self._last_activity[user_id]
                if user_id in self._connections:
                    del self._connections[user_id]
    
    def record_activity(self, user_id: int) -> bool:
        """
        Records activity for a user, enforcing device limits.
        
        Args:
            user_id: ID of the user
            
        Returns:
            True if activity was recorded (within limits), False if limit exceeded
        """
        with self._lock:
            # Check if user exists and get their device limit
            from app.db import GetDB
            with GetDB() as db:
                user = get_user_by_id(db, user_id)
                if not user:
                    return False  # User doesn't exist
                
                device_limit = user.device_limit if user.device_limit is not None else -1
                
                # If limit is -1, it means unlimited
                if device_limit == -1:
                    # Update last activity time
                    self._last_activity[user_id] = time.time()
                    return True
                
                # Count current active connections for this user
                current_connections = len(self._connections[user_id])
                
                # If we're at the limit, reject new activity
                if current_connections >= device_limit and device_limit > 0:
                    return False  # Limit exceeded
                
                # Add a "virtual" connection to track the activity
                # Use a timestamp-based ID to represent the current activity session
                connection_id = f"activity_{time.time()}"
                self._connections[user_id].add(connection_id)
                
                # Update last activity time
                self._last_activity[user_id] = time.time()
                
                return True
    
    def add_connection(self, user_id: int, connection_id: str) -> bool:
        """
        Adds a connection for a user.
        
        Args:
            user_id: ID of the user
            connection_id: Unique identifier for the connection/device
            
        Returns:
            True if connection was added, False if limit exceeded
        """
        with self._lock:
            # Check if user exists and get their device limit
            from app.db import GetDB
            with GetDB() as db:
                user = get_user_by_id(db, user_id)
                if not user:
                    return False  # User doesn't exist
                
                device_limit = user.device_limit if user.device_limit is not None else -1
                
                # If limit is -1, it means unlimited
                if device_limit == -1:
                    # Add the connection
                    self._connections[user_id].add(connection_id)
                    # Update last activity time
                    self._last_activity[user_id] = time.time()
                    return True
                
                # Check if adding this connection would exceed the limit
                current_connections = len(self._connections[user_id])
                
                if current_connections >= device_limit and device_limit > 0:
                    return False  # Limit exceeded
            
            # Add the connection
            self._connections[user_id].add(connection_id)
            # Update last activity time
            self._last_activity[user_id] = time.time()
            return True
    
    def remove_connection(self, user_id: int, connection_id: str) -> bool:
        """
        Removes a connection for a user.
        
        Args:
            user_id: ID of the user
            connection_id: Unique identifier for the connection/device
            
        Returns:
            True if connection was removed, False if not found
        """
        with self._lock:
            if user_id in self._connections and connection_id in self._connections[user_id]:
                self._connections[user_id].discard(connection_id)
                
                # Clean up empty sets to prevent memory leaks
                if not self._connections[user_id]:
                    if user_id in self._connections:
                        del self._connections[user_id]
                    if user_id in self._last_activity:
                        del self._last_activity[user_id]
                    
                return True
            return False
    
    def get_active_connections_count(self, user_id: int) -> int:
        """
        Gets the number of active connections for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Number of active connections
        """
        with self._lock:
            return len(self._connections.get(user_id, set()))
    
    def get_active_connections(self, user_id: int) -> Set[str]:
        """
        Gets the set of active connection IDs for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Set of active connection IDs
        """
        with self._lock:
            return self._connections.get(user_id, set()).copy()
    
    def get_all_connections(self) -> Dict[int, Set[str]]:
        """
        Gets all active connections for all users.
        
        Returns:
            Dictionary mapping user_id to set of active connection IDs
        """
        with self._lock:
            result = {}
            for user_id, connections in self._connections.items():
                result[user_id] = connections.copy()
            return result


# Global connection tracker instance
connection_tracker = ConnectionTracker()