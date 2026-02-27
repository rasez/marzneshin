/**
 * Monitoring Types
 * Complete type definitions for all monitoring features
 */

// System Statistics
export interface SystemStats {
    version: string;
    total_users: number;
    active_users: number;
    on_hold_users: number;
    expired_users: number;
    limited_users: number;
    online_users: number;
    recent_subscription_updates: string[];
    total_admins: number;
    total_nodes: number;
    healthy_nodes: number;
    unhealthy_nodes: number;
    disabled_nodes?: number;
    active_protocols?: number;
}

// User Statistics
export interface UserStats {
    total: number;
    active: number;
    on_hold: number;
    expired: number;
    limited: number;
    online: number;
    recent_subscription_updates: string[];
}

// Node Statistics
export interface NodeStats {
    total: number;
    healthy: number;
    unhealthy: number;
    disabled: number;
}

// Traffic Usage
export interface UsageSeries {
    timestamp: string;
    usage: number;
}

export interface TrafficStats {
    usages: UsageSeries[];
    total: number;
}

// Node Usage Breakdown
export interface NodeUsageBreakdown {
    node: string;
    node_id: number;
    usage: number;
    uplink: number;
    downlink: number;
}

// User Usage
export interface UserUsage {
    usages: UsageSeries[];
    total: number;
    node_usages: NodeUsageBreakdown[];
}

// Backend Status
export interface BackendStatus {
    running: boolean;
    version?: string;
}

// Backend Info
export interface BackendInfo {
    name: string;
    type: string;
    version: string;
    inbounds: BackendInbound[];
    running: boolean;
}

export interface BackendInbound {
    tag: string;
    protocol: string;
    config: Record<string, any>;
}

// Connection Monitoring
export interface ActiveConnection {
    user_id: number;
    username: string;
    remote_ip: string;
    connected_since: string;
    bytes_received: number;
    bytes_sent: number;
    protocol: string;
}

export interface UserConnections {
    user_id: number;
    username: string;
    connections: ActiveConnection[];
    device_limit: number;
}

// Node Detailed Monitoring
export interface NodeMonitoringData {
    id: number;
    name: string;
    status: 'healthy' | 'unhealthy' | 'disabled';
    version: string;
    uplink: number;
    downlink: number;
    total_traffic: number;
    active_users: number;
    online_users: number;
    backends: BackendInfo[];
    last_status_change: string;
    usage_coefficient: number;
}

// Protocol Monitoring Data
export interface ProtocolMonitoringData {
    protocol: string;
    backend: string;
    status: 'running' | 'stopped';
    version: string;
    active_users: number;
    total_traffic: number;
    uplink: number;
    downlink: number;
    connections: ActiveConnection[];
    system_stats?: SystemResourceStats;
}

// System Resource Stats (Go runtime)
export interface SystemResourceStats {
    num_goroutine: number;
    num_gc: number;
    alloc: number;
    total_alloc: number;
    sys: number;
    mallocs: number;
    frees: number;
    live_objects: number;
    pause_total_ns: number;
    uptime: number;
}

// Log Entry
export interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
    message: string;
    backend?: string;
    node_id?: number;
}

// Dashboard Widget Data
export interface MonitoringDashboardData {
    system_stats: SystemStats;
    traffic_stats: TrafficStats;
    nodes_monitoring: NodeMonitoringData[];
    top_users: UserTrafficRanking[];
    recent_activity: ActivityLog[];
}

export interface UserTrafficRanking {
    user_id: number;
    username: string;
    total_traffic: number;
    online: boolean;
}

export interface ActivityLog {
    timestamp: string;
    event_type: string;
    user?: string;
    node?: string;
    details: string;
}

// Filter Types
export interface MonitoringFilters {
    node_id?: number;
    protocol?: string;
    date_range?: {
        start: string;
        end: string;
    };
    status?: string;
}

// API Response Types
export interface MonitoringApiResponse<T> {
    data: T;
    timestamp: string;
    success: boolean;
}
