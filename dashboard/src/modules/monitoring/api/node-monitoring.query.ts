/**
 * Node Monitoring API
 * Comprehensive node-level monitoring data
 */

import { useQuery } from "@tanstack/react-query";
import { fetch } from "@marzneshin/common/utils";
import type { NodeMonitoringData, TrafficStats, UsageSeries } from "../types/monitoring";
import type { NodeType } from "@marzneshin/modules/nodes";

/**
 * Extended node type with monitoring data
 */
export interface NodeWithMonitoring extends NodeType {
    monitoring: {
        total_traffic: number;
        active_users: number;
        online_users: number;
        uplink_24h: number;
        downlink_24h: number;
    };
}

/**
 * Fetch detailed monitoring data for a specific node
 */
export async function fetchNodeMonitoringData(nodeId: number): Promise<NodeMonitoringData> {
    // Fetch node details
    const node = await fetch(`/nodes/${nodeId}`);
    
    // Fetch node usage
    const usage = await fetch(`/nodes/${nodeId}/usage`, {
        query: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24h
            end: new Date().toISOString(),
        }
    });
    
    // Fetch backend stats for all backends
    const backends = await Promise.all(
        ['xray', 'sing-box', 'hysteria2', 'openvpn', 'ipsec'].map(async (backend) => {
            try {
                const stats = await fetch(`/nodes/${nodeId}/${backend}/stats`);
                return {
                    name: backend,
                    type: backend,
                    version: '',
                    inbounds: [],
                    running: stats.running,
                };
            } catch {
                return null;
            }
        })
    ).then(results => results.filter(Boolean));
    
    return {
        id: node.id,
        name: node.name,
        status: node.status,
        version: node.xray_version || '',
        uplink: node.uplink || 0,
        downlink: node.downlink || 0,
        total_traffic: usage.total || 0,
        active_users: 0, // Would need additional API
        online_users: 0, // Would need additional API
        backends: backends as any[],
        last_status_change: node.last_status_change || '',
        usage_coefficient: node.usage_coefficient || 1.0,
    };
}

/**
 * Hook for node monitoring data
 */
export const useNodeMonitoringQuery = (nodeId: number) => {
    return useQuery({
        queryKey: ['nodes', nodeId, 'monitoring'],
        queryFn: () => fetchNodeMonitoringData(nodeId),
        refetchInterval: 30000, // 30 seconds
        enabled: !!nodeId,
    });
};

/**
 * Fetch node traffic time-series
 */
export async function fetchNodeTraffic(
    nodeId: number,
    start: string,
    end: string
): Promise<TrafficStats> {
    return fetch(`/nodes/${nodeId}/usage`, {
        query: { start, end }
    });
}

/**
 * Hook for node traffic with time range
 */
export const useNodeTrafficQuery = (
    nodeId: number,
    days: number = 7
) => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    return useQuery({
        queryKey: ['nodes', nodeId, 'traffic', days],
        queryFn: () => fetchNodeTraffic(nodeId, start, end),
        refetchInterval: 60000, // 1 minute
        enabled: !!nodeId,
    });
};

/**
 * Fetch all nodes with monitoring summary
 */
export async function fetchNodesWithMonitoring(): Promise<NodeWithMonitoring[]> {
    const nodesResult = await fetch('/nodes', {
        query: { page: 1, size: 100 }
    });
    
    // Fetch usage for each node
    const nodesWithMonitoring = await Promise.all(
        nodesResult.items.map(async (node: NodeType) => {
            try {
                const usage = await fetch(`/nodes/${node.id}/usage`, {
                    query: {
                        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        end: new Date().toISOString(),
                    }
                });
                
                return {
                    ...node,
                    monitoring: {
                        total_traffic: usage.total || 0,
                        active_users: 0,
                        online_users: 0,
                        uplink_24h: usage.usages?.reduce((acc: number, curr: UsageSeries) => acc + curr.usage, 0) || 0,
                        downlink_24h: 0,
                    },
                };
            } catch {
                return {
                    ...node,
                    monitoring: {
                        total_traffic: 0,
                        active_users: 0,
                        online_users: 0,
                        uplink_24h: 0,
                        downlink_24h: 0,
                    },
                };
            }
        })
    );
    
    return nodesWithMonitoring;
}

/**
 * Hook for all nodes with monitoring summary
 */
export const useNodesWithMonitoringQuery = () => {
    return useQuery({
        queryKey: ['nodes', 'monitoring'],
        queryFn: fetchNodesWithMonitoring,
        refetchInterval: 30000, // 30 seconds
    });
};
