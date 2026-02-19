/**
 * Connection Monitoring API
 * Track active connections and device limits
 */

import { useQuery } from "@tanstack/react-query";
import { fetch } from "@marzneshin/common/utils";
import type { ActiveConnection, UserConnections } from "../types/monitoring";

/**
 * Fetch active connections for a user
 */
export async function fetchUserConnections(userId: number): Promise<UserConnections> {
    // This would need a new API endpoint
    // For now, return placeholder
    return {
        user_id: userId,
        username: '',
        connections: [],
        device_limit: -1,
    };
}

/**
 * Hook for user connections
 */
export const useUserConnectionsQuery = (userId: number) => {
    return useQuery({
        queryKey: ['users', userId, 'connections'],
        queryFn: () => fetchUserConnections(userId),
        refetchInterval: 5000,
        enabled: !!userId,
    });
};

/**
 * Fetch all active connections (global)
 * This would need a new API endpoint
 */
export async function fetchAllActiveConnections(): Promise<ActiveConnection[]> {
    // Placeholder - would need backend implementation
    return [];
}

/**
 * Hook for all active connections
 */
export const useAllConnectionsQuery = () => {
    return useQuery({
        queryKey: ['connections', 'all'],
        queryFn: fetchAllActiveConnections,
        refetchInterval: 5000,
    });
};

/**
 * Format bytes to human-readable
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format connection duration
 */
export const formatDuration = (since: string): string => {
    const start = new Date(since).getTime();
    const now = Date.now();
    const diff = now - start;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

/**
 * Connection status indicator
 */
export const ConnectionStatus = ({ online }: { online: boolean }) => {
    return (
        <span className={`inline-block w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
    );
};
