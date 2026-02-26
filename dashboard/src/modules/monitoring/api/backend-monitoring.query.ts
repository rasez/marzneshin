/**
 * Backend Monitoring API
 * Monitor individual backends (Xray, Sing-box, Hysteria2, OpenVPN, IPsec)
 */

import { useQuery } from "@tanstack/react-query";
import { fetch } from "@marzneshin/common/utils";
import type { BackendInfo, BackendStatus, ProtocolMonitoringData } from "../types/monitoring";
import type { NodeType } from "@marzneshin/modules/nodes";

/**
 * Fetch backend running status
 */
export async function fetchBackendStatus(
    nodeId: number,
    backend: string
): Promise<BackendStatus> {
    return fetch(`/nodes/${nodeId}/${backend}/stats`);
}

/**
 * Hook for backend status
 */
export const useBackendStatusQuery = (nodeId: number, backend: string) => {
    return useQuery({
        queryKey: ['nodes', nodeId, backend, 'stats'],
        queryFn: () => fetchBackendStatus(nodeId, backend),
        refetchInterval: 5000, // 5 seconds
        enabled: !!nodeId && !!backend,
    });
};

/**
 * Fetch all backends for a node
 */
export async function fetchNodeBackends(nodeId: number): Promise<BackendInfo[]> {
    return fetch(`/nodes/${nodeId}/backends`);
}

/**
 * Hook for node backends
 */
export const useNodeBackendsQuery = (nodeId: number) => {
    return useQuery({
        queryKey: ['nodes', nodeId, 'backends'],
        queryFn: () => fetchNodeBackends(nodeId),
        refetchInterval: 30000,
        enabled: !!nodeId,
    });
};

/**
 * Fetch protocol-specific monitoring data
 */
export async function fetchProtocolMonitoring(
    nodeId: number,
    protocol: string
): Promise<ProtocolMonitoringData> {
    const backend = protocol === 'ikev2' || protocol === 'l2tp' ? 'ipsec' : 
                    protocol === 'openvpn' ? 'openvpn' :
                    protocol === 'hysteria2' ? 'hysteria2' :
                    protocol === 'sing-box' ? 'sing-box' : 'xray';
    
    const [status, backends] = await Promise.all([
        fetchBackendStatus(nodeId, backend).catch(() => ({ running: false })),
        fetchNodeBackends(nodeId).catch(() => []),
    ]);
    
    const backendInfo = backends.find(b => b.name === backend);
    
    return {
        protocol,
        backend,
        status: status.running ? 'running' : 'stopped',
        version: backendInfo?.version || '',
        active_users: 0,
        total_traffic: 0,
        uplink: 0,
        downlink: 0,
        connections: [],
    };
}

/**
 * Hook for protocol monitoring
 */
export const useProtocolMonitoringQuery = (nodeId: number, protocol: string) => {
    return useQuery({
        queryKey: ['nodes', nodeId, protocol, 'monitoring'],
        queryFn: () => fetchProtocolMonitoring(nodeId, protocol),
        refetchInterval: 10000,
        enabled: !!nodeId && !!protocol,
    });
};

/**
 * Get all protocols for a node
 */
export const getNodeProtocols = (node: NodeType): string[] => {
    const protocols: string[] = [];

    // Check backends to determine available protocols
    node.backends?.forEach((backend: any) => {
        const protocol = backend.name?.toLowerCase();
        if (protocol && !protocols.includes(protocol)) {
            protocols.push(protocol);
        }
    });

    return protocols;
};

/**
 * Protocol display names
 */
export const protocolDisplayNames: Record<string, string> = {
    'vmess': 'V2Ray VMess',
    'vless': 'V2Ray VLESS',
    'trojan': 'Trojan',
    'shadowsocks': 'Shadowsocks',
    'hysteria2': 'Hysteria2',
    'sing-box': 'Sing-Box',
    'xray': 'Xray',
    'openvpn': 'OpenVPN',
    'ikev2': 'IKEv2',
    'l2tp': 'L2TP/IPsec',
    'wireguard': 'WireGuard',
};

/**
 * Protocol status colors
 */
export const protocolStatusColors: Record<string, string> = {
    running: 'bg-green-500',
    stopped: 'bg-red-500',
    unknown: 'bg-gray-500',
};
