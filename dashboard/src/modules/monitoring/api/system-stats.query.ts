/**
 * System Statistics API
 * Fetches overall system monitoring data
 */

import { useQuery } from "@tanstack/react-query";
import { fetch } from "@marzneshin/common/utils";
import type { SystemStats, UserStats, NodeStats } from "../types/monitoring";

/**
 * Fetch complete system statistics
 */
export async function fetchSystemStats(): Promise<SystemStats> {
    return fetch('/system/stats/users').then((result) => result);
}

/**
 * Hook for system statistics
 * Refetches every 10 seconds
 */
export const useSystemStatsQuery = () => {
    return useQuery({
        queryKey: ['system', 'stats'],
        queryFn: fetchSystemStats,
        refetchInterval: 10000, // 10 seconds
        initialData: {
            version: '',
            total_users: 0,
            active_users: 0,
            on_hold_users: 0,
            expired_users: 0,
            limited_users: 0,
            online_users: 0,
            recent_subscription_updates: [],
            total_admins: 0,
            total_nodes: 0,
            healthy_nodes: 0,
            unhealthy_nodes: 0,
        },
    });
};

/**
 * Fetch user statistics only
 */
export async function fetchUserStats(): Promise<UserStats> {
    return fetch('/system/stats/users').then((result) => result);
}

/**
 * Hook for user statistics
 */
export const useUserStatsQuery = () => {
    return useQuery({
        queryKey: ['system', 'stats', 'users'],
        queryFn: fetchUserStats,
        refetchInterval: 10000,
        initialData: {
            total: 0,
            active: 0,
            on_hold: 0,
            expired: 0,
            limited: 0,
            online: 0,
            recent_subscription_updates: [],
        },
    });
};

/**
 * Fetch node statistics only
 */
export async function fetchNodeStats(): Promise<NodeStats> {
    return fetch('/system/stats/nodes').then((result) => result);
}

/**
 * Hook for node statistics
 */
export const useNodeStatsQuery = () => {
    return useQuery({
        queryKey: ['system', 'stats', 'nodes'],
        queryFn: fetchNodeStats,
        refetchInterval: 10000,
        initialData: {
            total: 0,
            healthy: 0,
            unhealthy: 0,
            disabled: 0,
        },
    });
};

/**
 * Fetch admin statistics
 */
export async function fetchAdminStats(): Promise<{ total: number }> {
    return fetch('/system/stats/admins').then((result) => result);
}

/**
 * Hook for admin statistics
 */
export const useAdminStatsQuery = () => {
    return useQuery({
        queryKey: ['system', 'stats', 'admins'],
        queryFn: fetchAdminStats,
        refetchInterval: 10000,
        initialData: { total: 0 },
    });
};
